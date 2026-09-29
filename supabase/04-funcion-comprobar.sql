-- ===========================================================================
--  Sintaxia - Funcion de comprobacion de respuestas
--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)
-- ---------------------------------------------------------------------------
--  La aplicacion NO se descarga las soluciones: cuando el estudiante elige una
--  opcion le manda a esta funcion el identificador de la pregunta y el de la
--  opcion, y recibe de vuelta si acerto y la explicacion.
--
--  La funcion:
--    1. comprueba que la pregunta existe y esta disponible,
--    2. verifica que la opcion pertenece a esa pregunta,
--    3. compara la seleccion con la solucion guardada,
--    4. devuelve si la respuesta es correcta y su explicacion.
--
--  Se declara SECURITY DEFINER: corre con los permisos de quien la creo, que
--  si puede leer es_correcta y explicacion. El rol anon solo puede EJECUTARLA,
--  nunca leer esas columnas (ver 03-politicas-rls.sql).
--
--  Esta funcion es para el MODO PRACTICA. La validacion de partidas y los
--  puntajes oficiales de la competencia corresponden a una etapa posterior.
-- ===========================================================================

begin;

drop function if exists public.comprobar_respuesta(text, text);

create function public.comprobar_respuesta(
  p_pregunta_id text,
  p_opcion_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_disponible  boolean;
  v_explicacion text;
  v_correcta    boolean;
  v_correcta_id text;
  v_correcta_tx text;
begin
  if p_pregunta_id is null or p_opcion_id is null then
    raise exception 'Faltan datos: hay que indicar la pregunta y la opcion elegida.'
      using errcode = '22023';
  end if;

  -- 1. La pregunta tiene que existir y estar disponible, con toda su cadena
  --    de contenidos publicada (misma condicion que usan las politicas de RLS).
  select true, p.explicacion
    into v_disponible, v_explicacion
    from public.preguntas p
    join public.lecciones l on l.id = p.leccion_id
    join public.unidades  u on u.id = l.unidad_id
    join public.cursos    c on c.id = u.curso_id
   where p.id = p_pregunta_id
     and p.estado = 'publicada'
     and l.estado = 'publicada'
     and u.estado = 'publicada'
     and c.estado <> 'borrador';

  if not coalesce(v_disponible, false) then
    raise exception 'La pregunta "%" no existe o no esta disponible.', p_pregunta_id
      using errcode = 'P0002';
  end if;

  -- 2. La opcion elegida tiene que pertenecer a esa pregunta.
  select o.es_correcta
    into v_correcta
    from public.opciones o
   where o.id = p_opcion_id
     and o.pregunta_id = p_pregunta_id;

  if v_correcta is null then
    raise exception 'La opcion "%" no pertenece a la pregunta "%".', p_opcion_id, p_pregunta_id
      using errcode = 'P0002';
  end if;

  -- 3. Solo cuando la respuesta es incorrecta se devuelve cual era la correcta,
  --    que es lo que la pantalla necesita para mostrar la devolucion.
  if not v_correcta then
    select o.id, o.texto
      into v_correcta_id, v_correcta_tx
      from public.opciones o
     where o.pregunta_id = p_pregunta_id
       and o.es_correcta;
  end if;

  -- 4. Respuesta.
  return jsonb_build_object(
    'pregunta_id',          p_pregunta_id,
    'opcion_id',            p_opcion_id,
    'correcta',             v_correcta,
    'explicacion',          v_explicacion,
    'opcion_correcta_id',   v_correcta_id,
    'opcion_correcta_texto', v_correcta_tx
  );
end;
$$;

comment on function public.comprobar_respuesta(text, text) is
  'Modo practica: recibe una pregunta y la opcion elegida, y devuelve si es correcta con su explicacion. Es el unico camino por el que el cliente accede a las soluciones.';

-- Solo se puede ejecutar; nadie mas la puede redefinir.
revoke all on function public.comprobar_respuesta(text, text) from public;
grant execute on function public.comprobar_respuesta(text, text) to anon, authenticated;

commit;
