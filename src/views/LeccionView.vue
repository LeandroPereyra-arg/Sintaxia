<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraFeedback from '@/components/BarraFeedback.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import EjercicioOpcionMultiple from '@/components/ejercicios/EjercicioOpcionMultiple.vue'
import { obtenerLeccionConActividades, obtenerUnidad } from '@/servicios/contenido.js'
import {
  iniciarIntento,
  obtenerIntentoEnCurso,
  listarRespuestas,
  responderActividad,
  nuevoIdDeIntento,
  ESTADO_INTENTO
} from '@/servicios/progreso.js'
import { TIPO_EJERCICIO, ETIQUETA_TIPO_EJERCICIO } from '@/data/tiposEjercicio.js'
import { useProgreso } from '@/composables/useProgreso.js'
import { useAuth } from '@/composables/useAuth.js'
import { leerPendiente, anotarPendiente, borrarPendiente } from '@/utils/respuestaPendiente.js'

/**
 * Pantalla donde el estudiante resuelve las actividades de una leccion.
 *
 * Cada vez que se entra se trabaja sobre un INTENTO guardado en el servidor:
 * si habia uno en curso de esta leccion se retoma (en este dispositivo o en
 * otro); si no, se empieza uno nuevo. Con `?nuevo=1` se empieza de cero y el
 * anterior queda abandonado en el historial.
 *
 * La correccion NO se hace aca: al comprobar se le manda al servidor el intento,
 * la actividad y la opcion elegida (supabase/09-funciones-intentos.sql). El
 * servidor corrige, guarda la respuesta y devuelve el intento recalculado. Los
 * aciertos, las vidas y si la leccion quedo completada salen de esa respuesta.
 *
 * Estado del guardado de cada respuesta, siempre a la vista:
 *   enviando   -> se esta mandando
 *   guardado   -> el servidor la confirmo
 *   pendiente  -> no hubo conexion: NO se guardo todavia; se reenvia sola
 *   fallo      -> el servidor la rechazo (con el motivo)
 */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const route = useRoute()
const router = useRouter()
const { anotarIntento } = useProgreso()
const { usuario } = useAuth()

// Contenido
const leccion = ref(null)
const unidad = ref(null)
const cargando = ref(true)
const error = ref(null)
const ejercicios = computed(() => leccion.value?.ejercicios ?? [])

// Intento guardado en el servidor y sus respuestas: { [preguntaId]: respuesta }
const intento = ref(null)
const guardadas = ref({})
/** Id del intento que se esta pidiendo: si se reintenta, se manda el MISMO. */
let idPedido = null

// Actividad actual
const indice = ref(0)
const respuesta = ref(null)
const comprobado = ref(false)
const resultado = ref(null)

// Guardado de la respuesta actual: '', 'enviando', 'guardado', 'pendiente', 'fallo'
const envio = ref('')
const mensajeEnvio = ref('')

const ejercicio = computed(() => ejercicios.value[indice.value] ?? null)
const vidas = computed(() => intento.value?.vidas ?? 3)
const terminado = computed(() => intento.value && intento.value.estado !== ESTADO_INTENTO.EN_CURSO)
const correcta = computed(() => resultado.value?.correcta === true)

/** Cual era la opcion correcta, para pintarla una vez comprobada. */
const idCorrecto = computed(() => {
  if (!resultado.value) return null
  return resultado.value.correcta ? resultado.value.opcionId : resultado.value.opcionCorrectaId
})

const puedeComprobar = computed(
  () =>
    ejercicio.value !== null &&
    respuesta.value !== null &&
    envio.value !== 'enviando' &&
    !comprobado.value
)

const progreso = computed(() => {
  const total = intento.value?.total || ejercicios.value.length
  if (!total) return 0
  return Math.round(((intento.value?.respondidas ?? 0) / total) * 100)
})

const textoEstadoGuardado = computed(
  () =>
    ({
      enviando: 'Guardando...',
      guardado: 'Respuesta guardada',
      pendiente: 'Pendiente: sin conexion',
      fallo: 'No se guardo'
    })[envio.value] ?? ''
)

/** Titulo del error cuando el servidor no deja empezar (no es "no encontrado"). */
const tituloError = computed(
  () =>
    ({
      leccion_bloqueada: 'Esta leccion esta bloqueada',
      tope_invitado: 'Llegaste al limite de invitado',
      sin_sesion: 'Necesitas ingresar'
    })[error.value?.codigo] ?? null
)

/** Primera actividad (desde `desde`) que todavia no tiene respuesta guardada. */
function siguienteSinResponder(desde = 0) {
  const lista = ejercicios.value
  for (let i = desde; i < lista.length; i++) {
    if (!guardadas.value[lista[i].id]) return i
  }
  return -1
}

function limpiarActividad() {
  respuesta.value = null
  comprobado.value = false
  resultado.value = null
  envio.value = ''
  mensajeEnvio.value = ''
}

function irAResultados() {
  router.replace({
    name: 'resultados',
    params: { leccionId: props.leccionId },
    query: { intento: intento.value.id }
  })
}

/**
 * Retoma el intento en curso o empieza uno. El id del intento nuevo se genera
 * una sola vez: si la peticion falla y se reintenta, el servidor reconoce el id
 * y no crea un segundo intento.
 */
async function prepararIntento() {
  const empezarDeCero = route.query.nuevo === '1'
  let actual = null

  // Un pedido que quedo sin respuesta se repite con el mismo id, en vez de
  // buscar o crear otro.
  if (!idPedido && !empezarDeCero) {
    actual = await obtenerIntentoEnCurso(props.leccionId)
  }
  if (!actual) {
    idPedido ??= nuevoIdDeIntento()
    actual = await iniciarIntento(props.leccionId, idPedido)
  }
  idPedido = null
  // Ya se creo: si se recarga la pagina se retoma este, no se empieza otro.
  if (empezarDeCero) router.replace({ query: {} })

  intento.value = actual
  anotarIntento(actual)

  const lista = await listarRespuestas(actual.id)
  guardadas.value = Object.fromEntries(lista.map((r) => [r.preguntaId, r]))

  if (actual.estado !== ESTADO_INTENTO.EN_CURSO) {
    irAResultados()
    return
  }

  limpiarActividad()
  indice.value = Math.max(0, siguienteSinResponder())

  // Si quedo una respuesta sin confirmar (se corto la conexion o se cerro la
  // app), se reenvia sola.
  const pendiente = leerPendiente(usuario.value?.id)
  if (pendiente && pendiente.intentoId === actual.id) {
    if (pendiente.preguntaId === ejercicio.value?.id) {
      respuesta.value = pendiente.opcionId
      comprobar()
    } else {
      borrarPendiente()
    }
  }
}

async function cargar() {
  cargando.value = true
  error.value = null
  leccion.value = null
  unidad.value = null
  intento.value = null
  guardadas.value = {}
  try {
    const datos = await obtenerLeccionConActividades(props.leccionId)
    leccion.value = datos
    unidad.value = await obtenerUnidad(datos.unidadId)
    if (datos.ejercicios.length > 0) await prepararIntento()
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

watch(
  () => props.leccionId,
  () => {
    idPedido = null
    cargar()
  },
  { immediate: true }
)

/**
 * Manda la opcion elegida al servidor. `comprobado` se marca UNICAMENTE cuando
 * el servidor confirma, asi que apretar varias veces no suma de mas; y aunque
 * llegaran dos peticiones iguales, el servidor guarda una sola.
 */
async function comprobar() {
  if (!puedeComprobar.value || !intento.value) return

  const pedido = {
    usuarioId: usuario.value?.id,
    intentoId: intento.value.id,
    preguntaId: ejercicio.value.id,
    opcionId: respuesta.value
  }
  anotarPendiente(pedido)
  envio.value = 'enviando'
  mensajeEnvio.value = ''

  try {
    const r = await responderActividad(pedido.intentoId, pedido.preguntaId, pedido.opcionId)
    borrarPendiente()
    // Si la primera peticion habia llegado, vale la respuesta que quedo guardada.
    respuesta.value = r.opcionId
    resultado.value = r
    comprobado.value = true
    envio.value = 'guardado'
    guardadas.value = { ...guardadas.value, [r.preguntaId]: r }
    intento.value = r.intento
    anotarIntento(r.intento)
  } catch (e) {
    if (e?.sinConexion) {
      envio.value = 'pendiente'
      mensajeEnvio.value =
        'Sin conexion: tu respuesta todavia NO se guardo. Quedo pendiente en este dispositivo y se manda sola cuando vuelva la conexion.'
    } else {
      borrarPendiente()
      envio.value = 'fallo'
      mensajeEnvio.value = e?.message ?? 'No pudimos guardar tu respuesta.'
    }
  }
}

// Cuando vuelve la conexion, la respuesta pendiente se manda sola.
function alVolverLaConexion() {
  if (envio.value === 'pendiente') comprobar()
}
onMounted(() => window.addEventListener('online', alVolverLaConexion))
onBeforeUnmount(() => window.removeEventListener('online', alVolverLaConexion))

function continuar() {
  if (terminado.value) {
    irAResultados()
    return
  }
  const proxima = siguienteSinResponder(indice.value + 1)
  indice.value = proxima === -1 ? Math.max(0, siguienteSinResponder()) : proxima
  limpiarActividad()
}

/** Salir no borra nada: el intento queda en curso y se puede retomar. */
function salir() {
  router.push({ name: 'leccion', params: { leccionId: props.leccionId } })
}
</script>

<template>
  <div v-if="leccion && ejercicio && intento && !error" class="leccion">
    <!-- Barra superior -->
    <header class="leccion__barra">
      <div class="contenedor leccion__barra-interior">
        <button type="button" class="salir" aria-label="Salir de la leccion" @click="salir">
          <Icono nombre="cerrar" :tamano="18" :trazo="2.4" />
        </button>

        <BarraProgreso
          :valor="progreso"
          :color="unidad?.color ?? 'var(--c-verde)'"
          etiqueta="Progreso de la leccion"
        />

        <p class="vidas" :aria-label="`Te quedan ${vidas} vidas`" data-prueba="vidas">
          <Icono nombre="corazon" :tamano="17" :trazo="2.3" />{{ vidas }}
        </p>
      </div>
    </header>

    <!-- Actividad -->
    <section class="leccion__cuerpo contenedor">
      <p class="leccion__tipo">
        {{ ETIQUETA_TIPO_EJERCICIO[ejercicio.tipo] }} ·
        <span>ejercicio {{ indice + 1 }} de {{ ejercicios.length }} · intento {{ intento?.numero }}</span>
      </p>

      <h1 class="leccion__consigna">{{ ejercicio.consigna }}</h1>

      <pre v-if="ejercicio.codigo" class="bloque-codigo leccion__codigo">{{ ejercicio.codigo }}</pre>

      <EjercicioOpcionMultiple
        v-if="ejercicio.tipo === TIPO_EJERCICIO.OPCION_MULTIPLE"
        v-model="respuesta"
        :ejercicio="ejercicio"
        :bloqueado="comprobado || envio === 'enviando'"
        :id-correcto="idCorrecto"
      />
      <p v-else class="leccion__aviso">
        Este tipo de actividad todavia no esta disponible.
      </p>

      <!-- Estado del guardado: nunca se dice "guardado" sin la confirmacion del servidor -->
      <p
        v-if="envio"
        class="guardado"
        :class="`guardado--${envio}`"
        data-prueba="estado-guardado"
        :data-estado="envio"
        role="status"
      >
        <Icono
          :nombre="envio === 'guardado' ? 'checkCirculo' : envio === 'enviando' ? 'reloj' : 'alerta'"
          :tamano="16"
        />
        {{ textoEstadoGuardado }}
      </p>
      <!-- No se pudo guardar: la respuesta NO se cuenta como incorrecta -->
      <p v-if="mensajeEnvio" class="leccion__error" role="alert">
        <Icono nombre="alerta" :tamano="17" /> {{ mensajeEnvio }}
      </p>
    </section>

    <!-- Pie: comprobar o devolucion -->
    <BarraFeedback
      v-if="comprobado"
      :correcta="correcta"
      :explicacion="resultado?.explicacion ?? ''"
      :respuesta-correcta="resultado?.opcionCorrectaTexto ?? ''"
      :texto-boton="terminado ? 'Ver resultados' : 'Continuar'"
      @continuar="continuar"
    />

    <footer v-else class="leccion__pie">
      <div class="contenedor leccion__pie-interior">
        <BaseBoton variante="texto" @click="salir">Salir</BaseBoton>
        <BaseBoton
          tamano="grande"
          :deshabilitado="!puedeComprobar"
          @click="comprobar"
        >
          {{
            envio === 'enviando'
              ? 'Guardando...'
              : envio === 'pendiente' || envio === 'fallo'
                ? 'Reintentar'
                : 'Comprobar'
          }}
        </BaseBoton>
      </div>
    </footer>
  </div>

  <div v-else class="seccion contenedor">
    <EstadoConsulta
      :cargando="cargando"
      :error="error"
      :vacio="!cargando && !error && ejercicios.length === 0"
      texto-cargando="Preparando tu intento..."
      :titulo-error="tituloError"
      titulo-vacio="Esta leccion todavia no tiene actividades"
      texto-vacio="El equipo las esta preparando. Volve a mirar en unos dias."
      @reintentar="cargar"
    >
      <template #salida>
        <BaseBoton :to="{ name: 'cursos' }">Ver los cursos</BaseBoton>
      </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.leccion {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-blanco);
}

.leccion__barra {
  border-bottom: 2px solid var(--c-borde);
  padding-block: var(--e-2);
}

.leccion__barra-interior {
  display: flex;
  align-items: center;
  gap: var(--e-3);
}

.salir {
  font-size: var(--t-md);
  color: var(--c-gris-claro);
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--r-sm);
}

.salir:hover {
  color: var(--c-rojo);
  background: var(--c-rojo-suave);
}

.vidas {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 800;
  color: var(--c-rojo-osc);
}

.leccion__cuerpo {
  flex: 1;
  width: 100%;
  max-width: 720px;
  padding-block: var(--e-5);
  display: flex;
  flex-direction: column;
  gap: var(--e-3);
}

.leccion__tipo {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-violeta-osc);
}

.leccion__tipo span {
  color: var(--c-gris);
}

.leccion__consigna {
  font-size: var(--t-lg);
}

.leccion__codigo {
  margin-bottom: var(--e-1);
}

.leccion__aviso {
  color: var(--c-gris);
  font-weight: 600;
}

.guardado {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-size: var(--t-xs);
  font-weight: 800;
  border-radius: var(--r-pill, 999px);
  padding: 0.2rem 0.7rem;
  background: var(--c-fondo);
  color: var(--c-gris);
}

.guardado--guardado {
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.guardado--pendiente,
.guardado--fallo {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
}

.leccion__error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  color: var(--c-amarillo-osc);
  border-radius: var(--r-md);
  padding: var(--e-2) var(--e-3);
  font-weight: 700;
  font-size: var(--t-sm);
}

.leccion__pie {
  border-top: 2px solid var(--c-borde);
  padding-block: var(--e-3);
  background: var(--c-fondo);
}

.leccion__pie-interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e-2);
}
</style>
