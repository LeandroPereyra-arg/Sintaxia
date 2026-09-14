import { Router } from 'express'
import { requiereSesion, asincrono } from '../middleware/autenticar.js'
import { actualizarPerfil, identidadesDe } from '../servicios/usuarios.js'
import { medallasDe } from '../servicios/medallas.js'
import { obtenerActividad, obtenerProgreso, resumenCurso } from '../servicios/progreso.js'
import { puestoDe } from '../servicios/ranking.js'
import { presentarUsuario } from './presentadores.js'

export const rutasPerfil = Router()
rutasPerfil.use(requiereSesion)

/** Todo lo que necesita la pantalla de perfil, en una sola llamada. */
rutasPerfil.get(
  '/',
  asincrono(async (req, res) => {
    const usuarioId = req.usuario.id
    const [identidades, medallas, actividad, curso, ranking, progreso] = await Promise.all([
      identidadesDe(usuarioId),
      medallasDe(usuarioId),
      obtenerActividad(usuarioId),
      resumenCurso(usuarioId),
      puestoDe(usuarioId),
      obtenerProgreso(usuarioId)
    ])

    res.json({
      usuario: presentarUsuario(req.usuario, identidades),
      medallas,
      actividad,
      curso,
      ranking,
      xpDeHoy: progreso.xpDeHoy
    })
  })
)

rutasPerfil.put(
  '/',
  asincrono(async (req, res) => {
    const actualizado = await actualizarPerfil(req.usuario.id, req.body ?? {})
    const identidades = await identidadesDe(req.usuario.id)
    res.json({ usuario: presentarUsuario(actualizado, identidades) })
  })
)

rutasPerfil.get(
  '/medallas',
  asincrono(async (req, res) => {
    res.json({ medallas: await medallasDe(req.usuario.id) })
  })
)

rutasPerfil.get(
  '/actividad',
  asincrono(async (req, res) => {
    res.json({ actividad: await obtenerActividad(req.usuario.id, req.query.dias) })
  })
)
