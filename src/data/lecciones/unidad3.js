import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 3 · Bucles y repeticion */
export const leccionesUnidad3 = [
  {
    id: 'js-u3-l1',
    unidadId: 'js-u3',
    numero: 1,
    titulo: 'El bucle for',
    descripcion: 'Repetir una cantidad conocida de veces.',
    icono: '🔁',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u3-l1-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cuantas veces se ejecuta el cuerpo de este bucle?',
        codigo: 'for (let i = 0; i < 5; i++) {\n  console.log(i)\n}',
        opciones: [
          { id: 'a', texto: '4 veces' },
          { id: 'b', texto: '5 veces' },
          { id: 'c', texto: '6 veces' },
          { id: 'd', texto: 'Infinitas veces' }
        ],
        respuesta: 'b',
        explicacion: 'i toma los valores 0, 1, 2, 3 y 4: cinco vueltas en total.'
      },
      {
        id: 'js-u3-l1-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la condicion para recorrer un array completo.',
        plantilla: 'for (let i = 0; i < frutas.___; i++) {\n  console.log(frutas[i])\n}',
        respuesta: ['length'],
        pista: 'Es la propiedad que indica cuantos elementos tiene el array.',
        explicacion: 'length devuelve la cantidad de elementos; el ultimo indice siempre es length - 1.'
      },
      {
        id: 'js-u3-l1-e3',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'Si olvidas el i++ el bucle puede quedar repitiendose para siempre.',
        respuesta: true,
        explicacion: 'Sin el incremento la condicion nunca se vuelve falsa: es un bucle infinito.'
      }
    ]
  },
  {
    id: 'js-u3-l2',
    unidadId: 'js-u3',
    numero: 2,
    titulo: 'while, break y continue',
    descripcion: 'Repetir mientras se cumpla algo y controlar las vueltas.',
    icono: '⏭️',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u3-l2-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cuando conviene usar while en lugar de for?',
        opciones: [
          { id: 'a', texto: 'Cuando no sabemos de antemano cuantas repeticiones haran falta' },
          { id: 'b', texto: 'Cuando recorremos numeros del 1 al 10' },
          { id: 'c', texto: 'while es mas rapido siempre' },
          { id: 'd', texto: 'Solo se usa con arrays' }
        ],
        respuesta: 'a',
        explicacion: 'for encaja con repeticiones contadas; while, con condiciones que dependen de lo que pase adentro.'
      },
      {
        id: 'js-u3-l2-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la palabra que corta el bucle inmediatamente.',
        plantilla: 'for (const n of numeros) {\n  if (n === 0) ___\n}',
        respuesta: ['break'],
        pista: 'En ingles significa "romper".',
        explicacion: 'break sale del bucle; continue solo saltea la vuelta actual.'
      },
      {
        id: 'js-u3-l2-e3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que imprime este codigo?',
        codigo: 'for (let i = 1; i <= 4; i++) {\n  if (i === 2) continue\n  console.log(i)\n}',
        opciones: [
          { id: 'a', texto: '1 2 3 4' },
          { id: 'b', texto: '1 3 4' },
          { id: 'c', texto: '1' },
          { id: 'd', texto: '2' }
        ],
        respuesta: 'b',
        explicacion: 'continue saltea solamente la vuelta en la que i vale 2.'
      }
    ]
  }
]
