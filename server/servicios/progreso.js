import { consultar, consultarUna, enTransaccion } from '../db/pool.js'
import { obtenerLeccion, lecciones, leccionesDeUnidad } from '../../src/data/lecciones/index.js'
import { unidadesJavaScript } from '../../src/data/unidades.js'
import { evaluarMedallas } from './medallas.js'
import { obtenerUsuarioPorId } from './usuarios.js'

/**
 * El servidor usa el MISMO catalogo de lecciones que el front
 * (`src/data/`), asi que el XP no se lo puede inventar el cliente:
 * lo calcula la API a partir de la leccion real.
 */

/** Fecha de hoy en formato YYYY-MM-DD. */
function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function diaAnterior(fecha) {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * XP que corresponde por una leccion.
 * La primera vez se gana completo (proporcional a los aciertos);
 * al repetirla, la mitad. Es la misma regla que ya usaba el modo invitado.
 */
export function calcularXp(leccion, aciertos, total, yaCompletada) {
  if (total <= 0) return 0
  const proporcion = Math.max(0, Math.min(1, aciertos / total))
  return Math.round(leccion.xp * proporcion * (yaCompletada ? 0.5 : 1))
}

/** Valida lo que manda el cliente contra el catalogo real. */
function validarEnvio({ leccionId, aciertos, total }) {
  const leccion = obtenerLeccion(leccionId)
  if (!leccion) {
    throw Object.assign(new Error('Esa leccion no existe.'), { estado: 404 })
  }
  const esperado = leccion.ejercicios.length
  const nAciertos = Number(aciertos)
  const nTotal = Number(total)

  if (!Number.isInteger(nTotal) || nTotal !== esperado) {
    throw Object.assign(new Error(`La leccion tiene ${esperado} ejercicios.`), { estado: 400 })
  }
  if (!Number.isInteger(nAciertos) || nAciertos < 0 || nAciertos > nTotal) {
    throw Object.assign(new Error('La cantidad de aciertos no es valida.'), { estado: 400 })
  }
  return { leccion, aciertos: nAciertos, total: nTotal }
}

/** Suma XP al dia de hoy y recalcula la racha. */
async function registrarActividad(conexion, usuarioId, xpGanado, fecha) {
  await conexion.execute(
    `INSERT INTO actividad_diaria (usuario_id, fecha, xp, lecciones)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp), lecciones = lecciones + 1`,
    [usuarioId, fecha, xpGanado]
  )

  const [[usuario]] = await conexion.execute(
    'SELECT racha_actual, racha_maxima, ultima_actividad FROM usuarios WHERE id = ? FOR UPDATE',
    [usuarioId]
  )

  let racha = usuario.racha_actual
  if (usuario.ultima_actividad !== fecha) {
    racha = usuario.ultima_actividad === diaAnterior(fecha) ? racha + 1 : 1
  }
  const rachaMaxima = Math.max(racha, usuario.racha_maxima)

  await conexion.execute(
    `UPDATE usuarios
        SET xp_total = xp_total + ?, racha_actual = ?, racha_maxima = ?, ultima_actividad = ?
      WHERE id = ?`,
    [xpGanado, racha, rachaMaxima, fecha, usuarioId]
  )
}

/**
 * Registra una leccion terminada y devuelve el XP ganado y las medallas nuevas.
 * Todo ocurre dentro de una transaccion para que no queden estados a medias.
 */
export async function registrarLeccion(usuarioId, envio) {
  const { leccion, aciertos, total } = validarEnvio(envio)
  const fecha = hoy()

  const resultado = await enTransaccion(async (conexion) => {
    const [previas] = await conexion.execute(
      'SELECT mejor_aciertos FROM progreso_lecciones WHERE usuario_id = ? AND leccion_id = ?',
      [usuarioId, leccion.id]
    )
    const yaCompletada = previas.length > 0
    const xpGanado = calcularXp(leccion, aciertos, total, yaCompletada)

    await conexion.execute(
      `INSERT INTO progreso_lecciones
         (usuario_id, curso_id, unidad_id, leccion_id, aciertos, total, mejor_aciertos, intentos, xp_ganado)
       VALUES (?, 'javascript', ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         aciertos = VALUES(aciertos),
         total = VALUES(total),
         mejor_aciertos = GREATEST(mejor_aciertos, VALUES(mejor_aciertos)),
         intentos = intentos + 1,
         xp_ganado = xp_ganado + VALUES(xp_ganado)`,
      [usuarioId, leccion.unidadId, leccion.id, aciertos, total, aciertos, xpGanado]
    )

    await registrarActividad(conexion, usuarioId, xpGanado, fecha)
    return { xpGanado }
  })

  const medallasNuevas = await evaluarMedallas(usuarioId)
  const usuario = await obtenerUsuarioPorId(usuarioId)

  return { xpGanado: resultado.xpGanado, medallasNuevas, usuario }
}

/**
 * Sube el progreso que el estudiante hizo como invitado (localStorage).
 * Se queda con el mejor resultado de cada leccion y nunca resta XP.
 */
export async function sincronizarProgreso(usuarioId, leccionesInvitado) {
  if (!Array.isArray(leccionesInvitado) || leccionesInvitado.length === 0) {
    return { importadas: 0, xpGanado: 0, medallasNuevas: [] }
  }

  let importadas = 0
  let xpTotal = 0
  const fecha = hoy()

  for (const envio of leccionesInvitado.slice(0, 200)) {
    let validado
    try {
      validado = validarEnvio(envio)
    } catch {
      continue // ignoramos en silencio lo que no sea valido
    }
    const { leccion, aciertos, total } = validado

    const xp = await enTransaccion(async (conexion) => {
      const [previas] = await conexion.execute(
        'SELECT mejor_aciertos FROM progreso_lecciones WHERE usuario_id = ? AND leccion_id = ?',
        [usuarioId, leccion.id]
      )
      // Si en la cuenta ya estaba completada no se importa ni se paga XP de nuevo.
      if (previas.length > 0) return null

      const xpGanado = calcularXp(leccion, aciertos, total, false)
      await conexion.execute(
        `INSERT INTO progreso_lecciones
           (usuario_id, curso_id, unidad_id, leccion_id, aciertos, total, mejor_aciertos, intentos, xp_ganado)
         VALUES (?, 'javascript', ?, ?, ?, ?, ?, 1, ?)`,
        [usuarioId, leccion.unidadId, leccion.id, aciertos, total, aciertos, xpGanado]
      )
      await registrarActividad(conexion, usuarioId, xpGanado, fecha)
      return xpGanado
    })

    if (xp === null) continue // ya la tenia en la cuenta
    importadas++
    xpTotal += xp
  }

  const medallasNuevas = await evaluarMedallas(usuarioId)
  return { importadas, xpGanado: xpTotal, medallasNuevas }
}

/** Progreso completo del usuario, tal como lo necesita el front. */
export async function obtenerProgreso(usuarioId) {
  const filas = await consultar(
    `SELECT leccion_id, unidad_id, aciertos, total, mejor_aciertos, intentos, completada_en
       FROM progreso_lecciones WHERE usuario_id = ?`,
    [usuarioId]
  )

  const porLeccion = {}
  for (const fila of filas) {
    porLeccion[fila.leccion_id] = {
      aciertos: fila.mejor_aciertos,
      total: fila.total,
      intentos: fila.intentos,
      fecha: fila.completada_en
    }
  }

  const xpHoy = await consultarUna(
    'SELECT xp FROM actividad_diaria WHERE usuario_id = ? AND fecha = ?',
    [usuarioId, hoy()]
  )

  return { lecciones: porLeccion, xpDeHoy: xpHoy?.xp ?? 0 }
}

/** XP por dia del ultimo anio, para el calendario del perfil. */
export async function obtenerActividad(usuarioId, dias = 365) {
  const limite = Math.min(Math.max(Number(dias) || 365, 7), 400)
  return consultar(
    `SELECT fecha, xp, lecciones
       FROM actividad_diaria
      WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY fecha`,
    [usuarioId, limite]
  )
}

/** Cuantas unidades completo (todas sus lecciones) y si termino el curso. */
export async function resumenCurso(usuarioId) {
  const filas = await consultar(
    'SELECT unidad_id, COUNT(*) AS hechas FROM progreso_lecciones WHERE usuario_id = ? GROUP BY unidad_id',
    [usuarioId]
  )
  const hechasPorUnidad = Object.fromEntries(filas.map((f) => [f.unidad_id, Number(f.hechas)]))

  let unidadesCompletas = 0
  for (const unidad of unidadesJavaScript) {
    const totales = leccionesDeUnidad(unidad.id).length
    if (totales > 0 && (hechasPorUnidad[unidad.id] ?? 0) >= totales) unidadesCompletas++
  }

  const totalHechas = filas.reduce((suma, f) => suma + Number(f.hechas), 0)
  return {
    unidadesCompletas,
    leccionesCompletas: totalHechas,
    cursoCompleto: totalHechas >= lecciones.length
  }
}
