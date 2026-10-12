/**
 * Levanta todo el entorno local de pruebas con un solo comando:
 *
 *   npm run pruebas:entorno
 *
 *   1. la pasarela de Supabase local (Auth real + API de datos + correos de prueba)
 *   2. la aplicacion de Vue, apuntando a esa pasarela
 *
 * Antes hace falta, una sola vez:
 *   npm run auth:compilar        compila Supabase Auth
 *   npm run supabase:local       arma la base con los scripts de supabase/
 *
 * Con el entorno arriba, en otra terminal:  npm run pruebas:etapa4
 * Se corta todo con Ctrl+C.
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL_SB = process.env.URL_SUPABASE ?? 'http://localhost:5599'
const PUERTO_APP = process.env.PUERTO_APP ?? '5174'

const hijos = []

function lanzar(nombre, comando, args, entorno = {}) {
  const hijo = spawn(comando, args, {
    cwd: raiz,
    env: { ...process.env, ...entorno },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const mostrar = (trozo) =>
    trozo
      .toString()
      .split('\n')
      .filter(Boolean)
      .forEach((linea) => console.log(`[${nombre}] ${linea}`))
  hijo.stdout.on('data', mostrar)
  hijo.stderr.on('data', mostrar)
  hijo.on('exit', (codigo) => {
    console.log(`[${nombre}] termino (codigo ${codigo})`)
    apagar(codigo ?? 1)
  })
  hijos.push(hijo)
  return hijo
}

let apagando = false
function apagar(codigo = 0) {
  if (apagando) return
  apagando = true
  for (const hijo of hijos) hijo.kill('SIGTERM')
  setTimeout(() => process.exit(codigo), 1500).unref()
}
process.on('SIGINT', () => apagar(0))
process.on('SIGTERM', () => apagar(0))

async function esperarClaves() {
  for (let i = 0; i < 120; i++) {
    try {
      const respuesta = await fetch(`${URL_SB}/__control/claves`)
      if (respuesta.ok) return respuesta.json()
    } catch {
      /* todavia no escucha */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('La pasarela de Supabase local no arranco a tiempo')
}

lanzar('supabase', 'node', ['pruebas/servidor-supabase-local.mjs'])
const claves = await esperarClaves()

lanzar('app', 'npx', ['vite', '--port', PUERTO_APP, '--strictPort'], {
  VITE_SUPABASE_URL: claves.url,
  VITE_SUPABASE_PUBLISHABLE_KEY: claves.clavePublicable
})

console.log(`\nListo: la app esta en http://localhost:${PUERTO_APP} y habla con ${claves.url}`)
console.log('En otra terminal:  npm run pruebas:etapa4\n')
