import { consultar, consultarUna } from '../db/pool.js'
import { lecciones, leccionesDeUnidad } from '../../src/data/lecciones/index.js'
import { unidadesJavaScript } from '../../src/data/unidades.js'

/**
 * Evaluador de medallas.
 *
 * Despues de cada leccion se calculan las estadisticas del usuario y se
 * comparan con los requisitos del catalogo (tabla `medallas`). Las que cumple
 * y todavia no tiene se insertan en `usuario_medallas`.
 *
 * Se hace del lado del servidor a proposito: asi el cliente no puede
 * regalarse medallas.
 */

/** Reune todo lo que hace falta para evaluar los requisitos. */
async function estadisticasDe(usuarioId) {
  const usuario = await consultarUna(
    'SELECT xp_total, racha_actual FROM usuarios WHERE id = ?',
    [usuarioId]
  )
  if (!usuario) return null

  const [resumen] = await consultar(
    `SELECT COUNT(*) AS lecciones,
            SUM(CASE WHEN mejor_aciertos = total THEN 1 ELSE 0 END) AS perfectas
       FROM progreso_lecciones WHERE usuario_id = ?`,
    [usuarioId]
  )

  const porUnidad = await consultar(
    'SELECT unidad_id, COUNT(*) AS hechas FROM progreso_lecciones WHERE usuario_id = ? GROUP BY unidad_id',
    [usuarioId]
  )
  const hechas = Object.fromEntries(porUnidad.map((f) => [f.unidad_id, Number(f.hechas)]))
  let unidadesCompletas = 0
  for (const unidad of unidadesJavaScript) {
    const totales = leccionesDeUnidad(unidad.id).length
    if (totales > 0 && (hechas[unidad.id] ?? 0) >= totales) unidadesCompletas++
  }

  const mejorDia = await consultarUna(
    'SELECT MAX(xp) AS xp FROM actividad_diaria WHERE usuario_id = ?',
    [usuarioId]
  )

  const totalLecciones = Number(resumen?.lecciones ?? 0)

  return {
    lecciones: totalLecciones,
    lecciones_perfectas: Number(resumen?.perfectas ?? 0),
    racha: Number(usuario.racha_actual),
    xp: Number(usuario.xp_total),
    xp_dia: Number(mejorDia?.xp ?? 0),
    unidades: unidadesCompletas,
    curso: totalLecciones >= lecciones.length ? 1 : 0
  }
}

/**
 * Otorga las medallas que el usuario haya alcanzado.
 * Devuelve solo las nuevas, para poder festejarlas en pantalla.
 */
export async function evaluarMedallas(usuarioId) {
  const stats = await estadisticasDe(usuarioId)
  if (!stats) return []

  const catalogo = await consultar(
    `SELECT m.id, m.codigo, m.nombre, m.descripcion, m.icono, m.categoria, m.nivel,
            m.requisito_tipo, m.requisito_valor,
            um.usuario_id IS NOT NULL AS obtenida
       FROM medallas m
       LEFT JOIN usuario_medallas um ON um.medalla_id = m.id AND um.usuario_id = ?
      ORDER BY m.orden`,
    [usuarioId]
  )

  const nuevas = []
  for (const medalla of catalogo) {
    if (Number(medalla.obtenida) === 1) continue
    const alcanzado = stats[medalla.requisito_tipo] ?? 0
    if (alcanzado >= medalla.requisito_valor) nuevas.push(medalla)
  }

  for (const medalla of nuevas) {
    await consultar(
      'INSERT IGNORE INTO usuario_medallas (usuario_id, medalla_id) VALUES (?, ?)',
      [usuarioId, medalla.id]
    )
  }

  return nuevas.map(({ obtenida, ...resto }) => resto)
}

/**
 * Catalogo completo con el estado de cada medalla para este usuario,
 * incluyendo cuanto le falta para las que todavia no tiene.
 */
export async function medallasDe(usuarioId) {
  const stats = (await estadisticasDe(usuarioId)) ?? {}

  const filas = await consultar(
    `SELECT m.codigo, m.nombre, m.descripcion, m.icono, m.categoria, m.nivel,
            m.requisito_tipo, m.requisito_valor, um.obtenida_en
       FROM medallas m
       LEFT JOIN usuario_medallas um ON um.medalla_id = m.id AND um.usuario_id = ?
      ORDER BY m.orden`,
    [usuarioId]
  )

  return filas.map((fila) => {
    const alcanzado = Math.min(stats[fila.requisito_tipo] ?? 0, fila.requisito_valor)
    return {
      codigo: fila.codigo,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      icono: fila.icono,
      categoria: fila.categoria,
      nivel: fila.nivel,
      obtenida: Boolean(fila.obtenida_en),
      obtenidaEn: fila.obtenida_en,
      progreso: { actual: alcanzado, objetivo: fila.requisito_valor }
    }
  })
}
