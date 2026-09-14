/**
 * Unidades del curso de JavaScript.
 *
 * El estado inicial de cada unidad se define aca; el progreso real del
 * estudiante se guarda aparte en el composable `useProgreso`.
 */

/** Estados posibles de una unidad. */
export const ESTADO_UNIDAD = {
  COMPLETADA: 'completada',
  DISPONIBLE: 'disponible',
  BLOQUEADA: 'bloqueada'
}

/** Texto legible para cada estado. */
export const ETIQUETA_ESTADO_UNIDAD = {
  [ESTADO_UNIDAD.COMPLETADA]: 'Completada',
  [ESTADO_UNIDAD.DISPONIBLE]: 'Disponible',
  [ESTADO_UNIDAD.BLOQUEADA]: 'Bloqueada'
}

export const unidadesJavaScript = [
  {
    id: 'js-u1',
    cursoId: 'javascript',
    numero: 1,
    titulo: 'Primeros pasos',
    descripcion:
      'Que es JavaScript, como se guardan datos en variables y cuales son los tipos basicos del lenguaje.',
    icono: '🚀',
    color: 'var(--c-verde)',
    estadoInicial: ESTADO_UNIDAD.DISPONIBLE,
    temas: ['Variables', 'let y const', 'Tipos de datos', 'console.log']
  },
  {
    id: 'js-u2',
    cursoId: 'javascript',
    numero: 2,
    titulo: 'Operadores y decisiones',
    descripcion:
      'Operaciones matematicas, comparaciones y la forma de hacer que el programa tome caminos distintos.',
    icono: '🔀',
    color: 'var(--c-azul)',
    estadoInicial: ESTADO_UNIDAD.BLOQUEADA,
    temas: ['Operadores', 'Comparaciones', 'if / else', 'Operadores logicos']
  },
  {
    id: 'js-u3',
    cursoId: 'javascript',
    numero: 3,
    titulo: 'Bucles y repeticion',
    descripcion:
      'Repetir instrucciones sin escribirlas mil veces usando for, while y los cortes de un bucle.',
    icono: '🔁',
    color: 'var(--c-violeta)',
    estadoInicial: ESTADO_UNIDAD.BLOQUEADA,
    temas: ['for', 'while', 'break y continue']
  },
  {
    id: 'js-u4',
    cursoId: 'javascript',
    numero: 4,
    titulo: 'Funciones',
    descripcion:
      'Agrupar codigo reutilizable, pasarle parametros, devolver resultados y entender el alcance de las variables.',
    icono: '🧩',
    color: '#ff8a3d',
    estadoInicial: ESTADO_UNIDAD.BLOQUEADA,
    temas: ['Declaracion', 'Parametros', 'return', 'Funciones flecha']
  },
  {
    id: 'js-u5',
    cursoId: 'javascript',
    numero: 5,
    titulo: 'Arrays y objetos',
    descripcion:
      'Guardar muchos datos juntos: listas ordenadas, propiedades con nombre y los metodos mas usados.',
    icono: '📦',
    color: '#e94f8a',
    estadoInicial: ESTADO_UNIDAD.BLOQUEADA,
    temas: ['Arrays', 'push y length', 'Objetos', 'map y filter']
  },
  {
    id: 'js-u6',
    cursoId: 'javascript',
    numero: 6,
    titulo: 'JavaScript en la pagina',
    descripcion:
      'Conectar el codigo con el HTML: buscar elementos, cambiar su contenido y responder a los clics del usuario.',
    icono: '🌐',
    color: '#12b0a0',
    estadoInicial: ESTADO_UNIDAD.BLOQUEADA,
    temas: ['DOM', 'querySelector', 'Eventos', 'textContent']
  }
]

/** Busca una unidad por su id. */
export function obtenerUnidad(id) {
  return unidadesJavaScript.find((unidad) => unidad.id === id) ?? null
}
