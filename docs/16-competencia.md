# 16. Competencia: eventos de expo, desafios y partidas (etapa 6)

Este documento define como funciona el modo competencia de Sintaxia para una
expo: que es un evento, que reglas tiene cada desafio, como se juega una partida,
como se calcula el puntaje y como se arma el ranking.

Scripts: [`supabase/11-competencia.sql`](../supabase/11-competencia.sql) (tablas),
[`12-funciones-competencia.sql`](../supabase/12-funciones-competencia.sql) (funciones del servidor),
[`13-politicas-rls-etapa6.sql`](../supabase/13-politicas-rls-etapa6.sql) (permisos) y
[`14-evento-expo.sql`](../supabase/14-evento-expo.sql) (evento de ejemplo).
Diagrama: [`der/sintaxia-der-etapa6.png`](der/sintaxia-der-etapa6.png)
([`.drawio`](der/sintaxia-der-etapa6.drawio)).

---

## 16.1 El evento y sus desafios

Un **evento** es una exposicion. Separa los resultados de cada expo: una partida
pertenece a un desafio, y el desafio a un unico evento.

| Estado del evento | Que pasa |
|---|---|
| `preparacion` | No se ve ni se juega. Sirve para cargarlo antes del dia. |
| `abierto` | Se ve y se juega (si se cargaron `abre_en` y `cierra_en`, solo dentro de ese horario). |
| `cerrado` | Se ven los resultados; no se pueden empezar partidas. |

Cada **desafio** tiene sus reglas. Las del evento de ejemplo (`expo-2026`):

| Desafio | Dificultad | Preguntas | Puntos por acierto | Duracion | Intentos | Gracia |
|---|---|---|---|---|---|---|
| Sprint de JavaScript | facil | 5 | 100 (maximo 500) | 90 s | 3 | 5 s |
| Lee el codigo | media | 5 | 150 (maximo 750) | 120 s | 2 | 5 s |

Todas las preguntas son de opcion multiple con una sola respuesta correcta.

---

## 16.2 Practica y competencia, separadas

| | Practica (etapas 3 a 5) | Competencia (esta etapa) |
|---|---|---|
| Preguntas | `preguntas` / `opciones` | `preguntas_desafio` / `opciones_desafio` (banco propio de cada desafio) |
| Lectura desde la app | Las preguntas publicadas, sin solucion | **Nada**: las preguntas llegan solo dentro de una partida propia |
| Correccion | `comprobar_respuesta`, `responder_actividad` | `responder_partida` |
| Que devuelve al responder | Si acerto, cual era la correcta y la explicacion | Si acerto y los puntos. **No** cual era la correcta ni la explicacion |
| Resultado | Progreso personal | Puntaje oficial para el ranking |

Por que no se puede averiguar una solucion del desafio con la practica:

- Las funciones de practica solo leen las tablas de practica. Si se les pasa el id
  de una pregunta del desafio responden "no existe" (probado: caso 1).
- El banco del desafio no tiene ningun permiso de lectura para `anon` ni para
  `authenticated`: ni las preguntas, ni las opciones, ni la explicacion.
- Durante la competencia la respuesta no dice cual era la opcion correcta. Asi
  quien ya jugo no puede pasarle las soluciones a quien juega despues mirando la
  pantalla de correccion.

---

## 16.3 Una partida, paso a paso

| Paso | Lo que manda la app | Lo que hace el servidor |
|---|---|---|
| Empezar | `iniciar_partida(id, desafio)` con un id nuevo | Verifica sesion, evento abierto, desafio publicado e intentos disponibles. Crea la partida a nombre de quien la pidio, **copia las reglas** del desafio, le **fija las preguntas** (todas las del banco, en un orden al azar para esa partida) y anota la hora de inicio con **su** reloj. |
| Responder | `responder_partida(partida, pregunta, opcion)` | Valida identidad, que la partida sea propia, que este en curso y dentro del tiempo, que la pregunta sea de esa partida, que la opcion sea de esa pregunta y que la pregunta no tenga respuesta. Corrige, guarda la respuesta y **recalcula** el puntaje desde lo guardado. |
| Terminar | `finalizar_partida(partida)` | Cierra la partida y calcula el tiempo usado. |
| Retomar | `obtener_partida(partida)` | Devuelve la partida, las respuestas ya dadas y los segundos que quedan segun el servidor. |

Las cuatro son funciones `SECURITY DEFINER` que solo puede ejecutar alguien con
sesion. Ninguna recibe un puntaje, una cantidad de aciertos ni un tiempo.

### Que se fija al crear la partida

| Columna de `partidas` | Para que |
|---|---|
| `usuario_id` | El dueno, tomado de `auth.uid()`. |
| `version_desafio`, `puntos_por_acierto`, `duracion_segundos`, `gracia_segundos` | Copia de las reglas: la partida se juega con las reglas que habia al empezar. |
| `total_preguntas` + filas en `partida_preguntas` | Las preguntas de esa partida y su orden. |
| `iniciada_en`, `vence_en` | Inicio y cierre, con el reloj del servidor. |

Ademas, desde la primera partida el desafio queda **congelado** (`congelado_en`):
un disparador rechaza cambiar sus reglas o su banco de preguntas. Si hace falta
otra cosa, se crea otro desafio (otra version). Se puede cambiar el estado
(por ejemplo, de publicado a cerrado), el nombre y la descripcion.

---

## 16.4 Puntaje, tiempo y cierre

**Puntaje.** `puntos_por_acierto` por cada respuesta correcta, cero por una
incorrecta. No hay puntos negativos. La base lo garantiza con una restriccion:
`puntaje = aciertos x puntos_por_acierto` (ni siquiera el dueno de la base puede
guardar otro numero: caso 10).

**Tiempo, medido en el servidor.**

| Momento | Definicion |
|---|---|
| Inicio | `iniciada_en`: cuando el servidor crea la partida. |
| Cierre previsto | `vence_en = iniciada_en + duracion_segundos`. |
| Gracia de red | Se aceptan respuestas que llegan hasta `vence_en + gracia_segundos` (5 s): son las que salieron a tiempo y la red demoro. |
| Tiempo usado | `duracion_ms = finalizada_en - iniciada_en`, con tope en la duracion. Es lo que desempata. |

La app muestra una cuenta regresiva a partir de los segundos que informa el
servidor en cada respuesta, contados con el reloj monotono del navegador
(`performance.now`), que no cambia si se toca la hora del celular. Con el reloj
del navegador adelantado una hora la cuenta sigue mostrando lo que dice el
servidor (caso 8). Cuando la cuenta llega a cero, la app pide el cierre y el
servidor decide con su reloj.

**Reconexion.** El reloj **no se detiene** si se corta la conexion. La partida
queda en la direccion (`?partida=id`) y en "Retomar partida" del evento: al
volver se sigue en la primera pregunta sin responder, con el tiempo que de verdad
queda. El plazo para reconectarse es el tiempo que le queda a la partida (mas la
gracia). Una respuesta enviada sin conexion queda "Pendiente" y se manda sola
cuando vuelve la conexion (caso 9).

**Cierre y partidas incompletas.**

| Estado | Cuando | Entra al ranking |
|---|---|---|
| `finalizada` | Respondio todas, o toco **Terminar** antes de que venza (las no respondidas valen 0). | **Si** |
| `vencida` | Paso `vence_en` + gracia sin cerrarla. Conserva lo respondido. | **No** (partida incompleta) |

No hace falta una tarea programada para vencer partidas: cada funcion cierra las
vencidas de la persona antes de seguir, y el ranking solo mira las finalizadas.

---

## 16.5 Intentos y ranking

**Intentos.** Cada desafio permite `intentos_permitidos` partidas por persona
(vencidas incluidas). Pasado el limite, `iniciar_partida` responde `sin_intentos`.

**Regla del ranking: la mejor partida valida por participante y desafio.**

1. Mas puntaje.
2. A igual puntaje, menos tiempo (`duracion_ms`).
3. A igual puntaje y tiempo, **comparten el puesto** (ranking 1, 1, 3).

Repetir un desafio **puede mejorar el puesto pero nunca suma**: cuenta una sola
partida, y como hay un maximo de intentos y un maximo de puntaje, no hay forma de
acumular puntos sin limite (caso 11). La funcion `mejor_partida(usuario, desafio)`
aplica esta regla; la tabla y la pantalla del ranking publico son de la etapa 7.

**Quien aparece.** Juegan invitados y cuentas, y los dos ven su puntaje final.
En el ranking aparecen **solo las cuentas**, con su alias y codigo (`Ana#0427`),
como se anuncio a los participantes desde la etapa 4. Un invitado que crea su
cuenta conserva el mismo id, asi que sus partidas pasan a contar.

---

## 16.6 Peticiones repetidas y simultaneas

| Peticion | Que evita el duplicado |
|---|---|
| Empezar | El id de la partida lo genera el celular; repetirlo devuelve la misma partida. Si ya hay una en curso del desafio, se devuelve esa (`retomada`). Las peticiones de una persona se atienden de a una (`pg_advisory_xact_lock`) y el indice `uq_partidas_en_curso` impide dos partidas abiertas. |
| Responder | Clave `(partida_id, pregunta_id)` en `partida_respuestas`. La funcion bloquea la partida (`for update`); si la pregunta ya tiene respuesta devuelve la guardada (`repetida`) sin volver a sumar, aunque llegue otra opcion. |
| Terminar | Cerrar una partida ya cerrada devuelve el mismo resultado (`repetida`). |

Probado con la misma peticion repetida y con cinco a la vez (casos 4 y 5).

---

## 16.7 Permisos

| Tabla | Publico | Invitado / cuenta |
|---|---|---|
| `eventos` | ver los que no estan en preparacion | igual |
| `desafios` | ver los publicados o cerrados de esos eventos | igual |
| `preguntas_desafio`, `opciones_desafio`, `partida_preguntas` | nada | nada |
| `partidas`, `partida_respuestas` | nada | ver las propias |
| Escribir cualquiera de estas tablas | no | **no** (solo las funciones) |

---

## 16.8 Pantallas

| Ruta | Pantalla |
|---|---|
| `/expo` | Eventos visibles. |
| `/expo/:eventoId` | El evento, sus desafios con las reglas, intentos usados, tu mejor partida y "Jugar" o "Retomar partida". Aviso al invitado de que no entra al ranking. |
| `/expo/:eventoId/desafios/:desafioId` | La partida: cuenta regresiva, puntaje, pregunta, estado de cada envio (registrada, pendiente, no se registro) y **Terminar**. |
| `/expo/:eventoId/partidas/:partidaId` | Puntaje final confirmado por el servidor, para invitado y cuenta. Si vencio, lo explica. |

---

## 16.9 Donde esta implementado

| Que | Archivo |
|---|---|
| Tablas, restricciones, congelamiento | `supabase/11-competencia.sql` |
| Reglas, tiempo, correccion y puntaje | `supabase/12-funciones-competencia.sql` |
| Permisos | `supabase/13-politicas-rls-etapa6.sql` |
| Evento de ejemplo | `supabase/14-evento-expo.sql` |
| Acceso a datos desde la app | `src/servicios/competencia.js` |
| Pantallas | `src/views/ExpoView.vue`, `EventoView.vue`, `PartidaView.vue`, `ResultadoPartidaView.vue` |
| Pruebas | `pruebas/etapa6.mjs` ([registro](17-registro-de-pruebas-etapa6.md)) |
