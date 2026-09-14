# 2. Estructura de la aplicacion

## Mapa de vistas

La aplicacion es una SPA (Single Page Application) con **11 vistas**:

| # | Vista | Ruta | Nombre de ruta | Que muestra |
|---|---|---|---|---|
| 0 | Bienvenida | `/bienvenida` | `bienvenida` | Presentacion en cuatro pasos deslizables y eleccion de como entrar. Se muestra sola la primera vez. |
| 1 | Inicio | `/` | `inicio` | Presentacion del proyecto, como funciona y boton para empezar. |
| 2 | Cursos | `/cursos` | `cursos` | Catalogo de lenguajes con buscador y filtro por estado. |
| 3 | Curso de JavaScript | `/cursos/javascript` | `curso-javascript` | Datos del curso y el camino de las 6 unidades. |
| 4 | Unidad | `/cursos/javascript/unidades/:unidadId` | `unidad` | Lecciones que componen una unidad. |
| 5 | Leccion | `/cursos/javascript/lecciones/:leccionId` | `leccion` | Pantalla de ejercicios (a pantalla completa). |
| 6 | Resultados | `/cursos/javascript/lecciones/:leccionId/resultados` | `resultados` | Puntaje, XP ganado y que sigue. |
| 7 | Perfil | `/perfil` | `perfil` | XP, racha, meta diaria, avance por unidad y logros. |
| 8 | 404 | `/:rutaInexistente(.*)*` | `no-encontrado` | Pagina de error. |

Las rutas usan nombres (`:to="{ name: 'leccion' }"`) para no escribir URLs a mano en las
plantillas: si manana cambia la direccion, se toca un solo archivo.

## Flujo de navegacion

La primera vez que alguien entra, un guard del router lo manda a la bienvenida:

```
   Primera visita ──► Bienvenida ──┬── "Empezar con una cuenta" ──► Google / GitHub
                      (4 pasos)    ├── "Seguir como invitado"  ──► Curso de JavaScript
                                   └── "Saltar"                ──► Inicio
```

Una vez vista queda marcada en el navegador y no vuelve a aparecer; se puede
volver a ver desde el enlace del pie de pagina.

```
                    Inicio  ─────────────────────────┐
                      │                              │
                 "Ver cursos"                  "Empezar ahora"
                      ▼                              │
                   Cursos                            │
                      │                              │
              (tarjeta JavaScript)                   │
                      ▼                              │
            Curso de JavaScript ◄──────────┐         │
                      │                    │         │
                (tarjeta unidad)           │         │
                      ▼                    │         │
                   Unidad                  │         │
                      │                    │         │
               (boton Practicar)           │         │
                      ▼                    │         │
                  Leccion  ◄───────────────┼─────────┘
                      │                    │
              (ultimo ejercicio            │
               o sin vidas)                │
                      ▼                    │
                Resultados ────────────────┘
                      │
                      └──────────► Perfil
```

La vista `Leccion` se muestra **sin cabecera ni pie** (igual que Duolingo) para que nada
distraiga mientras se resuelve. Eso se resuelve con `meta: { ocultarNavegacion: true }` en la
ruta, que `App.vue` lee para esconder el header y el footer.

## Estructura de carpetas

```
animacion/
├── index.html                  Punto de entrada de Vite
├── package.json
├── vite.config.js              Alias "@" -> /src
├── docs/                       Documentacion del trabajo practico
│   ├── 01-descripcion-del-proyecto.md
│   ├── 02-estructura-y-arquitectura.md
│   ├── 03-wireframes.md
│   └── 04-identidad-visual.md
├── legacy/animacion/           Ejercicio de animacion CSS original del repo
├── public/
│   └── favicon.svg
└── src/
    ├── main.js                 Crea la app, monta el router y los estilos
    ├── App.vue                 Layout general (header + router-view + footer)
    │
    ├── assets/styles/
    │   ├── variables.css       Tokens de identidad visual (colores, fuentes, medidas)
    │   └── main.css            Reset, utilidades y estilos globales
    │
    ├── router/
    │   └── index.js            Definicion de las 8 rutas
    │
    ├── data/                   CAPA DE DATOS (nada de contenido en el HTML)
    │   ├── index.js            Punto de entrada unico ("@/data")
    │   ├── cursos.js           Catalogo de los 6 cursos
    │   ├── unidades.js         Las 6 unidades del curso de JavaScript
    │   ├── tiposEjercicio.js   Constantes de los 4 tipos de ejercicio
    │   └── lecciones/
    │       ├── index.js        Une las unidades y expone los buscadores
    │       ├── unidad1.js      3 lecciones · 11 ejercicios
    │       ├── unidad2.js      3 lecciones ·  9 ejercicios
    │       ├── unidad3.js      2 lecciones ·  6 ejercicios
    │       ├── unidad4.js      2 lecciones ·  6 ejercicios
    │       ├── unidad5.js      2 lecciones ·  6 ejercicios
    │       └── unidad6.js      2 lecciones ·  6 ejercicios
    │
    ├── composables/
    │   └── useProgreso.js      Estado compartido del estudiante + localStorage
    │
    ├── utils/
    │   └── verificarRespuesta.js  Correccion de cada tipo de ejercicio
    │
    ├── components/
    │   ├── BaseBoton.vue       Boton reutilizable (5 variantes, 3 tamanios)
    │   ├── BarraProgreso.vue   Barra de progreso reutilizable
    │   ├── BarraFeedback.vue   Barra verde/roja de correccion
    │   ├── CursoCard.vue       Tarjeta de curso  (recibe props, emite "seleccionar")
    │   ├── UnidadCard.vue      Tarjeta de unidad (recibe props, emite "seleccionar")
    │   ├── layout/
    │   │   ├── AppHeader.vue
    │   │   └── AppFooter.vue
    │   └── ejercicios/
    │       ├── EjercicioOpcionMultiple.vue
    │       ├── EjercicioVerdaderoFalso.vue
    │       ├── EjercicioCompletar.vue
    │       └── EjercicioOrdenar.vue
    │
    └── views/                  Una por ruta
        ├── HomeView.vue
        ├── CursosView.vue
        ├── CursoJavaScriptView.vue
        ├── UnidadView.vue
        ├── LeccionView.vue
        ├── ResultadosView.vue
        ├── PerfilView.vue
        └── NoEncontradoView.vue
```

## Modelo de datos

Ningun texto de contenido esta escrito dentro de una plantilla: todo sale de `src/data/`.

### Curso

```js
{
  id: 'javascript',
  nombre: 'JavaScript',
  descripcion: 'El lenguaje de la web...',
  estado: 'disponible' | 'proximamente' | 'bloqueado',
  nivel: 'Principiante',
  icono: 'JS', color: '#f7df1e', colorTexto: '#1f2933',  // representacion visual
  totalUnidades: 6, totalLecciones: 14, horasEstimadas: 12,
  etiquetas: ['Web', 'Front-end'],
  requisito: 'Completa el curso de JavaScript...',   // solo si esta bloqueado
  ruta: { name: 'curso-javascript' } | null
}
```

### Unidad

```js
{
  id: 'js-u1',
  cursoId: 'javascript',
  numero: 1,
  titulo: 'Primeros pasos',
  descripcion: 'Que es JavaScript, como se guardan datos...',
  icono: '🚀',
  color: 'var(--c-verde)',
  estadoInicial: 'disponible' | 'bloqueada' | 'completada',
  temas: ['Variables', 'let y const', 'Tipos de datos']
}
```

> El `estadoInicial` es solo el valor de arranque. El estado **real** lo calcula
> `useProgreso.estadoUnidad()` a partir de lo que el estudiante ya completo.

### Leccion

```js
{
  id: 'js-u1-l2',
  unidadId: 'js-u1',
  numero: 2,
  titulo: 'Variables y constantes',
  descripcion: 'Guardar datos con let y const.',
  icono: '📥',
  xp: 15,
  ejercicios: [ /* ver abajo */ ]
}
```

### Ejercicio

Los cuatro tipos comparten `id`, `tipo`, `consigna`, `explicacion` y el `codigo` opcional.
Lo que cambia es como se declara la respuesta:

| Tipo | Campos propios | `respuesta` |
|---|---|---|
| `opcion-multiple` | `opciones: [{ id, texto }]` | id de la opcion correcta |
| `verdadero-falso` | — | `true` / `false` |
| `completar` | `plantilla` con `___`, `pista` | array de textos aceptados |
| `ordenar` | `fragmentos: [{ id, texto }]` | array de ids en el orden correcto |

Ejemplo real:

```js
{
  id: 'js-u1-l2-e1',
  tipo: TIPO_EJERCICIO.OPCION_MULTIPLE,
  consigna: 'Que palabra clave conviene usar para un valor que NO va a cambiar?',
  opciones: [
    { id: 'a', texto: 'let' },
    { id: 'b', texto: 'var' },
    { id: 'c', texto: 'const' },
    { id: 'd', texto: 'fixed' }
  ],
  respuesta: 'c',
  explicacion: 'const crea una constante: si intentas reasignarla, JavaScript lanza un error.'
}
```

**Totales del curso: 6 unidades · 14 lecciones · 44 ejercicios.**

## Comunicacion entre componentes

Se respeta el flujo de Vue: **props hacia abajo, eventos hacia arriba**.

```
CursosView (vista)
   │  :curso="curso"                 ── props ──►   CursoCard (componente)
   │  ◄── @seleccionar="abrirCurso"  ── evento ──
   │
   └─► router.push(curso.ruta)   ← la navegacion la decide la vista, no la tarjeta
```

La tarjeta no sabe a donde tiene que ir: solo avisa que el usuario la eligio. Asi el mismo
componente sirve en la vista de cursos, en una futura busqueda o en una seccion de
recomendados, sin tocar su codigo.

Lo mismo pasa con `UnidadCard` y con los cuatro componentes de ejercicio, que usan
`v-model` (`modelValue` + `update:modelValue`) para devolverle la respuesta a `LeccionView`.

## Estado del estudiante

`src/composables/useProgreso.js` funciona como un store minimo, sin librerias externas:

- Un unico objeto `reactive` compartido por toda la app.
- Un `watch` profundo que guarda cada cambio en `localStorage` (clave `sintaxia:progreso:v1`).
- Consultas derivadas: `estadoUnidad()`, `progresoUnidad()`, `progresoCurso`,
  `precisionGeneral`, `proximaLeccion`.
- Acciones: `completarLeccion()`, `actualizarPerfil()`, `reiniciarProgreso()`.

Reglas de negocio que resuelve:

1. La unidad 1 siempre esta disponible; cada unidad siguiente se desbloquea cuando **todas**
   las lecciones de la anterior estan completas.
2. Una leccion aprobada la primera vez da el XP completo; al repetirla, la mitad (para que
   repasar sirva, pero no permita inflar el puntaje).
3. Si el estudiante pierde las 3 vidas, la leccion **no** se marca como completada ni suma XP.
4. La racha sube si el ultimo dia de actividad fue ayer, y vuelve a 1 si se corto.
