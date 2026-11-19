-- ===========================================================================
--  Sintaxia - Juego de la expo: minijuego y puntaje total
-- ---------------------------------------------------------------------------
--  1. MINIJUEGO "SINTAX ATRAPA EL CODIGO"
--     Un desafio de tipo 'minijuego' (la columna tipo esta en 11-competencia.sql):
--     caen fichas con codigo y Sintax tiene que atrapar las que cumplen la
--     consigna de la ronda. El SERVIDOR:
--       · arma las fichas de la partida (texto, cuando aparece, cuanto tarda en
--         caer, por donde) y es el unico que sabe cuales son validas;
--       · acepta cada ficha atrapada una sola vez y solo mientras esta cayendo,
--         medido con su reloj;
--       · suma puntos por cada ficha valida y descuenta una vida por cada
--         invalida: con 3 errores la partida termina;
--       · cuando se acaba el tiempo la partida termina y CUENTA (en el
--         minijuego, llegar al final del tiempo es terminar: ver vencer_partidas
--         y finalizar_partida en 12-funciones-competencia.sql).
--     El puntaje sigue siendo aciertos x puntos por acierto (restriccion de la
--     tabla) y entra al ranking como cualquier desafio: la mejor partida.
--
--  2. RANKING TOTAL
--     ranking_total(evento): por participante, la suma de su mejor partida de
--     cada desafio del evento (preguntas y minijuego). Suma una sola partida
--     por desafio, asi que no se acumula jugando muchas veces.
--
--  Los desafios de preguntas que no muestran la correccion mientras se juegan
--  estan en 12-funciones-competencia.sql y 13-politicas-rls-etapa6.sql.
--
--  Se ejecuta despues de 01 a 16. No borra datos y se puede volver a correr.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Fichas del minijuego
-- ---------------------------------------------------------------------------
create table if not exists public.minijuego_categorias (
  id       text primary key,
  consigna text not null,
  constraint ck_minijuego_categoria_id check (id ~ '^[a-z0-9_]+$'),
  constraint ck_minijuego_consigna     check (length(btrim(consigna)) between 5 and 80)
);

create table if not exists public.minijuego_fichas (
  categoria_id text    not null references public.minijuego_categorias (id) on update cascade on delete cascade,
  texto        text    not null,
  valida       boolean not null,
  primary key (categoria_id, texto),
  constraint ck_minijuego_ficha_texto check (length(texto) between 1 and 16)
);

comment on table public.minijuego_fichas is 'Banco del minijuego: cada ficha, a que consigna pertenece y si cumple (la solucion: no se lee desde el cliente).';

-- Las fichas de una partida, con su momento: las arma el servidor al empezar.
create table if not exists public.partida_fichas (
  partida_id  uuid        not null references public.partidas (id) on delete cascade,
  n           smallint    not null,
  ronda       smallint    not null,
  categoria_id text       not null references public.minijuego_categorias (id) on update cascade,
  texto       text        not null,
  valida      boolean     not null,
  aparece_ms  integer     not null,
  caida_ms    integer     not null,
  columna     smallint    not null,
  atrapada_en timestamptz,
  primary key (partida_id, n),
  constraint ck_partida_fichas_tiempos check (aparece_ms >= 0 and caida_ms between 1000 and 10000),
  constraint ck_partida_fichas_columna check (columna between 0 and 4)
);

comment on table public.partida_fichas is 'Fichas de una partida del minijuego. valida no se muestra mientras la ficha no fue atrapada.';

alter table public.minijuego_categorias enable row level security;
alter table public.minijuego_fichas     enable row level security;
alter table public.partida_fichas       enable row level security;
revoke all on public.minijuego_categorias from anon, authenticated;
revoke all on public.minijuego_fichas     from anon, authenticated;
revoke all on public.partida_fichas       from anon, authenticated;
-- Sin politicas: el cliente no lee ninguna de las tres; todo pasa por funciones.

-- Banco inicial (se puede volver a correr: no duplica).
insert into public.minijuego_categorias (id, consigna) values
  ('reservadas',  'Atrapá palabras reservadas de JavaScript'),
  ('typeof',      'Atrapá resultados posibles de typeof'),
  ('comparacion', 'Atrapá operadores de comparación'),
  ('arrays',      'Atrapá métodos de los arrays')
on conflict (id) do update set consigna = excluded.consigna;

insert into public.minijuego_fichas (categoria_id, texto, valida)
select * from (values
  ('reservadas', 'let', true), ('reservadas', 'const', true), ('reservadas', 'var', true),
  ('reservadas', 'function', true), ('reservadas', 'return', true), ('reservadas', 'if', true),
  ('reservadas', 'else', true), ('reservadas', 'for', true), ('reservadas', 'while', true),
  ('reservadas', 'class', true), ('reservadas', 'new', true), ('reservadas', 'typeof', true),
  ('reservadas', 'switch', true), ('reservadas', 'break', true), ('reservadas', 'null', true),
  ('reservadas', 'lett', false), ('reservadas', 'cosnt', false), ('reservadas', 'funtion', false),
  ('reservadas', 'retrun', false), ('reservadas', 'esle', false), ('reservadas', 'whlie', false),
  ('reservadas', 'clase', false), ('reservadas', 'swich', false), ('reservadas', 'func', false),
  ('reservadas', 'def', false), ('reservadas', 'print', false), ('reservadas', 'elif', false),
  ('typeof', '"number"', true), ('typeof', '"string"', true), ('typeof', '"boolean"', true),
  ('typeof', '"undefined"', true), ('typeof', '"object"', true), ('typeof', '"function"', true),
  ('typeof', '"bigint"', true), ('typeof', '"symbol"', true),
  ('typeof', '"int"', false), ('typeof', '"float"', false), ('typeof', '"array"', false),
  ('typeof', '"char"', false), ('typeof', '"text"', false), ('typeof', '"null"', false),
  ('typeof', '"numero"', false), ('typeof', '"list"', false),
  ('comparacion', '===', true), ('comparacion', '!==', true), ('comparacion', '==', true),
  ('comparacion', '!=', true), ('comparacion', '<', true), ('comparacion', '>', true),
  ('comparacion', '<=', true), ('comparacion', '>=', true),
  ('comparacion', '=<', false), ('comparacion', '=>', false), ('comparacion', '=!', false),
  ('comparacion', '<>', false), ('comparacion', '====', false), ('comparacion', '!===', false),
  ('comparacion', '><', false), ('comparacion', '=', false),
  ('arrays', 'push', true), ('arrays', 'pop', true), ('arrays', 'map', true),
  ('arrays', 'filter', true), ('arrays', 'find', true), ('arrays', 'includes', true),
  ('arrays', 'slice', true), ('arrays', 'join', true), ('arrays', 'sort', true),
  ('arrays', 'reduce', true), ('arrays', 'forEach', true), ('arrays', 'indexOf', true),
  ('arrays', 'append', false), ('arrays', 'insert', false), ('arrays', 'count', false),
  ('arrays', 'size', false), ('arrays', 'delete', false), ('arrays', 'contains', false),
  ('arrays', 'each', false), ('arrays', 'remove', false)
) as v(categoria_id, texto, valida)
on conflict (categoria_id, texto) do update set valida = excluded.valida;

-- ---------------------------------------------------------------------------
-- 2. Minijuego: empezar
-- ---------------------------------------------------------------------------
-- Las fichas que se mandan al celular: sin "valida" mientras no se atrapo.
create or replace function public.minijuego_completo(p_partida_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select public.resumen_partida(p) || jsonb_build_object(
    'rondas', coalesce((
      select jsonb_agg(jsonb_build_object('ronda', r.ronda, 'desde_ms', r.desde_ms, 'consigna', c.consigna) order by r.ronda)
        from (select f.ronda, f.categoria_id, min(f.aparece_ms) as desde_ms
                from public.partida_fichas f
               where f.partida_id = p.id
               group by f.ronda, f.categoria_id) r
        join public.minijuego_categorias c on c.id = r.categoria_id
    ), '[]'::jsonb),
    'fichas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'n', f.n, 'ronda', f.ronda, 'texto', f.texto, 'aparece_ms', f.aparece_ms,
               'caida_ms', f.caida_ms, 'columna', f.columna,
               'atrapada', f.atrapada_en is not null,
               'valida', case when f.atrapada_en is not null then f.valida end
             ) order by f.n)
        from public.partida_fichas f
       where f.partida_id = p.id
    ), '[]'::jsonb)
  )
  from public.partidas p
  where p.id = p_partida_id;
$$;

create or replace function public.iniciar_minijuego(p_partida_id uuid, p_desafio_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario  uuid := public.exigir_sesion();
  v_partida  public.partidas;
  v_desafio  public.desafios;
  v_evento   public.eventos;
  v_usadas   integer;
  v_rondas   text[];
  v_cantidad integer;
  v_duracion integer;
  v_nrondas  integer;
  v_cat      text;
  t          double precision;
  i          integer;
  v_ronda    integer;
  v_caida    integer;
  v_aparece  integer;
  v_valida   boolean;
  v_texto    text;
begin
  if p_partida_id is null or p_desafio_id is null then
    raise exception 'Faltan datos: hay que indicar la partida y el desafío.'
      using errcode = '22023', hint = 'datos_incompletos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('partidas:' || v_usuario::text, 0));

  select * into v_partida from public.partidas where id = p_partida_id;
  if v_partida.id is not null then
    if v_partida.usuario_id <> v_usuario then
      raise exception 'Ese identificador de partida no se puede usar.'
        using errcode = '23505', hint = 'partida_no_disponible';
    end if;
    if v_partida.desafio_id <> p_desafio_id then
      raise exception 'Esa partida es de otro desafío.' using errcode = '22023', hint = 'partida_de_otro_desafio';
    end if;
    perform public.vencer_partidas(v_usuario);
    return public.minijuego_completo(p_partida_id) || jsonb_build_object('repetida', true);
  end if;

  perform public.vencer_partidas(v_usuario);

  select * into v_desafio from public.desafios where id = p_desafio_id;
  select * into v_evento  from public.eventos  where id = v_desafio.evento_id;

  if v_desafio.id is null or v_desafio.estado <> 'publicado' then
    raise exception 'Ese desafío no está disponible.' using errcode = 'P0001', hint = 'desafio_no_disponible';
  end if;
  if v_desafio.tipo <> 'minijuego' then
    raise exception 'Ese desafío no es un minijuego.' using errcode = 'P0001', hint = 'tipo_incorrecto';
  end if;
  if v_evento.estado <> 'abierto'
     or (v_evento.abre_en is not null and now() < v_evento.abre_en)
     or (v_evento.cierra_en is not null and now() > v_evento.cierra_en) then
    raise exception 'El evento "%" no está abierto para jugar.', v_evento.nombre
      using errcode = 'P0001', hint = 'evento_cerrado';
  end if;

  -- Una partida del minijuego que quedo abierta no se retoma (el juego no se
  -- puede pausar): se cierra con lo que tenia y se empieza otra.
  update public.partidas
     set estado = 'finalizada', finalizada_en = now(),
         duracion_ms = least(duracion_segundos * 1000, greatest(0, (extract(epoch from (now() - iniciada_en)) * 1000)::integer))
   where usuario_id = v_usuario and desafio_id = p_desafio_id and estado = 'en_curso';

  select count(*) into v_usadas from public.partidas
   where usuario_id = v_usuario and desafio_id = p_desafio_id;
  if v_usadas >= v_desafio.intentos_permitidos then
    raise exception 'Ya usaste los % intentos de este desafío.', v_desafio.intentos_permitidos
      using errcode = 'P0001', hint = 'sin_intentos';
  end if;

  update public.desafios set congelado_en = now() where id = p_desafio_id and congelado_en is null;

  -- Unas 5 fichas cada 4 segundos (en el minijuego de 3 minutos, 225).
  v_cantidad := greatest(10, v_desafio.duracion_segundos * 5 / 4);

  insert into public.partidas (
    id, usuario_id, desafio_id, evento_id, numero, tipo,
    version_desafio, puntos_por_acierto, duracion_segundos, gracia_segundos,
    total_preguntas, iniciada_en, vence_en
  ) values (
    p_partida_id, v_usuario, p_desafio_id, v_desafio.evento_id, v_usadas + 1, 'minijuego',
    v_desafio.version, v_desafio.puntos_por_acierto, v_desafio.duracion_segundos, v_desafio.gracia_segundos,
    -- Cuenta regresiva: el juego (y su reloj) empieza 3 s despues de pedirlo,
    -- mientras el celular muestra 3, 2, 1. Asi nadie pierde segundos de juego.
    v_cantidad, now() + interval '3 seconds', now() + interval '3 seconds' + make_interval(secs => v_desafio.duracion_segundos)
  );

  -- Una consigna cada 20 segundos, al azar y nunca la misma dos veces seguidas.
  v_duracion := v_desafio.duracion_segundos * 1000;
  v_nrondas  := greatest(1, ceil(v_duracion / 20000.0)::integer);
  v_rondas   := array[]::text[];
  for i in 1 .. v_nrondas loop
    select id into v_cat from public.minijuego_categorias
     where id is distinct from v_rondas[i - 1] or (select count(*) from public.minijuego_categorias) = 1
     order by random() limit 1;
    v_rondas := v_rondas || v_cat;
  end loop;

  -- Para los que aguantan: las fichas caen cada vez mas rapido (de 4,2 s a 1,6 s)
  -- y cada vez mas seguido (t^0,8 junta las del final). Todas llegan abajo antes
  -- de que se acabe el tiempo. Con 3 vidas, quien se equivoca termina antes.
  for i in 0 .. v_cantidad - 1 loop
    t         := i::double precision / (v_cantidad - 1);
    v_caida   := 4200 - round(2600 * t)::integer;
    v_aparece := round((v_duracion - 1600 - 1500) * power(t, 0.8))::integer + (random() * 300)::integer;
    v_ronda   := least(v_nrondas - 1, v_aparece / 20000);
    v_valida  := random() < 0.55;
    select texto into v_texto
      from public.minijuego_fichas
     where categoria_id = v_rondas[v_ronda + 1] and valida = v_valida
     order by random() limit 1;
    insert into public.partida_fichas (partida_id, n, ronda, categoria_id, texto, valida, aparece_ms, caida_ms, columna)
    values (p_partida_id, i + 1, v_ronda, v_rondas[v_ronda + 1], v_texto, v_valida, v_aparece, v_caida,
            floor(random() * 5)::integer);
  end loop;

  return public.minijuego_completo(p_partida_id) || jsonb_build_object('repetida', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Minijuego: atrapar una ficha
-- ---------------------------------------------------------------------------
create or replace function public.atrapar_ficha(p_partida_id uuid, p_n integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_partida   public.partidas;
  v_ficha     public.partida_fichas;
  v_ms        integer;
  v_aciertos  integer;
  v_errores   integer;
  v_repetida  boolean := false;
begin
  perform public.exigir_sesion();
  if p_partida_id is null or p_n is null then
    raise exception 'Faltan datos: partida y ficha.' using errcode = '22023', hint = 'datos_incompletos';
  end if;

  v_partida := public.partida_propia(p_partida_id, true);
  if v_partida.tipo <> 'minijuego' then
    raise exception 'Esta partida no es del minijuego.' using errcode = 'P0001', hint = 'tipo_incorrecto';
  end if;

  select * into v_ficha from public.partida_fichas where partida_id = p_partida_id and n = p_n;
  if v_ficha.partida_id is null then
    raise exception 'Esa ficha no es de esta partida.' using errcode = 'P0002', hint = 'ficha_ajena';
  end if;

  if v_ficha.atrapada_en is not null then
    v_repetida := true;   -- la misma ficha dos veces: se devuelve lo que ya estaba
  else
    if v_partida.estado <> 'en_curso' then
      raise exception 'Esta partida ya terminó.' using errcode = 'P0001', hint = 'partida_cerrada';
    end if;
    -- Solo se puede atrapar mientras cae (reloj del servidor, con margen de red).
    v_ms := (extract(epoch from (now() - v_partida.iniciada_en)) * 1000)::integer;
    if v_ms < v_ficha.aparece_ms - 1500
       or v_ms > v_ficha.aparece_ms + v_ficha.caida_ms + v_partida.gracia_segundos * 1000 then
      raise exception 'Esa ficha no estaba cayendo en ese momento.' using errcode = 'P0001', hint = 'ficha_fuera_de_tiempo';
    end if;

    update public.partida_fichas set atrapada_en = now()
     where partida_id = p_partida_id and n = p_n
    returning * into v_ficha;

    select count(*) filter (where valida), count(*) filter (where not valida)
      into v_aciertos, v_errores
      from public.partida_fichas where partida_id = p_partida_id and atrapada_en is not null;

    update public.partidas
       set aciertos = v_aciertos,
           errores = v_errores,
           puntaje = v_aciertos * puntos_por_acierto,
           -- Tres errores: se terminan las vidas y termina la partida (cuenta).
           estado = case when v_errores >= 3 then 'finalizada' else 'en_curso' end,
           finalizada_en = case when v_errores >= 3 then least(now(), vence_en) end,
           duracion_ms = case when v_errores >= 3
                              then least(duracion_segundos * 1000,
                                         greatest(0, (extract(epoch from (now() - iniciada_en)) * 1000)::integer))
                         end
     where id = p_partida_id
    returning * into v_partida;
  end if;

  return jsonb_build_object(
    'n',        v_ficha.n,
    'valida',   v_ficha.valida,
    'repetida', v_repetida,
    'partida',  public.resumen_partida(v_partida)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Ranking total del evento
-- ---------------------------------------------------------------------------
drop function if exists public.ranking_total(text, integer);
create function public.ranking_total(p_evento_id text, p_limite integer default 10)
returns table (
  posicion     integer,
  alias        text,
  codigo       smallint,
  puntaje      integer,
  duracion_ms  integer,
  desafios     integer,
  participante uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  select (rank() over (order by sum(r.puntaje) desc, sum(r.duracion_ms) asc))::integer as posicion,
         r.alias, r.codigo,
         sum(r.puntaje)::integer     as puntaje,
         sum(r.duracion_ms)::integer as duracion_ms,
         count(*)::integer           as desafios,
         r.participante
    from public.resultados_publicos r
   where r.evento_id = p_evento_id
   group by r.participante, r.alias, r.codigo
   order by 1, r.alias
   limit greatest(1, least(coalesce(p_limite, 10), 200));
$$;

-- ---------------------------------------------------------------------------
-- 5. El minijuego de la expo de ejemplo
-- ---------------------------------------------------------------------------
insert into public.desafios (id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos,
                             puntos_por_acierto, intentos_permitidos, gracia_segundos, estado, tipo)
select 'expo-2026-minijuego', 'expo-2026', 3, 'Sintax atrapa el código',
       'Mové a Sintax y atrapá las fichas que cumplen la consigna. Cada error te cuesta una vida.',
       'facil', 180, 20, 3, 5, 'publicado', 'minijuego'
 where exists (select 1 from public.eventos where id = 'expo-2026')
   and not exists (select 1 from public.desafios where id = 'expo-2026-minijuego');

update public.desafios
   set descripcion = 'Sintax se quedó sin código y te necesita. Caen fichas con palabras y símbolos de '
                  || 'JavaScript: mové a Sintax para atrapar solo las que cumplen la consigna de arriba '
                  || '(por ejemplo, palabras reservadas como let o return) y esquivá las falsas, como lett '
                  || 'o funtion. Cada ficha buena suma 20 puntos y cada error te cuesta una de tus 3 vidas. '
                  || 'Dura hasta 3 minutos: las fichas caen cada vez más rápido y la consigna cambia cada '
                  || '20 segundos. Termina cuando se acaba el tiempo o te quedás sin vidas: cuanto más aguantes, '
                  || 'más puntos.'
 where id = 'expo-2026-minijuego';

-- De 1 a 3 minutos. Si el desafio ya tiene partidas (congelado), sus reglas no
-- se tocan desde aca: ver docs/27 (se cambia una sola vez, a mano).
update public.desafios set duracion_segundos = 180
 where id = 'expo-2026-minijuego' and duracion_segundos = 60 and congelado_en is null;

-- ---------------------------------------------------------------------------
-- 6. Permisos
-- ---------------------------------------------------------------------------
revoke all on function public.minijuego_completo(uuid)           from public, anon, authenticated;
revoke all on function public.iniciar_minijuego(uuid, text)      from public, anon;
revoke all on function public.atrapar_ficha(uuid, integer)       from public, anon;
grant execute on function public.iniciar_minijuego(uuid, text)   to authenticated;
grant execute on function public.atrapar_ficha(uuid, integer)    to authenticated;
revoke all on function public.ranking_total(text, integer)       from public;
grant execute on function public.ranking_total(text, integer)    to anon, authenticated;

commit;
