-- ===========================================================================
--  Sintaxia - Competencia: eventos de expo, desafios y partidas
--  Etapa 6 - Modo competencia, separado del modo practica
-- ---------------------------------------------------------------------------
--  Practica y competencia no comparten preguntas ni tablas:
--
--    PRACTICA     preguntas / opciones           (etapas 3 a 5)
--    COMPETENCIA  preguntas_desafio / opciones_desafio   (esta etapa)
--
--  Las funciones de practica (comprobar_respuesta, responder_actividad) solo
--  leen las tablas de practica, asi que no hay forma de usarlas para averiguar
--  las soluciones de un desafio. Y el banco del desafio no tiene ningun permiso
--  de lectura para el cliente: las preguntas le llegan solo a traves de su
--  partida, sin la marca de cual opcion es correcta.
--
--    eventos             una exposicion (por ejemplo, la expo de fin de ano)
--    desafios            las pruebas de un evento, con sus reglas
--    preguntas_desafio   banco propio de cada desafio
--    opciones_desafio    opciones de esas preguntas (con la solucion)
--    partidas            un intento de una persona en un desafio
--    partida_preguntas   las preguntas que el servidor fijo para esa partida
--    partida_respuestas  una respuesta por partida y pregunta
--
--  Este script NO borra datos y se puede volver a correr.
--  Las funciones estan en 12, los permisos en 13 y el evento de ejemplo en 14.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. EVENTOS
-- ---------------------------------------------------------------------------
create table if not exists public.eventos (
  id             text        primary key,
  nombre         text        not null,
  descripcion    text        not null default '',
  lugar          text,
  estado         text        not null default 'preparacion',
  abre_en        timestamptz,
  cierra_en      timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint ck_eventos_id      check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_eventos_nombre  check (length(btrim(nombre)) between 3 and 80),
  constraint ck_eventos_estado  check (estado in ('preparacion', 'abierto', 'cerrado')),
  constraint ck_eventos_ventana check (abre_en is null or cierra_en is null or abre_en < cierra_en)
);

comment on table  public.eventos is 'Una exposicion. Separa los resultados de cada expo.';
comment on column public.eventos.estado is 'preparacion (no se ve ni se juega), abierto (se juega), cerrado (se ve el resultado, no se juega).';
comment on column public.eventos.abre_en is 'Opcional: antes de esta hora no se puede empezar una partida aunque el evento este abierto.';

drop trigger if exists tg_eventos_actualizacion on public.eventos;
create trigger tg_eventos_actualizacion
  before update on public.eventos
  for each row execute function public.fn_marcar_actualizacion();

-- ---------------------------------------------------------------------------
-- 2. DESAFIOS (y sus reglas)
-- ---------------------------------------------------------------------------
create table if not exists public.desafios (
  id                  text        primary key,
  evento_id           text        not null references public.eventos (id) on update cascade on delete restrict,
  orden               smallint    not null,
  nombre              text        not null,
  descripcion         text        not null default '',
  dificultad          text        not null default 'media',
  duracion_segundos   integer     not null default 120,
  puntos_por_acierto  integer     not null default 100,
  intentos_permitidos smallint    not null default 3,
  gracia_segundos     smallint    not null default 5,
  estado              text        not null default 'borrador',
  version             integer     not null default 1,
  congelado_en        timestamptz,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  constraint ck_desafios_id         check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_desafios_nombre     check (length(btrim(nombre)) between 3 and 80),
  constraint ck_desafios_dificultad check (dificultad in ('facil', 'media', 'dificil')),
  constraint ck_desafios_duracion   check (duracion_segundos between 30 and 3600),
  constraint ck_desafios_puntos     check (puntos_por_acierto between 1 and 1000),
  constraint ck_desafios_intentos   check (intentos_permitidos between 1 and 10),
  constraint ck_desafios_gracia     check (gracia_segundos between 0 and 30),
  constraint ck_desafios_estado     check (estado in ('borrador', 'publicado', 'cerrado')),
  constraint ck_desafios_version    check (version >= 1),
  constraint uq_desafios_orden      unique (evento_id, orden),
  -- Para que una partida apunte a (desafio, evento) y no pueda quedar en otro evento.
  constraint uq_desafios_id_evento  unique (id, evento_id)
);

comment on table  public.desafios is 'Una prueba de un evento. Sus reglas se copian a cada partida al empezar.';
comment on column public.desafios.duracion_segundos is 'Tiempo de la partida, medido por el servidor desde que la crea.';
comment on column public.desafios.gracia_segundos is 'Margen para respuestas que salieron antes del cierre y llegaron tarde por la red.';
comment on column public.desafios.intentos_permitidos is 'Partidas por persona en este desafio. En el ranking cuenta la mejor, no la suma.';
comment on column public.desafios.congelado_en is 'Desde la primera partida, las reglas y las preguntas del desafio no se pueden cambiar: se crea otro desafio (otra version).';

drop trigger if exists tg_desafios_actualizacion on public.desafios;
create trigger tg_desafios_actualizacion
  before update on public.desafios
  for each row execute function public.fn_marcar_actualizacion();

-- ---------------------------------------------------------------------------
-- 3. BANCO DE PREGUNTAS DEL DESAFIO (separado del de practica)
-- ---------------------------------------------------------------------------
create table if not exists public.preguntas_desafio (
  id             text        primary key,
  desafio_id     text        not null references public.desafios (id) on update cascade on delete cascade,
  orden          smallint    not null,
  enunciado      text        not null,
  codigo         text,
  explicacion    text        not null,
  estado         text        not null default 'publicada',
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint ck_pdesafio_id     check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_pdesafio_enunc  check (length(btrim(enunciado)) between 5 and 400),
  constraint ck_pdesafio_expl   check (length(btrim(explicacion)) >= 10),
  constraint ck_pdesafio_estado check (estado in ('borrador', 'publicada')),
  constraint uq_pdesafio_orden  unique (desafio_id, orden)
);

create table if not exists public.opciones_desafio (
  id             text        primary key,
  pregunta_id    text        not null references public.preguntas_desafio (id) on update cascade on delete cascade,
  orden          smallint    not null,
  texto          text        not null,
  es_correcta    boolean     not null default false,
  marca_correcta boolean     generated always as (case when es_correcta then true end) stored,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint ck_odesafio_id       check (id ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint ck_odesafio_texto    check (length(btrim(texto)) between 1 and 200),
  constraint uq_odesafio_orden    unique (pregunta_id, orden),
  constraint uq_odesafio_correcta unique (pregunta_id, marca_correcta),
  constraint uq_odesafio_id_preg  unique (id, pregunta_id)
);

-- Dos opciones iguales en la misma pregunta (sin importar mayusculas ni espacios).
create unique index if not exists uq_odesafio_texto
  on public.opciones_desafio (pregunta_id, lower(btrim(texto)));

comment on table public.preguntas_desafio is 'Banco de un desafio. El cliente no tiene ningun permiso sobre esta tabla: las preguntas le llegan solo por su partida.';
comment on table public.opciones_desafio  is 'Opciones del banco del desafio. es_correcta no sale nunca hacia el cliente.';

drop trigger if exists tg_pdesafio_actualizacion on public.preguntas_desafio;
create trigger tg_pdesafio_actualizacion
  before update on public.preguntas_desafio
  for each row execute function public.fn_marcar_actualizacion();

drop trigger if exists tg_odesafio_actualizacion on public.opciones_desafio;
create trigger tg_odesafio_actualizacion
  before update on public.opciones_desafio
  for each row execute function public.fn_marcar_actualizacion();

-- Una pregunta publicada del desafio necesita al menos dos opciones y
-- exactamente una correcta (la misma regla que el banco de practica).
create or replace function public.fn_validar_opciones_desafio()
returns trigger
language plpgsql
as $$
declare
  v_pregunta_id text;
  v_estado      text;
  v_total       integer;
  v_correctas   integer;
begin
  if tg_table_name = 'preguntas_desafio' then
    v_pregunta_id := coalesce(new.id, old.id);
  else
    v_pregunta_id := coalesce(new.pregunta_id, old.pregunta_id);
  end if;

  select estado into v_estado from public.preguntas_desafio where id = v_pregunta_id;
  if not found or v_estado <> 'publicada' then
    return null;
  end if;

  select count(*), count(*) filter (where es_correcta)
    into v_total, v_correctas
    from public.opciones_desafio where pregunta_id = v_pregunta_id;

  if v_total < 2 then
    raise exception 'La pregunta publicada "%" necesita al menos dos opciones (tiene %).', v_pregunta_id, v_total
      using errcode = 'check_violation';
  end if;
  if v_correctas <> 1 then
    raise exception 'La pregunta publicada "%" necesita exactamente una opcion correcta (tiene %).', v_pregunta_id, v_correctas
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

drop trigger if exists tg_odesafio_validas on public.opciones_desafio;
create constraint trigger tg_odesafio_validas
  after insert or update or delete on public.opciones_desafio
  deferrable initially deferred
  for each row execute function public.fn_validar_opciones_desafio();

drop trigger if exists tg_pdesafio_validas on public.preguntas_desafio;
create constraint trigger tg_pdesafio_validas
  after insert or update on public.preguntas_desafio
  deferrable initially deferred
  for each row execute function public.fn_validar_opciones_desafio();

-- ---------------------------------------------------------------------------
-- Congelamiento: desde la primera partida (iniciar_partida marca congelado_en)
-- no se pueden cambiar las reglas del desafio ni su banco de preguntas. Si
-- hace falta otra cosa, se crea otro desafio (version siguiente). Si se
-- permite cambiar el estado (publicado -> cerrado), el nombre y la descripcion.
-- ---------------------------------------------------------------------------
create or replace function public.fn_desafio_congelado()
returns trigger
language plpgsql
as $$
declare
  v_desafio_id text;
  v_congelado  timestamptz;
begin
  if tg_table_name = 'desafios' then
    if old.congelado_en is not null and (
         new.duracion_segundos   is distinct from old.duracion_segundos or
         new.puntos_por_acierto  is distinct from old.puntos_por_acierto or
         new.intentos_permitidos is distinct from old.intentos_permitidos or
         new.gracia_segundos     is distinct from old.gracia_segundos or
         new.version             is distinct from old.version or
         new.evento_id           is distinct from old.evento_id or
         new.congelado_en        is distinct from old.congelado_en) then
      raise exception 'El desafio "%" ya tiene partidas: sus reglas no se pueden cambiar. Crea otra version.', old.id
        using errcode = 'check_violation', hint = 'desafio_congelado';
    end if;
    return new;
  end if;

  if tg_table_name = 'preguntas_desafio' then
    v_desafio_id := coalesce(new.desafio_id, old.desafio_id);
  else
    select q.desafio_id into v_desafio_id
      from public.preguntas_desafio q where q.id = coalesce(new.pregunta_id, old.pregunta_id);
  end if;

  select congelado_en into v_congelado from public.desafios where id = v_desafio_id;
  if v_congelado is not null then
    raise exception 'El desafio "%" ya tiene partidas: su banco de preguntas no se puede cambiar.', v_desafio_id
      using errcode = 'check_violation', hint = 'desafio_congelado';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists tg_desafios_congelado on public.desafios;
create trigger tg_desafios_congelado
  before update on public.desafios
  for each row execute function public.fn_desafio_congelado();

drop trigger if exists tg_pdesafio_congelado on public.preguntas_desafio;
create trigger tg_pdesafio_congelado
  before insert or update or delete on public.preguntas_desafio
  for each row execute function public.fn_desafio_congelado();

drop trigger if exists tg_odesafio_congelado on public.opciones_desafio;
create trigger tg_odesafio_congelado
  before insert or update or delete on public.opciones_desafio
  for each row execute function public.fn_desafio_congelado();

-- ---------------------------------------------------------------------------
-- 4. PARTIDAS
--    Cada partida guarda una COPIA de las reglas con las que se jugo (version,
--    puntos, duracion, gracia, cantidad de preguntas). Asi dos partidas del
--    mismo desafio son comparables aunque el desafio se edite despues.
-- ---------------------------------------------------------------------------
create table if not exists public.partidas (
  id                 uuid        primary key,
  usuario_id         uuid        not null default auth.uid() references public.perfiles (id) on delete cascade,
  desafio_id         text        not null,
  evento_id          text        not null,
  numero             smallint    not null,
  estado             text        not null default 'en_curso',
  version_desafio    integer     not null,
  puntos_por_acierto integer     not null,
  duracion_segundos  integer     not null,
  gracia_segundos    smallint    not null,
  total_preguntas    smallint    not null,
  aciertos           smallint    not null default 0,
  errores            smallint    not null default 0,
  puntaje            integer     not null default 0,
  iniciada_en        timestamptz not null default now(),
  vence_en           timestamptz not null,
  finalizada_en      timestamptz,
  duracion_ms        integer,

  constraint fk_partidas_desafio foreign key (desafio_id, evento_id)
    references public.desafios (id, evento_id) on update cascade on delete restrict,
  constraint ck_partidas_estado   check (estado in ('en_curso', 'finalizada', 'vencida')),
  constraint ck_partidas_numero   check (numero >= 1),
  constraint ck_partidas_total    check (total_preguntas between 1 and 100),
  constraint ck_partidas_conteo   check (aciertos >= 0 and errores >= 0 and aciertos + errores <= total_preguntas),
  -- El puntaje no se guarda suelto: siempre es aciertos x puntos por acierto.
  constraint ck_partidas_puntaje  check (puntaje = aciertos * puntos_por_acierto),
  constraint ck_partidas_cierre   check ((estado = 'en_curso') = (finalizada_en is null)),
  constraint ck_partidas_duracion check (
    (estado = 'en_curso' and duracion_ms is null)
    or (estado <> 'en_curso' and duracion_ms between 0 and duracion_segundos * 1000)
  ),
  constraint ck_partidas_vence    check (vence_en > iniciada_en),
  constraint uq_partidas_numero   unique (usuario_id, desafio_id, numero)
);

comment on table  public.partidas is 'Un intento de una persona en un desafio. La crea, la corrige y la cierra solo el servidor.';
comment on column public.partidas.id is 'Lo genera el cliente (uuid): repetir la peticion no crea otra partida.';
comment on column public.partidas.estado is 'en_curso, finalizada (respondio todo o la cerro a tiempo: entra al ranking) o vencida (paso el tiempo sin cerrarla: no entra).';
comment on column public.partidas.vence_en is 'iniciada_en + duracion, con el reloj del servidor.';
comment on column public.partidas.duracion_ms is 'Tiempo usado, medido por el servidor (finalizada_en - iniciada_en). Desempata el ranking.';

-- Una sola partida en curso por persona y desafio.
create unique index if not exists uq_partidas_en_curso
  on public.partidas (usuario_id, desafio_id) where estado = 'en_curso';
create index if not exists ix_partidas_desafio on public.partidas (desafio_id, estado);
create index if not exists ix_partidas_usuario on public.partidas (usuario_id, iniciada_en desc);

-- ---------------------------------------------------------------------------
-- 5. PREGUNTAS ASIGNADAS A UNA PARTIDA (las fija el servidor al crearla)
-- ---------------------------------------------------------------------------
create table if not exists public.partida_preguntas (
  partida_id  uuid     not null references public.partidas (id) on delete cascade,
  pregunta_id text     not null references public.preguntas_desafio (id) on update cascade on delete restrict,
  orden       smallint not null,

  constraint pk_partida_preguntas primary key (partida_id, pregunta_id),
  constraint uq_partida_preguntas_orden unique (partida_id, orden)
);

comment on table public.partida_preguntas is 'Las preguntas (y su orden) que el servidor fijo para una partida. No cambian aunque se edite el banco.';

-- ---------------------------------------------------------------------------
-- 6. RESPUESTAS DE UNA PARTIDA
--    Clave (partida_id, pregunta_id): una sola respuesta por partida y pregunta.
--    La clave foranea a partida_preguntas garantiza que la pregunta sea de ESA
--    partida, y la de opciones que la opcion sea de esa pregunta.
-- ---------------------------------------------------------------------------
create table if not exists public.partida_respuestas (
  partida_id    uuid        not null,
  pregunta_id   text        not null,
  opcion_id     text        not null,
  es_correcta   boolean     not null,
  puntos        integer     not null,
  respondida_en timestamptz not null default now(),

  constraint pk_partida_respuestas primary key (partida_id, pregunta_id),
  constraint fk_presp_asignada foreign key (partida_id, pregunta_id)
    references public.partida_preguntas (partida_id, pregunta_id) on delete cascade,
  constraint fk_presp_opcion foreign key (opcion_id, pregunta_id)
    references public.opciones_desafio (id, pregunta_id) on update cascade on delete restrict,
  constraint ck_presp_puntos check (puntos >= 0)
);

comment on table public.partida_respuestas is 'Una respuesta por partida y pregunta. Los puntos los calcula el servidor.';

alter table public.eventos            enable row level security;
alter table public.desafios           enable row level security;
alter table public.preguntas_desafio  enable row level security;
alter table public.opciones_desafio   enable row level security;
alter table public.partidas           enable row level security;
alter table public.partida_preguntas  enable row level security;
alter table public.partida_respuestas enable row level security;

commit;
