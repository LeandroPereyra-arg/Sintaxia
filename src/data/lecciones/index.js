import { leccionesUnidad1 } from './unidad1.js'
import { leccionesUnidad2 } from './unidad2.js'
import { leccionesUnidad3 } from './unidad3.js'
import { leccionesUnidad4 } from './unidad4.js'
import { leccionesUnidad5 } from './unidad5.js'
import { leccionesUnidad6 } from './unidad6.js'

/**
 * Todas las lecciones del curso de JavaScript, en orden.
 * Cada leccion contiene su lista de ejercicios (ver `tiposEjercicio.js`).
 */
export const lecciones = [
  ...leccionesUnidad1,
  ...leccionesUnidad2,
  ...leccionesUnidad3,
  ...leccionesUnidad4,
  ...leccionesUnidad5,
  ...leccionesUnidad6
]

/** Devuelve las lecciones de una unidad. */
export function leccionesDeUnidad(unidadId) {
  return lecciones.filter((leccion) => leccion.unidadId === unidadId)
}

/** Busca una leccion por su id. */
export function obtenerLeccion(leccionId) {
  return lecciones.find((leccion) => leccion.id === leccionId) ?? null
}

/** Suma el XP que otorgan todas las lecciones de una unidad. */
export function xpDeUnidad(unidadId) {
  return leccionesDeUnidad(unidadId).reduce((total, leccion) => total + leccion.xp, 0)
}
