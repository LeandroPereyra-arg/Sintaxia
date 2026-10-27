# Base de datos de Sintaxia en Supabase

Esta carpeta tiene todo lo necesario para reproducir la base del contenido
educativo desde cero. Los scripts se ejecutan en el **SQL Editor** de Supabase,
en este orden:

| Orden | Archivo | Que hace |
|---|---|---|
| 1 | `01-esquema.sql` | Crea las tablas, las claves, las restricciones y los disparadores de validacion. |
| 2 | `02-datos-iniciales.sql` | Carga el contenido inicial (curso, unidades, lecciones, preguntas y opciones). |
| 3 | `03-politicas-rls.sql` | Enciende Row Level Security y define quien puede leer que. |
| 4 | `04-funcion-comprobar.sql` | Crea la funcion que corrige las respuestas del lado del servidor. |
| 5 | `05-perfiles-y-progreso.sql` | Etapa 4. Perfiles ligados a Supabase Auth (alias y codigo). No borra datos. |
| 6 | `06-politicas-rls-etapa4.sql` | Etapa 4. Permisos y RLS: cada persona ve y modifica solo lo propio; distingue invitado de cuenta. |
| 7 | `07-limpieza-invitados.sql` | Etapa 4. Funcion que borra invitados abandonados (solo `service_role`). |
| 8 | `08-intentos-y-respuestas.sql` | Etapa 5. Tablas `intentos` y `respuestas` con sus restricciones. Si existe el historial de la etapa 4 (`intentos_leccion`) lo copia y despues lo elimina. |
| 9 | `09-funciones-intentos.sql` | Etapa 5. `iniciar_intento`, `responder_actividad` y `abandonar_intento`: el servidor corrige, guarda y calcula el resultado, y aplica las reglas de aprobacion y desbloqueo. |
| 10 | `10-politicas-rls-etapa5.sql` | Etapa 5. Cada persona lee (y puede borrar) solo su progreso; nadie lo escribe directo. |

`00-roles-locales.sql` **no se ejecuta en Supabase**: solo sirve para crear los
roles `anon`, `authenticated`, `service_role` y `postgres` y el esquema `auth` cuando se
reproduce el proyecto en una instalacion comun de PostgreSQL (por ejemplo, para correr
las pruebas automaticas). Ver `npm run supabase:local`.

**Atencion con el orden:** `01-esquema.sql` borra y recrea el contenido, asi que solo se
corre en un proyecto nuevo. Los scripts `02` y `05` a `10` se pueden volver a correr sin
perder datos ni permisos (esta probado: caso 34 de la etapa 4 y caso 20 de la etapa 5).

**Proyecto que ya tenia la etapa 4:** alcanza con ejecutar `05` a `10` en orden. El `08`
pasa el historial viejo a la tabla nueva sin perder nada (ver
[docs/14-intentos-y-progreso.md](../docs/14-intentos-y-progreso.md#149-migracion-desde-la-etapa-4)).

`generar-datos-iniciales.mjs` regenera `02-datos-iniciales.sql` a partir del
contenido que ya estaba en `src/data/`, para no transcribirlo a mano:

```bash
npm run supabase:datos
```

---

## Datos del proyecto

| Dato | Valor |
|---|---|
| **Nombre del proyecto** | `sintaxia` |
| **Organizacion** | Equipo de Sintaxia (proyecto academico) |
| **Region sugerida** | South America (Sao Paulo) — es la mas cercana al curso |
| **Base de datos** | PostgreSQL (la que provee Supabase) |
| **Esquema** | `public` |

> Las credenciales del proyecto (URL, clave publicable y, sobre todo, la clave
> `service_role`) **no se guardan en el repositorio**. Cada integrante las copia
> del panel de Supabase a su propio archivo `.env`, que esta en `.gitignore`.
> En `.env.example` estan los nombres de las variables, sin valores.

## Proposito de la base

Guardar el **contenido educativo** de Sintaxia —los cursos, sus unidades, las
lecciones con su teoria, y las preguntas con sus opciones y soluciones— en un
solo lugar compartido por todo el equipo, de manera que:

- la aplicacion lo lea desde ahi y deje de depender de archivos de prueba;
- se pueda corregir o agregar contenido desde el panel de Supabase sin tocar el
  codigo ni volver a publicar la aplicacion;
- las **soluciones** (que opcion es la correcta y por que) queden del lado del
  servidor y no viajen al navegador;
- mas adelante se pueda sumar el progreso de cada participante sin rehacer el
  modelo.

## Organizacion general de las tablas

El contenido es una jerarquia de cuatro niveles mas las opciones de respuesta.
Cada nivel apunta al de arriba con una clave foranea, y ninguno repite datos del
otro:

```
cursos
  └── unidades          (curso_id)
        └── lecciones   (unidad_id)
              └── preguntas   (leccion_id)
                    └── opciones   (pregunta_id)
```

| Tabla | Que guarda | Filas cargadas hoy |
|---|---|---|
| `cursos` | Catalogo de cursos y su estado de publicacion | 6 |
| `unidades` | Bloques tematicos de un curso, en orden | 6 (del curso de JavaScript) |
| `lecciones` | Teoria y ejemplo de codigo de cada leccion | 3 (unidad 1) |
| `preguntas` | Actividades de una leccion, con su explicacion | 12 |
| `opciones` | Opciones de respuesta, con la marca de cual es correcta | 48 |
| `perfiles` | Un perfil por participante (mismo id que `auth.users`): alias, codigo, avatar, meta | uno por usuario |
| `intentos` | Un renglon cada vez que alguien empieza una leccion: estado, aciertos, errores, aprobado, fechas | segun el uso |
| `respuestas` | Una por actividad e intento: opcion elegida, si fue correcta, orden y hora | segun el uso |

Dos columnas aparecen en varias tablas y conviene no confundirlas:

- **`orden`** define la secuencia (unidad 1, 2, 3...). La aplicacion ordena
  siempre por esta columna: nunca depende del orden en que se insertaron las
  filas. Es unica dentro de su padre, asi que no puede haber dos unidades 3 en
  el mismo curso.
- **`estado`** es el estado de **publicacion** del contenido, no el avance de
  nadie. Un curso o una unidad en `borrador` no se ve; en `proximamente` se ve
  pero todavia no tiene contenido; `publicada` es contenido terminado.

El detalle campo por campo esta en
[`docs/10-supabase-y-modelo-de-datos.md`](../docs/10-supabase-y-modelo-de-datos.md).

## Como se carga el contenido

En esta etapa el contenido se carga desde las herramientas de Supabase (el SQL
Editor y el Table Editor). El panel de administracion dentro de la aplicacion se
desarrolla mas adelante. Por eso el rol publico solo tiene permiso de lectura:
la escritura se hace con el rol `service_role`, que es el que usa el panel de
Supabase y que nunca aparece en la aplicacion.
