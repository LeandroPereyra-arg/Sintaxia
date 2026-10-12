import { computed, effectScope, reactive, ref, watch } from 'vue'
import { ESTADO_UNIDAD } from '@/constantes/estados.js'
import { useCatalogo } from '@/composables/useCatalogo.js'
import { useAuth } from '@/composables/useAuth.js'
import { listarMisIntentos, registrarIntento, borrarMiHistorial } from '@/servicios/progreso.js'
import { SinSesion } from '@/servicios/errores.js'
import { calcularEstadisticas } from '@/utils/estadisticas.js'

/**
 * Porcentaje de aciertos necesario para APROBAR una leccion.
 *
 * Las reglas completas estan en docs/06-reglas-de-avance.md. En resumen:
 *   - completada: el estudiante termino todas las actividades de la leccion.
 *   - aprobada:   ademas acerto al menos este porcentaje.
 * Solo aprobar habilita la leccion siguiente.
 */
export const UMBRAL_APROBACION = 0.6

/**
 * Progreso de la persona que esta usando la app.
 *
 * Desde la etapa 4 sale del HISTORIAL guardado en Supabase (tabla
 * intentos_leccion), que pertenece al usuario de la sesion actual, sea invitado
 * o cuenta. No hay copia en el navegador: al cerrar sesion se descarta.
 *
 * De ese historial se calculan, con una funcion pura (utils/estadisticas.js), el
 * mejor resultado de cada leccion, el XP, la racha y el calendario.
 */

const historial = reactive({
  intentos: [],
  cargando: false,
  cargado: false,
  error: null
})

/** Resultado de la ultima leccion, para la pantalla de resultados. */
const ultimoResultado = ref(null)

let idDelHistorial = null

async function cargarHistorial() {
  const { estado: sesion } = useAuth()
  const id = sesion.sesion?.user?.id ?? null

  if (!id) {
    historial.intentos = []
    historial.cargado = false
    historial.error = null
    idDelHistorial = null
    return
  }

  historial.cargando = true
  historial.error = null
  try {
    const intentos = await listarMisIntentos()
    // Si mientras tanto cambio la sesion, esta respuesta ya no es de esta persona.
    if (useAuth().estado.sesion?.user?.id !== id) return
    historial.intentos = intentos
    historial.cargado = true
    idDelHistorial = id
  } catch (error) {
    if (useAuth().estado.sesion?.user?.id !== id) return
    historial.error = error
  } finally {
    historial.cargando = false
  }
}

// Cuando cambia la persona (entra, sale o se cambia de cuenta) cambia el historial.
//
// El watch va en un effectScope propio: creado dentro del setup de un componente
// se detendria cuando ese componente se desmonte, y tiene que vivir toda la sesion.
let observando = false
function observarSesion() {
  if (observando) return
  observando = true
  const { estado: sesion } = useAuth()
  effectScope(true).run(() => {
    watch(
      () => sesion.sesion?.user?.id ?? null,
      (id) => {
        if (id === idDelHistorial) return
        historial.intentos = []
        historial.cargado = false
        ultimoResultado.value = null
        cargarHistorial()
      },
      { immediate: true }
    )
  })
}

export function useProgreso() {
  observarSesion()

  const { estado: sesion, usuario, esCuenta } = useAuth()
  const { estado: catalogo, unidadesDelCurso, leccionesDeUnidad, obtenerLeccionCacheada: obtenerLeccion } =
    useCatalogo()

  // ---------------------------------------------------------------
  // Estadisticas derivadas del historial
  // ---------------------------------------------------------------

  const xpPorLeccion = computed(() =>
    Object.fromEntries(catalogo.lecciones.map((leccion) => [leccion.id, leccion.xp]))
  )

  const estadisticas = computed(() => calcularEstadisticas(historial.intentos, xpPorLeccion.value))

  /**
   * Vista simple del progreso, con los mismos nombres que usan las pantallas.
   * Los valores derivados se leen sin `.value` gracias a que `reactive` desenvuelve
   * los `computed`.
   */
  const estado = reactive({
    nombre: computed(() => sesion.perfil?.alias ?? 'Estudiante'),
    avatar: computed(() => sesion.perfil?.avatar ?? 'buho'),
    metaDiaria: computed(() => sesion.perfil?.metaDiaria ?? 50),
    xp: computed(() => estadisticas.value.xp),
    xpDeHoy: computed(() => estadisticas.value.xpDeHoy),
    racha: computed(() => estadisticas.value.racha),
    rachaMaxima: computed(() => estadisticas.value.rachaMaxima),
    /** { [leccionId]: { aciertos, total, fecha, intentos } } con el MEJOR resultado. */
    lecciones: computed(() => estadisticas.value.lecciones),
    /** [{ fecha, xp, lecciones }] por dia, para el calendario. */
    actividad: computed(() => estadisticas.value.actividad),
    cargando: computed(() => historial.cargando),
    cargado: computed(() => historial.cargado),
    error: computed(() => historial.error)
  })

  // ---------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------

  /** Termino todas las actividades, sin importar cuantas acerto. */
  function leccionCompletada(leccionId) {
    return Boolean(estado.lecciones[leccionId])
  }

  /** Ademas de terminarla, llego al umbral de aciertos. */
  function leccionAprobada(leccionId) {
    const registro = estado.lecciones[leccionId]
    if (!registro || !registro.total) return false
    return registro.aciertos / registro.total >= UMBRAL_APROBACION
  }

  /** Porcentaje de aciertos del mejor intento, para mostrarlo en pantalla. */
  function precisionLeccion(leccionId) {
    const registro = estado.lecciones[leccionId]
    if (!registro || !registro.total) return 0
    return Math.round((registro.aciertos / registro.total) * 100)
  }

  function leccionesCompletadasDeUnidad(unidadId) {
    return leccionesDeUnidad(unidadId).filter((leccion) => leccionCompletada(leccion.id)).length
  }

  function leccionesAprobadasDeUnidad(unidadId) {
    return leccionesDeUnidad(unidadId).filter((leccion) => leccionAprobada(leccion.id)).length
  }

  function progresoUnidad(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    if (total === 0) return 0
    return Math.round((leccionesAprobadasDeUnidad(unidadId) / total) * 100)
  }

  /**
   * Una unidad esta completa cuando todas sus lecciones estan APROBADAS.
   * Terminarlas sin llegar al umbral no alcanza: eso es lo que separa
   * "completada" de "aprobada".
   */
  function unidadCompletada(unidadId) {
    const total = leccionesDeUnidad(unidadId).length
    return total > 0 && leccionesAprobadasDeUnidad(unidadId) === total
  }

  /**
   * La primera unidad siempre esta abierta; cada una se desbloquea al terminar
   * la anterior. Una unidad sin lecciones publicadas se muestra aparte: no esta
   * bloqueada por el progreso, todavia no tiene contenido cargado.
   */
  function estadoUnidad(unidadId) {
    const unidades = unidadesDelCurso()
    const indice = unidades.findIndex((unidad) => unidad.id === unidadId)
    if (indice === -1) return ESTADO_UNIDAD.BLOQUEADA
    if (leccionesDeUnidad(unidadId).length === 0) return ESTADO_UNIDAD.SIN_CONTENIDO
    if (unidadCompletada(unidadId)) return ESTADO_UNIDAD.COMPLETADA
    if (indice === 0) return ESTADO_UNIDAD.DISPONIBLE
    return unidadCompletada(unidades[indice - 1].id)
      ? ESTADO_UNIDAD.DISPONIBLE
      : ESTADO_UNIDAD.BLOQUEADA
  }

  /**
   * Una leccion se puede abrir si su unidad no esta bloqueada y ademas:
   *   - es la primera de la unidad, o
   *   - la leccion anterior ya esta APROBADA, o
   *   - ya la habia completado antes (para poder repasarla cuando quiera).
   */
  function leccionDisponible(leccionId) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return false
    const estadoDeLaUnidad = estadoUnidad(leccion.unidadId)
    if (estadoDeLaUnidad === ESTADO_UNIDAD.BLOQUEADA) return false
    if (estadoDeLaUnidad === ESTADO_UNIDAD.SIN_CONTENIDO) return false
    if (leccionCompletada(leccionId)) return true

    const hermanas = leccionesDeUnidad(leccion.unidadId)
    const indice = hermanas.findIndex((l) => l.id === leccionId)
    if (indice <= 0) return true
    return leccionAprobada(hermanas[indice - 1].id)
  }

  /** Motivo por el que una leccion esta bloqueada, para poder explicarlo. */
  function motivoBloqueo(leccionId) {
    const leccion = obtenerLeccion(leccionId)
    if (!leccion) return 'Esa leccion no existe.'
    if (estadoUnidad(leccion.unidadId) === ESTADO_UNIDAD.BLOQUEADA) {
      return 'Primero tenes que completar la unidad anterior.'
    }
    const hermanas = leccionesDeUnidad(leccion.unidadId)
    const indice = hermanas.findIndex((l) => l.id === leccionId)
    if (indice > 0 && !leccionAprobada(hermanas[indice - 1].id)) {
      return `Primero tenes que aprobar la leccion "${hermanas[indice - 1].titulo}".`
    }
    return ''
  }

  /** Primera leccion sin aprobar que ademas se pueda abrir. */
  const proximaLeccion = computed(
    () =>
      catalogo.lecciones.find(
        (leccion) => !leccionAprobada(leccion.id) && leccionDisponible(leccion.id)
      ) ?? null
  )

  const totalLeccionesCompletadas = computed(() => Object.keys(estado.lecciones).length)

  const progresoCurso = computed(() => {
    const total = catalogo.lecciones.length
    if (total === 0) return 0
    return Math.round((totalLeccionesCompletadas.value / total) * 100)
  })

  const precisionGeneral = computed(() => {
    const registros = Object.values(estado.lecciones)
    if (registros.length === 0) return 0
    const aciertos = registros.reduce((suma, r) => suma + r.aciertos, 0)
    const total = registros.reduce((suma, r) => suma + r.total, 0)
    return total === 0 ? 0 : Math.round((aciertos / total) * 100)
  })

  const metaCumplida = computed(() => estado.xpDeHoy >= estado.metaDiaria)

  // ---------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------

  /**
   * Guarda una leccion terminada en el historial de la persona.
   * Devuelve { xpGanado, medallasNuevas }. Si no se pudo guardar lanza el error:
   * la pantalla no pierde el resultado y puede ofrecer reintentar.
   */
  async function completarLeccion(leccionId, { aciertos, total }) {
    if (!usuario.value) throw new SinSesion()

    const xpAntes = estado.xp
    const intento = await registrarIntento(leccionId, aciertos, total)
    historial.intentos = [...historial.intentos, intento]

    const resultado = { xpGanado: Math.max(0, estado.xp - xpAntes), medallasNuevas: [] }
    ultimoResultado.value = { leccionId, ...resultado }
    return resultado
  }

  /** Borra todo el historial propio. */
  async function reiniciarProgreso() {
    if (!usuario.value) throw new SinSesion()
    await borrarMiHistorial(usuario.value.id)
    historial.intentos = []
  }

  return {
    estado,
    ultimoResultado,
    esCuenta,
    // consultas
    leccionCompletada,
    leccionAprobada,
    precisionLeccion,
    motivoBloqueo,
    leccionesCompletadasDeUnidad,
    leccionesAprobadasDeUnidad,
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
    reiniciarProgreso,
    recargarHistorial: cargarHistorial
  }
}
