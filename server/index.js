import express from 'express'
import cookieParser from 'cookie-parser'
import { config, validarConfig, proveedoresActivos } from './config.js'
import { verificarConexion } from './db/pool.js'
import { rutasAuth } from './rutas/auth.js'
import { rutasPerfil } from './rutas/perfil.js'
import { rutasProgreso } from './rutas/progreso.js'
import { rutasRanking } from './rutas/ranking.js'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

/**
 * CORS acotado: solo se acepta el front configurado y se permiten cookies.
 * En desarrollo el front va por el proxy de Vite, asi que casi nunca hace
 * falta; queda para cuando el front y la API viven en dominios distintos.
 */
app.use((req, res, siguiente) => {
  if (req.headers.origin === config.urlFront) {
    res.header('Access-Control-Allow-Origin', config.urlFront)
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  siguiente()
})

app.get('/api/salud', async (req, res) => {
  try {
    await verificarConexion()
    res.json({ ok: true, base: 'conectada', proveedores: proveedoresActivos() })
  } catch (error) {
    res.status(503).json({ ok: false, base: 'sin conexion', detalle: error.message })
  }
})

app.use('/api/auth', rutasAuth)
app.use('/api/perfil', rutasPerfil)
app.use('/api/progreso', rutasProgreso)
app.use('/api/ranking', rutasRanking)

app.use('/api', (req, res) => res.status(404).json({ error: 'Esa ruta de la API no existe.' }))

/** Manejador central de errores: nunca filtra detalles internos al cliente. */
app.use((error, req, res, siguiente) => {
  const estado = error.estado ?? 500
  if (estado >= 500) console.error('[api]', error)
  res.status(estado).json({
    error: estado >= 500 ? 'Hubo un problema en el servidor.' : error.message
  })
})

async function arrancar() {
  const errores = validarConfig()
  if (errores.length > 0) {
    console.error('\n✖ No se puede arrancar la API:\n')
    errores.forEach((e) => console.error('  · ' + e))
    console.error('\n  Copia .env.example como .env y completa los valores.\n')
    process.exit(1)
  }

  try {
    await verificarConexion()
    console.log(`✔ Conectado a MySQL (${config.db.host}:${config.db.port}/${config.db.database})`)
  } catch (error) {
    console.error(`✖ No hay conexion con MySQL: ${error.message}`)
    console.error('  Levanta el servidor de base de datos y corre: npm run db:migrar')
    process.exit(1)
  }

  app.listen(config.puerto, () => {
    console.log(`✔ API de Sintaxia en http://localhost:${config.puerto}`)
    console.log(`  Login disponible con: ${proveedoresActivos().join(', ') || 'ninguno'}`)
  })
}

arrancar()
