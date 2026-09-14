import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * La sesion se guarda en una cookie httpOnly firmada (JWT).
 * httpOnly = JavaScript de la pagina no puede leerla, asi que un XSS no se
 * puede robar la sesion. SameSite=Lax corta los ataques CSRF basicos y a la
 * vez deja que la cookie viaje cuando Google nos devuelve por redireccion.
 */
const OPCIONES_COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.produccion,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
}

export function crearSesion(res, usuarioId) {
  const token = jwt.sign({ uid: usuarioId }, config.sesion.secreto, {
    expiresIn: config.sesion.duracion
  })
  res.cookie(config.sesion.cookie, token, OPCIONES_COOKIE)
}

export function cerrarSesion(res) {
  res.clearCookie(config.sesion.cookie, { ...OPCIONES_COOKIE, maxAge: undefined })
}

/** Devuelve el id del usuario de la cookie, o null si no hay sesion valida. */
export function leerSesion(req) {
  const token = req.cookies?.[config.sesion.cookie]
  if (!token) return null
  try {
    const datos = jwt.verify(token, config.sesion.secreto)
    return Number(datos.uid) || null
  } catch {
    return null // token vencido o manipulado
  }
}
