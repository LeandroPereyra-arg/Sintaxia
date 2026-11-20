import { TIPO_EJERCICIO } from './tiposEjercicio.js'

/**
 * Funciones para escribir el contenido de los cursos en forma compacta
 * (src/data/cursosNuevos.js y src/data/javascriptCompleto.js).
 */

const LETRAS = ['a', 'b', 'c', 'd']

/** Numero estable a partir de un texto (para repartir las respuestas correctas). */
function hash(texto) {
  let h = 0
  for (const c of texto) h = (h * 31 + c.codePointAt(0)) >>> 0
  return h
}

/**
 * Una actividad de opcion multiple. `correcta` es el indice (0 a 3) de la opcion buena.
 * La opcion correcta se cambia de lugar con la de una posicion que sale del id: asi
 * queda repartida entre a, b, c y d y no se puede adivinar por la posicion.
 */
export function actividad(leccionId, n, { consigna, codigo = null, opciones, correcta, explicacion }) {
  const id = `${leccionId}-a${n}`
  const lugar = hash(id) % opciones.length
  const orden = [...opciones]
  ;[orden[correcta], orden[lugar]] = [orden[lugar], orden[correcta]]
  return {
    id,
    leccionId,
    tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
    consigna,
    codigo,
    opciones: orden.map((texto, i) => ({ id: LETRAS[i], texto })),
    respuesta: LETRAS[lugar],
    explicacion
  }
}

export function leccion(unidadId, numero, { titulo, descripcion, icono, xp = 10, explicacion, ejemplo, actividades }) {
  const id = `${unidadId}-l${numero}`
  return {
    id,
    unidadId,
    numero,
    titulo,
    descripcion,
    icono,
    xp,
    teoria: { explicacion, ejemplo },
    ejercicios: actividades.map((a, i) => actividad(id, i + 1, a))
  }
}

export function unidad(cursoId, prefijo, numero, { titulo, descripcion, icono, color, temas, publicada = false }) {
  return { id: `${prefijo}-u${numero}`, cursoId, numero, titulo, descripcion, icono, color, temas, publicada }
}
