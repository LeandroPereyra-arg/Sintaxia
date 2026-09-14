import { Router } from 'express'
import { config, proveedoresActivos } from '../config.js'
import { crearSesion, cerrarSesion, leerSesion } from '../auth/sesion.js'
import {
  proveedores,
  iniciarAutorizacion,
  validarEstado,
  obtenerPerfil,
  tomarDestino
} from '../auth/oauth.js'
import { buscarOCrearPorIdentidad, obtenerUsuarioPorId, identidadesDe } from '../servicios/usuarios.js'
import { asincrono } from '../middleware/autenticar.js'
import { presentarUsuario } from './presentadores.js'

export const rutasAuth = Router()

/** Que botones de login tiene que mostrar el front. */
rutasAuth.get('/proveedores', (req, res) => {
  res.json({ proveedores: proveedoresActivos() })
})

/** Quien soy. Devuelve null si no hay sesion (no es un error). */
rutasAuth.get(
  '/me',
  asincrono(async (req, res) => {
    const usuarioId = leerSesion(req)
    if (!usuarioId) return res.json({ usuario: null })

    const usuario = await obtenerUsuarioPorId(usuarioId)
    if (!usuario) return res.json({ usuario: null })

    const identidades = await identidadesDe(usuarioId)
    res.json({ usuario: presentarUsuario(usuario, identidades) })
  })
)

rutasAuth.post('/logout', (req, res) => {
  cerrarSesion(res)
  res.json({ ok: true })
})

// --- OAuth: Google y GitHub -------------------------------------------

for (const nombre of ['google', 'github']) {
  rutasAuth.get(`/${nombre}`, (req, res) => {
    if (!proveedoresActivos().includes(nombre)) {
      return res.redirect(`${config.urlFront}/ingresar?error=proveedor_no_configurado`)
    }
    res.redirect(iniciarAutorizacion(req, res, nombre, req.query.destino))
  })

  rutasAuth.get(
    `/${nombre}/callback`,
    asincrono(async (req, res) => {
      const destino = tomarDestino(req, res)

      if (req.query.error) {
        return res.redirect(`${config.urlFront}/ingresar?error=cancelado`)
      }
      if (!validarEstado(req, res, nombre)) {
        return res.redirect(`${config.urlFront}/ingresar?error=estado_invalido`)
      }
      if (!req.query.code) {
        return res.redirect(`${config.urlFront}/ingresar?error=sin_codigo`)
      }

      try {
        const perfil = await obtenerPerfil(nombre, req.query.code)
        const { usuarioId, nuevo } = await buscarOCrearPorIdentidad(nombre, perfil)
        crearSesion(res, usuarioId)
        res.redirect(`${config.urlFront}${destino}${nuevo ? '?bienvenida=1' : ''}`)
      } catch (error) {
        console.error(`[auth:${nombre}]`, error.message)
        res.redirect(`${config.urlFront}/ingresar?error=fallo_proveedor`)
      }
    })
  )
}

// --- Login de prueba (solo en desarrollo) -----------------------------

rutasAuth.post(
  '/demo',
  asincrono(async (req, res) => {
    if (!config.loginDemo) {
      return res.status(404).json({ error: 'El login de prueba no esta habilitado.' })
    }

    const nombre = String(req.body?.nombre ?? '').trim() || 'Estudiante de prueba'
    // Un id estable por nombre: entrar dos veces con el mismo nombre es la misma cuenta.
    const proveedorId = `demo-${nombre.toLowerCase().replace(/\s+/g, '-')}`

    const { usuarioId } = await buscarOCrearPorIdentidad('demo', {
      proveedorId,
      email: `${proveedorId}@sintaxia.local`,
      emailVerificado: false,
      nombre,
      avatarUrl: null,
      usuarioSugerido: nombre
    })

    crearSesion(res, usuarioId)
    const usuario = await obtenerUsuarioPorId(usuarioId)
    res.json({ usuario: presentarUsuario(usuario, await identidadesDe(usuarioId)) })
  })
)

/** Nombres de los proveedores, para que el front arme los botones. */
export const nombresProveedores = Object.fromEntries(
  Object.entries(proveedores).map(([clave, valor]) => [clave, valor.nombre])
)
