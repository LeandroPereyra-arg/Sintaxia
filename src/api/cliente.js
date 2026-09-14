/**
 * Cliente de la API de Sintaxia.
 *
 * Todas las llamadas van con `credentials: 'include'` para que viaje la cookie
 * de sesion. Si la API no esta levantada no se rompe la app: se lanza un error
 * que los composables atrapan para seguir en modo invitado.
 */

const BASE = '/api'

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
  }
}

async function pedir(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      credentials: 'include',
      headers: opciones.cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      method: opciones.metodo ?? 'GET',
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
    })
  } catch {
    // La API no responde (no esta levantada, sin red...).
    throw new ErrorApi('No se pudo conectar con el servidor.', 0)
  }

  if (respuesta.status === 204) return null

  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    datos = null
  }

  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error ?? 'La peticion fallo.', respuesta.status)
  }
  return datos
}

export const api = {
  salud: () => pedir('/salud'),

  // --- sesion ---
  proveedores: () => pedir('/auth/proveedores'),
  yo: () => pedir('/auth/me'),
  entrarDemo: (nombre) => pedir('/auth/demo', { metodo: 'POST', cuerpo: { nombre } }),
  salir: () => pedir('/auth/logout', { metodo: 'POST' }),

  // --- perfil ---
  perfil: () => pedir('/perfil'),
  guardarPerfil: (cambios) => pedir('/perfil', { metodo: 'PUT', cuerpo: cambios }),
  medallas: () => pedir('/perfil/medallas'),
  actividad: (dias = 365) => pedir(`/perfil/actividad?dias=${dias}`),

  // --- progreso ---
  progreso: () => pedir('/progreso'),
  registrarLeccion: (leccionId, aciertos, total) =>
    pedir('/progreso/lecciones', { metodo: 'POST', cuerpo: { leccionId, aciertos, total } }),
  sincronizar: (lecciones) =>
    pedir('/progreso/sincronizar', { metodo: 'POST', cuerpo: { lecciones } }),

  // --- ranking ---
  ranking: (limite = 50) => pedir(`/ranking?limite=${limite}`)
}

/** URL a la que hay que mandar al navegador para iniciar sesion con un proveedor. */
export function urlLogin(proveedor, destino = '/perfil') {
  return `${BASE}/auth/${proveedor}?destino=${encodeURIComponent(destino)}`
}
