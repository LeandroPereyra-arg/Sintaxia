import { computed, reactive, watch } from 'vue'
import { unidadesJavaScript, ESTADO_UNIDAD } from '@/data/unidades.js'
import { leccionesDeUnidad, obtenerLeccion, lecciones } from '@/data/lecciones/index.js'

const CLAVE_ALMACENAMIENTO = 'sintaxia:progreso:v1'

/** Estado por defecto de un estudiante nuevo. */
function estadoInicial() {
  return {
    nombre: 'Estudiante',
    avatar: '👩‍💻',
    xp: 0,
    racha: 1,
    metaDiaria: 50,
    xpDeHoy: 0,
    ultimaFecha: new Date().toISOString().slice(0, 10),
    /** { [leccionId]: { aciertos, total, fecha } } */
    lecciones: {}
  }
}

/** Lee el progreso guardado en el navegador (si existe). */
function cargarEstado() {
  const base = estadoInicial()
  if (typeof localStorage === 'undefined') return base
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    return guardado ? { ...base, ...JSON.parse(guardado) } : base
  } catch {
    return base
  }
}

// Estado compartido por toda la aplicacion (una sola instancia).
const estado = reactive(cargarEstado())

watch(
  estado,
  (valor) => {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(valor))
    } catch {
      /* modo privado o almacenamiento lleno: el progreso solo vive en memoria */
    }
  },
  { deep: true }
)

/**
 * Estado y acciones de progreso del estudiante.
 * Se usa como un store minimo, sin dependencias externas.
 */
export function useProgreso() {
  /** Una leccion esta completada si fue resuelta al menos una vez. */
  function leccionCompletada(leccionId) {
    return Boolean(estado.lecciones[leccionId])
  }

  /** Cantidad de lecciones completadas dentro de una unidad. */
  function leccionesCompletadasDeUnidad(unidadId) {
    return leccionesDeUnidad(unidadId).filter((leccion) => leccionCompletada(leccion.id)).length
  }

  /** Porcentaje (0-100) de avance de una unidad. */
  function progresoUnidad(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    if (total === 0) return 0
    return Math.round((leccionesCompletadasDeUnidad(unidadId) / total) * 100)
  }

  function unidadCompletada(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    return total > 0 && leccionesCompletadasDeUnidad(unidadId) === total
  }

  /**
   * Estado real de una unidad: la primera siempre esta disponible y cada
   * unidad se desbloquea cuando la anterior queda completada.
   */
  function estadoUnidad(unidadId) {
    const indice = unidadesJavaScript.findIndex((unidad) => unidad.id === unidadId)
    if (indice === -1) return ESTADO_UNIDAD.BLOQUEADA
    if (unidadCompletada(unidadId)) return ESTADO_UNIDAD.COMPLETADA
    if (indice === 0) return ESTADO_UNIDAD.DISPONIBLE
    const anterior = unidadesJavaScript[indice - 1]
    return unidadCompletada(anterior.id) ? ESTADO_UNIDAD.DISPONIBLE : ESTADO_UNIDAD.BLOQUEADA
  }

  /** Una leccion se puede jugar si su unidad no esta bloqueada. */
  function leccionDisponible(leccionId) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return false
    return estadoUnidad(leccion.unidadId) !== ESTADO_UNIDAD.BLOQUEADA
  }

  /** Primera leccion sin completar (para el boton "Continuar"). */
  const proximaLeccion = computed(() => {
    return lecciones.find((leccion) => !leccionCompletada(leccion.id)) ?? null
  })

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

  /** Actualiza la racha diaria segun la fecha del ultimo ejercicio resuelto. */
  function actualizarRacha() {
    const hoy = new Date().toISOString().slice(0, 10)
    if (estado.ultimaFecha === hoy) return

    const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    estado.racha = estado.ultimaFecha === ayer ? estado.racha + 1 : 1
    estado.xpDeHoy = 0
    estado.ultimaFecha = hoy
  }

  /**
   * Registra el resultado de una leccion terminada.
   * Devuelve el XP ganado en esta ronda.
   */
  function completarLeccion(leccionId, { aciertos, total }) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return 0

    actualizarRacha()

    const yaCompletada = leccionCompletada(leccionId)
    const proporcion = total === 0 ? 0 : aciertos / total
    // La primera vez se gana el XP completo; al repetir, la mitad.
    const xpGanado = Math.round(leccion.xp * proporcion * (yaCompletada ? 0.5 : 1))

    const registroPrevio = estado.lecciones[leccionId]
    estado.lecciones[leccionId] = {
      aciertos: registroPrevio ? Math.max(registroPrevio.aciertos, aciertos) : aciertos,
      total,
      fecha: new Date().toISOString()
    }

    estado.xp += xpGanado
    estado.xpDeHoy += xpGanado
    return xpGanado
  }

  function actualizarPerfil({ nombre, avatar, metaDiaria }) {
    if (nombre !== undefined) estado.nombre = nombre
    if (avatar !== undefined) estado.avatar = avatar
    if (metaDiaria !== undefined) estado.metaDiaria = Number(metaDiaria)
  }

  function reiniciarProgreso() {
    Object.assign(estado, estadoInicial())
  }

  return {
    estado,
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
    reiniciarProgreso
  }
}
