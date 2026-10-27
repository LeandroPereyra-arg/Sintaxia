/**
 * Prepara una base PostgreSQL local equivalente a un proyecto de Supabase, con
 * los mismos scripts que se ejecutan en Supabase. Se usa para las pruebas
 * automaticas (pruebas/etapa3.mjs a pruebas/etapa5.mjs).
 *
 *   node pruebas/preparar-base-local.mjs
 *
 * Pasos:
 *   1. crea la base y los roles que Supabase ya trae (00-roles-locales.sql)
 *   2. deja que Supabase Auth (GoTrue) cree su esquema `auth`, como hace al
 *      arrancar el proyecto
 *   3. corre los scripts de supabase/ en orden
 *
 * Variables: PGHOST, PGPORT, PGUSER, PGDATABASE (por defecto 127.0.0.1:5433,
 * usuario y base "sintaxia"). Para el paso 2 hace falta el servidor de Auth
 * compilado: sh pruebas/compilar-auth-local.sh
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { RUTA_GOTRUE } from './local/gotrue.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

const host = process.env.PGHOST ?? '127.0.0.1'
const puerto = process.env.PGPORT ?? '5433'
const usuario = process.env.PGUSER ?? 'sintaxia'
const base = process.env.PGDATABASE ?? 'sintaxia'

const entorno = { ...process.env, PGHOST: host, PGPORT: puerto, PGUSER: usuario }

function psql(args, db = base) {
  return execFileSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q', '-d', db, ...args], {
    env: entorno,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

psql(['-c', `drop database if exists ${base} with (force);`], 'postgres')
psql(['-c', `create database ${base};`], 'postgres')

psql(['-f', join(raiz, 'supabase', '00-roles-locales.sql')])
console.log('  aplicado 00-roles-locales.sql')

// --- Esquema de Supabase Auth ------------------------------------------------
if (!existsSync(RUTA_GOTRUE)) {
  console.error(
    `\nNo se encontro el servidor de Auth en ${RUTA_GOTRUE}.\n` +
      'Compilalo con:  sh pruebas/compilar-auth-local.sh\n'
  )
  process.exit(1)
}

execFileSync(RUTA_GOTRUE, ['migrate'], {
  env: {
    ...process.env,
    GOTRUE_DB_DRIVER: 'postgres',
    DATABASE_URL:
      `postgres://supabase_auth_admin:solo-para-pruebas-locales@${host}:${puerto}/${base}?sslmode=disable`,
    GOTRUE_DB_NAMESPACE: 'auth',
    // Estos tres no se usan al migrar, pero la configuracion los exige.
    GOTRUE_JWT_SECRET: 'solo-para-migrar-no-es-un-secreto-real',
    API_EXTERNAL_URL: 'http://localhost:5599/auth/v1',
    GOTRUE_SITE_URL: 'http://localhost:5174'
  },
  stdio: ['ignore', 'ignore', 'pipe']
})
console.log('  migrado el esquema auth (Supabase Auth)')

// --- Scripts del proyecto ----------------------------------------------------
for (const archivo of [
  '01-esquema.sql',
  '02-datos-iniciales.sql',
  '03-politicas-rls.sql',
  '04-funcion-comprobar.sql',
  '05-perfiles-y-progreso.sql',
  '06-politicas-rls-etapa4.sql',
  '07-limpieza-invitados.sql',
  '08-intentos-y-respuestas.sql',
  '09-funciones-intentos.sql',
  '10-politicas-rls-etapa5.sql'
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
