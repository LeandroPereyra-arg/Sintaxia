import { Router } from 'express'
import { requiereSesion, asincrono } from '../middleware/autenticar.js'
import {
  obtenerProgreso,
  registrarLeccion,
  sincronizarProgreso
} from '../servicios/progreso.js'
import { identidadesDe } from '../servicios/usuarios.js'
import { presentarUsuario } from './presentadores.js'

export const rutasProgreso = Router()
rutasProgreso.use(requiereSesion)

/** Progreso guardado del usuario (lo carga el front al iniciar sesion). */
rutasProgreso.get(
  '/',
  asincrono(async (req, res) => {
    res.json(await obtenerProgreso(req.usuario.id))
  })
)

/**
 * Registra una leccion terminada.
 * El cliente manda cuantas acerto; el XP lo calcula el servidor.
 */
rutasProgreso.post(
  '/lecciones',
  asincrono(async (req, res) => {
    const { xpGanado, medallasNuevas, usuario } = await registrarLeccion(req.usuario.id, req.body ?? {})
    // Se incluyen las identidades para que el usuario que vuelve al front sea
    // exactamente el mismo objeto que devuelve /auth/me.
    const identidades = await identidadesDe(req.usuario.id)
    res.json({ xpGanado, medallasNuevas, usuario: presentarUsuario(usuario, identidades) })
  })
)

/** Sube el progreso hecho como invitado y lo fusiona con la cuenta. */
rutasProgreso.post(
  '/sincronizar',
  asincrono(async (req, res) => {
    const resultado = await sincronizarProgreso(req.usuario.id, req.body?.lecciones ?? [])
    res.json(resultado)
  })
)
