# 4. Identidad visual

Todos los valores de este documento estan definidos como variables CSS en
`src/assets/styles/variables.css`. Ningun componente escribe un color "a mano": usa el token.
Cambiando ese archivo cambia el aspecto de toda la aplicacion.

---

## 4.1 Paleta de colores

### Colores de marca

| Token | Valor | Uso |
|---|---|---|
| `--c-verde` | `#2fbf56` | Accion principal, acierto, progreso |
| `--c-verde-osc` | `#24a045` | Sombra inferior de los botones verdes |
| `--c-verde-suave` | `#e6f8ec` | Fondo de los estados correctos |
| `--c-violeta` | `#7434db` | Color secundario e identidad de marca |
| `--c-violeta-osc` | `#5a26ae` | Sombra / texto sobre fondo violeta claro |
| `--c-violeta-suave` | `#f1e9fd` | Fondos de seccion, codigo en linea |
| `--c-azul` | `#1cb0f6` | Informacion, opcion seleccionada, foco |
| `--c-amarillo` | `#ffc800` | XP, meta diaria, logros |
| `--c-rojo` | `#ff4b4b` | Error, vidas perdidas, acciones destructivas |

### Neutros

| Token | Valor | Uso |
|---|---|---|
| `--c-tinta` | `#1f2933` | Texto principal |
| `--c-gris` | `#6b7684` | Texto secundario |
| `--c-gris-claro` | `#afb8c1` | Elementos apagados / bloqueados |
| `--c-borde` | `#e5e7eb` | Bordes de tarjetas y botones |
| `--c-fondo` | `#f7f8fa` | Fondo general |
| `--c-blanco` | `#ffffff` | Tarjetas y superficies |
| `--c-noche` | `#16212b` | Bloques de codigo y bloque de cierre |

### Justificacion

- **Verde como color principal.** Es el color universal de "correcto" y de "avanzar". En una
  app de aprendizaje el usuario ve verde cada vez que acierta, asi que usar el mismo verde
  para el boton de accion hace que apretarlo ya se sienta como progresar. Ademas es el codigo
  visual que el publico objetivo ya asocia con este tipo de app.
- **Violeta como secundario.** Es el complemento del verde: da contraste sin pelearle. Se usa
  para todo lo que tiene que ver con **codigo** (bloques de codigo en linea, fichas del
  ejercicio de ordenar, seccion "Como funciona"), que es el tema del producto. Ademas es un
  guino al repositorio: `#7434db` es exactamente el color del cuadrado que giraba en el
  ejercicio de animacion original (`legacy/animacion/style.css`).
- **Rojo y verde nunca solos.** Como entre el 5 y el 8 % de los varones tiene algun tipo de
  daltonismo rojo-verde, el acierto y el error **siempre** van acompanados de un icono (✅ /
  ❌) y de un texto ("Muy bien!" / "Respuesta incorrecta"). El color refuerza, no informa.
- **Amarillo solo para recompensas.** Reservarlo para XP, rachas y logros hace que el ojo
  aprenda rapido que "amarillo = premio".
- **Fondo gris muy claro en vez de blanco puro.** Hace que las tarjetas blancas floten y
  cansa menos la vista en sesiones largas.
- **Contraste.** El texto principal (`#1f2933`) sobre el fondo (`#f7f8fa`) supera holgadamente
  el minimo AA de WCAG (4.5:1). El texto secundario se reserva para informacion de apoyo,
  nunca para la consigna de un ejercicio.

---

## 4.2 Tipografia

| Token | Fuente | Donde se usa |
|---|---|---|
| `--f-titulo` | **Nunito** 800 / 900 | Titulos, botones, numeros grandes |
| `--f-texto` | **Nunito** 400 / 600 / 700 | Parrafos e interfaz |
| `--f-codigo` | **JetBrains Mono** 400 / 500 / 700 | Todo lo que sea codigo |

**Por que Nunito.** Es una sans-serif geometrica de terminaciones redondeadas: se lee muy bien
en pantalla, tiene un tono amable (no escolar ni corporativo) y llega hasta el peso 900, que
es lo que permite titulos con presencia sin necesidad de mayusculas gigantes. Es gratuita,
esta en Google Fonts y tiene soporte completo de castellano. Cumple el mismo papel que la
tipografia redondeada de Duolingo, que es la que le da el aire de juego.

**Por que JetBrains Mono.** El codigo tiene que verse como codigo. Es monoespaciada, fue
disenada especificamente para leer codigo durante horas, tiene una altura de x grande y
distingue con claridad los caracteres que se confunden (`0` y `O`, `1`, `l` e `I`, llaves y
parentesis), que es justo lo que un principiante necesita al copiar sintaxis.

**Por que solo dos familias.** Una para interfaz y otra para codigo alcanza: mas fuentes
agregan peso de descarga y ruido visual. La jerarquia se resuelve con tamanio y peso.

### Escala tipografica

```
--t-xs    0.75rem   etiquetas, metadatos
--t-sm    0.875rem  texto de apoyo, codigo
--t-base  1rem      texto normal
--t-md    1.125rem  subtitulos, titulos de tarjeta
--t-lg    1.5rem    titulos de seccion, consigna del ejercicio
--t-xl    2rem      titulos de pagina
--t-2xl   2.75rem   titulo de la portada
```

Los tres tamanios mas grandes se achican automaticamente por debajo de 640 px.

---

## 4.3 Botones

El boton es el elemento mas caracteristico de la identidad. Usa un **efecto 3D**: un borde
inferior solido de 4 px en un tono mas oscuro que simula grosor, que desaparece al presionar
mientras el boton baja 4 px. Es el mismo gesto de un boton fisico y da una devolucion tactil
inmediata.

```
   reposo                        presionado
┌──────────────┐              ┌──────────────┐
│  COMPROBAR   │              │  COMPROBAR   │   baja 4px y
└──────────────┘              └──────────────┘   pierde la sombra
 ▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ← 4px oscuro
```

| Variante | Color | Cuando se usa |
|---|---|---|
| `primario` | Verde | Accion principal de la pantalla (una sola por vista) |
| `secundario` | Violeta | Accion destacada alternativa |
| `contorno` | Blanco con borde | Accion secundaria (repetir, repasar, cancelar) |
| `peligro` | Rojo | Borrar progreso, continuar tras un error |
| `texto` | Sin fondo | Acciones menores (salir, cancelar) |

Ademas: tres tamanios (`chico`, `medio`, `grande`), modo ancho completo, estado deshabilitado
en gris plano (sin sombra, para que se vea "apagado") y `outline` azul de 3 px al navegar con
teclado. Los botones van en mayusculas con `letter-spacing` levemente abierto: son ordenes
cortas y asi se distinguen del texto comun de un vistazo.

---

## 4.4 Tarjetas

```
┌─────────────────────────────┐   · Fondo blanco sobre el gris del fondo.
│  ┌────┐  Titulo             │   · Borde de 2px gris claro (define el limite
│  │ ▭  │  subtitulo          │     sin necesidad de sombras pesadas).
│  └────┘         (ETIQUETA)  │   · Radio de 16px: coherente con el tono amable.
│                             │   · Al pasar el mouse: sube 4px, el borde se
│  Descripcion...             │     pone verde y aparece una sombra suave.
│                             │   · Las bloqueadas bajan la opacidad y no
│  📚 6   🎯 14   ⏱ 12h       │     reaccionan al mouse.
│  [       EMPEZAR         ]  │   · El boton siempre al pie, alineado entre
└─────────────────────────────┘     tarjetas aunque el texto tenga otro largo.
```

Radios usados: `8px` (elementos chicos), `12px` (botones e inputs), `16px` (tarjetas),
`24px` (bloques grandes) y `999px` (etiquetas y avatares).

---

## 4.5 Etiquetas de estado

Pildoras en mayusculas, chiquitas, con fondo suave y texto del mismo tono en oscuro:

| Estado | Color | Lectura |
|---|---|---|
| `Disponible` | Azul claro | Se puede empezar |
| `Completada` | Verde claro | Ya esta hecho |
| `Bloqueada` | Gris | Falta un requisito |
| `Proximamente` | Amarillo claro | Todavia no existe |

---

## 4.6 Iconografia

Se usan **emojis del sistema** en vez de una libreria de iconos. Es una decision consciente:

- No suman ni un kilobyte de descarga ni una dependencia mas.
- Se ven a color y con un estilo amigable, acorde al tono del producto.
- Se leen igual en cualquier sistema operativo y los lee el lector de pantalla.
- Cada unidad tiene el suyo (🚀 primeros pasos, 🔀 decisiones, 🔁 bucles, 🧩 funciones,
  📦 arrays, 🌐 DOM), lo que ayuda a reconocerla de un vistazo en el camino.

Todos los emojis decorativos llevan `aria-hidden="true"` para que no ensucien la lectura con
lector de pantalla; la informacion siempre esta tambien en texto.

### El logo

La marca es un **buho verde con una notebook que muestra `</>`**, acompanado de la palabra
"Sintaxia".

- **El buho** es el guino directo al genero: es la mascota que uno espera en una app de
  aprender por lecciones cortas. Da cara y personalidad a algo que, si no, seria una grilla
  de tarjetas.
- **La notebook con `</>`** es lo que separa a Sintaxia de una app de idiomas: en un solo
  vistazo se entiende que lo que se aprende es programacion.
- **El verde** es el mismo de la paleta, asi que el logo no pelea con el resto de la
  interfaz: el boton principal, el acierto y la marca son todos el mismo color.

El archivo vive en `public/sintaxia.png` y lo consume el componente `LogoSintaxia.vue`, que
lo muestra recortado en cuadrado (solo el buho) en la cabecera y entero en la portada. Si el
archivo falta, el componente dibuja un respaldo en SVG para no mostrar nunca una imagen rota.

---

## 4.7 Movimiento

Las animaciones son cortas y funcionales, nunca decorativas:

- Botones: 60 ms al presionar (tiene que sentirse instantaneo).
- Tarjetas: 150 ms al pasar el mouse.
- Barras de progreso: 350 ms, para que se vea el avance.
- Barra de correccion: entra deslizandose desde abajo en 200 ms.
- Cambio de vista: fundido de 180 ms.

Todo esta dentro de un `@media (prefers-reduced-motion: reduce)` que cancela las animaciones
para quien lo tenga configurado en su sistema.

---

## 4.8 Resumen de las decisiones

| Decision | Por que |
|---|---|
| Verde como color de accion | Es el color de "correcto": apretar el boton ya se siente como avanzar. |
| Violeta como secundario | Contrasta con el verde, identifica al codigo y continua el color del ejercicio original del repo. |
| Nunito | Redondeada y amigable, legible en pantalla, llega a peso 900 y es gratuita. |
| JetBrains Mono | Disenada para leer codigo; distingue 0/O y 1/l/I, clave para un principiante. |
| Botones con borde inferior 3D | Devolucion tactil inmediata; es el gesto que hace que la app se sienta un juego. |
| Emojis en vez de libreria de iconos | Cero peso, cero dependencias, tono amable y accesibles. |
| Estado indicado por color + texto + icono | No depender del color hace la app usable para personas daltonicas. |
| Todo en variables CSS | Cambiar la identidad completa implica editar un solo archivo. |
