-- ===========================================================================
--  Sintaxia - Politicas de acceso de la etapa 5
--  intentos y respuestas: cada persona LEE lo suyo y nadie escribe directo.
-- ---------------------------------------------------------------------------
--                    publico (anon)   invitado / cuenta
--    intentos        nada             ver y borrar los PROPIOS
--    respuestas      nada             ver las de sus intentos
--
--  Crear o modificar intentos y respuestas solo se puede con las funciones de
--  09-funciones-intentos.sql. No hay permiso de insert ni de update: aunque
--  alguien arme la peticion a mano no puede escribir "aciertos = 4", ni cambiar
--  el estado de un intento, ni tocar el progreso de otra persona.
--
--  Borrar: la persona puede borrar su propio historial ("reiniciar progreso").
--  Las respuestas de esos intentos se van en cascada.
-- ===========================================================================

begin;

revoke all on public.intentos   from anon, authenticated;
revoke all on public.respuestas from anon, authenticated;

drop policy if exists "intentos: ver los propios"    on public.intentos;
drop policy if exists "intentos: borrar los propios" on public.intentos;
drop policy if exists "respuestas: ver las propias"  on public.respuestas;

grant select on public.intentos   to authenticated;
grant delete on public.intentos   to authenticated;
grant select on public.respuestas to authenticated;

create policy "intentos: ver los propios"
  on public.intentos
  for select
  to authenticated
  using (usuario_id = (select auth.uid()));

create policy "intentos: borrar los propios"
  on public.intentos
  for delete
  to authenticated
  using (usuario_id = (select auth.uid()));

-- La subconsulta es a OTRA tabla (intentos), asi que no hay recursion.
create policy "respuestas: ver las propias"
  on public.respuestas
  for select
  to authenticated
  using (
    exists (
      select 1 from public.intentos i
       where i.id = respuestas.intento_id
         and i.usuario_id = (select auth.uid())
    )
  );

commit;
