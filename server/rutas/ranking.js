import { Router } from 'express'
import { leerSesion } from '../auth/sesion.js'
import { asincrono } from '../middleware/autenticar.js'
import { LIGAS, rankingSemanal, puestoDe } from '../servicios/ranking.js'

export const rutasRanking = Router()

/**
 * Tabla de posiciones de la semana.
 * Es publica: se puede mirar sin iniciar sesion, pero si hay sesion se agrega
 * el puesto propio aunque no entre en el top.
 */
rutasRanking.get(
  '/',
  asincrono(async (req, res) => {
    const tabla = await rankingSemanal(req.query.limite)
    const usuarioId = leerSesion(req)
    const yo = usuarioId ? await puestoDe(usuarioId) : null

    res.json({ ligas: LIGAS, tabla, yo, usuarioId })
  })
)
