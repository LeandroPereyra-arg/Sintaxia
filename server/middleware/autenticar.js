import { leerSesion } from '../auth/sesion.js'
import { obtenerUsuarioPorId } from '../servicios/usuarios.js'

/** Deja pasar solo con sesion valida y carga `req.usuario`. */
export async function requiereSesion(req, res, siguiente) {
  const usuarioId = leerSesion(req)
  if (!usuarioId) {
    return res.status(401).json({ error: 'Necesitas iniciar sesion.' })
  }
  const usuario = await obtenerUsuarioPorId(usuarioId)
  if (!usuario) {
    return res.status(401).json({ error: 'La sesion ya no es valida.' })
  }
  req.usuario = usuario
  siguiente()
}

/** Envuelve un handler async para que los errores lleguen al manejador central. */
export function asincrono(handler) {
  return (req, res, siguiente) => Promise.resolve(handler(req, res, siguiente)).catch(siguiente)
}
