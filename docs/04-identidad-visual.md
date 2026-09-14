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

Se usa un **set de iconos SVG propio** (`src/assets/iconos.js`, 59 iconos), dibujado dentro
del proyecto. No se usa ninguna libreria ni CDN.

Por que un set propio y no emojis:

- **Los emojis no son consistentes.** Cada sistema operativo los dibuja distinto: el mismo
  🎯 se ve de una forma en Windows, de otra en Android y de otra en iPhone. La interfaz
  terminaba cambiando de aspecto segun quien la abriera.
- **No se les puede cambiar el color.** Un emoji viene con sus colores puestos, asi que no
  podia acompaniar al color del estado (verde cuando esta completo, gris cuando esta
  bloqueado).
- **No combinan con el trazo del resto.** Los emojis son ilustraciones a color; el resto de
  la interfaz es de lineas limpias.

El set propio resuelve las tres cosas: lienzo de 24x24, trazo de 2, puntas redondeadas, y
todos heredan el color del texto con `currentColor`, asi que cambian solos segun el contexto.

Cada unidad tiene el suyo (cohete en primeros pasos, bifurcacion en decisiones, repetir en
bucles, pieza en funciones, caja en arrays, globo en el DOM), lo que ayuda a reconocerla de
un vistazo.

Los iconos decorativos salen con `aria-hidden="true"`; los que aportan informacion reciben
una `etiqueta` que el lector de pantalla si anuncia.

### La mascota

**Sintax** es el buho del logo, y aparece en toda la aplicacion con **ocho estados de animo**
(`public/sintax/`): normal, saludando, sorprendido, pensando, celebrando, confundido, enojado
y dormido.

No es decoracion: **reacciona a lo que pasa**. Celebra una leccion perfecta, se enoja cuando
se pierden las tres vidas, se confunde en el 404 y duerme cuando hace rato que no practicas.
Es lo que convierte una pantalla de resultados en algo que da ganas de volver a ver.

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

Las animaciones compartidas viven en `src/assets/styles/animaciones.css`, con una escala de
duraciones fija para que todo se mueva al mismo ritmo:

```css
--anim-rapida: 0.18s;   --anim-media: 0.32s;   --anim-lenta: 0.6s;
--anim-rebote: cubic-bezier(0.34, 1.56, 0.64, 1);   /* con un pequenio rebote */
--anim-suave:  cubic-bezier(0.22, 1, 0.36, 1);      /* desacelera al final */
```

| Que se mueve | Como | Para que |
|---|---|---|
| Botones | Bajan 4 px al presionar, 60 ms | Devolucion tactil inmediata |
| Tarjetas | Suben 4 px al pasar el mouse | Dejan claro que se pueden tocar |
| Grillas (cursos, unidades, medallas) | Entran escalonadas, una detras de otra | La pantalla se arma, no aparece de golpe |
| Barras de progreso | Se llenan en 600 ms, con un reflejo que las recorre | Refuerza la idea de avance |
| Opcion correcta | Pega un saltito | Premia el acierto |
| Opcion incorrecta | Se sacude | Se entiende sin leer |
| Barra de correccion | Entra deslizandose desde abajo | Es la reaccion al comprobar |
| Medalla nueva | Aparece con rebote y un halo que se expande dos veces | Un logro tiene que sentirse como un logro |
| Contadores de XP | El numero trepa hasta su valor | Ver subir el numero da mas sensacion de premio que verlo aparecer |
| La llama de la racha | Late despacio, siempre | Recuerda que hay algo que mantener |
| Sintax | Una animacion por estado: flota, saluda, festeja, tiembla, duerme | Le da vida al personaje |
| Cambio de vista | Fundido con desplazamiento, 320 ms al entrar y 180 ms al salir | Sale rapido, entra tranquilo |

Todo respeta `@media (prefers-reduced-motion: reduce)`: quien tenga configurado en su sistema
que prefiere menos movimiento ve la aplicacion completamente quieta, incluidos los contadores,
que saltan directo al valor final.

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
