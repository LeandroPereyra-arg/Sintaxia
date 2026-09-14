import { TIPO_EJERCICIO } from '../tiposEjercicio.js'

/** Unidad 6 · JavaScript en la pagina */
export const leccionesUnidad6 = [
  {
    id: 'js-u6-l1',
    unidadId: 'js-u6',
    numero: 1,
    titulo: 'Buscar y cambiar elementos',
    descripcion: 'El DOM: como llegar al HTML desde JavaScript.',
    icono: '🌐',
    xp: 25,
    ejercicios: [
      {
        id: 'js-u6-l1-e1',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Que hace document.querySelector(".titulo")?',
        opciones: [
          { id: 'a', texto: 'Devuelve el primer elemento con la clase "titulo"' },
          { id: 'b', texto: 'Devuelve todos los elementos con la clase "titulo"' },
          { id: 'c', texto: 'Crea un elemento nuevo' },
          { id: 'd', texto: 'Borra el elemento' }
        ],
        respuesta: 'a',
        explicacion: 'querySelector devuelve el primero que coincide; querySelectorAll devuelve todos.'
      },
      {
        id: 'js-u6-l1-e2',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa la propiedad que cambia el texto de un elemento.',
        plantilla: 'const titulo = document.querySelector("h1")\ntitulo.___ = "Hola mundo"',
        respuesta: ['textContent', 'innerText'],
        pista: 'Empieza con "text".',
        explicacion: 'textContent reemplaza el texto del elemento sin interpretar HTML.'
      },
      {
        id: 'js-u6-l1-e3',
        tipo: TIPO_EJERCICIO.VERDADERO_FALSO,
        consigna: 'El DOM es la representacion del documento HTML que JavaScript puede leer y modificar.',
        respuesta: true,
        explicacion: 'DOM significa Document Object Model: el arbol de nodos de la pagina.'
      }
    ]
  },
  {
    id: 'js-u6-l2',
    unidadId: 'js-u6',
    numero: 2,
    titulo: 'Eventos',
    descripcion: 'Responder a los clics y a las acciones del usuario.',
    icono: '🖱️',
    xp: 25,
    ejercicios: [
      {
        id: 'js-u6-l2-e1',
        tipo: TIPO_EJERCICIO.COMPLETAR,
        consigna: 'Completa el metodo que escucha un evento.',
        plantilla: 'boton.___("click", () => {\n  console.log("Hiciste clic")\n})',
        respuesta: ['addEventListener'],
        pista: 'Empieza con "add" y sigue con "Event...".',
        explicacion: 'addEventListener(evento, funcion) ejecuta la funcion cada vez que ocurre el evento.'
      },
      {
        id: 'js-u6-l2-e2',
        tipo: TIPO_EJERCICIO.ORDENAR,
        consigna: 'Ordena las lineas para que un boton cambie el texto de un parrafo al hacer clic.',
        fragmentos: [
          { id: 'f3', texto: 'boton.addEventListener("click", () => {' },
          { id: 'f1', texto: 'const boton = document.querySelector("#accion")' },
          { id: 'f5', texto: '})' },
          { id: 'f2', texto: 'const parrafo = document.querySelector("#mensaje")' },
          { id: 'f4', texto: '  parrafo.textContent = "Listo!"' }
        ],
        respuesta: ['f1', 'f2', 'f3', 'f4', 'f5'],
        explicacion: 'Primero se buscan los elementos, despues se registra el evento y adentro se modifica el parrafo.'
      },
      {
        id: 'js-u6-l2-e3',
        tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
        consigna: 'Cual de estos NO es un evento del DOM?',
        opciones: [
          { id: 'a', texto: 'click' },
          { id: 'b', texto: 'submit' },
          { id: 'c', texto: 'keydown' },
          { id: 'd', texto: 'compile' }
        ],
        respuesta: 'd',
        explicacion: 'compile no existe como evento: JavaScript no se compila en el navegador de esa manera.'
      }
    ]
  }
]
