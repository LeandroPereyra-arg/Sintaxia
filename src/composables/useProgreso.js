import { computed, reactive, ref, watch } from 'vue'
import { unidadesJavaScript, ESTADO_UNIDAD } from '@/data/unidades.js'
import { leccionesDeUnidad, obtenerLeccion, lecciones } from '@/data/lecciones/index.js'
import { api } from '@/api/cliente.js'
import { useAuth } from '@/composables/useAuth.js'

const CLAVE_ALMACENAMIENTO = 'sintaxia:progreso:v1'

/**
 * Progreso del estudiante.
 *
 * Funciona en dos modos:
 *   · invitado -> todo se guarda en localStorage (la app anda sin backend)
 *   · cuenta   -> la fuente de verdad es la API; el XP y las medallas los
 *                 calcula el servidor, que es el unico que puede otorgarlos
 *
 * El resto de la aplicacion usa siempre la misma interfaz, sin enterarse
 * de en cual de los dos esta.
 */

function estadoInicial() {
  return {
    modo: 'invitado',
    nombre: 'Estudiante',
    avatar: '👩‍💻',
    xp: 0,
    racha: 0,
    metaDiaria: 50,
    xpDeHoy: 0,
    ultimaFecha: new Date().toISOString().slice(0, 10),
    /** { [leccionId]: { aciertos, total, fecha } } */
    lecciones: {}
  }
}

function cargarDelNavegador() {
  const base = estadoInicial()
  if (typeof localStorage === 'undefined') return base
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    return guardado ? { ...base, ...JSON.parse(guardado), modo: 'invitado' } : base
  } catch {
    return base
  }
}

const estado = reactive(cargarDelNavegador())

/** Resultado de la ultima leccion, para la pantalla de resultados. */
const ultimoResultado = ref(null)

// En modo invitado el progreso se persiste en el navegador.
// En modo cuenta no se toca el localStorage: manda el servidor.
watch(
  estado,
  (valor) => {
    if (valor.modo !== 'invitado') return
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(valor))
    } catch {
      /* modo privado o almacenamiento lleno: el progreso solo vive en memoria */
    }
  },
  { deep: true }
)

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export function useProgreso() {
  const { estado: sesion, autenticado, refrescar } = useAuth()

  // ---------------------------------------------------------------
  // Consultas (identicas en los dos modos)
  // ---------------------------------------------------------------

  function leccionCompletada(leccionId) {
    return Boolean(estado.lecciones[leccionId])
  }

  function leccionesCompletadasDeUnidad(unidadId) {
    return leccionesDeUnidad(unidadId).filter((leccion) => leccionCompletada(leccion.id)).length
  }

  function progresoUnidad(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    if (total === 0) return 0
    return Math.round((leccionesCompletadasDeUnidad(unidadId) / total) * 100)
  }

  function unidadCompletada(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    return total > 0 && leccionesCompletadasDeUnidad(unidadId) === total
  }

  /** La unidad 1 siempre esta abierta; cada una se desbloquea al terminar la anterior. */
  function estadoUnidad(unidadId) {
    const indice = unidadesJavaScript.findIndex((unidad) => unidad.id === unidadId)
    if (indice === -1) return ESTADO_UNIDAD.BLOQUEADA
    if (unidadCompletada(unidadId)) return ESTADO_UNIDAD.COMPLETADA
    if (indice === 0) return ESTADO_UNIDAD.DISPONIBLE
    return unidadCompletada(unidadesJavaScript[indice - 1].id)
      ? ESTADO_UNIDAD.DISPONIBLE
      : ESTADO_UNIDAD.BLOQUEADA
  }

  function leccionDisponible(leccionId) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return false
    return estadoUnidad(leccion.unidadId) !== ESTADO_UNIDAD.BLOQUEADA
  }

  const proximaLeccion = computed(
    () => lecciones.find((leccion) => !leccionCompletada(leccion.id)) ?? null
  )

  const totalLeccionesCompletadas = computed(() => Object.keys(estado.lecciones).length)

  const progresoCurso = computed(() => {
    if (lecciones.length === 0) return 0
    return Math.round((totalLeccionesCompletadas.value / lecciones.length) * 100)
  })

  const precisionGeneral = computed(() => {
    const registros = Object.values(estado.lecciones)
    if (registros.length === 0) return 0
    const aciertos = registros.reduce((suma, r) => suma + r.aciertos, 0)
    const total = registros.reduce((suma, r) => suma + r.total, 0)
    return total === 0 ? 0 : Math.round((aciertos / total) * 100)
  })

  const metaCumplida = computed(() => estado.xpDeHoy >= estado.metaDiaria)

  const enCuenta = computed(() => estado.modo === 'cuenta')

  // ---------------------------------------------------------------
  // Modo cuenta: cargar y sincronizar con la API
  // ---------------------------------------------------------------

  /** Copia al estado local lo que devolvio el servidor. */
  function aplicarUsuario(usuario) {
    if (!usuario) return
    estado.nombre = usuario.nombre
    estado.avatar = usuario.avatarEmoji ?? estado.avatar
    estado.xp = usuario.xp
    estado.racha = usuario.racha
    estado.metaDiaria = usuario.metaDiaria
  }

  /** Progreso hecho como invitado, con el formato que espera la API. */
  function progresoInvitado() {
    return Object.entries(estado.lecciones).map(([leccionId, registro]) => ({
      leccionId,
      aciertos: registro.aciertos,
      total: registro.total
    }))
  }

  function limpiarProgresoInvitado() {
    try {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO)
    } catch {
      /* sin localStorage no hay nada que limpiar */
    }
  }

  /**
   * Pasa a modo cuenta: sube lo que hizo como invitado y despues se queda
   * con lo que diga el servidor.
   */
  async function cargarCuenta({ sincronizar = true } = {}) {
    if (!sesion.usuario) return

    let resumenSincronizacion = null
    if (sincronizar) {
      const pendientes = estado.modo === 'invitado' ? progresoInvitado() : []
      if (pendientes.length > 0) {
        try {
          resumenSincronizacion = await api.sincronizar(pendientes)
          limpiarProgresoInvitado()
          // La sincronizacion cambio el XP, la racha y las medallas del usuario,
          // asi que hay que volver a traerlo para no mostrar datos viejos.
          await refrescar()
        } catch {
          /* si falla la sincronizacion no perdemos nada: el local sigue ahi */
        }
      }
    }

    try {
      const progreso = await api.progreso()
      estado.modo = 'cuenta'
      estado.lecciones = progreso.lecciones
      estado.xpDeHoy = progreso.xpDeHoy
      estado.ultimaFecha = hoy()
      aplicarUsuario(sesion.usuario)
    } catch {
      /* si la API falla seguimos mostrando lo que ya teniamos */
    }

    return resumenSincronizacion
  }

  /** Vuelve a modo invitado (al cerrar sesion). */
  function volverAInvitado() {
    Object.assign(estado, estadoInicial())
    limpiarProgresoInvitado()
  }

  // ---------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------

  function actualizarRachaLocal() {
    const fecha = hoy()
    if (estado.ultimaFecha === fecha) return
    const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    estado.racha = estado.ultimaFecha === ayer ? estado.racha + 1 : 1
    estado.xpDeHoy = 0
    estado.ultimaFecha = fecha
  }

  /**
   * Registra una leccion aprobada.
   * En modo cuenta el XP y las medallas los decide el servidor.
   * Devuelve { xpGanado, medallasNuevas }.
   */
  async function completarLeccion(leccionId, { aciertos, total }) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return { xpGanado: 0, medallasNuevas: [] }

    if (autenticado.value && estado.modo === 'cuenta') {
      try {
        const respuesta = await api.registrarLeccion(leccionId, aciertos, total)
        estado.lecciones[leccionId] = {
          aciertos: Math.max(estado.lecciones[leccionId]?.aciertos ?? 0, aciertos),
          total,
          fecha: new Date().toISOString()
        }
        estado.xpDeHoy += respuesta.xpGanado
        // El servidor devuelve el usuario ya actualizado (XP, racha y liga):
        // lo guardamos para que la cabecera y el perfil no queden atrasados.
        sesion.usuario = respuesta.usuario
        aplicarUsuario(respuesta.usuario)

        const resultado = {
          xpGanado: respuesta.xpGanado,
          medallasNuevas: respuesta.medallasNuevas ?? []
        }
        ultimoResultado.value = { leccionId, ...resultado }
        return resultado
      } catch {
        // Si la API falla, guardamos local para no perderle la leccion al estudiante.
      }
    }

    // --- modo invitado ---
    actualizarRachaLocal()
    const yaCompletada = leccionCompletada(leccionId)
    const proporcion = total === 0 ? 0 : aciertos / total
    const xpGanado = Math.round(leccion.xp * proporcion * (yaCompletada ? 0.5 : 1))

    const previo = estado.lecciones[leccionId]
    estado.lecciones[leccionId] = {
      aciertos: previo ? Math.max(previo.aciertos, aciertos) : aciertos,
      total,
      fecha: new Date().toISOString()
    }
    estado.xp += xpGanado
    estado.xpDeHoy += xpGanado

    const resultado = { xpGanado, medallasNuevas: [] }
    ultimoResultado.value = { leccionId, ...resultado }
    return resultado
  }

  /** Cambia datos del perfil. En modo cuenta viaja a la API. */
  async function actualizarPerfil(cambios) {
    if (autenticado.value && estado.modo === 'cuenta') {
      const mapeado = {}
      if (cambios.nombre !== undefined) mapeado.nombre = cambios.nombre
      if (cambios.usuario !== undefined) mapeado.usuario = cambios.usuario
      if (cambios.bio !== undefined) mapeado.bio = cambios.bio
      if (cambios.pais !== undefined) mapeado.pais = cambios.pais
      if (cambios.avatar !== undefined) mapeado.avatarEmoji = cambios.avatar
      if (cambios.metaDiaria !== undefined) mapeado.metaDiaria = cambios.metaDiaria

      const { usuario } = await api.guardarPerfil(mapeado)
      sesion.usuario = usuario
      aplicarUsuario(usuario)
      return usuario
    }

    if (cambios.nombre !== undefined) estado.nombre = cambios.nombre
    if (cambios.avatar !== undefined) estado.avatar = cambios.avatar
    if (cambios.metaDiaria !== undefined) estado.metaDiaria = Number(cambios.metaDiaria)
    return null
  }

  /** Borra el progreso local. Solo tiene sentido en modo invitado. */
  function reiniciarProgreso() {
    Object.assign(estado, estadoInicial())
  }

  return {
    estado,
    ultimoResultado,
    enCuenta,
    // consultas
    leccionCompletada,
    leccionesCompletadasDeUnidad,
    progresoUnidad,
    unidadCompletada,
    estadoUnidad,
    leccionDisponible,
    proximaLeccion,
    totalLeccionesCompletadas,
    progresoCurso,
    precisionGeneral,
    metaCumplida,
    // acciones
    completarLeccion,
    actualizarPerfil,
    reiniciarProgreso,
    cargarCuenta,
    volverAInvitado
  }
}
