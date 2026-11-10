# 17. Registro de pruebas de la etapa 6

Pruebas de la competencia: separacion entre practica y competencia, partidas
creadas y corregidas por el servidor, envios de otra partida, dobles y
simultaneos, cierre repetido, partidas vencidas, tiempo medido en el servidor,
reconexion, puntaje manipulado, intentos y dos jugadores a la vez. Script:
[`pruebas/etapa6.mjs`](../pruebas/etapa6.mjs). Las reglas estan en
[16. Competencia](16-competencia.md).

## 17.1 Contra que se prueba

| Pieza | Es... |
|---|---|
| Supabase Auth (invitados y cuentas) | El servidor real de Supabase (GoTrue), compilado desde su codigo fuente. |
| PostgreSQL, RLS, restricciones, disparadores y las funciones de la competencia | PostgreSQL 16 real con los scripts `00` a `14` de `supabase/`. Cada consulta corre con el rol y los claims del token que la hizo. |
| La app | Chromium real con la aplicacion de Vue. |
| API de datos (PostgREST) | **Simulada**: la capa HTTP es una imitacion; los permisos los aplica PostgreSQL. |

Para simular el paso del tiempo (partida vencida, respuesta dentro de la gracia)
las pruebas corren la partida hacia atras en la base: le restan segundos a
`iniciada_en` y `vence_en`. Para simular un celular con la hora mal se adelanta
una hora el `Date` del navegador.

## 17.2 Como reproducirlas

```bash
npm run supabase:local       # arma la base desde cero con los scripts 00 a 14
npm run pruebas:entorno      # Auth + API de datos + la app (queda corriendo)

# en otra terminal
npm run pruebas:etapa6       # SOLO=4,9 corre solo esos casos
```

## 17.3 Resultados

Corrida completa desde una base nueva, seguida de las pruebas de las etapas
anteriores:

| Script | Casos | Fallan |
|---|---|---|
| `npm run pruebas:etapa6` | 16 | 0 |
| `npm run pruebas:etapa5` | 22 | 0 |
| `npm run pruebas:etapa4` | 35 | 0 |
| `npm run pruebas:etapa3` | 12 | 0 |
| `npm run pruebas:etapa2` | 11 | 0 |

Ninguna excepcion no atrapada en la pagina.

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | La correccion de practica no da las soluciones del desafio | El banco del desafio no se puede leer; comprobar_respuesta y responder_actividad no conocen sus preguntas; la partida llega sin soluciones | banco y opciones: 401/403 · comprobar_respuesta: 400 (no la conoce) · la partida y la respuesta no traen es_correcta, explicacion ni la opcion correcta | PASA |
| 2 | El servidor crea la partida, registra el dueno y fija preguntas y reglas | La partida queda a nombre de quien la pidio, con las 5 preguntas en un orden fijo y una copia de las reglas; el tiempo lo pone el servidor | dueno: quien la pidio · reglas copiadas (v1, 100 pts, 90 s, gracia 5 s) · vence a los 90 s por reloj del servidor · 5 preguntas en orden fijo | PASA |
| 3 | Respuesta de otra partida o de otra pregunta | Responder en la partida de otra persona, una pregunta que no es de la partida o una opcion de otra pregunta se rechaza sin cambiar nada | responder/ver/cerrar la de B: partida_no_encontrada · pregunta de otro desafio: pregunta_ajena · opcion de otra pregunta: opcion_no_encontrada · B intacta · A sin respuestas | PASA |
| 4 | Doble envio y envios simultaneos | La misma respuesta repetida (o cinco a la vez) suma una sola vez; una opcion distinta despues devuelve la primera | repetida: no suma · otra opcion despues: vale la primera · 5 simultaneas: 1 registrada y 4 "repetida" · 2 respuestas, 200 pts · duplicado directo en la tabla: rechazado por pk_partida_respuestas | PASA |
| 5 | Cierre repetido | Cerrar dos veces (o cinco a la vez) devuelve el mismo resultado sin cambiarlo; despues de cerrar no se aceptan respuestas | 1er cierre: finalizada con 200 pts (2 de 5) · 2do y 5 simultaneos: "repetida", misma hora de cierre · responder despues: partida_cerrada | PASA |
| 6 | Partida vencida | Pasado el tiempo (mas la gracia) no se aceptan respuestas; la partida queda vencida con lo respondido, no es valida y no cuenta como mejor partida | respuesta despues de tiempo + gracia: partida_vencida · cierre: vencida (no valida) con los 200 pts respondidos y 90 s · no cuenta como mejor partida · una vencida sin cerrar se cierra sola y consume el intento | PASA |
| 7 | Gracia de red y tiempo medido por el servidor | Una respuesta que llega 2 s despues del cierre (dentro de la gracia de 5 s) se acepta; el tiempo guardado sale del reloj del servidor y no supera la duracion | respuesta 2 s tarde: aceptada (gracia) y la partida queda finalizada con 90 000 ms (tope) · partida rapida: 13 ms = cierre - inicio del servidor | PASA |
| 8 | El reloj del celular no cambia el tiempo | Con el reloj del navegador adelantado una hora, la cuenta regresiva muestra lo que dice el servidor y la partida no vence antes de tiempo | reloj del navegador +1 h · la cuenta regresiva arranca en 1:29 (lo que dice el servidor) · la partida sigue abierta y acepta respuestas | PASA |
| 9 | Reconexion: cerrar, volver y perder la conexion a mitad de partida | Al volver se retoma la misma partida con el tiempo que de verdad queda; sin conexion la respuesta queda pendiente y se manda sola al reconectarse | al volver: "PREGUNTA 3 DE 5 · PARTIDA 1", reloj en 1:26 (siguio corriendo) · sin red: pendiente, 2 registradas · al reconectar: se mando sola, 3 · 1 sola partida | PASA |
| 10 | Puntaje manipulado | El cliente no puede crear ni modificar partidas, respuestas ni puntajes, ni mandar un puntaje a las funciones; la base rechaza un puntaje que no sea aciertos x puntos | crear 403 · modificar puntaje 403 · insertar/modificar respuestas 403/403 · borrar 403 · rpc con p_puntaje 400 · partida intacta (100 pts) · aun como dueno de la base, un puntaje que no sea aciertos x puntos: ck_partidas_puntaje | PASA |
| 11 | Intentos permitidos y mejor partida valida | Con 3 intentos, el cuarto se rechaza; cuenta la mejor partida (no la suma); a igual puntaje gana la mas rapida | intentos: 200, 400 (30 s), 400 (20 s) · el 4to: sin_intentos · cuenta la mejor: 400 pts en 20 s (no la suma, que daria 1000) · 200 pts del primero no se acumulan | PASA |
| 12 | Dos jugadores al mismo tiempo | Dos personas juegan a la vez desde dos navegadores: cada una tiene su partida, sus preguntas y su puntaje, y la base coincide con lo que ve cada una | A (celular): ve 500 pts, la base guarda 500 · B (compu): ve 300 pts, la base guarda 300 · una partida y 5 respuestas cada una | PASA |
| 13 | Puntaje final para el invitado y para la cuenta | Los dos ven su puntaje confirmado por el servidor; al invitado se le avisa que no entra al ranking y a la cuenta no | invitado: "Puntaje guardado", 600 pts (4 de 5 x 150) y el aviso de que no entra al ranking · cuenta: "Puntaje guardado", 750 pts, sin aviso | PASA |
| 14 | Evento cerrado, desafio en borrador y desafio congelado | Con el evento cerrado no se puede empezar; un desafio en borrador no se ve; con partidas jugadas, las reglas y el banco no se pueden cambiar | evento cerrado: evento_cerrado · desafio en borrador: no se ve y no se juega · con partidas: cambiar puntos, duracion, la solucion o agregar preguntas -> desafio_congelado | PASA |
| 15 | Volver a correr los scripts 11 a 14 no pierde partidas ni permisos | Partidas, respuestas y desafios quedan iguales y los permisos siguen cerrados | partidas 21, respuestas 64, preguntas 10: iguales · el banco sigue cerrado (403) · se sigue jugando | PASA |
| 16 | Pantallas de la competencia en el celular | Evento, partida y puntaje no desbordan a lo ancho a 360 ni 320 px | evento, partida (con codigo) y puntaje: sin desbordes a 360 y 320 px | PASA |

### Que cubre cada pedido de la consigna

| Pedido | Casos |
|---|---|
| Dos jugadores simultaneos | 12 |
| Respuesta de otra partida | 3 |
| Doble envio | 4 |
| Cierre repetido | 5 |
| Partida vencida | 6 (y 7, gracia de red) |
| Puntaje manipulado | 10 |
| Puntaje final al invitado y al registrado | 13 |
| Practica y competencia separadas | 1 |
| El servidor crea la partida, registra el dueno y fija preguntas y reglas | 2 |
| Tiempo medido en el servidor, reconexion | 7, 8, 9 |
| Intentos y mejor partida valida (regla del ranking) | 11 |
| Evento cerrado, desafio en borrador, congelamiento | 14 |
| Scripts que se pueden volver a correr | 15 |
| Pantallas en el celular | 16 |

## 17.4 Problemas encontrados y correcciones

### P1 · Volver a correr el evento de ejemplo fallaba con el desafio congelado

**Caso 15.** `14-evento-expo.sql` usaba `insert ... on conflict do nothing`. Con
el desafio ya congelado (tenia partidas), el disparador de congelamiento revisa
cada `insert` **antes** de que PostgreSQL detecte el conflicto, y rechazaba la
re-ejecucion. **Correccion:** las preguntas y opciones del ejemplo se insertan con
`where not exists`, asi las filas que ya estan ni siquiera se intentan insertar.

### P2 · La fuente de codigo dibujaba "<!--" como flechas

Visto en una captura: la fuente de las opciones tiene ligaduras y mostraba
`<!-- comentario -->` con flechas, que no es lo que hay que reconocer en la
pregunta. **Correccion:** las opciones se muestran sin ligaduras
(`font-variant-ligatures: none`). Afecta tambien a la practica, para mejor.

## 17.5 Lo que no se probo

- **El proyecto real de Supabase** y **el PostgREST real** (la capa HTTP es una
  imitacion; la app mira el `hint` de los errores, no el codigo HTTP).
- **Una red movil real**: se simulo cortando la conexion del navegador.
- **Muchas personas a la vez**: se probaron dos jugadores simultaneos desde dos
  navegadores y envios simultaneos de una misma persona, no carga.
