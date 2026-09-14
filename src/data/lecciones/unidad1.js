import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 1 · Primeros pasos */
export const leccionesUnidad1 = [
  {
    id: 'js-u1-l1',
    unidadId: 'js-u1',
    numero: 1,
    titulo: 'Que es JavaScript',
    descripcion: 'Para que sirve el lenguaje y donde se ejecuta.',
    icono: '⭐',
    xp: 10,
    ejercicios: [
      {
        id: 'js-u1-l1-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Donde se ejecuta principalmente JavaScript cuando visitas una pagina web?',
        opciones: [
          { id: 'a', texto: 'En el navegador de quien visita la pagina' },
          { id: 'b', texto: 'En la impresora' },
          { id: 'c', texto: 'Solo en el servidor' },
          { id: 'd', texto: 'En el sistema operativo, antes de abrir el navegador' }
        ],
        respuesta: 'a',
        explicacion:
          'El navegador trae un motor de JavaScript que ejecuta el codigo de la pagina. Con Node.js tambien puede correr en un servidor.'
      },
      {
        id: 'js-u1-l1-e2',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'JavaScript y Java son el mismo lenguaje con distinto nombre.',
        respuesta: false,
        explicacion:
          'Son lenguajes distintos: comparten parte del nombre por razones historicas y de marketing, nada mas.'
      },
      {
        id: 'js-u1-l1-e3',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la instruccion que muestra un mensaje en la consola del navegador.',
        plantilla: 'console.___("Hola Sintaxia")',
        respuesta: ['log'],
        pista: 'Es la funcion mas usada para depurar: console.___',
        explicacion: 'console.log() imprime en la consola del navegador el valor que le pases.'
      },
      {
        id: 'js-u1-l1-e4',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que etiqueta de HTML se usa para incluir codigo JavaScript en una pagina?',
        opciones: [
          { id: 'a', texto: '<style>' },
          { id: 'b', texto: '<script>' },
          { id: 'c', texto: '<js>' },
          { id: 'd', texto: '<code>' }
        ],
        respuesta: 'b',
        explicacion: '<script> permite escribir codigo o enlazar un archivo .js con el atributo src.'
      }
    ]
  },
  {
    id: 'js-u1-l2',
    unidadId: 'js-u1',
    numero: 2,
    titulo: 'Variables y constantes',
    descripcion: 'Guardar datos con let y const.',
    icono: '📥',
    xp: 15,
    ejercicios: [
      {
        id: 'js-u1-l2-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que palabra clave conviene usar para un valor que NO va a cambiar?',
        opciones: [
          { id: 'a', texto: 'let' },
          { id: 'b', texto: 'var' },
          { id: 'c', texto: 'const' },
          { id: 'd', texto: 'fixed' }
        ],
        respuesta: 'c',
        explicacion: 'const crea una constante: si intentas reasignarla, JavaScript lanza un error.'
      },
      {
        id: 'js-u1-l2-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Declara una variable que si pueda cambiar de valor mas adelante.',
        plantilla: '___ puntaje = 0\npuntaje = puntaje + 10',
        respuesta: ['let'],
        pista: 'Es la forma moderna de declarar variables que cambian.',
        explicacion: 'let declara una variable con alcance de bloque que se puede reasignar.'
      },
      {
        id: 'js-u1-l2-e3',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'Este codigo provoca un error.',
        codigo: 'const nombre = "Ada"\nnombre = "Grace"',
        respuesta: true,
        explicacion: 'Una constante no se puede reasignar: el error es "Assignment to constant variable".'
      },
      {
        id: 'js-u1-l2-e4',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual de estos nombres de variable es valido en JavaScript?',
        opciones: [
          { id: 'a', texto: '2puntaje' },
          { id: 'b', texto: 'puntaje-total' },
          { id: 'c', texto: 'puntajeTotal' },
          { id: 'd', texto: 'let' }
        ],
        respuesta: 'c',
        explicacion:
          'No puede empezar con numero, no admite guiones y no puede ser una palabra reservada. La convencion es camelCase.'
      }
    ]
  },
  {
    id: 'js-u1-l3',
    unidadId: 'js-u1',
    numero: 3,
    titulo: 'Tipos de datos',
    descripcion: 'Numeros, textos, booleanos y el operador typeof.',
    icono: '🔤',
    xp: 15,
    ejercicios: [
      {
        id: 'js-u1-l3-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que devuelve typeof "42"?',
        codigo: 'console.log(typeof "42")',
        opciones: [
          { id: 'a', texto: '"number"' },
          { id: 'b', texto: '"string"' },
          { id: 'c', texto: '"text"' },
          { id: 'd', texto: '"undefined"' }
        ],
        respuesta: 'b',
        explicacion: 'Las comillas hacen que 42 sea una cadena de texto (string), no un numero.'
      },
      {
        id: 'js-u1-l3-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa el tipo de dato que solo puede valer true o false.',
        plantilla: 'const esMayor = true // tipo: ___',
        respuesta: ['boolean', 'booleano'],
        pista: 'En ingles se escribe con "b" y termina en "ean".',
        explicacion: 'El tipo boolean representa valores logicos: true o false.'
      },
      {
        id: 'js-u1-l3-e3',
        tipo: TIPO_EJERCICIO.ORDENAR,
        consigna: 'Ordena las lineas para declarar un nombre y mostrar un saludo.',
        fragmentos: [
          { id: 'f2', texto: 'const saludo = "Hola, " + nombre' },
          { id: 'f3', texto: 'console.log(saludo)' },
          { id: 'f1', texto: 'const nombre = "Ada"' }
        ],
        respuesta: ['f1', 'f2', 'f3'],
        explicacion:
          'Primero se declara la variable, despues se la usa para construir el saludo y al final se lo muestra.'
      }
    ]
  }
]
