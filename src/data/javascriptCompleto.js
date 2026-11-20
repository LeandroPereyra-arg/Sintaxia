import { leccion } from './armarContenido.js'
import { lecciones as leccionesOriginales } from './lecciones/index.js'

/**
 * Unidades 2 a 6 del curso de JavaScript, completas.
 *
 * La teoria (explicacion y ejemplo), el titulo y el icono salen de
 * src/data/lecciones/unidad2.js ... unidad6.js. Esas lecciones mezclaban tipos
 * de actividad (completar, ordenar, verdadero o falso) que la base no guarda: aca
 * cada leccion tiene cuatro actividades de opcion multiple, como la unidad 1.
 *
 * Como el resto de src/data/, la app no lee este archivo: se usa para generar
 * supabase/02-datos-iniciales.sql (npm run supabase:datos).
 */

/** Arma la leccion con los datos de la original y las actividades nuevas. */
function completar(id, actividades) {
  const original = leccionesOriginales.find((l) => l.id === id)
  if (!original) throw new Error(`No existe la leccion ${id}`)
  return leccion(original.unidadId, original.numero, {
    titulo: original.titulo,
    descripcion: original.descripcion,
    icono: original.icono,
    xp: original.xp,
    explicacion: original.teoria.explicacion,
    ejemplo: original.teoria.ejemplo,
    actividades
  })
}

export const leccionesJavaScriptCompletas = [
  // --- Unidad 2: Operadores y decisiones -------------------------------------
  completar('js-u2-l1', [
    {
      consigna: '¿Cuánto vale resultado?',
      codigo: 'const resultado = 10 % 4',
      opciones: ['2', '2.5', '0', '6'],
      correcta: 0,
      explicacion: '% devuelve el resto de la división: 10 dividido 4 da 2 y sobran 2.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'console.log("5" + 3)',
      opciones: ['8', '"53"', 'NaN', 'Un error'],
      correcta: 1,
      explicacion: 'Si uno de los lados del + es texto, JavaScript concatena: "5" + 3 da "53".'
    },
    {
      consigna: '¿Qué operador suma 1 a una variable?',
      opciones: ['+=1+', '**', '++', '=+'],
      correcta: 2,
      explicacion: 'vidas++ es lo mismo que vidas = vidas + 1. ** es la potencia.'
    },
    {
      consigna: '¿Cómo se sabe si un número n es par?',
      opciones: ['n / 2 === 0', 'n % 2 === 0', 'n * 2 === 0', 'n - 2 === 0'],
      correcta: 1,
      explicacion: 'Un número es par cuando el resto de dividirlo por 2 es 0.'
    }
  ]),
  completar('js-u2-l2', [
    {
      consigna: '¿Cuál es la diferencia entre == y ===?',
      opciones: ['=== compara también el tipo; == convierte los tipos antes', 'Son iguales', '== es más estricto que ===', '=== solo sirve para números'],
      correcta: 0,
      explicacion: '=== (estricta) no convierte tipos: 0 === "0" es false. == los convierte y da true.'
    },
    {
      consigna: '¿Qué devuelve esta comparación?',
      codigo: '0 === "0"',
      opciones: ['true', 'false', 'undefined', 'Un error'],
      correcta: 1,
      explicacion: 'Un number y un string nunca son estrictamente iguales.'
    },
    {
      consigna: '¿Qué operador significa "distinto de" en forma estricta?',
      opciones: ['<>', '=/=', '!==', '!='],
      correcta: 2,
      explicacion: '!== es el opuesto de ===. != también existe, pero convierte los tipos como ==.'
    },
    {
      consigna: '¿Qué tipo de valor devuelve siempre una comparación como 5 > 3?',
      opciones: ['Un número', 'Un texto', 'Un booleano (true o false)', 'undefined'],
      correcta: 2,
      explicacion: 'Las comparaciones siempre dan true o false.'
    }
  ]),
  completar('js-u2-l3', [
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const edad = 15\nif (edad >= 18) {\n  console.log("Adulto")\n} else {\n  console.log("Menor")\n}',
      opciones: ['Adulto', 'Menor', 'Adulto y Menor', 'Nada'],
      correcta: 1,
      explicacion: '15 >= 18 es false, así que se ejecuta el bloque del else.'
    },
    {
      consigna: '¿Cuál es el operador lógico "y" (se tienen que cumplir las dos condiciones)?',
      opciones: ['||', '&&', '!', 'and'],
      correcta: 1,
      explicacion: '&& es "y". || es "o" y ! es "no".'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const llueve = false\nconst frio = true\nif (llueve || frio) {\n  console.log("Abrigo")\n} else {\n  console.log("Remera")\n}',
      opciones: ['Abrigo', 'Remera', 'Nada', 'Un error'],
      correcta: 0,
      explicacion: 'Con || alcanza con que una condición sea true: frio es true.'
    },
    {
      consigna: '¿Qué hace el operador ! delante de una condición?',
      opciones: ['La repite', 'La invierte: true pasa a false y al revés', 'La compara con 0', 'La convierte en texto'],
      correcta: 1,
      explicacion: '!true es false y !false es true.'
    }
  ]),

  // --- Unidad 3: Bucles y repeticion -------------------------------------------
  completar('js-u3-l1', [
    {
      consigna: '¿Cuántas veces se ejecuta el cuerpo de este bucle?',
      codigo: 'for (let i = 0; i < 4; i++) {\n  console.log(i)\n}',
      opciones: ['3', '4', '5', 'Infinitas'],
      correcta: 1,
      explicacion: 'i toma los valores 0, 1, 2 y 3: cuatro vueltas.'
    },
    {
      consigna: '¿Qué condición recorre todo el array lista?',
      codigo: 'for (let i = 0; ______; i++) {\n  console.log(lista[i])\n}',
      opciones: ['i <= lista.length', 'i < lista.length', 'i < lista', 'i > lista.length'],
      correcta: 1,
      explicacion: 'Las posiciones van de 0 a length - 1, así que la condición es i < lista.length.'
    },
    {
      consigna: 'Si en un for te olvidás el i++, ¿qué puede pasar?',
      opciones: ['Nada, se suma solo', 'El bucle se repite para siempre', 'No se ejecuta nunca', 'Da error de sintaxis'],
      correcta: 1,
      explicacion: 'Si el contador no avanza, la condición nunca deja de cumplirse: bucle infinito.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'let suma = 0\nfor (let i = 1; i <= 3; i++) {\n  suma = suma + i\n}\nconsole.log(suma)',
      opciones: ['3', '6', '4', '0'],
      correcta: 1,
      explicacion: 'Suma 1 + 2 + 3 = 6.'
    }
  ]),
  completar('js-u3-l2', [
    {
      consigna: '¿Cuándo conviene usar while en lugar de for?',
      opciones: ['Cuando no se sabe de antemano cuántas vueltas hacen falta', 'Siempre, es más rápido', 'Solo para recorrer arrays', 'Nunca'],
      correcta: 0,
      explicacion: 'while repite mientras se cumpla una condición; for es ideal cuando se conoce la cantidad de vueltas.'
    },
    {
      consigna: '¿Qué palabra corta un bucle inmediatamente?',
      opciones: ['stop', 'continue', 'break', 'exit'],
      correcta: 2,
      explicacion: 'break sale del bucle; continue solo saltea la vuelta actual.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'for (let i = 1; i <= 4; i++) {\n  if (i === 2) continue\n  console.log(i)\n}',
      opciones: ['1 2 3 4', '1 3 4', '1', '2'],
      correcta: 1,
      explicacion: 'continue saltea la vuelta del 2; las demás se imprimen.'
    },
    {
      consigna: '¿Cuánto vale n al terminar?',
      codigo: 'let n = 1\nwhile (n < 20) {\n  n = n * 2\n}',
      opciones: ['16', '20', '32', '1'],
      correcta: 2,
      explicacion: 'n pasa por 1, 2, 4, 8, 16 y 32. Con 32 la condición ya no se cumple y el bucle termina.'
    }
  ]),

  // --- Unidad 4: Funciones -----------------------------------------------------------
  completar('js-u4-l1', [
    {
      consigna: '¿Qué palabra clave declara una función?',
      opciones: ['func', 'def', 'function', 'method'],
      correcta: 2,
      explicacion: 'En JavaScript se escribe function nombre(parametros) { ... }. def es de Python.'
    },
    {
      consigna: '¿Qué devuelve doble(5)?',
      codigo: 'function doble(n) {\n  return n * 2\n}',
      opciones: ['5', '10', '25', 'undefined'],
      correcta: 1,
      explicacion: 'return devuelve n * 2: 5 * 2 = 10.'
    },
    {
      consigna: '¿Qué devuelve una función que no tiene return?',
      opciones: ['0', 'null', 'undefined', 'Un error'],
      correcta: 2,
      explicacion: 'Sin return, la función devuelve undefined.'
    },
    {
      consigna: 'En function saludar(nombre), ¿qué es nombre?',
      opciones: ['Un parámetro', 'El valor devuelto', 'El nombre de la función', 'Una variable global'],
      correcta: 0,
      explicacion: 'Los parámetros reciben los datos que se pasan al llamar la función: saludar("Ana").'
    }
  ]),
  completar('js-u4-l2', [
    {
      consigna: '¿Cuál es una función flecha válida que devuelve el triple de n?',
      opciones: ['const triple = (n) => n * 3', 'const triple = n -> n * 3', 'function => triple(n * 3)', 'const triple = (n) { n * 3 }'],
      correcta: 0,
      explicacion: 'La flecha es =>. Si el cuerpo es una sola expresión, se devuelve sin escribir return.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const sumar = (a, b) => a + b\nconsole.log(sumar(2, 3))',
      opciones: ['23', '5', 'undefined', 'a + b'],
      correcta: 1,
      explicacion: 'La flecha devuelve a + b de forma implícita: 2 + 3 = 5.'
    },
    {
      consigna: '¿Qué pasa si usás una variable declarada con const dentro de una función, desde afuera de ella?',
      opciones: ['Funciona igual', 'Da error: solo existe dentro de la función', 'Vale undefined', 'Vale 0'],
      correcta: 1,
      explicacion: 'Las variables de let y const tienen alcance de bloque: fuera de la función no existen.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const x = 1\nfunction mostrar() {\n  const x = 2\n  console.log(x)\n}\nmostrar()',
      opciones: ['1', '2', '1 y 2', 'Un error'],
      correcta: 1,
      explicacion: 'Adentro de la función se usa la x de la función, que vale 2.'
    }
  ]),

  // --- Unidad 5: Arrays y objetos -------------------------------------------------------
  completar('js-u5-l1', [
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const letras = ["a", "b", "c"]\nconsole.log(letras[1])',
      opciones: ['"a"', '"b"', '"c"', 'undefined'],
      correcta: 1,
      explicacion: 'Las posiciones empiezan en 0: la 1 es la segunda, "b".'
    },
    {
      consigna: '¿Qué método agrega un elemento al final de un array?',
      opciones: ['add()', 'push()', 'append()', 'insert()'],
      correcta: 1,
      explicacion: 'push() agrega al final. pop() saca el último.'
    },
    {
      consigna: '¿Cuánto vale ["a", "b", "c"].length?',
      opciones: ['2', '3', '4', '"c"'],
      correcta: 1,
      explicacion: 'length es la cantidad de elementos: 3. La última posición es 2.'
    },
    {
      consigna: '¿Qué hace pop()?',
      opciones: ['Agrega un elemento al principio', 'Saca y devuelve el último elemento', 'Vacía el array', 'Ordena el array'],
      correcta: 1,
      explicacion: 'pop() quita el último elemento y lo devuelve.'
    }
  ]),
  completar('js-u5-l2', [
    {
      consigna: '¿Cómo se accede al nombre de este usuario?',
      codigo: 'const usuario = { nombre: "Ada", edad: 36 }',
      opciones: ['usuario[0]', 'usuario.nombre', 'usuario->nombre', 'nombre.usuario'],
      correcta: 1,
      explicacion: 'Las propiedades de un objeto se leen con un punto: usuario.nombre.'
    },
    {
      consigna: '¿Qué método de array devuelve uno nuevo solo con los elementos que cumplen una condición?',
      opciones: ['map()', 'filter()', 'push()', 'find()'],
      correcta: 1,
      explicacion: 'filter() se queda con los que cumplen. map() transforma todos; find() devuelve solo el primero.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const n = [1, 2, 3]\nconsole.log(n.map((x) => x * 10))',
      opciones: ['[1, 2, 3]', '[10, 20, 30]', '60', '[10]'],
      correcta: 1,
      explicacion: 'map() aplica la función a cada elemento y devuelve un array nuevo.'
    },
    {
      consigna: '¿Qué imprime este código?',
      codigo: 'const n = [4, 15, 8, 23]\nconsole.log(n.filter((x) => x > 10))',
      opciones: ['[15, 23]', '[4, 8]', '2', '[true, false]'],
      correcta: 0,
      explicacion: 'Solo 15 y 23 son mayores que 10.'
    }
  ]),

  // --- Unidad 6: JavaScript en la pagina ---------------------------------------------------
  completar('js-u6-l1', [
    {
      consigna: '¿Qué hace document.querySelector(".titulo")?',
      opciones: ['Devuelve el primer elemento con la clase titulo', 'Crea un elemento nuevo', 'Borra los títulos', 'Devuelve todos los elementos con esa clase'],
      correcta: 0,
      explicacion: 'querySelector devuelve el primero que coincide. querySelectorAll devuelve todos.'
    },
    {
      consigna: '¿Qué propiedad cambia el texto de un elemento?',
      opciones: ['textContent', 'value()', 'html', 'texto'],
      correcta: 0,
      explicacion: 'elemento.textContent = "Hola" reemplaza su texto.'
    },
    {
      consigna: '¿Qué es el DOM?',
      opciones: ['Un lenguaje de estilos', 'La representación del HTML que JavaScript puede leer y modificar', 'Un servidor', 'Una base de datos'],
      correcta: 1,
      explicacion: 'El DOM es el árbol de elementos de la página, accesible desde JavaScript.'
    },
    {
      consigna: '¿Qué selector usarías para buscar el elemento con id="menu"?',
      opciones: ['document.querySelector(".menu")', 'document.querySelector("#menu")', 'document.querySelector("menu")', 'document.querySelector("@menu")'],
      correcta: 1,
      explicacion: 'querySelector usa selectores de CSS: # para id y . para clase.'
    }
  ]),
  completar('js-u6-l2', [
    {
      consigna: '¿Qué método escucha un evento sobre un elemento?',
      opciones: ['onEvent()', 'addEventListener()', 'listen()', 'attachClick()'],
      correcta: 1,
      explicacion: 'elemento.addEventListener("click", funcion) ejecuta la función en cada clic.'
    },
    {
      consigna: '¿Cuál de estos NO es un evento del DOM?',
      opciones: ['click', 'keydown', 'submit', 'compile'],
      correcta: 3,
      explicacion: 'click, keydown y submit son eventos; compile no existe.'
    },
    {
      consigna: '¿Qué pasa al hacer clic en el botón?',
      codigo: 'boton.addEventListener("click", () => {\n  mensaje.textContent = "Listo!"\n})',
      opciones: ['El texto de mensaje cambia a "Listo!"', 'Se borra el botón', 'No pasa nada hasta recargar', 'Se abre una página nueva'],
      correcta: 0,
      explicacion: 'Cada clic ejecuta la función, que cambia el texto del elemento mensaje.'
    },
    {
      consigna: '¿Qué evento se dispara cuando se envía un formulario?',
      opciones: ['send', 'submit', 'post', 'enter'],
      correcta: 1,
      explicacion: 'submit se dispara al enviar un formulario; suele usarse con evento.preventDefault().'
    }
  ])
]
