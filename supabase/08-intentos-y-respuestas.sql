-- ===========================================================================
--  Sintaxia - Intentos, respuestas y progreso por participante
--  Etapa 5 - Progreso guardado y corregido por el servidor
-- ---------------------------------------------------------------------------
--  Reemplaza el historial de la etapa 4 (intentos_leccion), donde el celular
--  informaba "acerte 3 de 4". Desde ahora el progreso se arma con dos tablas
--  que SOLO escriben las funciones del servidor (09-funciones-intentos.sql):
--
--    intentos     un renglon cada vez que alguien EMPIEZA una leccion
--    respuestas   un renglon por cada actividad respondida dentro de un intento
--
--  El progreso queda separado de la publicacion del contenido:
--    · Las tablas de contenido (cursos ... opciones) no tienen ninguna columna
--      del participante, y estas tablas no tienen ninguna columna de publicacion.
--    · Cada intento guarda una FOTO de lo que pasaba en ese momento (cuantas
--      actividades tenia la leccion, si cada respuesta era correcta). Si despues
--      se corrige o se despublica contenido, el historial no cambia.
--    · El contenido que ya tiene intentos no se puede BORRAR (on delete
--      restrict): se despublica (estado = 'borrador'). Asi nadie pierde su
--      historial porque se edito una leccion.
--
--  Este script NO borra datos y se puede volver a correr. Si encuentra la tabla
--  vieja intentos_leccion, copia sus renglones como intentos "de la etapa 4"
--  y recien despues la elimina.
--
--  Se ejecuta despues de 01 a 07. Las funciones estan en 09 y los permisos en 10.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. INTENTOS
--    Identificador: uuid que genera el CELULAR antes de pedir el intento. Si la
--    peticion se repite (se corto la conexion y se reintenta), llega el mismo id
--    y el servidor devuelve el intento que ya existe en vez de crear otro.
-- ---------------------------------------------------------------------------
create table if not exists public.intentos (
  id                uuid        primary key default gen_random_uuid(),
  usuario_id        uuid        not null default auth.uid(),
  leccion_id        text        not null,
  numero            integer     not null,
  estado            text        not null default 'en_curso',
  origen            text        not null default 'servidor',
  total_actividades smallint    not null,
  aciertos          smallint    not null default 0,
  errores           smallint    not null default 0,
  porcentaje        smallint    generated always as ((aciertos * 100) / total_actividades) stored,
  aprobado          boolean     not null default false,
  iniciado_en       timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  finalizado_en     timestamptz,

  constraint ck_intentos_estado     check (estado in ('en_curso', 'completado', 'sin_vidas', 'abandonado')),
  constraint ck_intentos_origen     check (origen in ('servidor', 'etapa4')),
  constraint ck_intentos_numero     check (numero > 0),
  constraint ck_intentos_actividades check (total_actividades between 1 and 50),
  constraint ck_intentos_conteo     check (aciertos >= 0 and errores >= 0 and aciertos + errores <= total_actividades),
  -- Completado = respondio TODAS las actividades del intento.
  constraint ck_intentos_completo   check (estado <> 'completado' or aciertos + errores = total_actividades),
  -- Solo se aprueba un intento completado.
  constraint ck_intentos_aprobado   check (not aprobado or estado = 'completado'),
  -- Mientras esta en curso no tiene fecha de cierre; cerrado, si.
  constraint ck_intentos_cierre     check ((estado = 'en_curso') = (finalizado_en is null)),
  -- Numero de intento por persona y leccion: 1, 2, 3...
  constraint uq_intentos_numero     unique (usuario_id, leccion_id, numero)
);

comment on table  public.intentos is 'Un renglon cada vez que un participante empieza una leccion. Lo escriben solo las funciones del servidor.';
comment on column public.intentos.id is 'Lo genera el cliente (uuid) para que repetir la peticion no cree otro intento.';
comment on column public.intentos.numero is 'Intento 1, 2, 3... de esa persona en esa leccion. Repetir una leccion agrega un intento, no pisa el anterior.';
comment on column public.intentos.estado is 'en_curso, completado (respondio todo), sin_vidas (3 errores antes del final) o abandonado (empezo otro intento de la misma leccion).';
comment on column public.intentos.origen is 'servidor = corregido por el servidor; etapa4 = copiado del historial anterior, donde el cliente informaba los aciertos.';
comment on column public.intentos.total_actividades is 'Foto: cuantas actividades publicadas tenia la leccion al empezar.';
comment on column public.intentos.aciertos is 'Lo calcula el servidor contando las respuestas correctas. El cliente nunca lo envia.';
comment on column public.intentos.aprobado is 'Resultado guardado al completar: true si acerto el 60 % o mas (regla de la etapa 2).';

-- Un solo intento EN CURSO por persona y leccion. Es lo que se retoma al volver.
create unique index if not exists uq_intentos_en_curso
  on public.intentos (usuario_id, leccion_id)
  where estado = 'en_curso';

create index if not exists ix_intentos_usuario on public.intentos (usuario_id, iniciado_en desc);
create index if not exists ix_intentos_leccion on public.intentos (leccion_id);

drop trigger if exists tg_intentos_actualizacion on public.intentos;
create trigger tg_intentos_actualizacion
  before update on public.intentos
  for each row execute function public.fn_marcar_actualizacion();

alter table public.intentos enable row level security;

-- ---------------------------------------------------------------------------
-- 2. RESPUESTAS
--    Clave primaria (intento_id, pregunta_id): una sola respuesta por actividad
--    e intento. Si la misma respuesta llega dos veces, la segunda no entra.
-- ---------------------------------------------------------------------------
create table if not exists public.respuestas (
  intento_id    uuid        not null,
  pregunta_id   text        not null,
  opcion_id     text        not null,
  es_correcta   boolean     not null,
  orden         smallint    not null,
  respondida_en timestamptz not null default now(),

  constraint pk_respuestas        primary key (intento_id, pregunta_id),
  constraint uq_respuestas_orden  unique (intento_id, orden),
  constraint ck_respuestas_orden  check (orden between 1 and 50)
);

comment on table  public.respuestas is 'Una respuesta por actividad e intento. La escribe solo la funcion responder_actividad.';
comment on column public.respuestas.es_correcta is 'Foto de la correccion en el momento de responder: corregir el contenido despues no cambia el historial.';
comment on column public.respuestas.orden is 'En que orden se respondio dentro del intento (1, 2, 3...).';

create index if not exists ix_respuestas_pregunta on public.respuestas (pregunta_id);

alter table public.respuestas enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Claves foraneas
--    Van aparte, con "si no existe", porque 01-esquema.sql recrea el contenido
--    con drop ... cascade y se lleva estas claves. Volver a correr este script
--    las repone.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Para que la respuesta apunte a (opcion, pregunta) y no se pueda guardar una
  -- opcion de otra actividad.
  if not exists (select 1 from pg_constraint where conname = 'uq_opciones_id_pregunta') then
    alter table public.opciones
      add constraint uq_opciones_id_pregunta unique (id, pregunta_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_intentos_usuario') then
    alter table public.intentos
      add constraint fk_intentos_usuario foreign key (usuario_id)
      references public.perfiles (id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_intentos_leccion') then
    alter table public.intentos
      add constraint fk_intentos_leccion foreign key (leccion_id)
      references public.lecciones (id) on update cascade on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_respuestas_intento') then
    alter table public.respuestas
      add constraint fk_respuestas_intento foreign key (intento_id)
      references public.intentos (id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_respuestas_pregunta') then
    alter table public.respuestas
      add constraint fk_respuestas_pregunta foreign key (pregunta_id)
      references public.preguntas (id) on update cascade on delete restrict;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'fk_respuestas_opcion') then
    alter table public.respuestas
      add constraint fk_respuestas_opcion foreign key (opcion_id, pregunta_id)
      references public.opciones (id, pregunta_id) on update cascade on delete restrict;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Historial de la etapa 4
--    Cada renglon de intentos_leccion pasa a ser un intento completado con
--    origen 'etapa4'. Se respeta la fecha y se numera por persona y leccion.
--    Esos aciertos los habia informado el cliente: quedan marcados para que se
--    sepa, pero se siguen contando para no quitarle a nadie lo que ya habia
--    desbloqueado.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.intentos_leccion') is null then
    return;
  end if;

  insert into public.intentos (
    id, usuario_id, leccion_id, numero, estado, origen,
    total_actividades, aciertos, errores, aprobado,
    iniciado_en, actualizado_en, finalizado_en
  )
  select gen_random_uuid(),
         v.usuario_id,
         v.leccion_id,
         coalesce(m.ultimo, 0)
           + row_number() over (partition by v.usuario_id, v.leccion_id order by v.creado_en, v.id),
         'completado',
         'etapa4',
         v.total,
         v.aciertos,
         v.total - v.aciertos,
         v.aciertos * 100 >= 60 * v.total,
         v.creado_en, v.creado_en, v.creado_en
    from public.intentos_leccion v
    left join (
      select usuario_id, leccion_id, max(numero) as ultimo
        from public.intentos
       group by usuario_id, leccion_id
    ) m on m.usuario_id = v.usuario_id and m.leccion_id = v.leccion_id;

  drop table public.intentos_leccion;
end;
$$;

-- La funcion auxiliar del tope de la etapa 4 contaba renglones de la tabla vieja.
drop function if exists public.cantidad_intentos_propios();

commit;
