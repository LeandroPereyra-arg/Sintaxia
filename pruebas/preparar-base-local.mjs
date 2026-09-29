/**
 * Prepara una base PostgreSQL local con los mismos scripts que se ejecutan en
 * Supabase. Se usa para las pruebas automaticas (ver pruebas/etapa3.mjs).
 *
 *   node pruebas/preparar-base-local.mjs
 *
 * Variables: PGHOST, PGPORT, PGUSER, PGDATABASE (por defecto 127.0.0.1:5433,
 * usuario y base "sintaxia").
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

const entorno = {
  ...process.env,
  PGHOST: process.env.PGHOST ?? '127.0.0.1',
  PGPORT: process.env.PGPORT ?? '5433',
  PGUSER: process.env.PGUSER ?? 'sintaxia'
}
const base = process.env.PGDATABASE ?? 'sintaxia'

function psql(args, db = base) {
  return execFileSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q', '-d', db, ...args], {
    env: entorno,
    encoding: 'utf8'
  })
}

psql(['-c', `drop database if exists ${base};`], 'postgres')
psql(['-c', `create database ${base};`], 'postgres')

for (const archivo of [
  '00-roles-locales.sql',
  '01-esquema.sql',
  '02-datos-iniciales.sql',
  '03-politicas-rls.sql',
  '04-funcion-comprobar.sql'
]) {
  psql(['-f', join(raiz, 'supabase', archivo)])
  console.log(`  aplicado ${archivo}`)
}

const resumen = psql([
  '-tAc',
  "select 'cursos=' || (select count(*) from cursos) || ' unidades=' || (select count(*) from unidades) || " +
    "' lecciones=' || (select count(*) from lecciones) || ' preguntas=' || (select count(*) from preguntas) || " +
    "' opciones=' || (select count(*) from opciones)"
]).trim()

console.log(`Base local lista: ${resumen}`)
