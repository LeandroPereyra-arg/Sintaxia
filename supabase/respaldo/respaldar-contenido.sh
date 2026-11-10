#!/bin/sh
# ===========================================================================
#  Sintaxia - Respaldo del contenido
# ---------------------------------------------------------------------------
#  Guarda en un archivo .sql los datos del contenido (cursos, unidades,
#  lecciones, preguntas, opciones con su solucion) y de los eventos de la expo
#  (eventos, desafios y su banco de preguntas). No guarda cuentas, correos,
#  intentos ni partidas: para eso estan los respaldos de Supabase (ver
#  docs/18-ranking-y-administracion.md).
#
#  Uso:
#    export SUPABASE_DB_URL='<cadena de conexion de la base>'
#    sh supabase/respaldo/respaldar-contenido.sh [archivo.sql]
#
#  La cadena de conexion incluye la contrasena de la base: se pasa por la
#  variable de entorno y NO se escribe en ningun archivo del repositorio.
#  El respaldo tiene las soluciones de las preguntas: guardalo fuera del
#  repositorio publico.
# ===========================================================================
set -eu

: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL (la cadena de conexion de la base).}"
archivo="${1:-respaldo-contenido-$(date +%Y-%m-%d-%H%M).sql}"

pg_dump "$SUPABASE_DB_URL" \
  --data-only --no-owner --no-privileges \
  --table=public.cursos \
  --table=public.unidades \
  --table=public.lecciones \
  --table=public.preguntas \
  --table=public.opciones \
  --table=public.eventos \
  --table=public.desafios \
  --table=public.preguntas_desafio \
  --table=public.opciones_desafio \
  --file="$archivo"

echo "Respaldo guardado en $archivo"
