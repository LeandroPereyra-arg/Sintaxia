const CLAVE = 'sintaxia:bienvenida-vista'

/**
 * Recuerda si el estudiante ya vio la pantalla de bienvenida.
 *
 * Se guarda en el navegador y no en la cuenta a proposito: la bienvenida
 * explica como se usa la aplicacion, asi que tiene sentido mostrarla una vez
 * por dispositivo, aunque la persona ya tenga cuenta.
 */
export function bienvenidaVista() {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    // Sin localStorage (modo privado) se asume que ya la vio, para no
    // mostrarla en cada navegacion.
    return true
  }
}

export function marcarBienvenidaVista() {
  try {
    localStorage.setItem(CLAVE, '1')
  } catch {
    /* si no se puede guardar, no pasa nada */
  }
}

export function olvidarBienvenida() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
