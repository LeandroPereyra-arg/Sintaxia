import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 2 · Operadores y decisiones */
export const leccionesUnidad2 = [
  {
    id: 'js-u2-l1',
    unidadId: 'js-u2',
    numero: 1,
    titulo: 'Operadores basicos',
    descripcion: 'Sumar, restar, concatenar y el resto de la division.',
    icono: 'division',
    xp: 15,
    ejercicios: [
      {
        id: 'js-u2-l1-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cuanto vale resultado?',
        codigo: 'const resultado = 7 % 3',
        opciones: [
          { id: 'a', texto: '2' },
          { id: 'b', texto: '2.33' },
          { id: 'c', texto: '1' },
          { id: 'd', texto: '21' }
        ],
        respuesta: 'c',
        explicacion: 'El operador % devuelve el resto de la division: 7 dividido 3 da 2 y sobra 1.'
      },
      {
        id: 'js-u2-l1-e2',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que imprime este codigo?',
        codigo: 'console.log("5" + 3)',
        opciones: [
          { id: 'a', texto: '8' },
          { id: 'b', texto: '"53"' },
          { id: 'c', texto: 'NaN' },
          { id: 'd', texto: 'Error' }
        ],
        respuesta: 'b',
        explicacion:
          'Si uno de los operandos es texto, el + concatena en lugar de sumar. Convierte con Number("5") si queres sumar.'
      },
      {
        id: 'js-u2-l1-e3',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa el operador que suma 1 a la variable.',
        plantilla: 'let vidas = 3\nvidas___ // ahora vale 4',
        respuesta: ['++'],
        pista: 'Son dos simbolos iguales, seguidos.',
        explicacion: 'El operador ++ incrementa en uno el valor de la variable.'
      }
    ]
  },
  {
    id: 'js-u2-l2',
    unidadId: 'js-u2',
    numero: 2,
    titulo: 'Comparaciones',
    descripcion: 'Diferencias entre == y ===, mayor, menor y distinto.',
    icono: 'balanza',
    xp: 15,
    ejercicios: [
      {
        id: 'js-u2-l2-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual es la diferencia entre == y === ?',
        opciones: [
          { id: 'a', texto: '=== compara valor y tipo; == solo compara el valor convirtiendo tipos' },
          { id: 'b', texto: 'Son exactamente iguales' },
          { id: 'c', texto: '== se usa para asignar valores' },
          { id: 'd', texto: '=== solo funciona con numeros' }
        ],
        respuesta: 'a',
        explicacion: 'Se recomienda usar siempre === para evitar conversiones de tipo inesperadas.'
      },
      {
        id: 'js-u2-l2-e2',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'Esta comparacion devuelve true.',
        codigo: '0 === "0"',
        respuesta: false,
        explicacion: 'Con === los tipos deben coincidir: number y string son distintos, asi que da false.'
      },
      {
        id: 'js-u2-l2-e3',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa el operador que significa "distinto de" comparando tambien el tipo.',
        plantilla: 'if (usuario ___ null) { /* ... */ }',
        respuesta: ['!==', '!='],
        pista: 'Empieza con el signo de admiracion.',
        explicacion: '!== es la negacion estricta de ===.'
      }
    ]
  },
  {
    id: 'js-u2-l3',
    unidadId: 'js-u2',
    numero: 3,
    titulo: 'Condicionales if / else',
    descripcion: 'Elegir caminos segun una condicion.',
    icono: 'bifurcacion',
    xp: 20,
    ejercicios: [
      {
        id: 'js-u2-l3-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que imprime este codigo?',
        codigo: 'const edad = 15\nif (edad >= 18) {\n  console.log("Mayor")\n} else {\n  console.log("Menor")\n}',
        opciones: [
          { id: 'a', texto: 'Mayor' },
          { id: 'b', texto: 'Menor' },
          { id: 'c', texto: 'Las dos cosas' },
          { id: 'd', texto: 'No imprime nada' }
        ],
        respuesta: 'b',
        explicacion: 'Como 15 no es mayor o igual que 18, se ejecuta el bloque del else.'
      },
      {
        id: 'js-u2-l3-e2',
        tipo: TIPO_EJERCICIO.ORDENAR,
        consigna: 'Ordena las lineas para armar un condicional valido.',
        fragmentos: [
          { id: 'f3', texto: '} else {' },
          { id: 'f1', texto: 'if (nota >= 6) {' },
          { id: 'f4', texto: '  console.log("Desaprobado")' },
          { id: 'f2', texto: '  console.log("Aprobado")' },
          { id: 'f5', texto: '}' }
        ],
        respuesta: ['f1', 'f2', 'f3', 'f4', 'f5'],
        explicacion: 'Primero el if con su bloque, luego el else con el suyo y finalmente la llave de cierre.'
      },
      {
        id: 'js-u2-l3-e3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual es el operador logico "y" (se deben cumplir las dos condiciones)?',
        opciones: [
          { id: 'a', texto: '||' },
          { id: 'b', texto: '&&' },
          { id: 'c', texto: '!' },
          { id: 'd', texto: 'and' }
        ],
        respuesta: 'b',
        explicacion: '&& exige que ambas condiciones sean verdaderas; || alcanza con una; ! niega.'
      }
    ]
  }
]
