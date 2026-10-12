-- ===========================================================================
--  Sintaxia - Politicas de acceso de la etapa 4
--  Amplia 03-politicas-rls.sql: ahora hay datos que son de UNA persona.
-- ---------------------------------------------------------------------------
--  Hay tres tipos de visitante, y las politicas los distinguen:
--
--    1. PUBLICO            rol `anon`: llega con la clave publicable y sin sesion.
--    2. INVITADO           rol `authenticated` con is_anonymous = true: tiene una
--                          sesion anonima con su propio id.
--    3. CUENTA PERMANENTE  rol `authenticated` con is_anonymous = false.
--
--  Trampa a tener en cuenta: en Supabase un invitado NO tiene el rol `anon`.
--  Tiene el rol `authenticated`, igual que una cuenta con correo. Por eso una
--  politica escrita "to authenticated" tambien lo deja pasar. Lo que lo
--  distingue es el claim `is_anonymous` del token, que aca se consulta con
--  public.es_invitado().
--
--  Resumen:
--
--    contenido (etapa 3)      publico, invitado y cuenta: LEEN lo publicado
--    perfiles                 invitado y cuenta: ven y editan SOLO el propio;
--                             el publico no ve nada
--    intentos_leccion         invitado y cuenta: ven, crean y borran SOLO los
--                             propios; el invitado tiene un tope (restrictiva)
--
--  Ninguna politica deja leer, modificar ni borrar datos de otra persona.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Punto de partida: se cierran los permisos amplios que Supabase da por defecto
-- a las tablas nuevas de `public`, y se devuelven abajo solo los necesarios.
-- Este script es el unico que maneja los permisos de estas tablas, asi que se
-- puede volver a correr sin dejar nada abierto.
-- ---------------------------------------------------------------------------
revoke all on public.perfiles         from anon, authenticated;
revoke all on public.intentos_leccion from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ayuda: "esta sesion es de un invitado?"
-- Lee el claim is_anonymous del token. Sin sesion (rol anon) devuelve false.
-- ---------------------------------------------------------------------------
create or replace function public.es_invitado()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
$$;

comment on function public.es_invitado() is
  'true si la sesion actual es anonima (invitado). El token puede tardar en reflejar una conversion reciente hasta que se refresca.';

revoke all on function public.es_invitado() from public;
grant execute on function public.es_invitado() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ayuda: cuantos intentos guardo la persona de la sesion actual.
--
-- Hace falta para el tope de los invitados (mas abajo). La politica NO puede
-- hacer ese conteo con una subconsulta a su propia tabla: PostgreSQL lo rechaza
-- con "infinite recursion detected in policy". Una funcion SECURITY DEFINER no
-- pasa por RLS, y como filtra por auth.uid() solo cuenta los intentos propios.
-- ---------------------------------------------------------------------------
create or replace function public.cantidad_intentos_propios()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from public.intentos_leccion
   where usuario_id = (select auth.uid());
$$;

revoke all on function public.cantidad_intentos_propios() from public;
grant execute on function public.cantidad_intentos_propios() to authenticated;

-- ---------------------------------------------------------------------------
-- PERFILES
--   Permisos por columna: el cliente solo puede cambiar alias, avatar y meta.
--   No puede tocar id, codigo, es_invitado ni las fechas.
-- ---------------------------------------------------------------------------
drop policy if exists "perfiles: ver el propio"      on public.perfiles;
drop policy if exists "perfiles: editar el propio"   on public.perfiles;

grant select (id, alias, codigo, es_invitado, avatar, meta_diaria, creado_en)
  on public.perfiles to authenticated;
grant update (alias, avatar, meta_diaria)
  on public.perfiles to authenticated;

create policy "perfiles: ver el propio"
  on public.perfiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "perfiles: editar el propio"
  on public.perfiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin politicas de insert ni de delete: el perfil lo crea y lo borra Auth
-- (disparador y on delete cascade), nunca el cliente.

-- ---------------------------------------------------------------------------
-- INTENTOS DE LECCION
--   Al insertar, el cliente solo manda leccion, aciertos y total. De quien es
--   el intento (usuario_id) y cuando se hizo (creado_en) lo pone la base.
-- ---------------------------------------------------------------------------
drop policy if exists "intentos: ver los propios"        on public.intentos_leccion;
drop policy if exists "intentos: crear los propios"      on public.intentos_leccion;
drop policy if exists "intentos: borrar los propios"     on public.intentos_leccion;
drop policy if exists "intentos: tope para invitados"    on public.intentos_leccion;

grant select on public.intentos_leccion to authenticated;
grant insert (leccion_id, aciertos, total) on public.intentos_leccion to authenticated;
grant delete on public.intentos_leccion to authenticated;

create policy "intentos: ver los propios"
  on public.intentos_leccion
  for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "intentos: crear los propios"
  on public.intentos_leccion
  for insert
  to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "intentos: borrar los propios"
  on public.intentos_leccion
  for delete
  to authenticated
  using (usuario_id = (select auth.uid()));

-- Politica RESTRICTIVA: se suma a las anteriores (todas tienen que cumplirse).
-- Crear sesiones anonimas es gratis, asi que un invitado no puede llenar la
-- tabla sin limite: tiene un tope de 200 intentos. Una cuenta permanente no.
create policy "intentos: tope para invitados"
  on public.intentos_leccion
  as restrictive
  for insert
  to authenticated
  with check (
    not public.es_invitado()
    or public.cantidad_intentos_propios() < 200
  );

commit;
