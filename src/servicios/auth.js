/**
 * Acceso a Supabase Auth: invitados, registro, inicio y cierre de sesion,
 * recuperacion de acceso y conversion de invitado a cuenta.
 *
 * Es el UNICO lugar que llama a `supabase.auth`. Las pantallas y `useAuth` le
 * piden todo a este modulo, que ademas traduce los errores de Auth a mensajes
 * para el participante.
 *
 * Conceptos:
 *
 *   · INVITADO     sesion anonima de Supabase: cada invitado recibe un usuario
 *                  propio con su propio id (nunca una cuenta compartida).
 *   · CUENTA       usuario con correo y contrasena.
 *   · CONVERSION   un invitado agrega correo y contrasena y sigue siendo el MISMO
 *                  usuario: conserva su id y, por lo tanto, su historial.
 *
 * Las contrasenas no pasan por ninguna tabla propia: Auth las guarda con hash.
 */
import { supabase, hayConfiguracion, urlDeRetorno } from '@/servicios/supabase.js'
import { ErrorDeAuth, SinConfiguracion, esErrorDeRed } from '@/servicios/errores.js'
import { CLAVE_MINIMA } from '@/utils/validaciones.js'

// ---------------------------------------------------------------------------
// Traduccion de errores
// ---------------------------------------------------------------------------

const MENSAJES = {
  anonymous_provider_disabled:
    'El acceso como invitado no esta habilitado todavia. Crea una cuenta para continuar.',
  over_request_rate_limit:
    'Se hicieron demasiados intentos desde esta conexion. Espera unos minutos y volve a probar.',
  over_email_send_rate_limit:
    'Se enviaron demasiados correos en poco tiempo. Espera un rato antes de pedir otro.',
  invalid_credentials: 'El correo o la contrasena no son correctos.',
  email_not_confirmed:
    'Todavia no confirmaste tu correo. Abri el enlace que te mandamos (fijate tambien en el spam).',
  user_already_exists: 'Ese correo ya tiene una cuenta. Inicia sesion o recupera tu contrasena.',
  email_exists: 'Ese correo ya tiene una cuenta. Inicia sesion o recupera tu contrasena.',
  weak_password: `La contrasena es demasiado debil: usa al menos ${CLAVE_MINIMA} caracteres.`,
  same_password: 'La contrasena nueva tiene que ser distinta de la anterior.',
  signup_disabled: 'El registro esta cerrado por ahora.',
  email_address_invalid: 'El correo no parece valido. Revisalo e intenta de nuevo.',
  validation_failed: 'Los datos no son validos. Revisalos e intenta de nuevo.',
  otp_expired: 'El enlace vencio o ya se uso. Pedi uno nuevo.',
  flow_state_not_found:
    'Este enlace hay que abrirlo en el mismo dispositivo y navegador donde lo pediste. Si no, ingresa con tu contrasena.',
  flow_state_expired: 'El enlace vencio. Pedi uno nuevo.',
  bad_code_verifier:
    'Este enlace hay que abrirlo en el mismo dispositivo y navegador donde lo pediste. Si no, ingresa con tu contrasena.',
  session_not_found: 'Tu sesion vencio. Volve a ingresar.',
  refresh_token_not_found: 'Tu sesion vencio. Volve a ingresar.',
  refresh_token_already_used: 'Tu sesion vencio. Volve a ingresar.',
  bad_jwt: 'Tu sesion vencio. Volve a ingresar.',
  user_not_found: 'Tu sesion ya no es valida. Volve a ingresar.',
  reauthentication_needed: 'Por seguridad tenes que volver a ingresar antes de hacer este cambio.'
}

const MENSAJE_RED =
  'No hay conexion con el servidor. Revisa tu conexion a internet e intenta de nuevo.'

/** Convierte un error de supabase.auth en un ErrorDeAuth con texto para mostrar. */
export function traducirErrorAuth(error) {
  if (error instanceof ErrorDeAuth) return error
  if (esErrorDeRed(error)) {
    return new ErrorDeAuth(MENSAJE_RED, { reintentable: true, causa: error, codigo: 'sin_conexion' })
  }

  const codigo = error?.code ?? null
  const estado = error?.status ?? null
  const texto = String(error?.message ?? '')

  let mensaje = codigo ? MENSAJES[codigo] : undefined

  if (!mensaje && (estado === 429 || /rate limit/i.test(texto))) {
    mensaje = /email/i.test(texto) ? MENSAJES.over_email_send_rate_limit : MENSAJES.over_request_rate_limit
  }
  if (!mensaje && /invalid login credentials/i.test(texto)) mensaje = MENSAJES.invalid_credentials
  if (!mensaje && /already.*registered/i.test(texto)) mensaje = MENSAJES.user_already_exists
  if (!mensaje && /password/i.test(texto) && /(short|least|weak)/i.test(texto)) mensaje = MENSAJES.weak_password
  if (!mensaje && /unable to validate email|invalid email/i.test(texto)) mensaje = MENSAJES.email_address_invalid

  // 5xx: el servidor fallo; volver a probar puede andar.
  const reintentable = (estado !== null && estado >= 500) || estado === 429
  return new ErrorDeAuth(
    mensaje ?? 'No pudimos completar la operacion. Intenta de nuevo en un momento.',
    { reintentable, causa: error, codigo }
  )
}

/** Devuelve el cliente o corta con un mensaje claro si falta la configuracion. */
function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase.auth
}

/** Ejecuta una llamada de auth y traduce cualquier fallo (de red o de Auth). */
async function llamar(operacion) {
  let resultado
  try {
    resultado = await operacion(cliente())
  } catch (error) {
    throw traducirErrorAuth(error)
  }
  if (resultado?.error) throw traducirErrorAuth(resultado.error)
  return resultado?.data ?? null
}

// ---------------------------------------------------------------------------
// Sesion
// ---------------------------------------------------------------------------

/** Restaura la sesion guardada en el dispositivo (la renueva si hace falta). */
export async function obtenerSesion() {
  const datos = await llamar((auth) => auth.getSession())
  return datos?.session ?? null
}

/**
 * Avisa de cada cambio de sesion. Devuelve la funcion para dejar de escuchar.
 * Eventos: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
 * USER_UPDATED y PASSWORD_RECOVERY.
 */
export function alCambiarSesion(devolucion) {
  if (!hayConfiguracion || !supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((evento, sesion) => devolucion(evento, sesion))
  return () => data.subscription.unsubscribe()
}

/** Pide al servidor los datos del usuario y renueva el token (para ver cambios recientes). */
export async function refrescarSesion() {
  const datos = await llamar((auth) => auth.refreshSession())
  return datos?.session ?? null
}

// ---------------------------------------------------------------------------
// Invitado
// ---------------------------------------------------------------------------

/**
 * Crea una sesion anonima con un usuario propio. Hay que habilitarlo en
 * Supabase: Authentication -> Sign In / Providers -> Anonymous sign-ins.
 */
export async function entrarComoInvitado() {
  const datos = await llamar((auth) => auth.signInAnonymously())
  return datos.session
}

// ---------------------------------------------------------------------------
// Registro y conversion
// ---------------------------------------------------------------------------

/**
 * Registra una cuenta nueva con correo y contrasena.
 * Devuelve { sesion, confirmacionPendiente }:
 *   · con la confirmacion de correo ACTIVADA en Supabase no hay sesion todavia:
 *     hay que abrir el enlace que llega por correo;
 *   · con la confirmacion DESACTIVADA la sesion se abre al instante.
 */
export async function registrarCuenta({ correo, clave, alias }) {
  const datos = await llamar((auth) =>
    auth.signUp({
      email: correo.trim(),
      password: clave,
      options: { data: { alias: alias.trim() }, emailRedirectTo: urlDeRetorno('/auth/callback') }
    })
  )

  // Con la confirmacion activada, Supabase NO devuelve error si el correo ya esta
  // registrado (para no revelar quien tiene cuenta): devuelve un usuario sin
  // identidades. Se reconoce asi para poder avisarlo.
  if (datos.user && Array.isArray(datos.user.identities) && datos.user.identities.length === 0) {
    throw new ErrorDeAuth(MENSAJES.user_already_exists, { codigo: 'user_already_exists' })
  }

  return { sesion: datos.session, confirmacionPendiente: !datos.session }
}

/**
 * Convierte la sesion de invitado en una cuenta permanente.
 *
 * Es updateUser, NO signUp: el usuario sigue siendo el mismo (mismo id), asi que
 * conserva su historial sin copiar nada desde el cliente ni crear otra cuenta.
 *
 *   · Con la confirmacion de correo activada, la contrasena queda guardada de
 *     inmediato pero el usuario sigue siendo "invitado" hasta que abre el enlace
 *     que llega al correo; ahi pasa a ser cuenta y toma el alias elegido.
 *   · Con la confirmacion desactivada la conversion es inmediata.
 *
 * Devuelve { convertida, confirmacionPendiente }.
 */
export async function convertirEnCuenta({ correo, clave, alias }) {
  const datos = await llamar((auth) =>
    auth.updateUser(
      { email: correo.trim(), password: clave, data: { alias: alias.trim() } },
      { emailRedirectTo: urlDeRetorno('/auth/callback') }
    )
  )

  const convertida = datos.user?.is_anonymous === false
  return { convertida, confirmacionPendiente: !convertida }
}

/** Vuelve a mandar el correo de confirmacion (registro o cambio de correo). */
export async function reenviarConfirmacion({ correo, tipo = 'signup' }) {
  await llamar((auth) =>
    auth.resend({
      type: tipo,
      email: correo.trim(),
      options: { emailRedirectTo: urlDeRetorno('/auth/callback') }
    })
  )
}

// ---------------------------------------------------------------------------
// Inicio y cierre de sesion
// ---------------------------------------------------------------------------

export async function iniciarSesion({ correo, clave }) {
  const datos = await llamar((auth) =>
    auth.signInWithPassword({ email: correo.trim(), password: clave })
  )
  return datos.session
}

/**
 * Cierra la sesion de ESTE dispositivo. 'local' a proposito: no cierra las
 * sesiones de la misma cuenta en otros dispositivos.
 */
export async function cerrarSesion() {
  try {
    await llamar((auth) => auth.signOut({ scope: 'local' }))
  } catch (error) {
    // Si el servidor no responde, igual se borra la sesion de este dispositivo.
    if (!(error instanceof ErrorDeAuth) || !error.reintentable) throw error
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Recuperacion de acceso
// ---------------------------------------------------------------------------

/**
 * Manda el correo para elegir una contrasena nueva. No dice si el correo tiene
 * cuenta o no: responde igual en los dos casos, para no revelar quien esta registrado.
 */
export async function pedirRecuperacion(correo) {
  await llamar((auth) =>
    auth.resetPasswordForEmail(correo.trim(), { redirectTo: urlDeRetorno('/auth/nueva-clave') })
  )
}

/** Cambia la contrasena de la sesion actual (la de recuperacion o la normal). */
export async function cambiarClave(clave) {
  await llamar((auth) => auth.updateUser({ password: clave }))
}
