/**
 * Acceso a los intentos y respuestas de la persona de la sesion actual.
 *
 * Desde la etapa 5 el cliente NO escribe resultados. Manda solo identificadores
 * (que leccion, que actividad, que opcion) a tres funciones del servidor
 * (supabase/09-funciones-intentos.sql), que corrigen, guardan y calculan
 * aciertos, errores, porcentaje, estado y aprobacion:
 *
 *   iniciarIntento(leccionId)      -> rpc iniciar_intento
 *   responderActividad(...)        -> rpc responder_actividad
 *   abandonarIntento(intentoId)    -> rpc abandonar_intento
 *
 * Las lecturas (historial, intento en curso, respuestas) son selects comunes:
 * las politicas de RLS dejan ver solo lo propio.
 *
 * Peticiones repetidas: el id de cada intento lo genera el cliente ANTES de
 * pedirlo. Si la conexion se corta y se reintenta con el mismo id, el servidor
 * devuelve el intento que ya existe. Con las respuestas pasa lo mismo: hay una
 * sola por actividad e intento, y repetirla devuelve la guardada.
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import {
  SinConfiguracion,
  ErrorDeServicio,
  ErrorDeConsulta,
  esErrorDeRed,
  traducirErrorDeDatos
} from '@/servicios/errores.js'

const COLUMNAS_INTENTO =
  'id, leccion_id, numero, estado, origen, total_actividades, aciertos, errores, ' +
  'porcentaje, aprobado, iniciado_en, finalizado_en'

const COLUMNAS_RESPUESTA = 'intento_id, pregunta_id, opcion_id, es_correcta, orden, respondida_en'

/** Vidas con las que arranca cada intento (regla de la etapa 2; el servidor usa la misma). */
export const VIDAS_POR_INTENTO = 3

export const ESTADO_INTENTO = Object.freeze({
  EN_CURSO: 'en_curso',
  COMPLETADO: 'completado',
  SIN_VIDAS: 'sin_vidas',
  ABANDONADO: 'abandonado'
})

export const ETIQUETA_ESTADO_INTENTO = Object.freeze({
  en_curso: 'En curso',
  completado: 'Completado',
  sin_vidas: 'Sin vidas',
  abandonado: 'Abandonado'
})

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

/** Pasa un intento (fila o resumen del servidor) al vocabulario de la app. */
export function aIntento(fila) {
  const aciertos = fila.aciertos ?? 0
  const errores = fila.errores ?? 0
  return {
    id: fila.id,
    leccionId: fila.leccion_id,
    numero: fila.numero,
    estado: fila.estado,
    origen: fila.origen ?? 'servidor',
    total: fila.total_actividades,
    aciertos,
    errores,
    respondidas: aciertos + errores,
    porcentaje: fila.porcentaje ?? 0,
    aprobado: Boolean(fila.aprobado),
    vidas: Math.max(0, VIDAS_POR_INTENTO - errores),
    iniciadoEn: fila.iniciado_en,
    finalizadoEn: fila.finalizado_en ?? null,
    // Fecha que cuenta para la racha y el calendario: cuando termino (o empezo).
    fecha: fila.finalizado_en ?? fila.iniciado_en
  }
}

function aRespuesta(fila) {
  return {
    intentoId: fila.intento_id,
    preguntaId: fila.pregunta_id,
    opcionId: fila.opcion_id,
    correcta: Boolean(fila.es_correcta),
    orden: fila.orden,
    respondidaEn: fila.respondida_en
  }
}

/**
 * Mensajes para los errores que lanzan las funciones del servidor. Llegan con un
 * HINT fijo (ver 09-funciones-intentos.sql) que no depende del texto.
 */
const MOTIVOS = {
  sin_sesion: 'Necesitas ingresar (aunque sea como invitado) para guardar tu progreso.',
  leccion_bloqueada: 'Esta leccion todavia no esta habilitada: primero completa las anteriores.',
  tope_invitado:
    'Llegaste al limite de intentos como invitado. Crea tu cuenta para seguir guardando tu progreso.',
  sin_actividades: 'Esta leccion todavia no tiene actividades publicadas.',
  intento_no_encontrado: 'No encontramos ese intento entre los tuyos.',
  intento_cerrado: 'Este intento ya termino. Empeza uno nuevo para seguir practicando.',
  intento_de_otra_leccion: 'Ese intento es de otra leccion.',
  intento_no_disponible: 'No pudimos crear el intento. Volve a intentarlo.',
  actividad_no_encontrada: 'Esa actividad ya no esta disponible en esta leccion.',
  opcion_no_encontrada: 'Esa opcion no pertenece a la actividad.',
  datos_incompletos: 'Faltan datos para guardar la respuesta.'
}

function traducir(error, que) {
  const motivo = error?.hint && MOTIVOS[error.hint]
  if (motivo) {
    return new ErrorDeServicio(motivo, {
      reintentable: error.hint === 'intento_no_disponible',
      codigo: error.hint,
      causa: error
    })
  }
  return traducirErrorDeDatos(error, que)
}

/** Genera el id del intento en el cliente (ver "Peticiones repetidas" arriba). */
export function nuevoIdDeIntento() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // Navegadores viejos: uuid v4 con getRandomValues.
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// ---------------------------------------------------------------------------
// Escrituras: siempre por funciones del servidor
// ---------------------------------------------------------------------------

/**
 * Empieza un intento de la leccion. Si ya habia uno en curso de esa leccion, el
 * servidor lo marca abandonado (no lo borra). Devuelve el intento creado; con
 * el mismo `intentoId` se puede repetir sin crear otro.
 */
export async function iniciarIntento(leccionId, intentoId = nuevoIdDeIntento()) {
  const { data, error } = await cliente().rpc('iniciar_intento', {
    p_intento_id: intentoId,
    p_leccion_id: leccionId
  })
  if (error) throw traducir(error, 'empezar el intento')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo el intento.')
  return { ...aIntento(data), repetida: Boolean(data.repetida) }
}

/**
 * Manda la opcion elegida. El servidor corrige, guarda y recalcula el intento.
 * Devuelve { correcta, explicacion, opcionId, opcionCorrectaId,
 * opcionCorrectaTexto, repetida, intento }.
 *
 * `repetida` = esa actividad ya estaba respondida en este intento: lo que vuelve
 * es la respuesta GUARDADA (puede ser otra opcion si la primera peticion llego).
 */
export async function responderActividad(intentoId, preguntaId, opcionId) {
  const { data, error } = await cliente().rpc('responder_actividad', {
    p_intento_id: intentoId,
    p_pregunta_id: preguntaId,
    p_opcion_id: opcionId
  })
  if (error) throw traducir(error, 'guardar tu respuesta')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo tu respuesta.')
  return {
    preguntaId: data.pregunta_id,
    opcionId: data.opcion_id,
    correcta: Boolean(data.correcta),
    explicacion: data.explicacion ?? '',
    opcionCorrectaId: data.opcion_correcta_id ?? null,
    opcionCorrectaTexto: data.opcion_correcta_texto ?? null,
    repetida: Boolean(data.repetida),
    intento: aIntento(data.intento)
  }
}

/** Cierra un intento en curso. Si ya estaba cerrado, no cambia nada. */
export async function abandonarIntento(intentoId) {
  const { data, error } = await cliente().rpc('abandonar_intento', { p_intento_id: intentoId })
  if (error) throw traducir(error, 'cerrar el intento')
  return aIntento(data)
}

// ---------------------------------------------------------------------------
// Lecturas (RLS: solo lo propio)
// ---------------------------------------------------------------------------

/** Todos los intentos propios, del mas viejo al mas nuevo. */
export async function listarMisIntentos() {
  const { data, error } = await cliente()
    .from('intentos')
    .select(COLUMNAS_INTENTO)
    .order('iniciado_en', { ascending: true })
    .order('numero', { ascending: true })

  if (error) throw traducirErrorDeDatos(error, 'cargar tu progreso')
  return (data ?? []).map(aIntento)
}

/** Un intento propio por id (null si no existe o no es tuyo). */
export async function obtenerIntento(intentoId) {
  const { data, error } = await cliente()
    .from('intentos')
    .select(COLUMNAS_INTENTO)
    .eq('id', intentoId)
    .maybeSingle()

  if (error) throw traducirErrorDeDatos(error, 'cargar ese intento')
  return data ? aIntento(data) : null
}

/** El intento EN CURSO de una leccion, para retomarlo (null si no hay). */
export async function obtenerIntentoEnCurso(leccionId) {
  const { data, error } = await cliente()
    .from('intentos')
    .select(COLUMNAS_INTENTO)
    .eq('leccion_id', leccionId)
    .eq('estado', ESTADO_INTENTO.EN_CURSO)
    .maybeSingle()

  if (error) throw traducirErrorDeDatos(error, 'buscar tu intento en curso')
  return data ? aIntento(data) : null
}

/** Respuestas guardadas de un intento, en el orden en que se dieron. */
export async function listarRespuestas(intentoId) {
  const { data, error } = await cliente()
    .from('respuestas')
    .select(COLUMNAS_RESPUESTA)
    .eq('intento_id', intentoId)
    .order('orden', { ascending: true })

  if (error) throw traducirErrorDeDatos(error, 'cargar tus respuestas')
  return (data ?? []).map(aRespuesta)
}

/** Borra TODO el historial propio (la opcion "reiniciar progreso"). */
export async function borrarMiHistorial(usuarioId) {
  const { error } = await cliente().from('intentos').delete().eq('usuario_id', usuarioId)
  if (error) throw traducirErrorDeDatos(error, 'borrar tu progreso')
}

export { esErrorDeRed }
