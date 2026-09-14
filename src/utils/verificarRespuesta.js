import { TIPO_EJERCICIO } from '@/data/tiposEjercicio.js'

/** Normaliza texto libre: sin espacios extra, sin acentos y en minusculas. */
function normalizar(texto) {
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Indica si una respuesta esta vacia (sirve para deshabilitar el boton de comprobar). */
export function respuestaVacia(ejercicio, respuesta) {
  if (respuesta === null || respuesta === undefined) return true
  if (ejercicio.tipo === TIPO_EJERCICIO.COMPLETAR) return normalizar(respuesta) === ''
  if (ejercicio.tipo === TIPO_EJERCICIO.ORDENAR) {
    return !Array.isArray(respuesta) || respuesta.length !== ejercicio.fragmentos.length
  }
  return false
}

/**
 * Compara la respuesta del estudiante con la correcta.
 * Devuelve true/false segun el tipo de ejercicio.
 */
export function esRespuestaCorrecta(ejercicio, respuesta) {
  if (respuestaVacia(ejercicio, respuesta)) return false

  switch (ejercicio.tipo) {
    case TIPO_EJERCICIO.OPCION_MULTIPLE:
      return respuesta === ejercicio.respuesta

    case TIPO_EJERCICIO.VERDADERO_FALSO:
      return respuesta === ejercicio.respuesta

    case TIPO_EJERCICIO.COMPLETAR:
      return ejercicio.respuesta.some(
        (alternativa) => normalizar(alternativa) === normalizar(respuesta)
      )

    case TIPO_EJERCICIO.ORDENAR:
      return (
        respuesta.length === ejercicio.respuesta.length &&
        respuesta.every((id, indice) => id === ejercicio.respuesta[indice])
      )

    default:
      return false
  }
}

/** Texto de la respuesta correcta, para mostrarlo cuando el estudiante falla. */
export function textoRespuestaCorrecta(ejercicio) {
  switch (ejercicio.tipo) {
    case TIPO_EJERCICIO.OPCION_MULTIPLE: {
      const opcion = ejercicio.opciones.find((o) => o.id === ejercicio.respuesta)
      return opcion ? opcion.texto : ''
    }
    case TIPO_EJERCICIO.VERDADERO_FALSO:
      return ejercicio.respuesta ? 'Verdadero' : 'Falso'

    case TIPO_EJERCICIO.COMPLETAR:
      return ejercicio.respuesta[0]

    case TIPO_EJERCICIO.ORDENAR:
      return ejercicio.respuesta
        .map((id) => ejercicio.fragmentos.find((f) => f.id === id)?.texto ?? '')
        .join('\n')

    default:
      return ''
  }
}

/** Mezcla una lista sin modificar la original (para las opciones y fragmentos). */
export function mezclar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
