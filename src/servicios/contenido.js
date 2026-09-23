/**
 * Modulo de acceso a datos del contenido educativo.
 *
 * Es el UNICO lugar de la aplicacion que sabe de donde salen los cursos, las
 * unidades, las lecciones y las actividades. Las pantallas no importan nunca
 * `@/data/...` directamente: le piden todo a este modulo.
 *
 * Hoy los datos son archivos JavaScript de prueba (`src/data/`). Cuando el
 * contenido pase a la base compartida, se cambia solo este archivo por las
 * consultas correspondientes y ninguna pantalla se entera.
 *
 * Por eso todas las funciones son ASINCRONAS aunque hoy respondan al instante:
 * asi la firma ya es la misma que va a tener cuando por detras haya un `fetch`.
 */
import { cursos as cursosPrueba, ESTADO_CURSO } from '@/data/cursos.js'
import { unidadesJavaScript, ESTADO_UNIDAD } from '@/data/unidades.js'
import { lecciones as leccionesPrueba } from '@/data/lecciones/index.js'

/** Error de contenido no encontrado, para que las vistas lo distingan. */
export class ContenidoNoEncontrado extends Error {
  constructor(que, id) {
    super(`No existe ${que} con id "${id}".`)
    this.name = 'ContenidoNoEncontrado'
    this.que = que
    this.id = id
  }
}

/** Copia defensiva: que una pantalla no pueda modificar el contenido por error. */
function copiar(valor) {
  return valor === null || valor === undefined ? valor : structuredClone(valor)
}

// ---------------------------------------------------------------------------
// Cursos
// ---------------------------------------------------------------------------

export async function listarCursos() {
  return copiar(cursosPrueba)
}

export async function obtenerCurso(cursoId) {
  const curso = cursosPrueba.find((c) => c.id === cursoId)
  if (!curso) throw new ContenidoNoEncontrado('el curso', cursoId)
  return copiar(curso)
}

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

export async function listarUnidades(cursoId) {
  return copiar(unidadesJavaScript.filter((u) => u.cursoId === cursoId))
}

export async function obtenerUnidad(unidadId) {
  const unidad = unidadesJavaScript.find((u) => u.id === unidadId)
  if (!unidad) throw new ContenidoNoEncontrado('la unidad', unidadId)
  return copiar(unidad)
}

// ---------------------------------------------------------------------------
// Lecciones
// ---------------------------------------------------------------------------

export async function listarLecciones(unidadId) {
  return copiar(
    leccionesPrueba
      .filter((l) => l.unidadId === unidadId)
      .sort((a, b) => a.numero - b.numero)
  )
}

export async function obtenerLeccion(leccionId) {
  const leccion = leccionesPrueba.find((l) => l.id === leccionId)
  if (!leccion) throw new ContenidoNoEncontrado('la leccion', leccionId)
  return copiar(leccion)
}

/** Lecciones de todo un curso, en orden. Sirve para el progreso general. */
export async function listarLeccionesDeCurso(cursoId) {
  const unidades = await listarUnidades(cursoId)
  const ids = new Set(unidades.map((u) => u.id))
  return copiar(leccionesPrueba.filter((l) => ids.has(l.unidadId)))
}

// ---------------------------------------------------------------------------
// Actividades
// ---------------------------------------------------------------------------

export async function listarActividades(leccionId) {
  const leccion = await obtenerLeccion(leccionId)
  return leccion.ejercicios
}

export async function obtenerActividad(actividadId) {
  for (const leccion of leccionesPrueba) {
    const actividad = leccion.ejercicios.find((e) => e.id === actividadId)
    if (actividad) return copiar(actividad)
  }
  throw new ContenidoNoEncontrado('la actividad', actividadId)
}

// ---------------------------------------------------------------------------
// Constantes que las vistas necesitan junto con el contenido
// ---------------------------------------------------------------------------

export { ESTADO_CURSO, ESTADO_UNIDAD }
