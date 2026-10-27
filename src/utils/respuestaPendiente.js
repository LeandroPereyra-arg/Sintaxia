/**
 * Respuesta que se mando al servidor pero todavia no tiene confirmacion.
 *
 * Se anota en el dispositivo ANTES de mandarla y se borra cuando el servidor
 * contesta. Si en el medio se corta la conexion o se cierra la app, al volver a
 * la leccion se reenvia sola. No hay riesgo de contarla dos veces: el servidor
 * guarda una sola respuesta por actividad e intento.
 *
 * Es solo una ayuda: si el navegador no deja guardar (modo privado, almacenamiento
 * bloqueado) la app funciona igual, y la respuesta se vuelve a elegir a mano.
 */
const CLAVE = 'sintaxia:respuesta-pendiente'

/** @returns {{usuarioId:string, intentoId:string, preguntaId:string, opcionId:string} | null} */
export function leerPendiente(usuarioId) {
  try {
    const dato = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
    return dato && dato.usuarioId === usuarioId ? dato : null
  } catch {
    return null
  }
}

export function anotarPendiente(pendiente) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(pendiente))
  } catch {
    // Sin almacenamiento: se sigue sin la ayuda.
  }
}

export function borrarPendiente() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada
  }
}
