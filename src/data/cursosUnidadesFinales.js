import { leccion } from './armarContenido.js'

/**
 * Las ultimas unidades de Python, HTML y CSS, SQL, Java y C++ (las primeras dos de
 * cada curso estan en src/data/cursosNuevos.js, junto con la definicion de todas
 * las unidades). Mismo formato: dos lecciones de cuatro actividades por unidad.
 *
 * La app no lee este archivo: se usa para generar supabase/02-datos-iniciales.sql.
 */

// ===========================================================================
//  PYTHON
// ===========================================================================
const python = [
  leccion('py-u3', 1, {
    titulo: 'Listas',
    descripcion: 'Guardar varios valores en orden y recorrerlos.',
    icono: 'caja',
    explicacion:
      'Una lista guarda varios valores en orden, entre corchetes y separados por comas. Cada elemento se ' +
      'lee por su índice, que empieza en 0; los índices negativos cuentan desde el final (-1 es el último). ' +
      'len() dice cuántos elementos tiene, append() agrega uno al final y el operador in pregunta si un ' +
      'valor está en la lista. Con for se recorre elemento por elemento.',
    ejemplo: {
      titulo: 'Una lista de frutas',
      codigo: 'frutas = ["pera", "uva", "kiwi"]\nprint(frutas[0])    # pera\nprint(frutas[-1])   # kiwi\nfrutas.append("mango")\nprint(len(frutas))  # 4\nfor f in frutas:\n    print(f)',
      nota: 'Las listas se pueden modificar después de creadas.'
    },
    actividades: [
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'nums = [10, 20, 30]\nprint(nums[1])',
        opciones: ['10', '20', '30', 'Un error'],
        correcta: 1,
        explicacion: 'Los índices empiezan en 0: el índice 1 es el segundo elemento, 20.'
      },
      {
        consigna: '¿Qué método agrega un elemento al final de una lista?',
        opciones: ['push()', 'add()', 'append()', 'insert_end()'],
        correcta: 2,
        explicacion: 'En Python se usa append(). push() es de JavaScript.'
      },
      {
        consigna: '¿Qué devuelve colores[-1]?',
        codigo: 'colores = ["rojo", "verde", "azul"]',
        opciones: ['"rojo"', '"azul"', 'Un error', '"verde"'],
        correcta: 1,
        explicacion: 'Los índices negativos cuentan desde el final: -1 es el último elemento.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'print("uva" in ["pera", "uva"])',
        opciones: ['True', 'False', '1', '"uva"'],
        correcta: 0,
        explicacion: 'in devuelve True si el valor está en la lista.'
      }
    ]
  }),
  leccion('py-u3', 2, {
    titulo: 'Diccionarios',
    descripcion: 'Guardar datos con nombre: pares clave y valor.',
    icono: 'carpetas',
    explicacion:
      'Un diccionario guarda pares clave: valor entre llaves. En lugar de una posición, cada valor se busca ' +
      'por su clave: alumno["nombre"]. Asignar a una clave nueva la agrega y asignar a una existente cambia ' +
      'su valor. get() devuelve None (o un valor por defecto) si la clave no existe, en vez de dar error, y ' +
      'items() permite recorrer clave y valor a la vez.',
    ejemplo: {
      titulo: 'Un alumno',
      codigo: 'alumno = {"nombre": "Ana", "edad": 16}\nprint(alumno["nombre"])        # Ana\nalumno["curso"] = "5A"          # agrega una clave\nprint(alumno.get("mail", "-"))  # -\nfor clave, valor in alumno.items():\n    print(clave, valor)',
      nota: 'Las claves no se repiten: asignar dos veces la misma reemplaza el valor.'
    },
    actividades: [
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'precios = {"pan": 900, "leche": 1200}\nprint(precios["leche"])',
        opciones: ['900', '1200', '"leche"', 'Un error'],
        correcta: 1,
        explicacion: 'Se busca el valor por su clave: "leche" vale 1200.'
      },
      {
        consigna: '¿Qué pasa si se busca con [] una clave que no existe?',
        opciones: ['Devuelve None', 'Devuelve 0', 'Da un error (KeyError)', 'Crea la clave vacía'],
        correcta: 2,
        explicacion: 'Con [] da KeyError. Para evitarlo se usa get(), que devuelve None o un valor por defecto.'
      },
      {
        consigna: '¿Cómo se agrega la clave "color" con el valor "rojo" al diccionario auto?',
        opciones: ['auto.append("color", "rojo")', 'auto["color"] = "rojo"', 'auto.color = "rojo"', 'auto + {"color": "rojo"}'],
        correcta: 1,
        explicacion: 'Asignar a una clave nueva la agrega al diccionario.'
      },
      {
        consigna: '¿Qué devuelve len() de este diccionario?',
        codigo: 'd = {"a": 1, "b": 2, "c": 3}',
        opciones: ['3', '6', '2', '1'],
        correcta: 0,
        explicacion: 'len() cuenta los pares clave: valor, que son 3.'
      }
    ]
  }),
  leccion('py-u4', 1, {
    titulo: 'Definir funciones',
    descripcion: 'Agrupar código con def y devolver resultados.',
    icono: 'pieza',
    explicacion:
      'Una función se define con def, su nombre, los parámetros entre paréntesis y dos puntos; el cuerpo va ' +
      'sangrado. return devuelve un resultado y termina la función; si no hay return, devuelve None. Los ' +
      'parámetros pueden tener un valor por defecto, que se usa cuando no se pasa ese argumento.',
    ejemplo: {
      titulo: 'Funciones simples',
      codigo: 'def doble(n):\n    return n * 2\n\ndef saludar(nombre="amigo"):\n    print("Hola", nombre)\n\nprint(doble(4))   # 8\nsaludar()         # Hola amigo\nsaludar("Ana")    # Hola Ana',
      nota: 'Una función no hace nada hasta que se la llama.'
    },
    actividades: [
      {
        consigna: '¿Con qué palabra se define una función en Python?',
        opciones: ['function', 'def', 'func', 'fn'],
        correcta: 1,
        explicacion: 'Python usa def. function es de JavaScript.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'def area(b, h):\n    return b * h\n\nprint(area(3, 5))',
        opciones: ['8', '15', '35', 'None'],
        correcta: 1,
        explicacion: 'area devuelve b * h: 3 * 5 = 15.'
      },
      {
        consigna: '¿Qué devuelve una función que no tiene return?',
        opciones: ['0', 'False', 'None', 'Un error'],
        correcta: 2,
        explicacion: 'Sin return, una función devuelve None.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'def potencia(base, exp=2):\n    return base ** exp\n\nprint(potencia(3))',
        opciones: ['6', '9', '3', '27'],
        correcta: 1,
        explicacion: 'exp vale 2 por defecto: 3 ** 2 = 9.'
      }
    ]
  }),
  leccion('py-u4', 2, {
    titulo: 'Alcance y buenas prácticas',
    descripcion: 'Dónde existe cada variable y cómo escribir funciones claras.',
    icono: 'flechaDiana',
    explicacion:
      'Las variables creadas dentro de una función son locales: solo existen mientras corre la función. Las ' +
      'de afuera son globales y se pueden leer desde adentro, pero para cambiarlas haría falta global, algo ' +
      'que conviene evitar: es mejor recibir datos por parámetros y devolver resultados con return. Una ' +
      'buena función hace una sola cosa y tiene un nombre que lo dice.',
    ejemplo: {
      titulo: 'Local y global',
      codigo: 'total = 0\n\ndef sumar(a, b):\n    resultado = a + b   # local\n    return resultado\n\ntotal = sumar(2, 3)\nprint(total)        # 5\n# print(resultado)  # error: no existe afuera',
      nota: 'Devolver el resultado es más claro que modificar variables globales.'
    },
    actividades: [
      {
        consigna: '¿Qué pasa si se usa afuera una variable creada dentro de una función?',
        opciones: ['Funciona igual', 'Da error: solo existe dentro de la función', 'Vale 0', 'Vale None'],
        correcta: 1,
        explicacion: 'Las variables locales desaparecen al terminar la función.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'x = 10\n\ndef cambiar():\n    x = 99\n\ncambiar()\nprint(x)',
        opciones: ['99', '10', 'None', 'Un error'],
        correcta: 1,
        explicacion: 'x = 99 dentro de la función crea una variable local nueva; la global sigue valiendo 10.'
      },
      {
        consigna: '¿Cuál es la forma más clara de que una función entregue un resultado?',
        opciones: ['Cambiar una variable global', 'Usar print() adentro', 'Devolverlo con return', 'Guardarlo en un archivo'],
        correcta: 2,
        explicacion: 'Con return quien llama decide qué hacer con el resultado.'
      },
      {
        consigna: '¿Qué nombre describe mejor una función que calcula el promedio de una lista?',
        opciones: ['f', 'hacer', 'calcular_promedio', 'lista2'],
        correcta: 2,
        explicacion: 'Un buen nombre dice qué hace la función. En Python se usa snake_case.'
      }
    ]
  })
]

// ===========================================================================
//  HTML Y CSS
// ===========================================================================
const html = [
  leccion('web-u3', 1, {
    titulo: 'Filas y columnas con flex',
    descripcion: 'Acomodar elementos en una dirección.',
    icono: 'caja',
    explicacion:
      'Con display: flex un contenedor acomoda a sus hijos en una fila (por defecto). flex-direction: column ' +
      'los pone en columna. gap deja espacio entre ellos sin usar margin. flex-wrap: wrap permite que bajen ' +
      'a otra línea cuando no entran. Las propiedades flex se ponen en el CONTENEDOR, no en cada hijo.',
    ejemplo: {
      titulo: 'Una barra de botones',
      codigo: '.barra {\n  display: flex;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n.columna {\n  display: flex;\n  flex-direction: column;\n}',
      nota: 'flex: 1 en un hijo hace que ocupe el espacio que sobra.'
    },
    actividades: [
      {
        consigna: '¿Qué propiedad convierte un elemento en contenedor flex?',
        opciones: ['flex: on', 'display: flex', 'position: flex', 'layout: flex'],
        correcta: 1,
        explicacion: 'display: flex activa flexbox en el contenedor.'
      },
      {
        consigna: 'Con display: flex y sin nada más, ¿cómo quedan los hijos?',
        opciones: ['Uno debajo del otro', 'En una fila', 'Superpuestos', 'Ocultos'],
        correcta: 1,
        explicacion: 'La dirección por defecto es row: en fila.'
      },
      {
        consigna: '¿Qué propiedad deja espacio entre los hijos de un contenedor flex?',
        opciones: ['gap', 'padding', 'space', 'border-spacing'],
        correcta: 0,
        explicacion: 'gap separa los elementos entre sí sin agregar espacio en los bordes.'
      },
      {
        consigna: '¿Qué hace flex-wrap: wrap?',
        opciones: ['Ordena los hijos al revés', 'Permite que los hijos bajen a otra línea si no entran', 'Oculta los que no entran', 'Los centra'],
        correcta: 1,
        explicacion: 'Sin wrap, los hijos se achican para entrar en una sola línea.'
      }
    ]
  }),
  leccion('web-u3', 2, {
    titulo: 'Alinear con flexbox',
    descripcion: 'Centrar y repartir el espacio.',
    icono: 'balanza',
    explicacion:
      'justify-content reparte los hijos en el eje principal (el horizontal, en una fila): flex-start, ' +
      'center, flex-end, space-between (los extremos pegados a los bordes) o space-around. align-items los ' +
      'alinea en el eje cruzado (el vertical, en una fila): stretch, center, flex-start o flex-end. Con ' +
      'justify-content: center y align-items: center se centra algo en las dos direcciones.',
    ejemplo: {
      titulo: 'Centrar una tarjeta',
      codigo: '.pantalla {\n  display: flex;\n  justify-content: center;  /* horizontal */\n  align-items: center;      /* vertical */\n  min-height: 100vh;\n}',
      nota: 'En flex-direction: column los ejes se intercambian.'
    },
    actividades: [
      {
        consigna: 'En una fila, ¿qué propiedad reparte los elementos horizontalmente?',
        opciones: ['align-items', 'justify-content', 'text-align', 'vertical-align'],
        correcta: 1,
        explicacion: 'justify-content trabaja sobre el eje principal, que en una fila es el horizontal.'
      },
      {
        consigna: '¿Qué valor de justify-content pega el primer elemento a la izquierda y el último a la derecha?',
        opciones: ['center', 'space-between', 'flex-end', 'stretch'],
        correcta: 1,
        explicacion: 'space-between reparte el espacio entre los elementos y deja los extremos en los bordes.'
      },
      {
        consigna: '¿Cómo se centra un elemento horizontal y verticalmente dentro de un contenedor flex?',
        opciones: ['margin: center', 'justify-content: center y align-items: center', 'text-align: center', 'position: center'],
        correcta: 1,
        explicacion: 'Una propiedad centra en cada eje.'
      },
      {
        consigna: 'Con flex-direction: column, ¿qué alinea justify-content?',
        opciones: ['El eje horizontal', 'El eje vertical', 'Nada', 'El texto'],
        correcta: 1,
        explicacion: 'En columna, el eje principal pasa a ser el vertical.'
      }
    ]
  }),
  leccion('web-u4', 1, {
    titulo: 'Media queries',
    descripcion: 'Cambiar los estilos según el ancho de la pantalla.',
    icono: 'puntero',
    explicacion:
      'Una media query aplica estilos solo cuando se cumple una condición, por ejemplo un ancho de pantalla. ' +
      '@media (max-width: 600px) { ... } vale para pantallas de hasta 600 px. Conviene diseñar primero para ' +
      'el celular (mobile first) y agregar con min-width lo que cambia en pantallas grandes. La etiqueta ' +
      '<meta name="viewport" content="width=device-width, initial-scale=1"> hace que el celular use su ancho real.',
    ejemplo: {
      titulo: 'De una a dos columnas',
      codigo: '.tarjetas {\n  display: flex;\n  flex-direction: column;\n}\n@media (min-width: 700px) {\n  .tarjetas {\n    flex-direction: row;\n  }\n}',
      nota: 'Sin la etiqueta viewport, el celular muestra la página como si fuera una pantalla de compu achicada.'
    },
    actividades: [
      {
        consigna: '¿Cuándo se aplican los estilos de @media (max-width: 600px)?',
        opciones: ['En pantallas de 600 px o menos', 'En pantallas de más de 600 px', 'Siempre', 'Solo al imprimir'],
        correcta: 0,
        explicacion: 'max-width: hasta ese ancho como máximo.'
      },
      {
        consigna: '¿Qué significa diseñar "mobile first"?',
        opciones: ['Hacer solo la versión de celular', 'Empezar por el celular y agregar estilos para pantallas grandes', 'Usar solo imágenes chicas', 'Probar primero en una tablet'],
        correcta: 1,
        explicacion: 'Se escriben los estilos base para el celular y se suman cambios con min-width.'
      },
      {
        consigna: '¿Qué etiqueta hace que el celular use su ancho real en lugar de achicar la página?',
        opciones: ['<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta charset="utf-8">', '<link rel="mobile">', '<body responsive>'],
        correcta: 0,
        explicacion: 'La meta viewport es imprescindible para un diseño responsivo.'
      },
      {
        consigna: 'En una pantalla de 900 px, ¿qué dirección tienen las tarjetas?',
        codigo: '.tarjetas { display: flex; flex-direction: column; }\n@media (min-width: 700px) {\n  .tarjetas { flex-direction: row; }\n}',
        opciones: ['column', 'row', 'Ninguna', 'Depende del navegador'],
        correcta: 1,
        explicacion: '900 px cumple min-width: 700px, así que se aplica flex-direction: row.'
      }
    ]
  }),
  leccion('web-u4', 2, {
    titulo: 'Unidades relativas e imágenes flexibles',
    descripcion: 'Tamaños que se adaptan a la pantalla.',
    icono: 'globo',
    explicacion:
      'Los px son fijos; las unidades relativas se adaptan. % es relativo al contenedor, rem al tamaño de ' +
      'letra de la página (1rem suele ser 16 px), em al tamaño de letra del propio elemento y vw/vh al ' +
      'ancho/alto de la ventana (100vw es todo el ancho). Para que una imagen nunca se salga de su ' +
      'contenedor se usa max-width: 100% y height: auto.',
    ejemplo: {
      titulo: 'Tamaños flexibles',
      codigo: 'h1 {\n  font-size: 2rem;     /* el doble de la letra base */\n}\n.contenedor {\n  width: 90%;\n  max-width: 960px;\n}\nimg {\n  max-width: 100%;\n  height: auto;\n}',
      nota: 'height: auto mantiene la proporción de la imagen.'
    },
    actividades: [
      {
        consigna: 'Si la letra base de la página es 16 px, ¿cuánto mide 2rem?',
        opciones: ['2 px', '16 px', '32 px', '18 px'],
        correcta: 2,
        explicacion: '1rem es la letra base: 2rem = 2 × 16 = 32 px.'
      },
      {
        consigna: '¿Qué hace max-width: 100% en una imagen?',
        opciones: ['La agranda siempre al 100%', 'Evita que sea más ancha que su contenedor', 'La oculta en el celular', 'La recorta'],
        correcta: 1,
        explicacion: 'La imagen puede ser más chica, pero nunca más ancha que su contenedor.'
      },
      {
        consigna: '¿A qué equivale 50vw?',
        opciones: ['A la mitad del ancho de la ventana', 'A 50 px', 'A la mitad del alto de la ventana', 'Al 50% del contenedor'],
        correcta: 0,
        explicacion: 'vw es 1% del ancho de la ventana (viewport width).'
      },
      {
        consigna: '¿Para qué sirve height: auto junto con max-width: 100% en una imagen?',
        opciones: ['Para mantener su proporción', 'Para que ocupe toda la pantalla', 'Para darle un borde', 'Para centrarla'],
        correcta: 0,
        explicacion: 'Si el ancho se achica, el alto se ajusta solo y la imagen no se deforma.'
      }
    ]
  })
]

// ===========================================================================
//  SQL
// ===========================================================================
const sql = [
  leccion('sql-u3', 1, {
    titulo: 'INSERT y UPDATE',
    descripcion: 'Agregar filas nuevas y cambiar las que existen.',
    icono: 'variable',
    explicacion:
      'INSERT INTO tabla (columnas) VALUES (valores) agrega una fila nueva; los valores van en el mismo orden ' +
      'que las columnas. UPDATE tabla SET columna = valor cambia filas que ya existen, y casi siempre lleva ' +
      'un WHERE: sin WHERE, el cambio se aplica a TODAS las filas de la tabla.',
    ejemplo: {
      titulo: 'Agregar y modificar',
      codigo: "INSERT INTO alumnos (nombre, edad)\nVALUES ('Ana', 16);\n\nUPDATE alumnos\nSET edad = 17\nWHERE nombre = 'Ana';",
      nota: 'Antes de un UPDATE conviene probar el WHERE con un SELECT.'
    },
    actividades: [
      {
        consigna: '¿Qué instrucción agrega una fila nueva?',
        opciones: ['ADD ROW', 'INSERT INTO', 'UPDATE', 'CREATE ROW'],
        correcta: 1,
        explicacion: 'INSERT INTO ... VALUES ... agrega filas.'
      },
      {
        consigna: '¿Qué pasa con este UPDATE?',
        codigo: 'UPDATE productos SET precio = 0;',
        opciones: ['No hace nada', 'Pone precio 0 en TODOS los productos', 'Da error por falta de WHERE', 'Cambia solo el primero'],
        correcta: 1,
        explicacion: 'Sin WHERE, UPDATE se aplica a todas las filas.'
      },
      {
        consigna: '¿Cuál de estos INSERT es correcto?',
        opciones: ["INSERT alumnos ('Ana', 16);", "INSERT INTO alumnos (nombre, edad) VALUES ('Ana', 16);", "INSERT INTO alumnos SET nombre = 'Ana';", "INSERT VALUES ('Ana', 16) INTO alumnos;"],
        correcta: 1,
        explicacion: 'INSERT INTO tabla (columnas) VALUES (valores).'
      },
      {
        consigna: '¿Qué palabra introduce los nuevos valores en un UPDATE?',
        opciones: ['VALUES', 'SET', 'TO', 'NEW'],
        correcta: 1,
        explicacion: 'UPDATE tabla SET columna = valor WHERE ...'
      }
    ]
  }),
  leccion('sql-u3', 2, {
    titulo: 'DELETE y transacciones',
    descripcion: 'Borrar con cuidado y confirmar o deshacer cambios.',
    icono: 'balanza',
    explicacion:
      'DELETE FROM tabla WHERE condición borra las filas que cumplen la condición; sin WHERE borra todas. ' +
      'Una transacción agrupa varias instrucciones para que se apliquen todas juntas o ninguna: empieza con ' +
      'BEGIN, COMMIT confirma los cambios y ROLLBACK los deshace. Es lo que evita, por ejemplo, que una ' +
      'transferencia descuente plata de una cuenta sin sumarla en la otra.',
    ejemplo: {
      titulo: 'Una transferencia',
      codigo: 'BEGIN;\nUPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;\nUPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;\nCOMMIT;\n\nDELETE FROM sesiones WHERE vence < NOW();',
      nota: 'Si algo falla antes del COMMIT, ROLLBACK deja todo como estaba.'
    },
    actividades: [
      {
        consigna: '¿Qué hace DELETE FROM alumnos; (sin WHERE)?',
        opciones: ['Borra la tabla entera, con su estructura', 'Borra todas las filas', 'No hace nada', 'Borra la primera fila'],
        correcta: 1,
        explicacion: 'Borra todas las filas; la tabla sigue existiendo (vacía). Para borrar la tabla se usa DROP TABLE.'
      },
      {
        consigna: '¿Qué instrucción confirma los cambios de una transacción?',
        opciones: ['SAVE', 'COMMIT', 'END', 'ROLLBACK'],
        correcta: 1,
        explicacion: 'COMMIT confirma; ROLLBACK deshace.'
      },
      {
        consigna: '¿Para qué sirve una transacción?',
        opciones: ['Para que varias instrucciones se apliquen todas o ninguna', 'Para que las consultas sean más rápidas', 'Para crear tablas', 'Para ordenar resultados'],
        correcta: 0,
        explicacion: 'Garantiza que un conjunto de cambios no quede a medias.'
      },
      {
        consigna: '¿Qué hace ROLLBACK?',
        opciones: ['Repite la última consulta', 'Deshace los cambios desde el BEGIN', 'Borra la base', 'Confirma los cambios'],
        correcta: 1,
        explicacion: 'Vuelve todo al estado anterior al inicio de la transacción.'
      }
    ]
  })
]

// ===========================================================================
//  JAVA
// ===========================================================================
const java = [
  leccion('java-u3', 1, {
    titulo: 'extends y super',
    descripcion: 'Crear una clase a partir de otra.',
    icono: 'carpetas',
    explicacion:
      'La herencia permite crear una clase hija a partir de una clase padre con extends: la hija recibe sus ' +
      'atributos y métodos y puede agregar los propios. En el constructor de la hija, super(...) llama al ' +
      'constructor del padre y tiene que ir en la primera línea. En Java una clase hereda de una sola clase.',
    ejemplo: {
      titulo: 'Animal y Perro',
      codigo: 'class Animal {\n    String nombre;\n    Animal(String nombre) { this.nombre = nombre; }\n    void comer() { System.out.println(nombre + " come"); }\n}\n\nclass Perro extends Animal {\n    Perro(String nombre) { super(nombre); }\n    void ladrar() { System.out.println("Guau"); }\n}',
      nota: 'Un Perro puede comer() porque lo heredó de Animal.'
    },
    actividades: [
      {
        consigna: '¿Qué palabra indica que una clase hereda de otra?',
        opciones: ['implements', 'extends', 'inherits', 'super'],
        correcta: 1,
        explicacion: 'class Hija extends Padre. implements es para interfaces.'
      },
      {
        consigna: '¿Qué hace super(nombre) en el constructor de Perro?',
        opciones: ['Crea otro perro', 'Llama al constructor de Animal', 'Borra el nombre', 'Llama a ladrar()'],
        correcta: 1,
        explicacion: 'super(...) llama al constructor de la clase padre.'
      },
      {
        consigna: 'Si Perro extends Animal, ¿puede un Perro usar el método comer() de Animal?',
        opciones: ['Sí, lo hereda', 'No, hay que copiarlo', 'Solo si es static', 'Solo si se llama super.comer()'],
        correcta: 0,
        explicacion: 'La hija hereda los métodos (no privados) del padre.'
      },
      {
        consigna: '¿De cuántas clases puede heredar directamente una clase en Java?',
        opciones: ['De una sola', 'De dos', 'De las que quiera', 'De ninguna'],
        correcta: 0,
        explicacion: 'Java no tiene herencia múltiple de clases (sí puede implementar varias interfaces).'
      }
    ]
  }),
  leccion('java-u3', 2, {
    titulo: 'Sobrescritura y polimorfismo',
    descripcion: 'Que cada clase responda a su manera.',
    icono: 'bifurcacion',
    explicacion:
      'Una clase hija puede sobrescribir (redefinir) un método del padre con la misma firma; la anotación ' +
      '@Override le pide al compilador que verifique que de verdad lo está sobrescribiendo. Polimorfismo: una ' +
      'variable del tipo del padre puede guardar un objeto de la hija, y al llamar al método se ejecuta la ' +
      'versión de la clase real del objeto.',
    ejemplo: {
      titulo: 'Cada animal hace su sonido',
      codigo: 'class Animal {\n    String sonido() { return "..."; }\n}\nclass Gato extends Animal {\n    @Override\n    String sonido() { return "Miau"; }\n}\n\nAnimal a = new Gato();\nSystem.out.println(a.sonido());   // Miau',
      nota: 'La variable es de tipo Animal, pero el objeto es un Gato.'
    },
    actividades: [
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'Animal a = new Gato();\nSystem.out.println(a.sonido());',
        opciones: ['...', 'Miau', 'Un error', 'null'],
        correcta: 1,
        explicacion: 'Se ejecuta el método de la clase real del objeto: Gato.'
      },
      {
        consigna: '¿Para qué sirve @Override?',
        opciones: ['Para que el método sea más rápido', 'Para que el compilador verifique que se sobrescribe un método del padre', 'Para hacer el método privado', 'Para llamar al padre'],
        correcta: 1,
        explicacion: 'Si el método no coincide con ninguno del padre, el compilador avisa.'
      },
      {
        consigna: 'Con Gato extends Animal, ¿cuál de estas líneas es válida?',
        opciones: ['Gato g = new Animal();', 'Animal a = new Gato();', 'Gato g = Animal;', 'Animal a = Gato();'],
        correcta: 1,
        explicacion: 'Un Gato es un Animal, así que una variable Animal puede guardar un Gato. Al revés no.'
      },
      {
        consigna: '¿Qué es el polimorfismo?',
        opciones: ['Tener muchas variables', 'Que un mismo llamado ejecute versiones distintas según el objeto', 'Copiar una clase', 'Usar muchos constructores'],
        correcta: 1,
        explicacion: 'a.sonido() hace "Miau" o "Guau" según el objeto real.'
      }
    ]
  }),
  leccion('java-u4', 1, {
    titulo: 'ArrayList',
    descripcion: 'Listas que crecen solas.',
    icono: 'caja',
    explicacion:
      'Un array en Java tiene tamaño fijo; ArrayList, en cambio, crece a medida que se agregan elementos. Se ' +
      'declara con el tipo entre <> (ArrayList<String>) y se importa de java.util. add() agrega, get(i) lee ' +
      'la posición i (desde 0), size() dice cuántos hay y remove() quita. Se recorre fácil con el for-each.',
    ejemplo: {
      titulo: 'Una lista de nombres',
      codigo: 'import java.util.ArrayList;\n\nArrayList<String> nombres = new ArrayList<>();\nnombres.add("Ana");\nnombres.add("Leo");\nSystem.out.println(nombres.get(0));   // Ana\nSystem.out.println(nombres.size());   // 2\nfor (String n : nombres) {\n    System.out.println(n);\n}',
      nota: 'Para números se usa la clase Integer: ArrayList<Integer>.'
    },
    actividades: [
      {
        consigna: '¿Qué método agrega un elemento a un ArrayList?',
        opciones: ['push()', 'add()', 'append()', 'put()'],
        correcta: 1,
        explicacion: 'lista.add(valor) lo agrega al final.'
      },
      {
        consigna: '¿Qué método dice cuántos elementos tiene un ArrayList?',
        opciones: ['length', 'length()', 'size()', 'count()'],
        correcta: 2,
        explicacion: 'Los ArrayList usan size(). length es de los arrays comunes.'
      },
      {
        consigna: '¿Cuál es la principal diferencia entre un array y un ArrayList?',
        opciones: ['El ArrayList puede crecer; el array tiene tamaño fijo', 'El array solo guarda texto', 'No hay diferencia', 'El ArrayList no se puede recorrer'],
        correcta: 0,
        explicacion: 'El tamaño de un array se fija al crearlo; el ArrayList se agranda solo.'
      },
      {
        consigna: '¿Cómo se declara un ArrayList de números enteros?',
        opciones: ['ArrayList<int> n = new ArrayList<>();', 'ArrayList<Integer> n = new ArrayList<>();', 'ArrayList n<int> = new ArrayList();', 'int ArrayList n = new ArrayList<>();'],
        correcta: 1,
        explicacion: 'Las colecciones guardan objetos: se usa Integer en lugar de int.'
      }
    ]
  }),
  leccion('java-u4', 2, {
    titulo: 'HashMap',
    descripcion: 'Guardar valores por clave.',
    icono: 'carpetas',
    explicacion:
      'HashMap guarda pares clave-valor: HashMap<String, Integer> asocia textos con números. put(clave, valor) ' +
      'agrega o reemplaza, get(clave) devuelve el valor (o null si la clave no está), containsKey() pregunta ' +
      'si existe la clave y keySet() devuelve las claves para recorrerlas. Las claves no se repiten.',
    ejemplo: {
      titulo: 'Puntajes',
      codigo: 'import java.util.HashMap;\n\nHashMap<String, Integer> puntos = new HashMap<>();\npuntos.put("Ana", 120);\npuntos.put("Leo", 90);\nSystem.out.println(puntos.get("Ana"));         // 120\nSystem.out.println(puntos.containsKey("Sol"));  // false\nfor (String n : puntos.keySet()) {\n    System.out.println(n + ": " + puntos.get(n));\n}',
      nota: 'Un HashMap no garantiza el orden de las claves.'
    },
    actividades: [
      {
        consigna: '¿Qué método agrega un par clave-valor a un HashMap?',
        opciones: ['add()', 'put()', 'set()', 'insert()'],
        correcta: 1,
        explicacion: 'map.put(clave, valor). Si la clave ya existía, reemplaza el valor.'
      },
      {
        consigna: '¿Qué devuelve get() con una clave que no existe?',
        opciones: ['0', 'null', 'Un error', '""'],
        correcta: 1,
        explicacion: 'Devuelve null. Para preguntar antes se usa containsKey().'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'HashMap<String, Integer> m = new HashMap<>();\nm.put("a", 1);\nm.put("a", 5);\nSystem.out.println(m.get("a"));',
        opciones: ['1', '5', '6', '[1, 5]'],
        correcta: 1,
        explicacion: 'Las claves no se repiten: el segundo put reemplaza el valor.'
      },
      {
        consigna: '¿Qué método devuelve todas las claves de un HashMap?',
        opciones: ['keys()', 'keySet()', 'getKeys()', 'values()'],
        correcta: 1,
        explicacion: 'keySet() devuelve las claves; values(), los valores.'
      }
    ]
  })
]

// ===========================================================================
//  C++
// ===========================================================================
const cpp = [
  leccion('cpp-u3', 1, {
    titulo: 'struct',
    descripcion: 'Agrupar datos relacionados.',
    icono: 'pieza',
    explicacion:
      'Un struct agrupa varios datos (miembros) bajo un mismo nombre: struct Punto { int x; int y; };. Se ' +
      'crean variables de ese tipo y se accede a cada miembro con el punto. Si se tiene un puntero a un ' +
      'struct, se usa la flecha ->. La definición del struct termina con punto y coma.',
    ejemplo: {
      titulo: 'Un punto en el plano',
      codigo: 'struct Punto {\n    int x;\n    int y;\n};\n\nPunto p = {3, 4};\np.x = 10;\nPunto* q = &p;\nstd::cout << q->y;   // 4',
      nota: 'q->y es lo mismo que (*q).y.'
    },
    actividades: [
      {
        consigna: '¿Con qué se accede a un miembro de una variable struct?',
        opciones: ['::', '.', '->', '#'],
        correcta: 1,
        explicacion: 'p.x. La flecha -> se usa cuando se tiene un puntero.'
      },
      {
        consigna: '¿Qué falta en esta definición?',
        codigo: 'struct Alumno {\n    std::string nombre;\n    int edad;\n}',
        opciones: ['Las llaves', 'El punto y coma final', 'La palabra class', 'Un constructor'],
        correcta: 1,
        explicacion: 'La definición de un struct termina con }; .'
      },
      {
        consigna: 'Si q es un puntero a un Punto, ¿cómo se lee su miembro x?',
        opciones: ['q.x', 'q->x', 'q::x', '&q.x'],
        correcta: 1,
        explicacion: 'Con un puntero se usa ->, que equivale a (*q).x.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'Punto p = {2, 7};\nstd::cout << p.x + p.y;',
        opciones: ['27', '9', '2', '7'],
        correcta: 1,
        explicacion: 'p.x vale 2 y p.y vale 7: 2 + 7 = 9.'
      }
    ]
  }),
  leccion('cpp-u3', 2, {
    titulo: 'Clases, constructores y destructores',
    descripcion: 'Datos privados y funciones que los cuidan.',
    icono: 'carpetas',
    explicacion:
      'Una class es como un struct, pero sus miembros son privados por defecto (en un struct son públicos). ' +
      'public: marca lo que se puede usar desde afuera. El constructor se llama igual que la clase y se ' +
      'ejecuta al crear el objeto; el destructor (~NombreDeLaClase) se ejecuta cuando el objeto deja de ' +
      'existir y sirve para liberar recursos.',
    ejemplo: {
      titulo: 'Una cuenta',
      codigo: 'class Cuenta {\n    double saldo;            // privado\npublic:\n    Cuenta(double inicial) : saldo(inicial) {}\n    ~Cuenta() { std::cout << "Chau cuenta\\n"; }\n    void depositar(double m) { saldo += m; }\n    double verSaldo() const { return saldo; }\n};',
      nota: 'saldo no se puede tocar desde afuera: solo con depositar() y verSaldo().'
    },
    actividades: [
      {
        consigna: 'En una class, ¿cómo son los miembros si no se indica nada?',
        opciones: ['public', 'private', 'protected', 'static'],
        correcta: 1,
        explicacion: 'En class son privados por defecto; en struct, públicos.'
      },
      {
        consigna: '¿Cómo se llama el destructor de la clase Cuenta?',
        opciones: ['delete Cuenta()', '~Cuenta()', 'Cuenta_destroy()', '!Cuenta()'],
        correcta: 1,
        explicacion: 'El destructor lleva el nombre de la clase con ~ adelante.'
      },
      {
        consigna: '¿Cuándo se ejecuta el constructor?',
        opciones: ['Al crear el objeto', 'Al terminar el programa', 'Al llamar a cualquier método', 'Nunca solo'],
        correcta: 0,
        explicacion: 'Se ejecuta automáticamente cuando se crea el objeto.'
      },
      {
        consigna: 'Con la clase del ejemplo, ¿qué línea da error de compilación?',
        codigo: 'Cuenta c(100);',
        opciones: ['c.depositar(50);', 'c.saldo = 500;', 'c.verSaldo();', 'Ninguna'],
        correcta: 1,
        explicacion: 'saldo es privado: no se puede usar desde afuera de la clase.'
      }
    ]
  }),
  leccion('cpp-u4', 1, {
    titulo: 'new y delete',
    descripcion: 'Pedir y liberar memoria a mano.',
    icono: 'caja',
    explicacion:
      'Las variables locales viven en la pila y se liberan solas al terminar la función. Con new se pide ' +
      'memoria en el montón (heap), que sigue existiendo hasta que se libera con delete; para arrays se usa ' +
      'new[] y delete[]. Si se pierde el puntero sin hacer delete, esa memoria queda ocupada para siempre: ' +
      'es una fuga de memoria.',
    ejemplo: {
      titulo: 'Memoria dinámica',
      codigo: 'int* n = new int(5);\nstd::cout << *n;      // 5\ndelete n;\n\nint* v = new int[3];  // array de 3 enteros\nv[0] = 10;\ndelete[] v;',
      nota: 'A cada new le corresponde un delete (y a cada new[], un delete[]).'
    },
    actividades: [
      {
        consigna: '¿Con qué se libera la memoria pedida con new?',
        opciones: ['free', 'delete', 'remove', 'Se libera sola'],
        correcta: 1,
        explicacion: 'Lo que se pide con new se libera con delete.'
      },
      {
        consigna: '¿Cómo se libera un array creado con new int[10]?',
        opciones: ['delete v;', 'delete[] v;', 'free(v);', 'v.clear();'],
        correcta: 1,
        explicacion: 'Los arrays dinámicos se liberan con delete[].'
      },
      {
        consigna: '¿Qué es una fuga de memoria?',
        opciones: ['Memoria pedida que nunca se libera', 'Un error de sintaxis', 'Leer una variable sin inicializar', 'Usar muchas variables'],
        correcta: 0,
        explicacion: 'Si se pierde el puntero sin delete, esa memoria queda ocupada hasta que termina el programa.'
      },
      {
        consigna: '¿Dónde se guarda la memoria pedida con new?',
        opciones: ['En la pila (stack)', 'En el montón (heap)', 'En el disco', 'En el procesador'],
        correcta: 1,
        explicacion: 'new reserva memoria en el heap, que no se libera sola al terminar la función.'
      }
    ]
  }),
  leccion('cpp-u4', 2, {
    titulo: 'Punteros inteligentes',
    descripcion: 'Que la memoria se libere sola.',
    icono: 'flechaDiana',
    explicacion:
      'Los punteros inteligentes de <memory> liberan la memoria automáticamente cuando ya no se usan, así no ' +
      'hace falta escribir delete. std::unique_ptr tiene un único dueño: no se puede copiar, solo mover. ' +
      'std::shared_ptr puede tener varios dueños y libera la memoria cuando se va el último. Se crean con ' +
      'std::make_unique y std::make_shared.',
    ejemplo: {
      titulo: 'Sin delete',
      codigo: '#include <memory>\n\nauto p = std::make_unique<int>(42);\nstd::cout << *p;               // 42\n\nauto a = std::make_shared<int>(7);\nauto b = a;                    // dos dueños\nstd::cout << a.use_count();    // 2',
      nota: 'Al salir de la función, p, a y b liberan su memoria solos.'
    },
    actividades: [
      {
        consigna: '¿Qué ventaja tiene un puntero inteligente?',
        opciones: ['Es más rápido que cualquier variable', 'Libera la memoria automáticamente', 'Puede apuntar a dos lugares a la vez', 'No necesita incluir nada'],
        correcta: 1,
        explicacion: 'Cuando el puntero inteligente deja de existir, libera la memoria: no hace falta delete.'
      },
      {
        consigna: '¿Qué puntero inteligente tiene un único dueño y no se puede copiar?',
        opciones: ['std::shared_ptr', 'std::unique_ptr', 'std::auto', 'int*'],
        correcta: 1,
        explicacion: 'unique_ptr es de un solo dueño; se puede mover, pero no copiar.'
      },
      {
        consigna: '¿Qué muestra este código?',
        codigo: 'auto a = std::make_shared<int>(7);\nauto b = a;\nstd::cout << a.use_count();',
        opciones: ['1', '2', '7', '0'],
        correcta: 1,
        explicacion: 'a y b comparten el mismo dato: hay dos dueños.'
      },
      {
        consigna: '¿Qué biblioteca hay que incluir para usar punteros inteligentes?',
        opciones: ['<iostream>', '<memory>', '<pointer>', '<smart>'],
        correcta: 1,
        explicacion: 'unique_ptr, shared_ptr, make_unique y make_shared están en <memory>.'
      }
    ]
  })
]

export const leccionesUnidadesFinales = [...python, ...html, ...sql, ...java, ...cpp]
