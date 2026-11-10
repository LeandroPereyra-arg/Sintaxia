-- ===========================================================================
--  Sintaxia - Ranking publico de la expo
--  Etapa 7 - Pantalla de ranking con Supabase Realtime
-- ---------------------------------------------------------------------------
--  La pantalla del ranking se abre en la computadora de la expo SIN sesion
--  (rol anon). No puede leer partidas ni perfiles (son privados). Por eso hay
--  una tabla aparte, minima, con lo unico que se publica:
--
--    resultados_publicos   una fila por participante y desafio: su MEJOR
--                          partida valida (regla de la etapa 6)
--      evento, desafio, alias, codigo, puntaje, tiempo, cuando lo logro
--      + participante: un identificador publico hecho para esto (no es el id
--        de la cuenta) que sirve para resaltar la fila propia
--
--  Lo que NO se publica: correos, contrasenas, ids de cuenta, partidas,
--  respuestas individuales, intentos fallidos ni invitados.
--
--  La tabla la mantiene el servidor con disparadores: cuando una partida queda
--  finalizada, cuando alguien cambia de alias o cuando un invitado crea su
--  cuenta. Nadie la escribe desde el cliente.
--
--  Realtime: la pantalla hace una carga inicial con ranking_evento() y despues
--  escucha los cambios de resultados_publicos (Postgres Changes) para volver a
--  consultar. No se suscribe a una vista: se suscribe a esta tabla, que es la
--  que esta en la publicacion supabase_realtime.
--
--  Se ejecuta despues de 01 a 14. No borra datos y se puede volver a correr.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Identificador publico de cada participante
--    Sirve para que la app encuentre su propia fila en el ranking sin publicar
--    el id de la cuenta. No da acceso a nada.
-- ---------------------------------------------------------------------------
alter table public.perfiles
  add column if not exists id_publico uuid not null default gen_random_uuid();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'uq_perfiles_id_publico') then
    alter table public.perfiles add constraint uq_perfiles_id_publico unique (id_publico);
  end if;
end;
$$;

comment on column public.perfiles.id_publico is 'Identificador publico para el ranking. No es el id de la cuenta y no da acceso a nada.';

-- ---------------------------------------------------------------------------
-- 2. RESULTADOS PUBLICOS
-- ---------------------------------------------------------------------------
create table if not exists public.resultados_publicos (
  evento_id      text        not null,
  desafio_id     text        not null,
  participante   uuid        not null references public.perfiles (id_publico) on delete cascade,
  alias          text        not null,
  codigo         smallint    not null,
  puntaje        integer     not null,
  duracion_ms    integer     not null,
  logrado_en     timestamptz not null,
  actualizado_en timestamptz not null default now(),

  constraint pk_resultados_publicos primary key (desafio_id, participante),
  constraint fk_resultados_desafio foreign key (desafio_id, evento_id)
    references public.desafios (id, evento_id) on update cascade on delete cascade,
  constraint ck_resultados_puntaje check (puntaje >= 0 and duracion_ms >= 0)
);

comment on table public.resultados_publicos is 'Lo unico que se publica del ranking: la mejor partida valida de cada cuenta en cada desafio. La mantiene el servidor.';

create index if not exists ix_resultados_evento on public.resultados_publicos (evento_id, desafio_id, puntaje desc, duracion_ms);

alter table public.resultados_publicos enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Mantenimiento (solo el servidor)
--    Recalcula la fila publica de una persona en un desafio con la regla de la
--    etapa 6 (mejor_partida). Solo las CUENTAS aparecen: un invitado no tiene
--    fila. Solo escribe si algo cambio, para no mandar avisos de Realtime de mas.
-- ---------------------------------------------------------------------------
create or replace function public.actualizar_resultado_publico(p_usuario uuid, p_desafio_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_perfil public.perfiles;
  v_mejor  public.partidas;
begin
  select * into v_perfil from public.perfiles where id = p_usuario;
  if v_perfil.id is null then
    return;
  end if;

  v_mejor := public.mejor_partida(p_usuario, p_desafio_id);

  if v_perfil.es_invitado or v_mejor.id is null then
    delete from public.resultados_publicos
     where desafio_id = p_desafio_id and participante = v_perfil.id_publico;
    return;
  end if;

  insert into public.resultados_publicos
    (evento_id, desafio_id, participante, alias, codigo, puntaje, duracion_ms, logrado_en)
  values
    (v_mejor.evento_id, p_desafio_id, v_perfil.id_publico, v_perfil.alias, v_perfil.codigo,
     v_mejor.puntaje, v_mejor.duracion_ms, v_mejor.finalizada_en)
  on conflict (desafio_id, participante) do update
     set alias = excluded.alias,
         codigo = excluded.codigo,
         puntaje = excluded.puntaje,
         duracion_ms = excluded.duracion_ms,
         logrado_en = excluded.logrado_en,
         actualizado_en = now()
   where (resultados_publicos.alias, resultados_publicos.codigo, resultados_publicos.puntaje,
          resultados_publicos.duracion_ms, resultados_publicos.logrado_en)
         is distinct from
         (excluded.alias, excluded.codigo, excluded.puntaje, excluded.duracion_ms, excluded.logrado_en);
end;
$$;

-- Una partida que queda finalizada puede cambiar el ranking. Corre en la misma
-- transaccion que el cierre: el resultado publico y la partida no se desfasan.
create or replace function public.fn_partida_al_ranking()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'finalizada' and old.estado is distinct from 'finalizada' then
    perform public.actualizar_resultado_publico(new.usuario_id, new.desafio_id);
  end if;
  return null;
end;
$$;

drop trigger if exists tg_partidas_ranking on public.partidas;
create trigger tg_partidas_ranking
  after update of estado on public.partidas
  for each row execute function public.fn_partida_al_ranking();

-- Cambiar de alias o pasar de invitado a cuenta tambien cambia lo publico.
create or replace function public.fn_perfil_al_ranking()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_desafio text;
begin
  for v_desafio in
    select distinct desafio_id from public.partidas where usuario_id = new.id and estado = 'finalizada'
  loop
    perform public.actualizar_resultado_publico(new.id, v_desafio);
  end loop;
  return null;
end;
$$;

drop trigger if exists tg_perfiles_ranking on public.perfiles;
create trigger tg_perfiles_ranking
  after update of alias, codigo, es_invitado on public.perfiles
  for each row
  when ((old.alias, old.codigo, old.es_invitado) is distinct from (new.alias, new.codigo, new.es_invitado))
  execute function public.fn_perfil_al_ranking();

revoke all on function public.actualizar_resultado_publico(uuid, text) from public, anon, authenticated;
revoke all on function public.fn_partida_al_ranking()                 from public, anon, authenticated;
revoke all on function public.fn_perfil_al_ranking()                  from public, anon, authenticated;

-- Partidas que ya estaban finalizadas antes de este script.
do $$
declare
  r record;
begin
  for r in select distinct usuario_id, desafio_id from public.partidas where estado = 'finalizada' loop
    perform public.actualizar_resultado_publico(r.usuario_id, r.desafio_id);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Lectura del ranking (la usa la pantalla de la expo)
--    Reglas de la etapa 6: mas puntaje; a igual puntaje, menos tiempo; a igual
--    puntaje y tiempo comparten el puesto (rank: 1, 1, 3). Elegibilidad: solo
--    cuentas con una partida finalizada (lo garantiza la tabla).
--    SECURITY INVOKER: lee con los permisos de quien consulta, asi que respeta
--    las politicas de abajo (un evento en preparacion no se ve).
-- ---------------------------------------------------------------------------
create or replace function public.ranking_evento(p_evento_id text, p_limite integer default 10)
returns table (
  desafio_id   text,
  desafio      text,
  orden        smallint,
  posicion     integer,
  alias        text,
  codigo       smallint,
  puntaje      integer,
  duracion_ms  integer,
  logrado_en   timestamptz,
  participante uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  select * from (
    select r.desafio_id, d.nombre, d.orden,
           (rank() over (partition by r.desafio_id order by r.puntaje desc, r.duracion_ms asc))::integer,
           r.alias, r.codigo, r.puntaje, r.duracion_ms, r.logrado_en, r.participante
      from public.resultados_publicos r
      join public.desafios d on d.id = r.desafio_id
     where r.evento_id = p_evento_id
  ) t (desafio_id, desafio, orden, posicion, alias, codigo, puntaje, duracion_ms, logrado_en, participante)
  where t.posicion <= greatest(1, least(coalesce(p_limite, 10), 100))
  order by t.orden, t.posicion, t.logrado_en, t.alias;
$$;

comment on function public.ranking_evento(text, integer) is
  'Ranking de un evento por desafio: posicion (con empates), alias, codigo, puntaje y tiempo. Lee solo resultados_publicos.';

grant execute on function public.ranking_evento(text, integer) to anon, authenticated;

-- Posicion propia en un desafio (para la pantalla de puntaje y para resaltar la
-- fila propia en el ranking).
create or replace function public.mi_posicion(p_desafio_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with yo as (
    select id_publico, es_invitado from public.perfiles where id = auth.uid()
  ), tabla as (
    select participante, puntaje,
           rank() over (order by puntaje desc, duracion_ms asc) as posicion
      from public.resultados_publicos where desafio_id = p_desafio_id
  )
  select jsonb_build_object(
    'participante',  (select id_publico from yo),
    'invitado',      coalesce((select es_invitado from yo), true),
    'posicion',      (select posicion from tabla where participante = (select id_publico from yo)),
    'mejor_puntaje', (select puntaje  from tabla where participante = (select id_publico from yo)),
    'participantes', (select count(*) from tabla)
  );
$$;

revoke all on function public.mi_posicion(text) from public, anon;
grant execute on function public.mi_posicion(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Permisos: cualquiera (incluso sin sesion) lee los resultados de los
--    eventos visibles. Nadie escribe.
-- ---------------------------------------------------------------------------
revoke all on public.resultados_publicos from anon, authenticated;
grant select on public.resultados_publicos to anon, authenticated;

drop policy if exists "resultados de eventos visibles" on public.resultados_publicos;
create policy "resultados de eventos visibles"
  on public.resultados_publicos
  for select
  to anon, authenticated
  using (exists (
    select 1 from public.eventos e where e.id = resultados_publicos.evento_id and e.estado <> 'preparacion'
  ));

-- ---------------------------------------------------------------------------
-- 6. Realtime: la tabla entra en la publicacion que lee Supabase Realtime.
--    Realtime aplica las mismas politicas de RLS para decidir a quien avisar.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resultados_publicos'
     ) then
    alter publication supabase_realtime add table public.resultados_publicos;
  end if;
end;
$$;

commit;
