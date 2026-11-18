/**
 * Integracion con Android cuando la app corre empaquetada con Capacitor (etapa 8).
 *
 * En el navegador no hace nada: Capacitor.isNativePlatform() es false y el plugin
 * de la app ni siquiera se descarga.
 *
 * En el APK:
 *   · Boton Atras de Android: vuelve a la pantalla anterior, como el boton del
 *     navegador. En el inicio (o sin historial) minimiza la app en lugar de
 *     cerrarla, asi al volver sigue donde estaba y con la sesion abierta.
 *   · Enlaces de los correos: confirmar la cuenta y recuperar la contrasena
 *     vuelven a sintaxia://auth/... (VITE_URL_RETORNO_AUTH). Android abre la app
 *     con esa direccion; aca se pasa a la ruta equivalente de la app
 *     (/auth/callback o /auth/nueva-clave) recargando la vista, para que el
 *     cliente de Supabase lea el codigo de la direccion igual que en la web
 *     (detectSessionInUrl). El codigo es de un solo uso y solo sirve en el
 *     celular que lo pidio (PKCE).
 */
import { Capacitor } from '@capacitor/core'

/** Rutas a las que puede llevar un enlace de correo. Cualquier otra se ignora. */
const RUTAS_DE_RETORNO = ['/auth/callback', '/auth/nueva-clave']
const CLAVE_ULTIMO_ENLACE = 'sintaxia:ultimo-enlace'

/**
 * Convierte sintaxia://auth/auth/callback?code=... en /auth/callback?code=...
 * Devuelve null si la direccion no es un retorno de autenticacion conocido.
 */
export function rutaDesdeEnlace(enlace, esquema = 'sintaxia') {
  let url
  try {
    url = new URL(enlace)
  } catch {
    return null
  }
  if (url.protocol !== `${esquema}:` || url.hostname !== 'auth') return null
  const ruta = url.pathname.replace(/\/+$/, '')
  if (!RUTAS_DE_RETORNO.includes(ruta)) return null
  return `${ruta}${url.search}${url.hash}`
}

export const esNativo = () => Capacitor.isNativePlatform()

export async function iniciarNativo(router) {
  if (!esNativo()) return
  const { App } = await import('@capacitor/app')

  App.addListener('backButton', async () => {
    const ruta = router.currentRoute.value
    // vue-router guarda en history.state la pantalla anterior (back).
    if (ruta.name !== 'inicio' && window.history.state?.back) {
      router.back()
      return
    }
    if (ruta.name !== 'inicio') {
      // Sin historial (se abrio desde un enlace): ir al inicio. Si el inicio
      // redirige a esta misma pantalla (la bienvenida), no hay a donde volver.
      await router.replace({ name: 'inicio' }).catch(() => {})
      if (router.currentRoute.value.fullPath !== ruta.fullPath) return
    }
    App.minimizeApp()
  })

  const abrirEnlace = (enlace) => {
    const ruta = enlace && rutaDesdeEnlace(enlace)
    if (!ruta) return
    // Despues de recargar, getLaunchUrl() vuelve a dar el mismo enlace: se
    // recuerda el ultimo abierto para no recargar en bucle.
    try {
      if (sessionStorage.getItem(CLAVE_ULTIMO_ENLACE) === enlace) return
      sessionStorage.setItem(CLAVE_ULTIMO_ENLACE, enlace)
    } catch {
      // sin almacenamiento: se abre igual (el codigo es de un solo uso)
    }
    window.location.replace(ruta)
  }

  // Con la app abierta llega como evento; con la app cerrada, como direccion de inicio.
  App.addListener('appUrlOpen', ({ url }) => abrirEnlace(url))
  const inicio = await App.getLaunchUrl()
  abrirEnlace(inicio?.url)
}
