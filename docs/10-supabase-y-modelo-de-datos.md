# 10. Supabase: modelo de datos, permisos y conexion con la aplicacion

Documento de la **etapa 3**. Explica como quedo la base de datos relacional en
Supabase, que guarda cada tabla, quien puede leer que, y como la aplicacion de
Vue consulta el contenido.

- Diagrama entidad-relacion: [`der/sintaxia-der-etapa3.drawio`](der/sintaxia-der-etapa3.drawio)
  (vista previa en [`der/sintaxia-der-etapa3.png`](der/sintaxia-der-etapa3.png))
- Scripts: [`supabase/`](../supabase/) · datos del proyecto en [`supabase/README.md`](../supabase/README.md)
- Registro de pruebas: [`11-registro-de-pruebas-etapa3.md`](11-registro-de-pruebas-etapa3.md)

---

## 10.1 Que informacion corresponde a cada nivel

La etapa 2 tenia el contenido en archivos de JavaScript, con las lecciones
anidadas dentro de las unidades y las actividades dentro de las lecciones. Al
pasarlo a una base relacional hubo que separar cada nivel en su propia tabla y
decidir donde vive cada dato para no repetirlo.

| Nivel | Que le corresponde | Que NO le corresponde |
|---|---|---|
| **Curso** | Nombre, descripcion, nivel, color e icono de la marca del lenguaje, estado de publicacion, orden en el catalogo | La cantidad de unidades o lecciones reales: se cuenta consultando las tablas hijas |
| **Unidad** | Titulo, descripcion, icono, color, temas que cubre, orden dentro del curso | El curso al que pertenece se guarda una sola vez, como clave foranea |
| **Leccion** | Titulo, descripcion, XP, la explicacion teorica y el ejemplo de codigo, orden dentro de la unidad | La unidad y el curso: el curso se deduce subiendo por la unidad |
| **Pregunta** | Enunciado, codigo opcional, tipo de actividad, orden dentro de la leccion | El texto de las opciones |
| **Opcion** | El texto que ve el estudiante y su orden | Nada del enunciado: solo apunta a la pregunta |
| **Solucion** | `opciones.es_correcta` (cual es) y `preguntas.explicacion` (por que) | No se expone al cliente: la entrega la funcion `comprobar_respuesta` |

Decisiones que evitan repetir informacion:

- **El curso no guarda contadores.** En la etapa 2 el curso decia
  "6 unidades, 14 lecciones" y esos numeros podian quedar desactualizados.
  Ahora la cantidad real se cuenta consultando `unidades` y `lecciones`. Lo unico
  que queda en la tabla son `unidades_previstas` y `lecciones_previstas`, que son
  otra cosa: el plan de un curso que **todavia no tiene contenido cargado**.
- **La ruta de la pantalla no se guarda.** Antes cada curso traia
  `ruta: { name: 'curso-javascript' }`, que es un dato de la aplicacion, no del
  contenido. Ahora la arma el modulo de acceso a datos a partir del estado.
- **La solucion vive en un solo lugar.** `es_correcta` esta en la opcion, no
  repetida como "id de la respuesta" en la pregunta.
- **Cada relacion se guarda una sola vez**, siempre hacia arriba: la opcion sabe
  su pregunta, la pregunta su leccion, la leccion su unidad y la unidad su curso.

## 10.2 Relaciones

```
cursos  1 ──< N  unidades  1 ──< N  lecciones  1 ──< N  preguntas  1 ──< N  opciones
```

| Relacion | Clave foranea | Al borrar el padre | Regla |
|---|---|---|---|
| curso → unidades | `unidades.curso_id` | `on delete cascade` | Una unidad pertenece a exactamente un curso |
| unidad → lecciones | `lecciones.unidad_id` | `on delete cascade` | Una leccion pertenece a exactamente una unidad |
| leccion → preguntas | `preguntas.leccion_id` | `on delete cascade` | Una pregunta pertenece a exactamente una leccion |
| pregunta → opciones | `opciones.pregunta_id` | `on delete cascade` | Una opcion pertenece a exactamente una pregunta |

El borrado en cascada es intencional: una opcion sin pregunta, o una leccion sin
unidad, no significan nada. Tambien hay `on update cascade`, para poder corregir
un identificador mal escrito sin romper las filas hijas.

---

## 10.3 Diccionario de datos

Convenciones: **PK** clave primaria, **FK** clave foranea, **U** parte de una
restriccion unica. "Obligatorio" quiere decir `not null`.

### Tabla `cursos`

Catalogo de cursos que ofrece Sintaxia.

| Campo | Tipo | Obligatorio | Clave | Descripcion y restricciones |
|---|---|---|---|---|
| `id` | `text` | si | PK | Identificador legible (`javascript`, `html-css`). `CHECK` de formato: minusculas, numeros y guiones |
| `nombre` | `text` | si | | Entre 1 y 60 caracteres |
| `descripcion` | `text` | si | | Entre 1 y 400 caracteres |
| `nivel` | `text` | si | | `CHECK`: Principiante, Intermedio o Avanzado |
| `icono` | `text` | si | | Texto corto que se dibuja en la tarjeta (`JS`, `Py`) |
| `color` | `text` | si | | `CHECK` de formato hexadecimal `#rrggbb` |
| `color_texto` | `text` | si | | Color del texto sobre ese fondo. Mismo `CHECK` |
| `estado` | `text` | si | | `CHECK`: borrador, proximamente, disponible, bloqueado. Por defecto `borrador` |
| `requisito` | `text` | no | | Que hace falta para desbloquearlo. `CHECK`: obligatorio si el estado es `bloqueado` |
| `horas_estimadas` | `smallint` | no | | `CHECK`: mayor que 0 |
| `unidades_previstas` | `smallint` | no | | Unidades planificadas (para cursos sin contenido cargado) |
| `lecciones_previstas` | `smallint` | no | | Lecciones planificadas |
| `etiquetas` | `text[]` | si | | Temas del curso. Por defecto `{}` |
| `orden` | `smallint` | si | U | Posicion en el catalogo. `UNIQUE` y `CHECK` mayor que 0 |
| `creado_en` | `timestamptz` | si | | Por defecto `now()` |
| `actualizado_en` | `timestamptz` | si | | Lo mantiene un disparador en cada `UPDATE` |

### Tabla `unidades`

Bloques tematicos de un curso.

| Campo | Tipo | Obligatorio | Clave | Descripcion y restricciones |
|---|---|---|---|---|
| `id` | `text` | si | PK | `js-u1`, `js-u2`... Mismo `CHECK` de formato |
| `curso_id` | `text` | si | FK, U | Referencia a `cursos(id)`, en cascada |
| `orden` | `smallint` | si | U | Numero de unidad dentro del curso. `UNIQUE (curso_id, orden)` y `CHECK` mayor que 0 |
| `titulo` | `text` | si | | Entre 1 y 80 caracteres |
| `descripcion` | `text` | si | | Entre 1 y 400 caracteres |
| `icono` | `text` | si | | Nombre del icono del set de la aplicacion |
| `color` | `text` | si | | Hexadecimal `#rrggbb` |
| `estado` | `text` | si | | `CHECK`: borrador, proximamente, publicada |
| `temas` | `text[]` | si | | Lista de temas que cubre. Por defecto `{}` |
| `creado_en` / `actualizado_en` | `timestamptz` | si | | Igual que en `cursos` |

### Tabla `lecciones`

Teoria y ejemplo de codigo de cada leccion.

| Campo | Tipo | Obligatorio | Clave | Descripcion y restricciones |
|---|---|---|---|---|
| `id` | `text` | si | PK | `js-u1-l1`... |
| `unidad_id` | `text` | si | FK, U | Referencia a `unidades(id)`, en cascada |
| `orden` | `smallint` | si | U | Numero de leccion dentro de la unidad. `UNIQUE (unidad_id, orden)` |
| `titulo` | `text` | si | | Entre 1 y 80 caracteres |
| `descripcion` | `text` | si | | Entre 1 y 400 caracteres |
| `icono` | `text` | si | | Nombre del icono |
| `xp` | `smallint` | si | | Experiencia que otorga. `CHECK` entre 0 y 100. Por defecto 10 |
| `explicacion` | `text` | si | | Teoria de la leccion. `CHECK`: al menos 20 caracteres |
| `ejemplo_titulo` | `text` | no | | Titulo del ejemplo de codigo |
| `ejemplo_codigo` | `text` | no | | Codigo de ejemplo, con sus saltos de linea |
| `ejemplo_nota` | `text` | no | | Aclaracion debajo del ejemplo |
| `estado` | `text` | si | | `CHECK`: borrador o publicada |
| `creado_en` / `actualizado_en` | `timestamptz` | si | | |

`CHECK ck_lecciones_ejemplo`: el ejemplo es opcional, pero si esta tiene que
tener titulo y codigo juntos, y la nota solo puede existir si hay codigo.

### Tabla `preguntas`

Actividades de una leccion. En esta etapa todas son de opcion multiple.

| Campo | Tipo | Obligatorio | Clave | Descripcion y restricciones |
|---|---|---|---|---|
| `id` | `text` | si | PK | `js-u1-l1-a1`... |
| `leccion_id` | `text` | si | FK, U | Referencia a `lecciones(id)`, en cascada |
| `orden` | `smallint` | si | U | Numero de actividad dentro de la leccion. `UNIQUE (leccion_id, orden)` |
| `tipo` | `text` | si | | `CHECK`: opcion-multiple, verdadero-falso, completar, ordenar. Por defecto `opcion-multiple` |
| `enunciado` | `text` | si | | Entre 5 y 400 caracteres |
| `codigo` | `text` | no | | Fragmento de codigo que acompania la consigna |
| `explicacion` | `text` | si | | **Solucion**: por que la respuesta correcta lo es. `CHECK`: al menos 10 caracteres. El rol `anon` no tiene permiso de lectura sobre esta columna |
| `estado` | `text` | si | | `CHECK`: borrador o publicada |
| `creado_en` / `actualizado_en` | `timestamptz` | si | | |

### Tabla `opciones`

Opciones de respuesta de una pregunta.

| Campo | Tipo | Obligatorio | Clave | Descripcion y restricciones |
|---|---|---|---|---|
| `id` | `text` | si | PK | `js-u1-l1-a1-a`... |
| `pregunta_id` | `text` | si | FK, U | Referencia a `preguntas(id)`, en cascada |
| `orden` | `smallint` | si | U | Posicion de la opcion. `UNIQUE (pregunta_id, orden)` |
| `texto` | `text` | si | | Entre 1 y 200 caracteres |
| `es_correcta` | `boolean` | si | | **Solucion**. Por defecto `false`. El rol `anon` no tiene permiso de lectura |
| `marca_correcta` | `boolean` | no | U | Columna **generada**: `true` si la opcion es correcta, `NULL` si no |
| `creado_en` / `actualizado_en` | `timestamptz` | si | | |

### Como se garantiza una sola respuesta correcta

Son dos reglas que se complementan:

1. **Como maximo una.** `marca_correcta` vale `true` en la opcion correcta y
   `NULL` en las demas. Como PostgreSQL considera distintos entre si a los
   `NULL` dentro de un indice unico, la restriccion
   `UNIQUE (pregunta_id, marca_correcta)` deja pasar tantas opciones
   incorrectas como haga falta, pero **rechaza una segunda correcta**.

   ```sql
   marca_correcta boolean generated always as (case when es_correcta then true end) stored,
   constraint uq_opciones_correcta unique (pregunta_id, marca_correcta)
   ```

2. **Al menos una, y al menos dos opciones.** Eso no se puede expresar con un
   `CHECK` de fila, porque depende de las demas filas. Se valida con un
   disparador diferido (`create constraint trigger ... deferrable initially
   deferred`) que se ejecuta al cerrar la transaccion, de modo que se pueda
   insertar la pregunta y sus opciones en el mismo bloque. Si al terminar la
   transaccion una pregunta publicada de opcion multiple no tiene exactamente
   una correcta, o tiene menos de dos opciones, la transaccion se cancela.

### Estado de publicacion contra progreso del participante

| | Estado de publicacion | Progreso del participante |
|---|---|---|
| Que responde | Este contenido, esta terminado y visible? | Esta persona, hizo esta leccion? |
| Quien lo decide | El equipo que carga el contenido | Lo que hace cada estudiante |
| Donde vive hoy | Columna `estado` de cursos, unidades, lecciones y preguntas | En memoria y en `localStorage`, calculado por `useProgreso` |
| Donde va a vivir | Igual | Tablas `usuarios`, `progreso_lecciones` y `respuestas` (etapa siguiente, punteadas en el DER) |
| Ejemplo | La unidad 2 esta en `proximamente`: se ve, pero todavia no tiene lecciones | La unidad 2 esta bloqueada para Ana porque no aprobo la unidad 1 |

Son independientes: una unidad publicada puede estar bloqueada para alguien, y
una unidad sin publicar no esta "bloqueada", simplemente todavia no existe para
nadie.

---

## 10.4 Politicas de acceso (RLS)

Script: [`supabase/03-politicas-rls.sql`](../supabase/03-politicas-rls.sql).

Lo que tiene que pasar en esta etapa:

1. la aplicacion puede consultar los contenidos publicados;
2. los visitantes no pueden crear, modificar ni eliminar contenidos;
3. las soluciones no quedan disponibles mediante una consulta publica directa.

Se usan dos mecanismos distintos, porque uno solo no alcanza:

| Mecanismo | Que controla |
|---|---|
| **RLS (politicas)** | Que **filas** ve cada rol |
| **GRANT por columna** | Que **columnas** puede leer cada rol |

RLS filtra filas, no columnas. La opcion correcta es una fila que el estudiante
**tiene que ver** (necesita su texto para poder elegirla), asi que esconderla con
RLS es imposible. Por eso el permiso de lectura se otorga columna por columna,
dejando afuera `preguntas.explicacion` y `opciones.es_correcta`.

```sql
revoke all on public.opciones from anon, authenticated;
grant select (id, pregunta_id, orden, texto, actualizado_en)
  on public.opciones to anon, authenticated;   -- sin es_correcta
```

> Este `revoke` es imprescindible: Supabase otorga permisos amplios a `anon` y
> `authenticated` por defecto.

### Politicas de lectura

| Tabla | Condicion |
|---|---|
| `cursos` | `estado <> 'borrador'` |
| `unidades` | `estado <> 'borrador'` y su curso tampoco esta en borrador |
| `lecciones` | `estado = 'publicada'` y su unidad y su curso publicados |
| `preguntas` | `estado = 'publicada'` y toda su cadena publicada |
| `opciones` | Su pregunta publicada y toda la cadena publicada |

Se verifica la cadena entera a proposito: asi una leccion de una unidad en
borrador no se filtra por conocer su identificador.

### Escritura

No se crea **ninguna** politica de `insert`, `update` o `delete`. Con RLS
encendida y sin politica, PostgreSQL rechaza la operacion; el `revoke` ya la
habia bloqueado antes. Son dos candados independientes sobre la misma puerta.

La carga de contenido se hace desde el panel de Supabase, que trabaja con el rol
`service_role`. Ese rol no pasa por RLS, por eso no necesita politicas... y por
eso su clave **nunca** puede estar en la aplicacion.

---

## 10.5 Funcion de comprobacion de respuestas

Script: [`supabase/04-funcion-comprobar.sql`](../supabase/04-funcion-comprobar.sql).

```sql
public.comprobar_respuesta(p_pregunta_id text, p_opcion_id text) returns jsonb
```

La aplicacion no se descarga las soluciones. Cuando el estudiante elige una
opcion y confirma, se le manda al servidor el identificador de la pregunta y el
de la opcion. La funcion:

1. comprueba que la pregunta **existe y esta disponible** (publicada, con toda su
   cadena de contenidos publicada: la misma condicion que usan las politicas);
2. verifica que la opcion **pertenece a esa pregunta**;
3. compara la seleccion con la solucion guardada;
4. devuelve si la respuesta es correcta y su explicacion.

```json
{
  "pregunta_id": "js-u1-l1-a1",
  "opcion_id": "js-u1-l1-a1-b",
  "correcta": false,
  "explicacion": "El navegador trae un motor de JavaScript que ...",
  "opcion_correcta_id": "js-u1-l1-a1-a",
  "opcion_correcta_texto": "En el navegador de quien visita la pagina"
}
```

Detalles de la implementacion:

- Es `SECURITY DEFINER`: corre con los permisos de quien la creo, que si puede
  leer `es_correcta` y `explicacion`. El rol `anon` solo puede **ejecutarla**.
- Tiene `set search_path = public, pg_temp`, para que nadie pueda cambiarle el
  significado a los nombres de tabla.
- `revoke all ... from public` y `grant execute ... to anon, authenticated`.
- Cual era la opcion correcta se devuelve **solo cuando la respuesta fue
  incorrecta**, que es cuando la pantalla necesita mostrarla.
- Una pregunta inexistente o una opcion de otra pregunta levantan una excepcion
  con codigo `P0002`, que la aplicacion traduce a "no encontramos ese contenido"
  y no a un error de conexion.

Esta funcion es para el **modo practica**. La validacion de partidas y los
puntajes oficiales de la competencia corresponden a la etapa siguiente.

---

## 10.6 Como se conecta la aplicacion

```
Pantallas (.vue)
      |  no conocen la URL ni la clave
      v
useCatalogo.js        cache reactiva de lo ya consultado
      |
      v
servicios/contenido.js   UNICO lugar que arma consultas
      |
      v
servicios/supabase.js    UNICO lugar que crea el cliente
      |
      v
Supabase (PostgreSQL + RLS + comprobar_respuesta)
```

| Archivo | Responsabilidad |
|---|---|
| `src/servicios/supabase.js` | Crea el cliente con la URL y la clave publicable del `.env`. Si falta la configuracion, no lo crea y avisa con un mensaje claro |
| `src/servicios/contenido.js` | Todas las consultas. Traduce las filas de PostgreSQL a los objetos que usan las vistas y clasifica los errores |
| `src/composables/useCatalogo.js` | Guarda en memoria la estructura ya consultada, para no pedirla una vez por pantalla |
| `src/components/EstadoConsulta.vue` | Los mensajes de "cargando", "fallo la consulta" y "no hay contenido", iguales en toda la aplicacion |

### Operaciones disponibles

| Funcion | Consulta |
|---|---|
| `listarCursos()` | Cursos visibles, ordenados por `orden` |
| `obtenerCurso(cursoId)` | Un curso |
| `listarUnidades(cursoId)` | Unidades **de ese curso** (`curso_id = ...`), por `orden` |
| `obtenerUnidad(unidadId)` | Una unidad |
| `listarLecciones(unidadId)` | Lecciones **de esa unidad** (`unidad_id = ...`), por `orden` |
| `obtenerLeccion(leccionId)` | Una leccion con su teoria |
| `listarLeccionesDeCurso(cursoId)` | Todas las lecciones del curso, en orden de unidad y leccion |
| `listarActividades(leccionId)` | Preguntas **de esa leccion** y, para cada una, sus opciones |
| `contarActividades(leccionId)` | Cuantas actividades tiene, sin traerlas |
| `obtenerActividad(actividadId)` | Una pregunta con sus opciones |
| `comprobarRespuesta(preguntaId, opcionId)` | Llama a la funcion del servidor |

Las consultas piden las columnas **una por una**, nunca `select *`: el rol
publico no tiene permiso sobre las columnas de la solucion, asi que un `select *`
fallaria. Es a proposito.

### Variables de entorno

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Estan documentadas en `.env.example`, sin valores. Todo lo que empieza con
`VITE_` queda **dentro del paquete que se descarga el navegador**: que sea una
variable de entorno no lo convierte en secreto. Por eso ahi solo va la clave
publicable, que esta limitada por las politicas de RLS. La clave `service_role`
no aparece nunca en el front-end.

### Manejo de errores

`contenido.js` divide los errores en dos, y las pantallas usan esa diferencia:

| Error | Cuando | Que hace la pantalla |
|---|---|---|
| `ErrorDeConsulta` | No se pudo hablar con la base | Avisa y ofrece **Reintentar** |
| `ContenidoNoEncontrado` | Ese contenido no existe o no esta publicado | Avisa y ofrece una salida, **sin** boton de reintentar |
| `SinConfiguracion` | Falta el `.env` | Explica que variables completar |

Si falla la comprobacion de una respuesta, la actividad **no se cuenta como
incorrecta**: se avisa, no se descuenta una vida y se puede volver a comprobar la
misma opcion.

---

## 10.7 Actualizacion en tiempo real

En esta etapa no se exige: los cambios hechos en Supabase se ven al recargar la
pagina o al volver a consultar (`recargarCurso()` / `recargarCursos()`, que es lo
que dispara el boton de reintentar). El caso 2 del registro de pruebas comprueba
justamente eso.
