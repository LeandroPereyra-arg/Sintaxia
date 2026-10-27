# 15. Registro de pruebas de la etapa 5

Pruebas de intentos, respuestas y progreso: correccion y calculo en el servidor,
peticiones repetidas, reglas de aprobacion y desbloqueo, cierre y reapertura,
otro dispositivo, desconexion y permisos entre participantes. Script:
[`pruebas/etapa5.mjs`](../pruebas/etapa5.mjs). El modelo esta explicado en
[14. Intentos, respuestas y progreso](14-intentos-y-progreso.md).

## 15.1 Contra que se prueba

El mismo entorno que la etapa 4 ([13.1](13-registro-de-pruebas-etapa4.md#131-contra-que-se-prueba-y-que-es-de-verdad)):

| Pieza | Es... |
|---|---|
| Supabase Auth (invitados, cuentas, sesiones) | El servidor real de Supabase (GoTrue), compilado desde su codigo fuente. |
| PostgreSQL, RLS, restricciones y las funciones `iniciar_intento`, `responder_actividad`, `abandonar_intento` | PostgreSQL 16 real con los scripts `00` a `10` de `supabase/`. Cada consulta corre con el rol y los claims del token que la hizo. |
| La app | Chromium real con la aplicacion de Vue. La desconexion se simula con el modo sin conexion del navegador (`setOffline`) y cortando peticiones puntuales. |
| API de datos (PostgREST) | **Simulada** (ver 15.5). |

## 15.2 Como reproducirlas

```bash
npm run auth:compilar        # una sola vez (hace falta Go)
npm run supabase:local       # arma la base desde cero con los scripts 00 a 10
npm run pruebas:entorno      # Auth + API de datos + correos + la app (queda corriendo)

# en otra terminal
npm run pruebas:etapa5       # SOLO=12,14 corre solo esos casos
```

Si Playwright no encuentra su navegador, se le puede indicar uno con
`CHROMIUM_PATH=/ruta/a/chrome` (vale para las pruebas de todas las etapas).

## 15.3 Resultados

Corrida completa desde una base nueva (`npm run supabase:local`), seguida de las
pruebas de las etapas anteriores para comprobar que nada se rompio:

| Script | Casos | Fallan |
|---|---|---|
| `npm run pruebas:etapa5` | 22 | 0 |
| `npm run pruebas:etapa4` | 35 | 0 |
| `npm run pruebas:etapa3` | 12 | 0 |
| `npm run pruebas:etapa2` | 11 | 0 |

Ninguna excepcion no atrapada en la pagina. La etapa 5 se corrio ademas varias
veces seguidas sobre la misma base, sin fallas (ver P3).

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | Un intento se corrige y se guarda en el servidor | Quedan la fecha, cada actividad con la opcion elegida y si fue correcta, los aciertos, los errores, el porcentaje, el estado y si aprobo | intento 1 · completado · 3 aciertos, 1 error, 75 % · aprobado · 4 respuestas con opcion, correccion, orden y hora · iniciado y finalizado con fecha | PASA |
| 2 | El celular no puede mandar aciertos ni porcentaje | Escribir intentos o respuestas directamente se rechaza, y las funciones no aceptan un parametro de aciertos | insert intentos 403 · update aciertos 403 · insert respuestas 403 · rpc con p_aciertos 400 · rpc con p_porcentaje 400 · el intento sigue en 1/4 | PASA |
| 3 | Peticion repetida al empezar un intento | Repetir iniciar_intento con el mismo id (una vez o cinco a la vez) devuelve el mismo intento y no crea otro | 1ra: creado · 2da: repetida=true, mismo id · 5 simultaneas: mismo intento · guardados: 1 · mismo id en otra leccion: rechazado | PASA |
| 4 | Peticion repetida al responder: una sola respuesta por actividad e intento | La misma respuesta repetida (o cinco a la vez) cuenta una vez; una opcion distinta despues no reemplaza la primera | repetida: 1 sola fila · otra opcion despues: vale la primera · 5 simultaneas: 1 guardada y 4 "repetida" · total 2 respuestas, 1 acierto y 1 error · duplicado directo en la tabla: rechazado por pk_respuestas | PASA |
| 5 | Repetir una leccion conserva los intentos anteriores | Cada repeticion es un intento nuevo (2, 3...); los anteriores quedan con sus respuestas, y un intento peor no quita la aprobacion | intentos 1, 2 y 3 guardados con 4 respuestas cada uno (4/4 aprobado, 1/4, 2/4) · la leccion 2 sigue habilitada por el intento 1 | PASA |
| 6 | Tres errores antes de la ultima actividad cortan el intento | El intento queda "sin vidas", no completado ni aprobado, y no acepta mas respuestas; el tercer error en la ultima si completa | 0 aciertos: sin_vidas tras 3 respuestas, 0 vidas · responder despues: intento_cerrado · 1/4 con el 3er error en la ultima: completado sin aprobar · la leccion 2 sigue bloqueada | PASA |
| 7 | El servidor aplica el desbloqueo acordado en la etapa 2 | No se puede empezar una leccion bloqueada aunque se arme la peticion; aprobar (60 %) la anterior la habilita, y la unidad 2 espera a la 1 | L2 sin nada: leccion_bloqueada · L2 con L1 en 50 %: leccion_bloqueada · L2 con L1 en 75 %: ok · L3 sin L2: leccion_bloqueada · U2 con U1 incompleta: leccion_bloqueada · U2 con U1 aprobada: ok | PASA |
| 8 | Empezar de nuevo con un intento a medias | El intento anterior queda "abandonado" con sus respuestas (no se borra) y hay un solo intento en curso por leccion | intento 1: abandonado, cerrado, conserva 1 respuesta · intento 2: en curso · forzar dos en curso en la tabla: rechazado por uq_intentos_en_curso | PASA |
| 9 | Un participante no cambia el progreso de otro | Responder, abandonar, reusar el id, leer o borrar intentos ajenos no tiene efecto; el progreso de B queda identico | responder/abandonar el de B: intento_no_encontrado · reusar su id: 409 · leer: 0 filas · borrar: 0 filas · modificar: 403 · progreso de B identico · sin sesion (anon): 401 | PASA |
| 10 | Cambiar el contenido publicado no altera el historial | Corregir la opcion correcta o despublicar una leccion no cambia los intentos ya guardados; borrar contenido con intentos se rechaza | tras corregir la opcion correcta: intento 1 sigue 4/4 y sus respuestas igual · leccion despublicada: el intento se sigue viendo · borrar la leccion: rechazado (fk_intentos_leccion) | PASA |
| 11 | El historial de la etapa 4 se conserva al migrar | Los renglones de intentos_leccion pasan a intentos "etapa4" completados, numerados despues de los existentes, y siguen habilitando lecciones | 2 renglones viejos -> intentos 2 y 3 (origen etapa4, completados; 4/4 aprobado, 2/4 no) · tabla vieja eliminada · la leccion 2 queda habilitada | PASA |
| 12 | Cerrar la app a mitad de una leccion y volver a abrirla | Al volver, la leccion ofrece seguir el intento: retoma en la actividad 3 con las vidas que tenia, y al terminar el resultado se confirma | al volver: "Tenes un intento sin terminar: 2 de 4 respondidas, 2 vidas. ..." · retoma en ejercicio 3 de 4 con 2 vidas · resultado confirmado 3/4, +8 XP · 1 solo intento en la base | PASA |
| 13 | Consultar el progreso desde otro dispositivo con una cuenta | Lo hecho en el dispositivo 1 aparece en el 2 (lecciones, ultimo intento, historial) y un intento a medias se retoma alla | dispositivo 2: L1 aprobada, L2 en curso, 2 intentos en el historial · abre L2 en el ejercicio 2 de 4, donde quedo en el dispositivo 1 | PASA |
| 14 | Perder la conexion al responder y cerrar la app | Sin conexion la respuesta queda "pendiente" (no se corrige ni se da por guardada); al volver a abrir con conexion se manda sola, una vez | sin red: "Pendiente: sin conexion", sin correccion, 0 guardadas · al reabrir con red: se mando sola, "Respuesta guardada", 1 guardada | PASA |
| 15 | Se pierde la respuesta del servidor y se repite la peticion | La respuesta llego pero la confirmacion no: la app la muestra pendiente; al reintentar el servidor devuelve la guardada sin sumar otra | sin confirmacion: la app dice "pendiente" aunque la base ya tenia 1 · reintento: "Muy bien!" y "Respuesta guardada" · respuestas: 1, aciertos: 1 | PASA |
| 16 | La pantalla de resultados no afirma lo que no confirmo | Sin conexion dice que no pudo confirmar (no "guardado"); con conexion muestra lo del servidor aunque la direccion traiga otros numeros | sin red: "No pudimos confirmar tu resultado" y ningun numero · con red: "Resultado guardado" con 2 correctas (la direccion decia 4) y +5 XP · intento ajeno: "No encontramos ese intento" | PASA |
| 17 | Salir de la leccion y empezar de nuevo | Salir deja el intento en curso (no se pierde nada); "Empezar de nuevo" crea el intento 2 y el 1 queda abandonado en el historial | salir: intento 1 sigue en curso · "Empezar de nuevo": ejercicio 1 de 4 del intento 2, el 1 abandonado · recargar no crea otro (2 intentos) | PASA |
| 18 | El perfil separa lecciones, ultimo intento e historial | Muestra completadas y pendientes; el mejor resultado y el ultimo intento por separado; y el historial con todos los intentos | L1 aprobada (mejor 100 %, ultimo 1/4), L2 pendiente (su intento quedo sin vidas), L3 bloqueada · "1 completadas · 2 pendientes" · historial: sin_vidas, completado, completado · sin desbordes a 360 y 320 px | PASA |
| 19 | Una leccion bloqueada no se puede abrir desde la direccion | Ir directo a las actividades de la leccion 2 muestra "Esta leccion esta bloqueada" y no crea ningun intento | "Esta leccion esta bloqueada" · intentos creados: 0 | PASA |
| 20 | Volver a correr los scripts 08 a 10 no pierde progreso ni permisos | Los intentos y respuestas quedan iguales y cada persona sigue viendo solo lo suyo | intentos 453 y respuestas 135 antes y despues · solo ve lo propio · escribir directo: 403 · las funciones siguen andando | PASA |
| 21 | Se pierde la respuesta al empezar el intento y se reintenta | El servidor ya lo habia creado: al reintentar la app manda el mismo id y queda un solo intento | la primera peticion creo 1 intento y su respuesta se perdio · "Reintentar" repite el mismo id · intentos: 1 | PASA |
| 22 | Vuelve la conexion con la leccion abierta | La respuesta pendiente se manda sola al reconectarse, sin tocar nada, y se guarda una vez | sin red: pendiente, 0 guardadas · al reconectar: "Respuesta guardada" sola, 1 guardada | PASA |

### Que cubre cada pedido de la consigna

| Pedido | Casos |
|---|---|
| Cierre y reapertura | 12, 14 |
| Repeticion de una leccion | 5, 8, 17 |
| Consulta desde otro dispositivo con una cuenta | 13 |
| Desconexion | 14, 15, 16, 22 |
| Peticion repetida | 3, 4, 15, 21 |
| Un participante no cambia el progreso de otro | 9 (y 2, 16) |
| No aceptar aciertos ni porcentaje del celular | 2 |
| Reglas de aprobacion y desbloqueo de la etapa 2 en el servidor | 5, 6, 7, 19 |
| Que se conserva de cada intento | 1, 8, 10 |
| Perfil: completadas, pendientes, ultimo intento e historial | 18, 13 |
| Progreso separado de la publicacion del contenido | 10 |
| Historial anterior y scripts que se pueden volver a correr | 11, 20 |

## 15.4 Problemas encontrados y correcciones

### P1 · Una leccion bloqueada mostraba la actividad igual

**Caso 19.** Al entrar por la direccion a las actividades de una leccion bloqueada,
el servidor rechazaba el intento (`leccion_bloqueada`) pero la pantalla mostraba
la primera actividad igual, porque solo esperaba a tener el contenido.
**Correccion:** la actividad se muestra recien cuando hay un intento confirmado por
el servidor y no hubo error. Ahora aparece "Esta leccion esta bloqueada" y no se
crea ningun intento.

### P2 · Reintentar "empezar de nuevo" podia retomar el intento viejo

Revisando el codigo: si el pedido de un intento nuevo (`?nuevo=1`) no llegaba al
servidor, el reintento buscaba el intento en curso y retomaba el **anterior** en vez
de crear el nuevo. **Correccion:** el id generado se guarda hasta que el servidor
contesta y cada reintento lo vuelve a mandar tal cual (`iniciar_intento` es
idempotente). Caso 21: la primera respuesta se pierde, "Reintentar" repite el
mismo id y queda un solo intento.

### P3 · Caso 14 intermitente: la pestana que se cerraba reenviaba la respuesta

En 2 de cada 10 corridas, al volver a abrir la leccion la respuesta pendiente ya
estaba guardada. No era un error de la app: la prueba devolvia la conexion
mientras la pestana se estaba cerrando, esa pestana todavia escuchaba el evento
`online` y reenviaba ella misma la respuesta (que es justamente lo que tiene que
hacer). **Correccion de la prueba:** se descarga la app antes de cerrar la pestana,
asi "cerrar la app" es determinista (10 de 10). (El script de la prueba que marca la
bienvenida como vista tambien se protegio: en `about:blank` no hay `localStorage`.) Y como el reenvio al reconectarse
no estaba probado a proposito, se agrego el **caso 22**.

### P4 · Las pruebas de etapas anteriores asumian que cada visita empezaba de cero

Con el intento en curso que se retoma, los recorridos de las etapas 3 y 4 que
entraban dos veces a la misma leccion continuaban el intento anterior y buscaban
una actividad que ya estaba respondida. **Correccion:** esos recorridos entran con
`?nuevo=1` (un intento desde cero), que es lo que querian probar. Los casos de la
etapa 4 que escribian en `intentos_leccion` ahora resuelven la leccion por las
funciones del servidor; el caso 29 ("falla el guardado") pasa a probar una
respuesta pendiente en vez del guardado final, que ya no existe.

### P5 · La pantalla de resultados mostraba "+0 XP" al llegar directo

Lo mostro una captura, no una prueba: al terminar una leccion entrando directo a las
actividades (o recargando la pantalla de resultados), decia "+0 XP" y "Unidad 1 ·
0 %" aunque la leccion quedaba aprobada. El XP de cada leccion y el progreso de la
unidad salen del catalogo del curso, y esa pantalla no lo cargaba: dependia de que
otra pantalla lo hubiera cargado antes. **Correccion:** la pantalla de resultados
carga el catalogo del curso de la leccion. Se agrego la verificacion al caso 16
(abre los resultados en una carga nueva): sin la correccion falla con "XP mostrado: 0".

## 15.5 Lo que no se probo

- **El proyecto real de Supabase en la nube** y **el PostgREST real**: sin acceso desde
  este entorno. La API de datos es una imitacion; los permisos los aplica PostgreSQL de
  verdad, pero los codigos HTTP pueden diferir (por ejemplo, PostgREST responde 404 a una
  funcion con un parametro que no existe y la imitacion 400). La app no depende del
  codigo: mira el `hint` del error.
- **Una red movil real** (conexiones lentas o que se cortan a mitad de la respuesta): se
  simulo cortando la conexion del navegador y descartando respuestas puntuales.
- **La app instalada en el celular**: sigue siendo web; la version con Quasar es
  posterior.
- **Muchos usuarios a la vez**: las peticiones simultaneas se probaron para una misma
  persona (cinco a la vez), no con carga.
