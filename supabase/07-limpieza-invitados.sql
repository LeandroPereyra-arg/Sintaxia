-- ===========================================================================
--  Sintaxia - Limpieza de invitados abandonados
--  Etapa 4 - Invitados, registro e inicio de sesion (Supabase Auth)
-- ---------------------------------------------------------------------------
--  Cada invitado es un usuario real de Auth. Quien abre la app, entra como
--  invitado y nunca vuelve deja un usuario huerfano. Supabase no los borra solo,
--  asi que se acumulan: esta funcion los elimina.
--
--  Borra los invitados creados hace mas de p_dias dias, que en ese lapso no
--  tuvieron ninguna sesion activa ni terminaron ninguna leccion. Al borrar el
--  usuario de Auth se borran en cascada su perfil y su historial.
--
--  Nunca toca cuentas permanentes ni invitados con actividad reciente.
--
--  Solo la puede ejecutar service_role (el panel de Supabase, una tarea
--  programada): ni el publico ni un invitado pueden llamarla.
--
--  Para programarla una vez por semana, con la extension pg_cron:
--
--    select cron.schedule('limpiar-invitados', '0 4 * * 0',
--                         $$ select public.limpiar_invitados_inactivos(30) $$);
-- ===========================================================================

begin;

create or replace function public.limpiar_invitados_inactivos(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_borrados integer;
begin
  if p_dias is null or p_dias < 1 then
    raise exception 'p_dias tiene que ser al menos 1.' using errcode = 'invalid_parameter_value';
  end if;

  with borrados as (
    delete from auth.users u
     where u.is_anonymous
       and u.created_at < now() - make_interval(days => p_dias)
       and not exists (
         select 1 from auth.sessions s
          where s.user_id = u.id
            and coalesce(s.updated_at, s.created_at) >= now() - make_interval(days => p_dias)
       )
       and not exists (
         select 1 from public.intentos_leccion i
          where i.usuario_id = u.id
            and i.creado_en >= now() - make_interval(days => p_dias)
       )
    returning 1
  )
  select count(*) into v_borrados from borrados;

  return v_borrados;
end;
$$;

comment on function public.limpiar_invitados_inactivos(integer) is
  'Borra invitados (sesiones anonimas) sin actividad en p_dias dias. Solo service_role.';

revoke all on function public.limpiar_invitados_inactivos(integer) from public, anon, authenticated;
grant execute on function public.limpiar_invitados_inactivos(integer) to service_role;

commit;
