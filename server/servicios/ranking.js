import { consultar } from '../db/pool.js'

/**
 * Ranking semanal y ligas.
 *
 * La liga sale del XP total acumulado: es una forma simple de agrupar a gente
 * de nivel parecido sin necesidad de un proceso que corra todas las semanas.
 * El ranking, en cambio, se calcula sobre el XP de la semana en curso, asi
 * todos arrancan de cero cada lunes.
 */

export const LIGAS = [
  { codigo: 'bronce',   nombre: 'Bronce',   icono: '🥉', color: '#c8834a', desde: 0 },
  { codigo: 'plata',    nombre: 'Plata',    icono: '🥈', color: '#9aa7b4', desde: 250 },
  { codigo: 'oro',      nombre: 'Oro',      icono: '🥇', color: '#e8b923', desde: 750 },
  { codigo: 'diamante', nombre: 'Diamante', icono: '💎', color: '#4fc3e8', desde: 1500 }
]

/** Liga que le corresponde a un XP total. */
export function ligaDe(xpTotal) {
  let actual = LIGAS[0]
  for (const liga of LIGAS) if (xpTotal >= liga.desde) actual = liga
  return actual
}

/** La siguiente liga y cuanto XP falta para llegar. */
export function proximaLiga(xpTotal) {
  const siguiente = LIGAS.find((liga) => xpTotal < liga.desde)
  if (!siguiente) return null
  return { ...siguiente, faltan: siguiente.desde - xpTotal }
}

/**
 * Tabla de posiciones de la semana en curso (de lunes a domingo).
 * Se calcula sumando la actividad diaria desde el lunes.
 */
export async function rankingSemanal(limite = 50) {
  // Se interpola en el SQL porque MySQL no acepta parametros en LIMIT dentro de
  // sentencias preparadas; por eso queda forzado a entero entre 5 y 100.
  const tope = Math.trunc(Math.min(Math.max(Number(limite) || 50, 5), 100))

  // WEEKDAY() devuelve 0 para lunes, asi que esto ubica el lunes de esta semana.
  const filas = await consultar(
    `SELECT u.id, u.usuario, u.nombre, u.avatar_url, u.avatar_emoji, u.pais,
            u.xp_total, u.racha_actual,
            COALESCE(SUM(a.xp), 0) AS xp_semana
       FROM usuarios u
       LEFT JOIN actividad_diaria a
              ON a.usuario_id = u.id
             AND a.fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      GROUP BY u.id, u.usuario, u.nombre, u.avatar_url, u.avatar_emoji, u.pais,
               u.xp_total, u.racha_actual
      HAVING xp_semana > 0
      ORDER BY xp_semana DESC, u.xp_total DESC, u.usuario ASC
      LIMIT ${tope}`
  )

  return filas.map((fila, indice) => ({
    puesto: indice + 1,
    usuarioId: fila.id,
    usuario: fila.usuario,
    nombre: fila.nombre,
    avatarUrl: fila.avatar_url,
    avatarEmoji: fila.avatar_emoji,
    pais: fila.pais,
    xpSemana: Number(fila.xp_semana),
    xpTotal: Number(fila.xp_total),
    racha: Number(fila.racha_actual),
    liga: ligaDe(Number(fila.xp_total)).codigo
  }))
}

/** Puesto del usuario aunque no entre en el top de la tabla. */
export async function puestoDe(usuarioId) {
  const [fila] = await consultar(
    `SELECT COALESCE(SUM(xp), 0) AS xp_semana
       FROM actividad_diaria
      WHERE usuario_id = ?
        AND fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
    [usuarioId]
  )
  const xpSemana = Number(fila?.xp_semana ?? 0)
  if (xpSemana === 0) return { xpSemana: 0, puesto: null }

  const [conteo] = await consultar(
    `SELECT COUNT(*) AS mejores FROM (
       SELECT a.usuario_id, SUM(a.xp) AS xp
         FROM actividad_diaria a
        WHERE a.fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        GROUP BY a.usuario_id
       HAVING xp > ?
     ) AS mejores_que_yo`,
    [xpSemana]
  )

  return { xpSemana, puesto: Number(conteo.mejores) + 1 }
}
