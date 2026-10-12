/**
 * Administra el proceso de Supabase Auth (GoTrue) para las pruebas.
 *
 * Es el servidor de autenticacion REAL de Supabase, compilado con
 * pruebas/compilar-auth-local.sh. Se puede reiniciar con otra configuracion
 * (por ejemplo, con la confirmacion de correo apagada o con otro limite de altas
 * anonimas) para probar los distintos escenarios.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const RUTA_GOTRUE = process.env.GOTRUE_BIN ?? join(homedir(), '.cache', 'sintaxia', 'gotrue')

let proceso = null
let registro = []

export function ultimosRegistros(cantidad = 40) {
  return registro.slice(-cantidad)
}

function entornoDe(config) {
  const {
    puertoGotrue,
    puertoGateway,
    puertoSmtp,
    puertoApp,
    secretoJwt,
    baseDatos,
    confirmarCorreo,
    limiteAnonimos,
    limiteCorreos,
    minClave
  } = config

  return {
    ...process.env,
    GOTRUE_DB_DRIVER: 'postgres',
    DATABASE_URL: baseDatos,
    GOTRUE_DB_NAMESPACE: 'auth',
    GOTRUE_API_HOST: '127.0.0.1',
    PORT: String(puertoGotrue),
    // Los enlaces de los correos apuntan a la pasarela, que reenvia /auth/v1 a GoTrue.
    // Igual que en Supabase: la URL externa es el dominio y la ruta completa va en MAILER_URLPATHS.
    API_EXTERNAL_URL: `http://localhost:${puertoGateway}`,
    GOTRUE_SITE_URL: `http://localhost:${puertoApp}`,
    // A donde se puede volver desde un correo: la web y el esquema de la app movil.
    GOTRUE_URI_ALLOW_LIST: `http://localhost:${puertoApp}/**,sintaxia://**`,
    GOTRUE_JWT_SECRET: secretoJwt,
    GOTRUE_JWT_EXP: '3600',
    GOTRUE_JWT_AUD: 'authenticated',
    GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
    GOTRUE_JWT_ADMIN_ROLES: 'service_role',
    GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true',
    GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED: 'true',
    GOTRUE_DISABLE_SIGNUP: 'false',
    GOTRUE_MAILER_AUTOCONFIRM: confirmarCorreo ? 'false' : 'true',
    GOTRUE_SMTP_HOST: '127.0.0.1',
    GOTRUE_SMTP_PORT: String(puertoSmtp),
    GOTRUE_SMTP_USER: '',
    GOTRUE_SMTP_PASS: '',
    GOTRUE_SMTP_ADMIN_EMAIL: 'no-responder@sintaxia.local',
    GOTRUE_SMTP_SENDER_NAME: 'Sintaxia',
    // Supabase real deja pasar 1 correo por usuario cada 60 s; aca se baja para poder probar.
    GOTRUE_SMTP_MAX_FREQUENCY: '1s',
    GOTRUE_PASSWORD_MIN_LENGTH: String(minClave),
    // Auth solo aplica los limites por IP si sabe de que cabecera sacar la IP del cliente.
    // Supabase la configura detras de su proxy; aca la pone la pasarela.
    GOTRUE_RATE_LIMIT_HEADER: 'X-Forwarded-For',
    GOTRUE_RATE_LIMIT_ANONYMOUS_USERS: String(limiteAnonimos),
    GOTRUE_RATE_LIMIT_EMAIL_SENT: String(limiteCorreos),
    // Los demas limites vienen de fabrica con cupos chicos (por ejemplo 30 altas o
    // ingresos cada 5 minutos por IP). Las pruebas hacen decenas desde la misma IP, asi
    // que se levantan para que no ensucien los resultados; el de altas anonimas se
    // controla aparte porque es justamente lo que se prueba (caso 27).
    GOTRUE_RATE_LIMIT_VERIFY: '100000',
    GOTRUE_RATE_LIMIT_TOKEN_REFRESH: '100000',
    GOTRUE_RATE_LIMIT_SSO: '100000',
    GOTRUE_RATE_LIMIT_OTP: '100000',
    GOTRUE_RATE_LIMIT_WEB3: '100000',
    GOTRUE_RATE_LIMIT_PASSKEY: '100000',
    GOTRUE_MAILER_URLPATHS_CONFIRMATION: '/auth/v1/verify',
    GOTRUE_MAILER_URLPATHS_RECOVERY: '/auth/v1/verify',
    GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: '/auth/v1/verify',
    GOTRUE_MAILER_URLPATHS_INVITE: '/auth/v1/verify',
    GOTRUE_LOG_LEVEL: 'info'
  }
}

async function esperarSalud(puerto, intentos = 60) {
  for (let i = 0; i < intentos; i++) {
    try {
      const respuesta = await fetch(`http://127.0.0.1:${puerto}/health`)
      if (respuesta.ok) return
    } catch {
      /* todavia no escucha */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`GoTrue no respondio en el puerto ${puerto}. Ultimos registros:\n${ultimosRegistros(10).join('\n')}`)
}

export async function detener() {
  if (!proceso) return
  const viejo = proceso
  proceso = null
  await new Promise((resolver) => {
    viejo.once('exit', resolver)
    viejo.kill('SIGTERM')
    setTimeout(() => viejo.kill('SIGKILL'), 3000).unref()
  })
}

export async function iniciar(config) {
  if (!existsSync(RUTA_GOTRUE)) {
    throw new Error(
      `No se encontro el servidor de Auth en ${RUTA_GOTRUE}.\n` +
        'Compilalo con:  sh pruebas/compilar-auth-local.sh'
    )
  }
  await detener()
  registro = []

  proceso = spawn(RUTA_GOTRUE, [], { env: entornoDe(config), stdio: ['ignore', 'pipe', 'pipe'] })
  const guardar = (trozo) => {
    for (const linea of trozo.toString().split('\n').filter(Boolean)) {
      registro.push(linea)
      if (registro.length > 400) registro.shift()
    }
  }
  proceso.stdout.on('data', guardar)
  proceso.stderr.on('data', guardar)

  await esperarSalud(config.puertoGotrue)
}
