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
--
--  (Las politicas del progreso -intentos y respuestas- estan desde la etapa 5 en
--  10-politicas-rls-etapa5.sql.)
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
revoke all on public.perfiles from anon, authenticated;

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

commit;
