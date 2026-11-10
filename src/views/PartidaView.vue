<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import BarraFeedback from '@/components/BarraFeedback.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import EjercicioOpcionMultiple from '@/components/ejercicios/EjercicioOpcionMultiple.vue'
import {
  iniciarPartida,
  obtenerPartida,
  responderPartida,
  finalizarPartida,
  ESTADO_PARTIDA
} from '@/servicios/competencia.js'
import { nuevoIdDeIntento } from '@/servicios/progreso.js'

/**
 * Pantalla de una partida de competencia.
 *
 * El SERVIDOR crea la partida, fija sus preguntas, mide el tiempo, corrige y
 * suma los puntos (supabase/12-funciones-competencia.sql). Esta pantalla solo
 * manda que pregunta y que opcion, y muestra lo que el servidor confirmo.
 *
 * El tiempo: el servidor dice cuantos segundos quedan en cada respuesta, y aca
 * se cuenta hacia atras desde ese dato con el reloj monotono del navegador
 * (performance.now), que no cambia si se toca la hora del celular. Cuando la
 * cuenta llega a cero se pide el cierre, y el servidor decide si la partida
 * quedo finalizada o vencida con SU reloj.
 *
 * Reconexion: la partida queda en la direccion (?partida=id). Si se recarga o
 * se corta la conexion, se vuelve a pedir y se sigue donde estaba, con el
 * tiempo que de verdad queda (el reloj no se detiene mientras no hay conexion).
 */
const props = defineProps({
  eventoId: { type: String, required: true },
  desafioId: { type: String, required: true }
})

const route = useRoute()
const router = useRouter()

const partida = ref(null)
const cargando = ref(true)
const error = ref(null)
/** Id de la partida que se esta pidiendo: un reintento manda el mismo. */
let idPedido = null

const indice = ref(0)
const respuesta = ref(null)
const resultado = ref(null)
/** '', 'enviando', 'guardado', 'pendiente', 'fallo' */
const envio = ref('')
const mensajeEnvio = ref('')
const terminando = ref(false)

// --- Tiempo -----------------------------------------------------------------
const limite = ref(null) // performance.now() en el que vence, segun el servidor
const ahora = ref(performance.now())
let reloj = null

const segundosRestantes = computed(() =>
  limite.value == null ? null : Math.max(0, Math.ceil((limite.value - ahora.value) / 1000))
)
const textoTiempo = computed(() => {
  const s = segundosRestantes.value ?? 0
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const poco = computed(() => segundosRestantes.value != null && segundosRestantes.value <= 10)

function sincronizarTiempo(p) {
  if (p?.estado === ESTADO_PARTIDA.EN_CURSO && p.segundosRestantes != null) {
    limite.value = performance.now() + p.segundosRestantes * 1000
  }
}

// --- Preguntas ----------------------------------------------------------------
const preguntas = computed(() => partida.value?.preguntas ?? [])
const pregunta = computed(() => preguntas.value[indice.value] ?? null)
const sinResponder = computed(() => preguntas.value.filter((q) => !q.respuesta).length)
const progreso = computed(() =>
  partida.value?.total ? Math.round((partida.value.respondidas / partida.value.total) * 100) : 0
)
const comprobado = computed(() => resultado.value !== null)
const puedeEnviar = computed(
  () => pregunta.value && respuesta.value && envio.value !== 'enviando' && !comprobado.value
)

function siguienteSinResponder(desde = 0) {
  for (let i = desde; i < preguntas.value.length; i++) if (!preguntas.value[i].respuesta) return i
  for (let i = 0; i < desde; i++) if (!preguntas.value[i].respuesta) return i
  return -1
}

function limpiar() {
  respuesta.value = null
  resultado.value = null
  envio.value = ''
  mensajeEnvio.value = ''
}

function irAlResultado() {
  router.replace({
    name: 'resultado-partida',
    params: { eventoId: props.eventoId, partidaId: partida.value.id }
  })
}

function aplicar(p) {
  partida.value = p
  sincronizarTiempo(p)
  if (p.estado !== ESTADO_PARTIDA.EN_CURSO) {
    irAlResultado()
    return false
  }
  return true
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    let p
    if (route.query.partida) {
      p = await obtenerPartida(String(route.query.partida))
    } else {
      idPedido ??= nuevoIdDeIntento()
      p = await iniciarPartida(props.desafioId, idPedido)
      idPedido = null
      // Queda en la direccion: recargar retoma esta partida, no empieza otra.
      router.replace({ query: { partida: p.id } })
    }
    if (p.desafioId !== props.desafioId) throw new Error('Esa partida es de otro desafio.')
    if (aplicar(p)) {
      limpiar()
      indice.value = Math.max(0, siguienteSinResponder())
    }
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

watch(() => props.desafioId, () => {
  idPedido = null
  cargar()
}, { immediate: true })

// --- Responder ------------------------------------------------------------------
async function enviar() {
  if (!puedeEnviar.value) return
  const pedido = { preguntaId: pregunta.value.id, opcionId: respuesta.value }
  envio.value = 'enviando'
  mensajeEnvio.value = ''
  try {
    const r = await responderPartida(partida.value.id, pedido.preguntaId, pedido.opcionId)
    // Si el primer envio ya habia llegado, vale lo que quedo guardado.
    respuesta.value = r.opcionId
    resultado.value = r
    envio.value = 'guardado'
    const actual = preguntas.value.map((q) =>
      q.id === r.preguntaId ? { ...q, respuesta: { opcionId: r.opcionId, correcta: r.correcta, puntos: r.puntos } } : q
    )
    partida.value = { ...r.partida, preguntas: actual }
    sincronizarTiempo(r.partida)
  } catch (e) {
    if (e?.sinConexion) {
      envio.value = 'pendiente'
      mensajeEnvio.value =
        'Sin conexion: tu respuesta todavia NO llego. El tiempo sigue corriendo; se manda sola cuando vuelva la conexion.'
    } else if (e?.codigo === 'partida_vencida' || e?.codigo === 'partida_cerrada') {
      await cerrar()
    } else {
      envio.value = 'fallo'
      mensajeEnvio.value = e?.message ?? 'No pudimos enviar tu respuesta.'
    }
  }
}

function continuar() {
  if (partida.value.estado !== ESTADO_PARTIDA.EN_CURSO) {
    irAlResultado()
    return
  }
  const proxima = siguienteSinResponder(indice.value + 1)
  if (proxima !== -1) indice.value = proxima
  limpiar()
}

/** Cierra la partida en el servidor (Terminar, o se acabo el tiempo). */
async function cerrar() {
  if (terminando.value || !partida.value) return
  terminando.value = true
  try {
    const p = await finalizarPartida(partida.value.id)
    partida.value = { ...p, preguntas: preguntas.value }
    irAlResultado()
  } catch (e) {
    mensajeEnvio.value = e?.sinConexion
      ? 'Sin conexion: no pudimos cerrar la partida. Reintentamos cuando vuelva la conexion.'
      : (e?.message ?? 'No pudimos cerrar la partida.')
    envio.value = e?.sinConexion ? 'pendiente' : 'fallo'
  } finally {
    terminando.value = false
  }
}

function terminar() {
  const faltan = sinResponder.value
  if (faltan > 0) {
    const seguro = window.confirm(
      `Te faltan ${faltan} ${faltan === 1 ? 'pregunta' : 'preguntas'}. Si terminas ahora, cuentan como no respondidas. Terminar igual?`
    )
    if (!seguro) return
  }
  cerrar()
}

function alVolverLaConexion() {
  if (envio.value !== 'pendiente') return
  if (segundosRestantes.value === 0) cerrar()
  else if (resultado.value === null && respuesta.value) enviar()
  else cargar()
}

onMounted(() => {
  window.addEventListener('online', alVolverLaConexion)
  reloj = setInterval(() => {
    ahora.value = performance.now()
    if (segundosRestantes.value === 0 && partida.value?.estado === ESTADO_PARTIDA.EN_CURSO && !terminando.value) {
      cerrar()
    }
  }, 250)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', alVolverLaConexion)
  clearInterval(reloj)
})

const tituloError = computed(
  () =>
    ({
      sin_intentos: 'No te quedan intentos',
      evento_cerrado: 'El evento no esta abierto',
      desafio_no_disponible: 'Desafio no disponible'
    })[error.value?.codigo] ?? null
)
</script>

<template>
  <div v-if="partida && pregunta && !error" class="partida">
    <header class="partida__barra">
      <div class="contenedor partida__barra-interior">
        <BarraProgreso :valor="progreso" color="var(--c-violeta)" etiqueta="Preguntas respondidas" />
        <p class="tiempo" :class="{ 'tiempo--poco': poco }" data-prueba="tiempo" role="timer" aria-live="off">
          <Icono nombre="reloj" :tamano="17" /> {{ textoTiempo }}
        </p>
        <p class="puntaje" data-prueba="puntaje">{{ partida.puntaje }} pts</p>
      </div>
    </header>

    <section class="partida__cuerpo contenedor">
      <p class="partida__tipo">
        Pregunta {{ indice + 1 }} de {{ preguntas.length }} · partida {{ partida.numero }}
      </p>
      <h1 class="partida__consigna">{{ pregunta.enunciado }}</h1>
      <pre v-if="pregunta.codigo" class="bloque-codigo">{{ pregunta.codigo }}</pre>

      <EjercicioOpcionMultiple
        v-model="respuesta"
        :ejercicio="pregunta"
        :bloqueado="comprobado || envio === 'enviando'"
        :id-correcto="resultado?.correcta ? resultado.opcionId : null"
      />

      <p
        v-if="envio"
        class="guardado"
        :class="`guardado--${envio}`"
        data-prueba="estado-envio"
        :data-estado="envio"
        role="status"
      >
        {{
          { enviando: 'Enviando...', guardado: 'Respuesta registrada', pendiente: 'Pendiente: sin conexion', fallo: 'No se registro' }[envio]
        }}
      </p>
      <p v-if="mensajeEnvio" class="partida__error" role="alert">
        <Icono nombre="alerta" :tamano="17" /> {{ mensajeEnvio }}
      </p>
    </section>

    <BarraFeedback
      v-if="comprobado"
      :correcta="resultado.correcta"
      :explicacion="resultado.correcta ? `+${resultado.puntos} puntos` : 'No suma puntos.'"
      :texto-boton="partida.estado === 'en_curso' ? 'Siguiente' : 'Ver mi puntaje'"
      @continuar="continuar"
    />

    <footer v-else class="partida__pie">
      <div class="contenedor partida__pie-interior">
        <BaseBoton variante="texto" :deshabilitado="terminando" @click="terminar">
          {{ terminando ? 'Terminando...' : 'Terminar' }}
        </BaseBoton>
        <BaseBoton tamano="grande" :deshabilitado="!puedeEnviar" @click="enviar">
          {{ envio === 'enviando' ? 'Enviando...' : envio === 'pendiente' || envio === 'fallo' ? 'Reintentar' : 'Responder' }}
        </BaseBoton>
      </div>
    </footer>
  </div>

  <div v-else class="seccion contenedor">
    <EstadoConsulta
      :cargando="cargando"
      :error="error"
      :titulo-error="tituloError"
      texto-cargando="Preparando tu partida..."
      @reintentar="cargar"
    >
      <template #salida>
        <BaseBoton :to="{ name: 'evento', params: { eventoId } }">Volver al evento</BaseBoton>
      </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.partida {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-blanco);
}

.partida__barra {
  border-bottom: 2px solid var(--c-borde);
  padding-block: var(--e-2);
}

.partida__barra-interior {
  display: flex;
  align-items: center;
  gap: var(--e-3);
}

.tiempo,
.puntaje {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tiempo--poco {
  color: var(--c-rojo-osc);
  animation: latido 1s infinite;
}

.puntaje {
  color: var(--c-violeta-osc);
}

.partida__cuerpo {
  flex: 1;
  width: 100%;
  max-width: 720px;
  padding-block: var(--e-5);
  display: flex;
  flex-direction: column;
  gap: var(--e-3);
}

.partida__tipo {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-violeta-osc);
}

.partida__consigna {
  font-size: var(--t-lg);
}

.guardado {
  align-self: flex-start;
  font-size: var(--t-xs);
  font-weight: 800;
  border-radius: 999px;
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

.partida__error {
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

.partida__pie {
  border-top: 2px solid var(--c-borde);
  padding-block: var(--e-3);
  background: var(--c-fondo);
}

.partida__pie-interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e-2);
}
</style>
