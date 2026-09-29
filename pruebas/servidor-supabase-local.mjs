/**
 * Supabase local para las pruebas automaticas.
 *
 * El proyecto real de Supabase es de pago/nube y las claves no se suben al
 * repositorio, asi que las pruebas no pueden apuntar ahi. Este servidor levanta
 * la MISMA base (los cuatro scripts de `supabase/` corridos sobre PostgreSQL) y
 * expone la parte de la API de PostgREST que usa la aplicacion, para poder
 * probar el recorrido completo de punta a punta.
 *
 * Es importante lo que NO simula: cada consulta se ejecuta con
 * `set local role anon`, es decir, con el mismo rol y los mismos permisos que
 * tiene el navegador contra Supabase. Por eso las pruebas de seguridad (que las
 * soluciones no se pueden leer, que un visitante no puede escribir) valen: las
 * responde PostgreSQL, no este archivo.
 *
 * Solo se usa en pruebas. La aplicacion no lo conoce.
 */
import http from 'node:http'
import pg from 'pg'

const { Pool } = pg

const PUERTO = Number(process.env.PUERTO_SUPABASE_LOCAL ?? 5599)

const pool = new Pool({
  host: process.env.PGHOST ?? '/tmp',
  port: Number(process.env.PGPORT ?? 5433),
  user: process.env.PGUSER ?? 'sintaxia',
  database: process.env.PGDATABASE ?? 'sintaxia',
  max: 4
})

/** Tablas que la API expone. Cualquier otra se rechaza. */
const TABLAS = new Set(['cursos', 'unidades', 'lecciones', 'preguntas', 'opciones'])

const CABECERAS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'content-range',
  'Content-Type': 'application/json'
}

function identificador(nombre) {
  if (!/^[a-z_][a-z0-9_]*$/.test(nombre)) throw new Error(`Identificador invalido: ${nombre}`)
  return nombre
}

/** Traduce ?select=..&col=eq.x&col=in.(a,b)&order=col.asc a SQL. */
function armarConsulta(tabla, params) {
  const columnas = (params.get('select') ?? '*')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map(identificador)

  const condiciones = []
  const valores = []

  for (const [clave, valor] of params.entries()) {
    if (clave === 'select' || clave === 'order' || clave === 'limit') continue
    const columna = identificador(clave)

    if (valor.startsWith('eq.')) {
      valores.push(valor.slice(3))
      condiciones.push(`${columna} = $${valores.length}`)
    } else if (valor.startsWith('in.(')) {
      const lista = valor
        .slice(4, -1)
        .split(',')
        .map((v) => v.replace(/^"|"$/g, ''))
      valores.push(lista)
      condiciones.push(`${columna} = any($${valores.length})`)
    } else {
      throw new Error(`Filtro no soportado: ${clave}=${valor}`)
    }
  }

  let orden = ''
  const pedido = params.get('order')
  if (pedido) {
    const partes = pedido.split('.')
    const columna = identificador(partes[0])
    orden = ` order by ${columna} ${partes[1] === 'desc' ? 'desc' : 'asc'}`
  }

  const donde = condiciones.length ? ` where ${condiciones.join(' and ')}` : ''
  return {
    texto: `select ${columnas.join(', ')} from public.${identificador(tabla)}${donde}${orden}`,
    valores
  }
}

/** Arma el where de una escritura con los mismos filtros que una lectura. */
function armarFiltros(params, valores) {
  const condiciones = []
  for (const [clave, valor] of params.entries()) {
    if (clave === 'select' || clave === 'order' || clave === 'limit') continue
    const columna = identificador(clave)
    if (!valor.startsWith('eq.')) throw new Error(`Filtro no soportado: ${clave}=${valor}`)
    valores.push(valor.slice(3))
    condiciones.push(`${columna} = $${valores.length}`)
  }
  return condiciones.length ? ` where ${condiciones.join(' and ')}` : ''
}

/**
 * Escrituras (insert, update, delete). Existen para poder PROBAR que el rol
 * publico no puede hacerlas: se ejecutan igual que las lecturas, con rol anon,
 * asi que las rechaza PostgreSQL y no este archivo.
 */
function armarEscritura(metodo, tabla, params, cuerpo) {
  const valores = []
  const nombre = identificador(tabla)

  if (metodo === 'POST') {
    const columnas = Object.keys(cuerpo).map(identificador)
    const marcadores = columnas.map((_, i) => `$${i + 1}`)
    valores.push(...columnas.map((c) => cuerpo[c]))
    return { texto: `insert into public.${nombre} (${columnas.join(', ')}) values (${marcadores.join(', ')})`, valores }
  }

  if (metodo === 'PATCH') {
    const columnas = Object.keys(cuerpo).map(identificador)
    const asignaciones = columnas.map((c, i) => {
      valores.push(cuerpo[c])
      return `${c} = $${valores.length}`
    })
    return {
      texto: `update public.${nombre} set ${asignaciones.join(', ')}${armarFiltros(params, valores)}`,
      valores
    }
  }

  return { texto: `delete from public.${nombre}${armarFiltros(params, valores)}`, valores }
}

/** Ejecuta con el rol anon, igual que lo haria el navegador contra Supabase. */
async function comoAnon(ejecutar) {
  const conexion = await pool.connect()
  try {
    await conexion.query('begin')
    await conexion.query('set local role anon')
    const resultado = await ejecutar(conexion)
    await conexion.query('commit')
    return resultado
  } catch (error) {
    await conexion.query('rollback').catch(() => {})
    throw error
  } finally {
    conexion.release()
  }
}

function responderError(res, error) {
  const cuerpo = {
    code: error.code ?? 'PGRST000',
    message: error.message,
    details: error.detail ?? null,
    hint: error.hint ?? null
  }
  const estado = error.code === '42501' ? 403 : 400
  res.writeHead(estado, CABECERAS)
  res.end(JSON.stringify(cuerpo))
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CABECERAS)
    res.end()
    return
  }

  try {
    // --- Funciones del servidor: /rest/v1/rpc/<nombre> ---
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const funcion = identificador(url.pathname.slice('/rest/v1/rpc/'.length))
      const cuerpo = await new Promise((resolver) => {
        let texto = ''
        req.on('data', (parte) => (texto += parte))
        req.on('end', () => resolver(texto ? JSON.parse(texto) : {}))
      })

      const nombres = Object.keys(cuerpo).map(identificador)
      const valores = nombres.map((nombre) => cuerpo[nombre])
      const args = nombres.map((nombre, i) => `${nombre} => $${i + 1}`).join(', ')

      const { rows } = await comoAnon((conexion) =>
        conexion.query(`select public.${funcion}(${args}) as resultado`, valores)
      )

      res.writeHead(200, CABECERAS)
      res.end(JSON.stringify(rows[0]?.resultado ?? null))
      return
    }

    // --- Tablas: /rest/v1/<tabla> ---
    if (url.pathname.startsWith('/rest/v1/')) {
      const tabla = url.pathname.slice('/rest/v1/'.length)
      if (!TABLAS.has(tabla)) {
        res.writeHead(404, CABECERAS)
        res.end(JSON.stringify({ code: 'PGRST205', message: `No existe la tabla ${tabla}` }))
        return
      }

      if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
        const cuerpo = await new Promise((resolver) => {
          let bruto = ''
          req.on('data', (parte) => (bruto += parte))
          req.on('end', () => resolver(bruto ? JSON.parse(bruto) : {}))
        })
        const consulta = armarEscritura(req.method, tabla, url.searchParams, cuerpo)
        await comoAnon((conexion) => conexion.query(consulta.texto, consulta.valores))
        res.writeHead(204, CABECERAS)
        res.end()
        return
      }

      const { texto, valores } = armarConsulta(tabla, url.searchParams)
      const { rows } = await comoAnon((conexion) => conexion.query(texto, valores))

      const cabeceras = { ...CABECERAS }
      if ((req.headers.prefer ?? '').includes('count=exact')) {
        cabeceras['Content-Range'] = `0-${Math.max(0, rows.length - 1)}/${rows.length}`
      }

      // head: true (contar sin traer filas)
      if (req.method === 'HEAD') {
        res.writeHead(200, cabeceras)
        res.end()
        return
      }

      res.writeHead(200, cabeceras)
      res.end(JSON.stringify(rows))
      return
    }

    res.writeHead(404, CABECERAS)
    res.end(JSON.stringify({ message: 'Ruta desconocida' }))
  } catch (error) {
    responderError(res, error)
  }
})

servidor.listen(PUERTO, () => {
  console.log(`Supabase local escuchando en http://localhost:${PUERTO}`)
})

process.on('SIGTERM', () => {
  servidor.close()
  pool.end()
})
