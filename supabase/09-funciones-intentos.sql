-- ===========================================================================
--  Sintaxia - Funciones del servidor para los intentos
--  Etapa 5 - Amplia la correccion de la etapa 3 (04-funcion-comprobar.sql)
-- ---------------------------------------------------------------------------
--  El cliente NO puede escribir en intentos ni en respuestas (10-politicas):
--  todo pasa por estas tres funciones, que corren del lado del servidor.
--
--    iniciar_intento(id, leccion)          crea un intento (o devuelve el mismo
--                                          si la peticion se repite)
--    responder_actividad(id, pregunta,     corrige, guarda la respuesta y
--                        opcion)           recalcula el resultado del intento
--    abandonar_intento(id)                 cierra un intento en curso
--
--  El celular manda solo identificadores: que leccion, que pregunta, que
--  opcion. Los aciertos, los errores, el porcentaje, si quedo completado y si
--  quedo aprobado los CALCULA el servidor a partir de las respuestas guardadas.
--  No hay ningun parametro por donde mandar un porcentaje o una cantidad.
--
--  Reglas que aplican (acordadas en la etapa 2, docs/06-reglas-de-avance.md):
--    · Completada: respondio todas las actividades.
--    · Aprobada:   completada con 60 % o mas de aciertos.
--    · 3 vidas: el tercer error ANTES de la ultima actividad corta el intento
--      (sin_vidas) y la leccion no queda completada.
--    · Una leccion se abre si su unidad esta abierta y es la primera, o la
--      anterior esta aprobada, o ya la habia completado antes.
--    · Una unidad se abre si es la primera, si la anterior esta completa (todas
--      sus lecciones aprobadas) o si ya esta completa.
--
--  Errores: se lanzan con un HINT legible por la app (sin_sesion,
--  leccion_bloqueada, intento_no_encontrado, intento_cerrado, ...).
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Constantes de las reglas, en un solo lugar
-- ---------------------------------------------------------------------------
create or replace function public.umbral_aprobacion()
returns integer language sql immutable as $$ select 60 $$;

create or replace function public.vidas_por_intento()
returns integer language sql immutable as $$ select 3 $$;

create or replace function public.tope_intentos_invitado()
returns integer language sql immutable as $$ select 200 $$;

comment on function public.umbral_aprobacion() is 'Porcentaje de aciertos para aprobar una leccion (etapa 2). Igual a UMBRAL_APROBACION del cliente.';

-- ---------------------------------------------------------------------------
-- 2. Reglas de avance, calculadas con lo que guardo el servidor
--    Son funciones internas: las usan las de abajo, el cliente no las llama.
-- ---------------------------------------------------------------------------

-- Lecciones publicadas de una unidad publicada de un curso visible, en orden.
create or replace function public.lecciones_publicadas_de(p_unidad_id text)
returns setof text
language sql
stable
set search_path = public
as $$
  select l.id
    from public.lecciones l
    join public.unidades  u on u.id = l.unidad_id
    join public.cursos    c on c.id = u.curso_id
   where l.unidad_id = p_unidad_id
     and l.estado = 'publicada'
     and u.estado = 'publicada'
     and c.estado <> 'borrador'
   order by l.orden;
$$;

create or replace function public.leccion_completada_por(p_usuario uuid, p_leccion_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.intentos
     where usuario_id = p_usuario and leccion_id = p_leccion_id and estado = 'completado'
  );
$$;

create or replace function public.leccion_aprobada_por(p_usuario uuid, p_leccion_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.intentos
     where usuario_id = p_usuario and leccion_id = p_leccion_id and aprobado
  );
$$;

-- Completa = tiene lecciones publicadas y TODAS estan aprobadas.
create or replace function public.unidad_completada_por(p_usuario uuid, p_unidad_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (select 1 from public.lecciones_publicadas_de(p_unidad_id))
     and not exists (
       select 1
         from public.lecciones_publicadas_de(p_unidad_id) as l(id)
        where not public.leccion_aprobada_por(p_usuario, l.id)
     );
$$;

create or replace function public.leccion_disponible_para(p_usuario uuid, p_leccion_id text)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_unidad_id        text;
  v_curso_id         text;
  v_orden_unidad     smallint;
  v_orden_leccion    smallint;
  v_unidad_anterior  text;
  v_leccion_anterior text;
begin
  -- La leccion tiene que estar publicada, en una unidad publicada de un curso disponible.
  select l.unidad_id, u.curso_id, u.orden, l.orden
    into v_unidad_id, v_curso_id, v_orden_unidad, v_orden_leccion
    from public.lecciones l
    join public.unidades  u on u.id = l.unidad_id
    join public.cursos    c on c.id = u.curso_id
   where l.id = p_leccion_id
     and l.estado = 'publicada'
     and u.estado = 'publicada'
     and c.estado = 'disponible';

  if v_unidad_id is null then
    return false;
  end if;

  -- Unidad: abierta si es la primera visible, si la anterior esta completa o si
  -- esta misma ya esta completa.
  select u.id into v_unidad_anterior
    from public.unidades u
   where u.curso_id = v_curso_id
     and u.orden < v_orden_unidad
     and u.estado <> 'borrador'
   order by u.orden desc
   limit 1;

  if v_unidad_anterior is not null
     and not public.unidad_completada_por(p_usuario, v_unidad_anterior)
     and not public.unidad_completada_por(p_usuario, v_unidad_id) then
    return false;
  end if;

  -- Leccion: ya completada (se puede repasar), primera de la unidad, o la
  -- anterior aprobada.
  if public.leccion_completada_por(p_usuario, p_leccion_id) then
    return true;
  end if;

  select l.id into v_leccion_anterior
    from public.lecciones l
   where l.unidad_id = v_unidad_id
     and l.orden < v_orden_leccion
     and l.estado = 'publicada'
   order by l.orden desc
   limit 1;

  return v_leccion_anterior is null
      or public.leccion_aprobada_por(p_usuario, v_leccion_anterior);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Resumen de un intento, igual para las tres funciones
-- ---------------------------------------------------------------------------
create or replace function public.resumen_intento(p_intento public.intentos)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id',                p_intento.id,
    'leccion_id',        p_intento.leccion_id,
    'numero',            p_intento.numero,
    'estado',            p_intento.estado,
    'origen',            p_intento.origen,
    'total_actividades', p_intento.total_actividades,
    'aciertos',          p_intento.aciertos,
    'errores',           p_intento.errores,
    'respondidas',       p_intento.aciertos + p_intento.errores,
    'porcentaje',        p_intento.porcentaje,
    'aprobado',          p_intento.aprobado,
    'vidas',             greatest(0, public.vidas_por_intento() - p_intento.errores),
    'iniciado_en',       p_intento.iniciado_en,
    'finalizado_en',     p_intento.finalizado_en
  );
$$;

-- Devuelve la fila del intento si existe y es de la persona; si no, error.
-- Un intento ajeno responde igual que uno inexistente: no se revela que existe.
create or replace function public.intento_propio(p_intento_id uuid, p_bloquear boolean default false)
returns public.intentos
language plpgsql
set search_path = public
as $$
declare
  v_intento public.intentos;
begin
  if p_bloquear then
    select * into v_intento from public.intentos where id = p_intento_id for update;
  else
    select * into v_intento from public.intentos where id = p_intento_id;
  end if;

  if v_intento.id is null or v_intento.usuario_id is distinct from auth.uid() then
    raise exception 'Ese intento no existe.'
      using errcode = 'P0002', hint = 'intento_no_encontrado';
  end if;
  return v_intento;
end;
$$;

create or replace function public.exigir_sesion()
returns uuid
language plpgsql
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesion (de invitado o de cuenta) para guardar el progreso.'
      using errcode = '42501', hint = 'sin_sesion';
  end if;
  return auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. iniciar_intento
--    Idempotente por id: si el intento ya existe y es de la misma persona y
--    leccion, lo devuelve tal cual (repetida = true) sin crear otro.
-- ---------------------------------------------------------------------------
create or replace function public.iniciar_intento(p_intento_id uuid, p_leccion_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario   uuid := public.exigir_sesion();
  v_intento   public.intentos;
  v_total     integer;
  v_cantidad  integer;
  v_invitado  boolean;
begin
  if p_intento_id is null or p_leccion_id is null then
    raise exception 'Faltan datos: hay que indicar el intento y la leccion.'
      using errcode = '22023', hint = 'datos_incompletos';
  end if;

  -- Las peticiones de una misma persona se atienden de a una: asi dos
  -- dispositivos (o un reintento) no crean dos intentos en curso a la vez.
  perform pg_advisory_xact_lock(hashtextextended('intentos:' || v_usuario::text, 0));

  select * into v_intento from public.intentos where id = p_intento_id;
  if v_intento.id is not null then
    if v_intento.usuario_id <> v_usuario then
      raise exception 'Ese identificador de intento no se puede usar.'
        using errcode = '23505', hint = 'intento_no_disponible';
    end if;
    if v_intento.leccion_id <> p_leccion_id then
      raise exception 'Ese intento es de otra leccion.'
        using errcode = '22023', hint = 'intento_de_otra_leccion';
    end if;
    return public.resumen_intento(v_intento) || jsonb_build_object('repetida', true);
  end if;

  if not public.leccion_disponible_para(v_usuario, p_leccion_id) then
    raise exception 'La leccion "%" todavia no esta habilitada para vos.', p_leccion_id
      using errcode = 'P0001', hint = 'leccion_bloqueada';
  end if;

  -- Tope para invitados: crear sesiones anonimas es gratis.
  select es_invitado into v_invitado from public.perfiles where id = v_usuario;
  if coalesce(v_invitado, true) then
    select count(*) into v_cantidad from public.intentos where usuario_id = v_usuario;
    if v_cantidad >= public.tope_intentos_invitado() then
      raise exception 'Llegaste al limite de intentos como invitado. Crea tu cuenta para seguir guardando.'
        using errcode = 'P0001', hint = 'tope_invitado';
    end if;
  end if;

  select count(*) into v_total
    from public.preguntas
   where leccion_id = p_leccion_id and estado = 'publicada';

  if v_total = 0 then
    raise exception 'La leccion "%" no tiene actividades publicadas.', p_leccion_id
      using errcode = 'P0001', hint = 'sin_actividades';
  end if;

  -- Si habia un intento en curso de esta leccion, queda abandonado (no se borra).
  update public.intentos
     set estado = 'abandonado', finalizado_en = now()
   where usuario_id = v_usuario
     and leccion_id = p_leccion_id
     and estado = 'en_curso';

  insert into public.intentos (id, usuario_id, leccion_id, numero, total_actividades)
  values (
    p_intento_id,
    v_usuario,
    p_leccion_id,
    1 + coalesce((select max(numero) from public.intentos
                   where usuario_id = v_usuario and leccion_id = p_leccion_id), 0),
    least(v_total, 50)
  )
  returning * into v_intento;

  return public.resumen_intento(v_intento) || jsonb_build_object('repetida', false);
end;
$$;

comment on function public.iniciar_intento(uuid, text) is
  'Empieza un intento de una leccion habilitada. Idempotente: repetir con el mismo id devuelve el mismo intento.';

-- ---------------------------------------------------------------------------
-- 5. responder_actividad
--    Corrige como comprobar_respuesta (etapa 3) y ademas guarda la respuesta y
--    recalcula el intento. Repetir la misma peticion no suma dos veces: devuelve
--    lo que ya estaba guardado (repetida = true).
-- ---------------------------------------------------------------------------
create or replace function public.responder_actividad(
  p_intento_id  uuid,
  p_pregunta_id text,
  p_opcion_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario     uuid := public.exigir_sesion();
  v_intento     public.intentos;
  v_respuesta   public.respuestas;
  v_repetida    boolean := false;
  v_correcta    boolean;
  v_explicacion text;
  v_correcta_id text;
  v_correcta_tx text;
  v_aciertos    integer;
  v_errores     integer;
  v_pendientes  integer;
  v_total       integer;
begin
  if p_intento_id is null or p_pregunta_id is null or p_opcion_id is null then
    raise exception 'Faltan datos: hay que indicar el intento, la actividad y la opcion elegida.'
      using errcode = '22023', hint = 'datos_incompletos';
  end if;

  -- Se bloquea el renglon del intento: dos respuestas al mismo intento (dos
  -- pestanas, un reintento) se procesan una despues de la otra.
  v_intento := public.intento_propio(p_intento_id, true);

  select * into v_respuesta
    from public.respuestas
   where intento_id = p_intento_id and pregunta_id = p_pregunta_id;

  if v_respuesta.intento_id is not null then
    -- Ya estaba respondida: se devuelve la respuesta GUARDADA, aunque ahora
    -- llegue otra opcion. Vale la primera.
    v_repetida := true;
  else
    if v_intento.estado <> 'en_curso' then
      raise exception 'Este intento ya termino (%). Empeza uno nuevo para seguir.', v_intento.estado
        using errcode = 'P0001', hint = 'intento_cerrado';
    end if;

    if not exists (
      select 1 from public.preguntas
       where id = p_pregunta_id and leccion_id = v_intento.leccion_id and estado = 'publicada'
    ) then
      raise exception 'La actividad "%" no es de esta leccion o no esta disponible.', p_pregunta_id
        using errcode = 'P0002', hint = 'actividad_no_encontrada';
    end if;

    select o.es_correcta into v_correcta
      from public.opciones o
     where o.id = p_opcion_id and o.pregunta_id = p_pregunta_id;

    if v_correcta is null then
      raise exception 'La opcion "%" no pertenece a la actividad "%".', p_opcion_id, p_pregunta_id
        using errcode = 'P0002', hint = 'opcion_no_encontrada';
    end if;

    insert into public.respuestas (intento_id, pregunta_id, opcion_id, es_correcta, orden)
    values (
      p_intento_id, p_pregunta_id, p_opcion_id, v_correcta,
      1 + (select count(*) from public.respuestas where intento_id = p_intento_id)
    )
    returning * into v_respuesta;

    -- El resultado sale de contar lo guardado, no de sumar lo que diga el cliente.
    select count(*) filter (where es_correcta), count(*) filter (where not es_correcta)
      into v_aciertos, v_errores
      from public.respuestas
     where intento_id = p_intento_id;

    -- Actividades publicadas que todavia no respondio en este intento.
    select count(*) into v_pendientes
      from public.preguntas p
     where p.leccion_id = v_intento.leccion_id
       and p.estado = 'publicada'
       and not exists (
         select 1 from public.respuestas r
          where r.intento_id = p_intento_id and r.pregunta_id = p.id
       );

    v_total := v_intento.total_actividades;
    -- Si mientras tanto se despublico una actividad, el intento se cierra con
    -- las que quedaban: no puede quedar trabado esperando una que ya no existe.
    if v_pendientes = 0 and v_aciertos + v_errores < v_total then
      v_total := v_aciertos + v_errores;
    end if;

    update public.intentos
       set aciertos = v_aciertos,
           errores  = v_errores,
           total_actividades = v_total,
           estado = case
                      when v_aciertos + v_errores >= v_total then 'completado'
                      when v_errores >= public.vidas_por_intento() then 'sin_vidas'
                      else 'en_curso'
                    end,
           aprobado = v_aciertos + v_errores >= v_total
                      and v_aciertos * 100 >= public.umbral_aprobacion() * v_total,
           finalizado_en = case
                             when v_aciertos + v_errores >= v_total
                               or v_errores >= public.vidas_por_intento() then now()
                           end
     where id = p_intento_id
    returning * into v_intento;
  end if;

  -- Devolucion para la pantalla (igual que comprobar_respuesta).
  select explicacion into v_explicacion from public.preguntas where id = v_respuesta.pregunta_id;
  if not v_respuesta.es_correcta then
    select o.id, o.texto into v_correcta_id, v_correcta_tx
      from public.opciones o
     where o.pregunta_id = v_respuesta.pregunta_id and o.es_correcta;
  end if;

  return jsonb_build_object(
    'pregunta_id',           v_respuesta.pregunta_id,
    'opcion_id',             v_respuesta.opcion_id,
    'correcta',              v_respuesta.es_correcta,
    'explicacion',           v_explicacion,
    'opcion_correcta_id',    v_correcta_id,
    'opcion_correcta_texto', v_correcta_tx,
    'orden',                 v_respuesta.orden,
    'respondida_en',         v_respuesta.respondida_en,
    'repetida',              v_repetida,
    'intento',               public.resumen_intento(v_intento)
  );
end;
$$;

comment on function public.responder_actividad(uuid, text, text) is
  'Corrige y guarda una respuesta de un intento propio y recalcula aciertos, errores, estado y aprobacion. Una sola respuesta por actividad: repetir devuelve la guardada.';

-- ---------------------------------------------------------------------------
-- 6. abandonar_intento
--    Para "empezar de nuevo" sin dejar el anterior colgado. Si el intento ya
--    estaba cerrado no cambia nada (repetir la peticion no hace dano).
-- ---------------------------------------------------------------------------
create or replace function public.abandonar_intento(p_intento_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_intento public.intentos;
begin
  perform public.exigir_sesion();
  v_intento := public.intento_propio(p_intento_id, true);

  if v_intento.estado = 'en_curso' then
    update public.intentos
       set estado = 'abandonado', finalizado_en = now()
     where id = p_intento_id
    returning * into v_intento;
  end if;

  return public.resumen_intento(v_intento);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Permisos de ejecucion
--    Las tres de arriba: solo con sesion (invitado o cuenta). El publico (anon)
--    no puede empezar intentos. Las auxiliares no se exponen.
-- ---------------------------------------------------------------------------
revoke all on function public.umbral_aprobacion()                     from public, anon, authenticated;
revoke all on function public.vidas_por_intento()                     from public, anon, authenticated;
revoke all on function public.tope_intentos_invitado()                from public, anon, authenticated;
revoke all on function public.lecciones_publicadas_de(text)           from public, anon, authenticated;
revoke all on function public.leccion_completada_por(uuid, text)      from public, anon, authenticated;
revoke all on function public.leccion_aprobada_por(uuid, text)        from public, anon, authenticated;
revoke all on function public.unidad_completada_por(uuid, text)       from public, anon, authenticated;
revoke all on function public.leccion_disponible_para(uuid, text)     from public, anon, authenticated;
revoke all on function public.resumen_intento(public.intentos)        from public, anon, authenticated;
revoke all on function public.intento_propio(uuid, boolean)           from public, anon, authenticated;
revoke all on function public.exigir_sesion()                         from public, anon, authenticated;

revoke all on function public.iniciar_intento(uuid, text)             from public, anon;
revoke all on function public.responder_actividad(uuid, text, text)   from public, anon;
revoke all on function public.abandonar_intento(uuid)                 from public, anon;
grant execute on function public.iniciar_intento(uuid, text)           to authenticated;
grant execute on function public.responder_actividad(uuid, text, text) to authenticated;
grant execute on function public.abandonar_intento(uuid)               to authenticated;

commit;
