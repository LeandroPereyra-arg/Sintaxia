-- ===========================================================================
--  Sintaxia - Carga inicial del contenido
--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)
-- ---------------------------------------------------------------------------
--  ARCHIVO GENERADO: no editarlo a mano.
--  Se regenera con  npm run supabase:datos  a partir de src/data/.
--
--  Se ejecuta despues de 01-esquema.sql. Inserta el contenido y, si ya existe,
--  lo actualiza (upsert por id). NO BORRA NADA: desde la etapa 4 hay historial de
--  participantes que depende de las lecciones, y un borrado en cascada se lo
--  llevaria puesto. Se puede correr todas las veces que haga falta.
--
--  Consecuencia: si se saca una leccion o una pregunta del contenido de origen,
--  este script no la elimina de la base. Eso se hace a mano, con intencion.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Cursos (6)
-- ---------------------------------------------------------------------------
insert into public.cursos
  (id, nombre, descripcion, nivel, icono, color, color_texto, estado,
   requisito, horas_estimadas, unidades_previstas, lecciones_previstas, etiquetas, orden)
values
  ('javascript', 'JavaScript', 'El lenguaje de la web. Aprende variables, condicionales, bucles, funciones y como darle vida a una pagina.', 'Principiante', 'JS', '#f7df1e', '#1f2933', 'disponible', null, 12, 6, 14, array['Web', 'Front-end', 'Back-end'], 1),
  ('python', 'Python', 'Sintaxis simple y legible. Ideal para dar tus primeros pasos, automatizar tareas y entrar al mundo de los datos.', 'Principiante', 'Py', '#3776ab', '#ffffff', 'disponible', null, 13, 4, 8, array['Datos', 'Automatizacion'], 2),
  ('html-css', 'HTML y CSS', 'La estructura y el diseño de cualquier sitio web. Etiquetas, selectores, cajas, flexbox y diseño responsivo.', 'Principiante', '</>', '#e34f26', '#ffffff', 'disponible', null, 9, 4, 8, array['Web', 'Diseño'], 3),
  ('sql', 'SQL', 'Consulta y modifica bases de datos relacionales. SELECT, filtros, ordenamientos, joins y agrupaciones.', 'Intermedio', 'DB', '#00758f', '#ffffff', 'disponible', null, 8, 3, 6, array['Datos', 'Back-end'], 4),
  ('java', 'Java', 'Programacion orientada a objetos con tipado estatico. Clases, objetos, herencia y colecciones.', 'Intermedio', 'Ja', '#f89820', '#1f2933', 'disponible', null, 16, 4, 8, array['POO', 'Back-end'], 5),
  ('cpp', 'C++', 'Rendimiento y control de la memoria. Punteros, referencias, structs y el manejo manual de recursos.', 'Avanzado', 'C++', '#00599c', '#ffffff', 'disponible', null, 20, 4, 8, array['Sistemas', 'Videojuegos'], 6) on conflict (id) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  nivel = excluded.nivel,
  icono = excluded.icono,
  color = excluded.color,
  color_texto = excluded.color_texto,
  estado = excluded.estado,
  requisito = excluded.requisito,
  horas_estimadas = excluded.horas_estimadas,
  unidades_previstas = excluded.unidades_previstas,
  lecciones_previstas = excluded.lecciones_previstas,
  etiquetas = excluded.etiquetas,
  orden = excluded.orden;

-- ---------------------------------------------------------------------------
-- Unidades (25)
-- Todas publicadas: JavaScript (src/data/unidades.js) y los demas cursos
-- (src/data/cursosNuevos.js).
-- ---------------------------------------------------------------------------
insert into public.unidades
  (id, curso_id, orden, titulo, descripcion, icono, color, estado, temas)
values
  ('js-u1', 'javascript', 1, 'Primeros pasos', 'Que es JavaScript, como se guardan datos en variables y cuales son los tipos basicos del lenguaje.', 'cohete', '#2fbf56', 'publicada', array['Variables', 'let y const', 'Tipos de datos', 'console.log']),
  ('js-u2', 'javascript', 2, 'Operadores y decisiones', 'Operaciones matematicas, comparaciones y la forma de hacer que el programa tome caminos distintos.', 'bifurcacion', '#1cb0f6', 'publicada', array['Operadores', 'Comparaciones', 'if / else', 'Operadores logicos']),
  ('js-u3', 'javascript', 3, 'Bucles y repeticion', 'Repetir instrucciones sin escribirlas mil veces usando for, while y los cortes de un bucle.', 'repetir', '#7434db', 'publicada', array['for', 'while', 'break y continue']),
  ('js-u4', 'javascript', 4, 'Funciones', 'Agrupar codigo reutilizable, pasarle parametros, devolver resultados y entender el alcance de las variables.', 'pieza', '#ff8a3d', 'publicada', array['Declaracion', 'Parametros', 'return', 'Funciones flecha']),
  ('js-u5', 'javascript', 5, 'Arrays y objetos', 'Guardar muchos datos juntos: listas ordenadas, propiedades con nombre y los metodos mas usados.', 'caja', '#e94f8a', 'publicada', array['Arrays', 'push y length', 'Objetos', 'map y filter']),
  ('js-u6', 'javascript', 6, 'JavaScript en la pagina', 'Conectar el codigo con el HTML: buscar elementos, cambiar su contenido y responder a los clics del usuario.', 'globo', '#12b0a0', 'publicada', array['DOM', 'querySelector', 'Eventos', 'textContent']),
  ('py-u1', 'python', 1, 'Primeros pasos', 'Qué es Python, cómo mostrar mensajes y cómo guardar datos en variables.', 'cohete', '#3776ab', 'publicada', array['print', 'Variables', 'Tipos de datos', 'input']),
  ('py-u2', 'python', 2, 'Decisiones y bucles', 'Hacer que el programa elija un camino con if y repita tareas con for y while.', 'bifurcacion', '#2fbf56', 'publicada', array['if / elif / else', 'Comparaciones', 'for y range', 'while']),
  ('py-u3', 'python', 3, 'Listas y diccionarios', 'Guardar muchos datos juntos y recorrerlos.', 'caja', '#1cb0f6', 'publicada', array['Listas', 'Índices', 'Diccionarios', 'Recorrer colecciones']),
  ('py-u4', 'python', 4, 'Funciones', 'Agrupar código con def, recibir parámetros y devolver resultados.', 'pieza', '#7434db', 'publicada', array['def', 'Parámetros', 'return', 'Alcance']),
  ('web-u1', 'html-css', 1, 'Estructura con HTML', 'Las etiquetas que arman una página: títulos, párrafos, enlaces, imágenes y listas.', 'texto', '#e34f26', 'publicada', array['Etiquetas', 'Estructura del documento', 'Enlaces', 'Imágenes y listas']),
  ('web-u2', 'html-css', 2, 'Estilos con CSS', 'Darle color, tamaño y espacio a los elementos con selectores y propiedades.', 'globo', '#1572b6', 'publicada', array['Selectores', 'Propiedades', 'Colores', 'Modelo de caja']),
  ('web-u3', 'html-css', 3, 'Flexbox', 'Acomodar elementos en filas y columnas.', 'caja', '#2fbf56', 'publicada', array['display: flex', 'justify-content', 'align-items', 'gap']),
  ('web-u4', 'html-css', 4, 'Diseño responsivo', 'Páginas que se ven bien en el celular y en la compu.', 'puntero', '#7434db', 'publicada', array['Media queries', 'Unidades relativas', 'Imágenes flexibles']),
  ('sql-u1', 'sql', 1, 'Consultas básicas', 'Leer datos de una tabla, filtrarlos y ordenarlos.', 'carpetas', '#00758f', 'publicada', array['SELECT', 'FROM', 'WHERE', 'ORDER BY']),
  ('sql-u2', 'sql', 2, 'Combinar y agrupar', 'Unir tablas relacionadas y resumir datos con funciones de agregado.', 'pieza', '#2fbf56', 'publicada', array['JOIN', 'COUNT, SUM, AVG', 'GROUP BY', 'HAVING']),
  ('sql-u3', 'sql', 3, 'Modificar datos', 'Agregar, cambiar y borrar filas con cuidado.', 'variable', '#7434db', 'publicada', array['INSERT', 'UPDATE', 'DELETE', 'Transacciones']),
  ('java-u1', 'java', 1, 'Primeros pasos', 'La estructura de un programa en Java, los tipos y las variables.', 'cohete', '#f89820', 'publicada', array['main', 'System.out.println', 'Tipos primitivos', 'String']),
  ('java-u2', 'java', 2, 'Clases y objetos', 'La base de la programación orientada a objetos.', 'pieza', '#1cb0f6', 'publicada', array['Clases', 'Objetos y new', 'Constructores', 'Métodos']),
  ('java-u3', 'java', 3, 'Herencia', 'Reutilizar y especializar clases.', 'carpetas', '#2fbf56', 'publicada', array['extends', 'super', '@Override', 'Polimorfismo']),
  ('java-u4', 'java', 4, 'Colecciones', 'Listas y mapas que crecen solos.', 'caja', '#7434db', 'publicada', array['ArrayList', 'HashMap', 'for-each']),
  ('cpp-u1', 'cpp', 1, 'Primeros pasos', 'Un programa en C++, la salida por pantalla y los tipos básicos.', 'cohete', '#00599c', 'publicada', array['#include', 'main', 'cout', 'Tipos']),
  ('cpp-u2', 'cpp', 2, 'Referencias y punteros', 'Cómo C++ te deja trabajar directamente con la memoria.', 'flechaDiana', '#7434db', 'publicada', array['Direcciones', 'Referencias &', 'Punteros *', 'nullptr']),
  ('cpp-u3', 'cpp', 3, 'Structs y clases', 'Agrupar datos y comportamiento.', 'pieza', '#2fbf56', 'publicada', array['struct', 'class', 'Constructores', 'Destructores']),
  ('cpp-u4', 'cpp', 4, 'Memoria dinámica', 'Pedir y liberar memoria sin perder nada.', 'caja', '#1cb0f6', 'publicada', array['new y delete', 'Fugas de memoria', 'Punteros inteligentes']) on conflict (id) do update set
  curso_id = excluded.curso_id,
  orden = excluded.orden,
  titulo = excluded.titulo,
  descripcion = excluded.descripcion,
  icono = excluded.icono,
  color = excluded.color,
  estado = excluded.estado,
  temas = excluded.temas;

-- ---------------------------------------------------------------------------
-- Lecciones publicadas (52)
-- ---------------------------------------------------------------------------
insert into public.lecciones
  (id, unidad_id, orden, titulo, descripcion, icono, xp,
   explicacion, ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado)
values
  ('js-u1-l1', 'js-u1', 1, 'Que es JavaScript', 'Para que sirve el lenguaje, donde se ejecuta y como mostrar un mensaje.', 'estrella', 10, 'JavaScript es el lenguaje que le da comportamiento a las paginas web. El navegador trae adentro un motor que lo ejecuta, asi que no hace falta instalar nada para empezar. Para incluirlo en una pagina se usa la etiqueta <script>, y la instruccion console.log() sirve para mostrar valores en la consola del navegador mientras se programa.', 'Tu primera linea de JavaScript', '<!-- En el HTML -->
<script>
  // console.log muestra el valor en la consola del navegador
  console.log("Hola Sintaxia")
</script>', 'Abri la consola del navegador con F12 para ver el mensaje.', 'publicada'),
  ('js-u1-l2', 'js-u1', 2, 'Variables y constantes', 'Guardar datos con let y const, y cuando conviene cada uno.', 'variable', 15, 'Una variable es una caja con nombre donde se guarda un dato para usarlo despues. Con let se declara una variable que va a cambiar de valor, y con const una cuyo valor no se va a reasignar. La recomendacion es usar const por defecto y pasar a let solo cuando haga falta cambiarla: asi el codigo avisa que se espera de cada dato. Los nombres van en camelCase, no pueden empezar con numero ni llevar guiones.', 'let cambia, const no', 'let puntaje = 0        // va a cambiar durante el juego
puntaje = puntaje + 10 // permitido

const NOMBRE = "Ada"   // no se vuelve a asignar
// NOMBRE = "Grace"    // Error: Assignment to constant variable', 'La convencion para nombres de varias palabras es camelCase: puntajeTotal.', 'publicada'),
  ('js-u1-l3', 'js-u1', 3, 'Tipos de datos', 'Numeros, textos y booleanos, y como averiguar el tipo con typeof.', 'texto', 15, 'Todo dato en JavaScript tiene un tipo. Los tres que mas se usan al empezar son number (numeros, con o sin coma), string (texto, siempre entre comillas) y boolean (solo true o false). El operador typeof dice de que tipo es un valor. Prestar atencion al tipo importa: "42" con comillas es texto, no un numero, y por eso no se comporta igual en las cuentas.', 'Los tres tipos basicos', 'const edad = 36          // number
const nombre = "Ada"     // string (entre comillas)
const esMayor = true     // boolean

console.log(typeof edad)     // "number"
console.log(typeof nombre)   // "string"
console.log(typeof "42")     // "string", no "number"', 'typeof siempre devuelve el nombre del tipo como texto.', 'publicada'),
  ('js-u2-l1', 'js-u2', 1, 'Operadores basicos', 'Sumar, restar, concatenar y el resto de la division.', 'division', 15, 'Los operadores hacen cuentas y combinan valores. Ademas de + - * /, esta % que devuelve el resto de una division, muy usado para saber si un numero es par. Ojo con el +: si alguno de los dos lados es texto, en vez de sumar concatena.', 'Operadores y el resto de la division', 'console.log(7 + 3)   // 10
console.log(7 % 3)   // 1  (el resto)
console.log("5" + 3) // "53" concatena, no suma

let vidas = 3
vidas++              // ahora vale 4', null, 'publicada'),
  ('js-u2-l2', 'js-u2', 2, 'Comparaciones', 'Diferencias entre == y ===, mayor, menor y distinto.', 'balanza', 15, 'Comparar dos valores devuelve siempre true o false. Conviene usar === y !== (comparacion estricta) porque tienen en cuenta el tipo: == convierte los tipos antes de comparar y produce resultados inesperados.', 'Estricto contra flexible', 'console.log(0 === "0")  // false: number no es string
console.log(0 == "0")   // true: convierte antes de comparar
console.log(5 !== 3)    // true', null, 'publicada'),
  ('js-u2-l3', 'js-u2', 3, 'Condicionales if / else', 'Elegir caminos segun una condicion.', 'bifurcacion', 20, 'Un condicional deja que el programa tome caminos distintos. if evalua una condicion y, si da true, ejecuta su bloque; si da false, se ejecuta el else. Los operadores logicos && (y) y || (o) permiten combinar varias condiciones.', 'Elegir un camino', 'const nota = 7

if (nota >= 6) {
  console.log("Aprobado")
} else {
  console.log("Desaprobado")
}

if (nota >= 6 && nota <= 10) {
  console.log("Nota valida")
}', null, 'publicada'),
  ('js-u3-l1', 'js-u3', 1, 'El bucle for', 'Repetir una cantidad conocida de veces.', 'repetir', 20, 'Un bucle for repite un bloque una cantidad conocida de veces. Tiene tres partes: donde arranca el contador, hasta cuando sigue y como avanza. Es la forma clasica de recorrer un array usando su propiedad length.', 'Repetir cinco veces y recorrer un array', 'for (let i = 0; i < 5; i++) {
  console.log(i)   // 0, 1, 2, 3, 4
}

const frutas = ["pera", "uva"]
for (let i = 0; i < frutas.length; i++) {
  console.log(frutas[i])
}', null, 'publicada'),
  ('js-u3-l2', 'js-u3', 2, 'while, break y continue', 'Repetir mientras se cumpla algo y controlar las vueltas.', 'saltar', 20, 'while repite mientras una condicion siga siendo verdadera, y sirve cuando no se sabe de antemano cuantas vueltas haran falta. Dentro de cualquier bucle, break lo corta por completo y continue saltea solo la vuelta actual.', 'while, break y continue', 'let intentos = 0
while (intentos < 3) {
  intentos++
}

for (let i = 1; i <= 4; i++) {
  if (i === 2) continue  // saltea el 2
  if (i === 4) break     // corta el bucle
  console.log(i)         // 1, 3
}', null, 'publicada'),
  ('js-u4-l1', 'js-u4', 1, 'Declarar y llamar funciones', 'Agrupar codigo con nombre para reutilizarlo.', 'pieza', 20, 'Una funcion agrupa codigo con un nombre para poder reutilizarlo. Recibe datos por sus parametros y devuelve un resultado con return. Si no se escribe return, la funcion devuelve undefined.', 'Declarar, llamar y devolver', 'function doble(n) {
  return n * 2
}

console.log(doble(4))   // 8

function saludar(nombre) {
  console.log("Hola " + nombre)
}                        // sin return: devuelve undefined', null, 'publicada'),
  ('js-u4-l2', 'js-u4', 2, 'Funciones flecha y alcance', 'Sintaxis corta y donde vive cada variable.', 'flechaDiana', 20, 'Las funciones flecha son una forma mas corta de escribir funciones. Si el cuerpo es una sola expresion, se puede omitir el return. Las variables declaradas con let o const dentro de una funcion solo existen ahi adentro: eso es el alcance.', 'Funcion flecha y alcance', 'const cuadrado = (n) => n * n   // return implicito
console.log(cuadrado(3))        // 9

function prueba() {
  const secreto = 42
}
// console.log(secreto)  // Error: no existe fuera', null, 'publicada'),
  ('js-u5-l1', 'js-u5', 1, 'Arrays', 'Listas ordenadas de valores y sus metodos basicos.', 'caja', 20, 'Un array es una lista ordenada de valores. Se accede a cada uno por su posicion, que empieza en 0, y length dice cuantos elementos tiene. push() agrega al final y pop() saca el ultimo.', 'Listas ordenadas', 'const colores = ["rojo", "verde", "azul"]

console.log(colores[0])      // "rojo"
console.log(colores[1])      // "verde"
console.log(colores.length)  // 3

colores.push("negro")        // lo agrega al final', null, 'publicada'),
  ('js-u5-l2', 'js-u5', 2, 'Objetos', 'Agrupar datos relacionados con propiedades con nombre.', 'carpetas', 25, 'Un objeto agrupa datos relacionados con un nombre cada uno, en vez de por posicion. Se accede a cada propiedad con un punto. Sobre los arrays, map() transforma cada elemento y filter() se queda solo con los que cumplen una condicion.', 'Objetos, map y filter', 'const usuario = { nombre: "Ada", edad: 36 }
console.log(usuario.nombre)   // "Ada"

const numeros = [4, 15, 8, 23]
const grandes = numeros.filter((n) => n > 10)
console.log(grandes)          // [15, 23]', null, 'publicada'),
  ('js-u6-l1', 'js-u6', 1, 'Buscar y cambiar elementos', 'El DOM: como llegar al HTML desde JavaScript.', 'globo', 25, 'El DOM es la representacion del HTML que JavaScript puede leer y modificar. querySelector() busca el primer elemento que coincide con un selector de CSS, y textContent permite leer o cambiar su texto.', 'Buscar y cambiar un elemento', 'const titulo = document.querySelector("h1")
titulo.textContent = "Hola mundo"

// querySelectorAll devuelve todos los que coinciden
const items = document.querySelectorAll(".item")', null, 'publicada'),
  ('js-u6-l2', 'js-u6', 2, 'Eventos', 'Responder a los clics y a las acciones del usuario.', 'puntero', 25, 'Un evento es algo que ocurre en la pagina: un clic, una tecla, el envio de un formulario. Con addEventListener() se indica que funcion ejecutar cada vez que ese evento sucede sobre un elemento.', 'Responder a un clic', 'const boton = document.querySelector("#accion")
const parrafo = document.querySelector("#mensaje")

boton.addEventListener("click", () => {
  parrafo.textContent = "Listo!"
})', null, 'publicada'),
  ('py-u1-l1', 'py-u1', 1, 'Hola, Python', 'Para qué sirve Python y cómo mostrar un mensaje con print().', 'estrella', 10, 'Python es un lenguaje de propósito general, famoso por su sintaxis simple y legible. Se usa para automatizar tareas, analizar datos, hacer sitios web e inteligencia artificial. La función print() muestra valores en la pantalla, y los comentarios empiezan con #: Python los ignora. A diferencia de otros lenguajes, no hace falta terminar las líneas con punto y coma.', 'Tu primer programa', '# Esto es un comentario
print("Hola Sintaxia")
print(2 + 3)  # muestra 5', 'Cada print() escribe en una línea nueva.', 'publicada'),
  ('py-u1-l2', 'py-u1', 2, 'Variables y tipos', 'Guardar datos con un nombre y conocer los tipos básicos.', 'variable', 10, 'Una variable es un nombre que guarda un valor. En Python se crea simplemente asignándole algo con =, sin declarar el tipo: Python lo deduce. Los tipos básicos son int (enteros), float (números con decimales), str (texto, entre comillas) y bool (True o False). La función type() dice de qué tipo es un valor, e input() lee lo que escribe la persona, siempre como texto.', 'Variables de distintos tipos', 'edad = 16          # int
altura = 1.72      # float
nombre = "Ana"     # str
mayor = edad >= 18 # bool (False)
print(type(nombre))  # <class ''str''>', 'Los nombres de variables no pueden empezar con un número ni tener espacios.', 'publicada'),
  ('py-u2-l1', 'py-u2', 1, 'Tomar decisiones con if', 'Comparar valores y elegir qué código ejecutar.', 'bifurcacion', 10, 'if ejecuta un bloque solo si una condición es verdadera. elif agrega otra condición y else cubre el resto de los casos. En Python los bloques se marcan con sangría (cuatro espacios) y la línea del if termina con dos puntos. Para comparar se usan ==, !=, <, >, <= y >=, y las condiciones se combinan con and, or y not.', 'Calificación', 'nota = 7
if nota >= 8:
    print("Excelente")
elif nota >= 6:
    print("Aprobado")
else:
    print("A recuperar")', 'Se ejecuta solo el primer bloque cuya condición se cumple: acá, "Aprobado".', 'publicada'),
  ('py-u2-l2', 'py-u2', 2, 'Repetir con for y while', 'Recorrer secuencias y repetir mientras se cumpla una condición.', 'repetir', 10, 'for recorre los elementos de una secuencia uno por uno. Con range(n) se obtienen los números de 0 a n - 1, ideal para repetir algo n veces; range(a, b) va de a hasta b - 1. while repite mientras su condición sea verdadera, así que dentro del bucle algo tiene que cambiar para que termine. break corta el bucle antes de tiempo.', 'Contar', 'for i in range(3):
    print(i)      # 0, 1, 2

n = 3
while n > 0:
    print(n)      # 3, 2, 1
    n = n - 1', 'range(3) tiene tres números, pero empieza en 0.', 'publicada'),
  ('web-u1-l1', 'web-u1', 1, 'Etiquetas y documento', 'Cómo se escribe una etiqueta y qué partes tiene una página HTML.', 'estrella', 10, 'HTML describe el contenido de una página con etiquetas. La mayoría se abre y se cierra: <p> abre un párrafo y </p> lo cierra. Los títulos van de <h1> (el más importante) a <h6>. Todo documento tiene <html>, un <head> con datos de la página (como el <title> de la pestaña) y un <body> con lo que se ve.', 'Una página mínima', '<!DOCTYPE html>
<html>
  <head>
    <title>Mi página</title>
  </head>
  <body>
    <h1>Hola</h1>
    <p>Este es un párrafo.</p>
  </body>
</html>', 'El <title> se ve en la pestaña del navegador, no dentro de la página.', 'publicada'),
  ('web-u1-l2', 'web-u1', 2, 'Enlaces, imágenes y listas', 'Conectar páginas, mostrar imágenes y armar listas.', 'saltar', 10, 'Las etiquetas pueden tener atributos que les dan información extra. Un enlace es <a> con el atributo href, que dice a dónde lleva. Una imagen es <img> con src (el archivo) y alt (un texto que la describe para quien no la puede ver); <img> no tiene etiqueta de cierre. Las listas son <ul> (con viñetas) u <ol> (numeradas), y cada elemento va en un <li>.', 'Atributos en acción', '<a href="https://sintaxia.app">Ir a Sintaxia</a>
<img src="sintax.png" alt="La cotorra Sintax">
<ul>
  <li>HTML</li>
  <li>CSS</li>
</ul>', 'El texto entre <a> y </a> es lo que se puede tocar.', 'publicada'),
  ('web-u2-l1', 'web-u2', 1, 'Selectores y propiedades', 'Elegir qué elementos cambiar y cómo.', 'flechaDiana', 10, 'Una regla de CSS tiene un selector (a qué elementos se aplica) y, entre llaves, declaraciones propiedad: valor; separadas por punto y coma. El selector p elige todos los párrafos, .destacado elige los elementos con class="destacado" y #menu elige el elemento con id="menu". Propiedades comunes: color (texto), background-color (fondo), font-size (tamaño de letra).', 'Tres tipos de selector', 'p {
  color: navy;
}
.destacado {
  background-color: yellow;
}
#menu {
  font-size: 20px;
}', 'Una clase se puede repetir en muchos elementos; un id, solo en uno.', 'publicada'),
  ('web-u2-l2', 'web-u2', 2, 'El modelo de caja', 'Contenido, relleno, borde y margen de cada elemento.', 'caja', 10, 'Para CSS, cada elemento es una caja con cuatro capas: el contenido, el padding (relleno entre el contenido y el borde), el border y el margin (espacio afuera, que lo separa de los demás). width y height fijan el tamaño del contenido; con box-sizing: border-box, en cambio, incluyen padding y borde, que suele ser más fácil de calcular.', 'Una tarjeta', '.tarjeta {
  padding: 16px;          /* adentro */
  border: 2px solid gray;
  margin: 24px;           /* afuera */
  box-sizing: border-box;
}', 'padding agranda la caja hacia adentro del borde; margin la separa de lo de alrededor.', 'publicada'),
  ('sql-u1-l1', 'sql-u1', 1, 'SELECT y FROM', 'Pedirle datos a una tabla.', 'estrella', 10, 'Una base de datos relacional guarda la información en tablas: cada fila es un registro y cada columna, un dato. SELECT dice qué columnas se quieren y FROM, de qué tabla. SELECT * trae todas las columnas. Por convención las palabras de SQL se escriben en mayúsculas, aunque no es obligatorio, y cada consulta termina con punto y coma.', 'Leer una tabla', '-- Todas las columnas de la tabla alumnos
SELECT * FROM alumnos;

-- Solo el nombre y la edad
SELECT nombre, edad FROM alumnos;', 'Los comentarios en SQL empiezan con --.', 'publicada'),
  ('sql-u1-l2', 'sql-u1', 2, 'Filtrar y ordenar', 'Quedarse con las filas que interesan y ordenarlas.', 'balanza', 10, 'WHERE filtra las filas con una condición: solo vuelven las que la cumplen. Se compara con =, <>, <, >, <= y >=, y se combinan condiciones con AND y OR. Los textos van entre comillas simples. LIKE busca patrones: % reemplaza cualquier cantidad de caracteres. ORDER BY ordena el resultado: ASC de menor a mayor (por defecto) y DESC de mayor a menor.', 'Filtrar y ordenar', 'SELECT nombre, edad
FROM alumnos
WHERE edad >= 16 AND curso = ''5A''
ORDER BY edad DESC;', 'El orden de las cláusulas es fijo: SELECT, FROM, WHERE y después ORDER BY.', 'publicada'),
  ('sql-u2-l1', 'sql-u2', 1, 'Unir tablas con JOIN', 'Combinar filas de dos tablas relacionadas.', 'pieza', 10, 'Las tablas se relacionan con claves: la clave primaria identifica cada fila y una clave foránea en otra tabla apunta a ella. JOIN combina dos tablas usando esa relación, que se escribe después de ON. INNER JOIN (o simplemente JOIN) devuelve solo las filas que tienen pareja en las dos tablas; LEFT JOIN devuelve todas las de la tabla de la izquierda, aunque no tengan pareja.', 'Alumnos con su curso', 'SELECT a.nombre, c.nombre AS curso
FROM alumnos a
JOIN cursos c ON c.id = a.curso_id;', 'a y c son alias: nombres cortos para no repetir el nombre de cada tabla.', 'publicada'),
  ('sql-u2-l2', 'sql-u2', 2, 'Agrupar y resumir', 'Contar, sumar y promediar con GROUP BY.', 'division', 10, 'Las funciones de agregado resumen muchas filas en un valor: COUNT cuenta, SUM suma, AVG promedia y MIN y MAX dan el menor y el mayor. GROUP BY arma un grupo por cada valor distinto de una columna y calcula el agregado de cada grupo. Para filtrar grupos (no filas) se usa HAVING, que va después de GROUP BY.', 'Alumnos por curso', 'SELECT curso_id, COUNT(*) AS cantidad
FROM alumnos
GROUP BY curso_id
HAVING COUNT(*) > 20;', 'WHERE filtra filas antes de agrupar; HAVING filtra los grupos ya armados.', 'publicada'),
  ('java-u1-l1', 'java-u1', 1, 'Hola, Java', 'Cómo es un programa en Java y cómo mostrar un mensaje.', 'estrella', 10, 'En Java todo el código vive dentro de una clase. El programa empieza a ejecutarse en el método public static void main(String[] args). Para mostrar texto se usa System.out.println(), que agrega un salto de línea al final. Cada instrucción termina con punto y coma y los bloques se marcan con llaves. Java distingue mayúsculas de minúsculas.', 'El programa mínimo', 'public class Hola {
    public static void main(String[] args) {
        System.out.println("Hola Sintaxia");
    }
}', 'El archivo tiene que llamarse igual que la clase pública: Hola.java.', 'publicada'),
  ('java-u1-l2', 'java-u1', 2, 'Tipos y variables', 'Declarar variables con su tipo.', 'variable', 10, 'Java tiene tipado estático: cada variable se declara con su tipo y no puede cambiarlo. Los tipos primitivos más usados son int (enteros), double (decimales), boolean (true o false) y char (un carácter, entre comillas simples). String guarda texto entre comillas dobles y es una clase, por eso va con mayúscula. Dividir dos int da un int: se pierde la parte decimal.', 'Declarar variables', 'int edad = 16;
double precio = 99.5;
boolean activo = true;
char inicial = ''A'';
String nombre = "Ana";
System.out.println(7 / 2);   // 3', 'Para obtener 3.5 hay que dividir con un double: 7.0 / 2.', 'publicada'),
  ('java-u2-l1', 'java-u2', 1, 'Clases y objetos', 'Moldes y las cosas que se crean con ellos.', 'pieza', 10, 'Una clase es un molde que define qué datos (atributos) y qué acciones (métodos) tiene algo. Un objeto es una instancia concreta creada a partir de la clase con new. Cada objeto tiene sus propios valores en los atributos. Con el punto se accede a los atributos y métodos de un objeto, y private hace que un atributo solo se pueda usar dentro de su clase.', 'Una clase Perro', 'class Perro {
    String nombre;
    void ladrar() {
        System.out.println(nombre + " dice guau");
    }
}

Perro p = new Perro();
p.nombre = "Toby";
p.ladrar();   // Toby dice guau', 'Perro es la clase; p es un objeto de esa clase.', 'publicada'),
  ('java-u2-l2', 'java-u2', 2, 'Constructores y métodos', 'Inicializar objetos y darles comportamiento.', 'saltar', 10, 'El constructor es un método especial que se ejecuta al hacer new: se llama igual que la clase y no tiene tipo de retorno. Sirve para dar valores iniciales; this se refiere al objeto que se está creando. Un método declara qué devuelve (o void si no devuelve nada) y usa return para entregar el resultado.', 'Constructor y método', 'class Rectangulo {
    double ancho, alto;
    Rectangulo(double ancho, double alto) {
        this.ancho = ancho;
        this.alto = alto;
    }
    double area() {
        return ancho * alto;
    }
}

Rectangulo r = new Rectangulo(3, 4);
System.out.println(r.area());   // 12.0', 'this.ancho es el atributo; ancho, a secas, es el parámetro.', 'publicada'),
  ('cpp-u1-l1', 'cpp-u1', 1, 'Hola, C++', 'La estructura de un programa y cómo mostrar texto.', 'estrella', 10, 'C++ es un lenguaje compilado: el código se traduce a un programa ejecutable antes de correrlo. Todo programa empieza en la función int main(). Para mostrar texto se usa std::cout con el operador <<, que viene de la biblioteca <iostream>, incluida con #include. std::endl (o "\n") salta de línea y main devuelve 0 para indicar que todo salió bien.', 'El programa mínimo', '#include <iostream>

int main() {
    std::cout << "Hola Sintaxia" << std::endl;
    return 0;
}', 'Con using namespace std; se puede escribir cout en lugar de std::cout.', 'publicada'),
  ('cpp-u1-l2', 'cpp-u1', 2, 'Tipos y variables', 'Declarar variables y leer datos con cin.', 'variable', 10, 'Como en Java, cada variable se declara con su tipo: int (enteros), double (decimales), bool (true o false), char (un carácter) y std::string (texto, de la biblioteca <string>). const hace que el valor no se pueda cambiar. std::cin >> variable lee lo que escribe la persona. Una variable sin inicializar tiene un valor basura: conviene darle siempre un valor inicial.', 'Leer y mostrar', '#include <iostream>
#include <string>

int main() {
    const double PI = 3.14159;
    int edad = 0;
    std::cin >> edad;
    std::cout << "Tenés " << edad << " años\n";
}', 'Intentar cambiar PI después da error de compilación.', 'publicada'),
  ('cpp-u2-l1', 'cpp-u2', 1, 'Referencias', 'Otro nombre para la misma variable.', 'flechaDiana', 10, 'Una referencia es un alias: otro nombre para una variable que ya existe. Se declara con & después del tipo (int& r = x;) y desde entonces cambiar r es cambiar x. Se usan mucho en parámetros: si una función recibe int& n, trabaja sobre la variable original y no sobre una copia. Una referencia tiene que inicializarse al declararla y no puede pasar a referirse a otra variable.', 'Por copia y por referencia', 'void sumarUnoCopia(int n) { n++; }
void sumarUno(int& n) { n++; }

int x = 5;
sumarUnoCopia(x);   // x sigue en 5
sumarUno(x);        // x pasa a 6', 'Pasar por referencia también evita copiar objetos grandes.', 'publicada'),
  ('cpp-u2-l2', 'cpp-u2', 2, 'Punteros', 'Variables que guardan direcciones de memoria.', 'puntero', 10, 'Cada variable vive en una dirección de memoria, que se obtiene con & (&x). Un puntero es una variable que guarda una dirección: int* p = &x;. Con * delante del puntero (desreferenciar) se accede al valor que está en esa dirección. nullptr indica que un puntero no apunta a nada, y desreferenciar un puntero nulo hace fallar el programa.', 'Apuntar y desreferenciar', 'int x = 5;
int* p = &x;    // p guarda la dirección de x
*p = 8;         // cambia x a través de p
std::cout << x; // 8

int* nada = nullptr;', 'En int* p el * es parte del tipo; en *p = 8 es el operador que desreferencia.', 'publicada'),
  ('py-u3-l1', 'py-u3', 1, 'Listas', 'Guardar varios valores en orden y recorrerlos.', 'caja', 10, 'Una lista guarda varios valores en orden, entre corchetes y separados por comas. Cada elemento se lee por su índice, que empieza en 0; los índices negativos cuentan desde el final (-1 es el último). len() dice cuántos elementos tiene, append() agrega uno al final y el operador in pregunta si un valor está en la lista. Con for se recorre elemento por elemento.', 'Una lista de frutas', 'frutas = ["pera", "uva", "kiwi"]
print(frutas[0])    # pera
print(frutas[-1])   # kiwi
frutas.append("mango")
print(len(frutas))  # 4
for f in frutas:
    print(f)', 'Las listas se pueden modificar después de creadas.', 'publicada'),
  ('py-u3-l2', 'py-u3', 2, 'Diccionarios', 'Guardar datos con nombre: pares clave y valor.', 'carpetas', 10, 'Un diccionario guarda pares clave: valor entre llaves. En lugar de una posición, cada valor se busca por su clave: alumno["nombre"]. Asignar a una clave nueva la agrega y asignar a una existente cambia su valor. get() devuelve None (o un valor por defecto) si la clave no existe, en vez de dar error, y items() permite recorrer clave y valor a la vez.', 'Un alumno', 'alumno = {"nombre": "Ana", "edad": 16}
print(alumno["nombre"])        # Ana
alumno["curso"] = "5A"          # agrega una clave
print(alumno.get("mail", "-"))  # -
for clave, valor in alumno.items():
    print(clave, valor)', 'Las claves no se repiten: asignar dos veces la misma reemplaza el valor.', 'publicada'),
  ('py-u4-l1', 'py-u4', 1, 'Definir funciones', 'Agrupar código con def y devolver resultados.', 'pieza', 10, 'Una función se define con def, su nombre, los parámetros entre paréntesis y dos puntos; el cuerpo va sangrado. return devuelve un resultado y termina la función; si no hay return, devuelve None. Los parámetros pueden tener un valor por defecto, que se usa cuando no se pasa ese argumento.', 'Funciones simples', 'def doble(n):
    return n * 2

def saludar(nombre="amigo"):
    print("Hola", nombre)

print(doble(4))   # 8
saludar()         # Hola amigo
saludar("Ana")    # Hola Ana', 'Una función no hace nada hasta que se la llama.', 'publicada'),
  ('py-u4-l2', 'py-u4', 2, 'Alcance y buenas prácticas', 'Dónde existe cada variable y cómo escribir funciones claras.', 'flechaDiana', 10, 'Las variables creadas dentro de una función son locales: solo existen mientras corre la función. Las de afuera son globales y se pueden leer desde adentro, pero para cambiarlas haría falta global, algo que conviene evitar: es mejor recibir datos por parámetros y devolver resultados con return. Una buena función hace una sola cosa y tiene un nombre que lo dice.', 'Local y global', 'total = 0

def sumar(a, b):
    resultado = a + b   # local
    return resultado

total = sumar(2, 3)
print(total)        # 5
# print(resultado)  # error: no existe afuera', 'Devolver el resultado es más claro que modificar variables globales.', 'publicada'),
  ('web-u3-l1', 'web-u3', 1, 'Filas y columnas con flex', 'Acomodar elementos en una dirección.', 'caja', 10, 'Con display: flex un contenedor acomoda a sus hijos en una fila (por defecto). flex-direction: column los pone en columna. gap deja espacio entre ellos sin usar margin. flex-wrap: wrap permite que bajen a otra línea cuando no entran. Las propiedades flex se ponen en el CONTENEDOR, no en cada hijo.', 'Una barra de botones', '.barra {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.columna {
  display: flex;
  flex-direction: column;
}', 'flex: 1 en un hijo hace que ocupe el espacio que sobra.', 'publicada'),
  ('web-u3-l2', 'web-u3', 2, 'Alinear con flexbox', 'Centrar y repartir el espacio.', 'balanza', 10, 'justify-content reparte los hijos en el eje principal (el horizontal, en una fila): flex-start, center, flex-end, space-between (los extremos pegados a los bordes) o space-around. align-items los alinea en el eje cruzado (el vertical, en una fila): stretch, center, flex-start o flex-end. Con justify-content: center y align-items: center se centra algo en las dos direcciones.', 'Centrar una tarjeta', '.pantalla {
  display: flex;
  justify-content: center;  /* horizontal */
  align-items: center;      /* vertical */
  min-height: 100vh;
}', 'En flex-direction: column los ejes se intercambian.', 'publicada'),
  ('web-u4-l1', 'web-u4', 1, 'Media queries', 'Cambiar los estilos según el ancho de la pantalla.', 'puntero', 10, 'Una media query aplica estilos solo cuando se cumple una condición, por ejemplo un ancho de pantalla. @media (max-width: 600px) { ... } vale para pantallas de hasta 600 px. Conviene diseñar primero para el celular (mobile first) y agregar con min-width lo que cambia en pantallas grandes. La etiqueta <meta name="viewport" content="width=device-width, initial-scale=1"> hace que el celular use su ancho real.', 'De una a dos columnas', '.tarjetas {
  display: flex;
  flex-direction: column;
}
@media (min-width: 700px) {
  .tarjetas {
    flex-direction: row;
  }
}', 'Sin la etiqueta viewport, el celular muestra la página como si fuera una pantalla de compu achicada.', 'publicada'),
  ('web-u4-l2', 'web-u4', 2, 'Unidades relativas e imágenes flexibles', 'Tamaños que se adaptan a la pantalla.', 'globo', 10, 'Los px son fijos; las unidades relativas se adaptan. % es relativo al contenedor, rem al tamaño de letra de la página (1rem suele ser 16 px), em al tamaño de letra del propio elemento y vw/vh al ancho/alto de la ventana (100vw es todo el ancho). Para que una imagen nunca se salga de su contenedor se usa max-width: 100% y height: auto.', 'Tamaños flexibles', 'h1 {
  font-size: 2rem;     /* el doble de la letra base */
}
.contenedor {
  width: 90%;
  max-width: 960px;
}
img {
  max-width: 100%;
  height: auto;
}', 'height: auto mantiene la proporción de la imagen.', 'publicada'),
  ('sql-u3-l1', 'sql-u3', 1, 'INSERT y UPDATE', 'Agregar filas nuevas y cambiar las que existen.', 'variable', 10, 'INSERT INTO tabla (columnas) VALUES (valores) agrega una fila nueva; los valores van en el mismo orden que las columnas. UPDATE tabla SET columna = valor cambia filas que ya existen, y casi siempre lleva un WHERE: sin WHERE, el cambio se aplica a TODAS las filas de la tabla.', 'Agregar y modificar', 'INSERT INTO alumnos (nombre, edad)
VALUES (''Ana'', 16);

UPDATE alumnos
SET edad = 17
WHERE nombre = ''Ana'';', 'Antes de un UPDATE conviene probar el WHERE con un SELECT.', 'publicada'),
  ('sql-u3-l2', 'sql-u3', 2, 'DELETE y transacciones', 'Borrar con cuidado y confirmar o deshacer cambios.', 'balanza', 10, 'DELETE FROM tabla WHERE condición borra las filas que cumplen la condición; sin WHERE borra todas. Una transacción agrupa varias instrucciones para que se apliquen todas juntas o ninguna: empieza con BEGIN, COMMIT confirma los cambios y ROLLBACK los deshace. Es lo que evita, por ejemplo, que una transferencia descuente plata de una cuenta sin sumarla en la otra.', 'Una transferencia', 'BEGIN;
UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;
COMMIT;

DELETE FROM sesiones WHERE vence < NOW();', 'Si algo falla antes del COMMIT, ROLLBACK deja todo como estaba.', 'publicada'),
  ('java-u3-l1', 'java-u3', 1, 'extends y super', 'Crear una clase a partir de otra.', 'carpetas', 10, 'La herencia permite crear una clase hija a partir de una clase padre con extends: la hija recibe sus atributos y métodos y puede agregar los propios. En el constructor de la hija, super(...) llama al constructor del padre y tiene que ir en la primera línea. En Java una clase hereda de una sola clase.', 'Animal y Perro', 'class Animal {
    String nombre;
    Animal(String nombre) { this.nombre = nombre; }
    void comer() { System.out.println(nombre + " come"); }
}

class Perro extends Animal {
    Perro(String nombre) { super(nombre); }
    void ladrar() { System.out.println("Guau"); }
}', 'Un Perro puede comer() porque lo heredó de Animal.', 'publicada'),
  ('java-u3-l2', 'java-u3', 2, 'Sobrescritura y polimorfismo', 'Que cada clase responda a su manera.', 'bifurcacion', 10, 'Una clase hija puede sobrescribir (redefinir) un método del padre con la misma firma; la anotación @Override le pide al compilador que verifique que de verdad lo está sobrescribiendo. Polimorfismo: una variable del tipo del padre puede guardar un objeto de la hija, y al llamar al método se ejecuta la versión de la clase real del objeto.', 'Cada animal hace su sonido', 'class Animal {
    String sonido() { return "..."; }
}
class Gato extends Animal {
    @Override
    String sonido() { return "Miau"; }
}

Animal a = new Gato();
System.out.println(a.sonido());   // Miau', 'La variable es de tipo Animal, pero el objeto es un Gato.', 'publicada'),
  ('java-u4-l1', 'java-u4', 1, 'ArrayList', 'Listas que crecen solas.', 'caja', 10, 'Un array en Java tiene tamaño fijo; ArrayList, en cambio, crece a medida que se agregan elementos. Se declara con el tipo entre <> (ArrayList<String>) y se importa de java.util. add() agrega, get(i) lee la posición i (desde 0), size() dice cuántos hay y remove() quita. Se recorre fácil con el for-each.', 'Una lista de nombres', 'import java.util.ArrayList;

ArrayList<String> nombres = new ArrayList<>();
nombres.add("Ana");
nombres.add("Leo");
System.out.println(nombres.get(0));   // Ana
System.out.println(nombres.size());   // 2
for (String n : nombres) {
    System.out.println(n);
}', 'Para números se usa la clase Integer: ArrayList<Integer>.', 'publicada'),
  ('java-u4-l2', 'java-u4', 2, 'HashMap', 'Guardar valores por clave.', 'carpetas', 10, 'HashMap guarda pares clave-valor: HashMap<String, Integer> asocia textos con números. put(clave, valor) agrega o reemplaza, get(clave) devuelve el valor (o null si la clave no está), containsKey() pregunta si existe la clave y keySet() devuelve las claves para recorrerlas. Las claves no se repiten.', 'Puntajes', 'import java.util.HashMap;

HashMap<String, Integer> puntos = new HashMap<>();
puntos.put("Ana", 120);
puntos.put("Leo", 90);
System.out.println(puntos.get("Ana"));         // 120
System.out.println(puntos.containsKey("Sol"));  // false
for (String n : puntos.keySet()) {
    System.out.println(n + ": " + puntos.get(n));
}', 'Un HashMap no garantiza el orden de las claves.', 'publicada'),
  ('cpp-u3-l1', 'cpp-u3', 1, 'struct', 'Agrupar datos relacionados.', 'pieza', 10, 'Un struct agrupa varios datos (miembros) bajo un mismo nombre: struct Punto { int x; int y; };. Se crean variables de ese tipo y se accede a cada miembro con el punto. Si se tiene un puntero a un struct, se usa la flecha ->. La definición del struct termina con punto y coma.', 'Un punto en el plano', 'struct Punto {
    int x;
    int y;
};

Punto p = {3, 4};
p.x = 10;
Punto* q = &p;
std::cout << q->y;   // 4', 'q->y es lo mismo que (*q).y.', 'publicada'),
  ('cpp-u3-l2', 'cpp-u3', 2, 'Clases, constructores y destructores', 'Datos privados y funciones que los cuidan.', 'carpetas', 10, 'Una class es como un struct, pero sus miembros son privados por defecto (en un struct son públicos). public: marca lo que se puede usar desde afuera. El constructor se llama igual que la clase y se ejecuta al crear el objeto; el destructor (~NombreDeLaClase) se ejecuta cuando el objeto deja de existir y sirve para liberar recursos.', 'Una cuenta', 'class Cuenta {
    double saldo;            // privado
public:
    Cuenta(double inicial) : saldo(inicial) {}
    ~Cuenta() { std::cout << "Chau cuenta\n"; }
    void depositar(double m) { saldo += m; }
    double verSaldo() const { return saldo; }
};', 'saldo no se puede tocar desde afuera: solo con depositar() y verSaldo().', 'publicada'),
  ('cpp-u4-l1', 'cpp-u4', 1, 'new y delete', 'Pedir y liberar memoria a mano.', 'caja', 10, 'Las variables locales viven en la pila y se liberan solas al terminar la función. Con new se pide memoria en el montón (heap), que sigue existiendo hasta que se libera con delete; para arrays se usa new[] y delete[]. Si se pierde el puntero sin hacer delete, esa memoria queda ocupada para siempre: es una fuga de memoria.', 'Memoria dinámica', 'int* n = new int(5);
std::cout << *n;      // 5
delete n;

int* v = new int[3];  // array de 3 enteros
v[0] = 10;
delete[] v;', 'A cada new le corresponde un delete (y a cada new[], un delete[]).', 'publicada'),
  ('cpp-u4-l2', 'cpp-u4', 2, 'Punteros inteligentes', 'Que la memoria se libere sola.', 'flechaDiana', 10, 'Los punteros inteligentes de <memory> liberan la memoria automáticamente cuando ya no se usan, así no hace falta escribir delete. std::unique_ptr tiene un único dueño: no se puede copiar, solo mover. std::shared_ptr puede tener varios dueños y libera la memoria cuando se va el último. Se crean con std::make_unique y std::make_shared.', 'Sin delete', '#include <memory>

auto p = std::make_unique<int>(42);
std::cout << *p;               // 42

auto a = std::make_shared<int>(7);
auto b = a;                    // dos dueños
std::cout << a.use_count();    // 2', 'Al salir de la función, p, a y b liberan su memoria solos.', 'publicada') on conflict (id) do update set
  unidad_id = excluded.unidad_id,
  orden = excluded.orden,
  titulo = excluded.titulo,
  descripcion = excluded.descripcion,
  icono = excluded.icono,
  xp = excluded.xp,
  explicacion = excluded.explicacion,
  ejemplo_titulo = excluded.ejemplo_titulo,
  ejemplo_codigo = excluded.ejemplo_codigo,
  ejemplo_nota = excluded.ejemplo_nota,
  estado = excluded.estado;

-- ---------------------------------------------------------------------------
-- Preguntas (208) - todas de opcion multiple
-- La explicacion es parte de la solucion: el rol anon no la puede leer.
-- ---------------------------------------------------------------------------
insert into public.preguntas
  (id, leccion_id, orden, tipo, enunciado, codigo, explicacion, estado)
values
  ('js-u1-l1-a1', 'js-u1-l1', 1, 'opcion-multiple', 'Donde se ejecuta principalmente JavaScript cuando visitas una pagina web?', null, 'El navegador trae un motor de JavaScript que ejecuta el codigo de la pagina. Con Node.js tambien puede correr en un servidor, pero en la web corre en el navegador.', 'publicada'),
  ('js-u1-l1-a2', 'js-u1-l1', 2, 'opcion-multiple', 'Que etiqueta de HTML se usa para incluir codigo JavaScript en una pagina?', null, '<script> permite escribir el codigo dentro de la pagina o enlazar un archivo .js con el atributo src. <code> solo muestra texto con formato de codigo.', 'publicada'),
  ('js-u1-l1-a3', 'js-u1-l1', 3, 'opcion-multiple', 'Cual de estas instrucciones muestra un mensaje en la consola del navegador?', null, 'console.log() es la forma estandar de imprimir en la consola. print() existe en otros lenguajes, como Python, pero no en JavaScript.', 'publicada'),
  ('js-u1-l1-a4', 'js-u1-l1', 4, 'opcion-multiple', 'Es cierto que JavaScript y Java son el mismo lenguaje?', null, 'Son lenguajes diferentes, con sintaxis y usos distintos. Comparten parte del nombre por razones historicas y de marketing de los años noventa, nada mas.', 'publicada'),
  ('js-u1-l2-a1', 'js-u1-l2', 1, 'opcion-multiple', 'Que palabra clave conviene usar para un valor que NO va a cambiar?', null, 'const crea una constante: si se intenta reasignarla, JavaScript lanza el error "Assignment to constant variable". fixed no existe en el lenguaje.', 'publicada'),
  ('js-u1-l2-a2', 'js-u1-l2', 2, 'opcion-multiple', 'Que palabra clave falta para declarar una variable que si va a cambiar?', '___ puntaje = 0
puntaje = puntaje + 10', 'let declara una variable con alcance de bloque que se puede volver a asignar. Con const la segunda linea daria error.', 'publicada'),
  ('js-u1-l2-a3', 'js-u1-l2', 3, 'opcion-multiple', 'Que pasa cuando se ejecuta este codigo?', 'const nombre = "Ada"
nombre = "Grace"', 'Reasignar una constante lanza el error "Assignment to constant variable". Para poder cambiar el valor habria que haber declarado la variable con let.', 'publicada'),
  ('js-u1-l2-a4', 'js-u1-l2', 4, 'opcion-multiple', 'Cual de estos nombres de variable es valido en JavaScript?', null, 'Un nombre no puede empezar con numero, no admite guiones (se confunden con la resta) y no puede ser una palabra reservada del lenguaje como let.', 'publicada'),
  ('js-u1-l3-a1', 'js-u1-l3', 1, 'opcion-multiple', 'Que devuelve typeof "42"?', 'console.log(typeof "42")', 'Las comillas hacen que 42 sea una cadena de texto. Sin comillas, typeof 42 devolveria "number".', 'publicada'),
  ('js-u1-l3-a2', 'js-u1-l3', 2, 'opcion-multiple', 'Como se llama el tipo de dato que solo puede valer true o false?', null, 'El tipo boolean representa valores logicos: true o false. Es el que devuelven las comparaciones y el que usan los condicionales para decidir.', 'publicada'),
  ('js-u1-l3-a3', 'js-u1-l3', 3, 'opcion-multiple', 'Cual es el orden correcto para declarar un nombre y mostrar un saludo?', null, 'Una variable tiene que existir antes de usarse. Primero se declara nombre, despues se arma saludo con ese valor y recien al final se lo muestra.', 'publicada'),
  ('js-u1-l3-a4', 'js-u1-l3', 4, 'opcion-multiple', 'Que imprime este codigo?', 'const a = 5
const b = "5"
console.log(typeof a === typeof b)', 'typeof a es "number" y typeof b es "string". Como los dos textos son distintos, la comparacion da false.', 'publicada'),
  ('js-u2-l1-a1', 'js-u2-l1', 1, 'opcion-multiple', '¿Cuánto vale resultado?', 'const resultado = 10 % 4', '% devuelve el resto de la división: 10 dividido 4 da 2 y sobran 2.', 'publicada'),
  ('js-u2-l1-a2', 'js-u2-l1', 2, 'opcion-multiple', '¿Qué imprime este código?', 'console.log("5" + 3)', 'Si uno de los lados del + es texto, JavaScript concatena: "5" + 3 da "53".', 'publicada'),
  ('js-u2-l1-a3', 'js-u2-l1', 3, 'opcion-multiple', '¿Qué operador suma 1 a una variable?', null, 'vidas++ es lo mismo que vidas = vidas + 1. ** es la potencia.', 'publicada'),
  ('js-u2-l1-a4', 'js-u2-l1', 4, 'opcion-multiple', '¿Cómo se sabe si un número n es par?', null, 'Un número es par cuando el resto de dividirlo por 2 es 0.', 'publicada'),
  ('js-u2-l2-a1', 'js-u2-l2', 1, 'opcion-multiple', '¿Cuál es la diferencia entre == y ===?', null, '=== (estricta) no convierte tipos: 0 === "0" es false. == los convierte y da true.', 'publicada'),
  ('js-u2-l2-a2', 'js-u2-l2', 2, 'opcion-multiple', '¿Qué devuelve esta comparación?', '0 === "0"', 'Un number y un string nunca son estrictamente iguales.', 'publicada'),
  ('js-u2-l2-a3', 'js-u2-l2', 3, 'opcion-multiple', '¿Qué operador significa "distinto de" en forma estricta?', null, '!== es el opuesto de ===. != también existe, pero convierte los tipos como ==.', 'publicada'),
  ('js-u2-l2-a4', 'js-u2-l2', 4, 'opcion-multiple', '¿Qué tipo de valor devuelve siempre una comparación como 5 > 3?', null, 'Las comparaciones siempre dan true o false.', 'publicada'),
  ('js-u2-l3-a1', 'js-u2-l3', 1, 'opcion-multiple', '¿Qué imprime este código?', 'const edad = 15
if (edad >= 18) {
  console.log("Adulto")
} else {
  console.log("Menor")
}', '15 >= 18 es false, así que se ejecuta el bloque del else.', 'publicada'),
  ('js-u2-l3-a2', 'js-u2-l3', 2, 'opcion-multiple', '¿Cuál es el operador lógico "y" (se tienen que cumplir las dos condiciones)?', null, '&& es "y". || es "o" y ! es "no".', 'publicada'),
  ('js-u2-l3-a3', 'js-u2-l3', 3, 'opcion-multiple', '¿Qué imprime este código?', 'const llueve = false
const frio = true
if (llueve || frio) {
  console.log("Abrigo")
} else {
  console.log("Remera")
}', 'Con || alcanza con que una condición sea true: frio es true.', 'publicada'),
  ('js-u2-l3-a4', 'js-u2-l3', 4, 'opcion-multiple', '¿Qué hace el operador ! delante de una condición?', null, '!true es false y !false es true.', 'publicada'),
  ('js-u3-l1-a1', 'js-u3-l1', 1, 'opcion-multiple', '¿Cuántas veces se ejecuta el cuerpo de este bucle?', 'for (let i = 0; i < 4; i++) {
  console.log(i)
}', 'i toma los valores 0, 1, 2 y 3: cuatro vueltas.', 'publicada'),
  ('js-u3-l1-a2', 'js-u3-l1', 2, 'opcion-multiple', '¿Qué condición recorre todo el array lista?', 'for (let i = 0; ______; i++) {
  console.log(lista[i])
}', 'Las posiciones van de 0 a length - 1, así que la condición es i < lista.length.', 'publicada'),
  ('js-u3-l1-a3', 'js-u3-l1', 3, 'opcion-multiple', 'Si en un for te olvidás el i++, ¿qué puede pasar?', null, 'Si el contador no avanza, la condición nunca deja de cumplirse: bucle infinito.', 'publicada'),
  ('js-u3-l1-a4', 'js-u3-l1', 4, 'opcion-multiple', '¿Qué imprime este código?', 'let suma = 0
for (let i = 1; i <= 3; i++) {
  suma = suma + i
}
console.log(suma)', 'Suma 1 + 2 + 3 = 6.', 'publicada'),
  ('js-u3-l2-a1', 'js-u3-l2', 1, 'opcion-multiple', '¿Cuándo conviene usar while en lugar de for?', null, 'while repite mientras se cumpla una condición; for es ideal cuando se conoce la cantidad de vueltas.', 'publicada'),
  ('js-u3-l2-a2', 'js-u3-l2', 2, 'opcion-multiple', '¿Qué palabra corta un bucle inmediatamente?', null, 'break sale del bucle; continue solo saltea la vuelta actual.', 'publicada'),
  ('js-u3-l2-a3', 'js-u3-l2', 3, 'opcion-multiple', '¿Qué imprime este código?', 'for (let i = 1; i <= 4; i++) {
  if (i === 2) continue
  console.log(i)
}', 'continue saltea la vuelta del 2; las demás se imprimen.', 'publicada'),
  ('js-u3-l2-a4', 'js-u3-l2', 4, 'opcion-multiple', '¿Cuánto vale n al terminar?', 'let n = 1
while (n < 20) {
  n = n * 2
}', 'n pasa por 1, 2, 4, 8, 16 y 32. Con 32 la condición ya no se cumple y el bucle termina.', 'publicada'),
  ('js-u4-l1-a1', 'js-u4-l1', 1, 'opcion-multiple', '¿Qué palabra clave declara una función?', null, 'En JavaScript se escribe function nombre(parametros) { ... }. def es de Python.', 'publicada'),
  ('js-u4-l1-a2', 'js-u4-l1', 2, 'opcion-multiple', '¿Qué devuelve doble(5)?', 'function doble(n) {
  return n * 2
}', 'return devuelve n * 2: 5 * 2 = 10.', 'publicada'),
  ('js-u4-l1-a3', 'js-u4-l1', 3, 'opcion-multiple', '¿Qué devuelve una función que no tiene return?', null, 'Sin return, la función devuelve undefined.', 'publicada'),
  ('js-u4-l1-a4', 'js-u4-l1', 4, 'opcion-multiple', 'En function saludar(nombre), ¿qué es nombre?', null, 'Los parámetros reciben los datos que se pasan al llamar la función: saludar("Ana").', 'publicada'),
  ('js-u4-l2-a1', 'js-u4-l2', 1, 'opcion-multiple', '¿Cuál es una función flecha válida que devuelve el triple de n?', null, 'La flecha es =>. Si el cuerpo es una sola expresión, se devuelve sin escribir return.', 'publicada'),
  ('js-u4-l2-a2', 'js-u4-l2', 2, 'opcion-multiple', '¿Qué imprime este código?', 'const sumar = (a, b) => a + b
console.log(sumar(2, 3))', 'La flecha devuelve a + b de forma implícita: 2 + 3 = 5.', 'publicada'),
  ('js-u4-l2-a3', 'js-u4-l2', 3, 'opcion-multiple', '¿Qué pasa si usás una variable declarada con const dentro de una función, desde afuera de ella?', null, 'Las variables de let y const tienen alcance de bloque: fuera de la función no existen.', 'publicada'),
  ('js-u4-l2-a4', 'js-u4-l2', 4, 'opcion-multiple', '¿Qué imprime este código?', 'const x = 1
function mostrar() {
  const x = 2
  console.log(x)
}
mostrar()', 'Adentro de la función se usa la x de la función, que vale 2.', 'publicada'),
  ('js-u5-l1-a1', 'js-u5-l1', 1, 'opcion-multiple', '¿Qué imprime este código?', 'const letras = ["a", "b", "c"]
console.log(letras[1])', 'Las posiciones empiezan en 0: la 1 es la segunda, "b".', 'publicada'),
  ('js-u5-l1-a2', 'js-u5-l1', 2, 'opcion-multiple', '¿Qué método agrega un elemento al final de un array?', null, 'push() agrega al final. pop() saca el último.', 'publicada'),
  ('js-u5-l1-a3', 'js-u5-l1', 3, 'opcion-multiple', '¿Cuánto vale ["a", "b", "c"].length?', null, 'length es la cantidad de elementos: 3. La última posición es 2.', 'publicada'),
  ('js-u5-l1-a4', 'js-u5-l1', 4, 'opcion-multiple', '¿Qué hace pop()?', null, 'pop() quita el último elemento y lo devuelve.', 'publicada'),
  ('js-u5-l2-a1', 'js-u5-l2', 1, 'opcion-multiple', '¿Cómo se accede al nombre de este usuario?', 'const usuario = { nombre: "Ada", edad: 36 }', 'Las propiedades de un objeto se leen con un punto: usuario.nombre.', 'publicada'),
  ('js-u5-l2-a2', 'js-u5-l2', 2, 'opcion-multiple', '¿Qué método de array devuelve uno nuevo solo con los elementos que cumplen una condición?', null, 'filter() se queda con los que cumplen. map() transforma todos; find() devuelve solo el primero.', 'publicada'),
  ('js-u5-l2-a3', 'js-u5-l2', 3, 'opcion-multiple', '¿Qué imprime este código?', 'const n = [1, 2, 3]
console.log(n.map((x) => x * 10))', 'map() aplica la función a cada elemento y devuelve un array nuevo.', 'publicada'),
  ('js-u5-l2-a4', 'js-u5-l2', 4, 'opcion-multiple', '¿Qué imprime este código?', 'const n = [4, 15, 8, 23]
console.log(n.filter((x) => x > 10))', 'Solo 15 y 23 son mayores que 10.', 'publicada'),
  ('js-u6-l1-a1', 'js-u6-l1', 1, 'opcion-multiple', '¿Qué hace document.querySelector(".titulo")?', null, 'querySelector devuelve el primero que coincide. querySelectorAll devuelve todos.', 'publicada'),
  ('js-u6-l1-a2', 'js-u6-l1', 2, 'opcion-multiple', '¿Qué propiedad cambia el texto de un elemento?', null, 'elemento.textContent = "Hola" reemplaza su texto.', 'publicada'),
  ('js-u6-l1-a3', 'js-u6-l1', 3, 'opcion-multiple', '¿Qué es el DOM?', null, 'El DOM es el árbol de elementos de la página, accesible desde JavaScript.', 'publicada'),
  ('js-u6-l1-a4', 'js-u6-l1', 4, 'opcion-multiple', '¿Qué selector usarías para buscar el elemento con id="menu"?', null, 'querySelector usa selectores de CSS: # para id y . para clase.', 'publicada'),
  ('js-u6-l2-a1', 'js-u6-l2', 1, 'opcion-multiple', '¿Qué método escucha un evento sobre un elemento?', null, 'elemento.addEventListener("click", funcion) ejecuta la función en cada clic.', 'publicada'),
  ('js-u6-l2-a2', 'js-u6-l2', 2, 'opcion-multiple', '¿Cuál de estos NO es un evento del DOM?', null, 'click, keydown y submit son eventos; compile no existe.', 'publicada'),
  ('js-u6-l2-a3', 'js-u6-l2', 3, 'opcion-multiple', '¿Qué pasa al hacer clic en el botón?', 'boton.addEventListener("click", () => {
  mensaje.textContent = "Listo!"
})', 'Cada clic ejecuta la función, que cambia el texto del elemento mensaje.', 'publicada'),
  ('js-u6-l2-a4', 'js-u6-l2', 4, 'opcion-multiple', '¿Qué evento se dispara cuando se envía un formulario?', null, 'submit se dispara al enviar un formulario; suele usarse con evento.preventDefault().', 'publicada'),
  ('py-u1-l1-a1', 'py-u1-l1', 1, 'opcion-multiple', '¿Qué función muestra un mensaje en la pantalla en Python?', null, 'print() es la función de Python para mostrar valores. console.log() es de JavaScript y echo, de PHP o la terminal.', 'publicada'),
  ('py-u1-l1-a2', 'py-u1-l1', 2, 'opcion-multiple', '¿Con qué símbolo empieza un comentario de una línea en Python?', null, 'En Python los comentarios empiezan con #. // es de JavaScript, Java o C++; -- es de SQL.', 'publicada'),
  ('py-u1-l1-a3', 'py-u1-l1', 3, 'opcion-multiple', '¿Qué muestra este código?', 'print(2 + 3)', 'Sin comillas, 2 + 3 es una operación: Python la calcula y print() muestra el resultado, 5.', 'publicada'),
  ('py-u1-l1-a4', 'py-u1-l1', 4, 'opcion-multiple', '¿Cuál de estas líneas es correcta en Python?', null, 'Se llama a print con paréntesis y el texto entre comillas. Python distingue mayúsculas: Print no existe.', 'publicada'),
  ('py-u1-l2-a1', 'py-u1-l2', 1, 'opcion-multiple', '¿Cómo se crea una variable llamada puntos con el valor 10?', null, 'En Python alcanza con nombre = valor. No se escribe el tipo ni palabras como let o var.', 'publicada'),
  ('py-u1-l2-a2', 'py-u1-l2', 2, 'opcion-multiple', '¿De qué tipo es el valor 3.5?', null, 'Los números con parte decimal son float. int es solo para enteros como 3.', 'publicada'),
  ('py-u1-l2-a3', 'py-u1-l2', 3, 'opcion-multiple', '¿Qué muestra este código?', 'nombre = "Ana"
print("Hola " + nombre)', 'El + une (concatena) los dos textos: "Hola " y el valor de la variable, "Ana".', 'publicada'),
  ('py-u1-l2-a4', 'py-u1-l2', 4, 'opcion-multiple', '¿Qué tipo de dato devuelve siempre input()?', null, 'input() siempre devuelve texto (str). Para usarlo como número hay que convertirlo, por ejemplo con int(input()).', 'publicada'),
  ('py-u2-l1-a1', 'py-u2-l1', 1, 'opcion-multiple', '¿Qué marca en Python qué líneas están dentro de un if?', null, 'Python usa la sangría para formar bloques. Si una línea no está sangrada, ya no pertenece al if.', 'publicada'),
  ('py-u2-l1-a2', 'py-u2-l1', 2, 'opcion-multiple', '¿Qué muestra este código?', 'x = 5
if x > 10:
    print("grande")
else:
    print("chico")', '5 > 10 es falso, así que se ejecuta el bloque del else.', 'publicada'),
  ('py-u2-l1-a3', 'py-u2-l1', 3, 'opcion-multiple', '¿Qué operador compara si dos valores son iguales?', null, '== compara. Un solo = asigna un valor a una variable. === no existe en Python.', 'publicada'),
  ('py-u2-l1-a4', 'py-u2-l1', 4, 'opcion-multiple', '¿Cómo se escribe "si no se cumplió lo anterior, pero se cumple esto" en Python?', null, 'Python abrevia else if como elif.', 'publicada'),
  ('py-u2-l2-a1', 'py-u2-l2', 1, 'opcion-multiple', '¿Qué números recorre range(4)?', null, 'range(4) empieza en 0 y termina antes del 4: 0, 1, 2 y 3.', 'publicada'),
  ('py-u2-l2-a2', 'py-u2-l2', 2, 'opcion-multiple', '¿Cuántas veces se muestra "Hola"?', 'for i in range(2, 5):
    print("Hola")', 'range(2, 5) da 2, 3 y 4: tres vueltas.', 'publicada'),
  ('py-u2-l2-a3', 'py-u2-l2', 3, 'opcion-multiple', '¿Qué pasa si la condición de un while nunca deja de ser verdadera?', null, 'Es un bucle infinito: hay que cambiar algo adentro (o usar break) para que termine.', 'publicada'),
  ('py-u2-l2-a4', 'py-u2-l2', 4, 'opcion-multiple', '¿Qué instrucción corta un bucle antes de que termine?', null, 'break sale del bucle en el que está. return sale de una función, no solo del bucle.', 'publicada'),
  ('web-u1-l1-a1', 'web-u1-l1', 1, 'opcion-multiple', '¿Qué etiqueta crea un párrafo?', null, '<p> marca un párrafo. <h1> es un título.', 'publicada'),
  ('web-u1-l1-a2', 'web-u1-l1', 2, 'opcion-multiple', '¿Cómo se cierra la etiqueta <h1>?', null, 'La etiqueta de cierre repite el nombre con una barra adelante: </h1>.', 'publicada'),
  ('web-u1-l1-a3', 'web-u1-l1', 3, 'opcion-multiple', '¿En qué parte del documento va el contenido que se ve en la página?', null, '<body> tiene todo lo visible. <head> guarda información sobre la página, como el título de la pestaña.', 'publicada'),
  ('web-u1-l1-a4', 'web-u1-l1', 4, 'opcion-multiple', '¿Cuál es el título más importante de una página?', null, 'Los títulos van de <h1> (el principal) a <h6>. <title> es el texto de la pestaña, no un título dentro de la página.', 'publicada'),
  ('web-u1-l2-a1', 'web-u1-l2', 1, 'opcion-multiple', '¿Qué atributo indica a dónde lleva un enlace <a>?', null, 'href guarda la dirección del enlace. src se usa en imágenes y scripts.', 'publicada'),
  ('web-u1-l2-a2', 'web-u1-l2', 2, 'opcion-multiple', '¿Para qué sirve el atributo alt de una imagen?', null, 'alt es el texto alternativo: lo leen los lectores de pantalla y aparece si la imagen no carga.', 'publicada'),
  ('web-u1-l2-a3', 'web-u1-l2', 3, 'opcion-multiple', '¿Qué etiqueta crea una lista numerada?', null, '<ol> es ordered list (numerada); <ul> lleva viñetas. <li> es cada elemento de cualquiera de las dos.', 'publicada'),
  ('web-u1-l2-a4', 'web-u1-l2', 4, 'opcion-multiple', '¿Cuál de estas imágenes está bien escrita?', null, '<img> usa src para el archivo, alt para la descripción y no tiene etiqueta de cierre.', 'publicada'),
  ('web-u2-l1-a1', 'web-u2-l1', 1, 'opcion-multiple', '¿Qué selector elige los elementos con class="aviso"?', null, 'Las clases se seleccionan con un punto. El numeral # es para id.', 'publicada'),
  ('web-u2-l1-a2', 'web-u2-l1', 2, 'opcion-multiple', '¿Qué propiedad cambia el color del texto?', null, 'color cambia el texto; background-color, el fondo. text-color y font-color no existen.', 'publicada'),
  ('web-u2-l1-a3', 'web-u2-l1', 3, 'opcion-multiple', '¿Qué está mal en esta regla?', 'h1 {
  font-size = 32px;
}', 'Las declaraciones se escriben propiedad: valor; con dos puntos, nunca con =.', 'publicada'),
  ('web-u2-l1-a4', 'web-u2-l1', 4, 'opcion-multiple', '¿Qué selector elige el elemento con id="titulo"?', null, 'El id se selecciona con #. Un id no debería repetirse en la misma página.', 'publicada'),
  ('web-u2-l2-a1', 'web-u2-l2', 1, 'opcion-multiple', '¿Qué propiedad agrega espacio ENTRE el contenido y el borde?', null, 'padding es el relleno de adentro. margin es el espacio de afuera del borde.', 'publicada'),
  ('web-u2-l2-a2', 'web-u2-l2', 2, 'opcion-multiple', '¿Qué propiedad separa una caja de las que tiene alrededor?', null, 'margin es el espacio exterior de la caja.', 'publicada'),
  ('web-u2-l2-a3', 'web-u2-l2', 3, 'opcion-multiple', 'Con box-sizing: content-box (el valor por defecto), ¿cuánto mide de ancho esta caja en total?', 'div {
  width: 100px;
  padding: 10px;
  border: 5px solid black;
}', '100 de contenido + 10 de padding de cada lado + 5 de borde de cada lado = 130px.', 'publicada'),
  ('web-u2-l2-a4', 'web-u2-l2', 4, 'opcion-multiple', '¿Qué hace box-sizing: border-box?', null, 'Con border-box, el width ya incluye padding y borde: la caja mide exactamente lo que dice width.', 'publicada'),
  ('sql-u1-l1-a1', 'sql-u1-l1', 1, 'opcion-multiple', '¿Qué consulta trae todas las columnas de la tabla productos?', null, 'SELECT * pide todas las columnas y FROM indica la tabla. El orden es SELECT ... FROM ...', 'publicada'),
  ('sql-u1-l1-a2', 'sql-u1-l1', 2, 'opcion-multiple', 'En una tabla, ¿qué representa cada fila?', null, 'Cada fila es un registro; las columnas son los datos que tiene cada registro.', 'publicada'),
  ('sql-u1-l1-a3', 'sql-u1-l1', 3, 'opcion-multiple', '¿Cómo se piden solo las columnas nombre y precio?', null, 'Las columnas se separan con comas después de SELECT.', 'publicada'),
  ('sql-u1-l1-a4', 'sql-u1-l1', 4, 'opcion-multiple', '¿Con qué empieza un comentario de una línea en SQL?', null, 'En SQL estándar los comentarios de una línea empiezan con --.', 'publicada'),
  ('sql-u1-l2-a1', 'sql-u1-l2', 1, 'opcion-multiple', '¿Qué cláusula se usa para filtrar filas?', null, 'WHERE deja solo las filas que cumplen la condición.', 'publicada'),
  ('sql-u1-l2-a2', 'sql-u1-l2', 2, 'opcion-multiple', '¿Qué hace ORDER BY precio DESC?', null, 'DESC es descendente: de mayor a menor. ASC (el valor por defecto) es ascendente.', 'publicada'),
  ('sql-u1-l2-a3', 'sql-u1-l2', 3, 'opcion-multiple', '¿Qué filas devuelve esta consulta?', 'SELECT * FROM alumnos WHERE nombre LIKE ''Ma%'';', '% reemplaza cualquier cantidad de caracteres: ''Ma%'' es todo lo que empieza con Ma.', 'publicada'),
  ('sql-u1-l2-a4', 'sql-u1-l2', 4, 'opcion-multiple', '¿Cuál de estas consultas está bien ordenada?', null, 'El orden es SELECT, FROM, WHERE y ORDER BY.', 'publicada'),
  ('sql-u2-l1-a1', 'sql-u2-l1', 1, 'opcion-multiple', '¿Qué palabra indica la condición que relaciona las tablas en un JOIN?', null, 'Después de JOIN tabla se escribe ON con la condición, por ejemplo ON c.id = a.curso_id.', 'publicada'),
  ('sql-u2-l1-a2', 'sql-u2-l1', 2, 'opcion-multiple', '¿Qué devuelve un INNER JOIN?', null, 'INNER JOIN deja solo las combinaciones que cumplen la condición en las dos tablas.', 'publicada'),
  ('sql-u2-l1-a3', 'sql-u2-l1', 3, 'opcion-multiple', 'Si un alumno no tiene curso asignado, ¿qué JOIN lo sigue mostrando en el resultado?', 'SELECT a.nombre, c.nombre
FROM alumnos a
____ cursos c ON c.id = a.curso_id;', 'LEFT JOIN conserva todas las filas de la tabla de la izquierda (alumnos); las columnas del curso quedan en NULL.', 'publicada'),
  ('sql-u2-l1-a4', 'sql-u2-l1', 4, 'opcion-multiple', '¿Qué es una clave foránea?', null, 'La clave foránea guarda el identificador de una fila de otra tabla: así se relacionan.', 'publicada'),
  ('sql-u2-l2-a1', 'sql-u2-l2', 1, 'opcion-multiple', '¿Qué función cuenta filas?', null, 'COUNT(*) cuenta filas. SUM suma valores y AVG los promedia.', 'publicada'),
  ('sql-u2-l2-a2', 'sql-u2-l2', 2, 'opcion-multiple', '¿Qué devuelve esta consulta?', 'SELECT AVG(nota) FROM examenes;', 'AVG calcula el promedio (average) de la columna.', 'publicada'),
  ('sql-u2-l2-a3', 'sql-u2-l2', 3, 'opcion-multiple', '¿Para qué sirve GROUP BY curso_id?', null, 'GROUP BY arma un grupo por curso y COUNT, SUM, etc. se calculan dentro de cada grupo.', 'publicada'),
  ('sql-u2-l2-a4', 'sql-u2-l2', 4, 'opcion-multiple', '¿Qué cláusula filtra GRUPOS según un agregado, como COUNT(*) > 5?', null, 'HAVING filtra después de agrupar. WHERE no puede usar funciones de agregado.', 'publicada'),
  ('java-u1-l1-a1', 'java-u1-l1', 1, 'opcion-multiple', '¿Desde qué método empieza a ejecutarse un programa en Java?', null, 'La máquina virtual de Java busca public static void main(String[] args) para arrancar.', 'publicada'),
  ('java-u1-l1-a2', 'java-u1-l1', 2, 'opcion-multiple', '¿Qué instrucción muestra un texto y salta de línea?', null, 'System.out.println escribe el texto y un salto de línea. System.out.print no salta de línea.', 'publicada'),
  ('java-u1-l1-a3', 'java-u1-l1', 3, 'opcion-multiple', '¿Cómo terminan las instrucciones en Java?', null, 'Cada instrucción termina en ;. Olvidarlo es un error de compilación.', 'publicada'),
  ('java-u1-l1-a4', 'java-u1-l1', 4, 'opcion-multiple', 'Si la clase pública se llama Juego, ¿cómo debe llamarse el archivo?', null, 'El archivo lleva el mismo nombre que la clase pública, respetando mayúsculas: Juego.java. El .class lo genera el compilador.', 'publicada'),
  ('java-u1-l2-a1', 'java-u1-l2', 1, 'opcion-multiple', '¿Cuál declara correctamente una variable entera?', null, 'En Java se escribe el tipo, el nombre y el valor: int edad = 16;', 'publicada'),
  ('java-u1-l2-a2', 'java-u1-l2', 2, 'opcion-multiple', '¿Qué tipo usarías para guardar 3.75?', null, 'double guarda números con decimales. int solo enteros.', 'publicada'),
  ('java-u1-l2-a3', 'java-u1-l2', 3, 'opcion-multiple', '¿Qué muestra este código?', 'int a = 7;
int b = 2;
System.out.println(a / b);', 'La división entre dos int descarta los decimales: 7 / 2 da 3.', 'publicada'),
  ('java-u1-l2-a4', 'java-u1-l2', 4, 'opcion-multiple', '¿Por qué String se escribe con mayúscula?', null, 'Los tipos primitivos (int, double...) van en minúscula; String es una clase, y las clases empiezan con mayúscula.', 'publicada'),
  ('java-u2-l1-a1', 'java-u2-l1', 1, 'opcion-multiple', '¿Qué palabra crea un objeto nuevo a partir de una clase?', null, 'new reserva memoria para el objeto y llama a su constructor.', 'publicada'),
  ('java-u2-l1-a2', 'java-u2-l1', 2, 'opcion-multiple', '¿Qué es una clase?', null, 'La clase define cómo son los objetos; cada objeto es una instancia de ella.', 'publicada'),
  ('java-u2-l1-a3', 'java-u2-l1', 3, 'opcion-multiple', '¿Qué muestra este código?', 'Perro a = new Perro();
a.nombre = "Luna";
Perro b = new Perro();
b.nombre = "Toby";
System.out.println(a.nombre);', 'a y b son objetos distintos: cada uno guarda su propio nombre.', 'publicada'),
  ('java-u2-l1-a4', 'java-u2-l1', 4, 'opcion-multiple', '¿Qué hace private en un atributo?', null, 'private oculta el atributo fuera de la clase: es la base del encapsulamiento.', 'publicada'),
  ('java-u2-l2-a1', 'java-u2-l2', 1, 'opcion-multiple', '¿Cómo se llama el constructor de la clase Auto?', null, 'El constructor tiene el mismo nombre que la clase y no declara tipo de retorno.', 'publicada'),
  ('java-u2-l2-a2', 'java-u2-l2', 2, 'opcion-multiple', '¿Qué significa void en un método?', null, 'void indica que el método no devuelve un valor.', 'publicada'),
  ('java-u2-l2-a3', 'java-u2-l2', 3, 'opcion-multiple', 'Dentro de un constructor, ¿a qué se refiere this?', null, 'this es una referencia al propio objeto: this.ancho es su atributo ancho.', 'publicada'),
  ('java-u2-l2-a4', 'java-u2-l2', 4, 'opcion-multiple', '¿Qué muestra este código?', 'Rectangulo r = new Rectangulo(2, 5);
System.out.println(r.area());', 'area() devuelve ancho * alto: 2 * 5 = 10.0 (es double).', 'publicada'),
  ('cpp-u1-l1-a1', 'cpp-u1-l1', 1, 'opcion-multiple', '¿Qué biblioteca hay que incluir para usar std::cout?', null, 'cout y cin están en <iostream> (input/output stream).', 'publicada'),
  ('cpp-u1-l1-a2', 'cpp-u1-l1', 2, 'opcion-multiple', '¿Qué operador se usa para mandar texto a std::cout?', null, '<< "inserta" en la salida. >> se usa con cin para leer.', 'publicada'),
  ('cpp-u1-l1-a3', 'cpp-u1-l1', 3, 'opcion-multiple', '¿Desde qué función empieza un programa en C++?', null, 'Todo programa en C++ arranca en int main(). C++ distingue mayúsculas: Main no sirve.', 'publicada'),
  ('cpp-u1-l1-a4', 'cpp-u1-l1', 4, 'opcion-multiple', '¿Qué muestra este código?', 'std::cout << 2 + 3 << std::endl;', 'Primero se calcula 2 + 3 y después se manda el 5 a la salida.', 'publicada'),
  ('cpp-u1-l2-a1', 'cpp-u1-l2', 1, 'opcion-multiple', '¿Qué palabra hace que una variable no se pueda modificar?', null, 'En C++ se usa const. final es de Java.', 'publicada'),
  ('cpp-u1-l2-a2', 'cpp-u1-l2', 2, 'opcion-multiple', '¿Cómo se lee un número que escribe la persona?', null, 'cin lee de la entrada con >>. cout es para mostrar.', 'publicada'),
  ('cpp-u1-l2-a3', 'cpp-u1-l2', 3, 'opcion-multiple', '¿Qué valor tiene una variable int declarada sin inicializar dentro de una función?', null, 'Una variable local sin inicializar tiene lo que haya en esa memoria. Por eso conviene inicializarla siempre.', 'publicada'),
  ('cpp-u1-l2-a4', 'cpp-u1-l2', 4, 'opcion-multiple', '¿Qué tipo guarda un texto como "Hola"?', null, 'std::string guarda texto. char guarda un solo carácter, como ''H''.', 'publicada'),
  ('cpp-u2-l1-a1', 'cpp-u2-l1', 1, 'opcion-multiple', '¿Cómo se declara una referencia r a la variable x de tipo int?', null, 'Con & después del tipo: int& r = x; int* es un puntero.', 'publicada'),
  ('cpp-u2-l1-a2', 'cpp-u2-l1', 2, 'opcion-multiple', '¿Qué muestra este código?', 'int x = 10;
int& r = x;
r = 20;
std::cout << x;', 'r es otro nombre para x: asignar 20 a r cambia x.', 'publicada'),
  ('cpp-u2-l1-a3', 'cpp-u2-l1', 3, 'opcion-multiple', 'Una función recibe int n (sin &). Si adentro hace n++, ¿qué pasa con la variable original?', null, 'Sin &, el parámetro se pasa por valor: es una copia y la original no cambia.', 'publicada'),
  ('cpp-u2-l1-a4', 'cpp-u2-l1', 4, 'opcion-multiple', '¿Cuál de estas afirmaciones sobre las referencias es cierta?', null, 'Una referencia se ata a una variable al declararla y queda atada a ella para siempre.', 'publicada'),
  ('cpp-u2-l2-a1', 'cpp-u2-l2', 1, 'opcion-multiple', '¿Qué guarda un puntero?', null, 'Un puntero guarda la dirección de memoria de otra variable.', 'publicada'),
  ('cpp-u2-l2-a2', 'cpp-u2-l2', 2, 'opcion-multiple', '¿Qué operador da la dirección de memoria de x?', null, '&x es "la dirección de x". *p es "lo que hay en la dirección p".', 'publicada'),
  ('cpp-u2-l2-a3', 'cpp-u2-l2', 3, 'opcion-multiple', '¿Qué muestra este código?', 'int a = 3;
int* p = &a;
*p = *p + 4;
std::cout << a;', '*p es a: se le suma 4 y a pasa a valer 7.', 'publicada'),
  ('cpp-u2-l2-a4', 'cpp-u2-l2', 4, 'opcion-multiple', '¿Qué valor se usa para indicar que un puntero no apunta a nada?', null, 'Desde C++11 se usa nullptr. Desreferenciarlo hace fallar el programa, así que hay que chequearlo antes.', 'publicada'),
  ('py-u3-l1-a1', 'py-u3-l1', 1, 'opcion-multiple', '¿Qué muestra este código?', 'nums = [10, 20, 30]
print(nums[1])', 'Los índices empiezan en 0: el índice 1 es el segundo elemento, 20.', 'publicada'),
  ('py-u3-l1-a2', 'py-u3-l1', 2, 'opcion-multiple', '¿Qué método agrega un elemento al final de una lista?', null, 'En Python se usa append(). push() es de JavaScript.', 'publicada'),
  ('py-u3-l1-a3', 'py-u3-l1', 3, 'opcion-multiple', '¿Qué devuelve colores[-1]?', 'colores = ["rojo", "verde", "azul"]', 'Los índices negativos cuentan desde el final: -1 es el último elemento.', 'publicada'),
  ('py-u3-l1-a4', 'py-u3-l1', 4, 'opcion-multiple', '¿Qué muestra este código?', 'print("uva" in ["pera", "uva"])', 'in devuelve True si el valor está en la lista.', 'publicada'),
  ('py-u3-l2-a1', 'py-u3-l2', 1, 'opcion-multiple', '¿Qué muestra este código?', 'precios = {"pan": 900, "leche": 1200}
print(precios["leche"])', 'Se busca el valor por su clave: "leche" vale 1200.', 'publicada'),
  ('py-u3-l2-a2', 'py-u3-l2', 2, 'opcion-multiple', '¿Qué pasa si se busca con [] una clave que no existe?', null, 'Con [] da KeyError. Para evitarlo se usa get(), que devuelve None o un valor por defecto.', 'publicada'),
  ('py-u3-l2-a3', 'py-u3-l2', 3, 'opcion-multiple', '¿Cómo se agrega la clave "color" con el valor "rojo" al diccionario auto?', null, 'Asignar a una clave nueva la agrega al diccionario.', 'publicada'),
  ('py-u3-l2-a4', 'py-u3-l2', 4, 'opcion-multiple', '¿Qué devuelve len() de este diccionario?', 'd = {"a": 1, "b": 2, "c": 3}', 'len() cuenta los pares clave: valor, que son 3.', 'publicada'),
  ('py-u4-l1-a1', 'py-u4-l1', 1, 'opcion-multiple', '¿Con qué palabra se define una función en Python?', null, 'Python usa def. function es de JavaScript.', 'publicada'),
  ('py-u4-l1-a2', 'py-u4-l1', 2, 'opcion-multiple', '¿Qué muestra este código?', 'def area(b, h):
    return b * h

print(area(3, 5))', 'area devuelve b * h: 3 * 5 = 15.', 'publicada'),
  ('py-u4-l1-a3', 'py-u4-l1', 3, 'opcion-multiple', '¿Qué devuelve una función que no tiene return?', null, 'Sin return, una función devuelve None.', 'publicada'),
  ('py-u4-l1-a4', 'py-u4-l1', 4, 'opcion-multiple', '¿Qué muestra este código?', 'def potencia(base, exp=2):
    return base ** exp

print(potencia(3))', 'exp vale 2 por defecto: 3 ** 2 = 9.', 'publicada'),
  ('py-u4-l2-a1', 'py-u4-l2', 1, 'opcion-multiple', '¿Qué pasa si se usa afuera una variable creada dentro de una función?', null, 'Las variables locales desaparecen al terminar la función.', 'publicada'),
  ('py-u4-l2-a2', 'py-u4-l2', 2, 'opcion-multiple', '¿Qué muestra este código?', 'x = 10

def cambiar():
    x = 99

cambiar()
print(x)', 'x = 99 dentro de la función crea una variable local nueva; la global sigue valiendo 10.', 'publicada'),
  ('py-u4-l2-a3', 'py-u4-l2', 3, 'opcion-multiple', '¿Cuál es la forma más clara de que una función entregue un resultado?', null, 'Con return quien llama decide qué hacer con el resultado.', 'publicada'),
  ('py-u4-l2-a4', 'py-u4-l2', 4, 'opcion-multiple', '¿Qué nombre describe mejor una función que calcula el promedio de una lista?', null, 'Un buen nombre dice qué hace la función. En Python se usa snake_case.', 'publicada'),
  ('web-u3-l1-a1', 'web-u3-l1', 1, 'opcion-multiple', '¿Qué propiedad convierte un elemento en contenedor flex?', null, 'display: flex activa flexbox en el contenedor.', 'publicada'),
  ('web-u3-l1-a2', 'web-u3-l1', 2, 'opcion-multiple', 'Con display: flex y sin nada más, ¿cómo quedan los hijos?', null, 'La dirección por defecto es row: en fila.', 'publicada'),
  ('web-u3-l1-a3', 'web-u3-l1', 3, 'opcion-multiple', '¿Qué propiedad deja espacio entre los hijos de un contenedor flex?', null, 'gap separa los elementos entre sí sin agregar espacio en los bordes.', 'publicada'),
  ('web-u3-l1-a4', 'web-u3-l1', 4, 'opcion-multiple', '¿Qué hace flex-wrap: wrap?', null, 'Sin wrap, los hijos se achican para entrar en una sola línea.', 'publicada'),
  ('web-u3-l2-a1', 'web-u3-l2', 1, 'opcion-multiple', 'En una fila, ¿qué propiedad reparte los elementos horizontalmente?', null, 'justify-content trabaja sobre el eje principal, que en una fila es el horizontal.', 'publicada'),
  ('web-u3-l2-a2', 'web-u3-l2', 2, 'opcion-multiple', '¿Qué valor de justify-content pega el primer elemento a la izquierda y el último a la derecha?', null, 'space-between reparte el espacio entre los elementos y deja los extremos en los bordes.', 'publicada'),
  ('web-u3-l2-a3', 'web-u3-l2', 3, 'opcion-multiple', '¿Cómo se centra un elemento horizontal y verticalmente dentro de un contenedor flex?', null, 'Una propiedad centra en cada eje.', 'publicada'),
  ('web-u3-l2-a4', 'web-u3-l2', 4, 'opcion-multiple', 'Con flex-direction: column, ¿qué alinea justify-content?', null, 'En columna, el eje principal pasa a ser el vertical.', 'publicada'),
  ('web-u4-l1-a1', 'web-u4-l1', 1, 'opcion-multiple', '¿Cuándo se aplican los estilos de @media (max-width: 600px)?', null, 'max-width: hasta ese ancho como máximo.', 'publicada'),
  ('web-u4-l1-a2', 'web-u4-l1', 2, 'opcion-multiple', '¿Qué significa diseñar "mobile first"?', null, 'Se escriben los estilos base para el celular y se suman cambios con min-width.', 'publicada'),
  ('web-u4-l1-a3', 'web-u4-l1', 3, 'opcion-multiple', '¿Qué etiqueta hace que el celular use su ancho real en lugar de achicar la página?', null, 'La meta viewport es imprescindible para un diseño responsivo.', 'publicada'),
  ('web-u4-l1-a4', 'web-u4-l1', 4, 'opcion-multiple', 'En una pantalla de 900 px, ¿qué dirección tienen las tarjetas?', '.tarjetas { display: flex; flex-direction: column; }
@media (min-width: 700px) {
  .tarjetas { flex-direction: row; }
}', '900 px cumple min-width: 700px, así que se aplica flex-direction: row.', 'publicada'),
  ('web-u4-l2-a1', 'web-u4-l2', 1, 'opcion-multiple', 'Si la letra base de la página es 16 px, ¿cuánto mide 2rem?', null, '1rem es la letra base: 2rem = 2 × 16 = 32 px.', 'publicada'),
  ('web-u4-l2-a2', 'web-u4-l2', 2, 'opcion-multiple', '¿Qué hace max-width: 100% en una imagen?', null, 'La imagen puede ser más chica, pero nunca más ancha que su contenedor.', 'publicada'),
  ('web-u4-l2-a3', 'web-u4-l2', 3, 'opcion-multiple', '¿A qué equivale 50vw?', null, 'vw es 1% del ancho de la ventana (viewport width).', 'publicada'),
  ('web-u4-l2-a4', 'web-u4-l2', 4, 'opcion-multiple', '¿Para qué sirve height: auto junto con max-width: 100% en una imagen?', null, 'Si el ancho se achica, el alto se ajusta solo y la imagen no se deforma.', 'publicada'),
  ('sql-u3-l1-a1', 'sql-u3-l1', 1, 'opcion-multiple', '¿Qué instrucción agrega una fila nueva?', null, 'INSERT INTO ... VALUES ... agrega filas.', 'publicada'),
  ('sql-u3-l1-a2', 'sql-u3-l1', 2, 'opcion-multiple', '¿Qué pasa con este UPDATE?', 'UPDATE productos SET precio = 0;', 'Sin WHERE, UPDATE se aplica a todas las filas.', 'publicada'),
  ('sql-u3-l1-a3', 'sql-u3-l1', 3, 'opcion-multiple', '¿Cuál de estos INSERT es correcto?', null, 'INSERT INTO tabla (columnas) VALUES (valores).', 'publicada'),
  ('sql-u3-l1-a4', 'sql-u3-l1', 4, 'opcion-multiple', '¿Qué palabra introduce los nuevos valores en un UPDATE?', null, 'UPDATE tabla SET columna = valor WHERE ...', 'publicada'),
  ('sql-u3-l2-a1', 'sql-u3-l2', 1, 'opcion-multiple', '¿Qué hace DELETE FROM alumnos; (sin WHERE)?', null, 'Borra todas las filas; la tabla sigue existiendo (vacía). Para borrar la tabla se usa DROP TABLE.', 'publicada'),
  ('sql-u3-l2-a2', 'sql-u3-l2', 2, 'opcion-multiple', '¿Qué instrucción confirma los cambios de una transacción?', null, 'COMMIT confirma; ROLLBACK deshace.', 'publicada'),
  ('sql-u3-l2-a3', 'sql-u3-l2', 3, 'opcion-multiple', '¿Para qué sirve una transacción?', null, 'Garantiza que un conjunto de cambios no quede a medias.', 'publicada'),
  ('sql-u3-l2-a4', 'sql-u3-l2', 4, 'opcion-multiple', '¿Qué hace ROLLBACK?', null, 'Vuelve todo al estado anterior al inicio de la transacción.', 'publicada'),
  ('java-u3-l1-a1', 'java-u3-l1', 1, 'opcion-multiple', '¿Qué palabra indica que una clase hereda de otra?', null, 'class Hija extends Padre. implements es para interfaces.', 'publicada'),
  ('java-u3-l1-a2', 'java-u3-l1', 2, 'opcion-multiple', '¿Qué hace super(nombre) en el constructor de Perro?', null, 'super(...) llama al constructor de la clase padre.', 'publicada'),
  ('java-u3-l1-a3', 'java-u3-l1', 3, 'opcion-multiple', 'Si Perro extends Animal, ¿puede un Perro usar el método comer() de Animal?', null, 'La hija hereda los métodos (no privados) del padre.', 'publicada'),
  ('java-u3-l1-a4', 'java-u3-l1', 4, 'opcion-multiple', '¿De cuántas clases puede heredar directamente una clase en Java?', null, 'Java no tiene herencia múltiple de clases (sí puede implementar varias interfaces).', 'publicada'),
  ('java-u3-l2-a1', 'java-u3-l2', 1, 'opcion-multiple', '¿Qué muestra este código?', 'Animal a = new Gato();
System.out.println(a.sonido());', 'Se ejecuta el método de la clase real del objeto: Gato.', 'publicada'),
  ('java-u3-l2-a2', 'java-u3-l2', 2, 'opcion-multiple', '¿Para qué sirve @Override?', null, 'Si el método no coincide con ninguno del padre, el compilador avisa.', 'publicada'),
  ('java-u3-l2-a3', 'java-u3-l2', 3, 'opcion-multiple', 'Con Gato extends Animal, ¿cuál de estas líneas es válida?', null, 'Un Gato es un Animal, así que una variable Animal puede guardar un Gato. Al revés no.', 'publicada'),
  ('java-u3-l2-a4', 'java-u3-l2', 4, 'opcion-multiple', '¿Qué es el polimorfismo?', null, 'a.sonido() hace "Miau" o "Guau" según el objeto real.', 'publicada'),
  ('java-u4-l1-a1', 'java-u4-l1', 1, 'opcion-multiple', '¿Qué método agrega un elemento a un ArrayList?', null, 'lista.add(valor) lo agrega al final.', 'publicada'),
  ('java-u4-l1-a2', 'java-u4-l1', 2, 'opcion-multiple', '¿Qué método dice cuántos elementos tiene un ArrayList?', null, 'Los ArrayList usan size(). length es de los arrays comunes.', 'publicada'),
  ('java-u4-l1-a3', 'java-u4-l1', 3, 'opcion-multiple', '¿Cuál es la principal diferencia entre un array y un ArrayList?', null, 'El tamaño de un array se fija al crearlo; el ArrayList se agranda solo.', 'publicada'),
  ('java-u4-l1-a4', 'java-u4-l1', 4, 'opcion-multiple', '¿Cómo se declara un ArrayList de números enteros?', null, 'Las colecciones guardan objetos: se usa Integer en lugar de int.', 'publicada'),
  ('java-u4-l2-a1', 'java-u4-l2', 1, 'opcion-multiple', '¿Qué método agrega un par clave-valor a un HashMap?', null, 'map.put(clave, valor). Si la clave ya existía, reemplaza el valor.', 'publicada'),
  ('java-u4-l2-a2', 'java-u4-l2', 2, 'opcion-multiple', '¿Qué devuelve get() con una clave que no existe?', null, 'Devuelve null. Para preguntar antes se usa containsKey().', 'publicada'),
  ('java-u4-l2-a3', 'java-u4-l2', 3, 'opcion-multiple', '¿Qué muestra este código?', 'HashMap<String, Integer> m = new HashMap<>();
m.put("a", 1);
m.put("a", 5);
System.out.println(m.get("a"));', 'Las claves no se repiten: el segundo put reemplaza el valor.', 'publicada'),
  ('java-u4-l2-a4', 'java-u4-l2', 4, 'opcion-multiple', '¿Qué método devuelve todas las claves de un HashMap?', null, 'keySet() devuelve las claves; values(), los valores.', 'publicada'),
  ('cpp-u3-l1-a1', 'cpp-u3-l1', 1, 'opcion-multiple', '¿Con qué se accede a un miembro de una variable struct?', null, 'p.x. La flecha -> se usa cuando se tiene un puntero.', 'publicada'),
  ('cpp-u3-l1-a2', 'cpp-u3-l1', 2, 'opcion-multiple', '¿Qué falta en esta definición?', 'struct Alumno {
    std::string nombre;
    int edad;
}', 'La definición de un struct termina con }; .', 'publicada'),
  ('cpp-u3-l1-a3', 'cpp-u3-l1', 3, 'opcion-multiple', 'Si q es un puntero a un Punto, ¿cómo se lee su miembro x?', null, 'Con un puntero se usa ->, que equivale a (*q).x.', 'publicada'),
  ('cpp-u3-l1-a4', 'cpp-u3-l1', 4, 'opcion-multiple', '¿Qué muestra este código?', 'Punto p = {2, 7};
std::cout << p.x + p.y;', 'p.x vale 2 y p.y vale 7: 2 + 7 = 9.', 'publicada'),
  ('cpp-u3-l2-a1', 'cpp-u3-l2', 1, 'opcion-multiple', 'En una class, ¿cómo son los miembros si no se indica nada?', null, 'En class son privados por defecto; en struct, públicos.', 'publicada'),
  ('cpp-u3-l2-a2', 'cpp-u3-l2', 2, 'opcion-multiple', '¿Cómo se llama el destructor de la clase Cuenta?', null, 'El destructor lleva el nombre de la clase con ~ adelante.', 'publicada'),
  ('cpp-u3-l2-a3', 'cpp-u3-l2', 3, 'opcion-multiple', '¿Cuándo se ejecuta el constructor?', null, 'Se ejecuta automáticamente cuando se crea el objeto.', 'publicada'),
  ('cpp-u3-l2-a4', 'cpp-u3-l2', 4, 'opcion-multiple', 'Con la clase del ejemplo, ¿qué línea da error de compilación?', 'Cuenta c(100);', 'saldo es privado: no se puede usar desde afuera de la clase.', 'publicada'),
  ('cpp-u4-l1-a1', 'cpp-u4-l1', 1, 'opcion-multiple', '¿Con qué se libera la memoria pedida con new?', null, 'Lo que se pide con new se libera con delete.', 'publicada'),
  ('cpp-u4-l1-a2', 'cpp-u4-l1', 2, 'opcion-multiple', '¿Cómo se libera un array creado con new int[10]?', null, 'Los arrays dinámicos se liberan con delete[].', 'publicada'),
  ('cpp-u4-l1-a3', 'cpp-u4-l1', 3, 'opcion-multiple', '¿Qué es una fuga de memoria?', null, 'Si se pierde el puntero sin delete, esa memoria queda ocupada hasta que termina el programa.', 'publicada'),
  ('cpp-u4-l1-a4', 'cpp-u4-l1', 4, 'opcion-multiple', '¿Dónde se guarda la memoria pedida con new?', null, 'new reserva memoria en el heap, que no se libera sola al terminar la función.', 'publicada'),
  ('cpp-u4-l2-a1', 'cpp-u4-l2', 1, 'opcion-multiple', '¿Qué ventaja tiene un puntero inteligente?', null, 'Cuando el puntero inteligente deja de existir, libera la memoria: no hace falta delete.', 'publicada'),
  ('cpp-u4-l2-a2', 'cpp-u4-l2', 2, 'opcion-multiple', '¿Qué puntero inteligente tiene un único dueño y no se puede copiar?', null, 'unique_ptr es de un solo dueño; se puede mover, pero no copiar.', 'publicada'),
  ('cpp-u4-l2-a3', 'cpp-u4-l2', 3, 'opcion-multiple', '¿Qué muestra este código?', 'auto a = std::make_shared<int>(7);
auto b = a;
std::cout << a.use_count();', 'a y b comparten el mismo dato: hay dos dueños.', 'publicada'),
  ('cpp-u4-l2-a4', 'cpp-u4-l2', 4, 'opcion-multiple', '¿Qué biblioteca hay que incluir para usar punteros inteligentes?', null, 'unique_ptr, shared_ptr, make_unique y make_shared están en <memory>.', 'publicada') on conflict (id) do update set
  leccion_id = excluded.leccion_id,
  orden = excluded.orden,
  tipo = excluded.tipo,
  enunciado = excluded.enunciado,
  codigo = excluded.codigo,
  explicacion = excluded.explicacion,
  estado = excluded.estado;

-- ---------------------------------------------------------------------------
-- Opciones de respuesta (832)
-- es_correcta es la otra mitad de la solucion: tampoco la puede leer anon.
-- ---------------------------------------------------------------------------
insert into public.opciones (id, pregunta_id, orden, texto, es_correcta)
values
  ('js-u1-l1-a1-a', 'js-u1-l1-a1', 1, 'En el navegador de quien visita la pagina', true),
  ('js-u1-l1-a1-b', 'js-u1-l1-a1', 2, 'En la impresora', false),
  ('js-u1-l1-a1-c', 'js-u1-l1-a1', 3, 'Solo en el servidor', false),
  ('js-u1-l1-a1-d', 'js-u1-l1-a1', 4, 'En el sistema operativo, antes de abrir el navegador', false),
  ('js-u1-l1-a2-a', 'js-u1-l1-a2', 1, '<style>', false),
  ('js-u1-l1-a2-b', 'js-u1-l1-a2', 2, '<script>', true),
  ('js-u1-l1-a2-c', 'js-u1-l1-a2', 3, '<js>', false),
  ('js-u1-l1-a2-d', 'js-u1-l1-a2', 4, '<code>', false),
  ('js-u1-l1-a3-a', 'js-u1-l1-a3', 1, 'console.escribir("Hola")', false),
  ('js-u1-l1-a3-b', 'js-u1-l1-a3', 2, 'print("Hola")', false),
  ('js-u1-l1-a3-c', 'js-u1-l1-a3', 3, 'console.log("Hola")', true),
  ('js-u1-l1-a3-d', 'js-u1-l1-a3', 4, 'mostrar("Hola")', false),
  ('js-u1-l1-a4-a', 'js-u1-l1-a4', 1, 'Si, JavaScript es la version del navegador de Java', false),
  ('js-u1-l1-a4-b', 'js-u1-l1-a4', 2, 'No, son lenguajes distintos que solo comparten parte del nombre', true),
  ('js-u1-l1-a4-c', 'js-u1-l1-a4', 3, 'Si, se escriben igual pero cambia la extension del archivo', false),
  ('js-u1-l1-a4-d', 'js-u1-l1-a4', 4, 'No, pero JavaScript se compila a Java antes de ejecutarse', false),
  ('js-u1-l2-a1-a', 'js-u1-l2-a1', 1, 'let', false),
  ('js-u1-l2-a1-b', 'js-u1-l2-a1', 2, 'var', false),
  ('js-u1-l2-a1-c', 'js-u1-l2-a1', 3, 'const', true),
  ('js-u1-l2-a1-d', 'js-u1-l2-a1', 4, 'fixed', false),
  ('js-u1-l2-a2-a', 'js-u1-l2-a2', 1, 'let', true),
  ('js-u1-l2-a2-b', 'js-u1-l2-a2', 2, 'const', false),
  ('js-u1-l2-a2-c', 'js-u1-l2-a2', 3, 'function', false),
  ('js-u1-l2-a2-d', 'js-u1-l2-a2', 4, 'new', false),
  ('js-u1-l2-a3-a', 'js-u1-l2-a3', 1, 'nombre pasa a valer "Grace"', false),
  ('js-u1-l2-a3-b', 'js-u1-l2-a3', 2, 'Lanza un error porque una constante no se puede reasignar', true),
  ('js-u1-l2-a3-c', 'js-u1-l2-a3', 3, 'nombre queda vacio', false),
  ('js-u1-l2-a3-d', 'js-u1-l2-a3', 4, 'No pasa nada, la segunda linea se ignora', false),
  ('js-u1-l2-a4-a', 'js-u1-l2-a4', 1, '2puntaje', false),
  ('js-u1-l2-a4-b', 'js-u1-l2-a4', 2, 'puntaje-total', false),
  ('js-u1-l2-a4-c', 'js-u1-l2-a4', 3, 'puntajeTotal', true),
  ('js-u1-l2-a4-d', 'js-u1-l2-a4', 4, 'let', false),
  ('js-u1-l3-a1-a', 'js-u1-l3-a1', 1, '"number"', false),
  ('js-u1-l3-a1-b', 'js-u1-l3-a1', 2, '"string"', true),
  ('js-u1-l3-a1-c', 'js-u1-l3-a1', 3, '"text"', false),
  ('js-u1-l3-a1-d', 'js-u1-l3-a1', 4, '"undefined"', false),
  ('js-u1-l3-a2-a', 'js-u1-l3-a2', 1, 'number', false),
  ('js-u1-l3-a2-b', 'js-u1-l3-a2', 2, 'string', false),
  ('js-u1-l3-a2-c', 'js-u1-l3-a2', 3, 'boolean', true),
  ('js-u1-l3-a2-d', 'js-u1-l3-a2', 4, 'binary', false),
  ('js-u1-l3-a3-a', 'js-u1-l3-a3', 1, '1) const nombre = "Ada"  ·  2) const saludo = "Hola, " + nombre  ·  3) console.log(saludo)', true),
  ('js-u1-l3-a3-b', 'js-u1-l3-a3', 2, '1) console.log(saludo)  ·  2) const nombre = "Ada"  ·  3) const saludo = "Hola, " + nombre', false),
  ('js-u1-l3-a3-c', 'js-u1-l3-a3', 3, '1) const saludo = "Hola, " + nombre  ·  2) const nombre = "Ada"  ·  3) console.log(saludo)', false),
  ('js-u1-l3-a3-d', 'js-u1-l3-a3', 4, '1) const nombre = "Ada"  ·  2) console.log(saludo)  ·  3) const saludo = "Hola, " + nombre', false),
  ('js-u1-l3-a4-a', 'js-u1-l3-a4', 1, 'true', false),
  ('js-u1-l3-a4-b', 'js-u1-l3-a4', 2, 'false', true),
  ('js-u1-l3-a4-c', 'js-u1-l3-a4', 3, '"number"', false),
  ('js-u1-l3-a4-d', 'js-u1-l3-a4', 4, 'Error', false),
  ('js-u2-l1-a1-a', 'js-u2-l1-a1', 1, '2', true),
  ('js-u2-l1-a1-b', 'js-u2-l1-a1', 2, '2.5', false),
  ('js-u2-l1-a1-c', 'js-u2-l1-a1', 3, '0', false),
  ('js-u2-l1-a1-d', 'js-u2-l1-a1', 4, '6', false),
  ('js-u2-l1-a2-a', 'js-u2-l1-a2', 1, '8', false),
  ('js-u2-l1-a2-b', 'js-u2-l1-a2', 2, '"53"', true),
  ('js-u2-l1-a2-c', 'js-u2-l1-a2', 3, 'NaN', false),
  ('js-u2-l1-a2-d', 'js-u2-l1-a2', 4, 'Un error', false),
  ('js-u2-l1-a3-a', 'js-u2-l1-a3', 1, '+=1+', false),
  ('js-u2-l1-a3-b', 'js-u2-l1-a3', 2, '**', false),
  ('js-u2-l1-a3-c', 'js-u2-l1-a3', 3, '++', true),
  ('js-u2-l1-a3-d', 'js-u2-l1-a3', 4, '=+', false),
  ('js-u2-l1-a4-a', 'js-u2-l1-a4', 1, 'n / 2 === 0', false),
  ('js-u2-l1-a4-b', 'js-u2-l1-a4', 2, 'n - 2 === 0', false),
  ('js-u2-l1-a4-c', 'js-u2-l1-a4', 3, 'n * 2 === 0', false),
  ('js-u2-l1-a4-d', 'js-u2-l1-a4', 4, 'n % 2 === 0', true),
  ('js-u2-l2-a1-a', 'js-u2-l2-a1', 1, '=== solo sirve para números', false),
  ('js-u2-l2-a1-b', 'js-u2-l2-a1', 2, 'Son iguales', false),
  ('js-u2-l2-a1-c', 'js-u2-l2-a1', 3, '== es más estricto que ===', false),
  ('js-u2-l2-a1-d', 'js-u2-l2-a1', 4, '=== compara también el tipo; == convierte los tipos antes', true),
  ('js-u2-l2-a2-a', 'js-u2-l2-a2', 1, 'false', true),
  ('js-u2-l2-a2-b', 'js-u2-l2-a2', 2, 'true', false),
  ('js-u2-l2-a2-c', 'js-u2-l2-a2', 3, 'undefined', false),
  ('js-u2-l2-a2-d', 'js-u2-l2-a2', 4, 'Un error', false),
  ('js-u2-l2-a3-a', 'js-u2-l2-a3', 1, '<>', false),
  ('js-u2-l2-a3-b', 'js-u2-l2-a3', 2, '!==', true),
  ('js-u2-l2-a3-c', 'js-u2-l2-a3', 3, '=/=', false),
  ('js-u2-l2-a3-d', 'js-u2-l2-a3', 4, '!=', false),
  ('js-u2-l2-a4-a', 'js-u2-l2-a4', 1, 'Un número', false),
  ('js-u2-l2-a4-b', 'js-u2-l2-a4', 2, 'Un texto', false),
  ('js-u2-l2-a4-c', 'js-u2-l2-a4', 3, 'Un booleano (true o false)', true),
  ('js-u2-l2-a4-d', 'js-u2-l2-a4', 4, 'undefined', false),
  ('js-u2-l3-a1-a', 'js-u2-l3-a1', 1, 'Adulto', false),
  ('js-u2-l3-a1-b', 'js-u2-l3-a1', 2, 'Adulto y Menor', false),
  ('js-u2-l3-a1-c', 'js-u2-l3-a1', 3, 'Menor', true),
  ('js-u2-l3-a1-d', 'js-u2-l3-a1', 4, 'Nada', false),
  ('js-u2-l3-a2-a', 'js-u2-l3-a2', 1, '||', false),
  ('js-u2-l3-a2-b', 'js-u2-l3-a2', 2, 'and', false),
  ('js-u2-l3-a2-c', 'js-u2-l3-a2', 3, '!', false),
  ('js-u2-l3-a2-d', 'js-u2-l3-a2', 4, '&&', true),
  ('js-u2-l3-a3-a', 'js-u2-l3-a3', 1, 'Abrigo', true),
  ('js-u2-l3-a3-b', 'js-u2-l3-a3', 2, 'Remera', false),
  ('js-u2-l3-a3-c', 'js-u2-l3-a3', 3, 'Nada', false),
  ('js-u2-l3-a3-d', 'js-u2-l3-a3', 4, 'Un error', false),
  ('js-u2-l3-a4-a', 'js-u2-l3-a4', 1, 'La repite', false),
  ('js-u2-l3-a4-b', 'js-u2-l3-a4', 2, 'La invierte: true pasa a false y al revés', true),
  ('js-u2-l3-a4-c', 'js-u2-l3-a4', 3, 'La compara con 0', false),
  ('js-u2-l3-a4-d', 'js-u2-l3-a4', 4, 'La convierte en texto', false),
  ('js-u3-l1-a1-a', 'js-u3-l1-a1', 1, '3', false),
  ('js-u3-l1-a1-b', 'js-u3-l1-a1', 2, '4', true),
  ('js-u3-l1-a1-c', 'js-u3-l1-a1', 3, '5', false),
  ('js-u3-l1-a1-d', 'js-u3-l1-a1', 4, 'Infinitas', false),
  ('js-u3-l1-a2-a', 'js-u3-l1-a2', 1, 'i <= lista.length', false),
  ('js-u3-l1-a2-b', 'js-u3-l1-a2', 2, 'i < lista', false),
  ('js-u3-l1-a2-c', 'js-u3-l1-a2', 3, 'i < lista.length', true),
  ('js-u3-l1-a2-d', 'js-u3-l1-a2', 4, 'i > lista.length', false),
  ('js-u3-l1-a3-a', 'js-u3-l1-a3', 1, 'Nada, se suma solo', false),
  ('js-u3-l1-a3-b', 'js-u3-l1-a3', 2, 'Da error de sintaxis', false),
  ('js-u3-l1-a3-c', 'js-u3-l1-a3', 3, 'No se ejecuta nunca', false),
  ('js-u3-l1-a3-d', 'js-u3-l1-a3', 4, 'El bucle se repite para siempre', true),
  ('js-u3-l1-a4-a', 'js-u3-l1-a4', 1, '6', true),
  ('js-u3-l1-a4-b', 'js-u3-l1-a4', 2, '3', false),
  ('js-u3-l1-a4-c', 'js-u3-l1-a4', 3, '4', false),
  ('js-u3-l1-a4-d', 'js-u3-l1-a4', 4, '0', false),
  ('js-u3-l2-a1-a', 'js-u3-l2-a1', 1, 'Cuando no se sabe de antemano cuántas vueltas hacen falta', true),
  ('js-u3-l2-a1-b', 'js-u3-l2-a1', 2, 'Siempre, es más rápido', false),
  ('js-u3-l2-a1-c', 'js-u3-l2-a1', 3, 'Solo para recorrer arrays', false),
  ('js-u3-l2-a1-d', 'js-u3-l2-a1', 4, 'Nunca', false),
  ('js-u3-l2-a2-a', 'js-u3-l2-a2', 1, 'stop', false),
  ('js-u3-l2-a2-b', 'js-u3-l2-a2', 2, 'break', true),
  ('js-u3-l2-a2-c', 'js-u3-l2-a2', 3, 'continue', false),
  ('js-u3-l2-a2-d', 'js-u3-l2-a2', 4, 'exit', false),
  ('js-u3-l2-a3-a', 'js-u3-l2-a3', 1, '1 2 3 4', false),
  ('js-u3-l2-a3-b', 'js-u3-l2-a3', 2, '1', false),
  ('js-u3-l2-a3-c', 'js-u3-l2-a3', 3, '1 3 4', true),
  ('js-u3-l2-a3-d', 'js-u3-l2-a3', 4, '2', false),
  ('js-u3-l2-a4-a', 'js-u3-l2-a4', 1, '16', false),
  ('js-u3-l2-a4-b', 'js-u3-l2-a4', 2, '20', false),
  ('js-u3-l2-a4-c', 'js-u3-l2-a4', 3, '1', false),
  ('js-u3-l2-a4-d', 'js-u3-l2-a4', 4, '32', true),
  ('js-u4-l1-a1-a', 'js-u4-l1-a1', 1, 'func', false),
  ('js-u4-l1-a1-b', 'js-u4-l1-a1', 2, 'def', false),
  ('js-u4-l1-a1-c', 'js-u4-l1-a1', 3, 'function', true),
  ('js-u4-l1-a1-d', 'js-u4-l1-a1', 4, 'method', false),
  ('js-u4-l1-a2-a', 'js-u4-l1-a2', 1, '5', false),
  ('js-u4-l1-a2-b', 'js-u4-l1-a2', 2, 'undefined', false),
  ('js-u4-l1-a2-c', 'js-u4-l1-a2', 3, '25', false),
  ('js-u4-l1-a2-d', 'js-u4-l1-a2', 4, '10', true),
  ('js-u4-l1-a3-a', 'js-u4-l1-a3', 1, 'undefined', true),
  ('js-u4-l1-a3-b', 'js-u4-l1-a3', 2, 'null', false),
  ('js-u4-l1-a3-c', 'js-u4-l1-a3', 3, '0', false),
  ('js-u4-l1-a3-d', 'js-u4-l1-a3', 4, 'Un error', false),
  ('js-u4-l1-a4-a', 'js-u4-l1-a4', 1, 'El valor devuelto', false),
  ('js-u4-l1-a4-b', 'js-u4-l1-a4', 2, 'Un parámetro', true),
  ('js-u4-l1-a4-c', 'js-u4-l1-a4', 3, 'El nombre de la función', false),
  ('js-u4-l1-a4-d', 'js-u4-l1-a4', 4, 'Una variable global', false),
  ('js-u4-l2-a1-a', 'js-u4-l2-a1', 1, 'const triple = n -> n * 3', false),
  ('js-u4-l2-a1-b', 'js-u4-l2-a1', 2, 'const triple = (n) => n * 3', true),
  ('js-u4-l2-a1-c', 'js-u4-l2-a1', 3, 'function => triple(n * 3)', false),
  ('js-u4-l2-a1-d', 'js-u4-l2-a1', 4, 'const triple = (n) { n * 3 }', false),
  ('js-u4-l2-a2-a', 'js-u4-l2-a2', 1, '23', false),
  ('js-u4-l2-a2-b', 'js-u4-l2-a2', 2, 'undefined', false),
  ('js-u4-l2-a2-c', 'js-u4-l2-a2', 3, '5', true),
  ('js-u4-l2-a2-d', 'js-u4-l2-a2', 4, 'a + b', false),
  ('js-u4-l2-a3-a', 'js-u4-l2-a3', 1, 'Funciona igual', false),
  ('js-u4-l2-a3-b', 'js-u4-l2-a3', 2, 'Vale 0', false),
  ('js-u4-l2-a3-c', 'js-u4-l2-a3', 3, 'Vale undefined', false),
  ('js-u4-l2-a3-d', 'js-u4-l2-a3', 4, 'Da error: solo existe dentro de la función', true),
  ('js-u4-l2-a4-a', 'js-u4-l2-a4', 1, '2', true),
  ('js-u4-l2-a4-b', 'js-u4-l2-a4', 2, '1', false),
  ('js-u4-l2-a4-c', 'js-u4-l2-a4', 3, '1 y 2', false),
  ('js-u4-l2-a4-d', 'js-u4-l2-a4', 4, 'Un error', false),
  ('js-u5-l1-a1-a', 'js-u5-l1-a1', 1, '"a"', false),
  ('js-u5-l1-a1-b', 'js-u5-l1-a1', 2, 'undefined', false),
  ('js-u5-l1-a1-c', 'js-u5-l1-a1', 3, '"c"', false),
  ('js-u5-l1-a1-d', 'js-u5-l1-a1', 4, '"b"', true),
  ('js-u5-l1-a2-a', 'js-u5-l1-a2', 1, 'push()', true),
  ('js-u5-l1-a2-b', 'js-u5-l1-a2', 2, 'add()', false),
  ('js-u5-l1-a2-c', 'js-u5-l1-a2', 3, 'append()', false),
  ('js-u5-l1-a2-d', 'js-u5-l1-a2', 4, 'insert()', false),
  ('js-u5-l1-a3-a', 'js-u5-l1-a3', 1, '2', false),
  ('js-u5-l1-a3-b', 'js-u5-l1-a3', 2, '3', true),
  ('js-u5-l1-a3-c', 'js-u5-l1-a3', 3, '4', false),
  ('js-u5-l1-a3-d', 'js-u5-l1-a3', 4, '"c"', false),
  ('js-u5-l1-a4-a', 'js-u5-l1-a4', 1, 'Agrega un elemento al principio', false),
  ('js-u5-l1-a4-b', 'js-u5-l1-a4', 2, 'Vacía el array', false),
  ('js-u5-l1-a4-c', 'js-u5-l1-a4', 3, 'Saca y devuelve el último elemento', true),
  ('js-u5-l1-a4-d', 'js-u5-l1-a4', 4, 'Ordena el array', false),
  ('js-u5-l2-a1-a', 'js-u5-l2-a1', 1, 'usuario[0]', false),
  ('js-u5-l2-a1-b', 'js-u5-l2-a1', 2, 'usuario->nombre', false),
  ('js-u5-l2-a1-c', 'js-u5-l2-a1', 3, 'usuario.nombre', true),
  ('js-u5-l2-a1-d', 'js-u5-l2-a1', 4, 'nombre.usuario', false),
  ('js-u5-l2-a2-a', 'js-u5-l2-a2', 1, 'map()', false),
  ('js-u5-l2-a2-b', 'js-u5-l2-a2', 2, 'find()', false),
  ('js-u5-l2-a2-c', 'js-u5-l2-a2', 3, 'push()', false),
  ('js-u5-l2-a2-d', 'js-u5-l2-a2', 4, 'filter()', true),
  ('js-u5-l2-a3-a', 'js-u5-l2-a3', 1, '[10, 20, 30]', true),
  ('js-u5-l2-a3-b', 'js-u5-l2-a3', 2, '[1, 2, 3]', false),
  ('js-u5-l2-a3-c', 'js-u5-l2-a3', 3, '60', false),
  ('js-u5-l2-a3-d', 'js-u5-l2-a3', 4, '[10]', false),
  ('js-u5-l2-a4-a', 'js-u5-l2-a4', 1, '[4, 8]', false),
  ('js-u5-l2-a4-b', 'js-u5-l2-a4', 2, '[15, 23]', true),
  ('js-u5-l2-a4-c', 'js-u5-l2-a4', 3, '2', false),
  ('js-u5-l2-a4-d', 'js-u5-l2-a4', 4, '[true, false]', false),
  ('js-u6-l1-a1-a', 'js-u6-l1-a1', 1, 'Devuelve el primer elemento con la clase titulo', true),
  ('js-u6-l1-a1-b', 'js-u6-l1-a1', 2, 'Crea un elemento nuevo', false),
  ('js-u6-l1-a1-c', 'js-u6-l1-a1', 3, 'Borra los títulos', false),
  ('js-u6-l1-a1-d', 'js-u6-l1-a1', 4, 'Devuelve todos los elementos con esa clase', false),
  ('js-u6-l1-a2-a', 'js-u6-l1-a2', 1, 'value()', false),
  ('js-u6-l1-a2-b', 'js-u6-l1-a2', 2, 'textContent', true),
  ('js-u6-l1-a2-c', 'js-u6-l1-a2', 3, 'html', false),
  ('js-u6-l1-a2-d', 'js-u6-l1-a2', 4, 'texto', false),
  ('js-u6-l1-a3-a', 'js-u6-l1-a3', 1, 'Un lenguaje de estilos', false),
  ('js-u6-l1-a3-b', 'js-u6-l1-a3', 2, 'Un servidor', false),
  ('js-u6-l1-a3-c', 'js-u6-l1-a3', 3, 'La representación del HTML que JavaScript puede leer y modificar', true),
  ('js-u6-l1-a3-d', 'js-u6-l1-a3', 4, 'Una base de datos', false),
  ('js-u6-l1-a4-a', 'js-u6-l1-a4', 1, 'document.querySelector(".menu")', false),
  ('js-u6-l1-a4-b', 'js-u6-l1-a4', 2, 'document.querySelector("@menu")', false),
  ('js-u6-l1-a4-c', 'js-u6-l1-a4', 3, 'document.querySelector("menu")', false),
  ('js-u6-l1-a4-d', 'js-u6-l1-a4', 4, 'document.querySelector("#menu")', true),
  ('js-u6-l2-a1-a', 'js-u6-l2-a1', 1, 'onEvent()', false),
  ('js-u6-l2-a1-b', 'js-u6-l2-a1', 2, 'attachClick()', false),
  ('js-u6-l2-a1-c', 'js-u6-l2-a1', 3, 'listen()', false),
  ('js-u6-l2-a1-d', 'js-u6-l2-a1', 4, 'addEventListener()', true),
  ('js-u6-l2-a2-a', 'js-u6-l2-a2', 1, 'compile', true),
  ('js-u6-l2-a2-b', 'js-u6-l2-a2', 2, 'keydown', false),
  ('js-u6-l2-a2-c', 'js-u6-l2-a2', 3, 'submit', false),
  ('js-u6-l2-a2-d', 'js-u6-l2-a2', 4, 'click', false),
  ('js-u6-l2-a3-a', 'js-u6-l2-a3', 1, 'Se borra el botón', false),
  ('js-u6-l2-a3-b', 'js-u6-l2-a3', 2, 'El texto de mensaje cambia a "Listo!"', true),
  ('js-u6-l2-a3-c', 'js-u6-l2-a3', 3, 'No pasa nada hasta recargar', false),
  ('js-u6-l2-a3-d', 'js-u6-l2-a3', 4, 'Se abre una página nueva', false),
  ('js-u6-l2-a4-a', 'js-u6-l2-a4', 1, 'send', false),
  ('js-u6-l2-a4-b', 'js-u6-l2-a4', 2, 'post', false),
  ('js-u6-l2-a4-c', 'js-u6-l2-a4', 3, 'submit', true),
  ('js-u6-l2-a4-d', 'js-u6-l2-a4', 4, 'enter', false),
  ('py-u1-l1-a1-a', 'py-u1-l1-a1', 1, 'echo()', false),
  ('py-u1-l1-a1-b', 'py-u1-l1-a1', 2, 'console.log()', false),
  ('py-u1-l1-a1-c', 'py-u1-l1-a1', 3, 'mostrar()', false),
  ('py-u1-l1-a1-d', 'py-u1-l1-a1', 4, 'print()', true),
  ('py-u1-l1-a2-a', 'py-u1-l1-a2', 1, '#', true),
  ('py-u1-l1-a2-b', 'py-u1-l1-a2', 2, '//', false),
  ('py-u1-l1-a2-c', 'py-u1-l1-a2', 3, '<!--', false),
  ('py-u1-l1-a2-d', 'py-u1-l1-a2', 4, '--', false),
  ('py-u1-l1-a3-a', 'py-u1-l1-a3', 1, '2 + 3', false),
  ('py-u1-l1-a3-b', 'py-u1-l1-a3', 2, '5', true),
  ('py-u1-l1-a3-c', 'py-u1-l1-a3', 3, 'Un error', false),
  ('py-u1-l1-a3-d', 'py-u1-l1-a3', 4, '"5"', false),
  ('py-u1-l1-a4-a', 'py-u1-l1-a4', 1, 'print("Hola");;', false),
  ('py-u1-l1-a4-b', 'py-u1-l1-a4', 2, 'print "Hola" end', false),
  ('py-u1-l1-a4-c', 'py-u1-l1-a4', 3, 'print("Hola")', true),
  ('py-u1-l1-a4-d', 'py-u1-l1-a4', 4, 'Print["Hola"]', false),
  ('py-u1-l2-a1-a', 'py-u1-l2-a1', 1, 'int puntos = 10', false),
  ('py-u1-l2-a1-b', 'py-u1-l2-a1', 2, 'let puntos = 10', false),
  ('py-u1-l2-a1-c', 'py-u1-l2-a1', 3, 'puntos = 10', true),
  ('py-u1-l2-a1-d', 'py-u1-l2-a1', 4, 'var puntos := 10', false),
  ('py-u1-l2-a2-a', 'py-u1-l2-a2', 1, 'bool', false),
  ('py-u1-l2-a2-b', 'py-u1-l2-a2', 2, 'int', false),
  ('py-u1-l2-a2-c', 'py-u1-l2-a2', 3, 'str', false),
  ('py-u1-l2-a2-d', 'py-u1-l2-a2', 4, 'float', true),
  ('py-u1-l2-a3-a', 'py-u1-l2-a3', 1, 'Hola Ana', true),
  ('py-u1-l2-a3-b', 'py-u1-l2-a3', 2, 'Hola nombre', false),
  ('py-u1-l2-a3-c', 'py-u1-l2-a3', 3, 'Un error', false),
  ('py-u1-l2-a3-d', 'py-u1-l2-a3', 4, '"Hola " + nombre', false),
  ('py-u1-l2-a4-a', 'py-u1-l2-a4', 1, 'int', false),
  ('py-u1-l2-a4-b', 'py-u1-l2-a4', 2, 'str', true),
  ('py-u1-l2-a4-c', 'py-u1-l2-a4', 3, 'Depende de lo que se escriba', false),
  ('py-u1-l2-a4-d', 'py-u1-l2-a4', 4, 'bool', false),
  ('py-u2-l1-a1-a', 'py-u2-l1-a1', 1, 'La sangría (espacios al inicio)', true),
  ('py-u2-l1-a1-b', 'py-u2-l1-a1', 2, 'Las llaves { }', false),
  ('py-u2-l1-a1-c', 'py-u2-l1-a1', 3, 'La palabra end', false),
  ('py-u2-l1-a1-d', 'py-u2-l1-a1', 4, 'Los paréntesis', false),
  ('py-u2-l1-a2-a', 'py-u2-l1-a2', 1, 'grande', false),
  ('py-u2-l1-a2-b', 'py-u2-l1-a2', 2, 'chico', true),
  ('py-u2-l1-a2-c', 'py-u2-l1-a2', 3, 'grande y chico', false),
  ('py-u2-l1-a2-d', 'py-u2-l1-a2', 4, 'Nada', false),
  ('py-u2-l1-a3-a', 'py-u2-l1-a3', 1, '=', false),
  ('py-u2-l1-a3-b', 'py-u2-l1-a3', 2, '===', false),
  ('py-u2-l1-a3-c', 'py-u2-l1-a3', 3, '==', true),
  ('py-u2-l1-a3-d', 'py-u2-l1-a3', 4, 'eq', false),
  ('py-u2-l1-a4-a', 'py-u2-l1-a4', 1, 'else if', false),
  ('py-u2-l1-a4-b', 'py-u2-l1-a4', 2, 'elseif', false),
  ('py-u2-l1-a4-c', 'py-u2-l1-a4', 3, 'otherwise', false),
  ('py-u2-l1-a4-d', 'py-u2-l1-a4', 4, 'elif', true),
  ('py-u2-l2-a1-a', 'py-u2-l2-a1', 1, '1, 2, 3, 4', false),
  ('py-u2-l2-a1-b', 'py-u2-l2-a1', 2, '4', false),
  ('py-u2-l2-a1-c', 'py-u2-l2-a1', 3, '0, 1, 2, 3, 4', false),
  ('py-u2-l2-a1-d', 'py-u2-l2-a1', 4, '0, 1, 2, 3', true),
  ('py-u2-l2-a2-a', 'py-u2-l2-a2', 1, '3', true),
  ('py-u2-l2-a2-b', 'py-u2-l2-a2', 2, '5', false),
  ('py-u2-l2-a2-c', 'py-u2-l2-a2', 3, '2', false),
  ('py-u2-l2-a2-d', 'py-u2-l2-a2', 4, '4', false),
  ('py-u2-l2-a3-a', 'py-u2-l2-a3', 1, 'El bucle no se ejecuta', false),
  ('py-u2-l2-a3-b', 'py-u2-l2-a3', 2, 'Se repite para siempre', true),
  ('py-u2-l2-a3-c', 'py-u2-l2-a3', 3, 'Python la corta a las 100 vueltas', false),
  ('py-u2-l2-a3-d', 'py-u2-l2-a3', 4, 'Da error de sintaxis', false),
  ('py-u2-l2-a4-a', 'py-u2-l2-a4', 1, 'stop', false),
  ('py-u2-l2-a4-b', 'py-u2-l2-a4', 2, 'exit', false),
  ('py-u2-l2-a4-c', 'py-u2-l2-a4', 3, 'break', true),
  ('py-u2-l2-a4-d', 'py-u2-l2-a4', 4, 'return', false),
  ('web-u1-l1-a1-a', 'web-u1-l1-a1', 1, '<p>', true),
  ('web-u1-l1-a1-b', 'web-u1-l1-a1', 2, '<par>', false),
  ('web-u1-l1-a1-c', 'web-u1-l1-a1', 3, '<text>', false),
  ('web-u1-l1-a1-d', 'web-u1-l1-a1', 4, '<h1>', false),
  ('web-u1-l1-a2-a', 'web-u1-l1-a2', 1, '<h1/>', false),
  ('web-u1-l1-a2-b', 'web-u1-l1-a2', 2, '</h1>', true),
  ('web-u1-l1-a2-c', 'web-u1-l1-a2', 3, '<\h1>', false),
  ('web-u1-l1-a2-d', 'web-u1-l1-a2', 4, '<end h1>', false),
  ('web-u1-l1-a3-a', 'web-u1-l1-a3', 1, '<head>', false),
  ('web-u1-l1-a3-b', 'web-u1-l1-a3', 2, '<title>', false),
  ('web-u1-l1-a3-c', 'web-u1-l1-a3', 3, '<body>', true),
  ('web-u1-l1-a3-d', 'web-u1-l1-a3', 4, '<meta>', false),
  ('web-u1-l1-a4-a', 'web-u1-l1-a4', 1, '<h6>', false),
  ('web-u1-l1-a4-b', 'web-u1-l1-a4', 2, '<title>', false),
  ('web-u1-l1-a4-c', 'web-u1-l1-a4', 3, '<header>', false),
  ('web-u1-l1-a4-d', 'web-u1-l1-a4', 4, '<h1>', true),
  ('web-u1-l2-a1-a', 'web-u1-l2-a1', 1, 'src', false),
  ('web-u1-l2-a1-b', 'web-u1-l2-a1', 2, 'link', false),
  ('web-u1-l2-a1-c', 'web-u1-l2-a1', 3, 'to', false),
  ('web-u1-l2-a1-d', 'web-u1-l2-a1', 4, 'href', true),
  ('web-u1-l2-a2-a', 'web-u1-l2-a2', 1, 'Para describirla si no se puede ver', true),
  ('web-u1-l2-a2-b', 'web-u1-l2-a2', 2, 'Para cambiar su tamaño', false),
  ('web-u1-l2-a2-c', 'web-u1-l2-a2', 3, 'Para darle un borde', false),
  ('web-u1-l2-a2-d', 'web-u1-l2-a2', 4, 'Para que sea un enlace', false),
  ('web-u1-l2-a3-a', 'web-u1-l2-a3', 1, '<ul>', false),
  ('web-u1-l2-a3-b', 'web-u1-l2-a3', 2, '<ol>', true),
  ('web-u1-l2-a3-c', 'web-u1-l2-a3', 3, '<li>', false),
  ('web-u1-l2-a3-d', 'web-u1-l2-a3', 4, '<list>', false),
  ('web-u1-l2-a4-a', 'web-u1-l2-a4', 1, '<img href="gato.png">', false),
  ('web-u1-l2-a4-b', 'web-u1-l2-a4', 2, '<image src="gato.png"></image>', false),
  ('web-u1-l2-a4-c', 'web-u1-l2-a4', 3, '<img src="gato.png" alt="Un gato">', true),
  ('web-u1-l2-a4-d', 'web-u1-l2-a4', 4, '<img>gato.png</img>', false),
  ('web-u2-l1-a1-a', 'web-u2-l1-a1', 1, '#aviso', false),
  ('web-u2-l1-a1-b', 'web-u2-l1-a1', 2, '.aviso', true),
  ('web-u2-l1-a1-c', 'web-u2-l1-a1', 3, 'aviso', false),
  ('web-u2-l1-a1-d', 'web-u2-l1-a1', 4, '*aviso', false),
  ('web-u2-l1-a2-a', 'web-u2-l1-a2', 1, 'font-color', false),
  ('web-u2-l1-a2-b', 'web-u2-l1-a2', 2, 'text-color', false),
  ('web-u2-l1-a2-c', 'web-u2-l1-a2', 3, 'color', true),
  ('web-u2-l1-a2-d', 'web-u2-l1-a2', 4, 'background-color', false),
  ('web-u2-l1-a3-a', 'web-u2-l1-a3', 1, 'Falta un punto antes de h1', false),
  ('web-u2-l1-a3-b', 'web-u2-l1-a3', 2, 'Las llaves van al revés', false),
  ('web-u2-l1-a3-c', 'web-u2-l1-a3', 3, 'px no es una unidad válida', false),
  ('web-u2-l1-a3-d', 'web-u2-l1-a3', 4, 'Se usa = en lugar de :', true),
  ('web-u2-l1-a4-a', 'web-u2-l1-a4', 1, '#titulo', true),
  ('web-u2-l1-a4-b', 'web-u2-l1-a4', 2, 'titulo', false),
  ('web-u2-l1-a4-c', 'web-u2-l1-a4', 3, '@titulo', false),
  ('web-u2-l1-a4-d', 'web-u2-l1-a4', 4, '.titulo', false),
  ('web-u2-l2-a1-a', 'web-u2-l2-a1', 1, 'padding', true),
  ('web-u2-l2-a1-b', 'web-u2-l2-a1', 2, 'margin', false),
  ('web-u2-l2-a1-c', 'web-u2-l2-a1', 3, 'gap', false),
  ('web-u2-l2-a1-d', 'web-u2-l2-a1', 4, 'spacing', false),
  ('web-u2-l2-a2-a', 'web-u2-l2-a2', 1, 'padding', false),
  ('web-u2-l2-a2-b', 'web-u2-l2-a2', 2, 'margin', true),
  ('web-u2-l2-a2-c', 'web-u2-l2-a2', 3, 'border', false),
  ('web-u2-l2-a2-d', 'web-u2-l2-a2', 4, 'width', false),
  ('web-u2-l2-a3-a', 'web-u2-l2-a3', 1, '100px', false),
  ('web-u2-l2-a3-b', 'web-u2-l2-a3', 2, '110px', false),
  ('web-u2-l2-a3-c', 'web-u2-l2-a3', 3, '130px', true),
  ('web-u2-l2-a3-d', 'web-u2-l2-a3', 4, '115px', false),
  ('web-u2-l2-a4-a', 'web-u2-l2-a4', 1, 'Agrega un borde a la caja', false),
  ('web-u2-l2-a4-b', 'web-u2-l2-a4', 2, 'Centra la caja', false),
  ('web-u2-l2-a4-c', 'web-u2-l2-a4', 3, 'Elimina el margin', false),
  ('web-u2-l2-a4-d', 'web-u2-l2-a4', 4, 'Hace que width incluya el padding y el borde', true),
  ('sql-u1-l1-a1-a', 'sql-u1-l1-a1', 1, 'GET ALL productos;', false),
  ('sql-u1-l1-a1-b', 'sql-u1-l1-a1', 2, 'SELECT productos;', false),
  ('sql-u1-l1-a1-c', 'sql-u1-l1-a1', 3, 'SELECT * FROM productos;', true),
  ('sql-u1-l1-a1-d', 'sql-u1-l1-a1', 4, 'FROM productos SELECT *;', false),
  ('sql-u1-l1-a2-a', 'sql-u1-l1-a2', 1, 'Un tipo de dato', false),
  ('sql-u1-l1-a2-b', 'sql-u1-l1-a2', 2, 'Una base de datos', false),
  ('sql-u1-l1-a2-c', 'sql-u1-l1-a2', 3, 'Una columna', false),
  ('sql-u1-l1-a2-d', 'sql-u1-l1-a2', 4, 'Un registro (por ejemplo, un alumno)', true),
  ('sql-u1-l1-a3-a', 'sql-u1-l1-a3', 1, 'SELECT nombre, precio FROM productos;', true),
  ('sql-u1-l1-a3-b', 'sql-u1-l1-a3', 2, 'SELECT nombre AND precio FROM productos;', false),
  ('sql-u1-l1-a3-c', 'sql-u1-l1-a3', 3, 'SELECT (nombre precio) FROM productos;', false),
  ('sql-u1-l1-a3-d', 'sql-u1-l1-a3', 4, 'SELECT * nombre, precio FROM productos;', false),
  ('sql-u1-l1-a4-a', 'sql-u1-l1-a4', 1, '//', false),
  ('sql-u1-l1-a4-b', 'sql-u1-l1-a4', 2, '--', true),
  ('sql-u1-l1-a4-c', 'sql-u1-l1-a4', 3, '#', false),
  ('sql-u1-l1-a4-d', 'sql-u1-l1-a4', 4, '<!--', false),
  ('sql-u1-l2-a1-a', 'sql-u1-l2-a1', 1, 'FILTER', false),
  ('sql-u1-l2-a1-b', 'sql-u1-l2-a1', 2, 'WHERE', true),
  ('sql-u1-l2-a1-c', 'sql-u1-l2-a1', 3, 'ORDER BY', false),
  ('sql-u1-l2-a1-d', 'sql-u1-l2-a1', 4, 'IF', false),
  ('sql-u1-l2-a2-a', 'sql-u1-l2-a2', 1, 'Borra los precios', false),
  ('sql-u1-l2-a2-b', 'sql-u1-l2-a2', 2, 'Ordena de menor a mayor precio', false),
  ('sql-u1-l2-a2-c', 'sql-u1-l2-a2', 3, 'Ordena de mayor a menor precio', true),
  ('sql-u1-l2-a2-d', 'sql-u1-l2-a2', 4, 'Filtra los precios negativos', false),
  ('sql-u1-l2-a3-a', 'sql-u1-l2-a3', 1, 'Las que se llaman exactamente Ma%', false),
  ('sql-u1-l2-a3-b', 'sql-u1-l2-a3', 2, 'Las que terminan en Ma', false),
  ('sql-u1-l2-a3-c', 'sql-u1-l2-a3', 3, 'Las que contienen un %', false),
  ('sql-u1-l2-a3-d', 'sql-u1-l2-a3', 4, 'Las que empiezan con Ma, como Marta o Mateo', true),
  ('sql-u1-l2-a4-a', 'sql-u1-l2-a4', 1, 'SELECT * FROM alumnos WHERE edad > 15 ORDER BY edad;', true),
  ('sql-u1-l2-a4-b', 'sql-u1-l2-a4', 2, 'SELECT * FROM alumnos ORDER BY edad WHERE edad > 15;', false),
  ('sql-u1-l2-a4-c', 'sql-u1-l2-a4', 3, 'SELECT * WHERE edad > 15 FROM alumnos;', false),
  ('sql-u1-l2-a4-d', 'sql-u1-l2-a4', 4, 'FROM alumnos SELECT * WHERE edad > 15;', false),
  ('sql-u2-l1-a1-a', 'sql-u2-l1-a1', 1, 'WHERE', false),
  ('sql-u2-l1-a1-b', 'sql-u2-l1-a1', 2, 'USING TABLE', false),
  ('sql-u2-l1-a1-c', 'sql-u2-l1-a1', 3, 'WITH', false),
  ('sql-u2-l1-a1-d', 'sql-u2-l1-a1', 4, 'ON', true),
  ('sql-u2-l1-a2-a', 'sql-u2-l1-a2', 1, 'Solo las filas que tienen pareja en ambas tablas', true),
  ('sql-u2-l1-a2-b', 'sql-u2-l1-a2', 2, 'Todas las filas de las dos tablas', false),
  ('sql-u2-l1-a2-c', 'sql-u2-l1-a2', 3, 'Solo la primera tabla', false),
  ('sql-u2-l1-a2-d', 'sql-u2-l1-a2', 4, 'Las filas sin pareja', false),
  ('sql-u2-l1-a3-a', 'sql-u2-l1-a3', 1, 'INNER JOIN', false),
  ('sql-u2-l1-a3-b', 'sql-u2-l1-a3', 2, 'LEFT JOIN', true),
  ('sql-u2-l1-a3-c', 'sql-u2-l1-a3', 3, 'CROSS JOIN', false),
  ('sql-u2-l1-a3-d', 'sql-u2-l1-a3', 4, 'Ninguno', false),
  ('sql-u2-l1-a4-a', 'sql-u2-l1-a4', 1, 'Una contraseña de la base', false),
  ('sql-u2-l1-a4-b', 'sql-u2-l1-a4', 2, 'La primera columna de cada tabla', false),
  ('sql-u2-l1-a4-c', 'sql-u2-l1-a4', 3, 'Una columna que apunta a la clave primaria de otra tabla', true),
  ('sql-u2-l1-a4-d', 'sql-u2-l1-a4', 4, 'Un índice para ordenar', false),
  ('sql-u2-l2-a1-a', 'sql-u2-l2-a1', 1, 'SUM()', false),
  ('sql-u2-l2-a1-b', 'sql-u2-l2-a1', 2, 'TOTAL()', false),
  ('sql-u2-l2-a1-c', 'sql-u2-l2-a1', 3, 'COUNT()', true),
  ('sql-u2-l2-a1-d', 'sql-u2-l2-a1', 4, 'AVG()', false),
  ('sql-u2-l2-a2-a', 'sql-u2-l2-a2', 1, 'La nota más alta', false),
  ('sql-u2-l2-a2-b', 'sql-u2-l2-a2', 2, 'La cantidad de exámenes', false),
  ('sql-u2-l2-a2-c', 'sql-u2-l2-a2', 3, 'Todas las notas', false),
  ('sql-u2-l2-a2-d', 'sql-u2-l2-a2', 4, 'El promedio de las notas', true),
  ('sql-u2-l2-a3-a', 'sql-u2-l2-a3', 1, 'Para calcular los agregados por cada curso', true),
  ('sql-u2-l2-a3-b', 'sql-u2-l2-a3', 2, 'Para ordenar por curso', false),
  ('sql-u2-l2-a3-c', 'sql-u2-l2-a3', 3, 'Para borrar cursos repetidos', false),
  ('sql-u2-l2-a3-d', 'sql-u2-l2-a3', 4, 'Para unir con la tabla cursos', false),
  ('sql-u2-l2-a4-a', 'sql-u2-l2-a4', 1, 'WHERE', false),
  ('sql-u2-l2-a4-b', 'sql-u2-l2-a4', 2, 'HAVING', true),
  ('sql-u2-l2-a4-c', 'sql-u2-l2-a4', 3, 'ORDER BY', false),
  ('sql-u2-l2-a4-d', 'sql-u2-l2-a4', 4, 'LIMIT', false),
  ('java-u1-l1-a1-a', 'java-u1-l1-a1', 1, 'start()', false),
  ('java-u1-l1-a1-b', 'java-u1-l1-a1', 2, 'run()', false),
  ('java-u1-l1-a1-c', 'java-u1-l1-a1', 3, 'main()', true),
  ('java-u1-l1-a1-d', 'java-u1-l1-a1', 4, 'init()', false),
  ('java-u1-l1-a2-a', 'java-u1-l1-a2', 1, 'print("Hola");', false),
  ('java-u1-l1-a2-b', 'java-u1-l1-a2', 2, 'console.log("Hola");', false),
  ('java-u1-l1-a2-c', 'java-u1-l1-a2', 3, 'echo "Hola";', false),
  ('java-u1-l1-a2-d', 'java-u1-l1-a2', 4, 'System.out.println("Hola");', true),
  ('java-u1-l1-a3-a', 'java-u1-l1-a3', 1, 'Con punto y coma', true),
  ('java-u1-l1-a3-b', 'java-u1-l1-a3', 2, 'Con un salto de línea', false),
  ('java-u1-l1-a3-c', 'java-u1-l1-a3', 3, 'Con dos puntos', false),
  ('java-u1-l1-a3-d', 'java-u1-l1-a3', 4, 'Con la palabra end', false),
  ('java-u1-l1-a4-a', 'java-u1-l1-a4', 1, 'Juego.txt', false),
  ('java-u1-l1-a4-b', 'java-u1-l1-a4', 2, 'Juego.java', true),
  ('java-u1-l1-a4-c', 'java-u1-l1-a4', 3, 'Juego.class', false),
  ('java-u1-l1-a4-d', 'java-u1-l1-a4', 4, 'main.java', false),
  ('java-u1-l2-a1-a', 'java-u1-l2-a1', 1, 'edad = 16;', false),
  ('java-u1-l2-a1-b', 'java-u1-l2-a1', 2, 'int edad = 16;', true),
  ('java-u1-l2-a1-c', 'java-u1-l2-a1', 3, 'let edad = 16;', false),
  ('java-u1-l2-a1-d', 'java-u1-l2-a1', 4, 'integer edad := 16;', false),
  ('java-u1-l2-a2-a', 'java-u1-l2-a2', 1, 'int', false),
  ('java-u1-l2-a2-b', 'java-u1-l2-a2', 2, 'char', false),
  ('java-u1-l2-a2-c', 'java-u1-l2-a2', 3, 'double', true),
  ('java-u1-l2-a2-d', 'java-u1-l2-a2', 4, 'boolean', false),
  ('java-u1-l2-a3-a', 'java-u1-l2-a3', 1, '3.5', false),
  ('java-u1-l2-a3-b', 'java-u1-l2-a3', 2, 'Un error', false),
  ('java-u1-l2-a3-c', 'java-u1-l2-a3', 3, '4', false),
  ('java-u1-l2-a3-d', 'java-u1-l2-a3', 4, '3', true),
  ('java-u1-l2-a4-a', 'java-u1-l2-a4', 1, 'Porque es una clase, no un tipo primitivo', true),
  ('java-u1-l2-a4-b', 'java-u1-l2-a4', 2, 'Es un error común', false),
  ('java-u1-l2-a4-c', 'java-u1-l2-a4', 3, 'Porque es una constante', false),
  ('java-u1-l2-a4-d', 'java-u1-l2-a4', 4, 'Da lo mismo', false),
  ('java-u2-l1-a1-a', 'java-u2-l1-a1', 1, 'create', false),
  ('java-u2-l1-a1-b', 'java-u2-l1-a1', 2, 'object', false),
  ('java-u2-l1-a1-c', 'java-u2-l1-a1', 3, 'make', false),
  ('java-u2-l1-a1-d', 'java-u2-l1-a1', 4, 'new', true),
  ('java-u2-l1-a2-a', 'java-u2-l1-a2', 1, 'Un molde que define atributos y métodos', true),
  ('java-u2-l1-a2-b', 'java-u2-l1-a2', 2, 'Una variable global', false),
  ('java-u2-l1-a2-c', 'java-u2-l1-a2', 3, 'Un objeto ya creado', false),
  ('java-u2-l1-a2-d', 'java-u2-l1-a2', 4, 'Un archivo de texto', false),
  ('java-u2-l1-a3-a', 'java-u2-l1-a3', 1, 'Toby', false),
  ('java-u2-l1-a3-b', 'java-u2-l1-a3', 2, 'Luna', true),
  ('java-u2-l1-a3-c', 'java-u2-l1-a3', 3, 'null', false),
  ('java-u2-l1-a3-d', 'java-u2-l1-a3', 4, 'Luna Toby', false),
  ('java-u2-l1-a4-a', 'java-u2-l1-a4', 1, 'Lo vuelve constante', false),
  ('java-u2-l1-a4-b', 'java-u2-l1-a4', 2, 'Lo comparte entre todas las clases', false),
  ('java-u2-l1-a4-c', 'java-u2-l1-a4', 3, 'Solo se puede usar dentro de su clase', true),
  ('java-u2-l1-a4-d', 'java-u2-l1-a4', 4, 'Lo borra al terminar', false),
  ('java-u2-l2-a1-a', 'java-u2-l2-a1', 1, 'constructor', false),
  ('java-u2-l2-a1-b', 'java-u2-l2-a1', 2, 'init', false),
  ('java-u2-l2-a1-c', 'java-u2-l2-a1', 3, 'Auto', true),
  ('java-u2-l2-a1-d', 'java-u2-l2-a1', 4, 'new', false),
  ('java-u2-l2-a2-a', 'java-u2-l2-a2', 1, 'Que es estático', false),
  ('java-u2-l2-a2-b', 'java-u2-l2-a2', 2, 'Que es privado', false),
  ('java-u2-l2-a2-c', 'java-u2-l2-a2', 3, 'Que no recibe parámetros', false),
  ('java-u2-l2-a2-d', 'java-u2-l2-a2', 4, 'Que no devuelve nada', true),
  ('java-u2-l2-a3-a', 'java-u2-l2-a3', 1, 'Al objeto que se está creando', true),
  ('java-u2-l2-a3-b', 'java-u2-l2-a3', 2, 'A la clase padre', false),
  ('java-u2-l2-a3-c', 'java-u2-l2-a3', 3, 'Al método main', false),
  ('java-u2-l2-a3-d', 'java-u2-l2-a3', 4, 'A la última variable usada', false),
  ('java-u2-l2-a4-a', 'java-u2-l2-a4', 1, '7.0', false),
  ('java-u2-l2-a4-b', 'java-u2-l2-a4', 2, '10.0', true),
  ('java-u2-l2-a4-c', 'java-u2-l2-a4', 3, '2.0', false),
  ('java-u2-l2-a4-d', 'java-u2-l2-a4', 4, 'Un error', false),
  ('cpp-u1-l1-a1-a', 'cpp-u1-l1-a1', 1, '<stdio>', false),
  ('cpp-u1-l1-a1-b', 'cpp-u1-l1-a1', 2, '<iostream>', true),
  ('cpp-u1-l1-a1-c', 'cpp-u1-l1-a1', 3, '<console>', false),
  ('cpp-u1-l1-a1-d', 'cpp-u1-l1-a1', 4, '<string>', false),
  ('cpp-u1-l1-a2-a', 'cpp-u1-l1-a2', 1, '>>', false),
  ('cpp-u1-l1-a2-b', 'cpp-u1-l1-a2', 2, '->', false),
  ('cpp-u1-l1-a2-c', 'cpp-u1-l1-a2', 3, '<<', true),
  ('cpp-u1-l1-a2-d', 'cpp-u1-l1-a2', 4, '+=', false),
  ('cpp-u1-l1-a3-a', 'cpp-u1-l1-a3', 1, 'start()', false),
  ('cpp-u1-l1-a3-b', 'cpp-u1-l1-a3', 2, 'Main()', false),
  ('cpp-u1-l1-a3-c', 'cpp-u1-l1-a3', 3, 'program()', false),
  ('cpp-u1-l1-a3-d', 'cpp-u1-l1-a3', 4, 'int main()', true),
  ('cpp-u1-l1-a4-a', 'cpp-u1-l1-a4', 1, '5', true),
  ('cpp-u1-l1-a4-b', 'cpp-u1-l1-a4', 2, '23', false),
  ('cpp-u1-l1-a4-c', 'cpp-u1-l1-a4', 3, '2 + 3', false),
  ('cpp-u1-l1-a4-d', 'cpp-u1-l1-a4', 4, 'Un error', false),
  ('cpp-u1-l2-a1-a', 'cpp-u1-l2-a1', 1, 'const', true),
  ('cpp-u1-l2-a1-b', 'cpp-u1-l2-a1', 2, 'final', false),
  ('cpp-u1-l2-a1-c', 'cpp-u1-l2-a1', 3, 'static', false),
  ('cpp-u1-l2-a1-d', 'cpp-u1-l2-a1', 4, 'fixed', false),
  ('cpp-u1-l2-a2-a', 'cpp-u1-l2-a2', 1, 'std::cout >> n;', false),
  ('cpp-u1-l2-a2-b', 'cpp-u1-l2-a2', 2, 'std::cin >> n;', true),
  ('cpp-u1-l2-a2-c', 'cpp-u1-l2-a2', 3, 'std::cin << n;', false),
  ('cpp-u1-l2-a2-d', 'cpp-u1-l2-a2', 4, 'input(n);', false),
  ('cpp-u1-l2-a3-a', 'cpp-u1-l2-a3', 1, 'Siempre 0', false),
  ('cpp-u1-l2-a3-b', 'cpp-u1-l2-a3', 2, 'null', false),
  ('cpp-u1-l2-a3-c', 'cpp-u1-l2-a3', 3, 'Un valor indeterminado (basura)', true),
  ('cpp-u1-l2-a3-d', 'cpp-u1-l2-a3', 4, 'Da error al compilar', false),
  ('cpp-u1-l2-a4-a', 'cpp-u1-l2-a4', 1, 'char', false),
  ('cpp-u1-l2-a4-b', 'cpp-u1-l2-a4', 2, 'int', false),
  ('cpp-u1-l2-a4-c', 'cpp-u1-l2-a4', 3, 'text', false),
  ('cpp-u1-l2-a4-d', 'cpp-u1-l2-a4', 4, 'std::string', true),
  ('cpp-u2-l1-a1-a', 'cpp-u2-l1-a1', 1, 'int* r = x;', false),
  ('cpp-u2-l1-a1-b', 'cpp-u2-l1-a1', 2, 'ref int r = x;', false),
  ('cpp-u2-l1-a1-c', 'cpp-u2-l1-a1', 3, 'int& r = x;', true),
  ('cpp-u2-l1-a1-d', 'cpp-u2-l1-a1', 4, 'int r = &x;', false),
  ('cpp-u2-l1-a2-a', 'cpp-u2-l1-a2', 1, '10', false),
  ('cpp-u2-l1-a2-b', 'cpp-u2-l1-a2', 2, 'Un error', false),
  ('cpp-u2-l1-a2-c', 'cpp-u2-l1-a2', 3, '30', false),
  ('cpp-u2-l1-a2-d', 'cpp-u2-l1-a2', 4, '20', true),
  ('cpp-u2-l1-a3-a', 'cpp-u2-l1-a3', 1, 'No cambia: la función trabaja con una copia', true),
  ('cpp-u2-l1-a3-b', 'cpp-u2-l1-a3', 2, 'Aumenta en 1', false),
  ('cpp-u2-l1-a3-c', 'cpp-u2-l1-a3', 3, 'Se borra', false),
  ('cpp-u2-l1-a3-d', 'cpp-u2-l1-a3', 4, 'Da error', false),
  ('cpp-u2-l1-a4-a', 'cpp-u2-l1-a4', 1, 'Pueden quedar sin inicializar', false),
  ('cpp-u2-l1-a4-b', 'cpp-u2-l1-a4', 2, 'Hay que inicializarlas al declararlas', true),
  ('cpp-u2-l1-a4-c', 'cpp-u2-l1-a4', 3, 'Pueden cambiar a qué variable se refieren', false),
  ('cpp-u2-l1-a4-d', 'cpp-u2-l1-a4', 4, 'Ocupan siempre 8 bytes', false),
  ('cpp-u2-l2-a1-a', 'cpp-u2-l2-a1', 1, 'Un número entero cualquiera', false),
  ('cpp-u2-l2-a1-b', 'cpp-u2-l2-a1', 2, 'Una dirección de memoria', true),
  ('cpp-u2-l2-a1-c', 'cpp-u2-l2-a1', 3, 'Una copia de otra variable', false),
  ('cpp-u2-l2-a1-d', 'cpp-u2-l2-a1', 4, 'Un texto', false),
  ('cpp-u2-l2-a2-a', 'cpp-u2-l2-a2', 1, '*x', false),
  ('cpp-u2-l2-a2-b', 'cpp-u2-l2-a2', 2, '->x', false),
  ('cpp-u2-l2-a2-c', 'cpp-u2-l2-a2', 3, '&x', true),
  ('cpp-u2-l2-a2-d', 'cpp-u2-l2-a2', 4, '#x', false),
  ('cpp-u2-l2-a3-a', 'cpp-u2-l2-a3', 1, '3', false),
  ('cpp-u2-l2-a3-b', 'cpp-u2-l2-a3', 2, '4', false),
  ('cpp-u2-l2-a3-c', 'cpp-u2-l2-a3', 3, 'La dirección de a', false),
  ('cpp-u2-l2-a3-d', 'cpp-u2-l2-a3', 4, '7', true),
  ('cpp-u2-l2-a4-a', 'cpp-u2-l2-a4', 1, 'nullptr', true),
  ('cpp-u2-l2-a4-b', 'cpp-u2-l2-a4', 2, 'void', false),
  ('cpp-u2-l2-a4-c', 'cpp-u2-l2-a4', 3, '0x00', false),
  ('cpp-u2-l2-a4-d', 'cpp-u2-l2-a4', 4, 'empty', false),
  ('py-u3-l1-a1-a', 'py-u3-l1-a1', 1, '10', false),
  ('py-u3-l1-a1-b', 'py-u3-l1-a1', 2, '20', true),
  ('py-u3-l1-a1-c', 'py-u3-l1-a1', 3, '30', false),
  ('py-u3-l1-a1-d', 'py-u3-l1-a1', 4, 'Un error', false),
  ('py-u3-l1-a2-a', 'py-u3-l1-a2', 1, 'push()', false),
  ('py-u3-l1-a2-b', 'py-u3-l1-a2', 2, 'add()', false),
  ('py-u3-l1-a2-c', 'py-u3-l1-a2', 3, 'append()', true),
  ('py-u3-l1-a2-d', 'py-u3-l1-a2', 4, 'insert_end()', false),
  ('py-u3-l1-a3-a', 'py-u3-l1-a3', 1, '"rojo"', false),
  ('py-u3-l1-a3-b', 'py-u3-l1-a3', 2, '"verde"', false),
  ('py-u3-l1-a3-c', 'py-u3-l1-a3', 3, 'Un error', false),
  ('py-u3-l1-a3-d', 'py-u3-l1-a3', 4, '"azul"', true),
  ('py-u3-l1-a4-a', 'py-u3-l1-a4', 1, 'True', true),
  ('py-u3-l1-a4-b', 'py-u3-l1-a4', 2, 'False', false),
  ('py-u3-l1-a4-c', 'py-u3-l1-a4', 3, '1', false),
  ('py-u3-l1-a4-d', 'py-u3-l1-a4', 4, '"uva"', false),
  ('py-u3-l2-a1-a', 'py-u3-l2-a1', 1, '1200', true),
  ('py-u3-l2-a1-b', 'py-u3-l2-a1', 2, '900', false),
  ('py-u3-l2-a1-c', 'py-u3-l2-a1', 3, '"leche"', false),
  ('py-u3-l2-a1-d', 'py-u3-l2-a1', 4, 'Un error', false),
  ('py-u3-l2-a2-a', 'py-u3-l2-a2', 1, 'Devuelve None', false),
  ('py-u3-l2-a2-b', 'py-u3-l2-a2', 2, 'Da un error (KeyError)', true),
  ('py-u3-l2-a2-c', 'py-u3-l2-a2', 3, 'Devuelve 0', false),
  ('py-u3-l2-a2-d', 'py-u3-l2-a2', 4, 'Crea la clave vacía', false),
  ('py-u3-l2-a3-a', 'py-u3-l2-a3', 1, 'auto.append("color", "rojo")', false),
  ('py-u3-l2-a3-b', 'py-u3-l2-a3', 2, 'auto.color = "rojo"', false),
  ('py-u3-l2-a3-c', 'py-u3-l2-a3', 3, 'auto["color"] = "rojo"', true),
  ('py-u3-l2-a3-d', 'py-u3-l2-a3', 4, 'auto + {"color": "rojo"}', false),
  ('py-u3-l2-a4-a', 'py-u3-l2-a4', 1, '1', false),
  ('py-u3-l2-a4-b', 'py-u3-l2-a4', 2, '6', false),
  ('py-u3-l2-a4-c', 'py-u3-l2-a4', 3, '2', false),
  ('py-u3-l2-a4-d', 'py-u3-l2-a4', 4, '3', true),
  ('py-u4-l1-a1-a', 'py-u4-l1-a1', 1, 'function', false),
  ('py-u4-l1-a1-b', 'py-u4-l1-a1', 2, 'func', false),
  ('py-u4-l1-a1-c', 'py-u4-l1-a1', 3, 'def', true),
  ('py-u4-l1-a1-d', 'py-u4-l1-a1', 4, 'fn', false),
  ('py-u4-l1-a2-a', 'py-u4-l1-a2', 1, '8', false),
  ('py-u4-l1-a2-b', 'py-u4-l1-a2', 2, 'None', false),
  ('py-u4-l1-a2-c', 'py-u4-l1-a2', 3, '35', false),
  ('py-u4-l1-a2-d', 'py-u4-l1-a2', 4, '15', true),
  ('py-u4-l1-a3-a', 'py-u4-l1-a3', 1, 'None', true),
  ('py-u4-l1-a3-b', 'py-u4-l1-a3', 2, 'False', false),
  ('py-u4-l1-a3-c', 'py-u4-l1-a3', 3, '0', false),
  ('py-u4-l1-a3-d', 'py-u4-l1-a3', 4, 'Un error', false),
  ('py-u4-l1-a4-a', 'py-u4-l1-a4', 1, '6', false),
  ('py-u4-l1-a4-b', 'py-u4-l1-a4', 2, '9', true),
  ('py-u4-l1-a4-c', 'py-u4-l1-a4', 3, '3', false),
  ('py-u4-l1-a4-d', 'py-u4-l1-a4', 4, '27', false),
  ('py-u4-l2-a1-a', 'py-u4-l2-a1', 1, 'Funciona igual', false),
  ('py-u4-l2-a1-b', 'py-u4-l2-a1', 2, 'Da error: solo existe dentro de la función', true),
  ('py-u4-l2-a1-c', 'py-u4-l2-a1', 3, 'Vale 0', false),
  ('py-u4-l2-a1-d', 'py-u4-l2-a1', 4, 'Vale None', false),
  ('py-u4-l2-a2-a', 'py-u4-l2-a2', 1, '99', false),
  ('py-u4-l2-a2-b', 'py-u4-l2-a2', 2, 'None', false),
  ('py-u4-l2-a2-c', 'py-u4-l2-a2', 3, '10', true),
  ('py-u4-l2-a2-d', 'py-u4-l2-a2', 4, 'Un error', false),
  ('py-u4-l2-a3-a', 'py-u4-l2-a3', 1, 'Cambiar una variable global', false),
  ('py-u4-l2-a3-b', 'py-u4-l2-a3', 2, 'Usar print() adentro', false),
  ('py-u4-l2-a3-c', 'py-u4-l2-a3', 3, 'Guardarlo en un archivo', false),
  ('py-u4-l2-a3-d', 'py-u4-l2-a3', 4, 'Devolverlo con return', true),
  ('py-u4-l2-a4-a', 'py-u4-l2-a4', 1, 'calcular_promedio', true),
  ('py-u4-l2-a4-b', 'py-u4-l2-a4', 2, 'hacer', false),
  ('py-u4-l2-a4-c', 'py-u4-l2-a4', 3, 'f', false),
  ('py-u4-l2-a4-d', 'py-u4-l2-a4', 4, 'lista2', false),
  ('web-u3-l1-a1-a', 'web-u3-l1-a1', 1, 'flex: on', false),
  ('web-u3-l1-a1-b', 'web-u3-l1-a1', 2, 'position: flex', false),
  ('web-u3-l1-a1-c', 'web-u3-l1-a1', 3, 'display: flex', true),
  ('web-u3-l1-a1-d', 'web-u3-l1-a1', 4, 'layout: flex', false),
  ('web-u3-l1-a2-a', 'web-u3-l1-a2', 1, 'Uno debajo del otro', false),
  ('web-u3-l1-a2-b', 'web-u3-l1-a2', 2, 'Ocultos', false),
  ('web-u3-l1-a2-c', 'web-u3-l1-a2', 3, 'Superpuestos', false),
  ('web-u3-l1-a2-d', 'web-u3-l1-a2', 4, 'En una fila', true),
  ('web-u3-l1-a3-a', 'web-u3-l1-a3', 1, 'gap', true),
  ('web-u3-l1-a3-b', 'web-u3-l1-a3', 2, 'padding', false),
  ('web-u3-l1-a3-c', 'web-u3-l1-a3', 3, 'space', false),
  ('web-u3-l1-a3-d', 'web-u3-l1-a3', 4, 'border-spacing', false),
  ('web-u3-l1-a4-a', 'web-u3-l1-a4', 1, 'Ordena los hijos al revés', false),
  ('web-u3-l1-a4-b', 'web-u3-l1-a4', 2, 'Permite que los hijos bajen a otra línea si no entran', true),
  ('web-u3-l1-a4-c', 'web-u3-l1-a4', 3, 'Oculta los que no entran', false),
  ('web-u3-l1-a4-d', 'web-u3-l1-a4', 4, 'Los centra', false),
  ('web-u3-l2-a1-a', 'web-u3-l2-a1', 1, 'align-items', false),
  ('web-u3-l2-a1-b', 'web-u3-l2-a1', 2, 'justify-content', true),
  ('web-u3-l2-a1-c', 'web-u3-l2-a1', 3, 'text-align', false),
  ('web-u3-l2-a1-d', 'web-u3-l2-a1', 4, 'vertical-align', false),
  ('web-u3-l2-a2-a', 'web-u3-l2-a2', 1, 'center', false),
  ('web-u3-l2-a2-b', 'web-u3-l2-a2', 2, 'flex-end', false),
  ('web-u3-l2-a2-c', 'web-u3-l2-a2', 3, 'space-between', true),
  ('web-u3-l2-a2-d', 'web-u3-l2-a2', 4, 'stretch', false),
  ('web-u3-l2-a3-a', 'web-u3-l2-a3', 1, 'margin: center', false),
  ('web-u3-l2-a3-b', 'web-u3-l2-a3', 2, 'position: center', false),
  ('web-u3-l2-a3-c', 'web-u3-l2-a3', 3, 'text-align: center', false),
  ('web-u3-l2-a3-d', 'web-u3-l2-a3', 4, 'justify-content: center y align-items: center', true),
  ('web-u3-l2-a4-a', 'web-u3-l2-a4', 1, 'El eje vertical', true),
  ('web-u3-l2-a4-b', 'web-u3-l2-a4', 2, 'El eje horizontal', false),
  ('web-u3-l2-a4-c', 'web-u3-l2-a4', 3, 'Nada', false),
  ('web-u3-l2-a4-d', 'web-u3-l2-a4', 4, 'El texto', false),
  ('web-u4-l1-a1-a', 'web-u4-l1-a1', 1, 'Solo al imprimir', false),
  ('web-u4-l1-a1-b', 'web-u4-l1-a1', 2, 'En pantallas de más de 600 px', false),
  ('web-u4-l1-a1-c', 'web-u4-l1-a1', 3, 'Siempre', false),
  ('web-u4-l1-a1-d', 'web-u4-l1-a1', 4, 'En pantallas de 600 px o menos', true),
  ('web-u4-l1-a2-a', 'web-u4-l1-a2', 1, 'Empezar por el celular y agregar estilos para pantallas grandes', true),
  ('web-u4-l1-a2-b', 'web-u4-l1-a2', 2, 'Hacer solo la versión de celular', false),
  ('web-u4-l1-a2-c', 'web-u4-l1-a2', 3, 'Usar solo imágenes chicas', false),
  ('web-u4-l1-a2-d', 'web-u4-l1-a2', 4, 'Probar primero en una tablet', false),
  ('web-u4-l1-a3-a', 'web-u4-l1-a3', 1, '<meta charset="utf-8">', false),
  ('web-u4-l1-a3-b', 'web-u4-l1-a3', 2, '<meta name="viewport" content="width=device-width, initial-scale=1">', true),
  ('web-u4-l1-a3-c', 'web-u4-l1-a3', 3, '<link rel="mobile">', false),
  ('web-u4-l1-a3-d', 'web-u4-l1-a3', 4, '<body responsive>', false),
  ('web-u4-l1-a4-a', 'web-u4-l1-a4', 1, 'column', false),
  ('web-u4-l1-a4-b', 'web-u4-l1-a4', 2, 'Ninguna', false),
  ('web-u4-l1-a4-c', 'web-u4-l1-a4', 3, 'row', true),
  ('web-u4-l1-a4-d', 'web-u4-l1-a4', 4, 'Depende del navegador', false),
  ('web-u4-l2-a1-a', 'web-u4-l2-a1', 1, '2 px', false),
  ('web-u4-l2-a1-b', 'web-u4-l2-a1', 2, '16 px', false),
  ('web-u4-l2-a1-c', 'web-u4-l2-a1', 3, '32 px', true),
  ('web-u4-l2-a1-d', 'web-u4-l2-a1', 4, '18 px', false),
  ('web-u4-l2-a2-a', 'web-u4-l2-a2', 1, 'La agranda siempre al 100%', false),
  ('web-u4-l2-a2-b', 'web-u4-l2-a2', 2, 'La recorta', false),
  ('web-u4-l2-a2-c', 'web-u4-l2-a2', 3, 'La oculta en el celular', false),
  ('web-u4-l2-a2-d', 'web-u4-l2-a2', 4, 'Evita que sea más ancha que su contenedor', true),
  ('web-u4-l2-a3-a', 'web-u4-l2-a3', 1, 'A la mitad del ancho de la ventana', true),
  ('web-u4-l2-a3-b', 'web-u4-l2-a3', 2, 'A 50 px', false),
  ('web-u4-l2-a3-c', 'web-u4-l2-a3', 3, 'A la mitad del alto de la ventana', false),
  ('web-u4-l2-a3-d', 'web-u4-l2-a3', 4, 'Al 50% del contenedor', false),
  ('web-u4-l2-a4-a', 'web-u4-l2-a4', 1, 'Para que ocupe toda la pantalla', false),
  ('web-u4-l2-a4-b', 'web-u4-l2-a4', 2, 'Para mantener su proporción', true),
  ('web-u4-l2-a4-c', 'web-u4-l2-a4', 3, 'Para darle un borde', false),
  ('web-u4-l2-a4-d', 'web-u4-l2-a4', 4, 'Para centrarla', false),
  ('sql-u3-l1-a1-a', 'sql-u3-l1-a1', 1, 'INSERT INTO', true),
  ('sql-u3-l1-a1-b', 'sql-u3-l1-a1', 2, 'ADD ROW', false),
  ('sql-u3-l1-a1-c', 'sql-u3-l1-a1', 3, 'UPDATE', false),
  ('sql-u3-l1-a1-d', 'sql-u3-l1-a1', 4, 'CREATE ROW', false),
  ('sql-u3-l1-a2-a', 'sql-u3-l1-a2', 1, 'No hace nada', false),
  ('sql-u3-l1-a2-b', 'sql-u3-l1-a2', 2, 'Pone precio 0 en TODOS los productos', true),
  ('sql-u3-l1-a2-c', 'sql-u3-l1-a2', 3, 'Da error por falta de WHERE', false),
  ('sql-u3-l1-a2-d', 'sql-u3-l1-a2', 4, 'Cambia solo el primero', false),
  ('sql-u3-l1-a3-a', 'sql-u3-l1-a3', 1, 'INSERT alumnos (''Ana'', 16);', false),
  ('sql-u3-l1-a3-b', 'sql-u3-l1-a3', 2, 'INSERT INTO alumnos SET nombre = ''Ana'';', false),
  ('sql-u3-l1-a3-c', 'sql-u3-l1-a3', 3, 'INSERT INTO alumnos (nombre, edad) VALUES (''Ana'', 16);', true),
  ('sql-u3-l1-a3-d', 'sql-u3-l1-a3', 4, 'INSERT VALUES (''Ana'', 16) INTO alumnos;', false),
  ('sql-u3-l1-a4-a', 'sql-u3-l1-a4', 1, 'VALUES', false),
  ('sql-u3-l1-a4-b', 'sql-u3-l1-a4', 2, 'NEW', false),
  ('sql-u3-l1-a4-c', 'sql-u3-l1-a4', 3, 'TO', false),
  ('sql-u3-l1-a4-d', 'sql-u3-l1-a4', 4, 'SET', true),
  ('sql-u3-l2-a1-a', 'sql-u3-l2-a1', 1, 'Borra la tabla entera, con su estructura', false),
  ('sql-u3-l2-a1-b', 'sql-u3-l2-a1', 2, 'Borra la primera fila', false),
  ('sql-u3-l2-a1-c', 'sql-u3-l2-a1', 3, 'No hace nada', false),
  ('sql-u3-l2-a1-d', 'sql-u3-l2-a1', 4, 'Borra todas las filas', true),
  ('sql-u3-l2-a2-a', 'sql-u3-l2-a2', 1, 'COMMIT', true),
  ('sql-u3-l2-a2-b', 'sql-u3-l2-a2', 2, 'SAVE', false),
  ('sql-u3-l2-a2-c', 'sql-u3-l2-a2', 3, 'END', false),
  ('sql-u3-l2-a2-d', 'sql-u3-l2-a2', 4, 'ROLLBACK', false),
  ('sql-u3-l2-a3-a', 'sql-u3-l2-a3', 1, 'Para que las consultas sean más rápidas', false),
  ('sql-u3-l2-a3-b', 'sql-u3-l2-a3', 2, 'Para que varias instrucciones se apliquen todas o ninguna', true),
  ('sql-u3-l2-a3-c', 'sql-u3-l2-a3', 3, 'Para crear tablas', false),
  ('sql-u3-l2-a3-d', 'sql-u3-l2-a3', 4, 'Para ordenar resultados', false),
  ('sql-u3-l2-a4-a', 'sql-u3-l2-a4', 1, 'Repite la última consulta', false),
  ('sql-u3-l2-a4-b', 'sql-u3-l2-a4', 2, 'Borra la base', false),
  ('sql-u3-l2-a4-c', 'sql-u3-l2-a4', 3, 'Deshace los cambios desde el BEGIN', true),
  ('sql-u3-l2-a4-d', 'sql-u3-l2-a4', 4, 'Confirma los cambios', false),
  ('java-u3-l1-a1-a', 'java-u3-l1-a1', 1, 'extends', true),
  ('java-u3-l1-a1-b', 'java-u3-l1-a1', 2, 'implements', false),
  ('java-u3-l1-a1-c', 'java-u3-l1-a1', 3, 'inherits', false),
  ('java-u3-l1-a1-d', 'java-u3-l1-a1', 4, 'super', false),
  ('java-u3-l1-a2-a', 'java-u3-l1-a2', 1, 'Crea otro perro', false),
  ('java-u3-l1-a2-b', 'java-u3-l1-a2', 2, 'Llama al constructor de Animal', true),
  ('java-u3-l1-a2-c', 'java-u3-l1-a2', 3, 'Borra el nombre', false),
  ('java-u3-l1-a2-d', 'java-u3-l1-a2', 4, 'Llama a ladrar()', false),
  ('java-u3-l1-a3-a', 'java-u3-l1-a3', 1, 'Solo si es static', false),
  ('java-u3-l1-a3-b', 'java-u3-l1-a3', 2, 'No, hay que copiarlo', false),
  ('java-u3-l1-a3-c', 'java-u3-l1-a3', 3, 'Sí, lo hereda', true),
  ('java-u3-l1-a3-d', 'java-u3-l1-a3', 4, 'Solo si se llama super.comer()', false),
  ('java-u3-l1-a4-a', 'java-u3-l1-a4', 1, 'De ninguna', false),
  ('java-u3-l1-a4-b', 'java-u3-l1-a4', 2, 'De dos', false),
  ('java-u3-l1-a4-c', 'java-u3-l1-a4', 3, 'De las que quiera', false),
  ('java-u3-l1-a4-d', 'java-u3-l1-a4', 4, 'De una sola', true),
  ('java-u3-l2-a1-a', 'java-u3-l2-a1', 1, '...', false),
  ('java-u3-l2-a1-b', 'java-u3-l2-a1', 2, 'null', false),
  ('java-u3-l2-a1-c', 'java-u3-l2-a1', 3, 'Un error', false),
  ('java-u3-l2-a1-d', 'java-u3-l2-a1', 4, 'Miau', true),
  ('java-u3-l2-a2-a', 'java-u3-l2-a2', 1, 'Para que el compilador verifique que se sobrescribe un método del padre', true),
  ('java-u3-l2-a2-b', 'java-u3-l2-a2', 2, 'Para que el método sea más rápido', false),
  ('java-u3-l2-a2-c', 'java-u3-l2-a2', 3, 'Para hacer el método privado', false),
  ('java-u3-l2-a2-d', 'java-u3-l2-a2', 4, 'Para llamar al padre', false),
  ('java-u3-l2-a3-a', 'java-u3-l2-a3', 1, 'Gato g = new Animal();', false),
  ('java-u3-l2-a3-b', 'java-u3-l2-a3', 2, 'Animal a = new Gato();', true),
  ('java-u3-l2-a3-c', 'java-u3-l2-a3', 3, 'Gato g = Animal;', false),
  ('java-u3-l2-a3-d', 'java-u3-l2-a3', 4, 'Animal a = Gato();', false),
  ('java-u3-l2-a4-a', 'java-u3-l2-a4', 1, 'Tener muchas variables', false),
  ('java-u3-l2-a4-b', 'java-u3-l2-a4', 2, 'Copiar una clase', false),
  ('java-u3-l2-a4-c', 'java-u3-l2-a4', 3, 'Que un mismo llamado ejecute versiones distintas según el objeto', true),
  ('java-u3-l2-a4-d', 'java-u3-l2-a4', 4, 'Usar muchos constructores', false),
  ('java-u4-l1-a1-a', 'java-u4-l1-a1', 1, 'push()', false),
  ('java-u4-l1-a1-b', 'java-u4-l1-a1', 2, 'add()', true),
  ('java-u4-l1-a1-c', 'java-u4-l1-a1', 3, 'append()', false),
  ('java-u4-l1-a1-d', 'java-u4-l1-a1', 4, 'put()', false),
  ('java-u4-l1-a2-a', 'java-u4-l1-a2', 1, 'length', false),
  ('java-u4-l1-a2-b', 'java-u4-l1-a2', 2, 'length()', false),
  ('java-u4-l1-a2-c', 'java-u4-l1-a2', 3, 'size()', true),
  ('java-u4-l1-a2-d', 'java-u4-l1-a2', 4, 'count()', false),
  ('java-u4-l1-a3-a', 'java-u4-l1-a3', 1, 'El ArrayList no se puede recorrer', false),
  ('java-u4-l1-a3-b', 'java-u4-l1-a3', 2, 'El array solo guarda texto', false),
  ('java-u4-l1-a3-c', 'java-u4-l1-a3', 3, 'No hay diferencia', false),
  ('java-u4-l1-a3-d', 'java-u4-l1-a3', 4, 'El ArrayList puede crecer; el array tiene tamaño fijo', true),
  ('java-u4-l1-a4-a', 'java-u4-l1-a4', 1, 'ArrayList<Integer> n = new ArrayList<>();', true),
  ('java-u4-l1-a4-b', 'java-u4-l1-a4', 2, 'ArrayList<int> n = new ArrayList<>();', false),
  ('java-u4-l1-a4-c', 'java-u4-l1-a4', 3, 'ArrayList n<int> = new ArrayList();', false),
  ('java-u4-l1-a4-d', 'java-u4-l1-a4', 4, 'int ArrayList n = new ArrayList<>();', false),
  ('java-u4-l2-a1-a', 'java-u4-l2-a1', 1, 'put()', true),
  ('java-u4-l2-a1-b', 'java-u4-l2-a1', 2, 'add()', false),
  ('java-u4-l2-a1-c', 'java-u4-l2-a1', 3, 'set()', false),
  ('java-u4-l2-a1-d', 'java-u4-l2-a1', 4, 'insert()', false),
  ('java-u4-l2-a2-a', 'java-u4-l2-a2', 1, '0', false),
  ('java-u4-l2-a2-b', 'java-u4-l2-a2', 2, 'null', true),
  ('java-u4-l2-a2-c', 'java-u4-l2-a2', 3, 'Un error', false),
  ('java-u4-l2-a2-d', 'java-u4-l2-a2', 4, '""', false),
  ('java-u4-l2-a3-a', 'java-u4-l2-a3', 1, '1', false),
  ('java-u4-l2-a3-b', 'java-u4-l2-a3', 2, '6', false),
  ('java-u4-l2-a3-c', 'java-u4-l2-a3', 3, '5', true),
  ('java-u4-l2-a3-d', 'java-u4-l2-a3', 4, '[1, 5]', false),
  ('java-u4-l2-a4-a', 'java-u4-l2-a4', 1, 'keys()', false),
  ('java-u4-l2-a4-b', 'java-u4-l2-a4', 2, 'values()', false),
  ('java-u4-l2-a4-c', 'java-u4-l2-a4', 3, 'getKeys()', false),
  ('java-u4-l2-a4-d', 'java-u4-l2-a4', 4, 'keySet()', true),
  ('cpp-u3-l1-a1-a', 'cpp-u3-l1-a1', 1, '::', false),
  ('cpp-u3-l1-a1-b', 'cpp-u3-l1-a1', 2, '#', false),
  ('cpp-u3-l1-a1-c', 'cpp-u3-l1-a1', 3, '->', false),
  ('cpp-u3-l1-a1-d', 'cpp-u3-l1-a1', 4, '.', true),
  ('cpp-u3-l1-a2-a', 'cpp-u3-l1-a2', 1, 'El punto y coma final', true),
  ('cpp-u3-l1-a2-b', 'cpp-u3-l1-a2', 2, 'Las llaves', false),
  ('cpp-u3-l1-a2-c', 'cpp-u3-l1-a2', 3, 'La palabra class', false),
  ('cpp-u3-l1-a2-d', 'cpp-u3-l1-a2', 4, 'Un constructor', false),
  ('cpp-u3-l1-a3-a', 'cpp-u3-l1-a3', 1, 'q.x', false),
  ('cpp-u3-l1-a3-b', 'cpp-u3-l1-a3', 2, 'q->x', true),
  ('cpp-u3-l1-a3-c', 'cpp-u3-l1-a3', 3, 'q::x', false),
  ('cpp-u3-l1-a3-d', 'cpp-u3-l1-a3', 4, '&q.x', false),
  ('cpp-u3-l1-a4-a', 'cpp-u3-l1-a4', 1, '27', false),
  ('cpp-u3-l1-a4-b', 'cpp-u3-l1-a4', 2, '2', false),
  ('cpp-u3-l1-a4-c', 'cpp-u3-l1-a4', 3, '9', true),
  ('cpp-u3-l1-a4-d', 'cpp-u3-l1-a4', 4, '7', false),
  ('cpp-u3-l2-a1-a', 'cpp-u3-l2-a1', 1, 'public', false),
  ('cpp-u3-l2-a1-b', 'cpp-u3-l2-a1', 2, 'protected', false),
  ('cpp-u3-l2-a1-c', 'cpp-u3-l2-a1', 3, 'private', true),
  ('cpp-u3-l2-a1-d', 'cpp-u3-l2-a1', 4, 'static', false),
  ('cpp-u3-l2-a2-a', 'cpp-u3-l2-a2', 1, 'delete Cuenta()', false),
  ('cpp-u3-l2-a2-b', 'cpp-u3-l2-a2', 2, '!Cuenta()', false),
  ('cpp-u3-l2-a2-c', 'cpp-u3-l2-a2', 3, 'Cuenta_destroy()', false),
  ('cpp-u3-l2-a2-d', 'cpp-u3-l2-a2', 4, '~Cuenta()', true),
  ('cpp-u3-l2-a3-a', 'cpp-u3-l2-a3', 1, 'Al crear el objeto', true),
  ('cpp-u3-l2-a3-b', 'cpp-u3-l2-a3', 2, 'Al terminar el programa', false),
  ('cpp-u3-l2-a3-c', 'cpp-u3-l2-a3', 3, 'Al llamar a cualquier método', false),
  ('cpp-u3-l2-a3-d', 'cpp-u3-l2-a3', 4, 'Nunca solo', false),
  ('cpp-u3-l2-a4-a', 'cpp-u3-l2-a4', 1, 'c.depositar(50);', false),
  ('cpp-u3-l2-a4-b', 'cpp-u3-l2-a4', 2, 'c.saldo = 500;', true),
  ('cpp-u3-l2-a4-c', 'cpp-u3-l2-a4', 3, 'c.verSaldo();', false),
  ('cpp-u3-l2-a4-d', 'cpp-u3-l2-a4', 4, 'Ninguna', false),
  ('cpp-u4-l1-a1-a', 'cpp-u4-l1-a1', 1, 'delete', true),
  ('cpp-u4-l1-a1-b', 'cpp-u4-l1-a1', 2, 'free', false),
  ('cpp-u4-l1-a1-c', 'cpp-u4-l1-a1', 3, 'remove', false),
  ('cpp-u4-l1-a1-d', 'cpp-u4-l1-a1', 4, 'Se libera sola', false),
  ('cpp-u4-l1-a2-a', 'cpp-u4-l1-a2', 1, 'delete v;', false),
  ('cpp-u4-l1-a2-b', 'cpp-u4-l1-a2', 2, 'delete[] v;', true),
  ('cpp-u4-l1-a2-c', 'cpp-u4-l1-a2', 3, 'free(v);', false),
  ('cpp-u4-l1-a2-d', 'cpp-u4-l1-a2', 4, 'v.clear();', false),
  ('cpp-u4-l1-a3-a', 'cpp-u4-l1-a3', 1, 'Leer una variable sin inicializar', false),
  ('cpp-u4-l1-a3-b', 'cpp-u4-l1-a3', 2, 'Un error de sintaxis', false),
  ('cpp-u4-l1-a3-c', 'cpp-u4-l1-a3', 3, 'Memoria pedida que nunca se libera', true),
  ('cpp-u4-l1-a3-d', 'cpp-u4-l1-a3', 4, 'Usar muchas variables', false),
  ('cpp-u4-l1-a4-a', 'cpp-u4-l1-a4', 1, 'En la pila (stack)', false),
  ('cpp-u4-l1-a4-b', 'cpp-u4-l1-a4', 2, 'En el procesador', false),
  ('cpp-u4-l1-a4-c', 'cpp-u4-l1-a4', 3, 'En el disco', false),
  ('cpp-u4-l1-a4-d', 'cpp-u4-l1-a4', 4, 'En el montón (heap)', true),
  ('cpp-u4-l2-a1-a', 'cpp-u4-l2-a1', 1, 'Es más rápido que cualquier variable', false),
  ('cpp-u4-l2-a1-b', 'cpp-u4-l2-a1', 2, 'No necesita incluir nada', false),
  ('cpp-u4-l2-a1-c', 'cpp-u4-l2-a1', 3, 'Puede apuntar a dos lugares a la vez', false),
  ('cpp-u4-l2-a1-d', 'cpp-u4-l2-a1', 4, 'Libera la memoria automáticamente', true),
  ('cpp-u4-l2-a2-a', 'cpp-u4-l2-a2', 1, 'std::unique_ptr', true),
  ('cpp-u4-l2-a2-b', 'cpp-u4-l2-a2', 2, 'std::shared_ptr', false),
  ('cpp-u4-l2-a2-c', 'cpp-u4-l2-a2', 3, 'std::auto', false),
  ('cpp-u4-l2-a2-d', 'cpp-u4-l2-a2', 4, 'int*', false),
  ('cpp-u4-l2-a3-a', 'cpp-u4-l2-a3', 1, '1', false),
  ('cpp-u4-l2-a3-b', 'cpp-u4-l2-a3', 2, '2', true),
  ('cpp-u4-l2-a3-c', 'cpp-u4-l2-a3', 3, '7', false),
  ('cpp-u4-l2-a3-d', 'cpp-u4-l2-a3', 4, '0', false),
  ('cpp-u4-l2-a4-a', 'cpp-u4-l2-a4', 1, '<iostream>', false),
  ('cpp-u4-l2-a4-b', 'cpp-u4-l2-a4', 2, '<pointer>', false),
  ('cpp-u4-l2-a4-c', 'cpp-u4-l2-a4', 3, '<memory>', true),
  ('cpp-u4-l2-a4-d', 'cpp-u4-l2-a4', 4, '<smart>', false) on conflict (id) do update set
  pregunta_id = excluded.pregunta_id,
  orden = excluded.orden,
  texto = excluded.texto,
  es_correcta = excluded.es_correcta;

commit;
