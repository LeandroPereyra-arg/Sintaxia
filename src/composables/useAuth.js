import { computed, reactive } from 'vue'
import { hayConfiguracion } from '@/servicios/supabase.js'
import * as auth from '@/servicios/auth.js'
import { obtenerMiPerfil, guardarMiPerfil } from '@/servicios/perfiles.js'
import { etiquetaDe } from '@/utils/validaciones.js'
import { ErrorDeServicio } from '@/servicios/errores.js'

/**
 * Estado de la sesion, compartido por toda la app. Es la unica fuente de verdad
 * sobre "quien esta usando la app".
 *
 * Hay tres situaciones, y se ven distinto en pantalla:
 *
 *   SIN SESION  no ingreso nadie. Puede mirar los cursos, pero para hacer una
 *               leccion tiene que ingresar (aunque sea como invitado).
 *   INVITADO    sesion anonima: tiene un usuario propio, sin correo ni contrasena.
 *               Si cierra sesion, borra los datos del navegador o cambia de
 *               dispositivo, pierde el acceso a su historial.
 *   CUENTA      usuario con correo y contrasena. Su historial lo acompana a
 *               cualquier dispositivo.
 *
 * `estadoCarga`:
 *   'cargando'          todavia no se restauro la sesion guardada
 *   'listo'             ya se sabe si hay sesion o no
 *   'sin-configuracion' falta el .env: no se puede hablar con Supabase
 */
const estado = reactive({
  estadoCarga: 'cargando',
  sesion: null,
  perfil: null,
  errorPerfil: null,
  /** true despues de abrir el enlace de "olvide mi contrasena", hasta elegir la nueva. */
  enRecuperacion: false,
  error: null
})

let promesaInicial = null
let usuarioDelPerfil = null

async function cargarPerfil() {
  const id = estado.sesion?.user?.id ?? null
  if (!id) {
    estado.perfil = null
    estado.errorPerfil = null
    usuarioDelPerfil = null
    return
  }

  try {
    const perfil = await obtenerMiPerfil(id)
    // Si mientras tanto se cambio de usuario, esta respuesta ya no corresponde.
    if (estado.sesion?.user?.id !== id) return
    estado.perfil = perfil
    // Un usuario sin perfil no deberia existir (lo crea un disparador de la base), pero si
    // pasa se avisa en lugar de quedarse mostrando "Cargando..." para siempre.
    estado.errorPerfil = perfil
      ? null
      : new ErrorDeServicio('No encontramos tu perfil. Cerra sesion y volve a ingresar.', {
          codigo: 'sin_perfil'
        })
    usuarioDelPerfil = id
  } catch (error) {
    if (estado.sesion?.user?.id !== id) return
    estado.errorPerfil = error
  }
}

/**
 * Reacciona a cada cambio de sesion.
 *
 * Importante: dentro de este callback NO se puede esperar otra llamada a
 * Supabase (el cliente bloquea la sesion mientras corre el callback y la
 * llamada quedaria esperando para siempre). Por eso lo que necesita red se
 * agenda con setTimeout.
 */
function manejarCambio(evento, sesion) {
  estado.sesion = sesion

  if (evento === 'SIGNED_OUT') {
    estado.enRecuperacion = false
    estado.perfil = null
    usuarioDelPerfil = null
    return
  }

  if (evento === 'PASSWORD_RECOVERY') estado.enRecuperacion = true

  const cambioDeUsuario = (sesion?.user?.id ?? null) !== usuarioDelPerfil
  if (sesion && (cambioDeUsuario || evento === 'USER_UPDATED' || evento === 'SIGNED_IN')) {
    setTimeout(cargarPerfil, 0)
  }
}

export function useAuth() {
  const usuario = computed(() => estado.sesion?.user ?? null)
  const conSesion = computed(() => usuario.value !== null)
  const esInvitado = computed(() => usuario.value?.is_anonymous === true)
  const esCuenta = computed(() => conSesion.value && !esInvitado.value)
  const hayConfig = computed(() => hayConfiguracion)

  /** "Ana#0427". Mientras carga el perfil, un texto neutro. */
  const etiqueta = computed(() => {
    if (!conSesion.value) return ''
    return estado.perfil ? etiquetaDe(estado.perfil.alias, estado.perfil.codigo) : 'Cargando...'
  })

  /**
   * Restaura la sesion guardada y empieza a escuchar los cambios. Se llama una
   * sola vez; el router la espera antes de decidir si una ruta esta protegida.
   */
  function iniciar() {
    if (promesaInicial) return promesaInicial

    promesaInicial = (async () => {
      if (!hayConfiguracion) {
        estado.estadoCarga = 'sin-configuracion'
        return
      }

      auth.alCambiarSesion(manejarCambio)

      try {
        estado.sesion = await auth.obtenerSesion()
        if (estado.sesion) await cargarPerfil()
      } catch (error) {
        // Sin conexion al abrir: no se puede renovar la sesion; se informa y la app sigue.
        estado.error = error
        estado.sesion = null
      } finally {
        estado.estadoCarga = 'listo'
      }
    })()

    return promesaInicial
  }

  async function entrarComoInvitado() {
    await auth.entrarComoInvitado()
    await cargarPerfil()
  }

  async function iniciarSesion(datos) {
    await auth.iniciarSesion(datos)
    await cargarPerfil()
  }

  /** Registra una cuenta nueva. Devuelve { confirmacionPendiente }. */
  async function registrar(datos) {
    const resultado = await auth.registrarCuenta(datos)
    if (resultado.sesion) await cargarPerfil()
    return { confirmacionPendiente: resultado.confirmacionPendiente }
  }

  /** Convierte al invitado actual en cuenta. Devuelve { convertida, confirmacionPendiente }. */
  async function convertir(datos) {
    const resultado = await auth.convertirEnCuenta(datos)
    if (resultado.convertida) await refrescar()
    return resultado
  }

  async function cerrarSesion() {
    await auth.cerrarSesion()
    estado.sesion = null
    estado.perfil = null
    estado.enRecuperacion = false
    usuarioDelPerfil = null
  }

  /**
   * Vuelve a pedir el usuario al servidor y renueva el token. Sirve despues de
   * confirmar el correo (en este u otro dispositivo): el token viejo todavia dice
   * "invitado" hasta que se renueva.
   */
  async function refrescar() {
    estado.sesion = await auth.refrescarSesion()
    await cargarPerfil()
  }

  async function pedirRecuperacion(correo) {
    await auth.pedirRecuperacion(correo)
  }

  async function cambiarClave(clave) {
    await auth.cambiarClave(clave)
    estado.enRecuperacion = false
  }

  /** Cambia alias, avatar o meta diaria del perfil propio. */
  async function actualizarPerfil(cambios) {
    if (!usuario.value) return null
    estado.perfil = await guardarMiPerfil(usuario.value.id, cambios)
    return estado.perfil
  }

  return {
    estado,
    usuario,
    conSesion,
    esInvitado,
    esCuenta,
    hayConfig,
    etiqueta,
    iniciar,
    entrarComoInvitado,
    iniciarSesion,
    registrar,
    convertir,
    cerrarSesion,
    refrescar,
    pedirRecuperacion,
    cambiarClave,
    actualizarPerfil,
    recargarPerfil: cargarPerfil
  }
}
