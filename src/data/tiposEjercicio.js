/**
 * Tipos de ejercicio soportados por el motor de lecciones.
 *
 * Cada tipo define que campos necesita un ejercicio y que componente lo
 * renderiza (ver `src/components/ejercicios/`).
 *
 * OPCION_MULTIPLE  -> opciones: [{ id, texto }]        respuesta: id correcto
 * VERDADERO_FALSO  -> (sin opciones)                   respuesta: true | false
 * COMPLETAR        -> plantilla con "___"              respuesta: [alternativas validas]
 * ORDENAR          -> fragmentos: [{ id, texto }]      respuesta: [ids en orden]
 */
export const TIPO_EJERCICIO = {
  OPCION_MULTIPLE: 'opcion-multiple',
  VERDADERO_FALSO: 'verdadero-falso',
  COMPLETAR: 'completar',
  ORDENAR: 'ordenar'
}

/** Nombre legible de cada tipo, para mostrar en la cabecera del ejercicio. */
export const ETIQUETA_TIPO_EJERCICIO = {
  [TIPO_EJERCICIO.OPCION_MULTIPLE]: 'Elegi la opcion correcta',
  [TIPO_EJERCICIO.VERDADERO_FALSO]: 'Verdadero o falso',
  [TIPO_EJERCICIO.COMPLETAR]: 'Completa el codigo',
  [TIPO_EJERCICIO.ORDENAR]: 'Ordena los bloques'
}
