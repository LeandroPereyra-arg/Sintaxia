-- ===========================================================================
--  Roles y esquema `auth` locales (NO ejecutar en Supabase)
-- ---------------------------------------------------------------------------
--  Supabase ya trae creados los roles anon, authenticated y service_role, y el
--  esquema `auth` con su servicio de autenticacion (GoTrue). Este script existe
--  solo para poder reproducir el proyecto en una instalacion comun de
--  PostgreSQL, por ejemplo al correr las pruebas automaticas.
--
--  Lo que hace falta antes de los demas scripts:
--    1. correr este archivo;
--    2. dejar que GoTrue cree sus tablas (gotrue migrate): preparar-base-local.mjs
--       lo hace solo.
-- ===========================================================================
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;

  -- En Supabase este rol siempre existe; las migraciones de GoTrue le dan permisos.
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    create role postgres nologin createrole;
  end if;

  -- Usuario con el que GoTrue se conecta a la base y es dueno del esquema auth.
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin login createrole noinherit password 'solo-para-pruebas-locales';
  end if;
end;
$$;

create schema if not exists auth authorization supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;

do $$
begin
  execute format('grant create on database %I to supabase_auth_admin', current_database());
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
-- Las politicas de RLS llaman a auth.uid(): los roles tienen que poder entrar al esquema.
grant usage on schema auth to anon, authenticated, service_role;
