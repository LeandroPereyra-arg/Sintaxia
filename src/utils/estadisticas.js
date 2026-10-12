/**
 * Calculos que salen del historial de intentos.
 *
 * Es una funcion pura (no toca la red ni el estado de Vue): recibe los intentos
 * y el XP de cada leccion, y devuelve todo lo que la app muestra. Asi el XP, la
 * racha y el calendario se pueden reconstruir en cualquier dispositivo a partir
 * de lo guardado, y se prueban sin navegador.
 *
 * Reglas:
 *   · Mejor resultado de una leccion = el intento con mayor porcentaje de aciertos.
 *   · XP: cada leccion otorga su XP proporcional al mejor resultado. Repetir una
 *     leccion solo suma lo que mejora respecto del mejor intento anterior, asi que
 *     no se puede "farmear" XP repitiendola.
 *   · Racha: dias seguidos con al menos un intento. Sigue viva si hoy todavia no
 *     hubo actividad pero ayer si.
 *   · Los dias se cuentan en la hora local del dispositivo.
 */

/** "2026-10-12" en hora local. */
export function diaLocal(fecha) {
  const d = new Date(fecha)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function sumarDias(texto, cantidad) {
  const [a, m, d] = texto.split('-').map(Number)
  const fecha = new Date(a, m - 1, d + cantidad)
  return diaLocal(fecha)
}

/**
 * @param {Array<{leccionId:string, aciertos:number, total:number, creadoEn:string}>} intentos
 * @param {Record<string, number>} xpPorLeccion
 * @param {Date} [ahora]
 */
export function calcularEstadisticas(intentos, xpPorLeccion = {}, ahora = new Date()) {
  const ordenados = [...intentos].sort(
    (a, b) => new Date(a.creadoEn) - new Date(b.creadoEn) || (a.id ?? 0) - (b.id ?? 0)
  )

  /** { [leccionId]: { aciertos, total, fecha, intentos } } con el MEJOR resultado. */
  const lecciones = {}
  const dias = new Map() // dia -> { xp, lecciones }
  let xp = 0

  for (const intento of ordenados) {
    const xpLeccion = xpPorLeccion[intento.leccionId] ?? 0
    const ratio = intento.total > 0 ? intento.aciertos / intento.total : 0
    const previo = lecciones[intento.leccionId]
    const ratioPrevio = previo && previo.total > 0 ? previo.aciertos / previo.total : 0

    const ganado = Math.max(0, Math.round(xpLeccion * ratio) - Math.round(xpLeccion * ratioPrevio))
    xp += ganado

    lecciones[intento.leccionId] = {
      // Se queda con el mejor; ante un empate, con el mas reciente.
      ...(previo && ratioPrevio > ratio
        ? { aciertos: previo.aciertos, total: previo.total }
        : { aciertos: intento.aciertos, total: intento.total }),
      fecha: intento.creadoEn,
      intentos: (previo?.intentos ?? 0) + 1
    }

    const dia = diaLocal(intento.creadoEn)
    const acumulado = dias.get(dia) ?? { xp: 0, lecciones: 0 }
    acumulado.xp += ganado
    acumulado.lecciones += 1
    dias.set(dia, acumulado)
  }

  // --- racha ---
  const hoy = diaLocal(ahora)
  const ayer = sumarDias(hoy, -1)

  let racha = 0
  let cursor = dias.has(hoy) ? hoy : dias.has(ayer) ? ayer : null
  while (cursor && dias.has(cursor)) {
    racha += 1
    cursor = sumarDias(cursor, -1)
  }

  let rachaMaxima = 0
  let actual = 0
  let anterior = null
  for (const dia of [...dias.keys()].sort()) {
    actual = anterior && sumarDias(anterior, 1) === dia ? actual + 1 : 1
    rachaMaxima = Math.max(rachaMaxima, actual)
    anterior = dia
  }

  return {
    lecciones,
    xp,
    xpDeHoy: dias.get(hoy)?.xp ?? 0,
    racha,
    rachaMaxima,
    actividad: [...dias.entries()]
      .map(([fecha, datos]) => ({ fecha, ...datos }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }
}
