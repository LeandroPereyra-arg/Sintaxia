# 18. Ranking publico y administracion (etapa 7)

La etapa 7 tiene dos partes:

1. **La pantalla del ranking** que se proyecta en la computadora de la expo y se
   actualiza sola con Supabase Realtime.
2. **El panel de administracion**: contenidos, soluciones, eventos y desafios,
   con permisos controlados en Supabase, y el procedimiento de respaldo y
   recuperacion.

Las reglas de la competencia (partidas, puntaje, tiempo) son las de
[16. Competencia](16-competencia.md). Las pruebas estan en
[19. Registro de pruebas de la etapa 7](19-registro-de-pruebas-etapa7.md).

Diagrama: [`der/sintaxia-der-etapa7.png`](der/sintaxia-der-etapa7.png)
([`.drawio`](der/sintaxia-der-etapa7.drawio)).

---

## 18.1 La pantalla del ranking

| Ruta | Quien la abre | Que muestra |
|---|---|---|
| `/expo/:eventoId/ranking` | La computadora de la expo, **sin sesion** | Nombre del evento y, por cada desafio, los primeros 10: posicion, alias con codigo, puntaje y tiempo |
| `/ranking` | Cualquiera | Los eventos con enlace a su ranking y las reglas del ranking |
| `/expo/:eventoId/partidas/:partidaId` | El participante, al terminar | Su puntaje, su posicion (`mi_posicion`) y "Ver ranking", que abre la pantalla con su fila resaltada |

Usa el **mismo proyecto de Supabase** y el **mismo id de evento** que los
celulares: la pantalla no tiene datos propios, lee lo que el servidor guardo.

### Que se ve

- **Nombre del evento** arriba, en letra grande (64 px a 1920 px de ancho; las
  filas a 32 px), para leerlo a distancia.
- Un tablero por desafio con los **primeros 10 puestos**; los tres primeros,
  destacados.
- **La partida recien terminada se resalta** unos segundos (la fila que cambio
  desde la ultima consulta).
- **"Busca tu resultado"**: escribiendo el alias (o `Ana#0427`) se resalta la
  fila; si no esta entre los primeros 10, se agrega abajo con su posicion. Desde
  el celular, "Ver ranking" abre la pantalla con `?resaltar=<participante>`.
- **Estado de la conexion**: "En vivo", "Actualizando cada 15 s" (respaldo) o
  "Sin conexion"; la **hora de la ultima actualizacion** y un boton
  **Actualizar**.
- Sin conexion, un aviso dice que se perdio y de que hora son los datos que se
  ven.

### Como se mantiene al dia

```
carga inicial  ->  rpc ranking_evento(evento, 100)   (se muestran 10 por desafio)
                     |
Realtime: cambios en resultados_publicos (filtro evento_id = el evento)
                     |
             aviso  ->  espera 300 ms (junta varios)  ->  vuelve a consultar ranking_evento
```

- La pantalla **no se suscribe a una vista**: se suscribe a la tabla
  `resultados_publicos` (que esta en la publicacion `supabase_realtime`) y,
  cuando llega un aviso, **vuelve a consultar** la funcion de lectura. El aviso
  solo dice "algo cambio"; los datos salen siempre de la consulta.
- **Respaldo**: aunque Realtime este bien, consulta cada 60 s; si Realtime se
  cae o da error, cada 15 s.
- **Reconexion**: al volver la red (`online`) o al resuscribirse Realtime,
  consulta enseguida, asi aparece lo que paso mientras estaba cortado.

---

## 18.2 Que se publica: la tabla `resultados_publicos`

Las partidas y los perfiles son privados (etapas 4 y 6) y la pantalla corre con
el rol `anon`. En vez de abrir esas tablas se agrego una **tabla minima** con lo
unico que se muestra:

| Columna | Que es |
|---|---|
| `evento_id`, `desafio_id` | De que evento y desafio |
| `participante` | Identificador publico (`perfiles.id_publico`), hecho para esto: **no es el id de la cuenta** y no da acceso a nada. Sirve para resaltar la fila propia |
| `alias`, `codigo` | Lo que se anuncio: `Ana#0427` |
| `puntaje`, `duracion_ms`, `logrado_en` | De la **mejor partida valida** (regla de la etapa 6) |

Una fila por participante y desafio (clave `(desafio_id, participante)`). **La
escribe solo el servidor**, con disparadores:

| Cuando | Que hace |
|---|---|
| Una partida pasa a `finalizada` | Recalcula la mejor partida de esa persona en ese desafio y actualiza la fila solo si cambio (repetir con un puntaje peor no genera aviso) |
| Alguien cambia su alias | Actualiza sus filas |
| Un invitado crea su cuenta | Sus partidas pasan a contar y aparece |
| Una cuenta vuelve a ser invitada o se borra | Sus filas se borran |

**No se publica:** correos, ids de cuenta, partidas, respuestas, intentos,
partidas vencidas ni invitados.

### Lectura

`ranking_evento(p_evento_id, p_limite)` devuelve, por desafio publicado o
cerrado del evento, `posicion, alias, codigo, puntaje, duracion_ms, logrado_en,
participante`. Orden: puntaje (mayor), tiempo (menor), y a igualdad de los dos
**comparten el puesto** (`rank()`: 1, 1, 3). Es `security invoker`: aplica las
politicas de la tabla, que solo deja ver resultados de eventos visibles (no en
preparacion).

`mi_posicion(p_desafio_id)` (solo con sesion) devuelve la posicion propia, aunque
no este entre los primeros.

### Permisos

| | Publico (`anon`) | Invitado / cuenta |
|---|---|---|
| `resultados_publicos` | ver los de eventos visibles | igual |
| Escribir `resultados_publicos` | no | **no** |
| `partidas`, `perfiles`, respuestas | nada | solo lo propio |
| Realtime de `partidas` | error: no esta publicada | igual |

Realtime aplica las mismas politicas: un evento en preparacion no manda avisos al
publico.

### Lo que se anuncio

Desde la etapa 4 el aviso de datos dice que lo unico publico es el ranking de la
expo, con **alias y codigo**, **puntaje y tiempo de la mejor partida**, y que
**los invitados no aparecen**. La pantalla muestra exactamente eso (caso 8).

---

## 18.3 Quien es administrador

El rol esta en la tabla `administradores` (una fila por cuenta). Esa tabla **no
tiene ningun permiso para el cliente**: nadie se da el rol editando su perfil ni
escribiendo en la tabla.

Se otorga desde el **SQL Editor** del panel de Supabase (corre como `postgres`):

```sql
select public.otorgar_administrador('docente@escuela.edu.ar');
select public.quitar_administrador('docente@escuela.edu.ar');
```

Esas dos funciones solo las puede ejecutar `service_role` (o `postgres`). La
cuenta tiene que existir y no puede ser de invitado.

**El permiso real esta en la base.** Todas las funciones `admin_*` empiezan
llamando a `exigir_admin()`, que corta con el motivo `sin_permiso_admin` si quien
llama no es administrador. Ocultar el enlace "Administracion" del menu y la ruta
`/admin` es solo comodidad (caso 11).

---

## 18.4 El panel de administracion (`/admin`)

Dos pestanas: **Contenido** y **Eventos de expo**.

### Contenido

Cursos -> unidades -> lecciones -> preguntas con opciones. Se listan por su
`orden` y se filtran por curso, unidad, leccion y estado (borrador, publicado,
todos). La pestana y los filtros se recuerdan al recargar.

| Accion | Como |
|---|---|
| Crear y modificar | `admin_guardar_curso`, `admin_guardar_unidad`, `admin_guardar_leccion`, `admin_guardar_pregunta` (reciben el objeto entero) |
| Publicar / despublicar | `admin_cambiar_estado(tipo, id, estado)` |
| Eliminar | `admin_eliminar(tipo, id, confirmacion)`: hay que escribir el id |

**Validaciones** (en el editor, para avisar antes, y **otra vez en el servidor**):

| Regla | Motivo |
|---|---|
| Campos obligatorios, formato del id, largos, colores | restricciones de las tablas |
| La unidad, leccion o pregunta tiene que pertenecer a algo que existe | claves foraneas |
| Al menos dos opciones | `pocas_opciones` |
| Ninguna opcion vacia | `opcion_vacia` |
| Opciones distintas (sin importar mayusculas) | `opciones_repetidas` (y el indice `uq_opciones_texto`) |
| Exactamente una correcta | `una_correcta` |
| Una leccion publicada necesita al menos una actividad publicada | `leccion_incompleta` |

La ultima regla tambien se revisa si se despublica o se borra la ultima pregunta
publicada de una leccion publicada.

### Soluciones y explicaciones

Las soluciones (`opciones.es_correcta`) y las explicaciones
(`preguntas.explicacion`) **siguen sin poder leerse con un select**, tampoco
siendo administrador. El panel las pide con `admin_obtener_pregunta(id)` y las
guarda con `admin_guardar_pregunta`; los desafios, con `admin_listar_banco` y
`admin_guardar_pregunta_desafio`. Asi no se relajo la lectura publica (caso 13).

### Despublicar antes que eliminar

- **Eliminar pide escribir el id exacto** (`falta_confirmacion` si no coincide).
- **Lo que tiene historial no se elimina** (`tiene_historial`): una leccion con
  intentos, una pregunta con respuestas, un desafio con partidas. Se
  **despublica**: el publico deja de verlo y el historial de cada alumno queda.
- Eliminar respeta las relaciones: borrar un curso borra sus unidades,
  lecciones y preguntas **solo si ninguna tiene historial**; si alguna tiene, no
  se borra nada (todo corre en una transaccion).

### Eventos y desafios

| Paso | Que pasa |
|---|---|
| **Preparar** | El evento esta en `preparacion`: no se ve, no se juega y no manda avisos a la pantalla. Se crean los desafios y su banco de preguntas. |
| **Abrir** | `admin_cambiar_estado_evento(id, 'abierto')`. Se ve y se juega. |
| **Primera partida** | El desafio queda **congelado** (`congelado_en`): sus reglas (duracion, puntos, intentos, gracia) y sus preguntas ya no se pueden cambiar (`desafio_congelado`). Asi todas las partidas se juegan con las mismas reglas. |
| **Cambiar algo de un desafio congelado** | "Nueva version": `admin_nueva_version_desafio(id, nuevo_id)` copia el desafio y su banco en borrador con `version + 1`. Cada version tiene su propio ranking. |
| **Cerrar** | `admin_cambiar_estado_evento(id, 'cerrado')` (pide confirmacion). Las partidas que seguian en curso quedan **vencidas** (incompletas, no entran al ranking) y no se juega mas. El ranking queda visible. |

**Resultados separados por expo**: cada fila de `resultados_publicos` lleva su
`evento_id` y la pantalla filtra por evento, asi que dos exposiciones no se
mezclan (caso 9).

---

## 18.5 Respaldo y recuperacion

Hay tres cosas que respaldar, cada una con su metodo.

### 1. Los scripts (estructura, reglas y permisos)

Estan en el repositorio, en `supabase/`, y se versionan con git. Son la fuente
de verdad de la base: se pueden volver a correr sin borrar datos (caso 17).
Orden en un proyecto nuevo de Supabase (SQL Editor):

```
01-esquema.sql
02-datos-iniciales.sql
03-politicas-rls.sql
04-funcion-comprobar.sql
05-perfiles-y-progreso.sql
06-politicas-rls-etapa4.sql
07-limpieza-invitados.sql
08-intentos-y-respuestas.sql
09-funciones-intentos.sql
10-politicas-rls-etapa5.sql
11-competencia.sql
12-funciones-competencia.sql
13-politicas-rls-etapa6.sql
14-evento-expo.sql
15-ranking-publico.sql
16-administracion.sql
```

(`00-roles-locales.sql` es solo para la base local de pruebas: Supabase ya trae
esos roles y la publicacion `supabase_realtime`.)

### 2. El contenido (cursos, preguntas, soluciones, eventos y desafios)

Lo que se carga desde el panel no esta en los scripts. Se respalda con
`pg_dump` (viene con PostgreSQL) usando la cadena de conexion de la base, que
esta en el panel de Supabase (**Connect** -> cadena de conexion). Esa cadena
**incluye la contrasena de la base**: se pasa por una variable de entorno en la
terminal y **nunca se escribe en un archivo del repositorio** ni en este manual.

```bash
export SUPABASE_DB_URL='<cadena de conexion>'   # solo en la terminal
sh supabase/respaldo/respaldar-contenido.sh     # -> respaldo-contenido-AAAA-MM-DD-HHMM.sql
```

El archivo tiene las **soluciones** de las preguntas: guardalo fuera del
repositorio (el `.gitignore` ya ignora `respaldo-*.sql`), por ejemplo en la
unidad compartida de la escuela. Conviene hacerlo antes y despues de cada expo y
despues de cargar contenido nuevo.

No incluye cuentas, correos, intentos ni partidas (datos personales).

### 3. Todo, incluidas cuentas e historial

Lo hace Supabase: los proyectos pagos tienen **respaldos diarios** (Database ->
Backups) y se restauran desde ahi. En el plan gratuito, se puede hacer un volcado
completo con la CLI de Supabase (`supabase db dump`) o `pg_dump`; ese archivo
tiene datos personales y se guarda con el mismo cuidado que la base.

Para conservar el resultado de una expo alcanza con exportar la tabla
`resultados_publicos` a CSV desde el Table Editor al cerrar el evento.

### Recuperacion

**Se borro o se rompio contenido en el proyecto en uso:** restaurar el respaldo
diario de Supabase (o volver a cargar a mano desde el panel lo que falta). El
script de contenido no se usa sobre un proyecto con historial.

**Proyecto nuevo (se perdio el proyecto o se arma otro):**

1. Crear el proyecto y configurar Auth como en
   [12. Acceso y sesiones](12-acceso-y-sesiones.md).
2. Correr los scripts `01` a `16` en orden.
3. Cargar el contenido:
   ```bash
   export SUPABASE_DB_URL='<cadena de conexion del proyecto nuevo>'
   sh supabase/respaldo/restaurar-contenido.sh respaldo-contenido-AAAA-MM-DD-HHMM.sql
   ```
   Reemplaza el contenido de ejemplo por el del respaldo, en **una sola
   transaccion** (si falla, no cambia nada). Mientras carga desactiva los
   disparadores (`session_replication_role = replica`), asi los desafios
   congelados se recuperan con su banco intacto. **Se niega a seguir si la base
   ya tiene intentos o partidas**, para no borrar historial por error.
4. Otorgar de nuevo el rol de administrador (`otorgar_administrador`).
5. Poner en el `.env` de la app la URL y la **clave publicable** del proyecto
   nuevo (nunca la `service_role`).

Probado en la base local: respaldo de la base usada por las pruebas, base nueva
con los scripts `00` a `16`, recuperacion, y las nueve tablas quedaron identicas
(misma huella `md5` fila por fila); contra una base con partidas, se nego.

---

## 18.6 Puesta en marcha en Supabase

1. Correr `15-ranking-publico.sql` y `16-administracion.sql` despues de los
   anteriores. El `15` agrega `resultados_publicos` a la publicacion
   `supabase_realtime` (se ve en Database -> Publications).
2. Otorgar el rol de administrador a la cuenta del docente.
3. En la computadora de la expo abrir `https://<la app>/expo/expo-2026/ranking`
   en pantalla completa. No hace falta iniciar sesion.

---

## 18.7 Donde esta implementado

| Que | Archivo |
|---|---|
| Tabla publica, disparadores, `ranking_evento`, `mi_posicion`, publicacion | `supabase/15-ranking-publico.sql` |
| Administradores, validaciones, funciones `admin_*` | `supabase/16-administracion.sql` |
| Respaldo y recuperacion del contenido | `supabase/respaldo/respaldar-contenido.sh`, `restaurar-contenido.sh` |
| Lectura del ranking y Realtime | `src/servicios/ranking.js` |
| Operaciones del panel | `src/servicios/admin.js` |
| Pantallas | `src/views/RankingExpoView.vue`, `RankingView.vue`, `AdminView.vue`, `src/components/admin/EditorPregunta.vue` |
| Realtime simulado para las pruebas | `pruebas/local/realtime.mjs`, `pruebas/local/realtime-local.sql` |
| Pruebas | `pruebas/etapa7.mjs` ([registro](19-registro-de-pruebas-etapa7.md)) |
