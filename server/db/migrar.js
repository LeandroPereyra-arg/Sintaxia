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
  console.log(`✔ Base "${config.db.database}" lista`)

  const conexion = await mysql.createConnection({ ...config.db, multipleStatements: true })
  const esquema = await readFile(join(aqui, 'sql', '01-esquema.sql'), 'utf8')
  await conexion.query(esquema)

  const [tablas] = await conexion.query('SHOW TABLES')
  console.log(`✔ ${tablas.length} tablas creadas:`, tablas.map((t) => Object.values(t)[0]).join(', '))
  await conexion.end()
}

migrar().catch((error) => {
  console.error('✖ No se pudo migrar la base:', error.message)
  console.error('  Revisa que MySQL este corriendo y que el .env tenga bien los datos de conexion.')
  process.exit(1)
})
