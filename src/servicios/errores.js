/**
 * Errores compartidos por todos los servicios de acceso a datos
 * (contenido, auth, perfiles, progreso).
 *
 * Las pantallas no miran el mensaje tecnico: miran `reintentable`. Esa sola
 * propiedad decide si se ofrece el boton "Reintentar":
 *
 *   reintentable: true   -> fallo la conexion o el servidor; volver a probar puede andar
 *   reintentable: false  -> el pedido en si no tiene arreglo (no existe, datos invalidos)
 */
import { MENSAJE_SIN_CONFIGURACION } from '@/servicios/supabase.js'

/** Base de todos los errores de los servicios. */
export class ErrorDeServicio extends Error {
  constructor(mensaje, { reintentable = false, causa = null, codigo = null } = {}) {
    super(mensaje)
    this.name = 'ErrorDeServicio'
    this.reintentable = reintentable
    this.causa = causa
    this.codigo = codigo
  }
}

/** Base de los errores del contenido educativo (cursos, unidades, lecciones...). */
export class ErrorDeContenido extends ErrorDeServicio {
  constructor(mensaje, opciones) {
    super(mensaje, opciones)
    this.name = 'ErrorDeContenido'
  }
}

/** El contenido pedido no existe o no esta publicado. Reintentar no ayuda. */
export class ContenidoNoEncontrado extends ErrorDeContenido {
  constructor(que, id) {
    super(`No encontramos ${que}.`, { reintentable: false })
    this.name = 'ContenidoNoEncontrado'
    this.que = que
    this.id = id
  }
}

/** No se pudo hablar con la base. Tiene sentido volver a intentar. */
export class ErrorDeConsulta extends ErrorDeContenido {
  constructor(mensaje, causa = null) {
    super(mensaje, { reintentable: true, causa })
    this.name = 'ErrorDeConsulta'
  }
}

/** Falta el .env: no es un problema de red, es de configuracion. */
export class SinConfiguracion extends ErrorDeContenido {
  constructor() {
    super(MENSAJE_SIN_CONFIGURACION, { reintentable: false })
    this.name = 'SinConfiguracion'
  }
}

/** No hay una sesion iniciada y la operacion la necesita. */
export class SinSesion extends ErrorDeServicio {
  constructor() {
    super('Necesitas ingresar (aunque sea como invitado) para guardar tu progreso.', {
      reintentable: false,
      codigo: 'sin_sesion'
    })
    this.name = 'SinSesion'
  }
}

/** Un error de acceso (login, registro, recuperacion), con mensaje listo para mostrar. */
export class ErrorDeAuth extends ErrorDeServicio {
  constructor(mensaje, opciones) {
    super(mensaje, opciones)
    this.name = 'ErrorDeAuth'
  }
}

/** true cuando el error es de red (no hubo respuesta del servidor). */
export function esErrorDeRed(error) {
  if (!error) return false
  const nombre = error.name ?? ''
  const mensaje = String(error.message ?? '')
  return (
    nombre === 'AuthRetryableFetchError' ||
    nombre === 'TypeError' ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(mensaje)
  )
}

// ---------------------------------------------------------------------------
// Errores de la API de datos (perfiles, historial)
// ---------------------------------------------------------------------------

const RESTRICCIONES = {
  ck_perfiles_invitado:
    'Los invitados no pueden elegir alias: se llaman "Invitado" hasta que crean su cuenta.',
  ck_perfiles_alias:
    'Ese alias no esta permitido. Usa de 3 a 20 caracteres: letras sin tilde, numeros y guion bajo.',
  ck_perfiles_meta: 'Esa meta diaria no es valida.',
  ck_perfiles_avatar: 'Ese avatar no es valido.',
  ck_intentos_aciertos: 'Los aciertos no pueden ser mas que el total de actividades.',
  ck_intentos_total: 'La cantidad de actividades no es valida.'
}

/**
 * Traduce un error de la API de datos (PostgREST) al vocabulario de la app.
 * `que` completa la frase "No pudimos ..." cuando no hay un motivo mas preciso.
 */
export function traducirErrorDeDatos(error, que = 'completar la operacion') {
  if (esErrorDeRed(error)) {
    return new ErrorDeConsulta(
      'No hay conexion con el servidor. Revisa tu conexion e intenta de nuevo.',
      error
    )
  }

  const codigo = error?.code ?? ''
  const mensaje = String(error?.message ?? '')

  // Restriccion de la base que se incumplio: se explica con las reglas del producto.
  if (codigo === '23514') {
    const nombre = Object.keys(RESTRICCIONES).find((k) => mensaje.includes(k))
    if (nombre) return new ErrorDeServicio(RESTRICCIONES[nombre], { codigo, causa: error })
  }

  if (codigo === '23505') {
    return new ErrorDeServicio('Hubo un choque al guardar. Intenta de nuevo.', {
      reintentable: true,
      codigo,
      causa: error
    })
  }

  // Sesion vencida o invalida (PostgREST: PGRST301/PGRST303) o sin permiso.
  if (codigo === 'PGRST301' || codigo === 'PGRST303' || /jwt/i.test(mensaje)) {
    return new ErrorDeServicio('Tu sesion vencio. Volve a ingresar.', { codigo: 'sesion_vencida', causa: error })
  }
  if (codigo === '42501' || /row-level security|permission denied/i.test(mensaje)) {
    return new ErrorDeServicio('No tenes permiso para hacer eso.', { codigo: 'sin_permiso', causa: error })
  }

  return new ErrorDeConsulta(`No pudimos ${que}. Intenta de nuevo en un momento.`, error)
}
