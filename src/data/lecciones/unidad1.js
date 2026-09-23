import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/**
 * Unidad 1 - Primeros pasos.
 *
 * Es la unidad desarrollada por completo para esta entrega. Cada leccion trae:
 *   - `teoria`: una explicacion breve y un ejemplo de codigo comentado.
 *   - `ejercicios`: las actividades, todas de opcion multiple con una unica
 *     respuesta correcta, como pide la consigna de esta etapa.
 *
 * Cada actividad lleva su propio `id` y ademas el `leccionId` al que pertenece,
 * aunque este anidada: asi el dato sigue siendo valido cuando las actividades
 * salgan de una tabla de la base y no de este archivo.
 */
export const leccionesUnidad1 = [
  {
    id: 'js-u1-l1',
    unidadId: 'js-u1',
    numero: 1,
    titulo: 'Que es JavaScript',
    descripcion: 'Para que sirve el lenguaje, donde se ejecuta y como mostrar un mensaje.',
    icono: 'estrella',
    xp: 10,
    teoria: {
      explicacion:
        'JavaScript es el lenguaje que le da comportamiento a las paginas web. El navegador ' +
        'trae adentro un motor que lo ejecuta, asi que no hace falta instalar nada para ' +
        'empezar. Para incluirlo en una pagina se usa la etiqueta <script>, y la instruccion ' +
        'console.log() sirve para mostrar valores en la consola del navegador mientras se ' +
        'programa.',
      ejemplo: {
        titulo: 'Tu primera linea de JavaScript',
        codigo:
          '<!-- En el HTML -->\n' +
          '<script>\n' +
          '  // console.log muestra el valor en la consola del navegador\n' +
          '  console.log("Hola Sintaxia")\n' +
          '</script>',
        nota: 'Abri la consola del navegador con F12 para ver el mensaje.'
      }
    },
    ejercicios: [
      {
        id: 'js-u1-l1-a1',
        leccionId: 'js-u1-l1',
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
          'El navegador trae un motor de JavaScript que ejecuta el codigo de la pagina. Con ' +
          'Node.js tambien puede correr en un servidor, pero en la web corre en el navegador.'
      },
      {
        id: 'js-u1-l1-a2',
        leccionId: 'js-u1-l1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que etiqueta de HTML se usa para incluir codigo JavaScript en una pagina?',
        opciones: [
          { id: 'a', texto: '<style>' },
          { id: 'b', texto: '<script>' },
          { id: 'c', texto: '<js>' },
          { id: 'd', texto: '<code>' }
        ],
        respuesta: 'b',
        explicacion:
          '<script> permite escribir el codigo dentro de la pagina o enlazar un archivo .js ' +
          'con el atributo src. <code> solo muestra texto con formato de codigo.'
      },
      {
        id: 'js-u1-l1-a3',
        leccionId: 'js-u1-l1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual de estas instrucciones muestra un mensaje en la consola del navegador?',
        opciones: [
          { id: 'a', texto: 'console.escribir("Hola")' },
          { id: 'b', texto: 'print("Hola")' },
          { id: 'c', texto: 'console.log("Hola")' },
          { id: 'd', texto: 'mostrar("Hola")' }
        ],
        respuesta: 'c',
        explicacion:
          'console.log() es la forma estandar de imprimir en la consola. print() existe en ' +
          'otros lenguajes, como Python, pero no en JavaScript.'
      },
      {
        id: 'js-u1-l1-a4',
        leccionId: 'js-u1-l1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Es cierto que JavaScript y Java son el mismo lenguaje?',
        opciones: [
          { id: 'a', texto: 'Si, JavaScript es la version del navegador de Java' },
          { id: 'b', texto: 'No, son lenguajes distintos que solo comparten parte del nombre' },
          { id: 'c', texto: 'Si, se escriben igual pero cambia la extension del archivo' },
          { id: 'd', texto: 'No, pero JavaScript se compila a Java antes de ejecutarse' }
        ],
        respuesta: 'b',
        explicacion:
          'Son lenguajes diferentes, con sintaxis y usos distintos. Comparten parte del nombre ' +
          'por razones historicas y de marketing de los anios noventa, nada mas.'
      }
    ]
  },

  {
    id: 'js-u1-l2',
    unidadId: 'js-u1',
    numero: 2,
    titulo: 'Variables y constantes',
    descripcion: 'Guardar datos con let y const, y cuando conviene cada uno.',
    icono: 'variable',
    xp: 15,
    teoria: {
      explicacion:
        'Una variable es una caja con nombre donde se guarda un dato para usarlo despues. ' +
        'Con let se declara una variable que va a cambiar de valor, y con const una cuyo ' +
        'valor no se va a reasignar. La recomendacion es usar const por defecto y pasar a ' +
        'let solo cuando haga falta cambiarla: asi el codigo avisa que se espera de cada dato. ' +
        'Los nombres van en camelCase, no pueden empezar con numero ni llevar guiones.',
      ejemplo: {
        titulo: 'let cambia, const no',
        codigo:
          'let puntaje = 0        // va a cambiar durante el juego\n' +
          'puntaje = puntaje + 10 // permitido\n' +
          '\n' +
          'const NOMBRE = "Ada"   // no se vuelve a asignar\n' +
          '// NOMBRE = "Grace"    // Error: Assignment to constant variable',
        nota: 'La convencion para nombres de varias palabras es camelCase: puntajeTotal.'
      }
    },
    ejercicios: [
      {
        id: 'js-u1-l2-a1',
        leccionId: 'js-u1-l2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que palabra clave conviene usar para un valor que NO va a cambiar?',
        opciones: [
          { id: 'a', texto: 'let' },
          { id: 'b', texto: 'var' },
          { id: 'c', texto: 'const' },
          { id: 'd', texto: 'fixed' }
        ],
        respuesta: 'c',
        explicacion:
          'const crea una constante: si se intenta reasignarla, JavaScript lanza el error ' +
          '"Assignment to constant variable". fixed no existe en el lenguaje.'
      },
      {
        id: 'js-u1-l2-a2',
        leccionId: 'js-u1-l2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que palabra clave falta para declarar una variable que si va a cambiar?',
        codigo: '___ puntaje = 0\npuntaje = puntaje + 10',
        opciones: [
          { id: 'a', texto: 'let' },
          { id: 'b', texto: 'const' },
          { id: 'c', texto: 'function' },
          { id: 'd', texto: 'new' }
        ],
        respuesta: 'a',
        explicacion:
          'let declara una variable con alcance de bloque que se puede volver a asignar. Con ' +
          'const la segunda linea daria error.'
      },
      {
        id: 'js-u1-l2-a3',
        leccionId: 'js-u1-l2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que pasa cuando se ejecuta este codigo?',
        codigo: 'const nombre = "Ada"\nnombre = "Grace"',
        opciones: [
          { id: 'a', texto: 'nombre pasa a valer "Grace"' },
          { id: 'b', texto: 'Lanza un error porque una constante no se puede reasignar' },
          { id: 'c', texto: 'nombre queda vacio' },
          { id: 'd', texto: 'No pasa nada, la segunda linea se ignora' }
        ],
        respuesta: 'b',
        explicacion:
          'Reasignar una constante lanza el error "Assignment to constant variable". Para ' +
          'poder cambiar el valor habria que haber declarado la variable con let.'
      },
      {
        id: 'js-u1-l2-a4',
        leccionId: 'js-u1-l2',
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
          'Un nombre no puede empezar con numero, no admite guiones (se confunden con la ' +
          'resta) y no puede ser una palabra reservada del lenguaje como let.'
      }
    ]
  },

  {
    id: 'js-u1-l3',
    unidadId: 'js-u1',
    numero: 3,
    titulo: 'Tipos de datos',
    descripcion: 'Numeros, textos y booleanos, y como averiguar el tipo con typeof.',
    icono: 'texto',
    xp: 15,
    teoria: {
      explicacion:
        'Todo dato en JavaScript tiene un tipo. Los tres que mas se usan al empezar son ' +
        'number (numeros, con o sin coma), string (texto, siempre entre comillas) y boolean ' +
        '(solo true o false). El operador typeof dice de que tipo es un valor. Prestar ' +
        'atencion al tipo importa: "42" con comillas es texto, no un numero, y por eso no se ' +
        'comporta igual en las cuentas.',
      ejemplo: {
        titulo: 'Los tres tipos basicos',
        codigo:
          'const edad = 36          // number\n' +
          'const nombre = "Ada"     // string (entre comillas)\n' +
          'const esMayor = true     // boolean\n' +
          '\n' +
          'console.log(typeof edad)     // "number"\n' +
          'console.log(typeof nombre)   // "string"\n' +
          'console.log(typeof "42")     // "string", no "number"',
        nota: 'typeof siempre devuelve el nombre del tipo como texto.'
      }
    },
    ejercicios: [
      {
        id: 'js-u1-l3-a1',
        leccionId: 'js-u1-l3',
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
        explicacion:
          'Las comillas hacen que 42 sea una cadena de texto. Sin comillas, typeof 42 ' +
          'devolveria "number".'
      },
      {
        id: 'js-u1-l3-a2',
        leccionId: 'js-u1-l3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Como se llama el tipo de dato que solo puede valer true o false?',
        opciones: [
          { id: 'a', texto: 'number' },
          { id: 'b', texto: 'string' },
          { id: 'c', texto: 'boolean' },
          { id: 'd', texto: 'binary' }
        ],
        respuesta: 'c',
        explicacion:
          'El tipo boolean representa valores logicos: true o false. Es el que devuelven las ' +
          'comparaciones y el que usan los condicionales para decidir.'
      },
      {
        id: 'js-u1-l3-a3',
        leccionId: 'js-u1-l3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual es el orden correcto para declarar un nombre y mostrar un saludo?',
        opciones: [
          {
            id: 'a',
            texto:
              '1) const nombre = "Ada"  ·  2) const saludo = "Hola, " + nombre  ·  3) console.log(saludo)'
          },
          {
            id: 'b',
            texto:
              '1) console.log(saludo)  ·  2) const nombre = "Ada"  ·  3) const saludo = "Hola, " + nombre'
          },
          {
            id: 'c',
            texto:
              '1) const saludo = "Hola, " + nombre  ·  2) const nombre = "Ada"  ·  3) console.log(saludo)'
          },
          {
            id: 'd',
            texto:
              '1) const nombre = "Ada"  ·  2) console.log(saludo)  ·  3) const saludo = "Hola, " + nombre'
          }
        ],
        respuesta: 'a',
        explicacion:
          'Una variable tiene que existir antes de usarse. Primero se declara nombre, despues ' +
          'se arma saludo con ese valor y recien al final se lo muestra.'
      },
      {
        id: 'js-u1-l3-a4',
        leccionId: 'js-u1-l3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que imprime este codigo?',
        codigo: 'const a = 5\nconst b = "5"\nconsole.log(typeof a === typeof b)',
        opciones: [
          { id: 'a', texto: 'true' },
          { id: 'b', texto: 'false' },
          { id: 'c', texto: '"number"' },
          { id: 'd', texto: 'Error' }
        ],
        respuesta: 'b',
        explicacion:
          'typeof a es "number" y typeof b es "string". Como los dos textos son distintos, la ' +
          'comparacion da false.'
      }
    ]
  }
]
