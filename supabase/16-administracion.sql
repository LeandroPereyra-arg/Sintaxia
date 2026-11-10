-- ===========================================================================
--  Sintaxia - Administracion de contenidos y eventos
--  Etapa 7 - Panel de administracion
-- ---------------------------------------------------------------------------
--  QUIEN ES ADMINISTRADOR
--    Una fila en public.administradores. Esa tabla no tiene ningun permiso
--    para el cliente: un usuario comun no puede darse el rol cambiando su
--    perfil ni escribiendo en la tabla. Solo se otorga desde el servidor:
--
--      select public.otorgar_administrador('docente@escuela.edu.ar');   -- SQL Editor
--
--    otorgar_administrador / quitar_administrador solo las puede ejecutar
--    service_role (el SQL Editor del panel de Supabase corre como postgres,
--    que tambien puede). Un invitado nunca es administrador.
--
--  QUE PUEDE HACER
--    · Ver todo el contenido, incluidos los borradores (politicas de lectura).
--    · Crear, modificar, publicar y despublicar cursos, unidades, lecciones,
--      preguntas y opciones; y eliminar SOLO lo que no tiene historial.
--    · Ver y cambiar soluciones y explicaciones, unicamente con las funciones
--      admin_* de abajo. La lectura publica de soluciones NO se abre: el rol
--      authenticated sigue sin permiso sobre preguntas.explicacion ni
--      opciones.es_correcta.
--    · Gestionar eventos y desafios: prepararlos, abrir y cerrar el evento,
--      editar un desafio mientras no tenga partidas y crear otra version
--      cuando ya las tiene.
--
--  Todas las funciones admin_* verifican es_admin() en el servidor. Ocultar el
--  boton en la app es solo comodidad: el permiso real esta aca.
--
--  Se ejecuta despues de 01 a 15. No borra datos y se puede volver a correr.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. ADMINISTRADORES
-- ---------------------------------------------------------------------------
create table if not exists public.administradores (
  usuario_id   uuid        primary key references public.perfiles (id) on delete cascade,
  otorgado_por text        not null default current_user,
  otorgado_en  timestamptz not null default now()
);

comment on table public.administradores is 'Quien administra contenidos y eventos. Sin permisos para el cliente: se otorga con otorgar_administrador().';

alter table public.administradores enable row level security;
revoke all on public.administradores from anon, authenticated;

-- La sesion actual es de un administrador? (cuenta permanente con fila en la tabla)
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administradores a
      join public.perfiles p on p.id = a.usuario_id
     where a.usuario_id = (select auth.uid())
       and not p.es_invitado
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

create or replace function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Esta operacion es solo para administradores.' using errcode = '42501', hint = 'sin_permiso_admin';
  end if;
end;
$$;

revoke all on function public.exigir_admin() from public, anon, authenticated;

-- Otorgar y quitar el rol: solo desde el servidor (service_role o el SQL Editor).
create or replace function public.otorgar_administrador(p_correo text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  select u.id into v_id from auth.users u
   where lower(u.email) = lower(btrim(p_correo)) and not coalesce(u.is_anonymous, false);
  if v_id is null then
    raise exception 'No hay una cuenta confirmada con el correo %.', p_correo using errcode = 'P0002';
  end if;
  insert into public.administradores (usuario_id) values (v_id) on conflict (usuario_id) do nothing;
  return v_id;
end;
$$;

create or replace function public.quitar_administrador(p_correo text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_borradas integer;
begin
  delete from public.administradores a using auth.users u
   where a.usuario_id = u.id and lower(u.email) = lower(btrim(p_correo));
  get diagnostics v_borradas = row_count;
  return v_borradas > 0;
end;
$$;

revoke all on function public.otorgar_administrador(text) from public, anon, authenticated;
revoke all on function public.quitar_administrador(text)  from public, anon, authenticated;
grant execute on function public.otorgar_administrador(text) to service_role;
grant execute on function public.quitar_administrador(text)  to service_role;

-- ---------------------------------------------------------------------------
-- 2. Reglas de contenido que valen para todos (tambien para el panel)
-- ---------------------------------------------------------------------------

-- Las validaciones diferidas (opciones validas, leccion completa) se ejecutan
-- al confirmar la transaccion, ya FUERA de la funcion admin que hizo el cambio:
-- corren con el rol de quien la llamo, que no puede leer las soluciones. Por eso
-- se declaran SECURITY DEFINER (solo leen para validar; no abren ningun permiso).
alter function public.fn_validar_opciones()         security definer;
alter function public.fn_validar_opciones()         set search_path = public;
alter function public.fn_validar_opciones_desafio() security definer;
alter function public.fn_validar_opciones_desafio() set search_path = public;
alter function public.fn_desafio_congelado()        security definer;
alter function public.fn_desafio_congelado()        set search_path = public;

-- Opciones distintas dentro de una pregunta (sin importar mayusculas ni espacios).
create unique index if not exists uq_opciones_texto
  on public.opciones (pregunta_id, lower(btrim(texto)));

-- Una leccion publicada necesita al menos una actividad publicada (y cada
-- actividad publicada ya exige dos opciones y una sola correcta: 01-esquema).
create or replace function public.fn_validar_leccion_completa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leccion_id text;
  v_estado     text;
begin
  -- (Con IF y no con CASE: PL/pgSQL no deja nombrar new.leccion_id cuando el
  -- disparador es de lecciones, aunque esa rama no se use.)
  if tg_table_name = 'lecciones' then
    v_leccion_id := coalesce(new.id, old.id);
  elsif tg_op = 'DELETE' then
    v_leccion_id := old.leccion_id;
  else
    v_leccion_id := new.leccion_id;
  end if;
  select estado into v_estado from public.lecciones where id = v_leccion_id;
  if not found or v_estado <> 'publicada' then
    return null;
  end if;
  if not exists (select 1 from public.preguntas where leccion_id = v_leccion_id and estado = 'publicada') then
    raise exception 'La leccion "%" no se puede publicar sin al menos una actividad publicada.', v_leccion_id
      using errcode = 'check_violation', hint = 'leccion_incompleta';
  end if;
  return null;
end;
$$;

drop trigger if exists tg_lecciones_completas on public.lecciones;
create constraint trigger tg_lecciones_completas
  after insert or update on public.lecciones
  deferrable initially deferred
  for each row execute function public.fn_validar_leccion_completa();

drop trigger if exists tg_preguntas_leccion_completa on public.preguntas;
create constraint trigger tg_preguntas_leccion_completa
  after update or delete on public.preguntas
  deferrable initially deferred
  for each row execute function public.fn_validar_leccion_completa();

-- ---------------------------------------------------------------------------
-- 3. Lectura para administradores (incluye borradores, NO soluciones)
--    Politicas adicionales: se suman a las publicas de 03 y 13.
-- ---------------------------------------------------------------------------
drop policy if exists "admin: ver cursos"    on public.cursos;
drop policy if exists "admin: ver unidades"  on public.unidades;
drop policy if exists "admin: ver lecciones" on public.lecciones;
drop policy if exists "admin: ver preguntas" on public.preguntas;
drop policy if exists "admin: ver opciones"  on public.opciones;
drop policy if exists "admin: ver eventos"   on public.eventos;
drop policy if exists "admin: ver desafios"  on public.desafios;

create policy "admin: ver cursos"    on public.cursos    for select to authenticated using (public.es_admin());
create policy "admin: ver unidades"  on public.unidades  for select to authenticated using (public.es_admin());
create policy "admin: ver lecciones" on public.lecciones for select to authenticated using (public.es_admin());
create policy "admin: ver preguntas" on public.preguntas for select to authenticated using (public.es_admin());
create policy "admin: ver opciones"  on public.opciones  for select to authenticated using (public.es_admin());
create policy "admin: ver eventos"   on public.eventos   for select to authenticated using (public.es_admin());
create policy "admin: ver desafios"  on public.desafios  for select to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------------
-- 4. Ayudas para validar opciones (las usan las dos funciones de preguntas)
-- ---------------------------------------------------------------------------
create or replace function public.validar_opciones_admin(p_opciones jsonb)
returns void
language plpgsql
immutable
as $$
declare
  v_total     integer := jsonb_array_length(coalesce(p_opciones, '[]'::jsonb));
  v_correctas integer;
  v_distintas integer;
  v_vacias    integer;
begin
  select count(*) filter (where coalesce((o ->> 'es_correcta')::boolean, false)),
         count(distinct lower(btrim(o ->> 'texto'))),
         count(*) filter (where coalesce(btrim(o ->> 'texto'), '') = '')
    into v_correctas, v_distintas, v_vacias
    from jsonb_array_elements(coalesce(p_opciones, '[]'::jsonb)) o;

  if v_total < 2 then
    raise exception 'Una pregunta necesita al menos dos opciones.' using errcode = 'check_violation', hint = 'pocas_opciones';
  end if;
  if v_vacias > 0 then
    raise exception 'Hay una opcion sin texto.' using errcode = 'check_violation', hint = 'opcion_vacia';
  end if;
  if v_distintas < v_total then
    raise exception 'Hay opciones repetidas.' using errcode = 'check_violation', hint = 'opciones_repetidas';
  end if;
  if v_correctas <> 1 then
    raise exception 'Tiene que haber exactamente una opcion correcta (hay %).', v_correctas
      using errcode = 'check_violation', hint = 'una_correcta';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Funciones de administracion: CONTENIDO
--    Reciben un objeto JSON con los campos. Crean o actualizan por id.
-- ---------------------------------------------------------------------------
create or replace function public.admin_guardar_curso(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  insert into public.cursos (id, nombre, descripcion, nivel, icono, color, color_texto, estado, requisito,
                             horas_estimadas, etiquetas, orden)
  values (p ->> 'id', p ->> 'nombre', p ->> 'descripcion', coalesce(p ->> 'nivel', 'Principiante'),
          coalesce(p ->> 'icono', 'JS'), coalesce(p ->> 'color', '#2fbf56'), coalesce(p ->> 'color_texto', '#ffffff'),
          coalesce(p ->> 'estado', 'borrador'), nullif(p ->> 'requisito', ''),
          nullif(p ->> 'horas_estimadas', '')::smallint,
          coalesce(array(select jsonb_array_elements_text(p -> 'etiquetas')), '{}'),
          (p ->> 'orden')::smallint)
  on conflict (id) do update set
    nombre = excluded.nombre, descripcion = excluded.descripcion, nivel = excluded.nivel,
    icono = excluded.icono, color = excluded.color, color_texto = excluded.color_texto,
    estado = excluded.estado, requisito = excluded.requisito, horas_estimadas = excluded.horas_estimadas,
    etiquetas = excluded.etiquetas, orden = excluded.orden;
  return (select to_jsonb(c) from public.cursos c where c.id = p ->> 'id');
end;
$$;

create or replace function public.admin_guardar_unidad(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  insert into public.unidades (id, curso_id, orden, titulo, descripcion, icono, color, estado, temas)
  values (p ->> 'id', p ->> 'curso_id', (p ->> 'orden')::smallint, p ->> 'titulo', p ->> 'descripcion',
          coalesce(p ->> 'icono', 'cohete'), coalesce(p ->> 'color', '#2fbf56'), coalesce(p ->> 'estado', 'borrador'),
          coalesce(array(select jsonb_array_elements_text(p -> 'temas')), '{}'))
  on conflict (id) do update set
    curso_id = excluded.curso_id, orden = excluded.orden, titulo = excluded.titulo,
    descripcion = excluded.descripcion, icono = excluded.icono, color = excluded.color,
    estado = excluded.estado, temas = excluded.temas;
  return (select to_jsonb(u) from public.unidades u where u.id = p ->> 'id');
end;
$$;

create or replace function public.admin_guardar_leccion(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  insert into public.lecciones (id, unidad_id, orden, titulo, descripcion, icono, xp, explicacion,
                                ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado)
  values (p ->> 'id', p ->> 'unidad_id', (p ->> 'orden')::smallint, p ->> 'titulo', p ->> 'descripcion',
          coalesce(p ->> 'icono', 'libro'), coalesce((p ->> 'xp')::smallint, 10), p ->> 'explicacion',
          nullif(p ->> 'ejemplo_titulo', ''), nullif(p ->> 'ejemplo_codigo', ''), nullif(p ->> 'ejemplo_nota', ''),
          coalesce(p ->> 'estado', 'borrador'))
  on conflict (id) do update set
    unidad_id = excluded.unidad_id, orden = excluded.orden, titulo = excluded.titulo,
    descripcion = excluded.descripcion, icono = excluded.icono, xp = excluded.xp,
    explicacion = excluded.explicacion, ejemplo_titulo = excluded.ejemplo_titulo,
    ejemplo_codigo = excluded.ejemplo_codigo, ejemplo_nota = excluded.ejemplo_nota, estado = excluded.estado;
  return (select to_jsonb(l) from public.lecciones l where l.id = p ->> 'id');
end;
$$;

-- Pregunta de practica con sus opciones y su solucion, en una sola operacion.
-- p = { id, leccion_id, orden, enunciado, codigo, explicacion, estado,
--       opciones: [{ id?, texto, es_correcta }] }
create or replace function public.admin_guardar_pregunta(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id   text := p ->> 'id';
  v_ids  text[];
  o      jsonb;
  i      integer := 0;
begin
  perform public.exigir_admin();
  perform public.validar_opciones_admin(p -> 'opciones');

  insert into public.preguntas (id, leccion_id, orden, tipo, enunciado, codigo, explicacion, estado)
  values (v_id, p ->> 'leccion_id', (p ->> 'orden')::smallint, 'opcion-multiple', p ->> 'enunciado',
          nullif(p ->> 'codigo', ''), p ->> 'explicacion', coalesce(p ->> 'estado', 'borrador'))
  on conflict (id) do update set
    leccion_id = excluded.leccion_id, orden = excluded.orden, enunciado = excluded.enunciado,
    codigo = excluded.codigo, explicacion = excluded.explicacion, estado = excluded.estado;

  -- Ids de las opciones: los que vienen, o pregunta-a, pregunta-b...
  select array_agg(coalesce(nullif(e ->> 'id', ''), v_id || '-' || chr(96 + n::integer)) order by n)
    into v_ids
    from jsonb_array_elements(p -> 'opciones') with ordinality as t(e, n);

  -- Las opciones que ya no estan se borran (si tienen respuestas en el historial,
  -- la base lo impide: hay que despublicar la pregunta y crear otra).
  delete from public.opciones where pregunta_id = v_id and not (id = any(v_ids));

  -- Primero se liberan orden y texto, para poder reordenar sin chocar con las restricciones.
  update public.opciones set orden = orden + 100, es_correcta = false, texto = '~' || id
   where pregunta_id = v_id;

  for o in select * from jsonb_array_elements(p -> 'opciones') loop
    i := i + 1;
    insert into public.opciones (id, pregunta_id, orden, texto, es_correcta)
    values (v_ids[i], v_id, i, btrim(o ->> 'texto'), coalesce((o ->> 'es_correcta')::boolean, false))
    on conflict (id) do update set
      pregunta_id = excluded.pregunta_id, orden = excluded.orden, texto = excluded.texto, es_correcta = excluded.es_correcta;
  end loop;

  set constraints all immediate;
  return public.admin_obtener_pregunta(v_id);
end;
$$;

-- La pregunta con su solucion: solo para administradores.
create or replace function public.admin_obtener_pregunta(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  return (
    select to_jsonb(q) || jsonb_build_object('opciones', coalesce((
             select jsonb_agg(jsonb_build_object('id', o.id, 'texto', o.texto, 'es_correcta', o.es_correcta) order by o.orden)
               from public.opciones o where o.pregunta_id = q.id), '[]'::jsonb))
      from public.preguntas q where q.id = p_id
  );
end;
$$;

-- Publicar o despublicar. Para contenido, despublicar es preferible a borrar.
create or replace function public.admin_cambiar_estado(p_tipo text, p_id text, p_estado text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_filas integer;
begin
  perform public.exigir_admin();
  case p_tipo
    when 'curso'    then update public.cursos    set estado = p_estado where id = p_id;
    when 'unidad'   then update public.unidades  set estado = p_estado where id = p_id;
    when 'leccion'  then update public.lecciones set estado = p_estado where id = p_id;
    when 'pregunta' then update public.preguntas set estado = p_estado where id = p_id;
    else raise exception 'Tipo desconocido: %', p_tipo using errcode = '22023', hint = 'tipo_desconocido';
  end case;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    raise exception 'No existe % "%".', p_tipo, p_id using errcode = 'P0002', hint = 'no_encontrado';
  end if;
  -- Las restricciones diferidas (leccion completa, opciones validas) se revisan
  -- aca y no recien al terminar la transaccion, para devolver el error a tiempo.
  set constraints all immediate;
  return jsonb_build_object('tipo', p_tipo, 'id', p_id, 'estado', p_estado);
end;
$$;

-- Eliminar: solo lo que no tiene historial y con confirmacion explicita (el id).
create or replace function public.admin_eliminar(p_tipo text, p_id text, p_confirmacion text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_filas integer;
begin
  perform public.exigir_admin();
  if p_confirmacion is distinct from p_id then
    raise exception 'Para eliminar hay que confirmar escribiendo el identificador.' using errcode = '22023', hint = 'falta_confirmacion';
  end if;
  begin
    case p_tipo
      when 'curso'             then delete from public.cursos            where id = p_id;
      when 'unidad'            then delete from public.unidades          where id = p_id;
      when 'leccion'           then delete from public.lecciones         where id = p_id;
      when 'pregunta'          then delete from public.preguntas         where id = p_id;
      when 'evento'            then delete from public.eventos           where id = p_id;
      when 'desafio'           then delete from public.desafios          where id = p_id;
      when 'pregunta_desafio'  then delete from public.preguntas_desafio where id = p_id;
      else raise exception 'Tipo desconocido: %', p_tipo using errcode = '22023', hint = 'tipo_desconocido';
    end case;
    get diagnostics v_filas = row_count;
    set constraints all immediate;
  exception
    when foreign_key_violation then
      raise exception 'No se puede eliminar: tiene historial (intentos o partidas). Despublicalo.'
        using errcode = '23503', hint = 'tiene_historial';
  end;
  return v_filas > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Funciones de administracion: EVENTOS Y DESAFIOS
-- ---------------------------------------------------------------------------
create or replace function public.admin_guardar_evento(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  insert into public.eventos (id, nombre, descripcion, lugar, estado, abre_en, cierra_en)
  values (p ->> 'id', p ->> 'nombre', coalesce(p ->> 'descripcion', ''), nullif(p ->> 'lugar', ''),
          coalesce(p ->> 'estado', 'preparacion'),
          nullif(p ->> 'abre_en', '')::timestamptz, nullif(p ->> 'cierra_en', '')::timestamptz)
  on conflict (id) do update set
    nombre = excluded.nombre, descripcion = excluded.descripcion, lugar = excluded.lugar,
    abre_en = excluded.abre_en, cierra_en = excluded.cierra_en;
  return (select to_jsonb(e) from public.eventos e where e.id = p ->> 'id');
end;
$$;

-- Preparar -> abrir -> cerrar. Al cerrar, las partidas que seguian en curso
-- quedan vencidas (incompletas: no entran al ranking).
create or replace function public.admin_cambiar_estado_evento(p_id text, p_estado text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vencidas integer := 0;
begin
  perform public.exigir_admin();
  update public.eventos set estado = p_estado where id = p_id;
  if not found then
    raise exception 'No existe el evento "%".', p_id using errcode = 'P0002', hint = 'no_encontrado';
  end if;
  if p_estado = 'cerrado' then
    update public.partidas
       set estado = 'vencida',
           finalizada_en = least(now(), vence_en),
           duracion_ms = least(duracion_segundos * 1000,
                               (extract(epoch from (least(now(), vence_en) - iniciada_en)) * 1000)::integer)
     where evento_id = p_id and estado = 'en_curso';
    get diagnostics v_vencidas = row_count;
  end if;
  return jsonb_build_object('id', p_id, 'estado', p_estado, 'partidas_cerradas', v_vencidas);
end;
$$;

create or replace function public.admin_guardar_desafio(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  -- Si el desafio ya tiene partidas, el disparador de congelamiento rechaza
  -- cambiar sus reglas (11-competencia.sql).
  insert into public.desafios (id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos,
                               puntos_por_acierto, intentos_permitidos, gracia_segundos, estado)
  values (p ->> 'id', p ->> 'evento_id', (p ->> 'orden')::smallint, p ->> 'nombre', coalesce(p ->> 'descripcion', ''),
          coalesce(p ->> 'dificultad', 'media'), coalesce((p ->> 'duracion_segundos')::integer, 120),
          coalesce((p ->> 'puntos_por_acierto')::integer, 100), coalesce((p ->> 'intentos_permitidos')::smallint, 3),
          coalesce((p ->> 'gracia_segundos')::smallint, 5), coalesce(p ->> 'estado', 'borrador'))
  on conflict (id) do update set
    orden = excluded.orden, nombre = excluded.nombre, descripcion = excluded.descripcion,
    dificultad = excluded.dificultad, duracion_segundos = excluded.duracion_segundos,
    puntos_por_acierto = excluded.puntos_por_acierto, intentos_permitidos = excluded.intentos_permitidos,
    gracia_segundos = excluded.gracia_segundos, estado = excluded.estado;
  return (select to_jsonb(d) from public.desafios d where d.id = p ->> 'id');
end;
$$;

-- Otra version de un desafio congelado: copia reglas y banco con ids nuevos, en
-- borrador y sin partidas. El original queda intacto con sus resultados.
create or replace function public.admin_nueva_version_desafio(p_id text, p_nuevo_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.desafios;
begin
  perform public.exigir_admin();
  select * into v from public.desafios where id = p_id;
  if v.id is null then
    raise exception 'No existe el desafio "%".', p_id using errcode = 'P0002', hint = 'no_encontrado';
  end if;

  insert into public.desafios (id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos,
                               puntos_por_acierto, intentos_permitidos, gracia_segundos, estado, version)
  values (p_nuevo_id, v.evento_id, (select max(orden) + 1 from public.desafios where evento_id = v.evento_id),
          v.nombre, v.descripcion, v.dificultad, v.duracion_segundos, v.puntos_por_acierto,
          v.intentos_permitidos, v.gracia_segundos, 'borrador', v.version + 1);

  insert into public.preguntas_desafio (id, desafio_id, orden, enunciado, codigo, explicacion, estado)
  select p_nuevo_id || '-' || q.orden, p_nuevo_id, q.orden, q.enunciado, q.codigo, q.explicacion, q.estado
    from public.preguntas_desafio q where q.desafio_id = p_id;

  insert into public.opciones_desafio (id, pregunta_id, orden, texto, es_correcta)
  select p_nuevo_id || '-' || q.orden || '-' || o.orden, p_nuevo_id || '-' || q.orden, o.orden, o.texto, o.es_correcta
    from public.opciones_desafio o join public.preguntas_desafio q on q.id = o.pregunta_id
   where q.desafio_id = p_id;

  set constraints all immediate;
  return (select to_jsonb(d) from public.desafios d where d.id = p_nuevo_id);
end;
$$;

-- Banco del desafio con soluciones (solo administradores).
create or replace function public.admin_listar_banco(p_desafio_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.exigir_admin();
  return coalesce((
    select jsonb_agg(to_jsonb(q) || jsonb_build_object('opciones', coalesce((
             select jsonb_agg(jsonb_build_object('id', o.id, 'texto', o.texto, 'es_correcta', o.es_correcta) order by o.orden)
               from public.opciones_desafio o where o.pregunta_id = q.id), '[]'::jsonb)) order by q.orden)
      from public.preguntas_desafio q where q.desafio_id = p_desafio_id
  ), '[]'::jsonb);
end;
$$;

-- Pregunta del banco de un desafio (rechazada si el desafio esta congelado).
create or replace function public.admin_guardar_pregunta_desafio(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id  text := p ->> 'id';
  v_ids text[];
  o     jsonb;
  i     integer := 0;
begin
  perform public.exigir_admin();
  perform public.validar_opciones_admin(p -> 'opciones');

  insert into public.preguntas_desafio (id, desafio_id, orden, enunciado, codigo, explicacion, estado)
  values (v_id, p ->> 'desafio_id', (p ->> 'orden')::smallint, p ->> 'enunciado', nullif(p ->> 'codigo', ''),
          p ->> 'explicacion', coalesce(p ->> 'estado', 'publicada'))
  on conflict (id) do update set
    orden = excluded.orden, enunciado = excluded.enunciado, codigo = excluded.codigo,
    explicacion = excluded.explicacion, estado = excluded.estado;

  select array_agg(coalesce(nullif(e ->> 'id', ''), v_id || '-' || chr(96 + n::integer)) order by n)
    into v_ids
    from jsonb_array_elements(p -> 'opciones') with ordinality as t(e, n);

  delete from public.opciones_desafio where pregunta_id = v_id and not (id = any(v_ids));
  update public.opciones_desafio set orden = orden + 100, es_correcta = false, texto = '~' || id
   where pregunta_id = v_id;
  for o in select * from jsonb_array_elements(p -> 'opciones') loop
    i := i + 1;
    insert into public.opciones_desafio (id, pregunta_id, orden, texto, es_correcta)
    values (v_ids[i], v_id, i, btrim(o ->> 'texto'), coalesce((o ->> 'es_correcta')::boolean, false))
    on conflict (id) do update set
      orden = excluded.orden, texto = excluded.texto, es_correcta = excluded.es_correcta;
  end loop;

  set constraints all immediate;
  return (select q from jsonb_array_elements(public.admin_listar_banco(p ->> 'desafio_id')) q where q ->> 'id' = v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Permisos de ejecucion: cualquiera con sesion puede LLAMARLAS, pero todas
--    empiezan con exigir_admin(). El publico ni siquiera puede llamarlas.
-- ---------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'admin_guardar_curso(jsonb)', 'admin_guardar_unidad(jsonb)', 'admin_guardar_leccion(jsonb)',
    'admin_guardar_pregunta(jsonb)', 'admin_obtener_pregunta(text)', 'admin_cambiar_estado(text, text, text)',
    'admin_eliminar(text, text, text)', 'admin_guardar_evento(jsonb)', 'admin_cambiar_estado_evento(text, text)',
    'admin_guardar_desafio(jsonb)', 'admin_nueva_version_desafio(text, text)', 'admin_listar_banco(text)',
    'admin_guardar_pregunta_desafio(jsonb)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

revoke all on function public.validar_opciones_admin(jsonb) from public, anon, authenticated;
revoke all on function public.fn_validar_opciones()          from public, anon, authenticated;
revoke all on function public.fn_validar_opciones_desafio()  from public, anon, authenticated;
revoke all on function public.fn_desafio_congelado()         from public, anon, authenticated;
revoke all on function public.fn_validar_leccion_completa()  from public, anon, authenticated;

commit;
