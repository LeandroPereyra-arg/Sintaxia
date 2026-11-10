-- ===========================================================================
--  SOLO PARA LAS PRUEBAS LOCALES. No se ejecuta en Supabase.
-- ---------------------------------------------------------------------------
--  Supabase Realtime lee los cambios de las tablas de la publicacion
--  supabase_realtime (replicacion logica). El servidor de Realtime no se puede
--  levantar en este entorno, asi que la pasarela local lo imita: este script
--  agrega un disparador que avisa con NOTIFY cada cambio de las tablas que estan
--  EN LA PUBLICACION (si una tabla no esta publicada, no avisa: igual que en
--  Supabase). La pasarela escucha esos avisos y los reenvia por WebSocket con el
--  protocolo de Realtime.
-- ===========================================================================

create or replace function public.realtime_local_avisar()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify('realtime_local', json_build_object(
    'schema', tg_table_schema,
    'table', tg_table_name,
    'type', tg_op,
    'commit_timestamp', now(),
    'record', case when tg_op <> 'DELETE' then row_to_json(new) end,
    'old_record', case when tg_op <> 'INSERT' then row_to_json(old) end
  )::text);
  return null;
end;
$$;

do $$
declare
  t record;
begin
  for t in select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime' loop
    execute format('drop trigger if exists tg_realtime_local on %I.%I', t.schemaname, t.tablename);
    execute format(
      'create trigger tg_realtime_local after insert or update or delete on %I.%I for each row execute function public.realtime_local_avisar()',
      t.schemaname, t.tablename);
  end loop;
end;
$$;
