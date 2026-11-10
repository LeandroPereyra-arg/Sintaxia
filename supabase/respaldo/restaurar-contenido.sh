#!/bin/sh
# ===========================================================================
#  Sintaxia - Recuperar el contenido desde un respaldo
# ---------------------------------------------------------------------------
#  Carga un archivo hecho con respaldar-contenido.sh en un proyecto NUEVO,
#  despues de correr los scripts 01 a 16 de supabase/. Reemplaza el contenido
#  de ejemplo de los scripts por el del respaldo.
#
#  Para no borrar historial por error, se niega a seguir si la base ya tiene
#  intentos o partidas: en un proyecto en uso se recupera con los respaldos
#  de Supabase, no con este script.
#
#  Uso:
#    export SUPABASE_DB_URL='<cadena de conexion de la base>'
#    sh supabase/respaldo/restaurar-contenido.sh respaldo-contenido-AAAA-MM-DD-HHMM.sql
#
#  Todo corre en una sola transaccion: si algo falla, no cambia nada.
# ===========================================================================
set -eu

: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL (la cadena de conexion de la base).}"
archivo="${1:?Indica el archivo del respaldo.}"
[ -f "$archivo" ] || { echo "No existe $archivo" >&2; exit 1; }

psql "$SUPABASE_DB_URL" --single-transaction -v ON_ERROR_STOP=1 -q -o /dev/null \
  -c "set client_min_messages = warning;" \
  -c "do \$\$ begin
        if exists (select 1 from public.intentos) or exists (select 1 from public.partidas) then
          raise exception 'La base ya tiene intentos o partidas: este script es para un proyecto nuevo.';
        end if;
      end \$\$;" \
  -c "truncate public.opciones_desafio, public.preguntas_desafio, public.desafios, public.eventos,
               public.opciones, public.preguntas, public.lecciones, public.unidades, public.cursos cascade;" \
  -c "set session_replication_role = replica;" \
  -f "$archivo" \
  -c "set session_replication_role = origin;"

psql "$SUPABASE_DB_URL" -tA -c "select 'Recuperado: cursos=' || (select count(*) from public.cursos)
  || ' lecciones=' || (select count(*) from public.lecciones)
  || ' preguntas=' || (select count(*) from public.preguntas)
  || ' eventos=' || (select count(*) from public.eventos)
  || ' desafios=' || (select count(*) from public.desafios)
  || ' preguntas de desafios=' || (select count(*) from public.preguntas_desafio);"
