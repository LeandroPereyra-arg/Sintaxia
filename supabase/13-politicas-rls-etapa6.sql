-- ===========================================================================
--  Sintaxia - Politicas de acceso de la competencia (etapa 6)
-- ---------------------------------------------------------------------------
--                        publico (anon)        invitado / cuenta
--    eventos             ver los visibles      ver los visibles
--    desafios            ver los publicados    ver los publicados
--    preguntas_desafio   NADA                  NADA (llegan por su partida)
--    opciones_desafio    NADA                  NADA (la solucion nunca sale)
--    partidas            nada                  ver las PROPIAS
--    partida_preguntas   nada                  nada (llegan por obtener_partida)
--    partida_respuestas  nada                  ver las de sus partidas
--
--  Nadie tiene permiso de insert, update ni delete sobre estas tablas: las
--  partidas, sus preguntas, respuestas y puntos solo los escriben las funciones
--  de 12-funciones-competencia.sql. El puntaje oficial no se puede tocar desde
--  el cliente. Los eventos, desafios y preguntas los carga el panel de
--  administracion (etapa 7, con sus propias funciones) o un script como
--  14-evento-expo.sql.
--
--  "Visible" = el evento no esta en preparacion. Un evento en preparacion y un
--  desafio en borrador no se ven: asi no se anticipa nada antes de la expo.
-- ===========================================================================

begin;

revoke all on public.eventos            from anon, authenticated;
revoke all on public.desafios           from anon, authenticated;
revoke all on public.preguntas_desafio  from anon, authenticated;
revoke all on public.opciones_desafio   from anon, authenticated;
revoke all on public.partidas           from anon, authenticated;
revoke all on public.partida_preguntas  from anon, authenticated;
revoke all on public.partida_respuestas from anon, authenticated;

drop policy if exists "eventos visibles"            on public.eventos;
drop policy if exists "desafios visibles"           on public.desafios;
drop policy if exists "partidas: ver las propias"   on public.partidas;
drop policy if exists "partida_respuestas: propias" on public.partida_respuestas;

grant select on public.eventos  to anon, authenticated;
grant select on public.desafios to anon, authenticated;

create policy "eventos visibles"
  on public.eventos
  for select
  to anon, authenticated
  using (estado <> 'preparacion');

create policy "desafios visibles"
  on public.desafios
  for select
  to anon, authenticated
  using (
    estado <> 'borrador'
    and exists (select 1 from public.eventos e where e.id = desafios.evento_id and e.estado <> 'preparacion')
  );

grant select on public.partidas to authenticated;

create policy "partidas: ver las propias"
  on public.partidas
  for select
  to authenticated
  using (usuario_id = (select auth.uid()));

grant select on public.partida_respuestas to authenticated;

create policy "partida_respuestas: propias"
  on public.partida_respuestas
  for select
  to authenticated
  using (exists (
    select 1 from public.partidas p
     where p.id = partida_respuestas.partida_id and p.usuario_id = (select auth.uid())
  ));

commit;
