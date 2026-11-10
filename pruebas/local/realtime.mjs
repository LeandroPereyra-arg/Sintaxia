/**
 * Imitacion local de Supabase Realtime (solo Postgres Changes), para probar la
 * pantalla del ranking sin el servidor real, que no se puede levantar aca.
 *
 * Habla el mismo protocolo que usa @supabase/realtime-js (Phoenix, version
 * 2.0.0: cada mensaje es un arreglo JSON [join_ref, ref, topic, event, payload]):
 *
 *   cliente -> phx_join con config.postgres_changes  -> phx_reply con un id por filtro
 *   cliente -> heartbeat (topic "phoenix")            -> phx_reply ok
 *   servidor -> postgres_changes { ids, data }        cuando cambia una fila
 *
 * Lo que respeta de Supabase, porque es lo que se quiere probar:
 *   · Solo avisa cambios de tablas que estan en la publicacion supabase_realtime
 *     (los avisos salen de un disparador que pruebas/local/realtime-local.sql
 *     pone unicamente en esas tablas). Suscribirse a una tabla que no esta
 *     publicada devuelve un error de sistema, como Supabase.
 *   · Antes de mandar un INSERT o UPDATE verifica, con el rol y los claims del
 *     token de quien se suscribio, que PUEDE LEER esa fila (RLS). Los DELETE
 *     llegan solo con la clave primaria, sin control de RLS (igual que Supabase).
 *   · Filtros simples "columna=eq.valor".
 *
 * Lo que NO imita: Broadcast, Presence, replicacion logica real, filtros
 * complejos. La prueba lo dice en su registro.
 */
import { WebSocketServer } from 'ws'
import pg from 'pg'

export function iniciarRealtime({ servidor, pool, conexionListen, contextoDeToken }) {
  const wss = new WebSocketServer({ noServer: true })
  const conexiones = new Set()
  let cortadoHasta = 0
  let siguienteId = 1

  const esquemaCache = new Map() // "schema.table" -> { columnas: [{name,type}], pk: [col] }

  async function esquemaDe(schema, table) {
    const clave = `${schema}.${table}`
    if (esquemaCache.has(clave)) return esquemaCache.get(clave)
    const columnas = await pool.query(
      `select column_name as name, udt_name as type from information_schema.columns
        where table_schema = $1 and table_name = $2 order by ordinal_position`, [schema, table])
    const pk = await pool.query(
      `select a.attname as col from pg_index i
         join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
        where i.indrelid = format('%I.%I', $1::text, $2::text)::regclass and i.indisprimary`, [schema, table])
    const info = { columnas: columnas.rows, pk: pk.rows.map((r) => r.col) }
    esquemaCache.set(clave, info)
    return info
  }

  async function publicada(schema, table) {
    const r = await pool.query(
      `select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = $1 and tablename = $2`,
      [schema, table])
    return r.rowCount > 0
  }

  /** La persona del token puede leer esta fila? (RLS, como hace Realtime). */
  async function puedeLeer(contexto, schema, table, registro) {
    const { pk } = await esquemaDe(schema, table)
    if (pk.length === 0) return false
    const where = pk.map((c, i) => `${pg.escapeIdentifier(c)} = $${i + 1}`).join(' and ')
    const cliente = await pool.connect()
    try {
      await cliente.query('begin')
      await cliente.query(`set local role ${contexto.rol}`)
      await cliente.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(contexto.claims)])
      const r = await cliente.query(
        `select 1 from ${pg.escapeIdentifier(schema)}.${pg.escapeIdentifier(table)} where ${where}`,
        pk.map((c) => registro[c]))
      await cliente.query('commit')
      return r.rowCount > 0
    } catch {
      await cliente.query('rollback').catch(() => {})
      return false
    } finally {
      cliente.release()
    }
  }

  function cumpleFiltro(filtro, registro) {
    if (!filtro) return true
    const m = /^([a-z_][a-z0-9_]*)=eq\.(.*)$/.exec(filtro)
    if (!m) return false
    return String(registro?.[m[1]] ?? '') === m[2]
  }

  function enviar(ws, mensaje) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(mensaje))
  }

  // --- Avisos de la base -----------------------------------------------------
  // Si se cae la conexion (por ejemplo, porque las pruebas recrean la base), se
  // vuelve a conectar sola.
  let oyente = null
  let apagando = false
  async function conectarOyente() {
    oyente = new pg.Client(conexionListen)
    oyente.on('error', () => {})
    oyente.on('end', () => {
      esquemaCache.clear()
      if (!apagando) setTimeout(() => conectarOyente().catch(() => {}), 1000)
    })
    oyente.on('notification', alAvisar)
    await oyente.connect()
    await oyente.query('listen realtime_local')
  }

  async function alAvisar(aviso) {
    let cambio
    try {
      cambio = JSON.parse(aviso.payload)
    } catch {
      return
    }
    const { columnas, pk } = await esquemaDe(cambio.schema, cambio.table)
    const registro = cambio.record ?? {}
    // DELETE: solo la clave primaria, como Supabase con la identidad de replica por defecto.
    const anterior = cambio.old_record
      ? cambio.type === 'DELETE'
        ? Object.fromEntries(pk.map((c) => [c, cambio.old_record[c]]))
        : cambio.old_record
      : {}

    for (const conexion of conexiones) {
      for (const [topic, canal] of conexion.canales) {
        const ids = canal.filtros
          .filter((f) =>
            (f.schema === '*' || f.schema === cambio.schema) &&
            (!f.table || f.table === '*' || f.table === cambio.table) &&
            (f.event === '*' || f.event === cambio.type) &&
            cumpleFiltro(f.filter, cambio.type === 'DELETE' ? cambio.old_record : registro))
          .map((f) => f.id)
        if (ids.length === 0) continue
        if (cambio.type !== 'DELETE' && !(await puedeLeer(canal.contexto, cambio.schema, cambio.table, registro))) continue
        enviar(conexion.ws, [null, null, topic, 'postgres_changes', {
          ids,
          data: {
            schema: cambio.schema,
            table: cambio.table,
            commit_timestamp: cambio.commit_timestamp,
            type: cambio.type,
            columns: columnas,
            record: cambio.type === 'DELETE' ? {} : registro,
            old_record: anterior,
            errors: null
          }
        }])
      }
    }
  }
  const listo = conectarOyente()

  // --- Conexiones WebSocket ----------------------------------------------------
  servidor.on('upgrade', (req, socket, cabeza) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname !== '/realtime/v1/websocket') return socket.destroy()
    if (Date.now() < cortadoHasta) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n')
      return socket.destroy()
    }
    let contexto
    try {
      contexto = contextoDeToken(url.searchParams.get('apikey'))
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      return socket.destroy()
    }
    wss.handleUpgrade(req, socket, cabeza, (ws) => {
      const conexion = { ws, contexto, canales: new Map() }
      conexiones.add(conexion)
      ws.on('close', () => conexiones.delete(conexion))
      ws.on('error', () => conexiones.delete(conexion))
      ws.on('message', async (crudo) => {
        let joinRef, ref, topic, evento, payload
        try {
          ;[joinRef, ref, topic, evento, payload] = JSON.parse(crudo.toString())
        } catch {
          return
        }
        const responder = (respuesta = {}, status = 'ok') =>
          enviar(ws, [joinRef, ref, topic, 'phx_reply', { status, response: respuesta }])

        if (topic === 'phoenix' && evento === 'heartbeat') return responder()

        if (evento === 'phx_join') {
          let ctx = conexion.contexto
          if (payload?.access_token) {
            try {
              ctx = contextoDeToken(payload.access_token)
            } catch {
              return responder({ reason: 'token invalido' }, 'error')
            }
          }
          const pedidos = payload?.config?.postgres_changes ?? []
          const filtros = pedidos.map((p) => ({
            id: siguienteId++,
            event: p.event ?? '*',
            schema: p.schema ?? 'public',
            table: p.table,
            filter: p.filter
          }))
          conexion.canales.set(topic, { joinRef, contexto: ctx, filtros })
          responder({ postgres_changes: filtros })
          const noPublicadas = []
          for (const f of filtros) {
            if (f.table && !(await publicada(f.schema, f.table))) noPublicadas.push(`${f.schema}.${f.table}`)
          }
          const canal = topic.replace(/^realtime:/, '')
          enviar(ws, [joinRef, null, topic, 'system', noPublicadas.length
            ? { status: 'error', extension: 'postgres_changes', channel: canal,
                message: `Unable to subscribe to changes with given parameters: ${noPublicadas.join(', ')} no esta en la publicacion supabase_realtime` }
            : { status: 'ok', extension: 'postgres_changes', channel: canal, message: 'Subscribed to PostgreSQL' }])
          return
        }

        if (evento === 'access_token') {
          const canal = conexion.canales.get(topic)
          try {
            if (canal && payload?.access_token) canal.contexto = contextoDeToken(payload.access_token)
          } catch {
            // se conserva el anterior
          }
          return responder()
        }

        if (evento === 'phx_leave') {
          conexion.canales.delete(topic)
          return responder()
        }

        return responder()
      })
    })
  })

  return {
    listo,
    /** Corta todas las conexiones y rechaza nuevas durante `ms` (simula una caida de Realtime). */
    cortar(ms) {
      cortadoHasta = Date.now() + ms
      for (const c of conexiones) c.ws.terminate()
      conexiones.clear()
    },
    estado() {
      return {
        conexiones: conexiones.size,
        canales: [...conexiones].reduce((n, c) => n + c.canales.size, 0),
        cortado: Date.now() < cortadoHasta
      }
    },
    async detener() {
      apagando = true
      for (const c of conexiones) c.ws.terminate()
      await oyente?.end().catch(() => {})
    }
  }
}
