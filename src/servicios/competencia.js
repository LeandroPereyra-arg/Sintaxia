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
  'intentos_permitidos, estado, version, tipo'
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
    version: f.version,
    /** 'preguntas' o 'minijuego' */
    tipo: f.tipo ?? 'preguntas'
  }
}

/** Partida (fila o resumen del servidor) en el vocabulario de la app. */
export function aPartida(f) {
  // Mientras se juega un desafio de preguntas el servidor NO manda aciertos,
  // errores ni puntaje (llegan en null): solo cuantas se respondieron.
  return {
    id: f.id,
    desafioId: f.desafio_id,
    eventoId: f.evento_id,
    tipo: f.tipo ?? 'preguntas',
    numero: f.numero,
    estado: f.estado,
    valida: f.estado === ESTADO_PARTIDA.FINALIZADA,
    total: f.total_preguntas,
    respondidas: f.respondidas ?? (f.aciertos ?? 0) + (f.errores ?? 0),
    aciertos: f.aciertos ?? null,
    errores: f.errores ?? null,
    puntaje: f.puntaje ?? null,
    vidas: f.vidas ?? null,
    puntajeMaximo: f.puntaje_maximo ?? null,
    puntosPorAcierto: f.puntos_por_acierto,
    duracionSegundos: f.duracion_segundos,
    iniciadaEn: f.iniciada_en,
    /** Hora del servidor al responder (para medir el tiempo sin el reloj del celular). */
    ahora: f.ahora ?? null,
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
      respuesta: q.respuesta ? { opcionId: q.respuesta.opcion_id } : null
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
  datos_incompletos: 'Faltan datos para enviar la respuesta.',
  tipo_incorrecto: 'Esa partida es de otro tipo de juego.',
  ficha_ajena: 'Esa ficha no es de esta partida.',
  ficha_fuera_de_tiempo: 'Esa ficha ya no estaba cayendo.'
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
  // Por funcion y no leyendo la tabla: una partida de preguntas en curso no
  // muestra su puntaje (supabase/17-juego-de-la-expo.sql).
  const { data, error } = await cliente().rpc('mis_partidas', { p_evento_id: eventoId })
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
 * Manda la opcion elegida. Devuelve { opcionId, repetida, partida }: el servidor
 * confirma que quedo registrada, pero no dice si estuvo bien (eso se ve al final).
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
    repetida: Boolean(data.repetida),
    partida: aPartida(data.partida)
  }
}

// ---------------------------------------------------------------------------
// Minijuego "Sintax atrapa el codigo" (supabase/17-juego-de-la-expo.sql)
// ---------------------------------------------------------------------------

/** Partida del minijuego: la partida, las rondas con su consigna y las fichas. */
export function aMinijuego(f) {
  return {
    ...aPartida(f),
    rondas: (f.rondas ?? []).map((r) => ({ ronda: r.ronda, desdeMs: r.desde_ms, consigna: r.consigna })),
    // Las fichas llegan SIN saber si son validas: eso lo sabe solo el servidor.
    fichas: (f.fichas ?? []).map((x) => ({
      n: x.n,
      ronda: x.ronda,
      texto: x.texto,
      apareceMs: x.aparece_ms,
      caidaMs: x.caida_ms,
      columna: x.columna,
      atrapada: Boolean(x.atrapada),
      valida: x.valida ?? null
    }))
  }
}

/** Empieza una partida del minijuego. El id lo genera el cliente: repetir no crea otra. */
export async function iniciarMinijuego(desafioId, partidaId) {
  const { data, error } = await cliente().rpc('iniciar_minijuego', { p_partida_id: partidaId, p_desafio_id: desafioId })
  if (error) throw traducir(error, 'empezar el minijuego')
  if (!data) throw new ErrorDeConsulta('El servidor no devolvio la partida.')
  return aMinijuego(data)
}

/**
 * Avisa que Sintax atrapo la ficha n. El servidor dice si era valida y devuelve
 * la partida actualizada (puntaje, vidas, estado). Repetirla no suma de nuevo.
 */
export async function atraparFicha(partidaId, n) {
  const { data, error } = await cliente().rpc('atrapar_ficha', { p_partida_id: partidaId, p_n: n })
  if (error) throw traducir(error, 'registrar la ficha')
  return { n: data.n, valida: Boolean(data.valida), repetida: Boolean(data.repetida), partida: aPartida(data.partida) }
}

/** Cierra la partida. Repetirlo devuelve el resultado ya guardado. */
export async function finalizarPartida(partidaId) {
  const { data, error } = await cliente().rpc('finalizar_partida', { p_partida_id: partidaId })
  if (error) throw traducir(error, 'terminar la partida')
  if (!data) throw new ErrorDeConsulta('El servidor no confirmo el cierre.')
  return aPartida(data)
}

/**
 * "1:05.27" a partir de milisegundos. Con centesimas: el tiempo desempata el
 * ranking, y dos tiempos distintos no deben verse iguales en pantalla.
 */
export function formatoTiempo(ms) {
  if (ms == null) return '-'
  const centesimas = Math.round(ms / 10)
  const minutos = Math.floor(centesimas / 6000)
  const segundos = (centesimas - minutos * 6000) / 100
  return `${minutos}:${segundos.toFixed(2).padStart(5, '0')}`
}
