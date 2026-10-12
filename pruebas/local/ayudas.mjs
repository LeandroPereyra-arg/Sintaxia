/**
 * Ayudas compartidas por las pruebas que usan el entorno local de Supabase
 * (pruebas/servidor-supabase-local.mjs): hablar con la API, leer los correos que
 * manda Auth y consultar la base directamente.
 */
import pg from 'pg'

export const URL_APP = process.env.URL_APP ?? 'http://localhost:5174'
export const URL_SB = process.env.URL_SUPABASE ?? 'http://localhost:5599'

/** Claves del entorno local: publicable (rol anon) y de servicio (service_role). */
export async function leerClaves() {
  const r = await fetch(`${URL_SB}/__control/claves`)
  if (!r.ok) throw new Error(`No responde el entorno local en ${URL_SB}. Levantalo con: npm run supabase:puente`)
  return r.json()
}

// ---------------------------------------------------------------------------
// Base de datos (como superusuario: solo para preparar y verificar, nunca para probar permisos)
// ---------------------------------------------------------------------------
export function abrirBase() {
  const cliente = new pg.Client({
    host: process.env.PGHOST ?? '127.0.0.1',
    port: Number(process.env.PGPORT ?? 5433),
    user: process.env.PGUSER ?? 'sintaxia',
    database: process.env.PGDATABASE ?? 'sintaxia'
  })
  return cliente
}

// ---------------------------------------------------------------------------
// Control del entorno
// ---------------------------------------------------------------------------
export async function reiniciarAuth(cambios) {
  const r = await fetch(`${URL_SB}/__control/reiniciar-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  })
  if (!r.ok) throw new Error(`No se pudo reiniciar Auth: ${await r.text()}`)
}

export async function borrarCorreos() {
  await fetch(`${URL_SB}/__control/correos`, { method: 'DELETE' })
}

/** Todos los correos enviados a una direccion, del mas viejo al mas nuevo. */
export async function correosPara(correo) {
  const r = await fetch(`${URL_SB}/__control/correos?para=${encodeURIComponent(correo.toLowerCase())}`)
  return r.json()
}

/** Espera (hasta `esperaMs`) a que llegue al menos `cantidad` correos y devuelve el ultimo. */
export async function esperarCorreo(correo, { cantidad = 1, esperaMs = 10000 } = {}) {
  const limite = Date.now() + esperaMs
  while (Date.now() < limite) {
    const lista = await correosPara(correo)
    if (lista.length >= cantidad) return lista[lista.length - 1]
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`No llego el correo ${cantidad} para ${correo} en ${esperaMs} ms`)
}

/** Enlace de un correo de Auth (el que lleva a /auth/v1/verify). */
export function enlaceDeVerificacion(correo) {
  const enlace = correo.enlaces.find((e) => e.includes('/auth/v1/verify'))
  if (!enlace) throw new Error(`El correo no trae enlace de verificacion: ${correo.asunto}`)
  return enlace
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** Correo unico por ejecucion, para poder repetir las pruebas sin limpiar la base. */
let contador = 0
export function correoNuevo(prefijo = 'prueba') {
  contador += 1
  // En minusculas: Auth normaliza los correos y asi el que buscamos es el que se guardo.
  return `${prefijo}.${Date.now().toString(36)}${contador}@ejemplo.com`.toLowerCase()
}

// ---------------------------------------------------------------------------
// API de Supabase, sin pasar por la app
// ---------------------------------------------------------------------------
export function decodificar(token) {
  const cuerpo = token.split('.')[1]
  return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'))
}

export function crearApi(claves) {
  async function auth(ruta, cuerpo, { token, metodo = 'POST' } = {}) {
    const r = await fetch(`${URL_SB}/auth/v1${ruta}`, {
      method: metodo,
      headers: {
        apikey: claves.clavePublicable,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    })
    const texto = await r.text()
    return { estado: r.status, datos: texto ? JSON.parse(texto) : null }
  }

  /** Alta anonima: devuelve { estado, token, id, datos }. */
  async function altaAnonima(datos = {}) {
    const r = await auth('/signup', { data: datos })
    return {
      estado: r.estado,
      datos: r.datos,
      token: r.datos?.access_token,
      id: r.datos?.user?.id
    }
  }

  /**
   * Crea una cuenta con correo ya CONFIRMADA y devuelve su token. Hace el recorrido
   * real: signup -> correo -> enlace de verificacion (sin seguir la redireccion, para
   * leer el token que viene en el fragmento).
   */
  async function cuentaConfirmada({ correo, clave = 'clave-segura-123', alias = 'Probador' }) {
    const cantidadAntes = (await correosPara(correo)).length
    const alta = await auth('/signup', { email: correo, password: clave, data: { alias } })
    if (alta.estado >= 400) throw new Error(`signup fallo: ${JSON.stringify(alta.datos)}`)

    // Con la confirmacion apagada ya viene la sesion.
    if (alta.datos?.access_token) {
      return { token: alta.datos.access_token, id: alta.datos.user.id, correo, clave }
    }

    const mail = await esperarCorreo(correo, { cantidad: cantidadAntes + 1 })
    const respuesta = await fetch(enlaceDeVerificacion(mail), { redirect: 'manual' })
    const ubicacion = respuesta.headers.get('location') ?? ''
    const fragmento = new URLSearchParams(new URL(ubicacion).hash.replace(/^#/, ''))
    const token = fragmento.get('access_token')
    if (!token) throw new Error(`El enlace no devolvio sesion: ${ubicacion}`)
    return { token, id: decodificar(token).sub, correo, clave }
  }

  async function iniciarSesion(correo, clave) {
    const r = await auth('/token?grant_type=password', { email: correo, password: clave })
    return { estado: r.estado, datos: r.datos, token: r.datos?.access_token }
  }

  /** Consulta a la API de datos con el token de una persona (o sin sesion). */
  async function datos(token, metodo, ruta, cuerpo, prefer) {
    const r = await fetch(`${URL_SB}/rest/v1/${ruta}`, {
      method: metodo,
      headers: {
        apikey: claves.clavePublicable,
        Authorization: `Bearer ${token ?? claves.clavePublicable}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {})
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    })
    const texto = await r.text()
    let cuerpoRespuesta = null
    try {
      cuerpoRespuesta = texto ? JSON.parse(texto) : null
    } catch {
      cuerpoRespuesta = texto
    }
    return { estado: r.status, datos: cuerpoRespuesta }
  }

  return { auth, altaAnonima, cuentaConfirmada, iniciarSesion, datos }
}
