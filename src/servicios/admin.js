/**
 * Panel de administracion (etapa 7).
 *
 * El permiso real esta en la base (supabase/16-administracion.sql): todas las
 * escrituras pasan por funciones admin_* que empiezan verificando es_admin().
 * Ocultar el panel a quien no es administrador es solo comodidad.
 *
 * Lecturas: los administradores ven tambien los borradores (politicas "admin:
 * ver ..."), con las mismas columnas que el publico: las soluciones
 * (opciones.es_correcta, preguntas.explicacion) NO se leen con selects; se
 * piden con admin_obtener_pregunta / admin_listar_banco.
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import { SinConfiguracion, ErrorDeServicio, traducirErrorDeDatos } from '@/servicios/errores.js'

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

const MOTIVOS = {
  sin_permiso_admin: 'Esta operacion es solo para administradores.',
  leccion_incompleta: 'La leccion no se puede publicar: necesita al menos una actividad publicada.',
  pocas_opciones: 'Una pregunta necesita al menos dos opciones.',
  opcion_vacia: 'Hay una opcion sin texto.',
  opciones_repetidas: 'Hay opciones repetidas.',
  una_correcta: 'Tiene que haber exactamente una opcion correcta.',
  falta_confirmacion: 'Para eliminar hay que escribir el identificador exacto.',
  tiene_historial: 'No se puede eliminar: tiene historial (intentos o partidas). Despublicalo.',
  desafio_congelado: 'El desafio ya tiene partidas: sus reglas y preguntas no se pueden cambiar. Crea otra version.',
  no_encontrado: 'No existe ese elemento.'
}

function traducir(error, que) {
  const motivo = error?.hint && MOTIVOS[error.hint]
  if (motivo) return new ErrorDeServicio(motivo, { codigo: error.hint, causa: error })
  // Restricciones de la tabla (formato de id, largos, colores): el mensaje de la base ya es claro.
  if (error?.code === '23514' || error?.code === '23505' || error?.code === '22P02') {
    return new ErrorDeServicio(`No se pudo ${que}: ${error.message}`, { codigo: error.code, causa: error })
  }
  if (error?.code === '23503') {
    return new ErrorDeServicio(`No se pudo ${que}: falta el elemento relacionado o tiene historial.`, { codigo: error.code, causa: error })
  }
  return traducirErrorDeDatos(error, que)
}

async function rpc(nombre, args, que) {
  const { data, error } = await cliente().rpc(nombre, args)
  if (error) throw traducir(error, que)
  return data
}

async function leer(consulta, que) {
  const { data, error } = await consulta
  if (error) throw traducir(error, que)
  return data ?? []
}

// --- Permiso ------------------------------------------------------------------
export async function soyAdmin() {
  try {
    return Boolean(await rpc('es_admin', {}, 'verificar el permiso'))
  } catch {
    return false
  }
}

// --- Contenido -----------------------------------------------------------------
export const listarCursos = () =>
  leer(cliente().from('cursos').select('id, nombre, descripcion, nivel, icono, color, color_texto, estado, requisito, horas_estimadas, etiquetas, orden').order('orden'), 'cargar los cursos')

export const listarUnidades = (cursoId) =>
  leer(cliente().from('unidades').select('id, curso_id, orden, titulo, descripcion, icono, color, estado, temas').eq('curso_id', cursoId).order('orden'), 'cargar las unidades')

export const listarLecciones = (unidadId) =>
  leer(cliente().from('lecciones').select('id, unidad_id, orden, titulo, descripcion, icono, xp, explicacion, ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado').eq('unidad_id', unidadId).order('orden'), 'cargar las lecciones')

export const listarPreguntas = (leccionId) =>
  leer(cliente().from('preguntas').select('id, leccion_id, orden, enunciado, codigo, estado').eq('leccion_id', leccionId).order('orden'), 'cargar las preguntas')

export const guardarCurso = (c) => rpc('admin_guardar_curso', { p: c }, 'guardar el curso')
export const guardarUnidad = (u) => rpc('admin_guardar_unidad', { p: u }, 'guardar la unidad')
export const guardarLeccion = (l) => rpc('admin_guardar_leccion', { p: l }, 'guardar la leccion')
export const guardarPregunta = (q) => rpc('admin_guardar_pregunta', { p: q }, 'guardar la pregunta')
export const obtenerPregunta = (id) => rpc('admin_obtener_pregunta', { p_id: id }, 'cargar la pregunta')

export const cambiarEstado = (tipo, id, estado) =>
  rpc('admin_cambiar_estado', { p_tipo: tipo, p_id: id, p_estado: estado }, 'cambiar el estado')

export const eliminar = (tipo, id, confirmacion) =>
  rpc('admin_eliminar', { p_tipo: tipo, p_id: id, p_confirmacion: confirmacion }, 'eliminar')

// --- Eventos y desafios ----------------------------------------------------------
export const listarEventosAdmin = () =>
  leer(cliente().from('eventos').select('id, nombre, descripcion, lugar, estado, abre_en, cierra_en').order('creado_en', { ascending: false }), 'cargar los eventos')

export const listarDesafiosAdmin = (eventoId) =>
  leer(cliente().from('desafios').select('id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos, puntos_por_acierto, intentos_permitidos, gracia_segundos, estado, version, congelado_en').eq('evento_id', eventoId).order('orden'), 'cargar los desafios')

export const guardarEvento = (e) => rpc('admin_guardar_evento', { p: e }, 'guardar el evento')
export const cambiarEstadoEvento = (id, estado) =>
  rpc('admin_cambiar_estado_evento', { p_id: id, p_estado: estado }, 'cambiar el estado del evento')
export const guardarDesafio = (d) => rpc('admin_guardar_desafio', { p: d }, 'guardar el desafio')
export const nuevaVersionDesafio = (id, nuevoId) =>
  rpc('admin_nueva_version_desafio', { p_id: id, p_nuevo_id: nuevoId }, 'crear la nueva version')
export const listarBanco = (desafioId) => rpc('admin_listar_banco', { p_desafio_id: desafioId }, 'cargar el banco')
export const guardarPreguntaDesafio = (q) =>
  rpc('admin_guardar_pregunta_desafio', { p: q }, 'guardar la pregunta del desafio')
