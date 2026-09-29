-- ===========================================================================
--  Sintaxia - Politicas de acceso (Row Level Security)
--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)
-- ---------------------------------------------------------------------------
--  Que tiene que pasar en esta etapa:
--
--    1. La aplicacion puede LEER el contenido publicado.
--    2. Un visitante NO puede crear, modificar ni borrar contenido.
--    3. Las soluciones (preguntas.explicacion y opciones.es_correcta) NO se
--       pueden consultar directamente desde el cliente. Se responden unicamente
--       a traves de la funcion public.comprobar_respuesta (04-funcion-comprobar.sql).
--
--  Se usan dos mecanismos que se complementan:
--
--    · RLS (politicas)  -> decide QUE FILAS ve cada rol.
--    · GRANT por columna -> decide QUE COLUMNAS puede leer cada rol.
--
--  RLS sola no alcanza para esconder las soluciones, porque filtra filas, no
--  columnas: la opcion correcta es una fila que el estudiante tiene que ver
--  (necesita su texto para elegirla). Por eso el permiso de lectura se otorga
--  columna por columna, dejando afuera es_correcta y explicacion.
--
--  La carga de contenido se hace desde el panel de Supabase, que trabaja con
--  el rol service_role: ese rol no pasa por RLS, asi que no necesita politicas.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Encender RLS. Sin politicas, el resultado por defecto es "nadie ve nada".
-- ---------------------------------------------------------------------------
alter table public.cursos    enable row level security;
alter table public.unidades  enable row level security;
alter table public.lecciones enable row level security;
alter table public.preguntas enable row level security;
alter table public.opciones  enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Permisos de tabla: se revoca todo y se devuelve SOLO lectura, y solo
--    sobre las columnas que no forman parte de la solucion.
--
--    Supabase otorga permisos amplios a anon y authenticated por defecto,
--    asi que este revoke es imprescindible.
-- ---------------------------------------------------------------------------
revoke all on public.cursos    from anon, authenticated;
revoke all on public.unidades  from anon, authenticated;
revoke all on public.lecciones from anon, authenticated;
revoke all on public.preguntas from anon, authenticated;
revoke all on public.opciones  from anon, authenticated;

grant select (
  id, nombre, descripcion, nivel, icono, color, color_texto, estado,
  requisito, horas_estimadas, unidades_previstas, lecciones_previstas,
  etiquetas, orden, actualizado_en
) on public.cursos to anon, authenticated;

grant select (
  id, curso_id, orden, titulo, descripcion, icono, color, estado, temas, actualizado_en
) on public.unidades to anon, authenticated;

grant select (
  id, unidad_id, orden, titulo, descripcion, icono, xp,
  explicacion, ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado, actualizado_en
) on public.lecciones to anon, authenticated;

-- OJO: preguntas.explicacion queda AFUERA a proposito. Es la solucion.
grant select (
  id, leccion_id, orden, tipo, enunciado, codigo, estado, actualizado_en
) on public.preguntas to anon, authenticated;

-- OJO: opciones.es_correcta y opciones.marca_correcta quedan AFUERA a proposito.
grant select (
  id, pregunta_id, orden, texto, actualizado_en
) on public.opciones to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Politicas de lectura: solo el contenido publicado, y solo si toda su
--    cadena de padres tambien esta publicada. Asi una leccion de una unidad
--    en borrador no se filtra por conocer su identificador.
-- ---------------------------------------------------------------------------
drop policy if exists "cursos visibles"    on public.cursos;
drop policy if exists "unidades visibles"  on public.unidades;
drop policy if exists "lecciones visibles" on public.lecciones;
drop policy if exists "preguntas visibles" on public.preguntas;
drop policy if exists "opciones visibles"  on public.opciones;

create policy "cursos visibles"
  on public.cursos
  for select
  to anon, authenticated
  using (estado <> 'borrador');

create policy "unidades visibles"
  on public.unidades
  for select
  to anon, authenticated
  using (
    estado <> 'borrador'
    and exists (
      select 1 from public.cursos c
       where c.id = unidades.curso_id
         and c.estado <> 'borrador'
    )
  );

create policy "lecciones visibles"
  on public.lecciones
  for select
  to anon, authenticated
  using (
    estado = 'publicada'
    and exists (
      select 1
        from public.unidades u
        join public.cursos   c on c.id = u.curso_id
       where u.id = lecciones.unidad_id
         and u.estado = 'publicada'
         and c.estado <> 'borrador'
    )
  );

create policy "preguntas visibles"
  on public.preguntas
  for select
  to anon, authenticated
  using (
    estado = 'publicada'
    and exists (
      select 1
        from public.lecciones l
        join public.unidades  u on u.id = l.unidad_id
        join public.cursos    c on c.id = u.curso_id
       where l.id = preguntas.leccion_id
         and l.estado = 'publicada'
         and u.estado = 'publicada'
         and c.estado <> 'borrador'
    )
  );

create policy "opciones visibles"
  on public.opciones
  for select
  to anon, authenticated
  using (
    exists (
      select 1
        from public.preguntas p
        join public.lecciones  l on l.id = p.leccion_id
        join public.unidades   u on u.id = l.unidad_id
        join public.cursos     c on c.id = u.curso_id
       where p.id = opciones.pregunta_id
         and p.estado = 'publicada'
         and l.estado = 'publicada'
         and u.estado = 'publicada'
         and c.estado <> 'borrador'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Escritura: no se crea ninguna politica de insert, update o delete.
--    Con RLS encendida y sin politica, PostgreSQL rechaza la operacion.
--    El revoke de arriba ya la habia bloqueado antes; son dos candados
--    independientes sobre la misma puerta.
-- ---------------------------------------------------------------------------

commit;
