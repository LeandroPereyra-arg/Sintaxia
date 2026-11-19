# 27. Minijuego, puntaje total y desafíos sin corrección

Tres cambios al juego de la expo:

1. Los desafíos de preguntas **no muestran si cada respuesta estuvo bien**: solo el
   puntaje final.
2. Un **minijuego** con Sintax, "Sintax atrapa el código", que suma puntos al ranking.
3. Un **puntaje total** por participante en la pantalla del ranking.

Pruebas: [28. Registro de pruebas del juego de la expo](28-registro-de-pruebas-juego-expo.md).

---

## 27.1 Desafíos sin corrección a la vista

Antes, después de cada respuesta aparecía "¡Correcto!" o "Incorrecto", se marcaba la
opción correcta y el puntaje subía en vivo. Eso deja aprender las soluciones entre un
intento y otro. Ahora:

| Mientras se juega | Al terminar |
|---|---|
| Después de responder: **"Respuesta registrada"** y **Siguiente**, sin verde ni rojo | Puntaje final y tiempo |
| Arriba: cuántas respondiste (3/5), no el puntaje | Posición en el ranking (con cuenta) |

Y no alcanza con esconderlo en la pantalla: **el servidor tampoco lo manda**.

| Dónde | Mientras la partida de preguntas está en curso |
|---|---|
| `responder_partida` | Devuelve solo que quedó registrada y qué opción se eligió (ya no `correcta` ni `puntos`) |
| `resumen_partida`, `obtener_partida` | `aciertos`, `errores` y `puntaje` en `null`; cada respuesta sin corrección |
| Tabla `partidas` | La partida en curso no se ve (política RLS) |
| Tabla `partida_respuestas` | Sus respuestas no se ven |
| `mis_partidas(evento)` | Reemplaza a la lectura de la tabla: devuelve las partidas propias con el puntaje oculto en las que siguen |

Al terminar, todo vuelve a verse. El minijuego no se oculta: atrapar y ver si sumaste
es el juego.

## 27.2 El minijuego "Sintax atrapa el código"

### Cómo se juega

- Caen fichas con código. Arriba hay una **consigna** que cambia cada 20 segundos (nueve
  rondas, nunca la misma dos veces seguidas): *Atrapá palabras reservadas de JavaScript*, *Atrapá resultados posibles de
  typeof*, *Atrapá operadores de comparación* o *Atrapá métodos de los arrays*.
- Sintax se mueve arrastrando el dedo, con las flechas del teclado o con los botones
  ◀ ▶.
- Ficha que cumple la consigna: **+20 puntos** (Sintax festeja). Ficha que no: **pierde
  una vida** (Sintax se enoja). Hay **3 vidas**.
- Empieza con una **cuenta regresiva** (3, 2, 1, ¡Ya!). La marca el servidor: la partida
  arranca 3 segundos después de pedirla, así la cuenta no le resta tiempo de juego a nadie
  y el celular la muestra sincronizada con ese reloj.
- Dura **hasta 3 minutos** (180 segundos): termina antes si se pierden las 3 vidas. Las
  fichas caen cada vez más rápido (de 4,2 s a 1,6 s de caída) y cada vez más seguido, así
  que aguantar hasta el final queda para los que más practican.
- Termina al acabarse el tiempo o las vidas, y **la partida cuenta** (no queda "vencida").
- **3 intentos** por persona. En el ranking cuenta la mejor partida, como en los demás
  desafíos.

### Por qué no se puede hacer trampa

El celular no decide nada:

| Qué | Cómo |
|---|---|
| Las fichas | Las arma el **servidor** al empezar (225 fichas, unas 5 cada 4 segundos: texto, cuándo aparece, cuánto tarda en caer, por qué columna). El celular las recibe **sin saber cuáles son válidas** |
| Atrapar | Por cada ficha el celular llama a `atrapar_ficha(partida, n)`. El servidor responde si era válida y devuelve puntaje y vidas |
| Momento | El servidor solo acepta la ficha **mientras está cayendo**, medido con **su** reloj (con un margen de red). Una que todavía no apareció o que ya pasó: `ficha_fuera_de_tiempo` |
| Repetir | Una ficha se cuenta una sola vez; repetir el pedido devuelve lo mismo |
| Puntaje | `aciertos × 20`, calculado por el servidor (la restricción de la tabla sigue vigente) |
| Soluciones | `minijuego_fichas` y `partida_fichas` no tienen ningún permiso para el cliente |

Lo único que alguien podría automatizar es "atrapar todas las fichas válidas a tiempo",
y para eso tiene que **saber** cuáles son válidas: es justamente lo que el juego enseña.

### Datos

| Tabla | Qué guarda |
|---|---|
| `minijuego_categorias` | Las consignas |
| `minijuego_fichas` | Banco: texto de la ficha, a qué consigna pertenece y si la cumple |
| `partida_fichas` | Las fichas de cada partida, con su momento y cuándo se atrapó |
| `desafios.tipo`, `partidas.tipo` | `preguntas` o `minijuego` |

El desafío `expo-2026-minijuego` (orden 3 del evento de ejemplo) lo crea el mismo script.
El panel de administración todavía no crea minijuegos: para otro evento se copia ese
`insert` con el id del evento nuevo.

## 27.3 Puntaje total

`ranking_total(evento)` suma, por participante, **la mejor partida de cada desafío** del
evento, incluido el minijuego. Como es una partida por desafío, jugar muchas veces no
acumula: solo mejorar. A igual total, gana quien sumó menos tiempo.

La pantalla del ranking lo muestra **primero**, destacado, y se actualiza sola con el
mismo aviso de Realtime que los demás tableros. Los invitados tampoco aparecen.

## 27.4 Jugar la competencia solo con un alias

En la pantalla del evento, quien no inició sesión ve **"Elegí tu alias para jugar"**: escribe
un alias y toca **Jugar con este alias**. Por detrás:

1. Se abre una sesión de invitado (anónima), como "Continuar como invitado".
2. `elegir_alias_expo(alias)` guarda el alias en `perfiles.alias_expo` (mismas reglas que
   el alias de una cuenta: 3 a 20 letras sin tilde, números o guion bajo).
3. Con ese alias el invitado **aparece en el ranking** (`AnaDev#0427`). Los invitados
   que no eligen alias siguen sin aparecer.

Si alguien abre un desafío sin sesión, la app lo lleva al evento para que elija su
alias. Si después crea una cuenta, sus partidas pasan a figurar con el alias de la
cuenta. Implementado en `supabase/15-ranking-publico.sql` y `src/views/EventoView.vue`;
prueba: caso 9 de `pruebas/etapa9.mjs`.

## 27.5 Dónde está implementado

| Qué | Archivo |
|---|---|
| Desafios sin correccion a la vista | `supabase/12-funciones-competencia.sql` (funciones) y `13-politicas-rls-etapa6.sql` (tablas); la columna `tipo` en `11-competencia.sql` |
| Minijuego y puntaje total | `supabase/17-juego-de-la-expo.sql` |
| Lectura de partidas, minijuego | `src/servicios/competencia.js` |
| Puntaje total | `src/servicios/ranking.js`, `src/views/RankingExpoView.vue` |
| Pantalla del desafío | `src/views/PartidaView.vue` |
| Pantalla del minijuego | `src/views/MinijuegoView.vue` (ruta `/expo/:evento/minijuego/:desafio`) |
| Pruebas | `pruebas/etapa9.mjs` |
