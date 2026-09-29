/**
 * Catalogo del contenido, cacheado en memoria.
 *
 * Entre el modulo de acceso a datos (`@/servicios/contenido.js`, que habla con
 * Supabase) y las pantallas hace falta un lugar donde guardar lo ya consultado:
 *
 *   · la estructura del curso (unidades y lecciones) la necesitan varias
 *     pantallas a la vez y no tiene sentido pedirla una vez por cada una;
 *   · `useProgreso` la consulta de forma SINCRONICA, porque sus funciones se
 *     usan dentro de las plantillas.
 *
 * Por eso este composable mantiene un estado reactivo compartido: se pide una
 * vez, y todas las pantallas leen de ahi. No hay ninguna consulta a Supabase
 * escrita aca: todas pasan por el modulo de acceso a datos.
 *
 * En esta etapa no se pide actualizacion en tiempo real: los cambios que se
 * hagan en Supabase se ven al recargar o al volver a consultar (`forzar: true`).
 */
import { computed, reactive } from 'vue'
import {
  listarCursos,
  obtenerCurso,
  listarUnidades,
  listarLeccionesDeCurso
} from '@/servicios/contenido.js'

/** Curso que se muestra mientras no se elija otro. */
export const CURSO_POR_DEFECTO = 'javascript'

const estado = reactive({
  // Catalogo de cursos
  cursos: [],
  cargandoCursos: false,
  errorCursos: null,
  cursosCargados: false,

  // Estructura del curso activo
  cursoId: CURSO_POR_DEFECTO,
  curso: null,
  unidades: [],
  lecciones: [],
  cargandoCurso: false,
  errorCurso: null,
  cursoCargado: false
})

/** Evita disparar la misma consulta dos veces si dos pantallas la piden juntas. */
let promesaCursos = null
let promesaCurso = null

/** Trae el catalogo de cursos. */
async function cargarCursos({ forzar = false } = {}) {
  if (!forzar && estado.cursosCargados) return estado.cursos
  if (promesaCursos) return promesaCursos

  estado.cargandoCursos = true
  estado.errorCursos = null

  promesaCursos = (async () => {
    try {
      estado.cursos = await listarCursos()
      estado.cursosCargados = true
      return estado.cursos
    } catch (error) {
      estado.errorCursos = error
      estado.cursos = []
      throw error
    } finally {
      estado.cargandoCursos = false
      promesaCursos = null
    }
  })()

  return promesaCursos.catch(() => estado.cursos)
}

/** Trae el curso con toda su estructura: unidades y lecciones, ya ordenadas. */
async function cargarCurso(cursoId = estado.cursoId, { forzar = false } = {}) {
  const cambioDeCurso = cursoId !== estado.cursoId
  if (!forzar && !cambioDeCurso && estado.cursoCargado) return estado.curso
  if (promesaCurso && !cambioDeCurso && !forzar) return promesaCurso

  estado.cursoId = cursoId
  estado.cargandoCurso = true
  estado.errorCurso = null

  promesaCurso = (async () => {
    try {
      const [curso, unidades, lecciones] = await Promise.all([
        obtenerCurso(cursoId),
        listarUnidades(cursoId),
        listarLeccionesDeCurso(cursoId)
      ])
      estado.curso = curso
      estado.unidades = unidades
      estado.lecciones = lecciones
      estado.cursoCargado = true
      return curso
    } catch (error) {
      estado.errorCurso = error
      estado.curso = null
      estado.unidades = []
      estado.lecciones = []
      estado.cursoCargado = false
      throw error
    } finally {
      estado.cargandoCurso = false
      promesaCurso = null
    }
  })()

  return promesaCurso.catch(() => null)
}

// ---------------------------------------------------------------------------
// Consultas sincronicas sobre lo ya cargado
// ---------------------------------------------------------------------------

function unidadesDelCurso() {
  return estado.unidades
}

function obtenerUnidadCacheada(unidadId) {
  return estado.unidades.find((unidad) => unidad.id === unidadId) ?? null
}

function leccionesDeUnidad(unidadId) {
  return estado.lecciones.filter((leccion) => leccion.unidadId === unidadId)
}

function obtenerLeccionCacheada(leccionId) {
  return estado.lecciones.find((leccion) => leccion.id === leccionId) ?? null
}

/** Curso al que pertenece una unidad ya cargada. */
function cursoDeUnidad(unidadId) {
  const unidad = obtenerUnidadCacheada(unidadId)
  if (!unidad) return null
  return estado.curso?.id === unidad.cursoId ? estado.curso : null
}

export function useCatalogo() {
  return {
    estado,
    // acciones
    cargarCursos,
    cargarCurso,
    recargarCursos: () => cargarCursos({ forzar: true }),
    recargarCurso: (cursoId = estado.cursoId) => cargarCurso(cursoId, { forzar: true }),
    // consultas sincronicas
    unidadesDelCurso,
    obtenerUnidadCacheada,
    leccionesDeUnidad,
    obtenerLeccionCacheada,
    cursoDeUnidad,
    // derivados
    hayContenido: computed(() => estado.lecciones.length > 0)
  }
}
