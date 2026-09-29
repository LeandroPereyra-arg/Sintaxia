/**
 * Configuracion del cliente de Supabase.
 *
 * Es el UNICO lugar del proyecto donde se crea la conexion. Ninguna pantalla
 * crea su propio cliente ni conoce la URL ni la clave: todo pasa por aca y,
 * despues, por `src/servicios/contenido.js`.
 *
 * Las dos variables se leen del entorno (ver .env.example). Las variables que
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
 * Cliente compartido.
 *
 * Si falta la configuracion no se crea: `contenido.js` avisa con un error
 * claro en lugar de dejar que el cliente falle con un mensaje incomprensible.
 *
 * `persistSession: false` porque las cuentas de Sintaxia las maneja la API
 * propia (etapa 2); de Supabase, por ahora, solo se usa el contenido.
 */
export const supabase = hayConfiguracion
  ? createClient(url, clave, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' }
    })
  : null
