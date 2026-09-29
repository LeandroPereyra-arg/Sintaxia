/**
 * Modulo de acceso a datos del contenido educativo.
 *
 * Es el UNICO lugar de la aplicacion que habla con la base. Las pantallas no
 * importan `@/data/...` ni `@/servicios/supabase.js`: le piden todo a este
 * modulo, que traduce las filas de PostgreSQL a los objetos que usan las
 * vistas (numero, teoria, ejercicios, ...).
 *
 * Desde la etapa 3 los datos salen de Supabase. Los archivos de `src/data/`
 * quedaron como fuente para generar la carga inicial (supabase/02-datos-iniciales.sql)
 * y para la API de cuentas de la etapa 2; la aplicacion ya no los lee.
 *
 * Reglas importantes:
 *
 *   · Las consultas piden las columnas UNA POR UNA, nunca `select *`. El rol
 *     publico no tiene permiso sobre las columnas de la solucion
 *     (preguntas.explicacion y opciones.es_correcta), asi que un `select *`
 *     fallaria. Eso es a proposito: las soluciones no viajan al navegador.
 *
 *   · La correccion de una respuesta la hace la base con la funcion
 *     public.comprobar_respuesta (ver supabase/04-funcion-comprobar.sql).
 *
 *   · Los errores se dividen en dos: los que tiene sentido REINTENTAR (se cayo
 *     la conexion) y los que no (ese contenido no existe). Las pantallas usan
 *     esa diferencia para decidir si ofrecen el boton de reintentar.
 */
import { supabase, hayConfiguracion, MENSAJE_SIN_CONFIGURACION } from '@/servicios/supabase.js'
import {
  ESTADO_CURSO,
  ETIQUETA_ESTADO_CURSO,
  ESTADO_UNIDAD,
  ETIQUETA_ESTADO_UNIDAD,
  PUBLICACION,
  PUBLICACION_UNIDAD
} from '@/constantes/estados.js'

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

/** Base de todos los errores del contenido. */
export class ErrorDeContenido extends Error {
  constructor(mensaje, { reintentable = false, causa = null } = {}) {
    super(mensaje)
    this.name = 'ErrorDeContenido'
    this.reintentable = reintentable
    this.causa = causa
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

/**
 * Codigos de PostgreSQL que significan "esto no existe" y no "fallo la red".
 * P0002 lo levanta a proposito comprobar_respuesta; PGRST116 lo devuelve
 * PostgREST cuando una consulta de una sola fila no encontro nada.
 */
const CODIGOS_NO_ENCONTRADO = new Set(['P0002', 'PGRST116'])

/** Traduce el error que devuelve Supabase al vocabulario de la aplicacion. */
function traducirError(error, que, id) {
  if (CODIGOS_NO_ENCONTRADO.has(error?.code)) {
    return new ContenidoNoEncontrado(que, id)
  }
  return new ErrorDeConsulta(
    'No pudimos conectarnos con el servidor de contenidos. Revisa tu conexion e intenta de nuevo.',
    error
  )
}

/** Devuelve el cliente ya configurado o corta con un error entendible. */
function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

// ---------------------------------------------------------------------------
// Columnas que se piden en cada consulta.
// Se enumeran a mano justamente para dejar afuera las soluciones.
// ---------------------------------------------------------------------------

const COLUMNAS_CURSO =
  'id, nombre, descripcion, nivel, icono, color, color_texto, estado, requisito, ' +
  'horas_estimadas, unidades_previstas, lecciones_previstas, etiquetas, orden'

const COLUMNAS_UNIDAD = 'id, curso_id, orden, titulo, descripcion, icono, color, estado, temas'

const COLUMNAS_LECCION =
  'id, unidad_id, orden, titulo, descripcion, icono, xp, explicacion, ' +
  'ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado'

// Sin `explicacion`: esa columna es la solucion y el rol publico no la puede leer.
const COLUMNAS_PREGUNTA = 'id, leccion_id, orden, tipo, enunciado, codigo'

// Sin `es_correcta`, por el mismo motivo.
const COLUMNAS_OPCION = 'id, pregunta_id, orden, texto'

// ---------------------------------------------------------------------------
// Traduccion de filas a los objetos que usan las pantallas
// ---------------------------------------------------------------------------

function aCurso(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    nivel: fila.nivel,
    icono: fila.icono,
    color: fila.color,
    colorTexto: fila.color_texto,
    estado: fila.estado,
    requisito: fila.requisito ?? null,
    horasEstimadas: fila.horas_estimadas ?? null,
    totalUnidades: fila.unidades_previstas ?? null,
    totalLecciones: fila.lecciones_previstas ?? null,
    etiquetas: fila.etiquetas ?? [],
    orden: fila.orden,
    // La ruta la arma el modulo a partir del estado, asi la base no guarda
    // nada que dependa de como se llaman las pantallas.
    ruta: fila.estado === ESTADO_CURSO.DISPONIBLE ? { name: 'curso', params: { cursoId: fila.id } } : null
  }
}

function aUnidad(fila) {
  return {
    id: fila.id,
    cursoId: fila.curso_id,
    numero: fila.orden,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    icono: fila.icono,
    color: fila.color,
    publicacion: fila.estado,
    /** true cuando la unidad todavia no tiene lecciones publicadas. */
    sinContenido: fila.estado !== PUBLICACION_UNIDAD.PUBLICADA,
    temas: fila.temas ?? []
  }
}

function aLeccion(fila) {
  return {
    id: fila.id,
    unidadId: fila.unidad_id,
    numero: fila.orden,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    icono: fila.icono,
    xp: fila.xp,
    publicacion: fila.estado,
    teoria: {
      explicacion: fila.explicacion,
      ejemplo: fila.ejemplo_codigo
        ? {
            titulo: fila.ejemplo_titulo,
            codigo: fila.ejemplo_codigo,
            nota: fila.ejemplo_nota ?? null
          }
        : null
    }
  }
}

function aActividad(fila, opciones) {
  return {
    id: fila.id,
    leccionId: fila.leccion_id,
    numero: fila.orden,
    tipo: fila.tipo,
    consigna: fila.enunciado,
    codigo: fila.codigo ?? null,
    opciones: opciones.map((opcion) => ({ id: opcion.id, texto: opcion.texto }))
    // Ni `respuesta` ni `explicacion`: esos datos no salen de la base hasta que
    // el estudiante contesta, y salen por comprobarRespuesta().
  }
}

// ---------------------------------------------------------------------------
// Cursos
// ---------------------------------------------------------------------------

/** Todos los cursos visibles del catalogo, en el orden definido en la base. */
export async function listarCursos() {
  const { data, error } = await cliente()
    .from('cursos')
    .select(COLUMNAS_CURSO)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'los cursos')
  return (data ?? []).map(aCurso)
}

/** Un curso por su identificador. */
export async function obtenerCurso(cursoId) {
  const { data, error } = await cliente()
    .from('cursos')
    .select(COLUMNAS_CURSO)
    .eq('id', cursoId)
    .maybeSingle()

  if (error) throw traducirError(error, 'ese curso', cursoId)
  if (!data) throw new ContenidoNoEncontrado('ese curso', cursoId)
  return aCurso(data)
}

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

/** Unidades de UN curso, filtradas por la clave foranea curso_id. */
export async function listarUnidades(cursoId) {
  const { data, error } = await cliente()
    .from('unidades')
    .select(COLUMNAS_UNIDAD)
    .eq('curso_id', cursoId)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'las unidades del curso', cursoId)
  return (data ?? []).map(aUnidad)
}

export async function obtenerUnidad(unidadId) {
  const { data, error } = await cliente()
    .from('unidades')
    .select(COLUMNAS_UNIDAD)
    .eq('id', unidadId)
    .maybeSingle()

  if (error) throw traducirError(error, 'esa unidad', unidadId)
  if (!data) throw new ContenidoNoEncontrado('esa unidad', unidadId)
  return aUnidad(data)
}

// ---------------------------------------------------------------------------
// Lecciones
// ---------------------------------------------------------------------------

/** Lecciones de UNA unidad, filtradas por la clave foranea unidad_id. */
export async function listarLecciones(unidadId) {
  const { data, error } = await cliente()
    .from('lecciones')
    .select(COLUMNAS_LECCION)
    .eq('unidad_id', unidadId)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'las lecciones de la unidad', unidadId)
  return (data ?? []).map(aLeccion)
}

export async function obtenerLeccion(leccionId) {
  const { data, error } = await cliente()
    .from('lecciones')
    .select(COLUMNAS_LECCION)
    .eq('id', leccionId)
    .maybeSingle()

  if (error) throw traducirError(error, 'esa leccion', leccionId)
  if (!data) throw new ContenidoNoEncontrado('esa leccion', leccionId)
  return aLeccion(data)
}

/**
 * Todas las lecciones de un curso, en orden de unidad y de leccion.
 * Se usa para el progreso general y para el mapa del curso.
 */
export async function listarLeccionesDeCurso(cursoId) {
  const unidades = await listarUnidades(cursoId)
  const ids = unidades.map((unidad) => unidad.id)
  if (ids.length === 0) return []

  const { data, error } = await cliente()
    .from('lecciones')
    .select(COLUMNAS_LECCION)
    .in('unidad_id', ids)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'las lecciones del curso', cursoId)

  const posicion = new Map(unidades.map((unidad, indice) => [unidad.id, indice]))
  return (data ?? [])
    .map(aLeccion)
    .sort((a, b) => posicion.get(a.unidadId) - posicion.get(b.unidadId) || a.numero - b.numero)
}

// ---------------------------------------------------------------------------
// Actividades (preguntas y sus opciones)
// ---------------------------------------------------------------------------

/** Trae las opciones de un conjunto de preguntas y las agrupa por pregunta. */
async function opcionesDe(preguntaIds) {
  if (preguntaIds.length === 0) return new Map()

  const { data, error } = await cliente()
    .from('opciones')
    .select(COLUMNAS_OPCION)
    .in('pregunta_id', preguntaIds)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'las opciones de la pregunta')

  const porPregunta = new Map(preguntaIds.map((id) => [id, []]))
  for (const opcion of data ?? []) {
    porPregunta.get(opcion.pregunta_id)?.push(opcion)
  }
  return porPregunta
}

/** Actividades de UNA leccion, con sus opciones, en orden. */
export async function listarActividades(leccionId) {
  const { data, error } = await cliente()
    .from('preguntas')
    .select(COLUMNAS_PREGUNTA)
    .eq('leccion_id', leccionId)
    .order('orden', { ascending: true })

  if (error) throw traducirError(error, 'las actividades de la leccion', leccionId)

  const preguntas = data ?? []
  const opciones = await opcionesDe(preguntas.map((pregunta) => pregunta.id))
  return preguntas.map((pregunta) => aActividad(pregunta, opciones.get(pregunta.id) ?? []))
}

/** Cuantas actividades tiene una leccion, sin traerlas. */
export async function contarActividades(leccionId) {
  const { count, error } = await cliente()
    .from('preguntas')
    .select('id', { count: 'exact', head: true })
    .eq('leccion_id', leccionId)

  if (error) throw traducirError(error, 'las actividades de la leccion', leccionId)
  return count ?? 0
}

export async function obtenerActividad(actividadId) {
  const { data, error } = await cliente()
    .from('preguntas')
    .select(COLUMNAS_PREGUNTA)
    .eq('id', actividadId)
    .maybeSingle()

  if (error) throw traducirError(error, 'esa actividad', actividadId)
  if (!data) throw new ContenidoNoEncontrado('esa actividad', actividadId)

  const opciones = await opcionesDe([data.id])
  return aActividad(data, opciones.get(data.id) ?? [])
}

/** Leccion + sus actividades, que es lo que necesita la pantalla de ejercicios. */
export async function obtenerLeccionConActividades(leccionId) {
  const leccion = await obtenerLeccion(leccionId)
  leccion.ejercicios = await listarActividades(leccionId)
  return leccion
}

// ---------------------------------------------------------------------------
// Correccion de respuestas
// ---------------------------------------------------------------------------

/**
 * Le pregunta a la base si la opcion elegida es la correcta.
 *
 * La aplicacion NUNCA se descarga las soluciones: manda el id de la pregunta y
 * el de la opcion, y la funcion del servidor responde. Si la llamada falla, se
 * lanza un error reintentable y la pantalla NO da la respuesta por incorrecta.
 *
 * Devuelve { correcta, explicacion, opcionCorrectaId, opcionCorrectaTexto }.
 */
export async function comprobarRespuesta(preguntaId, opcionId) {
  const { data, error } = await cliente().rpc('comprobar_respuesta', {
    p_pregunta_id: preguntaId,
    p_opcion_id: opcionId
  })

  if (error) throw traducirError(error, 'esa actividad', preguntaId)
  if (!data) throw new ErrorDeConsulta('El servidor no devolvio una respuesta.')

  return {
    correcta: Boolean(data.correcta),
    explicacion: data.explicacion ?? '',
    opcionCorrectaId: data.opcion_correcta_id ?? null,
    opcionCorrectaTexto: data.opcion_correcta_texto ?? null
  }
}

// ---------------------------------------------------------------------------
// Constantes que las vistas necesitan junto con el contenido
// ---------------------------------------------------------------------------

export {
  ESTADO_CURSO,
  ETIQUETA_ESTADO_CURSO,
  ESTADO_UNIDAD,
  ETIQUETA_ESTADO_UNIDAD,
  PUBLICACION,
  PUBLICACION_UNIDAD
}
