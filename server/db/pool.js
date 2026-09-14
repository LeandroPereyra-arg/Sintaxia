import mysql from 'mysql2/promise'
import { config } from '../config.js'

/**
 * Pool de conexiones a MySQL.
 * Se usa un pool (y no una conexion suelta) para que varias peticiones
 * simultaneas no se pisen y las conexiones se reutilicen.
 */
export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  dateStrings: ['DATE']
})

/** Consulta simple: devuelve las filas. */
export async function consultar(sql, parametros = []) {
  const [filas] = await pool.execute(sql, parametros)
  return filas
}

/** Devuelve la primera fila o null. */
export async function consultarUna(sql, parametros = []) {
  const filas = await consultar(sql, parametros)
  return filas[0] ?? null
}

/**
 * Ejecuta varias consultas dentro de una transaccion.
 * Si alguna falla se deshace todo.
 */
export async function enTransaccion(tarea) {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()
    const resultado = await tarea(conexion)
    await conexion.commit()
    return resultado
  } catch (error) {
    await conexion.rollback()
    throw error
  } finally {
    conexion.release()
  }
}

/** Comprueba que la base responda (se usa al arrancar y en /api/salud). */
export async function verificarConexion() {
  const conexion = await pool.getConnection()
  try {
    await conexion.ping()
    return true
  } finally {
    conexion.release()
  }
}
