import { computed, reactive } from 'vue'
import { api } from '@/api/cliente.js'

/**
 * Estado de la sesion, compartido por toda la app.
 *
 * `estadoCarga` distingue tres situaciones que se ven distinto en pantalla:
 *   'cargando'  -> todavia no sabemos si hay sesion
 *   'listo'     -> ya preguntamos (haya usuario o no)
 *   'sin-api'   -> el servidor no responde: la app sigue en modo invitado
 */
const estado = reactive({
  usuario: null,
  proveedores: [],
  estadoCarga: 'cargando',
  error: null
})

let promesaInicial = null

export function useAuth() {
  const autenticado = computed(() => estado.usuario !== null)
  const invitado = computed(() => estado.usuario === null)
  const hayApi = computed(() => estado.estadoCarga !== 'sin-api')

  /** Consulta la sesion actual. Se llama una sola vez al arrancar la app. */
  async function iniciar() {
    if (promesaInicial) return promesaInicial

    promesaInicial = (async () => {
      try {
        const [sesion, proveedores] = await Promise.all([api.yo(), api.proveedores()])
        estado.usuario = sesion.usuario
        estado.proveedores = proveedores.proveedores
        estado.estadoCarga = 'listo'
      } catch (error) {
        // Sin API la aplicacion funciona igual, guardando en el navegador.
        estado.usuario = null
        estado.proveedores = []
        estado.estadoCarga = 'sin-api'
        estado.error = error.message
      }
    })()

    return promesaInicial
  }

  /** Vuelve a pedir los datos del usuario (despues de editar el perfil, por ejemplo). */
  async function refrescar() {
    try {
      const sesion = await api.yo()
      estado.usuario = sesion.usuario
    } catch {
      /* si falla, dejamos el usuario que ya teniamos */
    }
  }

  function establecerUsuario(usuario) {
    estado.usuario = usuario
  }

  async function entrarDemo(nombre) {
    const { usuario } = await api.entrarDemo(nombre)
    estado.usuario = usuario
    return usuario
  }

  async function salir() {
    try {
      await api.salir()
    } finally {
      estado.usuario = null
    }
  }

  return {
    estado,
    autenticado,
    invitado,
    hayApi,
    iniciar,
    refrescar,
    establecerUsuario,
    entrarDemo,
    salir
  }
}
