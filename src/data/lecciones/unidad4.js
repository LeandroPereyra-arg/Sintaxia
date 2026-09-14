import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 4 · Funciones */
export const leccionesUnidad4 = [
  {
    id: 'js-u4-l1',
    unidadId: 'js-u4',
    numero: 1,
    titulo: 'Declarar y llamar funciones',
    descripcion: 'Agrupar codigo con nombre para reutilizarlo.',
    icono: 'pieza',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u4-l1-e1',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la palabra clave que declara una funcion.',
        plantilla: '___ saludar(nombre) {\n  console.log("Hola " + nombre)\n}',
        respuesta: ['function'],
        pista: 'Es la misma palabra en ingles que "funcion".',
        explicacion: 'function nombre(parametros) { ... } es la forma clasica de declarar una funcion.'
      },
      {
        id: 'js-u4-l1-e2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que devuelve esta funcion si la llamamos con doble(4)?',
        codigo: 'function doble(n) {\n  return n * 2\n}',
        opciones: [
          { id: 'a', texto: '4' },
          { id: 'b', texto: '8' },
          { id: 'c', texto: 'undefined' },
          { id: 'd', texto: '"44"' }
        ],
        respuesta: 'b',
        explicacion: 'El parametro n vale 4 y la funcion devuelve 4 * 2 = 8.'
      },
      {
        id: 'js-u4-l1-e3',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'Una funcion sin return devuelve undefined.',
        respuesta: true,
        explicacion: 'Si no se indica un valor de retorno, JavaScript devuelve undefined por defecto.'
      }
    ]
  },
  {
    id: 'js-u4-l2',
    unidadId: 'js-u4',
    numero: 2,
    titulo: 'Funciones flecha y alcance',
    descripcion: 'Sintaxis corta y donde vive cada variable.',
    icono: 'flechaDiana',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u4-l2-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual de estas es una funcion flecha valida que devuelve el cuadrado de n?',
        opciones: [
          { id: 'a', texto: 'const cuadrado = (n) => n * n' },
          { id: 'b', texto: 'const cuadrado = function -> n * n' },
          { id: 'c', texto: 'const cuadrado = (n) : n * n' },
          { id: 'd', texto: 'arrow cuadrado(n) { n * n }' }
        ],
        respuesta: 'a',
        explicacion: 'La flecha => separa los parametros del cuerpo; sin llaves el valor se devuelve implicitamente.'
      },
      {
        id: 'js-u4-l2-e2',
        tipo: TIPO_EJERCICIO.ORDENAR,
        consigna: 'Ordena las lineas para declarar la funcion y usar su resultado.',
        fragmentos: [
          { id: 'f3', texto: 'console.log(area)' },
          { id: 'f1', texto: 'const areaRectangulo = (base, altura) => base * altura' },
          { id: 'f2', texto: 'const area = areaRectangulo(4, 3)' }
        ],
        respuesta: ['f1', 'f2', 'f3'],
        explicacion: 'Hay que declarar la funcion, despues llamarla guardando el resultado y por ultimo mostrarlo.'
      },
      {
        id: 'js-u4-l2-e3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que pasa si intentamos usar una variable declarada con let dentro de una funcion, desde afuera?',
        opciones: [
          { id: 'a', texto: 'Funciona sin problemas' },
          { id: 'b', texto: 'Da un error porque la variable solo existe dentro de la funcion' },
          { id: 'c', texto: 'Vale siempre 0' },
          { id: 'd', texto: 'Se convierte en global automaticamente' }
        ],
        respuesta: 'b',
        explicacion: 'let tiene alcance de bloque: fuera de la funcion esa variable no esta definida.'
      }
    ]
  }
]
