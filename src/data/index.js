/**
 * Punto de entrada unico de la capa de datos.
 * Las vistas y los componentes importan siempre desde `@/data`.
 */
export { cursos, obtenerCurso, ESTADO_CURSO, ETIQUETA_ESTADO_CURSO } from './cursos.js'
export {
  unidadesJavaScript,
  obtenerUnidad,
  ESTADO_UNIDAD,
  ETIQUETA_ESTADO_UNIDAD
} from './unidades.js'
export { TIPO_EJERCICIO, ETIQUETA_TIPO_EJERCICIO } from './tiposEjercicio.js'
export {
  lecciones,
  leccionesDeUnidad,
  obtenerLeccion,
  xpDeUnidad
} from './lecciones/index.js'
