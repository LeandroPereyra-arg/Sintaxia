-- ===========================================================================
--  Sintaxia - Carga inicial del contenido
--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)
-- ---------------------------------------------------------------------------
--  ARCHIVO GENERADO: no editarlo a mano.
--  Se regenera con  npm run supabase:datos  a partir de src/data/.
--
--  Se ejecuta despues de 01-esquema.sql. Vuelve a dejar el contenido como
--  estaba: borra lo que haya y lo inserta de nuevo, todo en una transaccion.
-- ===========================================================================

begin;

-- El borrado en cascada de cursos arrastra unidades, lecciones, preguntas y opciones.
delete from public.cursos;

-- ---------------------------------------------------------------------------
-- Cursos (6)
-- ---------------------------------------------------------------------------
insert into public.cursos
  (id, nombre, descripcion, nivel, icono, color, color_texto, estado,
   requisito, horas_estimadas, unidades_previstas, lecciones_previstas, etiquetas, orden)
values
  ('javascript', 'JavaScript', 'El lenguaje de la web. Aprende variables, condicionales, bucles, funciones y como darle vida a una pagina.', 'Principiante', 'JS', '#f7df1e', '#1f2933', 'disponible', null, 12, 6, 14, array['Web', 'Front-end', 'Back-end'], 1),
  ('python', 'Python', 'Sintaxis simple y legible. Ideal para dar tus primeros pasos, automatizar tareas y entrar al mundo de los datos.', 'Principiante', 'Py', '#3776ab', '#ffffff', 'proximamente', null, 13, 6, 15, array['Datos', 'Automatizacion'], 2),
  ('html-css', 'HTML y CSS', 'La estructura y el diseno de cualquier sitio web. Etiquetas, selectores, cajas, flexbox y diseno responsivo.', 'Principiante', '</>', '#e34f26', '#ffffff', 'proximamente', null, 9, 5, 12, array['Web', 'Diseno'], 3),
  ('sql', 'SQL', 'Consulta y modifica bases de datos relacionales. SELECT, filtros, ordenamientos, joins y agrupaciones.', 'Intermedio', 'DB', '#00758f', '#ffffff', 'proximamente', null, 8, 5, 11, array['Datos', 'Back-end'], 4),
  ('java', 'Java', 'Programacion orientada a objetos con tipado estatico. Clases, objetos, herencia y colecciones.', 'Intermedio', 'Ja', '#f89820', '#1f2933', 'bloqueado', 'Completa el curso de JavaScript para desbloquearlo', 16, 7, 18, array['POO', 'Back-end'], 5),
  ('cpp', 'C++', 'Rendimiento y control de la memoria. Punteros, referencias, structs y el manejo manual de recursos.', 'Avanzado', 'C++', '#00599c', '#ffffff', 'bloqueado', 'Necesitas un curso intermedio completado', 20, 7, 19, array['Sistemas', 'Videojuegos'], 6);

-- ---------------------------------------------------------------------------
-- Unidades del curso de JavaScript (6)
-- Solo la unidad 1 tiene el contenido completo; el resto queda como
-- "proximamente", es decir, visible pero no disponible.
-- ---------------------------------------------------------------------------
insert into public.unidades
  (id, curso_id, orden, titulo, descripcion, icono, color, estado, temas)
values
  ('js-u1', 'javascript', 1, 'Primeros pasos', 'Que es JavaScript, como se guardan datos en variables y cuales son los tipos basicos del lenguaje.', 'cohete', '#2fbf56', 'publicada', array['Variables', 'let y const', 'Tipos de datos', 'console.log']),
  ('js-u2', 'javascript', 2, 'Operadores y decisiones', 'Operaciones matematicas, comparaciones y la forma de hacer que el programa tome caminos distintos.', 'bifurcacion', '#1cb0f6', 'proximamente', array['Operadores', 'Comparaciones', 'if / else', 'Operadores logicos']),
  ('js-u3', 'javascript', 3, 'Bucles y repeticion', 'Repetir instrucciones sin escribirlas mil veces usando for, while y los cortes de un bucle.', 'repetir', '#7434db', 'proximamente', array['for', 'while', 'break y continue']),
  ('js-u4', 'javascript', 4, 'Funciones', 'Agrupar codigo reutilizable, pasarle parametros, devolver resultados y entender el alcance de las variables.', 'pieza', '#ff8a3d', 'proximamente', array['Declaracion', 'Parametros', 'return', 'Funciones flecha']),
  ('js-u5', 'javascript', 5, 'Arrays y objetos', 'Guardar muchos datos juntos: listas ordenadas, propiedades con nombre y los metodos mas usados.', 'caja', '#e94f8a', 'proximamente', array['Arrays', 'push y length', 'Objetos', 'map y filter']),
  ('js-u6', 'javascript', 6, 'JavaScript en la pagina', 'Conectar el codigo con el HTML: buscar elementos, cambiar su contenido y responder a los clics del usuario.', 'globo', '#12b0a0', 'proximamente', array['DOM', 'querySelector', 'Eventos', 'textContent']);

-- ---------------------------------------------------------------------------
-- Lecciones publicadas (3)
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
console.log(typeof "42")     // "string", no "number"', 'typeof siempre devuelve el nombre del tipo como texto.', 'publicada');

-- ---------------------------------------------------------------------------
-- Preguntas (12) - todas de opcion multiple
-- La explicacion es parte de la solucion: el rol anon no la puede leer.
-- ---------------------------------------------------------------------------
insert into public.preguntas
  (id, leccion_id, orden, tipo, enunciado, codigo, explicacion, estado)
values
  ('js-u1-l1-a1', 'js-u1-l1', 1, 'opcion-multiple', 'Donde se ejecuta principalmente JavaScript cuando visitas una pagina web?', null, 'El navegador trae un motor de JavaScript que ejecuta el codigo de la pagina. Con Node.js tambien puede correr en un servidor, pero en la web corre en el navegador.', 'publicada'),
  ('js-u1-l1-a2', 'js-u1-l1', 2, 'opcion-multiple', 'Que etiqueta de HTML se usa para incluir codigo JavaScript en una pagina?', null, '<script> permite escribir el codigo dentro de la pagina o enlazar un archivo .js con el atributo src. <code> solo muestra texto con formato de codigo.', 'publicada'),
  ('js-u1-l1-a3', 'js-u1-l1', 3, 'opcion-multiple', 'Cual de estas instrucciones muestra un mensaje en la consola del navegador?', null, 'console.log() es la forma estandar de imprimir en la consola. print() existe en otros lenguajes, como Python, pero no en JavaScript.', 'publicada'),
  ('js-u1-l1-a4', 'js-u1-l1', 4, 'opcion-multiple', 'Es cierto que JavaScript y Java son el mismo lenguaje?', null, 'Son lenguajes diferentes, con sintaxis y usos distintos. Comparten parte del nombre por razones historicas y de marketing de los anios noventa, nada mas.', 'publicada'),
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
console.log(typeof a === typeof b)', 'typeof a es "number" y typeof b es "string". Como los dos textos son distintos, la comparacion da false.', 'publicada');

-- ---------------------------------------------------------------------------
-- Opciones de respuesta (48)
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
  ('js-u1-l3-a4-d', 'js-u1-l3-a4', 4, 'Error', false);

commit;
