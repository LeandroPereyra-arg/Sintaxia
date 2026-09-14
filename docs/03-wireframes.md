# 3. Wireframes de las pantallas principales

Bocetos de baja fidelidad hechos antes de programar. Muestran la distribucion de titulos,
botones, tarjetas, menus e imagenes. Las capturas de la version final estan en el README.

Referencias: `[ ]` boton · `( )` chip o etiqueta · `▓` barra de progreso · `▭` imagen o icono.

---

## 3.1 Cabecera y pie (comunes a casi todas las vistas)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ▭ Sintaxia        Inicio  Cursos  JavaScript  Mi perfil     (🔥 5) (⚡120) │
└───────────────────────────────────────────────────────────────────────────┘
   logo + nombre        navegacion principal              racha y XP siempre
                                                          a la vista
...
┌───────────────────────────────────────────────────────────────────────────┐
│ Sintaxia · Aprende a programar jugando       Proyecto academico · Vue 3    │
└───────────────────────────────────────────────────────────────────────────┘
```

En pantallas chicas la navegacion colapsa en un boton hamburguesa y los indicadores de racha
y XP quedan visibles.

---

## 3.2 Inicio (`/`)

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ( APRENDE A PROGRAMAR JUGANDO )        ┌─────────────────────────────┐   │
│                                         │ ✕  ▓▓▓▓▓▓▓░░░░░░░    ❤️ 3   │   │
│  Un lenguaje nuevo,                     │                             │   │
│  CINCO MINUTOS POR DIA                  │ Que palabra clave declara   │   │
│                                         │ una constante?              │   │
│  Texto corto que explica que es         │ ┌─────────────────────────┐ │   │
│  la aplicacion y para quien es.         │ │  ___ PI = 3.14          │ │   │
│                                         │ └─────────────────────────┘ │   │
│  [ EMPEZAR AHORA ]  [ VER CURSOS ]      │ [ var ] [ let ] [ const ]   │   │
│                                         │ ✅ Muy bien! +10 XP         │   │
│   1           14          6             └─────────────────────────────┘   │
│   curso    lecciones   lenguajes            MOCK de la pantalla real:     │
│                                             se ve el producto antes       │
│                                             de registrarse                │
├───────────────────────────────────────────────────────────────────────────┤
│              POR QUE VAS A VOLVER TODOS LOS DIAS                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ ▭ icono  │  │ ▭        │  │ ▭        │  │ ▭        │   4 tarjetas      │
│  │ Titulo   │  │ Titulo   │  │ Titulo   │  │ Titulo   │   de beneficios   │
│  │ texto... │  │ texto... │  │ texto... │  │ texto... │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
├───────────────────────────────────────────────────────────────────────────┤
│                        COMO FUNCIONA         (fondo violeta claro)        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │ (1) Elegi un   │  │ (2) Resolve la │  │ (3) Desbloquea │               │
│  │     lenguaje   │  │     leccion    │  │     la unidad  │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │   TU PRIMERA LECCION TE ESPERA        (bloque oscuro, alto contraste)│ │
│  │   [ EMPEZAR LA LECCION 1 ]                                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────── PIE ──────────────────────────────────────────┘
```

Si el estudiante ya tiene progreso, arriba de "Por que vas a volver" aparece una franja con
su nombre, la barra de avance del curso y un boton **IR AL CURSO**.

---

## 3.3 Cursos (`/cursos`)

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│  Cursos                                        ┌────────────────────────┐ │
│  Elegi el lenguaje con el que queres empezar.  │ 🔍 Buscar un lenguaje  │ │
│                                                └────────────────────────┘ │
│  (Todos) (Disponibles) (Proximamente) (Bloqueados)     ← filtros          │
│                                                                           │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ ▭JS  JavaScript     │ │ ▭Py  Python         │ │ ▭</>  HTML y CSS    │  │
│  │      Principiante   │ │      Principiante   │ │       Principiante  │  │
│  │        (DISPONIBLE) │ │     (PROXIMAMENTE)  │ │     (PROXIMAMENTE)  │  │
│  │                     │ │                     │ │                     │  │
│  │ Descripcion corta   │ │ Descripcion corta   │ │ Descripcion corta   │  │
│  │ del curso, 2 o 3    │ │ del curso...        │ │ del curso...        │  │
│  │ lineas.             │ │                     │ │                     │  │
│  │                     │ │                     │ │                     │  │
│  │ 📚 6  🎯 14  ⏱ 12h  │ │ 📚 6  🎯 15  ⏱ 13h  │ │ 📚 5  🎯 12  ⏱ 9h   │  │
│  │ #Web #Front-end     │ │ #Datos              │ │ #Web #Diseno        │  │
│  │ [    EMPEZAR     ]  │ │ [ PROXIMAMENTE   ]  │ │ [ PROXIMAMENTE   ]  │  │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘  │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ SQL                 │ │ Java      (BLOQUEADO)│ │ C++     (BLOQUEADO) │  │
│  │ ...                 │ │ 🔒 requisito...     │ │ 🔒 requisito...     │  │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

Cada tarjeta es el **mismo componente** `CursoCard`, cambia solo la informacion que recibe.
La grilla se acomoda sola: 3 columnas en escritorio, 2 en tablet, 1 en telefono.

---

## 3.4 Curso de JavaScript (`/cursos/javascript`)

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│  Cursos › JavaScript                                    ← miga de pan     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ┌────┐  Curso de JavaScript             ▓▓▓▓▓░░░░░░░░░░░░░░░        │  │
│  │ │ JS │  Descripcion del curso           4 / 14 lecciones · 28 %     │  │
│  │ └────┘  6 UNIDADES  14 LECCIONES  120 XP  5 DIAS      [ CONTINUAR ] │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Tu camino de aprendizaje                                                 │
│  Completa todas las lecciones de una unidad para desbloquear la siguiente.│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ⬤🚀  UNIDAD 1  (COMPLETADA)                                         │  │
│  │      Primeros pasos                                    [ REPASAR ]  │  │
│  │      Que es JavaScript, como se guardan datos...                    │  │
│  │      [Variables] [let y const] [Tipos de datos]      ← temas        │  │
│  │      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  3 / 3 lecciones · 100 %                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ⬤🔀  UNIDAD 2  (DISPONIBLE)                                         │  │
│  │      Operadores y decisiones                         [ CONTINUAR ]  │  │
│  │      ▓▓▓▓▓▓░░░░░░░░░░░░░░  1 / 3 lecciones · 33 %                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ⬤🔒  UNIDAD 3  (BLOQUEADA)      en gris, boton apagado              │  │
│  │      Bucles y repeticion                             [ BLOQUEADA ]  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│        ... unidades 4, 5 y 6                                              │
└───────────────────────────────────────────────────────────────────────────┘
```

El estado se lee de tres formas a la vez (color de la medalla, etiqueta de texto y barra de
progreso) para que se entienda de un vistazo y no dependa solo del color.

---

## 3.5 Unidad (`/cursos/javascript/unidades/js-u1`)

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│  Cursos › JavaScript › Unidad 1                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 🚀  UNIDAD 1                                ▓▓▓▓▓▓▓░░░░░░░          │  │
│  │     Primeros pasos                          66 % completado         │  │
│  │     Que es JavaScript, como se guardan datos en variables...        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ✅  1. Que es JavaScript                                [ REPASAR ] │  │
│  │     Para que sirve el lenguaje y donde se ejecuta.                  │  │
│  │     4 ejercicios · 10 XP · mejor resultado: 4/4                     │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │ ✅  2. Variables y constantes                           [ REPASAR ] │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │ 🔤  3. Tipos de datos                                 [ PRACTICAR ] │  │
│  │     Numeros, textos, booleanos y el operador typeof.                │  │
│  │     3 ejercicios · 15 XP                                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ← Volver al curso                                                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3.6 Leccion / ejercicio (`/cursos/javascript/lecciones/js-u1-l1`)

Pantalla completa, **sin cabecera ni pie**: nada que distraiga.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ✕     ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            ❤️ 3        │
│ salir           progreso dentro de la leccion                  vidas      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ELEGI LA OPCION CORRECTA · EJERCICIO 1 DE 4                             │
│                                                                           │
│   Donde se ejecuta principalmente JavaScript?                             │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  En la impresora                                                │     │
│   ├─────────────────────────────────────────────────────────────────┤     │
│   │  En el navegador de quien visita la pagina                      │     │
│   ├─────────────────────────────────────────────────────────────────┤     │
│   │  Solo en el servidor                                            │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│  Salir                                              [    COMPROBAR    ]   │
└───────────────────────────────────────────────────────────────────────────┘
```

Al comprobar, el pie se reemplaza por la barra de correccion:

```
├───────────────────────────────────────────────────────────────────────────┤
│  ✅ Muy bien!                                       [    CONTINUAR    ]   │  verde
│     El navegador trae un motor de JavaScript que...                       │
└───────────────────────────────────────────────────────────────────────────┘

├───────────────────────────────────────────────────────────────────────────┤
│  ❌ Respuesta incorrecta                            [    CONTINUAR    ]   │  rojo
│     Respuesta correcta: En el navegador de quien visita la pagina         │
│     El navegador trae un motor de JavaScript que...                       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Los otros tres tipos de ejercicio

```
VERDADERO O FALSO            COMPLETAR EL CODIGO         ORDENAR LOS BLOQUES
┌──────────┬──────────┐      ┌──────────────────────┐    ┌───────────────────┐
│    ✔️    │    ✖️    │      │ console.[     ]("Hola")│    │ 1 │ const x = 1   │
│ Verdadero│  Falso   │      └──────────────────────┘    │ 2 │ x = x + 1     │
└──────────┴──────────┘        Ver pista 💡              └───────────────────┘
                                                          banco de bloques:
                                                          [console.log(x)]
```

---

## 3.7 Resultados

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│            ┌─────────────────────────────────────────────┐                │
│            │                  🏆                          │                │
│            │           Leccion perfecta!                  │                │
│            │   Respondiste todo bien. Asi se aprende.     │                │
│            │            ( Que es JavaScript )             │                │
│            │                                              │                │
│            │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │                │
│            │  │ +10  │ │ 4/4  │ │ 100% │ │  5   │        │                │
│            │  │  XP  │ │acier.│ │prec. │ │racha │        │                │
│            │  └──────┘ └──────┘ └──────┘ └──────┘        │                │
│            │                                              │                │
│            │  Unidad 1 · Primeros pasos           33 %   │                │
│            │  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░                  │                │
│            │                                              │                │
│            │  [ REPETIR LECCION ]  [ SIGUIENTE LECCION ]  │                │
│            │       Ver mi progreso completo →             │                │
│            └─────────────────────────────────────────────┘                │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3.8 Perfil (`/perfil`)

```
┌───────────────────────── CABECERA ────────────────────────────────────────┐
├───────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ┌────┐  Estudiante                                  120  XP totales │  │
│  │ │ ▭  │  Estudiante de JavaScript en Sintaxia          5  dias racha │  │
│  │ └────┘  [ EDITAR PERFIL ]                             4  lecciones  │  │
│  │         (▭)(▭)(▭)(▭)(▭)(▭)  ← elegir avatar         92 %  precision │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Meta diaria      Llevas 30 de 50 XP de hoy.                         │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░                                               │  │
│  │ (20 XP/dia) (50 XP/dia) (100 XP/dia)                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Progreso del curso                                            28 %  │  │
│  │ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░                                        │  │
│  │ 🚀 1. Primeros pasos        ▓▓▓▓▓▓▓▓▓▓▓▓  (3/3)                     │  │
│  │ 🔀 2. Operadores            ▓▓▓▓░░░░░░░░  (1/3)                     │  │
│  │ ... una fila por unidad                                             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Logros                                                              │  │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │  │
│  │ │ 🥚  │ │ 🔥  │ │ 🎖️  │ │ 🔒  │ │ 🔒  │ │ 🔒  │  bloqueados en gris │  │
│  │ │Primer│ │Const│ │Unidad│ │Punte│ │Marat│ │ JS  │                    │  │
│  │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Reiniciar progreso            [ BORRAR MI PROGRESO ]   (rojo)       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3.9 Adaptacion a telefono

```
┌─────────────────────┐   Reglas aplicadas en todas las vistas:
│ ▭ Sintaxia (🔥)(⚡)☰│
├─────────────────────┤   · Las grillas pasan a una sola columna.
│  Un lenguaje nuevo, │   · La navegacion se esconde detras del boton ☰.
│  CINCO MINUTOS      │   · Los botones de las tarjetas pasan a ancho completo.
│  POR DIA            │   · La racha y el XP siguen visibles (son la motivacion).
│                     │   · Ningun contenido se sale a lo ancho: solo las tablas
│  [ EMPEZAR AHORA ]  │     y los bloques de codigo scrollean en su propia caja.
│  [ VER CURSOS    ]  │   · Los botones mantienen un area tocable comoda.
│                     │
│  ┌───────────────┐  │
│  │  mock ejerc.  │  │
│  └───────────────┘  │
└─────────────────────┘
```
