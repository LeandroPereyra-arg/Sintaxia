-- ===========================================================================
--  Roles locales (NO ejecutar en Supabase)
-- ---------------------------------------------------------------------------
--  Supabase ya trae creados los roles anon, authenticated y service_role.
--  Este script existe solo para poder reproducir el esquema y probar las
--  politicas en una instalacion comun de PostgreSQL (por ejemplo, al correr
--  las pruebas automaticas del proyecto).
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
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
