/**
 * Crea la base de datos y las tablas.
 *   npm run db:migrar
 *
 * Es idempotente: se puede correr las veces que haga falta.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import mysql from 'mysql2/promise'
import { config } from '../config.js'

const aqui = dirname(fileURLToPath(import.meta.url))

async function migrar() {
  // Primero se conecta sin base para poder crearla si no existe.
  const sinBase = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  })

  await sinBase.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await sinBase.end()
  console.log(`[OK] Base "${config.db.database}" lista`)

  const conexion = await mysql.createConnection({ ...config.db, multipleStatements: true })
  const esquema = await readFile(join(aqui, 'sql', '01-esquema.sql'), 'utf8')
  await conexion.query(esquema)

  await ajustesPosteriores(conexion)

  const [tablas] = await conexion.query('SHOW TABLES')
  console.log(`[OK] ${tablas.length} tablas creadas:`, tablas.map((t) => Object.values(t)[0]).join(', '))
  await conexion.end()
}

/**
 * Cambios sobre bases que ya existen (CREATE TABLE IF NOT EXISTS no las toca).
 * Cada ajuste comprueba primero si hace falta, asi se puede correr siempre.
 */
async function ajustesPosteriores(conexion) {
  const [columnas] = await conexion.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios'`,
    [config.db.database]
  )
  const nombres = columnas.map((c) => c.COLUMN_NAME)

  // Antes se guardaba un emoji; ahora se guarda el nombre de un icono.
  if (nombres.includes('avatar_emoji') && !nombres.includes('avatar_icono')) {
    await conexion.query('ALTER TABLE usuarios CHANGE avatar_emoji avatar_icono VARCHAR(40) NULL')
    console.log('[OK] Columna avatar_emoji renombrada a avatar_icono')
  }
}

migrar().catch((error) => {
  console.error('[ERROR] No se pudo migrar la base:', error.message)
  console.error('  Revisa que MySQL este corriendo y que el .env tenga bien los datos de conexion.')
  process.exit(1)
})
