<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import {
  iniciarMinijuego,
  atraparFicha,
  finalizarPartida,
  ESTADO_PARTIDA
} from '@/servicios/competencia.js'
import { nuevoIdDeIntento } from '@/servicios/progreso.js'

/**
 * Minijuego "Sintax atrapa el codigo".
 *
 * Caen fichas con codigo; Sintax las atrapa moviendose de un lado al otro
 * (arrastrando el dedo, con las flechas del teclado o con los botones). Hay
 * que atrapar las que cumplen la consigna de la ronda y esquivar las demas.
 *
 * El SERVIDOR arma las fichas (texto, cuando aparece, cuanto tarda en caer,
 * por que columna) y es el unico que sabe cuales son validas. Cada ficha
 * atrapada se le avisa; el responde si era valida y devuelve el puntaje y las
 * vidas. Valida la ficha con su reloj: no se puede atrapar una que todavia no
 * cayo ni una que ya paso (supabase/17-juego-de-la-expo.sql).
 *
 * El tiempo de juego sale de dos marcas del servidor (cuando empezo y "ahora"
 * al responder) y despues corre con performance.now(): cambiar la hora del
 * celular no cambia nada.
 */
const props = defineProps({
  eventoId: { type: String, required: true },
  desafioId: { type: String, required: true }
})

const router = useRouter()

const COLUMNAS = 5
/** Franja (en fraccion de la caida) en la que la ficha esta a la altura de Sintax. */
const ZONA_DESDE = 0.8
const ZONA_HASTA = 0.98
/** Que tan cerca (en fraccion del ancho) tiene que estar Sintax para atraparla. */
const ALCANCE = 0.13

/** 'inicio' | 'cargando' | 'jugando' | 'terminando' */
const fase = ref('inicio')
const error = ref(null)
const aviso = ref('')
const partida = ref(null)
const rondas = ref([])
const fichas = ref([])

const tiempo = ref(0) // ms de juego, segun el reloj del servidor
let origen = 0 // performance.now() que corresponde al inicio de la partida
let cuadro = null
let idPedido = null

// --- Sintax -------------------------------------------------------------------
const sintaxX = ref(0.5) // centro de Sintax, de 0 a 1
let objetivoX = 0.5
let teclas = 0 // -1, 0 o 1 mientras se mantiene una flecha
const animo = ref('normal')
let animoHasta = 0
const efectos = ref([]) // "+20" o "-1 vida" que flotan un instante

const area = ref(null)

// --- Datos que se muestran ------------------------------------------------------
const duracionMs = computed(() => (partida.value?.duracionSegundos ?? 60) * 1000)
const restantes = computed(() => Math.max(0, Math.ceil((duracionMs.value - tiempo.value) / 1000)))
const consigna = computed(() => {
  const actual = [...rondas.value].reverse().find((r) => tiempo.value >= r.desdeMs - 1500)
  return actual?.consigna ?? rondas.value[0]?.consigna ?? ''
})
const visibles = computed(() =>
  fichas.value
    .filter((f) => f.estado !== 'perdida' && tiempo.value >= f.apareceMs && tiempo.value <= f.apareceMs + f.caidaMs + 400)
    .map((f) => ({ ...f, progreso: Math.min(1.05, (tiempo.value - f.apareceMs) / f.caidaMs), x: (f.columna + 0.5) / COLUMNAS }))
)

// --- Empezar ------------------------------------------------------------------------
async function empezar() {
  fase.value = 'cargando'
  error.value = null
  try {
    idPedido ??= nuevoIdDeIntento()
    const p = await iniciarMinijuego(props.desafioId, idPedido)
    idPedido = null
    partida.value = p
    rondas.value = p.rondas
    fichas.value = p.fichas.map((f) => ({ ...f, estado: f.atrapada ? 'atrapada' : 'cayendo' }))
    const transcurrido = Math.max(0, Date.parse(p.ahora ?? p.iniciadaEn) - Date.parse(p.iniciadaEn))
    origen = performance.now() - (Number.isFinite(transcurrido) ? transcurrido : 0)
    sintaxX.value = objetivoX = 0.5
    fase.value = 'jugando'
    cuadro = requestAnimationFrame(paso)
  } catch (e) {
    error.value = e
    fase.value = 'inicio'
  }
}

// --- Bucle del juego -----------------------------------------------------------------
let anterior = 0
function paso(ahora) {
  if (fase.value !== 'jugando') return
  const dt = anterior ? Math.min(50, ahora - anterior) : 16
  anterior = ahora
  tiempo.value = ahora - origen

  // Movimiento de Sintax: hacia el dedo, o con las flechas.
  if (teclas) objetivoX = Math.min(0.94, Math.max(0.06, objetivoX + teclas * dt * 0.0011))
  const dx = objetivoX - sintaxX.value
  sintaxX.value += Math.sign(dx) * Math.min(Math.abs(dx), dt * 0.0018)

  if (animoHasta && ahora > animoHasta) {
    animo.value = 'normal'
    animoHasta = 0
  }

  for (const f of visibles.value) {
    if (f.estado !== 'cayendo') continue
    if (f.progreso >= ZONA_DESDE && f.progreso <= ZONA_HASTA && Math.abs(f.x - sintaxX.value) <= ALCANCE) {
      atrapar(f.n)
    }
  }

  if (tiempo.value >= duracionMs.value) {
    terminar()
    return
  }
  cuadro = requestAnimationFrame(paso)
}

function marcar(n, cambios) {
  fichas.value = fichas.value.map((f) => (f.n === n ? { ...f, ...cambios } : f))
}

function efecto(texto, tipo) {
  const id = `${Date.now()}-${Math.random()}`
  efectos.value = [...efectos.value, { id, texto, tipo, x: sintaxX.value }]
  setTimeout(() => (efectos.value = efectos.value.filter((e) => e.id !== id)), 900)
}

async function atrapar(n) {
  marcar(n, { estado: 'pendiente' })
  try {
    const r = await atraparFicha(partida.value.id, n)
    marcar(n, { estado: 'atrapada', valida: r.valida })
    partida.value = { ...partida.value, ...r.partida, rondas: undefined, fichas: undefined }
    if (!r.repetida) {
      if (r.valida) {
        efecto(`+${partida.value.puntosPorAcierto}`, 'bien')
        animo.value = 'celebrando'
      } else {
        efecto('-1 vida', 'mal')
        animo.value = 'enojado'
      }
      animoHasta = performance.now() + 700
    }
    aviso.value = ''
    if (r.partida.estado !== ESTADO_PARTIDA.EN_CURSO) terminar()
  } catch (e) {
    marcar(n, { estado: 'perdida' })
    if (e?.sinConexion) aviso.value = 'Sin conexión: las fichas que atrapes no se cuentan hasta que vuelva.'
    else if (e?.codigo === 'partida_cerrada') terminar()
  }
}

// --- Terminar -----------------------------------------------------------------------
async function terminar() {
  if (fase.value === 'terminando') return
  fase.value = 'terminando'
  cancelAnimationFrame(cuadro)
  for (let intento = 0; intento < 5; intento++) {
    try {
      await finalizarPartida(partida.value.id)
      break
    } catch (e) {
      if (!e?.sinConexion) break
      aviso.value = 'Sin conexión: guardando tu puntaje en cuanto vuelva...'
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  router.replace({ name: 'resultado-partida', params: { eventoId: props.eventoId, partidaId: partida.value.id } })
}

// --- Controles ------------------------------------------------------------------------
function seguirDedo(evento) {
  if (fase.value !== 'jugando' || !area.value) return
  const caja = area.value.getBoundingClientRect()
  objetivoX = Math.min(0.94, Math.max(0.06, (evento.clientX - caja.left) / caja.width))
}
function alPresionar(evento) {
  if (evento.key === 'ArrowLeft') teclas = -1
  else if (evento.key === 'ArrowRight') teclas = 1
  else return
  evento.preventDefault()
}
function alSoltar(evento) {
  if ((evento.key === 'ArrowLeft' && teclas === -1) || (evento.key === 'ArrowRight' && teclas === 1)) teclas = 0
}
function boton(direccion, presionado) {
  teclas = presionado ? direccion : 0
}

onMounted(() => {
  window.addEventListener('keydown', alPresionar)
  window.addEventListener('keyup', alSoltar)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(cuadro)
  window.removeEventListener('keydown', alPresionar)
  window.removeEventListener('keyup', alSoltar)
})

const mensajeError = computed(() => error.value?.message ?? '')
</script>

<template>
  <div class="minijuego">
    <!-- Antes de empezar: las reglas -->
    <section v-if="fase === 'inicio' || fase === 'cargando'" class="portada contenedor seccion">
      <div class="tarjeta">
        <SintaxMascota estado="saludando" :alto="130" alt="" />
        <h1>Sintax atrapa el código</h1>
        <ul class="reglas">
          <li><Icono nombre="puntero" :tamano="18" /><span>Mové a Sintax arrastrando el dedo, con las flechas o con los botones.</span></li>
          <li><Icono nombre="check" :tamano="18" /><span>Atrapá las fichas que cumplen la <strong>consigna</strong> de arriba. Cambia durante el juego.</span></li>
          <li><Icono nombre="corazon" :tamano="18" /><span>Cada ficha equivocada te cuesta una vida. Tenés 3.</span></li>
          <li><Icono nombre="reloj" :tamano="18" /><span>Dura 1 minuto. Tu mejor partida suma al puntaje total del ranking.</span></li>
        </ul>
        <MensajeEstado v-if="mensajeError" tipo="error" data-prueba="error-minijuego">{{ mensajeError }}</MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo :deshabilitado="fase === 'cargando'" data-prueba="empezar" @click="empezar">
          {{ fase === 'cargando' ? 'Preparando...' : '¡Jugar!' }}
        </BaseBoton>
        <BaseBoton variante="texto" :to="{ name: 'evento', params: { eventoId } }">Volver al evento</BaseBoton>
      </div>
    </section>

    <!-- Jugando -->
    <section v-else class="juego">
      <header class="hud">
        <p class="hud__consigna" data-prueba="consigna">{{ consigna }}</p>
        <div class="hud__datos">
          <span class="hud__tiempo" data-prueba="tiempo-juego"><Icono nombre="reloj" :tamano="16" /> {{ restantes }} s</span>
          <span class="hud__puntaje" data-prueba="puntaje-juego">{{ partida?.puntaje ?? 0 }} pts</span>
          <span class="hud__vidas" data-prueba="vidas" :data-vidas="partida?.vidas ?? 3" :aria-label="`${partida?.vidas ?? 3} vidas`">
            <Icono v-for="i in 3" :key="i" :nombre="i <= (partida?.vidas ?? 3) ? 'corazon' : 'corazonRoto'" :tamano="18" :class="{ apagado: i > (partida?.vidas ?? 3) }" />
          </span>
        </div>
      </header>

      <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>

      <div
        ref="area"
        class="area"
        data-prueba="area-juego"
        @pointerdown="seguirDedo"
        @pointermove="seguirDedo"
      >
        <div
          v-for="f in visibles"
          :key="f.n"
          class="ficha"
          :class="{ 'ficha--bien': f.estado === 'atrapada' && f.valida, 'ficha--mal': f.estado === 'atrapada' && f.valida === false, 'ficha--pendiente': f.estado === 'pendiente' }"
          data-prueba="ficha"
          :data-n="f.n"
          :data-x="f.x.toFixed(3)"
          :data-progreso="f.progreso.toFixed(3)"
          :style="{ left: `${f.x * 100}%`, top: `calc(${f.progreso} * (100% - var(--alto-sintax)))` }"
        >
          {{ f.texto }}
        </div>

        <span
          v-for="e in efectos"
          :key="e.id"
          class="efecto"
          :class="`efecto--${e.tipo}`"
          :style="{ left: `${e.x * 100}%` }"
        >{{ e.texto }}</span>

        <div class="jugador" data-prueba="sintax" :data-x="sintaxX.toFixed(3)" :style="{ left: `${sintaxX * 100}%` }">
          <SintaxMascota :estado="animo" :alto="78" alt="Sintax" />
        </div>
      </div>

      <div class="controles">
        <button
          type="button"
          class="control"
          aria-label="Mover a la izquierda"
          @pointerdown.prevent="boton(-1, true)"
          @pointerup="boton(-1, false)"
          @pointerleave="boton(-1, false)"
        >
          <Icono nombre="flechaIzquierda" :tamano="28" />
        </button>
        <button
          type="button"
          class="control"
          aria-label="Mover a la derecha"
          @pointerdown.prevent="boton(1, true)"
          @pointerup="boton(1, false)"
          @pointerleave="boton(1, false)"
        >
          <Icono nombre="flechaDerecha" :tamano="28" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.minijuego {
  min-height: 100%;
}

.tarjeta {
  max-width: 520px;
  margin-inline: auto;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-4) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
  text-align: center;
}

.reglas {
  display: grid;
  gap: 0.6rem;
  text-align: left;
  list-style: none;
  padding: 0;
}

.reglas li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.reglas li > :first-child {
  flex: none;
  margin-top: 0.15rem;
}

.juego {
  --alto-sintax: 86px;
  max-width: 560px;
  margin-inline: auto;
  padding: var(--e-2) var(--e-2) var(--e-3);
  display: grid;
  gap: var(--e-2);
  touch-action: none;
  user-select: none;
}

.hud {
  display: grid;
  gap: 0.4rem;
}

.hud__consigna {
  background: var(--c-violeta);
  color: var(--c-blanco);
  font-weight: 800;
  text-align: center;
  border-radius: var(--r-md);
  padding: 0.55rem 0.8rem;
}

.hud__datos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.hud__tiempo {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
}

.hud__puntaje {
  font-size: var(--t-lg);
  color: var(--c-violeta-osc);
}

.hud__vidas {
  display: inline-flex;
  gap: 0.15rem;
  color: var(--c-rojo);
}

.hud__vidas .apagado {
  opacity: 0.35;
}

.aviso {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-amarillo-osc);
  background: var(--c-amarillo-suave);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.6rem;
}

.area {
  position: relative;
  height: min(62vh, 520px);
  border-radius: var(--r-lg);
  background: linear-gradient(180deg, #e9f9ee 0%, #f7f8fa 75%);
  border: 2px solid var(--c-borde);
  overflow: hidden;
  cursor: grab;
}

.ficha {
  position: absolute;
  transform: translateX(-50%);
  min-width: 3.2rem;
  max-width: 34%;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: var(--c-blanco);
  border: 2px solid var(--c-violeta);
  color: var(--c-violeta-osc);
  font-family: var(--f-codigo);
  font-variant-ligatures: none;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 3px 0 var(--c-borde);
  pointer-events: none;
}

.ficha--pendiente {
  opacity: 0.6;
}

.ficha--bien {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.ficha--mal {
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
  color: var(--c-rojo-osc);
}

.jugador {
  position: absolute;
  bottom: 4px;
  transform: translateX(-50%);
  pointer-events: none;
}

.efecto {
  position: absolute;
  bottom: var(--alto-sintax);
  transform: translateX(-50%);
  font-weight: 900;
  font-size: 1.2rem;
  pointer-events: none;
  animation: subir 0.9s ease-out forwards;
}

.efecto--bien {
  color: var(--c-verde-osc);
}

.efecto--mal {
  color: var(--c-rojo-osc);
}

@keyframes subir {
  from {
    opacity: 1;
    translate: 0 0;
  }
  to {
    opacity: 0;
    translate: 0 -48px;
  }
}

.controles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--e-2);
}

.control {
  display: grid;
  place-items: center;
  min-height: 56px;
  border-radius: var(--r-lg);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  box-shadow: 0 4px 0 var(--c-borde);
  color: var(--c-violeta-osc);
  touch-action: none;
}

.control:active {
  translate: 0 3px;
  box-shadow: 0 1px 0 var(--c-borde);
}

@media (prefers-reduced-motion: reduce) {
  .efecto {
    animation: none;
  }
}
</style>
