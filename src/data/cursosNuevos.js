
/**
 * Contenido de los cursos que no son JavaScript: Python, HTML y CSS, SQL, Java y C++.
 *
 * Igual que el resto de src/data/, la app NO lee este archivo: es la fuente con la que
 * se genera supabase/02-datos-iniciales.sql (npm run supabase:datos).
 *
 * Aca estan todas las unidades de cada curso y las lecciones de las dos primeras;
 * las de las ultimas unidades estan en src/data/cursosUnidadesFinales.js. Cada
 * leccion tiene cuatro actividades.
 */

import { leccion, unidad } from './armarContenido.js'

// ===========================================================================
//  PYTHON
// ===========================================================================
const unidadesPython = [
  unidad('python', 'py', 1, {
    titulo: 'Primeros pasos',
    descripcion: 'Qué es Python, cómo mostrar mensajes y cómo guardar datos en variables.',
    icono: 'cohete', color: '#3776ab', temas: ['print', 'Variables', 'Tipos de datos', 'input'], publicada: true
  }),
  unidad('python', 'py', 2, {
    titulo: 'Decisiones y bucles',
    descripcion: 'Hacer que el programa elija un camino con if y repita tareas con for y while.',
    icono: 'bifurcacion', color: '#2fbf56', temas: ['if / elif / else', 'Comparaciones', 'for y range', 'while'], publicada: true
  }),
  unidad('python', 'py', 3, {
    titulo: 'Listas y diccionarios',
    descripcion: 'Guardar muchos datos juntos y recorrerlos.',
    icono: 'caja', color: '#1cb0f6', temas: ['Listas', 'Índices', 'Diccionarios', 'Recorrer colecciones'], publicada: true
  }),
  unidad('python', 'py', 4, {
    titulo: 'Funciones',
    descripcion: 'Agrupar código con def, recibir parámetros y devolver resultados.',
    icono: 'pieza', color: '#7434db', temas: ['def', 'Parámetros', 'return', 'Alcance'], publicada: true
  })
]

const leccionesPython = [
  leccion('py-u1', 1, {
    titulo: 'Hola, Python',
    descripcion: 'Para qué sirve Python y cómo mostrar un mensaje con print().',
    icono: 'estrella',
    explicacion:
      'Python es un lenguaje de propósito general, famoso por su sintaxis simple y legible. Se usa ' +
      'para automatizar tareas, analizar datos, hacer sitios web e inteligencia artificial. La función ' +
      'print() muestra valores en la pantalla, y los comentarios empiezan con #: Python los ignora. ' +
      'A diferencia de otros lenguajes, no hace falta terminar las líneas con punto y coma.',
    ejemplo: {
      titulo: 'Tu primer programa',
      codigo: '# Esto es un comentario\nprint("Hola Sintaxia")\nprint(2 + 3)  # muestra 5',
      nota: 'Cada print() escribe en una línea nueva.'
    },
    actividades: [
      {
        consigna: '¿Qué función muestra un mensaje en la pantalla en Python?',
        opciones: ['echo()', 'console.log()', 'print()', 'mostrar()'],
        correcta: 2,
        explicacion: 'print() es la función de Python para mostrar valores. console.log() es de JavaScript y echo, de PHP o la terminal.'
      },
      {
        consigna: '¿Con qué símbolo empieza un comentario de una línea en Python?',
        opciones: ['#', '//', '<!--', '--'],
        correcta: 0,
        explicacion: 'En Python los comentarios empiezan con #. // es de JavaScript, Java o C++; -- es de SQL.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'print(2 + 3)',
        opciones: ['2 + 3', '"5"', 'Un error', '5'],
        correcta: 3,
        explicacion: 'Sin comillas, 2 + 3 es una operación: Python la calcula y print() muestra el resultado, 5.'
      },
      {
        consigna: '¿Cuál de estas líneas es correcta en Python?',
        opciones: ['print("Hola");;', 'print("Hola")', 'print "Hola" end', 'Print["Hola"]'],
        correcta: 1,
        explicacion: 'Se llama a print con paréntesis y el texto entre comillas. Python distingue mayúsculas: Print no existe.'
      }
    ]
  }),
  leccion('py-u1', 2, {
    titulo: 'Variables y tipos',
    descripcion: 'Guardar datos con un nombre y conocer los tipos básicos.',
    icono: 'variable',
    explicacion:
      'Una variable es un nombre que guarda un valor. En Python se crea simplemente asignándole algo con =, ' +
      'sin declarar el tipo: Python lo deduce. Los tipos básicos son int (enteros), float (números con ' +
      'decimales), str (texto, entre comillas) y bool (True o False). La función type() dice de qué tipo ' +
      'es un valor, e input() lee lo que escribe la persona, siempre como texto.',
    ejemplo: {
      titulo: 'Variables de distintos tipos',
      codigo: 'edad = 16          # int\naltura = 1.72      # float\nnombre = "Ana"     # str\nmayor = edad >= 18 # bool (False)\nprint(type(nombre))  # <class \'str\'>',
      nota: 'Los nombres de variables no pueden empezar con un número ni tener espacios.'
    },
    actividades: [
      {
        consigna: '¿Cómo se crea una variable llamada puntos con el valor 10?',
        opciones: ['int puntos = 10', 'let puntos = 10', 'puntos = 10', 'var puntos := 10'],
        correcta: 2,
        explicacion: 'En Python alcanza con nombre = valor. No se escribe el tipo ni palabras como let o var.'
      },
      {
        consigna: '¿De qué tipo es el valor 3.5?',
        opciones: ['float', 'int', 'str', 'bool'],
        correcta: 0,
        explicacion: 'Los números con parte decimal son float. int es solo para enteros como 3.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'nombre = "Ana"\nprint("Hola " + nombre)',
        opciones: ['Hola nombre', 'Hola Ana', 'Un error', '"Hola " + nombre'],
        correcta: 1,
        explicacion: 'El + une (concatena) los dos textos: "Hola " y el valor de la variable, "Ana".'
      },
      {
        consigna: '¿Qué tipo de dato devuelve siempre input()?',
        opciones: ['int', 'bool', 'Depende de lo que se escriba', 'str'],
        correcta: 3,
        explicacion: 'input() siempre devuelve texto (str). Para usarlo como número hay que convertirlo, por ejemplo con int(input()).'
      }
    ]
  }),
  leccion('py-u2', 1, {
    titulo: 'Tomar decisiones con if',
    descripcion: 'Comparar valores y elegir qué código ejecutar.',
    icono: 'bifurcacion',
    explicacion:
      'if ejecuta un bloque solo si una condición es verdadera. elif agrega otra condición y else cubre el ' +
      'resto de los casos. En Python los bloques se marcan con sangría (cuatro espacios) y la línea del if ' +
      'termina con dos puntos. Para comparar se usan ==, !=, <, >, <= y >=, y las condiciones se combinan ' +
      'con and, or y not.',
    ejemplo: {
      titulo: 'Calificación',
      codigo: 'nota = 7\nif nota >= 8:\n    print("Excelente")\nelif nota >= 6:\n    print("Aprobado")\nelse:\n    print("A recuperar")',
      nota: 'Se ejecuta solo el primer bloque cuya condición se cumple: acá, "Aprobado".'
    },
    actividades: [
      {
        consigna: '¿Qué marca en Python qué líneas están dentro de un if?',
        opciones: ['Las llaves { }', 'La sangría (espacios al inicio)', 'La palabra end', 'Los paréntesis'],
        correcta: 1,
        explicacion: 'Python usa la sangría para formar bloques. Si una línea no está sangrada, ya no pertenece al if.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'x = 5\nif x > 10:\n    print("grande")\nelse:\n    print("chico")',
        opciones: ['grande', 'chico', 'grande y chico', 'Nada'],
        correcta: 1,
        explicacion: '5 > 10 es falso, así que se ejecuta el bloque del else.'
      },
      {
        consigna: '¿Qué operador compara si dos valores son iguales?',
        opciones: ['=', '===', '==', 'eq'],
        correcta: 2,
        explicacion: '== compara. Un solo = asigna un valor a una variable. === no existe en Python.'
      },
      {
        consigna: '¿Cómo se escribe "si no se cumplió lo anterior, pero se cumple esto" en Python?',
        opciones: ['else if', 'elseif', 'elif', 'otherwise'],
        correcta: 2,
        explicacion: 'Python abrevia else if como elif.'
      }
    ]
  }),
  leccion('py-u2', 2, {
    titulo: 'Repetir con for y while',
    descripcion: 'Recorrer secuencias y repetir mientras se cumpla una condición.',
    icono: 'repetir',
    explicacion:
      'for recorre los elementos de una secuencia uno por uno. Con range(n) se obtienen los números de 0 a ' +
      'n - 1, ideal para repetir algo n veces; range(a, b) va de a hasta b - 1. while repite mientras su ' +
      'condición sea verdadera, así que dentro del bucle algo tiene que cambiar para que termine. break ' +
      'corta el bucle antes de tiempo.',
    ejemplo: {
      titulo: 'Contar',
      codigo: 'for i in range(3):\n    print(i)      # 0, 1, 2\n\nn = 3\nwhile n > 0:\n    print(n)      # 3, 2, 1\n    n = n - 1',
      nota: 'range(3) tiene tres números, pero empieza en 0.'
    },
    actividades: [
      {
        consigna: '¿Qué números recorre range(4)?',
        opciones: ['1, 2, 3, 4', '0, 1, 2, 3', '0, 1, 2, 3, 4', '4'],
        correcta: 1,
        explicacion: 'range(4) empieza en 0 y termina antes del 4: 0, 1, 2 y 3.'
      },
      {
        consigna: '¿Cuántas veces se muestra "Hola"?',
        codigo: 'for i in range(2, 5):\n    print("Hola")',
        opciones: ['2', '5', '3', '4'],
        correcta: 2,
        explicacion: 'range(2, 5) da 2, 3 y 4: tres vueltas.'
      },
      {
        consigna: '¿Qué pasa si la condición de un while nunca deja de ser verdadera?',
        opciones: ['El bucle no se ejecuta', 'Se repite para siempre', 'Python la corta a las 100 vueltas', 'Da error de sintaxis'],
        correcta: 1,
        explicacion: 'Es un bucle infinito: hay que cambiar algo adentro (o usar break) para que termine.'
      },
      {
        consigna: '¿Qué instrucción corta un bucle antes de que termine?',
        opciones: ['stop', 'exit', 'return', 'break'],
        correcta: 3,
        explicacion: 'break sale del bucle en el que está. return sale de una función, no solo del bucle.'
      }
    ]
  })
]

// ===========================================================================
//  HTML Y CSS
// ===========================================================================
const unidadesHtml = [
  unidad('html-css', 'web', 1, {
    titulo: 'Estructura con HTML',
    descripcion: 'Las etiquetas que arman una página: títulos, párrafos, enlaces, imágenes y listas.',
    icono: 'texto', color: '#e34f26', temas: ['Etiquetas', 'Estructura del documento', 'Enlaces', 'Imágenes y listas'], publicada: true
  }),
  unidad('html-css', 'web', 2, {
    titulo: 'Estilos con CSS',
    descripcion: 'Darle color, tamaño y espacio a los elementos con selectores y propiedades.',
    icono: 'globo', color: '#1572b6', temas: ['Selectores', 'Propiedades', 'Colores', 'Modelo de caja'], publicada: true
  }),
  unidad('html-css', 'web', 3, {
    titulo: 'Flexbox',
    descripcion: 'Acomodar elementos en filas y columnas.',
    icono: 'caja', color: '#2fbf56', temas: ['display: flex', 'justify-content', 'align-items', 'gap'], publicada: true
  }),
  unidad('html-css', 'web', 4, {
    titulo: 'Diseño responsivo',
    descripcion: 'Páginas que se ven bien en el celular y en la compu.',
    icono: 'puntero', color: '#7434db', temas: ['Media queries', 'Unidades relativas', 'Imágenes flexibles'], publicada: true
  })
]

const leccionesHtml = [
  leccion('web-u1', 1, {
    titulo: 'Etiquetas y documento',
    descripcion: 'Cómo se escribe una etiqueta y qué partes tiene una página HTML.',
    icono: 'estrella',
    explicacion:
      'HTML describe el contenido de una página con etiquetas. La mayoría se abre y se cierra: <p> abre un ' +
      'párrafo y </p> lo cierra. Los títulos van de <h1> (el más importante) a <h6>. Todo documento tiene ' +
      '<html>, un <head> con datos de la página (como el <title> de la pestaña) y un <body> con lo que se ve.',
    ejemplo: {
      titulo: 'Una página mínima',
      codigo: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Mi página</title>\n  </head>\n  <body>\n    <h1>Hola</h1>\n    <p>Este es un párrafo.</p>\n  </body>\n</html>',
      nota: 'El <title> se ve en la pestaña del navegador, no dentro de la página.'
    },
    actividades: [
      {
        consigna: '¿Qué etiqueta crea un párrafo?',
        opciones: ['<p>', '<par>', '<text>', '<h1>'],
        correcta: 0,
        explicacion: '<p> marca un párrafo. <h1> es un título.'
      },
      {
        consigna: '¿Cómo se cierra la etiqueta <h1>?',
        opciones: ['<h1/>', '</h1>', '<\\h1>', '<end h1>'],
        correcta: 1,
        explicacion: 'La etiqueta de cierre repite el nombre con una barra adelante: </h1>.'
      },
      {
        consigna: '¿En qué parte del documento va el contenido que se ve en la página?',
        opciones: ['<head>', '<title>', '<body>', '<meta>'],
        correcta: 2,
        explicacion: '<body> tiene todo lo visible. <head> guarda información sobre la página, como el título de la pestaña.'
      },
      {
        consigna: '¿Cuál es el título más importante de una página?',
        opciones: ['<h6>', '<title>', '<header>', '<h1>'],
        correcta: 3,
        explicacion: 'Los títulos van de <h1> (el principal) a <h6>. <title> es el texto de la pestaña, no un título dentro de la página.'
      }
    ]
  }),
  leccion('web-u1', 2, {
    titulo: 'Enlaces, imágenes y listas',
    descripcion: 'Conectar páginas, mostrar imágenes y armar listas.',
    icono: 'saltar',
    explicacion:
      'Las etiquetas pueden tener atributos que les dan información extra. Un enlace es <a> con el atributo ' +
      'href, que dice a dónde lleva. Una imagen es <img> con src (el archivo) y alt (un texto que la ' +
      'describe para quien no la puede ver); <img> no tiene etiqueta de cierre. Las listas son <ul> (con ' +
      'viñetas) u <ol> (numeradas), y cada elemento va en un <li>.',
    ejemplo: {
      titulo: 'Atributos en acción',
      codigo: '<a href="https://sintaxia.app">Ir a Sintaxia</a>\n<img src="sintax.png" alt="La cotorra Sintax">\n<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n</ul>',
      nota: 'El texto entre <a> y </a> es lo que se puede tocar.'
    },
    actividades: [
      {
        consigna: '¿Qué atributo indica a dónde lleva un enlace <a>?',
        opciones: ['src', 'link', 'href', 'to'],
        correcta: 2,
        explicacion: 'href guarda la dirección del enlace. src se usa en imágenes y scripts.'
      },
      {
        consigna: '¿Para qué sirve el atributo alt de una imagen?',
        opciones: ['Para cambiar su tamaño', 'Para describirla si no se puede ver', 'Para darle un borde', 'Para que sea un enlace'],
        correcta: 1,
        explicacion: 'alt es el texto alternativo: lo leen los lectores de pantalla y aparece si la imagen no carga.'
      },
      {
        consigna: '¿Qué etiqueta crea una lista numerada?',
        opciones: ['<ol>', '<ul>', '<li>', '<list>'],
        correcta: 0,
        explicacion: '<ol> es ordered list (numerada); <ul> lleva viñetas. <li> es cada elemento de cualquiera de las dos.'
      },
      {
        consigna: '¿Cuál de estas imágenes está bien escrita?',
        opciones: ['<img href="gato.png">', '<image src="gato.png"></image>', '<img>gato.png</img>', '<img src="gato.png" alt="Un gato">'],
        correcta: 3,
        explicacion: '<img> usa src para el archivo, alt para la descripción y no tiene etiqueta de cierre.'
      }
    ]
  }),
  leccion('web-u2', 1, {
    titulo: 'Selectores y propiedades',
    descripcion: 'Elegir qué elementos cambiar y cómo.',
    icono: 'flechaDiana',
    explicacion:
      'Una regla de CSS tiene un selector (a qué elementos se aplica) y, entre llaves, declaraciones ' +
      'propiedad: valor; separadas por punto y coma. El selector p elige todos los párrafos, .destacado ' +
      'elige los elementos con class="destacado" y #menu elige el elemento con id="menu". Propiedades ' +
      'comunes: color (texto), background-color (fondo), font-size (tamaño de letra).',
    ejemplo: {
      titulo: 'Tres tipos de selector',
      codigo: 'p {\n  color: navy;\n}\n.destacado {\n  background-color: yellow;\n}\n#menu {\n  font-size: 20px;\n}',
      nota: 'Una clase se puede repetir en muchos elementos; un id, solo en uno.'
    },
    actividades: [
      {
        consigna: '¿Qué selector elige los elementos con class="aviso"?',
        opciones: ['#aviso', '.aviso', 'aviso', '*aviso'],
        correcta: 1,
        explicacion: 'Las clases se seleccionan con un punto. El numeral # es para id.'
      },
      {
        consigna: '¿Qué propiedad cambia el color del texto?',
        opciones: ['color', 'text-color', 'font-color', 'background-color'],
        correcta: 0,
        explicacion: 'color cambia el texto; background-color, el fondo. text-color y font-color no existen.'
      },
      {
        consigna: '¿Qué está mal en esta regla?',
        codigo: 'h1 {\n  font-size = 32px;\n}',
        opciones: ['Falta un punto antes de h1', 'Las llaves van al revés', 'Se usa = en lugar de :', 'px no es una unidad válida'],
        correcta: 2,
        explicacion: 'Las declaraciones se escriben propiedad: valor; con dos puntos, nunca con =.'
      },
      {
        consigna: '¿Qué selector elige el elemento con id="titulo"?',
        opciones: ['.titulo', 'titulo', '@titulo', '#titulo'],
        correcta: 3,
        explicacion: 'El id se selecciona con #. Un id no debería repetirse en la misma página.'
      }
    ]
  }),
  leccion('web-u2', 2, {
    titulo: 'El modelo de caja',
    descripcion: 'Contenido, relleno, borde y margen de cada elemento.',
    icono: 'caja',
    explicacion:
      'Para CSS, cada elemento es una caja con cuatro capas: el contenido, el padding (relleno entre el ' +
      'contenido y el borde), el border y el margin (espacio afuera, que lo separa de los demás). width y ' +
      'height fijan el tamaño del contenido; con box-sizing: border-box, en cambio, incluyen padding y borde, ' +
      'que suele ser más fácil de calcular.',
    ejemplo: {
      titulo: 'Una tarjeta',
      codigo: '.tarjeta {\n  padding: 16px;          /* adentro */\n  border: 2px solid gray;\n  margin: 24px;           /* afuera */\n  box-sizing: border-box;\n}',
      nota: 'padding agranda la caja hacia adentro del borde; margin la separa de lo de alrededor.'
    },
    actividades: [
      {
        consigna: '¿Qué propiedad agrega espacio ENTRE el contenido y el borde?',
        opciones: ['margin', 'padding', 'gap', 'spacing'],
        correcta: 1,
        explicacion: 'padding es el relleno de adentro. margin es el espacio de afuera del borde.'
      },
      {
        consigna: '¿Qué propiedad separa una caja de las que tiene alrededor?',
        opciones: ['margin', 'padding', 'border', 'width'],
        correcta: 0,
        explicacion: 'margin es el espacio exterior de la caja.'
      },
      {
        consigna: 'Con box-sizing: content-box (el valor por defecto), ¿cuánto mide de ancho esta caja en total?',
        codigo: 'div {\n  width: 100px;\n  padding: 10px;\n  border: 5px solid black;\n}',
        opciones: ['100px', '110px', '130px', '115px'],
        correcta: 2,
        explicacion: '100 de contenido + 10 de padding de cada lado + 5 de borde de cada lado = 130px.'
      },
      {
        consigna: '¿Qué hace box-sizing: border-box?',
        opciones: ['Agrega un borde a la caja', 'Hace que width incluya el padding y el borde', 'Elimina el margin', 'Centra la caja'],
        correcta: 1,
        explicacion: 'Con border-box, el width ya incluye padding y borde: la caja mide exactamente lo que dice width.'
      }
    ]
  })
]

// ===========================================================================
//  SQL
// ===========================================================================
const unidadesSql = [
  unidad('sql', 'sql', 1, {
    titulo: 'Consultas básicas',
    descripcion: 'Leer datos de una tabla, filtrarlos y ordenarlos.',
    icono: 'carpetas', color: '#00758f', temas: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'], publicada: true
  }),
  unidad('sql', 'sql', 2, {
    titulo: 'Combinar y agrupar',
    descripcion: 'Unir tablas relacionadas y resumir datos con funciones de agregado.',
    icono: 'pieza', color: '#2fbf56', temas: ['JOIN', 'COUNT, SUM, AVG', 'GROUP BY', 'HAVING'], publicada: true
  }),
  unidad('sql', 'sql', 3, {
    titulo: 'Modificar datos',
    descripcion: 'Agregar, cambiar y borrar filas con cuidado.',
    icono: 'variable', color: '#7434db', temas: ['INSERT', 'UPDATE', 'DELETE', 'Transacciones'], publicada: true
  })
]

const leccionesSql = [
  leccion('sql-u1', 1, {
    titulo: 'SELECT y FROM',
    descripcion: 'Pedirle datos a una tabla.',
    icono: 'estrella',
    explicacion:
      'Una base de datos relacional guarda la información en tablas: cada fila es un registro y cada ' +
      'columna, un dato. SELECT dice qué columnas se quieren y FROM, de qué tabla. SELECT * trae todas las ' +
      'columnas. Por convención las palabras de SQL se escriben en mayúsculas, aunque no es obligatorio, ' +
      'y cada consulta termina con punto y coma.',
    ejemplo: {
      titulo: 'Leer una tabla',
      codigo: '-- Todas las columnas de la tabla alumnos\nSELECT * FROM alumnos;\n\n-- Solo el nombre y la edad\nSELECT nombre, edad FROM alumnos;',
      nota: 'Los comentarios en SQL empiezan con --.'
    },
    actividades: [
      {
        consigna: '¿Qué consulta trae todas las columnas de la tabla productos?',
        opciones: ['GET ALL productos;', 'SELECT * FROM productos;', 'SELECT productos;', 'FROM productos SELECT *;'],
        correcta: 1,
        explicacion: 'SELECT * pide todas las columnas y FROM indica la tabla. El orden es SELECT ... FROM ...'
      },
      {
        consigna: 'En una tabla, ¿qué representa cada fila?',
        opciones: ['Un tipo de dato', 'Un registro (por ejemplo, un alumno)', 'Una columna', 'Una base de datos'],
        correcta: 1,
        explicacion: 'Cada fila es un registro; las columnas son los datos que tiene cada registro.'
      },
      {
        consigna: '¿Cómo se piden solo las columnas nombre y precio?',
        opciones: ['SELECT nombre, precio FROM productos;', 'SELECT nombre AND precio FROM productos;', 'SELECT (nombre precio) FROM productos;', 'SELECT * nombre, precio FROM productos;'],
        correcta: 0,
        explicacion: 'Las columnas se separan con comas después de SELECT.'
      },
      {
        consigna: '¿Con qué empieza un comentario de una línea en SQL?',
        opciones: ['//', '#', '--', '<!--'],
        correcta: 2,
        explicacion: 'En SQL estándar los comentarios de una línea empiezan con --.'
      }
    ]
  }),
  leccion('sql-u1', 2, {
    titulo: 'Filtrar y ordenar',
    descripcion: 'Quedarse con las filas que interesan y ordenarlas.',
    icono: 'balanza',
    explicacion:
      'WHERE filtra las filas con una condición: solo vuelven las que la cumplen. Se compara con =, <>, <, >, ' +
      '<= y >=, y se combinan condiciones con AND y OR. Los textos van entre comillas simples. LIKE busca ' +
      'patrones: % reemplaza cualquier cantidad de caracteres. ORDER BY ordena el resultado: ASC de menor ' +
      'a mayor (por defecto) y DESC de mayor a menor.',
    ejemplo: {
      titulo: 'Filtrar y ordenar',
      codigo: "SELECT nombre, edad\nFROM alumnos\nWHERE edad >= 16 AND curso = '5A'\nORDER BY edad DESC;",
      nota: 'El orden de las cláusulas es fijo: SELECT, FROM, WHERE y después ORDER BY.'
    },
    actividades: [
      {
        consigna: '¿Qué cláusula se usa para filtrar filas?',
        opciones: ['FILTER', 'ORDER BY', 'WHERE', 'IF'],
        correcta: 2,
        explicacion: 'WHERE deja solo las filas que cumplen la condición.'
      },
      {
        consigna: '¿Qué hace ORDER BY precio DESC?',
        opciones: ['Ordena de mayor a menor precio', 'Ordena de menor a mayor precio', 'Borra los precios', 'Filtra los precios negativos'],
        correcta: 0,
        explicacion: 'DESC es descendente: de mayor a menor. ASC (el valor por defecto) es ascendente.'
      },
      {
        consigna: '¿Qué filas devuelve esta consulta?',
        codigo: "SELECT * FROM alumnos WHERE nombre LIKE 'Ma%';",
        opciones: ['Las que se llaman exactamente Ma%', 'Las que terminan en Ma', 'Las que contienen un %', 'Las que empiezan con Ma, como Marta o Mateo'],
        correcta: 3,
        explicacion: "% reemplaza cualquier cantidad de caracteres: 'Ma%' es todo lo que empieza con Ma."
      },
      {
        consigna: '¿Cuál de estas consultas está bien ordenada?',
        opciones: ['SELECT * WHERE edad > 15 FROM alumnos;', 'SELECT * FROM alumnos ORDER BY edad WHERE edad > 15;', 'SELECT * FROM alumnos WHERE edad > 15 ORDER BY edad;', 'FROM alumnos SELECT * WHERE edad > 15;'],
        correcta: 2,
        explicacion: 'El orden es SELECT, FROM, WHERE y ORDER BY.'
      }
    ]
  }),
  leccion('sql-u2', 1, {
    titulo: 'Unir tablas con JOIN',
    descripcion: 'Combinar filas de dos tablas relacionadas.',
    icono: 'pieza',
    explicacion:
      'Las tablas se relacionan con claves: la clave primaria identifica cada fila y una clave foránea en otra ' +
      'tabla apunta a ella. JOIN combina dos tablas usando esa relación, que se escribe después de ON. ' +
      'INNER JOIN (o simplemente JOIN) devuelve solo las filas que tienen pareja en las dos tablas; LEFT JOIN ' +
      'devuelve todas las de la tabla de la izquierda, aunque no tengan pareja.',
    ejemplo: {
      titulo: 'Alumnos con su curso',
      codigo: 'SELECT a.nombre, c.nombre AS curso\nFROM alumnos a\nJOIN cursos c ON c.id = a.curso_id;',
      nota: 'a y c son alias: nombres cortos para no repetir el nombre de cada tabla.'
    },
    actividades: [
      {
        consigna: '¿Qué palabra indica la condición que relaciona las tablas en un JOIN?',
        opciones: ['WHERE', 'ON', 'WITH', 'USING TABLE'],
        correcta: 1,
        explicacion: 'Después de JOIN tabla se escribe ON con la condición, por ejemplo ON c.id = a.curso_id.'
      },
      {
        consigna: '¿Qué devuelve un INNER JOIN?',
        opciones: ['Todas las filas de las dos tablas', 'Solo las filas que tienen pareja en ambas tablas', 'Solo la primera tabla', 'Las filas sin pareja'],
        correcta: 1,
        explicacion: 'INNER JOIN deja solo las combinaciones que cumplen la condición en las dos tablas.'
      },
      {
        consigna: 'Si un alumno no tiene curso asignado, ¿qué JOIN lo sigue mostrando en el resultado?',
        codigo: 'SELECT a.nombre, c.nombre\nFROM alumnos a\n____ cursos c ON c.id = a.curso_id;',
        opciones: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'Ninguno'],
        correcta: 1,
        explicacion: 'LEFT JOIN conserva todas las filas de la tabla de la izquierda (alumnos); las columnas del curso quedan en NULL.'
      },
      {
        consigna: '¿Qué es una clave foránea?',
        opciones: ['Una contraseña de la base', 'Una columna que apunta a la clave primaria de otra tabla', 'La primera columna de cada tabla', 'Un índice para ordenar'],
        correcta: 1,
        explicacion: 'La clave foránea guarda el identificador de una fila de otra tabla: así se relacionan.'
      }
    ]
  }),
  leccion('sql-u2', 2, {
    titulo: 'Agrupar y resumir',
    descripcion: 'Contar, sumar y promediar con GROUP BY.',
    icono: 'division',
    explicacion:
      'Las funciones de agregado resumen muchas filas en un valor: COUNT cuenta, SUM suma, AVG promedia y ' +
      'MIN y MAX dan el menor y el mayor. GROUP BY arma un grupo por cada valor distinto de una columna y ' +
      'calcula el agregado de cada grupo. Para filtrar grupos (no filas) se usa HAVING, que va después de ' +
      'GROUP BY.',
    ejemplo: {
      titulo: 'Alumnos por curso',
      codigo: 'SELECT curso_id, COUNT(*) AS cantidad\nFROM alumnos\nGROUP BY curso_id\nHAVING COUNT(*) > 20;',
      nota: 'WHERE filtra filas antes de agrupar; HAVING filtra los grupos ya armados.'
    },
    actividades: [
      {
        consigna: '¿Qué función cuenta filas?',
        opciones: ['SUM()', 'COUNT()', 'TOTAL()', 'AVG()'],
        correcta: 1,
        explicacion: 'COUNT(*) cuenta filas. SUM suma valores y AVG los promedia.'
      },
      {
        consigna: '¿Qué devuelve esta consulta?',
        codigo: 'SELECT AVG(nota) FROM examenes;',
        opciones: ['La nota más alta', 'La cantidad de exámenes', 'El promedio de las notas', 'Todas las notas'],
        correcta: 2,
        explicacion: 'AVG calcula el promedio (average) de la columna.'
      },
      {
        consigna: '¿Para qué sirve GROUP BY curso_id?',
        opciones: ['Para ordenar por curso', 'Para calcular los agregados por cada curso', 'Para borrar cursos repetidos', 'Para unir con la tabla cursos'],
        correcta: 1,
        explicacion: 'GROUP BY arma un grupo por curso y COUNT, SUM, etc. se calculan dentro de cada grupo.'
      },
      {
        consigna: '¿Qué cláusula filtra GRUPOS según un agregado, como COUNT(*) > 5?',
        opciones: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
        correcta: 1,
        explicacion: 'HAVING filtra después de agrupar. WHERE no puede usar funciones de agregado.'
      }
    ]
  })
]

// ===========================================================================
//  JAVA
// ===========================================================================
const unidadesJava = [
  unidad('java', 'java', 1, {
    titulo: 'Primeros pasos',
    descripcion: 'La estructura de un programa en Java, los tipos y las variables.',
    icono: 'cohete', color: '#f89820', temas: ['main', 'System.out.println', 'Tipos primitivos', 'String'], publicada: true
  }),
  unidad('java', 'java', 2, {
    titulo: 'Clases y objetos',
    descripcion: 'La base de la programación orientada a objetos.',
    icono: 'pieza', color: '#1cb0f6', temas: ['Clases', 'Objetos y new', 'Constructores', 'Métodos'], publicada: true
  }),
  unidad('java', 'java', 3, {
    titulo: 'Herencia',
    descripcion: 'Reutilizar y especializar clases.',
    icono: 'carpetas', color: '#2fbf56', temas: ['extends', 'super', '@Override', 'Polimorfismo'], publicada: true
  }),
  unidad('java', 'java', 4, {
    titulo: 'Colecciones',
    descripcion: 'Listas y mapas que crecen solos.',
    icono: 'caja', color: '#7434db', temas: ['ArrayList', 'HashMap', 'for-each'], publicada: true
  })
]

const leccionesJava = [
  leccion('java-u1', 1, {
    titulo: 'Hola, Java',
    descripcion: 'Cómo es un programa en Java y cómo mostrar un mensaje.',
    icono: 'estrella',
    explicacion:
      'En Java todo el código vive dentro de una clase. El programa empieza a ejecutarse en el método ' +
      'public static void main(String[] args). Para mostrar texto se usa System.out.println(), que agrega ' +
      'un salto de línea al final. Cada instrucción termina con punto y coma y los bloques se marcan con ' +
      'llaves. Java distingue mayúsculas de minúsculas.',
    ejemplo: {
      titulo: 'El programa mínimo',
      codigo: 'public class Hola {\n    public static void main(String[] args) {\n        System.out.println("Hola Sintaxia");\n    }\n}',
      nota: 'El archivo tiene que llamarse igual que la clase pública: Hola.java.'
    },
    actividades: [
      {
        consigna: '¿Desde qué método empieza a ejecutarse un programa en Java?',
        opciones: ['start()', 'main()', 'run()', 'init()'],
        correcta: 1,
        explicacion: 'La máquina virtual de Java busca public static void main(String[] args) para arrancar.'
      },
      {
        consigna: '¿Qué instrucción muestra un texto y salta de línea?',
        opciones: ['print("Hola");', 'console.log("Hola");', 'System.out.println("Hola");', 'echo "Hola";'],
        correcta: 2,
        explicacion: 'System.out.println escribe el texto y un salto de línea. System.out.print no salta de línea.'
      },
      {
        consigna: '¿Cómo terminan las instrucciones en Java?',
        opciones: ['Con punto y coma', 'Con un salto de línea', 'Con dos puntos', 'Con la palabra end'],
        correcta: 0,
        explicacion: 'Cada instrucción termina en ;. Olvidarlo es un error de compilación.'
      },
      {
        consigna: 'Si la clase pública se llama Juego, ¿cómo debe llamarse el archivo?',
        opciones: ['Juego.txt', 'Juego.class', 'Juego.java', 'main.java'],
        correcta: 2,
        explicacion: 'El archivo lleva el mismo nombre que la clase pública, respetando mayúsculas: Juego.java. El .class lo genera el compilador.'
      }
    ]
  }),
  leccion('java-u1', 2, {
    titulo: 'Tipos y variables',
    descripcion: 'Declarar variables con su tipo.',
    icono: 'variable',
    explicacion:
      'Java tiene tipado estático: cada variable se declara con su tipo y no puede cambiarlo. Los tipos ' +
      'primitivos más usados son int (enteros), double (decimales), boolean (true o false) y char (un ' +
      'carácter, entre comillas simples). String guarda texto entre comillas dobles y es una clase, por eso ' +
      'va con mayúscula. Dividir dos int da un int: se pierde la parte decimal.',
    ejemplo: {
      titulo: 'Declarar variables',
      codigo: 'int edad = 16;\ndouble precio = 99.5;\nboolean activo = true;\nchar inicial = \'A\';\nString nombre = "Ana";\nSystem.out.println(7 / 2);   // 3',
      nota: 'Para obtener 3.5 hay que dividir con un double: 7.0 / 2.'
    },
    actividades: [
      {
        consigna: '¿Cuál declara correctamente una variable entera?',
        opciones: ['edad = 16;', 'int edad = 16;', 'let edad = 16;', 'integer edad := 16;'],
        correcta: 1,
        explicacion: 'En Java se escribe el tipo, el nombre y el valor: int edad = 16;'
      },
      {
        consigna: '¿Qué tipo usarías para guardar 3.75?',
        opciones: ['int', 'char', 'boolean', 'double'],
        correcta: 3,
        explicacion: 'double guarda números con decimales. int solo enteros.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'int a = 7;\nint b = 2;\nSystem.out.println(a / b);',
        opciones: ['3.5', '3', '4', 'Un error'],
        correcta: 1,
        explicacion: 'La división entre dos int descarta los decimales: 7 / 2 da 3.'
      },
      {
        consigna: '¿Por qué String se escribe con mayúscula?',
        opciones: ['Porque es una clase, no un tipo primitivo', 'Es un error común', 'Porque es una constante', 'Da lo mismo'],
        correcta: 0,
        explicacion: 'Los tipos primitivos (int, double...) van en minúscula; String es una clase, y las clases empiezan con mayúscula.'
      }
    ]
  }),
  leccion('java-u2', 1, {
    titulo: 'Clases y objetos',
    descripcion: 'Moldes y las cosas que se crean con ellos.',
    icono: 'pieza',
    explicacion:
      'Una clase es un molde que define qué datos (atributos) y qué acciones (métodos) tiene algo. Un objeto ' +
      'es una instancia concreta creada a partir de la clase con new. Cada objeto tiene sus propios valores ' +
      'en los atributos. Con el punto se accede a los atributos y métodos de un objeto, y private hace que ' +
      'un atributo solo se pueda usar dentro de su clase.',
    ejemplo: {
      titulo: 'Una clase Perro',
      codigo: 'class Perro {\n    String nombre;\n    void ladrar() {\n        System.out.println(nombre + " dice guau");\n    }\n}\n\nPerro p = new Perro();\np.nombre = "Toby";\np.ladrar();   // Toby dice guau',
      nota: 'Perro es la clase; p es un objeto de esa clase.'
    },
    actividades: [
      {
        consigna: '¿Qué palabra crea un objeto nuevo a partir de una clase?',
        opciones: ['create', 'new', 'make', 'object'],
        correcta: 1,
        explicacion: 'new reserva memoria para el objeto y llama a su constructor.'
      },
      {
        consigna: '¿Qué es una clase?',
        opciones: ['Un objeto ya creado', 'Una variable global', 'Un molde que define atributos y métodos', 'Un archivo de texto'],
        correcta: 2,
        explicacion: 'La clase define cómo son los objetos; cada objeto es una instancia de ella.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'Perro a = new Perro();\na.nombre = "Luna";\nPerro b = new Perro();\nb.nombre = "Toby";\nSystem.out.println(a.nombre);',
        opciones: ['Toby', 'Luna', 'null', 'Luna Toby'],
        correcta: 1,
        explicacion: 'a y b son objetos distintos: cada uno guarda su propio nombre.'
      },
      {
        consigna: '¿Qué hace private en un atributo?',
        opciones: ['Lo vuelve constante', 'Lo comparte entre todas las clases', 'Solo se puede usar dentro de su clase', 'Lo borra al terminar'],
        correcta: 2,
        explicacion: 'private oculta el atributo fuera de la clase: es la base del encapsulamiento.'
      }
    ]
  }),
  leccion('java-u2', 2, {
    titulo: 'Constructores y métodos',
    descripcion: 'Inicializar objetos y darles comportamiento.',
    icono: 'saltar',
    explicacion:
      'El constructor es un método especial que se ejecuta al hacer new: se llama igual que la clase y no ' +
      'tiene tipo de retorno. Sirve para dar valores iniciales; this se refiere al objeto que se está ' +
      'creando. Un método declara qué devuelve (o void si no devuelve nada) y usa return para entregar el ' +
      'resultado.',
    ejemplo: {
      titulo: 'Constructor y método',
      codigo: 'class Rectangulo {\n    double ancho, alto;\n    Rectangulo(double ancho, double alto) {\n        this.ancho = ancho;\n        this.alto = alto;\n    }\n    double area() {\n        return ancho * alto;\n    }\n}\n\nRectangulo r = new Rectangulo(3, 4);\nSystem.out.println(r.area());   // 12.0',
      nota: 'this.ancho es el atributo; ancho, a secas, es el parámetro.'
    },
    actividades: [
      {
        consigna: '¿Cómo se llama el constructor de la clase Auto?',
        opciones: ['constructor', 'init', 'Auto', 'new'],
        correcta: 2,
        explicacion: 'El constructor tiene el mismo nombre que la clase y no declara tipo de retorno.'
      },
      {
        consigna: '¿Qué significa void en un método?',
        opciones: ['Que no devuelve nada', 'Que es privado', 'Que no recibe parámetros', 'Que es estático'],
        correcta: 0,
        explicacion: 'void indica que el método no devuelve un valor.'
      },
      {
        consigna: 'Dentro de un constructor, ¿a qué se refiere this?',
        opciones: ['A la clase padre', 'Al objeto que se está creando', 'Al método main', 'A la última variable usada'],
        correcta: 1,
        explicacion: 'this es una referencia al propio objeto: this.ancho es su atributo ancho.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'Rectangulo r = new Rectangulo(2, 5);\nSystem.out.println(r.area());',
        opciones: ['7.0', '10.0', '2.0', 'Un error'],
        correcta: 1,
        explicacion: 'area() devuelve ancho * alto: 2 * 5 = 10.0 (es double).'
      }
    ]
  })
]

// ===========================================================================
//  C++
// ===========================================================================
const unidadesCpp = [
  unidad('cpp', 'cpp', 1, {
    titulo: 'Primeros pasos',
    descripcion: 'Un programa en C++, la salida por pantalla y los tipos básicos.',
    icono: 'cohete', color: '#00599c', temas: ['#include', 'main', 'cout', 'Tipos'], publicada: true
  }),
  unidad('cpp', 'cpp', 2, {
    titulo: 'Referencias y punteros',
    descripcion: 'Cómo C++ te deja trabajar directamente con la memoria.',
    icono: 'flechaDiana', color: '#7434db', temas: ['Direcciones', 'Referencias &', 'Punteros *', 'nullptr'], publicada: true
  }),
  unidad('cpp', 'cpp', 3, {
    titulo: 'Structs y clases',
    descripcion: 'Agrupar datos y comportamiento.',
    icono: 'pieza', color: '#2fbf56', temas: ['struct', 'class', 'Constructores', 'Destructores'], publicada: true
  }),
  unidad('cpp', 'cpp', 4, {
    titulo: 'Memoria dinámica',
    descripcion: 'Pedir y liberar memoria sin perder nada.',
    icono: 'caja', color: '#1cb0f6', temas: ['new y delete', 'Fugas de memoria', 'Punteros inteligentes'], publicada: true
  })
]

const leccionesCpp = [
  leccion('cpp-u1', 1, {
    titulo: 'Hola, C++',
    descripcion: 'La estructura de un programa y cómo mostrar texto.',
    icono: 'estrella',
    explicacion:
      'C++ es un lenguaje compilado: el código se traduce a un programa ejecutable antes de correrlo. Todo ' +
      'programa empieza en la función int main(). Para mostrar texto se usa std::cout con el operador <<, ' +
      'que viene de la biblioteca <iostream>, incluida con #include. std::endl (o "\\n") salta de línea y ' +
      'main devuelve 0 para indicar que todo salió bien.',
    ejemplo: {
      titulo: 'El programa mínimo',
      codigo: '#include <iostream>\n\nint main() {\n    std::cout << "Hola Sintaxia" << std::endl;\n    return 0;\n}',
      nota: 'Con using namespace std; se puede escribir cout en lugar de std::cout.'
    },
    actividades: [
      {
        consigna: '¿Qué biblioteca hay que incluir para usar std::cout?',
        opciones: ['<stdio>', '<iostream>', '<console>', '<string>'],
        correcta: 1,
        explicacion: 'cout y cin están en <iostream> (input/output stream).'
      },
      {
        consigna: '¿Qué operador se usa para mandar texto a std::cout?',
        opciones: ['>>', '<<', '->', '+='],
        correcta: 1,
        explicacion: '<< "inserta" en la salida. >> se usa con cin para leer.'
      },
      {
        consigna: '¿Desde qué función empieza un programa en C++?',
        opciones: ['start()', 'Main()', 'int main()', 'program()'],
        correcta: 2,
        explicacion: 'Todo programa en C++ arranca en int main(). C++ distingue mayúsculas: Main no sirve.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'std::cout << 2 + 3 << std::endl;',
        opciones: ['2 + 3', '23', '5', 'Un error'],
        correcta: 2,
        explicacion: 'Primero se calcula 2 + 3 y después se manda el 5 a la salida.'
      }
    ]
  }),
  leccion('cpp-u1', 2, {
    titulo: 'Tipos y variables',
    descripcion: 'Declarar variables y leer datos con cin.',
    icono: 'variable',
    explicacion:
      'Como en Java, cada variable se declara con su tipo: int (enteros), double (decimales), bool (true o ' +
      'false), char (un carácter) y std::string (texto, de la biblioteca <string>). const hace que el valor ' +
      'no se pueda cambiar. std::cin >> variable lee lo que escribe la persona. Una variable sin inicializar ' +
      'tiene un valor basura: conviene darle siempre un valor inicial.',
    ejemplo: {
      titulo: 'Leer y mostrar',
      codigo: '#include <iostream>\n#include <string>\n\nint main() {\n    const double PI = 3.14159;\n    int edad = 0;\n    std::cin >> edad;\n    std::cout << "Tenés " << edad << " años\\n";\n}',
      nota: 'Intentar cambiar PI después da error de compilación.'
    },
    actividades: [
      {
        consigna: '¿Qué palabra hace que una variable no se pueda modificar?',
        opciones: ['static', 'final', 'const', 'fixed'],
        correcta: 2,
        explicacion: 'En C++ se usa const. final es de Java.'
      },
      {
        consigna: '¿Cómo se lee un número que escribe la persona?',
        opciones: ['std::cout >> n;', 'std::cin >> n;', 'std::cin << n;', 'input(n);'],
        correcta: 1,
        explicacion: 'cin lee de la entrada con >>. cout es para mostrar.'
      },
      {
        consigna: '¿Qué valor tiene una variable int declarada sin inicializar dentro de una función?',
        opciones: ['Siempre 0', 'Un valor indeterminado (basura)', 'null', 'Da error al compilar'],
        correcta: 1,
        explicacion: 'Una variable local sin inicializar tiene lo que haya en esa memoria. Por eso conviene inicializarla siempre.'
      },
      {
        consigna: '¿Qué tipo guarda un texto como "Hola"?',
        opciones: ['char', 'std::string', 'text', 'int'],
        correcta: 1,
        explicacion: 'std::string guarda texto. char guarda un solo carácter, como \'H\'.'
      }
    ]
  }),
  leccion('cpp-u2', 1, {
    titulo: 'Referencias',
    descripcion: 'Otro nombre para la misma variable.',
    icono: 'flechaDiana',
    explicacion:
      'Una referencia es un alias: otro nombre para una variable que ya existe. Se declara con & después del ' +
      'tipo (int& r = x;) y desde entonces cambiar r es cambiar x. Se usan mucho en parámetros: si una ' +
      'función recibe int& n, trabaja sobre la variable original y no sobre una copia. Una referencia tiene ' +
      'que inicializarse al declararla y no puede pasar a referirse a otra variable.',
    ejemplo: {
      titulo: 'Por copia y por referencia',
      codigo: 'void sumarUnoCopia(int n) { n++; }\nvoid sumarUno(int& n) { n++; }\n\nint x = 5;\nsumarUnoCopia(x);   // x sigue en 5\nsumarUno(x);        // x pasa a 6',
      nota: 'Pasar por referencia también evita copiar objetos grandes.'
    },
    actividades: [
      {
        consigna: '¿Cómo se declara una referencia r a la variable x de tipo int?',
        opciones: ['int* r = x;', 'int& r = x;', 'ref int r = x;', 'int r = &x;'],
        correcta: 1,
        explicacion: 'Con & después del tipo: int& r = x; int* es un puntero.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'int x = 10;\nint& r = x;\nr = 20;\nstd::cout << x;',
        opciones: ['10', '20', '30', 'Un error'],
        correcta: 1,
        explicacion: 'r es otro nombre para x: asignar 20 a r cambia x.'
      },
      {
        consigna: 'Una función recibe int n (sin &). Si adentro hace n++, ¿qué pasa con la variable original?',
        opciones: ['Aumenta en 1', 'No cambia: la función trabaja con una copia', 'Se borra', 'Da error'],
        correcta: 1,
        explicacion: 'Sin &, el parámetro se pasa por valor: es una copia y la original no cambia.'
      },
      {
        consigna: '¿Cuál de estas afirmaciones sobre las referencias es cierta?',
        opciones: ['Pueden quedar sin inicializar', 'Pueden cambiar a qué variable se refieren', 'Hay que inicializarlas al declararlas', 'Ocupan siempre 8 bytes'],
        correcta: 2,
        explicacion: 'Una referencia se ata a una variable al declararla y queda atada a ella para siempre.'
      }
    ]
  }),
  leccion('cpp-u2', 2, {
    titulo: 'Punteros',
    descripcion: 'Variables que guardan direcciones de memoria.',
    icono: 'puntero',
    explicacion:
      'Cada variable vive en una dirección de memoria, que se obtiene con & (&x). Un puntero es una variable ' +
      'que guarda una dirección: int* p = &x;. Con * delante del puntero (desreferenciar) se accede al valor ' +
      'que está en esa dirección. nullptr indica que un puntero no apunta a nada, y desreferenciar un ' +
      'puntero nulo hace fallar el programa.',
    ejemplo: {
      titulo: 'Apuntar y desreferenciar',
      codigo: 'int x = 5;\nint* p = &x;    // p guarda la dirección de x\n*p = 8;         // cambia x a través de p\nstd::cout << x; // 8\n\nint* nada = nullptr;',
      nota: 'En int* p el * es parte del tipo; en *p = 8 es el operador que desreferencia.'
    },
    actividades: [
      {
        consigna: '¿Qué guarda un puntero?',
        opciones: ['Un número entero cualquiera', 'Una dirección de memoria', 'Una copia de otra variable', 'Un texto'],
        correcta: 1,
        explicacion: 'Un puntero guarda la dirección de memoria de otra variable.'
      },
      {
        consigna: '¿Qué operador da la dirección de memoria de x?',
        opciones: ['*x', '&x', '->x', '#x'],
        correcta: 1,
        explicacion: '&x es "la dirección de x". *p es "lo que hay en la dirección p".'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'int a = 3;\nint* p = &a;\n*p = *p + 4;\nstd::cout << a;',
        opciones: ['3', '4', '7', 'La dirección de a'],
        correcta: 2,
        explicacion: '*p es a: se le suma 4 y a pasa a valer 7.'
      },
      {
        consigna: '¿Qué valor se usa para indicar que un puntero no apunta a nada?',
        opciones: ['0x00', 'void', 'nullptr', 'empty'],
        correcta: 2,
        explicacion: 'Desde C++11 se usa nullptr. Desreferenciarlo hace fallar el programa, así que hay que chequearlo antes.'
      }
    ]
  })
]

/** Unidades de los cursos nuevos (con `publicada` para saber cuales tienen contenido). */
export const unidadesCursosNuevos = [...unidadesPython, ...unidadesHtml, ...unidadesSql, ...unidadesJava, ...unidadesCpp]

/** Lecciones de los cursos nuevos, con sus actividades. */
export const leccionesCursosNuevos = [...leccionesPython, ...leccionesHtml, ...leccionesSql, ...leccionesJava, ...leccionesCpp]
