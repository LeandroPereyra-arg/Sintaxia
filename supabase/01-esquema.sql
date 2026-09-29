-- ===========================================================================
--  Sintaxia - Esquema del contenido educativo
--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)
-- ---------------------------------------------------------------------------
--  Este script crea las tablas del CONTENIDO: cursos, unidades, lecciones,
--  preguntas y opciones de respuesta. El progreso de cada estudiante NO se
--  guarda aca; se modela en la etapa siguiente (ver docs/10-supabase.md).
--
--  Se ejecuta completo en el SQL Editor de Supabase. Es idempotente: se puede
--  volver a correr sobre una base vacia sin cambios manuales.
--
--  Orden de ejecucion de los scripts:
--    01-esquema.sql  ->  02-datos-iniciales.sql  ->  03-politicas-rls.sql
--                    ->  04-funcion-comprobar.sql
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Limpieza previa (solo afecta a los objetos de este proyecto)
-- ---------------------------------------------------------------------------
drop table if exists public.opciones   cascade;
drop table if exists public.preguntas  cascade;
drop table if exists public.lecciones  cascade;
drop table if exists public.unidades   cascade;
drop table if exists public.cursos     cascade;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------------

-- Mantiene actualizado_en cuando una fila cambia. Sirve para comprobar desde
-- la aplicacion que una edicion hecha en Supabase realmente llego.
create or replace function public.fn_marcar_actualizacion()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ===========================================================================
-- 1. CURSOS
-- ===========================================================================
create table public.cursos (
  id                  text        primary key,
  nombre              text        not null,
  descripcion         text        not null,
  nivel               text        not null,
  icono               text        not null,
  color               text        not null,
  color_texto         text        not null,
  estado              text        not null default 'borrador',
  requisito           text,
  horas_estimadas     smallint,
  unidades_previstas  smallint,
  lecciones_previstas smallint,
  etiquetas           text[]      not null default '{}',
  orden               smallint    not null,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint ck_cursos_id            check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_cursos_nombre        check (length(btrim(nombre)) between 1 and 60),
  constraint ck_cursos_descripcion   check (length(btrim(descripcion)) between 1 and 400),
  constraint ck_cursos_nivel         check (nivel in ('Principiante', 'Intermedio', 'Avanzado')),
  constraint ck_cursos_estado        check (estado in ('borrador', 'proximamente', 'disponible', 'bloqueado')),
  constraint ck_cursos_color         check (color ~ '^#[0-9a-fA-F]{6}$'),
  constraint ck_cursos_color_texto   check (color_texto ~ '^#[0-9a-fA-F]{6}$'),
  constraint ck_cursos_horas         check (horas_estimadas is null or horas_estimadas > 0),
  constraint ck_cursos_previstas     check (
    (unidades_previstas  is null or unidades_previstas  > 0) and
    (lecciones_previstas is null or lecciones_previstas > 0)
  ),
  constraint ck_cursos_orden         check (orden > 0),
  -- Un curso bloqueado tiene que explicar que hace falta para abrirlo.
  constraint ck_cursos_requisito     check (estado <> 'bloqueado' or requisito is not null),
  constraint uq_cursos_orden         unique (orden)
);

comment on table  public.cursos               is 'Catalogo de cursos que ofrece Sintaxia.';
comment on column public.cursos.estado        is 'Estado de PUBLICACION del contenido: borrador (no se muestra), proximamente, disponible, bloqueado.';
comment on column public.cursos.orden         is 'Posicion en el catalogo. No se depende del orden de insercion.';
comment on column public.cursos.unidades_previstas  is 'Unidades planificadas para el curso (sirve para los cursos que todavia no tienen contenido cargado).';
comment on column public.cursos.lecciones_previstas is 'Lecciones planificadas para el curso.';

create trigger tg_cursos_actualizacion
  before update on public.cursos
  for each row execute function public.fn_marcar_actualizacion();

-- ===========================================================================
-- 2. UNIDADES
-- ===========================================================================
create table public.unidades (
  id             text        primary key,
  curso_id       text        not null,
  orden          smallint    not null,
  titulo         text        not null,
  descripcion    text        not null,
  icono          text        not null,
  color          text        not null,
  estado         text        not null default 'borrador',
  temas          text[]      not null default '{}',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint fk_unidades_curso    foreign key (curso_id) references public.cursos (id)
                                  on update cascade on delete cascade,
  constraint ck_unidades_id       check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_unidades_titulo   check (length(btrim(titulo)) between 1 and 80),
  constraint ck_unidades_desc     check (length(btrim(descripcion)) between 1 and 400),
  constraint ck_unidades_estado   check (estado in ('borrador', 'proximamente', 'publicada')),
  constraint ck_unidades_color    check (color ~ '^#[0-9a-fA-F]{6}$'),
  constraint ck_unidades_orden    check (orden > 0),
  -- El orden dentro del curso no se puede repetir: define la secuencia.
  constraint uq_unidades_orden    unique (curso_id, orden)
);

comment on table  public.unidades        is 'Unidades (bloques tematicos) de un curso.';
comment on column public.unidades.estado is 'publicada = tiene lecciones publicadas; proximamente = se muestra como no disponible; borrador = no se muestra.';
comment on column public.unidades.orden  is 'Secuencia de la unidad dentro del curso.';

create index ix_unidades_curso on public.unidades (curso_id, orden);

create trigger tg_unidades_actualizacion
  before update on public.unidades
  for each row execute function public.fn_marcar_actualizacion();

-- ===========================================================================
-- 3. LECCIONES
-- ===========================================================================
create table public.lecciones (
  id             text        primary key,
  unidad_id      text        not null,
  orden          smallint    not null,
  titulo         text        not null,
  descripcion    text        not null,
  icono          text        not null,
  xp             smallint    not null default 10,
  explicacion    text        not null,
  ejemplo_titulo text,
  ejemplo_codigo text,
  ejemplo_nota   text,
  estado         text        not null default 'borrador',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint fk_lecciones_unidad  foreign key (unidad_id) references public.unidades (id)
                                  on update cascade on delete cascade,
  constraint ck_lecciones_id      check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_lecciones_titulo  check (length(btrim(titulo)) between 1 and 80),
  constraint ck_lecciones_desc    check (length(btrim(descripcion)) between 1 and 400),
  constraint ck_lecciones_teoria  check (length(btrim(explicacion)) >= 20),
  constraint ck_lecciones_xp      check (xp between 0 and 100),
  constraint ck_lecciones_estado  check (estado in ('borrador', 'publicada')),
  constraint ck_lecciones_orden   check (orden > 0),
  -- El ejemplo es opcional, pero si esta tiene que tener titulo y codigo.
  constraint ck_lecciones_ejemplo check (
    (ejemplo_titulo is null) = (ejemplo_codigo is null)
    and (ejemplo_nota is null or ejemplo_codigo is not null)
  ),
  constraint uq_lecciones_orden   unique (unidad_id, orden)
);

comment on table  public.lecciones             is 'Lecciones de una unidad: teoria, ejemplo de codigo y preguntas.';
comment on column public.lecciones.explicacion is 'Texto teorico que se muestra antes de las actividades.';
comment on column public.lecciones.orden       is 'Secuencia de la leccion dentro de la unidad.';

create index ix_lecciones_unidad on public.lecciones (unidad_id, orden);

create trigger tg_lecciones_actualizacion
  before update on public.lecciones
  for each row execute function public.fn_marcar_actualizacion();

-- ===========================================================================
-- 4. PREGUNTAS
--    La explicacion de la solucion vive aca y NO se expone al cliente:
--    la entrega la funcion public.comprobar_respuesta (04-funcion-comprobar.sql).
-- ===========================================================================
create table public.preguntas (
  id             text        primary key,
  leccion_id     text        not null,
  orden          smallint    not null,
  tipo           text        not null default 'opcion-multiple',
  enunciado      text        not null,
  codigo         text,
  explicacion    text        not null,
  estado         text        not null default 'borrador',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint fk_preguntas_leccion foreign key (leccion_id) references public.lecciones (id)
                                  on update cascade on delete cascade,
  constraint ck_preguntas_id      check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_preguntas_tipo    check (tipo in ('opcion-multiple', 'verdadero-falso', 'completar', 'ordenar')),
  constraint ck_preguntas_enunc   check (length(btrim(enunciado)) between 5 and 400),
  constraint ck_preguntas_expl    check (length(btrim(explicacion)) >= 10),
  constraint ck_preguntas_estado  check (estado in ('borrador', 'publicada')),
  constraint ck_preguntas_orden   check (orden > 0),
  constraint uq_preguntas_orden   unique (leccion_id, orden)
);

comment on table  public.preguntas             is 'Actividades de una leccion. En esta etapa todas son de opcion multiple.';
comment on column public.preguntas.explicacion is 'SOLUCION: por que la respuesta correcta lo es. No se otorga permiso de lectura al rol anon.';
comment on column public.preguntas.orden       is 'Secuencia de la actividad dentro de la leccion.';

create index ix_preguntas_leccion on public.preguntas (leccion_id, orden);

create trigger tg_preguntas_actualizacion
  before update on public.preguntas
  for each row execute function public.fn_marcar_actualizacion();

-- ===========================================================================
-- 5. OPCIONES DE RESPUESTA
--    es_correcta es la otra mitad de la solucion; tampoco se expone al cliente.
-- ===========================================================================
create table public.opciones (
  id             text        primary key,
  pregunta_id    text        not null,
  orden          smallint    not null,
  texto          text        not null,
  es_correcta    boolean     not null default false,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Columna generada: vale true solo en la opcion correcta y NULL en el resto.
  -- Como PostgreSQL considera distintos a los NULL en un indice unico, esto
  -- impide que una pregunta tenga DOS opciones correctas.
  marca_correcta boolean generated always as (case when es_correcta then true end) stored,

  constraint fk_opciones_pregunta foreign key (pregunta_id) references public.preguntas (id)
                                  on update cascade on delete cascade,
  constraint ck_opciones_id       check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_opciones_texto    check (length(btrim(texto)) between 1 and 200),
  constraint ck_opciones_orden    check (orden > 0),
  constraint uq_opciones_orden    unique (pregunta_id, orden),
  constraint uq_opciones_correcta unique (pregunta_id, marca_correcta)
);

comment on table  public.opciones             is 'Opciones de respuesta de una pregunta de opcion multiple.';
comment on column public.opciones.es_correcta is 'SOLUCION: marca la opcion valida. No se otorga permiso de lectura al rol anon.';
comment on constraint uq_opciones_correcta on public.opciones is 'Impide mas de una opcion correcta por pregunta.';

create index ix_opciones_pregunta on public.opciones (pregunta_id, orden);

create trigger tg_opciones_actualizacion
  before update on public.opciones
  for each row execute function public.fn_marcar_actualizacion();

-- ---------------------------------------------------------------------------
-- Restriccion: toda pregunta PUBLICADA de opcion multiple necesita al menos
-- dos opciones y exactamente una correcta.
--
-- El indice unico de arriba cubre el "como maximo una". El "al menos una" y el
-- "al menos dos opciones" no se pueden expresar con un CHECK de fila, asi que
-- se validan con un disparador diferido: se comprueba al cerrar la transaccion,
-- para poder insertar la pregunta y sus opciones en el mismo bloque.
-- ---------------------------------------------------------------------------
create or replace function public.fn_validar_opciones()
returns trigger
language plpgsql
as $$
declare
  v_pregunta_id text;
  v_pregunta    record;
  v_total       integer;
  v_correctas   integer;
begin
  -- El disparador se usa desde las dos tablas, que no tienen las mismas
  -- columnas: por eso se resuelve el id adentro de cada rama.
  if tg_table_name = 'preguntas' then
    v_pregunta_id := coalesce(new.id, old.id);
  else
    v_pregunta_id := coalesce(new.pregunta_id, old.pregunta_id);
  end if;

  select id, tipo, estado into v_pregunta
    from public.preguntas where id = v_pregunta_id;

  -- La pregunta pudo haberse borrado en la misma transaccion.
  if not found then
    return null;
  end if;

  if v_pregunta.estado <> 'publicada' or v_pregunta.tipo <> 'opcion-multiple' then
    return null;
  end if;

  select count(*), count(*) filter (where es_correcta)
    into v_total, v_correctas
    from public.opciones where pregunta_id = v_pregunta_id;

  if v_total < 2 then
    raise exception
      'La pregunta publicada "%" necesita al menos dos opciones (tiene %).',
      v_pregunta_id, v_total
      using errcode = 'check_violation';
  end if;

  if v_correctas <> 1 then
    raise exception
      'La pregunta publicada "%" necesita exactamente una opcion correcta (tiene %).',
      v_pregunta_id, v_correctas
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

create constraint trigger tg_opciones_validas
  after insert or update or delete on public.opciones
  deferrable initially deferred
  for each row execute function public.fn_validar_opciones();

create constraint trigger tg_preguntas_validas
  after insert or update on public.preguntas
  deferrable initially deferred
  for each row execute function public.fn_validar_opciones();

commit;
