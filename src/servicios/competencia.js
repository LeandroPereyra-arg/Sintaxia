/**
 * Acceso a la competencia: eventos de expo, desafios y partidas.
 *
 * Igual que el progreso (etapa 5), el cliente NO escribe resultados. Manda solo
 * identificadores a las funciones del servidor (supabase/12-funciones-competencia.sql):
 *
 *   iniciarPartida(desafioId)          -> rpc iniciar_partida
 *   obtenerPartida(partidaId)          -> rpc obtener_partida
 *   responderPartida(...)              -> rpc responder_partida
 *   finalizarPartida(partidaId)        -> rpc finalizar_partida
 *
 * El servidor fija las preguntas, mide el tiempo, corrige y calcula el puntaje.
 * Las soluciones del desafio nunca llegan al cliente: la respuesta dice si
 * acerto, no cual era la correcta.
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import {
  SinConfiguracion,
  ErrorDeServicio,
  ErrorDeConsulta,
  ContenidoNoEncontrado,
  traducirErrorDeDatos
} from '@/servicios/errores.js'
import { nuevoIdDeIntento } from '@/servicios/progreso.js'

export const ESTADO_PARTIDA = Object.freeze({
  EN_CURSO: 'en_curso',
  FINALIZADA: 'finalizada',
  VENCIDA: 'vencida'
})

export const ETIQUETA_DIFICULTAD = Object.freeze({ facil: 'Facil', media: 'Media', dificil: 'Dificil' })

const COLUMNAS_EVENTO = 'id, nombre, descripcion, lugar, estado, abre_en, cierra_en'
const COLUMNAS_DESAFIO =
  'id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos, puntos_por_acierto, ' +
  'intentos_permitidos, estado, version'
const COLUMNAS_PARTIDA =
  'id, desafio_id, evento_id, numero, estado, total_preguntas, aciertos, errores, puntaje, ' +
  'puntos_por_acierto, duracion_segundos, iniciada_en, vence_en, finalizada_en, duracion_ms'

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

function aEvento(f) {
  return {
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    lugar: f.lugar,
    estado: f.estado,
    abreEn: f.abre_en,
    cierraEn: f.cierra_en
  }
}

function aDesafio(f) {
  return {
    id: f.id,
    eventoId: f.evento_id,
    orden: f.orden,
    nombre: f.nombre,
    descripcion: f.descripcion,
    dificultad: f.dificultad,
    duracionSegundos: f.duracion_segundos,
    puntosPorAcierto: f.puntos_por_acierto,
    intentosPermitidos: f.intentos_permitidos,
    estado: f.estado,
    version: f.version
  }
}

/** Partida (fila o resumen del servidor) en el vocabulario de la app. */
export function aPartida(f) {
  const aciertos = f.aciertos ?? 0
  const errores = f.errores ?? 0
  return {
    id: f.id,
    desafioId: f.desafio_id,
    eventoId: f.evento_id,
    numero: f.numero,
    estado: f.estado,
    valida: f.estado === ESTADO_PARTIDA.FINALIZADA,
    total: f.total_preguntas,
    respondidas: aciertos + errores,
    aciertos,
    errores,
    puntaje: f.puntaje ?? 0,
    puntajeMaximo: f.puntaje_maximo ?? f.total_preguntas * f.puntos_por_acierto,
    puntosPorAcierto: f.puntos_por_acierto,
    duracionSegundos: f.duracion_segundos,
    iniciadaEn: f.iniciada_en,
    venceEn: f.vence_en,
    finalizadaEn: f.finalizada_en ?? null,
    duracionMs: f.duracion_ms ?? null,
    /** Lo que queda segun el SERVIDOR en el momento de la respuesta. */
    segundosRestantes: f.segundos_restantes ?? null,
    preguntas: (f.preguntas ?? []).map((q) => ({
      id: q.id,
      orden: q.orden,
      enunciado: q.enunciado,
      codigo: q.codigo,
      opciones: q.opciones ?? [],
      respuesta: q.respuesta
        ? { opcionId: q.respuesta.opcion_id, correcta: q.respuesta.correcta, puntos: q.respuesta.puntos }
        : null
    })),
    retomada: Boolean(f.retomada),
    repetida: Boolean(f.repetida)
  }
}

const MOTIVOS = {
  sin_sesion: 'Necesitas ingresar (aunque sea como invitado) para jugar.',
  desafio_no_disponible: 'Ese desafio no esta disponible.',
  evento_cerrado: 'El evento no esta abierto para jugar en este momento.',
  sin_intentos: 'Ya usaste todos los intentos de este desafio.',
  sin_preguntas: 'Este desafio todavia no tiene preguntas.',
  partida_no_encontrada: 'No encontramos esa partida entre las tuyas.',
  partida_no_disponible: 'No pudimos crear la partida. Volve a intentarlo.',
  partida_de_otro_desafio: 'Esa partida es de otro desafio.',
  partida_cerrada: 'Esta partida ya termino.',
  partida_vencida: 'Se termino el tiempo de esta partida.',
  pregunta_ajena: 'Esa pregunta no es de esta partida.',
  opcion_no_encontrada: 'Esa opcion no pertenece a la pregunta.',
  datos_incompletos: 'Faltan datos para enviar la respuesta.'
}

function traducir(error, que) {
  const motivo = error?.hint && MOTIVOS[error.hint]
  if (motivo) {
    return new ErrorDeServicio(motivo, {
      reintentable: error.hint === 'partida_no_disponible',
      codigo: error.hint,
      causa: error
    })
  }
  return traducirErrorDeDatos(error, que)
}

// ---------------------------------------------------------------------------
// Eventos y desafios (lectura publica de lo visible)
// ---------------------------------------------------------------------------

export async function listarEventos() {
  const { data, error } = await cliente()
    .from('eventos')
    .select(COLUMNAS_EVENTO)
    .order('creado_en', { ascending: false })
  if (error) throw traducirErrorDeDatos(error, 'cargar los eventos')
  return (data ?? []).map(aEvento)
}

/** Un evento con sus desafios publicados, en orden. */
export async function obtenerEvento(eventoId) {
  const [evento, desafios] = await Promise.all([
    cliente().from('eventos').select(COLUMNAS_EVENTO).eq('id', eventoId).maybeSingle(),
    cliente().from('desafios').select(COLUMNAS_DESAFIO).eq('evento_id', eventoId).order('orden', { ascending: true })
  ])
  if (evento.error) throw traducirErrorDeDatos(evento.error, 'cargar el evento')
  if (!evento.data) throw new ContenidoNoEncontrado('ese evento', eventoId)
  if (desafios.error) throw traducirErrorDeDatos(desafios.error, 'cargar los desafios')
  return { ...aEvento(evento.data), desafios: (desafios.data ?? []).map(aDesafio) }
}

/** Partidas propias de un evento (RLS: solo las de la sesion actual). */
export async function listarMisPartidas(eventoId) {
  const { data, error } = await cliente()
    .from('partidas')
    .select(COLUMNAS_PARTIDA)
    .eq('evento_id', eventoId)
    .order('iniciada_en', { ascending: false })
  if (error) throw traducirErrorDeDatos(error, 'cargar tus partidas')
  return (data ?? []).map(aPartida)
}

// ---------------------------------------------------------------------------
// Partidas: siempre por funciones del servidor
// ---------------------------------------------------------------------------

/**
 * Empieza una partida (o retoma la que estaba en curso de ese desafio). El id lo
 * genera el cliente: repetir con el mismo id devuelve la misma partida.
 */
export async function iniciarPartida(desafioId, partidaId = nuevoIdDeIntento()) {
  const { data, error } = await cliente().rpc('iniciar_partida', {
    p_partida_id: partidaId,
    p_desafio_id: desafioId
  })
  if (error) throw traducir(error, 'empezar la partida')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo la partida.')
  return aPartida(data)
}

export async function obtenerPartida(partidaId) {
  const { data, error } = await cliente().rpc('obtener_partida', { p_partida_id: partidaId })
  if (error) throw traducir(error, 'cargar la partida')
  if (!data) throw new ErrorDeConsulta('El servidor no devolvio la partida.')
  return aPartida(data)
}

/**
 * Manda la opcion elegida. Devuelve { correcta, puntos, opcionId, repetida, partida }.
 * Un envio repetido devuelve lo que ya estaba guardado, sin sumar de nuevo.
 */
export async function responderPartida(partidaId, preguntaId, opcionId) {
  const { data, error } = await cliente().rpc('responder_partida', {
    p_partida_id: partidaId,
    p_pregunta_id: preguntaId,
    p_opcion_id: opcionId
  })
  if (error) throw traducir(error, 'enviar tu respuesta')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo tu respuesta.')
  return {
    preguntaId: data.pregunta_id,
    opcionId: data.opcion_id,
    correcta: Boolean(data.correcta),
    puntos: data.puntos ?? 0,
    repetida: Boolean(data.repetida),
    partida: aPartida(data.partida)
  }
}

/** Cierra la partida. Repetirlo devuelve el resultado ya guardado. */
export async function finalizarPartida(partidaId) {
  const { data, error } = await cliente().rpc('finalizar_partida', { p_partida_id: partidaId })
  if (error) throw traducir(error, 'terminar la partida')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo el cierre.')
  return aPartida(data)
}

/** "1:05" a partir de milisegundos. */
export function formatoTiempo(ms) {
  if (ms == null) return '-'
  const total = Math.round(ms / 100) / 10
  const minutos = Math.floor(total / 60)
  const segundos = total - minutos * 60
  return `${minutos}:${segundos.toFixed(1).padStart(4, '0')}`
}
