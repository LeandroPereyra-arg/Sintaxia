import { randomBytes } from 'node:crypto'
import { config } from '../config.js'

/**
 * Implementacion de OAuth 2.0 (Authorization Code) para Google y GitHub.
 *
 * El flujo es el mismo para los dos:
 *   1. La app manda al usuario a la pantalla de permisos del proveedor,
 *      con un parametro `state` aleatorio que guardamos en una cookie.
 *   2. El proveedor lo devuelve a nuestro callback con un `code`.
 *   3. Verificamos que el `state` coincida (esto es lo que evita CSRF).
 *   4. Cambiamos el `code` por un access token.
 *   5. Con ese token pedimos los datos del perfil.
 */

const COOKIE_ESTADO = 'sintaxia_oauth_estado'
const COOKIE_DESTINO = 'sintaxia_oauth_destino'

const OPCIONES_COOKIE_CORTA = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.produccion,
  path: '/',
  maxAge: 10 * 60 * 1000 // 10 minutos: solo tiene que durar el login
}

export const proveedores = {
  google: {
    nombre: 'Google',
    urlAutorizacion: 'https://accounts.google.com/o/oauth2/v2/auth',
    urlToken: 'https://oauth2.googleapis.com/token',
    urlPerfil: 'https://www.googleapis.com/oauth2/v3/userinfo',
    alcance: 'openid email profile',
    credenciales: () => config.google,
    /** Normaliza la respuesta de Google a nuestro formato interno. */
    normalizar: (perfil) => ({
      proveedorId: String(perfil.sub),
      email: perfil.email ?? null,
      emailVerificado: perfil.email_verified === true,
      nombre: perfil.name || perfil.given_name || 'Estudiante',
      avatarUrl: perfil.picture ?? null,
      usuarioSugerido: (perfil.email ?? '').split('@')[0] || perfil.given_name || 'estudiante'
    })
  },

  github: {
    nombre: 'GitHub',
    urlAutorizacion: 'https://github.com/login/oauth/authorize',
    urlToken: 'https://github.com/login/oauth/access_token',
    urlPerfil: 'https://api.github.com/user',
    alcance: 'read:user user:email',
    credenciales: () => config.github,
    normalizar: (perfil) => ({
      proveedorId: String(perfil.id),
      email: perfil.email ?? null,
      emailVerificado: Boolean(perfil.email),
      nombre: perfil.name || perfil.login || 'Estudiante',
      avatarUrl: perfil.avatar_url ?? null,
      usuarioSugerido: perfil.login || 'estudiante'
    })
  }
}

export function urlCallback(proveedor) {
  return `${config.urlApi}/api/auth/${proveedor}/callback`
}

/** Paso 1: arma la URL del proveedor y deja el `state` en una cookie. */
export function iniciarAutorizacion(req, res, nombreProveedor, destino) {
  const proveedor = proveedores[nombreProveedor]
  const { clienteId } = proveedor.credenciales()
  const estado = randomBytes(24).toString('hex')

  res.cookie(COOKIE_ESTADO, `${nombreProveedor}:${estado}`, OPCIONES_COOKIE_CORTA)
  if (destino) res.cookie(COOKIE_DESTINO, destino, OPCIONES_COOKIE_CORTA)

  const parametros = new URLSearchParams({
    client_id: clienteId,
    redirect_uri: urlCallback(nombreProveedor),
    response_type: 'code',
    scope: proveedor.alcance,
    state: estado
  })

  return `${proveedor.urlAutorizacion}?${parametros}`
}

/** Paso 3: compara el `state` recibido con el que habiamos guardado. */
export function validarEstado(req, res, nombreProveedor) {
  const guardado = req.cookies?.[COOKIE_ESTADO]
  const recibido = req.query?.state
  res.clearCookie(COOKIE_ESTADO, { ...OPCIONES_COOKIE_CORTA, maxAge: undefined })

  if (!guardado || !recibido) return false
  return guardado === `${nombreProveedor}:${recibido}`
}

/** Lee y limpia la pagina a la que hay que volver despues del login. */
export function tomarDestino(req, res) {
  const destino = req.cookies?.[COOKIE_DESTINO]
  res.clearCookie(COOKIE_DESTINO, { ...OPCIONES_COOKIE_CORTA, maxAge: undefined })
  // Solo se aceptan rutas internas: evita que nos usen para redirigir a otro sitio.
  if (typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//')) {
    return destino
  }
  return '/perfil'
}

/** Paso 4: cambia el `code` por un access token. */
async function pedirToken(nombreProveedor, code) {
  const proveedor = proveedores[nombreProveedor]
  const { clienteId, clienteSecreto } = proveedor.credenciales()

  const respuesta = await fetch(proveedor.urlToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clienteId,
      client_secret: clienteSecreto,
      code,
      redirect_uri: urlCallback(nombreProveedor),
      grant_type: 'authorization_code'
    })
  })

  const datos = await respuesta.json()
  if (!respuesta.ok || datos.error || !datos.access_token) {
    throw new Error(`No se pudo obtener el token de ${proveedor.nombre}: ${datos.error ?? respuesta.status}`)
  }
  return datos.access_token
}

/** Paso 5: pide el perfil y lo devuelve normalizado. */
export async function obtenerPerfil(nombreProveedor, code) {
  const proveedor = proveedores[nombreProveedor]
  const token = await pedirToken(nombreProveedor, code)

  const respuesta = await fetch(proveedor.urlPerfil, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'Sintaxia'
    }
  })
  if (!respuesta.ok) throw new Error(`${proveedor.nombre} rechazo la consulta del perfil`)
  const perfil = await respuesta.json()

  const normalizado = proveedor.normalizar(perfil)

  // GitHub no siempre devuelve el email en /user: hay que pedirlo aparte.
  if (nombreProveedor === 'github' && !normalizado.email) {
    const correos = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'Sintaxia' }
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])

    const principal = correos.find((c) => c.primary && c.verified) ?? correos.find((c) => c.verified)
    if (principal) {
      normalizado.email = principal.email
      normalizado.emailVerificado = true
    }
  }

  return normalizado
}
