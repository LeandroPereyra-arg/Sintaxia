import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 5 · Arrays y objetos */
export const leccionesUnidad5 = [
  {
    id: 'js-u5-l1',
    unidadId: 'js-u5',
    numero: 1,
    titulo: 'Arrays',
    descripcion: 'Listas ordenadas de valores y sus metodos basicos.',
    icono: '📦',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u5-l1-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que imprime este codigo?',
        codigo: 'const colores = ["rojo", "verde", "azul"]\nconsole.log(colores[1])',
        opciones: [
          { id: 'a', texto: 'rojo' },
          { id: 'b', texto: 'verde' },
          { id: 'c', texto: 'azul' },
          { id: 'd', texto: 'undefined' }
        ],
        respuesta: 'b',
        explicacion: 'Los indices arrancan en 0, asi que la posicion 1 es el segundo elemento.'
      },
      {
        id: 'js-u5-l1-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa el metodo que agrega un elemento al final del array.',
        plantilla: 'const tareas = []\ntareas.___("Estudiar JS")',
        respuesta: ['push'],
        pista: 'En ingles significa "empujar".',
        explicacion: 'push() agrega al final; pop() saca el ultimo elemento.'
      },
      {
        id: 'js-u5-l1-e3',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'En el array ["a", "b", "c"] la propiedad length vale 3.',
        respuesta: true,
        explicacion: 'length cuenta los elementos; el ultimo indice valido es 2.'
      }
    ]
  },
  {
    id: 'js-u5-l2',
    unidadId: 'js-u5',
    numero: 2,
    titulo: 'Objetos',
    descripcion: 'Agrupar datos relacionados con propiedades con nombre.',
    icono: '🗂️',
    xp: 25,
    ejercicios: [
      {
        id: 'js-u5-l2-e1',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la forma de acceder al nombre del usuario.',
        codigo: 'const usuario = { nombre: "Ada", edad: 36 }',
        plantilla: 'console.log(usuario.___)',
        respuesta: ['nombre'],
        pista: 'Se escribe igual que la propiedad del objeto.',
        explicacion: 'Con el punto se accede a una propiedad: usuario.nombre devuelve "Ada".'
      },
      {
        id: 'js-u5-l2-e2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que metodo de array devuelve un nuevo array solo con los elementos que cumplen una condicion?',
        opciones: [
          { id: 'a', texto: 'map()' },
          { id: 'b', texto: 'filter()' },
          { id: 'c', texto: 'forEach()' },
          { id: 'd', texto: 'push()' }
        ],
        respuesta: 'b',
        explicacion: 'filter() filtra; map() transforma cada elemento; forEach() solo recorre.'
      },
      {
        id: 'js-u5-l2-e3',
        tipo: TIPO_EJERCICIO.ORDENAR,
        consigna: 'Ordena las lineas para quedarte solo con los numeros mayores a 10.',
        fragmentos: [
          { id: 'f2', texto: 'const grandes = numeros.filter((n) => n > 10)' },
          { id: 'f1', texto: 'const numeros = [4, 15, 8, 23]' },
          { id: 'f3', texto: 'console.log(grandes) // [15, 23]' }
        ],
        respuesta: ['f1', 'f2', 'f3'],
        explicacion: 'Se declara el array, se lo filtra guardando el resultado y recien despues se lo muestra.'
      }
    ]
  }
]
