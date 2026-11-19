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
-- JavaScript: solo la unidad 1 tiene el contenido completo. Los demas cursos
-- (src/data/cursosNuevos.js): las unidades 1 y 2. El resto queda como
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
  ('js-u6', 'javascript', 6, 'JavaScript en la pagina', 'Conectar el codigo con el HTML: buscar elementos, cambiar su contenido y responder a los clics del usuario.', 'globo', '#12b0a0', 'proximamente', array['DOM', 'querySelector', 'Eventos', 'textContent']),
  ('py-u1', 'python', 1, 'Primeros pasos', 'Qué es Python, cómo mostrar mensajes y cómo guardar datos en variables.', 'cohete', '#3776ab', 'publicada', array['print', 'Variables', 'Tipos de datos', 'input']),
  ('py-u2', 'python', 2, 'Decisiones y bucles', 'Hacer que el programa elija un camino con if y repita tareas con for y while.', 'bifurcacion', '#2fbf56', 'publicada', array['if / elif / else', 'Comparaciones', 'for y range', 'while']),
  ('py-u3', 'python', 3, 'Listas y diccionarios', 'Guardar muchos datos juntos y recorrerlos.', 'caja', '#1cb0f6', 'proximamente', array['Listas', 'Índices', 'Diccionarios', 'Recorrer colecciones']),
  ('py-u4', 'python', 4, 'Funciones', 'Agrupar código con def, recibir parámetros y devolver resultados.', 'pieza', '#7434db', 'proximamente', array['def', 'Parámetros', 'return', 'Alcance']),
  ('web-u1', 'html-css', 1, 'Estructura con HTML', 'Las etiquetas que arman una página: títulos, párrafos, enlaces, imágenes y listas.', 'texto', '#e34f26', 'publicada', array['Etiquetas', 'Estructura del documento', 'Enlaces', 'Imágenes y listas']),
  ('web-u2', 'html-css', 2, 'Estilos con CSS', 'Darle color, tamaño y espacio a los elementos con selectores y propiedades.', 'globo', '#1572b6', 'publicada', array['Selectores', 'Propiedades', 'Colores', 'Modelo de caja']),
  ('web-u3', 'html-css', 3, 'Flexbox', 'Acomodar elementos en filas y columnas.', 'caja', '#2fbf56', 'proximamente', array['display: flex', 'justify-content', 'align-items', 'gap']),
  ('web-u4', 'html-css', 4, 'Diseño responsivo', 'Páginas que se ven bien en el celular y en la compu.', 'puntero', '#7434db', 'proximamente', array['Media queries', 'Unidades relativas', 'Imágenes flexibles']),
  ('sql-u1', 'sql', 1, 'Consultas básicas', 'Leer datos de una tabla, filtrarlos y ordenarlos.', 'carpetas', '#00758f', 'publicada', array['SELECT', 'FROM', 'WHERE', 'ORDER BY']),
  ('sql-u2', 'sql', 2, 'Combinar y agrupar', 'Unir tablas relacionadas y resumir datos con funciones de agregado.', 'pieza', '#2fbf56', 'publicada', array['JOIN', 'COUNT, SUM, AVG', 'GROUP BY', 'HAVING']),
  ('sql-u3', 'sql', 3, 'Modificar datos', 'Agregar, cambiar y borrar filas con cuidado.', 'variable', '#7434db', 'proximamente', array['INSERT', 'UPDATE', 'DELETE', 'Transacciones']),
  ('java-u1', 'java', 1, 'Primeros pasos', 'La estructura de un programa en Java, los tipos y las variables.', 'cohete', '#f89820', 'publicada', array['main', 'System.out.println', 'Tipos primitivos', 'String']),
  ('java-u2', 'java', 2, 'Clases y objetos', 'La base de la programación orientada a objetos.', 'pieza', '#1cb0f6', 'publicada', array['Clases', 'Objetos y new', 'Constructores', 'Métodos']),
  ('java-u3', 'java', 3, 'Herencia', 'Reutilizar y especializar clases.', 'carpetas', '#2fbf56', 'proximamente', array['extends', 'super', '@Override', 'Polimorfismo']),
  ('java-u4', 'java', 4, 'Colecciones', 'Listas y mapas que crecen solos.', 'caja', '#7434db', 'proximamente', array['ArrayList', 'HashMap', 'for-each']),
  ('cpp-u1', 'cpp', 1, 'Primeros pasos', 'Un programa en C++, la salida por pantalla y los tipos básicos.', 'cohete', '#00599c', 'publicada', array['#include', 'main', 'cout', 'Tipos']),
  ('cpp-u2', 'cpp', 2, 'Referencias y punteros', 'Cómo C++ te deja trabajar directamente con la memoria.', 'flechaDiana', '#7434db', 'publicada', array['Direcciones', 'Referencias &', 'Punteros *', 'nullptr']),
  ('cpp-u3', 'cpp', 3, 'Structs y clases', 'Agrupar datos y comportamiento.', 'pieza', '#2fbf56', 'proximamente', array['struct', 'class', 'Constructores', 'Destructores']),
  ('cpp-u4', 'cpp', 4, 'Memoria dinámica', 'Pedir y liberar memoria sin perder nada.', 'caja', '#1cb0f6', 'proximamente', array['new y delete', 'Fugas de memoria', 'Punteros inteligentes']) on conflict (id) do update set
  curso_id = excluded.curso_id,
  orden = excluded.orden,
  titulo = excluded.titulo,
  descripcion = excluded.descripcion,
  icono = excluded.icono,
  color = excluded.color,
  estado = excluded.estado,
  temas = excluded.temas;

-- ---------------------------------------------------------------------------
-- Lecciones publicadas (23)
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

int* nada = nullptr;', 'En int* p el * es parte del tipo; en *p = 8 es el operador que desreferencia.', 'publicada') on conflict (id) do update set
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
-- Preguntas (92) - todas de opcion multiple
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
  ('cpp-u2-l2-a4', 'cpp-u2-l2', 4, 'opcion-multiple', '¿Qué valor se usa para indicar que un puntero no apunta a nada?', null, 'Desde C++11 se usa nullptr. Desreferenciarlo hace fallar el programa, así que hay que chequearlo antes.', 'publicada') on conflict (id) do update set
  leccion_id = excluded.leccion_id,
  orden = excluded.orden,
  tipo = excluded.tipo,
  enunciado = excluded.enunciado,
  codigo = excluded.codigo,
  explicacion = excluded.explicacion,
  estado = excluded.estado;

-- ---------------------------------------------------------------------------
-- Opciones de respuesta (368)
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
  ('cpp-u2-l2-a4-d', 'cpp-u2-l2-a4', 4, 'empty', false) on conflict (id) do update set
  pregunta_id = excluded.pregunta_id,
  orden = excluded.orden,
  texto = excluded.texto,
  es_correcta = excluded.es_correcta;

commit;
