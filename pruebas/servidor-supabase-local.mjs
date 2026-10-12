/**
 * Supabase local para las pruebas automaticas.
 *
 * El proyecto real de Supabase vive en la nube y sus claves no se suben al
 * repositorio, asi que las pruebas no pueden apuntar ahi. Este proceso arma un
 * entorno equivalente en la maquina, con UNA sola direccion (como Supabase):
 *
 *   /auth/v1/*   reenvia a Supabase Auth (GoTrue) REAL, compilado en local.
 *                Las altas anonimas, el registro, la confirmacion de correo, la
 *                recuperacion y la conversion de invitado a cuenta las ejecuta el
 *                mismo codigo que corre en Supabase.
 *   /rest/v1/*   API de datos. Es una IMITACION de PostgREST (el real no se pudo
 *                bajar en este entorno), pero lo que importa esta intacto: valida
 *                el JWT con la misma clave, ejecuta cada consulta con el rol de
 *                PostgreSQL que indica el token (anon, authenticated) y publica
 *                sus claims en `request.jwt.claims`. Quien aplica los permisos y
 *                las politicas de RLS es PostgreSQL, no este archivo.
 *   /__control/* solo para pruebas: reiniciar Auth con otra configuracion y leer
 *                los correos que mando Auth.
 *
 * La aplicacion no sabe nada de este archivo: solo ve una URL de Supabase.
 */
import http from 'node:http'
import pg from 'pg'

import { clavePublicable, claveDeServicio, verificar, JwtInvalido } from './local/jwt.mjs'
import { correos, iniciarSmtp } from './local/smtp.mjs'
import * as gotrue from './local/gotrue.mjs'

const { Pool } = pg

const PUERTOS = {
  gateway: Number(process.env.PUERTO_SUPABASE_LOCAL ?? 5599),
  gotrue: Number(process.env.PUERTO_GOTRUE ?? 9999),
  smtp: Number(process.env.PUERTO_SMTP ?? 2525),
  app: Number(process.env.PUERTO_APP ?? 5174)
}

/** Clave de firma de los tokens. Es solo para pruebas locales: no es ningun secreto real. */
const SECRETO_JWT = process.env.JWT_SECRET_LOCAL ?? 'secreto-local-de-pruebas-que-es-largo-1234567890'

const conexion = {
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5433),
  database: process.env.PGDATABASE ?? 'sintaxia'
}

const pool = new Pool({ ...conexion, user: process.env.PGUSER ?? 'sintaxia', max: 6 })
// Si la base se reconstruye mientras la pasarela corre, las conexiones ociosas mueren.
// Sin este manejador ese aviso tira abajo el proceso; con el, el pool las descarta y reconecta.
pool.on('error', () => {})

const URL_BASE_DATOS_AUTH =
  `postgres://supabase_auth_admin:solo-para-pruebas-locales@${conexion.host}:${conexion.port}/` +
  `${conexion.database}?sslmode=disable`

/** Configuracion actual de Auth; los tests la cambian con /__control/reiniciar-auth. */
let configAuth = {
  confirmarCorreo: true,
  limiteAnonimos: 1000,
  limiteCorreos: 1000,
  minClave: 8
}

async function arrancarAuth(cambios = {}) {
  configAuth = { ...configAuth, ...cambios }
  await gotrue.iniciar({
    puertoGotrue: PUERTOS.gotrue,
    puertoGateway: PUERTOS.gateway,
    puertoSmtp: PUERTOS.smtp,
    puertoApp: PUERTOS.app,
    secretoJwt: SECRETO_JWT,
    baseDatos: URL_BASE_DATOS_AUTH,
    ...configAuth
  })
}

const CABECERAS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'content-range, x-supabase-api-version'
}

const JSON_CORS = { ...CABECERAS_CORS, 'Content-Type': 'application/json' }

// ---------------------------------------------------------------------------
// /auth/v1 -> GoTrue
// ---------------------------------------------------------------------------
function reenviarAAuth(req, res, rutaEnAuth) {
  const cabeceras = {
    ...req.headers,
    host: `127.0.0.1:${PUERTOS.gotrue}`,
    // Igual que el proxy de Supabase: Auth usa esta cabecera para aplicar los limites por IP.
    'x-forwarded-for': req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '127.0.0.1'
  }
  const peticion = http.request(
    {
      host: '127.0.0.1',
      port: PUERTOS.gotrue,
      path: rutaEnAuth,
      method: req.method,
      headers: cabeceras
    },
    (respuesta) => {
      // Auth ya manda sus cabeceras CORS: se descartan para no duplicarlas.
      const limpias = Object.fromEntries(
        Object.entries(respuesta.headers).filter(([k]) => !k.toLowerCase().startsWith('access-control-'))
      )
      res.writeHead(respuesta.statusCode ?? 502, { ...limpias, ...CABECERAS_CORS })
      respuesta.pipe(res)
    }
  )
  peticion.on('error', (error) => {
    res.writeHead(502, JSON_CORS)
    res.end(JSON.stringify({ code: 'auth_no_disponible', message: `Auth no responde: ${error.message}` }))
  })
  req.pipe(peticion)
}

// ---------------------------------------------------------------------------
// /rest/v1 -> PostgreSQL con el rol del token
// ---------------------------------------------------------------------------
const ROLES_PERMITIDOS = new Set(['anon', 'authenticated', 'service_role'])
const TABLAS = new Set([
  'cursos', 'unidades', 'lecciones', 'preguntas', 'opciones', 'perfiles', 'intentos_leccion'
])

function identificador(nombre) {
  if (!/^[a-z_][a-z0-9_]*$/.test(nombre)) throw new ErrorPeticion(`Identificador invalido: ${nombre}`)
  return nombre
}

class ErrorPeticion extends Error {}

const OPERADORES = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }

function tomarValor(valores, valor) {
  valores.push(valor)
  return `$${valores.length}`
}

/** Traduce ?col=eq.x&col=in.(a,b)&col=is.null a condiciones SQL parametrizadas. */
function armarFiltros(params, valores) {
  const condiciones = []
  for (const [clave, texto] of params.entries()) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(clave)) continue
    const columna = identificador(clave)
    const punto = texto.indexOf('.')
    const operador = texto.slice(0, punto)
    const valor = texto.slice(punto + 1)

    if (operador in OPERADORES) {
      condiciones.push(`${columna} ${OPERADORES[operador]} ${tomarValor(valores, valor)}`)
    } else if (operador === 'in') {
      const lista = valor.replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''))
      condiciones.push(`${columna} = any(${tomarValor(valores, lista)})`)
    } else if (operador === 'is') {
      condiciones.push(`${columna} is ${valor === 'null' ? 'null' : valor === 'true' ? 'true' : 'false'}`)
    } else {
      throw new ErrorPeticion(`Filtro no soportado: ${clave}=${texto}`)
    }
  }
  return condiciones.length ? ` where ${condiciones.join(' and ')}` : ''
}

function armarOrden(params) {
  const pedido = params.get('order')
  if (!pedido) return ''
  const partes = pedido.split(',').map((tramo) => {
    const [columna, direccion] = tramo.split('.')
    return `${identificador(columna)} ${direccion === 'desc' ? 'desc' : 'asc'}`
  })
  return ` order by ${partes.join(', ')}`
}

function armarColumnas(params) {
  return (params.get('select') ?? '*')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => (c === '*' ? '*' : identificador(c)))
    .join(', ')
}

/** Cuerpo JSON de la peticion (un objeto o una lista de objetos). */
async function leerCuerpo(req) {
  const bruto = await new Promise((resolver) => {
    let texto = ''
    req.on('data', (parte) => (texto += parte))
    req.on('end', () => resolver(texto))
  })
  return bruto ? JSON.parse(bruto) : {}
}

/**
 * Ejecuta con el rol de PostgreSQL que indica el token y con sus claims
 * publicados, igual que PostgREST. Es lo que hace funcionar auth.uid().
 */
async function conRol(contexto, ejecutar) {
  const cliente = await pool.connect()
  try {
    await cliente.query('begin')
    await cliente.query(`set local role ${contexto.rol}`)
    const claims = JSON.stringify(contexto.claims)
    await cliente.query(
      `select set_config('request.jwt.claims', $1, true),
              set_config('request.jwt.claim.sub', $2, true),
              set_config('request.jwt.claim.role', $3, true)`,
      [claims, contexto.claims.sub ?? '', contexto.rol]
    )
    const resultado = await ejecutar(cliente)
    await cliente.query('commit')
    return resultado
  } catch (error) {
    await cliente.query('rollback').catch(() => {})
    throw error
  } finally {
    cliente.release()
  }
}

/** Rol y claims segun el token (o la clave publicable, que equivale al rol anon). */
function contextoDe(req) {
  const autorizacion = req.headers.authorization ?? ''
  const token = autorizacion.startsWith('Bearer ') ? autorizacion.slice(7) : req.headers.apikey
  if (!token) return { rol: 'anon', claims: { role: 'anon' } }

  const claims = verificar(token, SECRETO_JWT)
  const rol = claims.role ?? 'anon'
  if (!ROLES_PERMITIDOS.has(rol)) throw new JwtInvalido(`Rol no permitido: ${rol}`)
  return { rol, claims }
}

/** Estado HTTP que usaria PostgREST para cada codigo de error de PostgreSQL. */
function estadoDeError(error, rol) {
  const codigo = error.code ?? ''
  if (codigo === '42501') return rol === 'anon' ? 401 : 403
  if (codigo === '23505' || codigo === '23503') return 409
  if (codigo === '42P01') return 404
  if (error instanceof ErrorPeticion) return 400
  return 400
}

function responderError(res, error, rol) {
  const cuerpo = {
    code: error.code ?? 'PGRST000',
    message: error.message,
    details: error.detail ?? null,
    hint: error.hint ?? null
  }
  res.writeHead(estadoDeError(error, rol), JSON_CORS)
  res.end(JSON.stringify(cuerpo))
}

async function atenderDatos(req, res, url) {
  let contexto
  try {
    contexto = contextoDe(req)
  } catch (error) {
    res.writeHead(401, { ...JSON_CORS, 'WWW-Authenticate': 'Bearer error="invalid_token"' })
    res.end(JSON.stringify({ code: 'PGRST301', message: error.message, details: null, hint: null }))
    return
  }

  try {
    // --- Funciones del servidor: /rest/v1/rpc/<nombre> ---
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const funcion = identificador(url.pathname.slice('/rest/v1/rpc/'.length))
      const cuerpo = await leerCuerpo(req)
      const nombres = Object.keys(cuerpo).map(identificador)
      const args = nombres.map((n, i) => `${n} => $${i + 1}`).join(', ')
      const { rows } = await conRol(contexto, (c) =>
        c.query(`select public.${funcion}(${args}) as resultado`, nombres.map((n) => cuerpo[n]))
      )
      res.writeHead(200, JSON_CORS)
      res.end(JSON.stringify(rows[0]?.resultado ?? null))
      return
    }

    // --- Tablas: /rest/v1/<tabla> ---
    const tabla = url.pathname.slice('/rest/v1/'.length)
    if (!TABLAS.has(tabla)) {
      res.writeHead(404, JSON_CORS)
      res.end(JSON.stringify({ code: 'PGRST205', message: `No existe la tabla ${tabla}` }))
      return
    }
    const nombre = identificador(tabla)
    const quiereFilas = (req.headers.prefer ?? '').includes('return=representation')
    const quiereUno = (req.headers.accept ?? '').includes('vnd.pgrst.object')
    const valores = []
    let texto

    if (req.method === 'GET' || req.method === 'HEAD') {
      texto =
        `select ${armarColumnas(url.searchParams)} from public.${nombre}` +
        armarFiltros(url.searchParams, valores) +
        armarOrden(url.searchParams)
      const limite = url.searchParams.get('limit')
      if (limite) texto += ` limit ${Number.parseInt(limite, 10)}`
    } else if (req.method === 'POST') {
      const cuerpo = await leerCuerpo(req)
      const filas = Array.isArray(cuerpo) ? cuerpo : [cuerpo]
      const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))].map(identificador)
      const grupos = filas.map(
        (fila) => `(${columnas.map((c) => tomarValor(valores, fila[c] ?? null)).join(', ')})`
      )
      texto = `insert into public.${nombre} (${columnas.join(', ')}) values ${grupos.join(', ')}`
      if (quiereFilas) texto += ` returning ${armarColumnas(url.searchParams)}`
    } else if (req.method === 'PATCH') {
      const cuerpo = await leerCuerpo(req)
      const asignaciones = Object.keys(cuerpo)
        .map(identificador)
        .map((c) => `${c} = ${tomarValor(valores, cuerpo[c])}`)
      texto = `update public.${nombre} set ${asignaciones.join(', ')}${armarFiltros(url.searchParams, valores)}`
      if (quiereFilas) texto += ` returning ${armarColumnas(url.searchParams)}`
    } else if (req.method === 'DELETE') {
      texto = `delete from public.${nombre}${armarFiltros(url.searchParams, valores)}`
      if (quiereFilas) texto += ` returning ${armarColumnas(url.searchParams)}`
    } else {
      res.writeHead(405, JSON_CORS)
      res.end(JSON.stringify({ message: 'Metodo no permitido' }))
      return
    }

    const { rows } = await conRol(contexto, (c) => c.query(texto, valores))

    const cabeceras = { ...JSON_CORS }
    if ((req.headers.prefer ?? '').includes('count=exact')) {
      cabeceras['Content-Range'] = rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0'
    }

    if (req.method === 'HEAD') {
      res.writeHead(200, cabeceras)
      res.end()
      return
    }

    if (req.method === 'GET') {
      if (quiereUno) {
        if (rows.length !== 1) {
          res.writeHead(406, JSON_CORS)
          res.end(JSON.stringify({
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: `The result contains ${rows.length} rows`,
            hint: null
          }))
          return
        }
        res.writeHead(200, cabeceras)
        res.end(JSON.stringify(rows[0]))
        return
      }
      res.writeHead(200, cabeceras)
      res.end(JSON.stringify(rows))
      return
    }

    // Escrituras: 201 al crear, 200 con filas o 204 sin ellas.
    if (quiereFilas) {
      res.writeHead(req.method === 'POST' ? 201 : 200, cabeceras)
      res.end(JSON.stringify(quiereUno ? (rows[0] ?? null) : rows))
    } else {
      res.writeHead(req.method === 'POST' ? 201 : 204, cabeceras)
      res.end()
    }
  } catch (error) {
    responderError(res, error, contexto.rol)
  }
}

// ---------------------------------------------------------------------------
// /__control: solo para pruebas
// ---------------------------------------------------------------------------
async function atenderControl(req, res, url) {
  const responder = (estado, cuerpo) => {
    res.writeHead(estado, JSON_CORS)
    res.end(JSON.stringify(cuerpo))
  }

  if (url.pathname === '/__control/claves') {
    return responder(200, {
      url: `http://localhost:${PUERTOS.gateway}`,
      clavePublicable: clavePublicable(SECRETO_JWT),
      claveDeServicio: claveDeServicio(SECRETO_JWT),
      secretoJwt: SECRETO_JWT
    })
  }

  if (url.pathname === '/__control/estado') {
    return responder(200, { configAuth })
  }

  if (url.pathname === '/__control/reiniciar-auth') {
    const cambios = await leerCuerpo(req)
    await arrancarAuth(cambios)
    return responder(200, { configAuth })
  }

  if (url.pathname === '/__control/correos' && req.method === 'GET') {
    const para = url.searchParams.get('para')?.toLowerCase()
    return responder(
      200,
      para ? correos.filter((c) => c.para.some((d) => d.toLowerCase().includes(para))) : correos
    )
  }

  if (url.pathname === '/__control/correos' && req.method === 'DELETE') {
    correos.length = 0
    return responder(200, { ok: true })
  }

  if (url.pathname === '/__control/registro-auth') {
    return responder(200, gotrue.ultimosRegistros(80))
  }

  return responder(404, { message: 'Control desconocido' })
}

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTOS.gateway}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CABECERAS_CORS)
    res.end()
    return
  }

  try {
    if (url.pathname.startsWith('/auth/v1/')) {
      return reenviarAAuth(req, res, url.pathname.slice('/auth/v1'.length) + url.search)
    }
    if (url.pathname.startsWith('/rest/v1/')) return await atenderDatos(req, res, url)
    if (url.pathname.startsWith('/__control/')) return await atenderControl(req, res, url)

    res.writeHead(404, JSON_CORS)
    res.end(JSON.stringify({ message: 'Ruta desconocida' }))
  } catch (error) {
    res.writeHead(500, JSON_CORS)
    res.end(JSON.stringify({ message: error.message }))
  }
})

async function apagar() {
  servidor.close()
  await gotrue.detener()
  await pool.end().catch(() => {})
  process.exit(0)
}
process.on('SIGTERM', apagar)
process.on('SIGINT', apagar)

await iniciarSmtp(PUERTOS.smtp)
await arrancarAuth()
servidor.listen(PUERTOS.gateway, () => {
  console.log(`Supabase local escuchando en http://localhost:${PUERTOS.gateway}`)
  console.log(`  Auth (GoTrue real) en :${PUERTOS.gotrue} · SMTP de pruebas en :${PUERTOS.smtp}`)
})
