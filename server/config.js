import 'dotenv/config'

/** Lee una variable de entorno con valor por defecto. */
function env(clave, porDefecto = undefined) {
  const valor = process.env[clave]
  return valor === undefined || valor === '' ? porDefecto : valor
}

const produccion = env('NODE_ENV') === 'produccion' || env('NODE_ENV') === 'production'

export const config = {
  produccion,
  puerto: Number(env('PUERTO', 3000)),

  /** URL publica del front, para volver despues del login. */
  urlFront: env('URL_FRONT', 'http://localhost:5173'),
  /** URL publica de la API, base de los callbacks de OAuth. */
  urlApi: env('URL_API', 'http://localhost:3000'),

  db: {
    host: env('DB_HOST', '127.0.0.1'),
    port: Number(env('DB_PORT', 3306)),
    user: env('DB_USUARIO', 'sintaxia'),
    password: env('DB_CLAVE', 'sintaxia'),
    database: env('DB_NOMBRE', 'sintaxia')
  },

  sesion: {
    secreto: env('SECRETO_SESION', ''),
    /** Duracion del token de sesion. */
    duracion: '30d',
    cookie: 'sintaxia_sesion'
  },

  google: {
    clienteId: env('GOOGLE_CLIENT_ID', ''),
    clienteSecreto: env('GOOGLE_CLIENT_SECRET', '')
  },

  github: {
    clienteId: env('GITHUB_CLIENT_ID', ''),
    clienteSecreto: env('GITHUB_CLIENT_SECRET', '')
  },

  /**
   * Login de prueba sin OAuth, para desarrollar o mostrar la app sin tener
   * que dar de alta las credenciales de Google/GitHub.
   * Nunca se habilita en produccion, aunque la variable diga que si.
   */
  loginDemo: env('PERMITIR_LOGIN_DEMO', 'false') === 'true' && !produccion
}

/** Proveedores realmente configurados (el front solo muestra estos botones). */
export function proveedoresActivos() {
  const activos = []
  if (config.google.clienteId && config.google.clienteSecreto) activos.push('google')
  if (config.github.clienteId && config.github.clienteSecreto) activos.push('github')
  if (config.loginDemo) activos.push('demo')
  return activos
}

/** Corta el arranque si falta algo imprescindible. */
export function validarConfig() {
  const errores = []
  if (!config.sesion.secreto || config.sesion.secreto.length < 32) {
    errores.push(
      'SECRETO_SESION falta o es muy corto (necesita 32 caracteres o mas). ' +
        'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    )
  }
  if (config.produccion && config.loginDemo) {
    errores.push('PERMITIR_LOGIN_DEMO no puede estar activo en produccion.')
  }
  if (proveedoresActivos().length === 0) {
    errores.push(
      'No hay ningun proveedor de login configurado. Carga las credenciales de Google o ' +
        'GitHub en el .env, o pone PERMITIR_LOGIN_DEMO=true para probar sin OAuth.'
    )
  }
  return errores
}
