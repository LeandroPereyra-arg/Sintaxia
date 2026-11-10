# 19. Registro de pruebas de la etapa 7

Pruebas de la pantalla del ranking (tres participantes en tres dispositivos y la
pantalla en un cuarto navegador, empates, actualizaciones, recarga, caida de la
red y de Realtime, permisos de lectura) y del panel de administracion (cuenta
comun contra cuenta autorizada, validaciones, soluciones, despublicar contra
eliminar, eventos y versiones). Script: [`pruebas/etapa7.mjs`](../pruebas/etapa7.mjs).
Lo que se prueba esta explicado en
[18. Ranking publico y administracion](18-ranking-y-administracion.md).

## 19.1 Contra que se prueba

| Pieza | Es... |
|---|---|
| Supabase Auth (invitados y cuentas) | El servidor real de Supabase (GoTrue), compilado desde su codigo fuente. |
| PostgreSQL, RLS, disparadores y funciones | PostgreSQL 16 real con los scripts `00` a `16` de `supabase/`. Cada consulta corre con el rol y los claims del token que la hizo. |
| La app y la pantalla del ranking | Chromium real con la aplicacion de Vue. Cada participante y la pantalla son **contextos de navegador separados** (sin cookies ni almacenamiento compartido), como dispositivos distintos. |
| API de datos (PostgREST) | **Simulada**: la capa HTTP es una imitacion; los permisos los aplica PostgreSQL. |
| Supabase Realtime | **Simulado** (`pruebas/local/realtime.mjs`): habla el mismo protocolo que usa `@supabase/supabase-js` por WebSocket. Avisa solo cambios de tablas que estan en la publicacion `supabase_realtime`, y antes de mandar cada aviso revisa con PostgreSQL, **con el rol y el token de quien escucha**, que pueda ver esa fila (como Realtime con RLS). Se puede cortar a pedido para probar la reconexion. |

## 19.2 Como reproducirlas

```bash
npm run supabase:local       # arma la base desde cero con los scripts 00 a 16
npm run pruebas:entorno      # Auth + API de datos + Realtime + la app (queda corriendo)

# en otra terminal
npm run pruebas:etapa7       # SOLO=1,5 corre solo esos casos
```

Al terminar, el script borra el contenido y los eventos que creo desde el panel,
para que las pruebas de las etapas anteriores vuelvan a encontrar el contenido
inicial. La cuenta administradora de las pruebas se crea con
`otorgar_administrador(correo)` llamada con la clave de servicio de la base
local, igual que se haria desde el servidor.

## 19.3 Resultados

Corrida completa desde una base nueva, seguida de las pruebas de las etapas
anteriores:

| Script | Casos | Fallan |
|---|---|---|
| `npm run pruebas:etapa7` | 17 | 0 |
| `npm run pruebas:etapa6` | 16 | 0 |
| `npm run pruebas:etapa5` | 22 | 0 |
| `npm run pruebas:etapa4` | 35 | 0 |
| `npm run pruebas:etapa3` | 12 | 0 |
| `npm run pruebas:etapa2` | 11 | 0 |

Ninguna excepcion no atrapada en la pagina.

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | Tres participantes en tres dispositivos y la pantalla en un cuarto navegador | La pantalla (sin sesion) se actualiza sola cuando cada uno termina; los puntajes coinciden con los celulares y con la base; la partida recien terminada se resalta | Abril#5370: 500 en el celular = 500 en la pantalla = 500 en la base · Bauti#2828: 300 en el celular = 300 en la pantalla = 300 en la base · Cami#3435: 400 en el celular = 400 en la pantalla = 400 en la base · sin recargar la pantalla · cada una resaltada al llegar | PASA |
| 2 | Empates y mejor partida | A igual puntaje gana el menor tiempo; con igual puntaje y tiempo comparten el puesto (1, 1, 3); repetir con un resultado peor no cambia la fila y con uno mejor la actualiza, sin duplicarla | 600/40 s, 600/40 s y 600/55 s -> puestos 1, 1, 3 · repetir con 300 pts: la fila sigue en 600 (una sola fila) · cuenta la mejor, no la suma | PASA |
| 3 | Recarga, boton Actualizar y ultima actualizacion | Recargar muestra lo mismo; "Actualizar" vuelve a consultar y cambia la hora de la ultima actualizacion | antes y despues de recargar: 3 filas iguales · ultima actualizacion 02:26:28 a. m. -> 02:26:29 a. m. al tocar "Actualizar" | PASA |
| 4 | La pantalla pierde la conexion y la recupera | Sin conexion lo avisa y muestra la hora de los datos; lo que pasa mientras tanto aparece al volver, sin recargar | sin red: "Se perdio la conexion. Se muestra el ranking de las 02:26:31 a. m.; se..." · el resultado jugado mientras tanto aparecio al volver la red, sin recargar · estado de nuevo "En vivo" | PASA |
| 5 | Se cae Realtime: respaldo y reconexion | Con Realtime caido la pantalla pasa a consulta periodica; al volver Realtime se resuscribe y consulta de nuevo, y aparece lo que paso en el medio | Realtime cortado 4 s: la pantalla muestra "Actualizando cada 15 s" · al reconectarse vuelve a "En vivo" y muestra el resultado jugado durante la caida | PASA |
| 6 | Permisos de lectura de la pantalla | Sin sesion se leen solo posicion, alias, codigo, puntaje, tiempo y desafio; no partidas, perfiles, respuestas, correos ni ids de cuenta; nadie escribe resultados | ranking: solo desafio_id, desafio, orden, posicion, alias, codigo, puntaje, duracion_ms, logrado_en, participante · sin correos ni ids de cuenta · partidas/perfiles/respuestas sin sesion: 401/401/401 · escribir resultados: 401 (publico) y 403 (cuenta) | PASA |
| 7 | Realtime respeta la publicacion y los permisos | Suscribirse a una tabla privada (partidas) da error; un evento en preparacion no manda avisos al publico; los invitados no generan avisos | partidas (no publicada): error del canal y 0 avisos · partida de invitado: 0 avisos · evento en preparacion: 0 avisos al publico · evento abierto: el aviso llega | PASA |
| 8 | Lo publico coincide con lo anunciado | El aviso de datos y la pagina de ranking dicen alias con codigo, puntaje y tiempo, solo cuentas; eso es lo que muestra la pantalla; un cambio de alias se refleja; un invitado que crea su cuenta aparece | aviso de datos y pagina de ranking: alias con codigo, puntaje y tiempo, sin invitados · la pantalla muestra eso · Antes -> Despues en vivo · un invitado no figura y al crear su cuenta aparece como Convertida | PASA |
| 9 | Resultados separados por exposicion | Una partida de otro evento no aparece en el ranking de expo-2026, y viceversa | la partida de "Otra expo" esta solo en su ranking (1 fila) y no en el de expo-2026 (11 filas) | PASA |
| 10 | La pantalla se lee a distancia y en distintas pantallas | Nombre del evento y filas legibles (letra grande), sin desbordes en 1920, 1280 y 412 px; el buscador resalta el resultado propio | a 1920 px: titulo 64px y filas 32px · sin desborde a 1920, 1280 ni 412 px · buscar "Offline#6049" resalta su fila | PASA |
| 11 | Una cuenta comun no puede administrar ni darse el rol | El panel le dice que no tiene permiso; todas las funciones admin y las escrituras directas se rechazan; no puede otorgarse el rol ni con la funcion ni escribiendo la tabla | funciones admin: sin_permiso_admin · escrituras directas y "darse el rol": 403/403/403/403/403/403/400 · es_admin = false · el panel dice "No tenes permiso" | PASA |
| 12 | Una cuenta autorizada crea y publica contenido desde el panel | Crea curso, unidad, leccion y pregunta con opciones; no puede publicar la leccion vacia; al publicar, el publico la ve; las opciones repetidas o con dos correctas se rechazan | curso -> unidad -> leccion -> pregunta desde el panel · publicar la leccion vacia: "La leccion no se puede publicar: necesita al menos una activ" · opciones repetidas: el editor avisa · publicado: el publico ve la leccion y sus 2 opciones · por la API: opciones_repetidas, una_correcta, pocas_opciones | PASA |
| 13 | Soluciones solo por la operacion de administrador | El administrador ve y cambia la solucion con admin_obtener_pregunta; con un select comun sigue sin poder leer es_correcta ni la explicacion (no se relajo la lectura) | admin_obtener_pregunta: devuelve la correcta ("En el navegador de quien visit...") y la explicacion · select de es_correcta o explicacion, aun como administrador: 403 | PASA |
| 14 | Despublicar antes que eliminar | Eliminar pide escribir el id; lo que tiene historial no se puede eliminar (se despublica); despublicar lo oculta al publico sin perder el historial | eliminar sin escribir el id: falta_confirmacion · con historial: tiene_historial (la leccion sigue) · despublicada: el publico no la ve y el alumno conserva su intento · se vuelve a publicar | PASA |
| 15 | Eventos: preparar, abrir, congelar, nueva version y cerrar | Un evento en preparacion no se ve; al abrirlo se juega; con partidas el desafio no deja cambiar reglas ni preguntas (se crea otra version); al cerrarlo las partidas en curso quedan vencidas y no se juega mas | preparacion: invisible y no se juega · abierto: se juega · con partidas: cambiar duracion o agregar pregunta -> desafio_congelado · nueva version v2 en borrador con 2 preguntas copiadas · cerrar: 1 partida en curso -> vencida, ya no se juega | PASA |
| 16 | El panel mantiene filtros y orden | Los contenidos se listan por su orden; el curso, la unidad y el filtro de estado elegidos se mantienen al recargar | lecciones en orden: js-u1-l1, js-u1-l2, js-u1-l3 · tras recargar siguen elegidos el curso "javascript" y el filtro "publicado" | PASA |
| 17 | Volver a correr los scripts 15 y 16 no pierde resultados, roles ni permisos | Resultados publicos, administradores y permisos quedan iguales | resultados 12 y administradores 1: iguales · la cuenta comun sigue sin permiso, el administrador lo conserva, el ranking se sigue leyendo | PASA |

Ademas se probo a mano el **respaldo y la recuperacion** del contenido
(seccion 18.5): respaldo de la base usada por estas pruebas (con desafios
congelados y contenido creado desde el panel), base nueva con los scripts `00` a
`16`, recuperacion con `restaurar-contenido.sh`, y las nueve tablas de contenido
quedaron identicas (huella `md5` fila por fila). Contra una base con partidas el
script se nego y no cambio nada.

## 19.4 Problemas encontrados y corregidos

### P1 · La validacion de opciones fallaba al guardar desde el panel

**Caso 12.** Las validaciones de opciones y de leccion completa son disparadores
diferidos: corren al confirmar la transaccion, **con el rol de quien la hizo**.
Llamadas desde una funcion `admin_*`, corrian como `authenticated`, que no puede
leer `opciones.es_correcta`, y fallaban con "permiso denegado". **Correccion:**
las funciones de esos disparadores pasan a `security definer` (con
`search_path` fijo) en `16-administracion.sql`. No se abrio ningun permiso de
lectura: el select de soluciones sigue rechazado (caso 13).

### P2 · El disparador de leccion completa no compilaba con CASE

`fn_validar_leccion_completa` sirve para `lecciones` y para `preguntas`. Con un
`CASE`, PL/pgSQL rechazaba nombrar `new.leccion_id` cuando el disparador era de
`lecciones`, aunque esa rama no se usara. **Correccion:** ramas con `IF`.

### P3 · Suscribirse a una tabla no publicada no da `CHANNEL_ERROR`

**Caso 7.** Realtime acepta unirse al canal y despues avisa con un mensaje
`system` de estado `error` que la tabla no esta en la publicacion; el cliente ve
el canal como suscripto y simplemente no le llega nada. La prueba esperaba
`CHANNEL_ERROR`. **Correccion:** la prueba escucha ese mensaje y ademas verifica
que no llegue ningun aviso de `partidas`. La pantalla ya trataba ese mensaje como
error y pasaba a consulta periodica.

### P4 · La pantalla del ranking tenia un `<main>` dentro de otro

La pantalla se dibuja dentro del `<main>` de la app. **Correccion:** el
contenedor de la pantalla es un `<div>`.

### P5 · Una prueba de la etapa 5 publicaba una leccion vacia

**Regresion, etapa 5, caso 7.** La prueba de desbloqueo creaba una leccion ya
publicada y le agregaba la actividad despues. Con la regla nueva (una leccion
publicada necesita una actividad publicada) la base la rechazo, que es lo
correcto. **Correccion en la prueba:** crea la leccion en borrador, le agrega la
actividad y despues la publica, como hace el panel.

### P6 · Imitacion de la API (solo pruebas)

- Las funciones que devuelven una tabla (`ranking_evento`) llegaban como un texto
  compuesto: la imitacion ahora detecta las funciones de conjunto y devuelve una
  lista, como PostgREST.
- `resultados_publicos` y `administradores` no estaban en la lista de tablas de la
  imitacion y respondian 404 en vez del permiso de la base (caso 6). Agregadas:
  ahora responden 401/403 como corresponde.

## 19.5 Lo que no se probo

- **El proyecto real de Supabase**, el **PostgREST real** y el **Realtime real**:
  la capa HTTP y Realtime son imitaciones. Los permisos los aplica la misma base,
  pero el comportamiento fino de Realtime (por ejemplo, cuanto tarda en
  reconectarse) puede ser distinto. Por eso la pantalla no depende solo de los
  avisos: vuelve a consultar cada 60 s aunque este "En vivo".
- **Una pantalla encendida durante horas**: se probaron cortes de unos segundos
  de la red y de Realtime, no una expo completa.
- **Muchos participantes a la vez**: tres dispositivos y la pantalla, no carga.
- **El respaldo contra Supabase**: los scripts de respaldo se probaron contra la
  base local con `pg_dump`/`psql` 16; contra Supabase hace falta la cadena de
  conexion del proyecto, que no esta en el repositorio.
