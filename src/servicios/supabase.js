/**
 * Configuracion del cliente de Supabase.
 *
 * Es el UNICO lugar del proyecto donde se crea la conexion. Ninguna pantalla
 * crea su propio cliente ni conoce la URL ni la clave: todo pasa por aca y,
 * despues, por `src/servicios/contenido.js`.
 *
 * Las variables se leen del entorno (ver .env.example). Las variables que
 * empiezan con VITE_ terminan dentro del paquete que se descarga el navegador,
 * asi que NO son secretas: aca solo va la clave publicable, que esta limitada
 * por las politicas de RLS de la base. La clave service_role no aparece nunca
 * en el front-end.
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()

// Supabase llamo "anon key" a esta clave durante anios y ahora la llama
// "publishable key". Se aceptan los dos nombres para que un .env viejo siga
// funcionando.
const clave = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim()

/** true cuando el .env tiene lo necesario para hablar con Supabase. */
export const hayConfiguracion = Boolean(url && clave)

/** Mensaje que se le muestra al usuario si falta configurar el proyecto. */
export const MENSAJE_SIN_CONFIGURACION =
  'Falta configurar la conexion con Supabase. Copia .env.example a .env y ' +
  'completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.'

if (!hayConfiguracion && import.meta.env.DEV) {
  console.warn(`[Sintaxia] ${MENSAJE_SIN_CONFIGURACION}`)
}

/**
 * Direccion a la que vuelven los enlaces de los correos (confirmacion, cambio de
 * correo, recuperacion de contrasena).
 *
 *   · En la web es el propio sitio: window.location.origin.
 *   · En la app movil (APK) hay que fijar el esquema que abre la app, por ejemplo
 *     VITE_URL_RETORNO_AUTH=sintaxia://auth, y cargarlo ademas en el panel de
 *     Supabase (Authentication -> URL Configuration -> Redirect URLs). Si la
 *     direccion no esta en esa lista, Supabase ignora el pedido y manda al
 *     "Site URL".
 */
export function urlDeRetorno(ruta = '/auth/callback') {
  const base = (import.meta.env.VITE_URL_RETORNO_AUTH ?? '').trim().replace(/\/$/, '')
  if (base) return `${base}${ruta}`
  return `${window.location.origin}${ruta}`
}

/**
 * Cliente compartido.
 *
 * Si falta la configuracion no se crea: los servicios avisan con un error claro
 * en lugar de dejar que el cliente falle con un mensaje incomprensible.
 *
 * Sesion (etapa 4):
 *   · persistSession / autoRefreshToken: la sesion se guarda en el dispositivo y
 *     se renueva sola, asi que al volver a abrir la app se restaura.
 *   · detectSessionInUrl: al volver desde un enlace de correo, el cliente lee el
 *     codigo de la direccion y abre la sesion.
 *   · flowType 'pkce': los enlaces de los correos traen un codigo de un solo uso
 *     que solo sirve en el dispositivo que lo pidio, en lugar de dejar los
 *     tokens a la vista en la direccion. Es lo que Supabase recomienda para
 *     apps moviles. Consecuencia: abrir el enlace en OTRO dispositivo confirma el
 *     correo pero no inicia la sesion alli; hay que ingresar con la contrasena.
 */
export const supabase = hayConfiguracion
  ? createClient(url, clave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sintaxia:sesion'
      },
      db: { schema: 'public' }
    })
  : null
