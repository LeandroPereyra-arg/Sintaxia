-- ===========================================================================
--  Sintaxia - Funciones del servidor para la competencia
--  Etapa 6
-- ---------------------------------------------------------------------------
--  El cliente no tiene permiso de escritura sobre partidas ni respuestas
--  (13-politicas). Todo pasa por estas funciones:
--
--    iniciar_partida(id, desafio)          crea la partida, fija sus preguntas
--                                          y copia las reglas del desafio
--    obtener_partida(id)                   la partida con sus preguntas (sin
--                                          soluciones) y el tiempo que queda
--    responder_partida(id, pregunta,       corrige, guarda y suma puntos
--                      opcion)
--    finalizar_partida(id)                 la cierra (repetirlo no cambia nada)
--
--  REGLAS (detalle en docs/16-competencia.md):
--    · Puntaje: puntos_por_acierto por cada respuesta correcta. No hay puntos
--      negativos. El maximo es preguntas x puntos.
--    · Tiempo: lo mide el SERVIDOR. Empieza cuando crea la partida y vence en
--      iniciada_en + duracion. El reloj del celular no interviene.
--    · Reconexion: si se corta la conexion la partida sigue corriendo; se puede
--      retomar (obtener_partida) mientras no haya vencido. Se aceptan respuestas
--      hasta vence_en + gracia_segundos (para las que salieron a tiempo y la red
--      demoro).
--    · Cierre: la partida queda 'finalizada' al responder todas o al apretar
--      Terminar antes de que venza. Si vence sin cerrarse queda 'vencida':
--      conserva lo respondido pero NO entra al ranking (partida incompleta).
--    · Intentos: cada desafio permite intentos_permitidos partidas por persona,
--      vencidas incluidas. En el ranking cuenta la MEJOR partida valida, nunca
--      la suma: repetir puede mejorar el puesto, no acumular puntos.
--    · Desempate: mas puntaje; a igual puntaje, menos tiempo (duracion_ms); a
--      igual puntaje y tiempo, comparten el puesto.
--    · Durante la competencia la respuesta dice si acerto, pero NO cual era la
--      correcta ni la explicacion: asi no se pasan las soluciones a los que
--      juegan despues.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Resumen de una partida (igual para todas las funciones)
-- ---------------------------------------------------------------------------
create or replace function public.resumen_partida(p public.partidas)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id',                 p.id,
    'desafio_id',         p.desafio_id,
    'evento_id',          p.evento_id,
    'numero',             p.numero,
    'estado',             p.estado,
    'valida',             p.estado = 'finalizada',
    'total_preguntas',    p.total_preguntas,
    'respondidas',        p.aciertos + p.errores,
    'aciertos',           p.aciertos,
    'errores',            p.errores,
    'puntaje',            p.puntaje,
    'puntaje_maximo',     p.total_preguntas * p.puntos_por_acierto,
    'puntos_por_acierto', p.puntos_por_acierto,
    'duracion_segundos',  p.duracion_segundos,
    'iniciada_en',        p.iniciada_en,
    'vence_en',           p.vence_en,
    'finalizada_en',      p.finalizada_en,
    'duracion_ms',        p.duracion_ms,
    'ahora',              now(),
    'segundos_restantes', case when p.estado = 'en_curso'
                               then greatest(0, ceil(extract(epoch from (p.vence_en - now()))))::integer
                               else 0 end
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Partidas que vencieron sin cerrarse
--    No hace falta una tarea programada: cada funcion cierra las vencidas de
--    la persona antes de seguir, y el ranking solo mira partidas finalizadas.
-- ---------------------------------------------------------------------------
create or replace function public.vencer_partidas(p_usuario uuid)
returns void
language sql
set search_path = public
as $$
  update public.partidas
     set estado = 'vencida',
         finalizada_en = vence_en,
         duracion_ms = duracion_segundos * 1000
   where usuario_id = p_usuario
     and estado = 'en_curso'
     and now() > vence_en + make_interval(secs => gracia_segundos);
$$;

-- Devuelve la partida si es de la persona; si no, error (una ajena responde
-- igual que una inexistente: no se revela que existe).
create or replace function public.partida_propia(p_partida_id uuid, p_bloquear boolean default false)
returns public.partidas
language plpgsql
set search_path = public
as $$
declare
  v public.partidas;
begin
  if p_bloquear then
    select * into v from public.partidas where id = p_partida_id for update;
  else
    select * into v from public.partidas where id = p_partida_id;
  end if;
  if v.id is null or v.usuario_id is distinct from auth.uid() then
    raise exception 'Esa partida no existe.' using errcode = 'P0002', hint = 'partida_no_encontrada';
  end if;
  return v;
end;
$$;

-- La partida con sus preguntas asignadas, sin soluciones.
create or replace function public.partida_completa(p_partida_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select public.resumen_partida(p) || jsonb_build_object(
    'preguntas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',        q.id,
               'orden',     pp.orden,
               'enunciado', q.enunciado,
               'codigo',    q.codigo,
               'opciones',  (select jsonb_agg(jsonb_build_object('id', o.id, 'texto', o.texto) order by o.orden)
                               from public.opciones_desafio o where o.pregunta_id = q.id),
               'respuesta', (select jsonb_build_object('opcion_id', r.opcion_id, 'correcta', r.es_correcta, 'puntos', r.puntos)
                               from public.partida_respuestas r
                              where r.partida_id = pp.partida_id and r.pregunta_id = q.id)
             ) order by pp.orden)
        from public.partida_preguntas pp
        join public.preguntas_desafio q on q.id = pp.pregunta_id
       where pp.partida_id = p.id
    ), '[]'::jsonb)
  )
  from public.partidas p
  where p.id = p_partida_id;
$$;

-- Mejor partida valida de una persona en un desafio: la regla del ranking.
create or replace function public.mejor_partida(p_usuario uuid, p_desafio_id text)
returns public.partidas
language sql
stable
set search_path = public
as $$
  select *
    from public.partidas
   where usuario_id = p_usuario
     and desafio_id = p_desafio_id
     and estado = 'finalizada'
   order by puntaje desc, duracion_ms asc, finalizada_en asc
   limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 3. iniciar_partida
-- ---------------------------------------------------------------------------
create or replace function public.iniciar_partida(p_partida_id uuid, p_desafio_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario   uuid := public.exigir_sesion();
  v_partida   public.partidas;
  v_desafio   public.desafios;
  v_evento    public.eventos;
  v_usadas    integer;
  v_total     integer;
begin
  if p_partida_id is null or p_desafio_id is null then
    raise exception 'Faltan datos: hay que indicar la partida y el desafio.'
      using errcode = '22023', hint = 'datos_incompletos';
  end if;

  -- Las peticiones de una persona se atienden de a una (dos pestanas, reintentos).
  perform pg_advisory_xact_lock(hashtextextended('partidas:' || v_usuario::text, 0));

  -- Peticion repetida: el mismo id devuelve la misma partida.
  select * into v_partida from public.partidas where id = p_partida_id;
  if v_partida.id is not null then
    if v_partida.usuario_id <> v_usuario then
      raise exception 'Ese identificador de partida no se puede usar.'
        using errcode = '23505', hint = 'partida_no_disponible';
    end if;
    if v_partida.desafio_id <> p_desafio_id then
      raise exception 'Esa partida es de otro desafio.' using errcode = '22023', hint = 'partida_de_otro_desafio';
    end if;
    perform public.vencer_partidas(v_usuario);
    return public.partida_completa(p_partida_id) || jsonb_build_object('repetida', true, 'retomada', false);
  end if;

  perform public.vencer_partidas(v_usuario);

  select * into v_desafio from public.desafios where id = p_desafio_id;
  select * into v_evento  from public.eventos  where id = v_desafio.evento_id;

  if v_desafio.id is null or v_desafio.estado <> 'publicado' then
    raise exception 'Ese desafio no esta disponible.' using errcode = 'P0001', hint = 'desafio_no_disponible';
  end if;
  if v_evento.estado <> 'abierto'
     or (v_evento.abre_en is not null and now() < v_evento.abre_en)
     or (v_evento.cierra_en is not null and now() > v_evento.cierra_en) then
    raise exception 'El evento "%" no esta abierto para jugar.', v_evento.nombre
      using errcode = 'P0001', hint = 'evento_cerrado';
  end if;

  -- Si ya tiene una partida en curso de este desafio, se retoma esa (reconexion).
  select * into v_partida from public.partidas
   where usuario_id = v_usuario and desafio_id = p_desafio_id and estado = 'en_curso';
  if v_partida.id is not null then
    return public.partida_completa(v_partida.id) || jsonb_build_object('repetida', false, 'retomada', true);
  end if;

  select count(*) into v_usadas from public.partidas
   where usuario_id = v_usuario and desafio_id = p_desafio_id;
  if v_usadas >= v_desafio.intentos_permitidos then
    raise exception 'Ya usaste los % intentos de este desafio.', v_desafio.intentos_permitidos
      using errcode = 'P0001', hint = 'sin_intentos';
  end if;

  select count(*) into v_total from public.preguntas_desafio
   where desafio_id = p_desafio_id and estado = 'publicada';
  if v_total = 0 then
    raise exception 'El desafio no tiene preguntas.' using errcode = 'P0001', hint = 'sin_preguntas';
  end if;

  -- Desde la primera partida el desafio queda congelado: sus reglas y su banco
  -- ya no se pueden editar (disparador de 11-competencia.sql), para que las
  -- partidas sigan siendo comparables.
  update public.desafios set congelado_en = now() where id = p_desafio_id and congelado_en is null;

  insert into public.partidas (
    id, usuario_id, desafio_id, evento_id, numero,
    version_desafio, puntos_por_acierto, duracion_segundos, gracia_segundos,
    total_preguntas, iniciada_en, vence_en
  ) values (
    p_partida_id, v_usuario, p_desafio_id, v_desafio.evento_id, v_usadas + 1,
    v_desafio.version, v_desafio.puntos_por_acierto, v_desafio.duracion_segundos, v_desafio.gracia_segundos,
    least(v_total, 100), now(), now() + make_interval(secs => v_desafio.duracion_segundos)
  );

  -- Todas las preguntas publicadas del desafio, en un orden al azar para esta
  -- partida (las mismas preguntas para todos: los resultados son comparables).
  insert into public.partida_preguntas (partida_id, pregunta_id, orden)
  select p_partida_id, q.id, row_number() over (order by random())
    from public.preguntas_desafio q
   where q.desafio_id = p_desafio_id and q.estado = 'publicada'
   limit 100;

  return public.partida_completa(p_partida_id) || jsonb_build_object('repetida', false, 'retomada', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. obtener_partida: para retomar (recargar, reconectar, otro dispositivo)
-- ---------------------------------------------------------------------------
create or replace function public.obtener_partida(p_partida_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario uuid := public.exigir_sesion();
begin
  perform public.partida_propia(p_partida_id);
  perform public.vencer_partidas(v_usuario);
  return public.partida_completa(p_partida_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. responder_partida
-- ---------------------------------------------------------------------------
create or replace function public.responder_partida(
  p_partida_id  uuid,
  p_pregunta_id text,
  p_opcion_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario   uuid := public.exigir_sesion();
  v_partida   public.partidas;
  v_respuesta public.partida_respuestas;
  v_correcta  boolean;
  v_aciertos  integer;
  v_errores   integer;
  v_repetida  boolean := false;
begin
  if p_partida_id is null or p_pregunta_id is null or p_opcion_id is null then
    raise exception 'Faltan datos: partida, pregunta y opcion.' using errcode = '22023', hint = 'datos_incompletos';
  end if;

  -- Bloquea la partida: dos envios simultaneos se atienden de a uno.
  v_partida := public.partida_propia(p_partida_id, true);

  select * into v_respuesta from public.partida_respuestas
   where partida_id = p_partida_id and pregunta_id = p_pregunta_id;

  if v_respuesta.partida_id is not null then
    -- Envio repetido: se devuelve lo que ya estaba, sin volver a sumar.
    v_repetida := true;
  else
    if v_partida.estado <> 'en_curso' then
      raise exception 'Esta partida ya termino.' using errcode = 'P0001', hint = 'partida_cerrada';
    end if;
    if now() > v_partida.vence_en + make_interval(secs => v_partida.gracia_segundos) then
      raise exception 'Se termino el tiempo de esta partida.' using errcode = 'P0001', hint = 'partida_vencida';
    end if;
    if not exists (select 1 from public.partida_preguntas
                    where partida_id = p_partida_id and pregunta_id = p_pregunta_id) then
      raise exception 'Esa pregunta no es de esta partida.' using errcode = 'P0002', hint = 'pregunta_ajena';
    end if;

    select es_correcta into v_correcta from public.opciones_desafio
     where id = p_opcion_id and pregunta_id = p_pregunta_id;
    if v_correcta is null then
      raise exception 'Esa opcion no pertenece a la pregunta.' using errcode = 'P0002', hint = 'opcion_no_encontrada';
    end if;

    insert into public.partida_respuestas (partida_id, pregunta_id, opcion_id, es_correcta, puntos)
    values (p_partida_id, p_pregunta_id, p_opcion_id, v_correcta,
            case when v_correcta then v_partida.puntos_por_acierto else 0 end)
    returning * into v_respuesta;

    -- El resultado sale de contar lo guardado.
    select count(*) filter (where es_correcta), count(*) filter (where not es_correcta)
      into v_aciertos, v_errores
      from public.partida_respuestas where partida_id = p_partida_id;

    update public.partidas
       set aciertos = v_aciertos,
           errores = v_errores,
           puntaje = v_aciertos * puntos_por_acierto,
           estado = case when v_aciertos + v_errores >= total_preguntas then 'finalizada' else 'en_curso' end,
           finalizada_en = case when v_aciertos + v_errores >= total_preguntas then now() end,
           duracion_ms = case when v_aciertos + v_errores >= total_preguntas
                              then least(duracion_segundos * 1000,
                                         (extract(epoch from (now() - iniciada_en)) * 1000)::integer)
                         end
     where id = p_partida_id
    returning * into v_partida;
  end if;

  return jsonb_build_object(
    'pregunta_id', v_respuesta.pregunta_id,
    'opcion_id',   v_respuesta.opcion_id,
    'correcta',    v_respuesta.es_correcta,
    'puntos',      v_respuesta.puntos,
    'repetida',    v_repetida,
    'partida',     public.resumen_partida(v_partida)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. finalizar_partida
--    Cierre explicito ("Terminar"). Repetirlo devuelve el resultado ya guardado.
-- ---------------------------------------------------------------------------
create or replace function public.finalizar_partida(p_partida_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_partida  public.partidas;
  v_repetida boolean := false;
begin
  perform public.exigir_sesion();
  v_partida := public.partida_propia(p_partida_id, true);

  if v_partida.estado <> 'en_curso' then
    v_repetida := true;
  elsif now() > v_partida.vence_en + make_interval(secs => v_partida.gracia_segundos) then
    update public.partidas
       set estado = 'vencida', finalizada_en = vence_en, duracion_ms = duracion_segundos * 1000
     where id = p_partida_id
    returning * into v_partida;
  else
    update public.partidas
       set estado = 'finalizada',
           finalizada_en = now(),
           duracion_ms = least(duracion_segundos * 1000,
                               (extract(epoch from (now() - iniciada_en)) * 1000)::integer)
     where id = p_partida_id
    returning * into v_partida;
  end if;

  return public.resumen_partida(v_partida) || jsonb_build_object('repetida', v_repetida);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Permisos de ejecucion
-- ---------------------------------------------------------------------------
revoke all on function public.resumen_partida(public.partidas)       from public, anon, authenticated;
revoke all on function public.vencer_partidas(uuid)                  from public, anon, authenticated;
revoke all on function public.partida_propia(uuid, boolean)          from public, anon, authenticated;
revoke all on function public.partida_completa(uuid)                 from public, anon, authenticated;
revoke all on function public.mejor_partida(uuid, text)              from public, anon, authenticated;

revoke all on function public.iniciar_partida(uuid, text)            from public, anon;
revoke all on function public.obtener_partida(uuid)                  from public, anon;
revoke all on function public.responder_partida(uuid, text, text)    from public, anon;
revoke all on function public.finalizar_partida(uuid)                from public, anon;
grant execute on function public.iniciar_partida(uuid, text)          to authenticated;
grant execute on function public.obtener_partida(uuid)                to authenticated;
grant execute on function public.responder_partida(uuid, text, text)  to authenticated;
grant execute on function public.finalizar_partida(uuid)              to authenticated;

commit;
