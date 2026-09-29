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

`00-roles-locales.sql` **no se ejecuta en Supabase**: solo sirve para crear los
roles `anon`, `authenticated` y `service_role` cuando se reproduce el esquema en
una instalacion comun de PostgreSQL (por ejemplo, para correr las pruebas
automaticas del proyecto).

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
