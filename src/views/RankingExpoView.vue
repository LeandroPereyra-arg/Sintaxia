<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icono from '@/components/Icono.vue'
import LogoSintaxia from '@/components/LogoSintaxia.vue'
import { obtenerEvento, formatoTiempo } from '@/servicios/competencia.js'
import { obtenerRanking, escucharResultados } from '@/servicios/ranking.js'

/**
 * Pantalla del ranking para la computadora de la expo (etapa 7).
 *
 * Se abre sin sesion y consulta el mismo proyecto de Supabase con el mismo
 * identificador de evento que usan los celulares.
 *
 *   1. Carga inicial con ranking_evento (reglas de la etapa 6).
 *   2. Avisos de Supabase Realtime sobre resultados_publicos: cada aviso dispara
 *      una nueva consulta (el aviso no se usa como dato).
 *   3. Respaldo: consulta periodica (cada 15 s si Realtime no esta conectado,
 *      cada 60 s si lo esta) y boton "Actualizar".
 *   4. Al reconectarse (Realtime o la red) vuelve a consultar, por si se perdio
 *      algun aviso mientras estaba desconectada.
 *
 * Se lee a distancia: letra grande, los mejores puestos de cada desafio, las
 * partidas recien terminadas resaltadas unos segundos. Para encontrar el
 * resultado propio: el buscador de alias, o el enlace que da la pantalla de
 * puntaje del celular (?resaltar=<participante>).
 */
const props = defineProps({
  eventoId: { type: String, required: true }
})

const route = useRoute()

const MOSTRAR = 10
const RESALTE_MS = 15000

const evento = ref(null)
const tablas = ref([])
const errorEvento = ref(null)
const cargando = ref(false)
const ultimaActualizacion = ref(null)
const falloUltima = ref(false)
/** 'conectando' | 'conectado' | 'reconectando' | 'error' */
const realtime = ref('conectando')
const enLinea = ref(navigator.onLine)
const busqueda = ref('')
const recientes = ref(new Map()) // participante|desafio -> hasta cuando resaltar

const resaltar = computed(() => String(route.query.resaltar ?? ''))

/** Estado que se muestra: en vivo, respaldo (sin Realtime) o sin conexion. */
const estadoConexion = computed(() => {
  if (!enLinea.value || falloUltima.value) return 'sin-conexion'
  if (realtime.value === 'conectado') return 'en-vivo'
  return 'respaldo'
})

const textoEstado = computed(
  () =>
    ({
      'en-vivo': 'En vivo',
      respaldo: 'Actualizando cada 15 s',
      'sin-conexion': 'Sin conexion'
    })[estadoConexion.value]
)

const horaActualizacion = computed(() =>
  ultimaActualizacion.value
    ? ultimaActualizacion.value.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'
)

const enlaceParaJugar = computed(() => `${location.origin}/expo/${props.eventoId}`)

function claveFila(desafioId, fila) {
  return `${desafioId}|${fila.participante}`
}

function coincideBusqueda(fila) {
  const t = busqueda.value.trim().toLowerCase().replace(/^#/, '')
  if (!t) return false
  return `${fila.alias}#${String(fila.codigo).padStart(4, '0')}`.toLowerCase().includes(t)
}

/** Lo que se muestra de cada desafio: los primeros puestos y, si hace falta, la fila buscada. */
const vistas = computed(() =>
  tablas.value.map((t) => {
    const arriba = t.filas.slice(0, MOSTRAR)
    const extra = t.filas
      .slice(MOSTRAR)
      .filter((f) => f.participante === resaltar.value || coincideBusqueda(f))
    return { ...t, arriba, extra, total: t.filas.length }
  })
)

async function cargarEvento() {
  try {
    evento.value = await obtenerEvento(props.eventoId)
    errorEvento.value = null
  } catch (e) {
    errorEvento.value = e
  }
}

let enCurso = null
async function actualizar() {
  if (enCurso) return enCurso
  cargando.value = true
  enCurso = (async () => {
    try {
      const nuevas = await obtenerRanking(props.eventoId, 100)
      marcarRecientes(nuevas)
      tablas.value = nuevas
      ultimaActualizacion.value = new Date()
      falloUltima.value = false
      if (!evento.value) await cargarEvento()
    } catch {
      // Se sigue mostrando lo ultimo que se pudo cargar, con el aviso de conexion.
      falloUltima.value = true
    } finally {
      cargando.value = false
      enCurso = null
    }
  })()
  return enCurso
}

/** Filas nuevas o que cambiaron de puntaje/tiempo desde la consulta anterior. */
function marcarRecientes(nuevas) {
  if (!ultimaActualizacion.value) return // la carga inicial no resalta nada
  const antes = new Map()
  for (const t of tablas.value) for (const f of t.filas) antes.set(claveFila(t.desafioId, f), f)
  const hasta = Date.now() + RESALTE_MS
  const mapa = new Map([...recientes.value].filter(([, h]) => h > Date.now()))
  for (const t of nuevas) {
    for (const f of t.filas) {
      const previa = antes.get(claveFila(t.desafioId, f))
      if (!previa || previa.puntaje !== f.puntaje || previa.duracionMs !== f.duracionMs) {
        mapa.set(claveFila(t.desafioId, f), hasta)
      }
    }
  }
  recientes.value = mapa
}

const ahora = ref(Date.now())
function esReciente(desafioId, fila) {
  return (recientes.value.get(claveFila(desafioId, fila)) ?? 0) > ahora.value
}

// --- Avisos, respaldo y reconexion -------------------------------------------
let dejarDeEscuchar = null
let demora = null
function avisoDeCambio() {
  clearTimeout(demora)
  demora = setTimeout(actualizar, 300) // varios avisos juntos -> una sola consulta
}

function alEstadoRealtime(estado) {
  const antes = realtime.value
  realtime.value = estado
  // Al (re)conectarse se consulta de nuevo: pudo haberse perdido algun aviso.
  if (estado === 'conectado' && antes !== 'conectado') actualizar()
}

function alVolverLaRed() {
  enLinea.value = true
  actualizar()
}
function alPerderLaRed() {
  enLinea.value = false
}

let respaldo = null
let reloj = null
function programarRespaldo() {
  clearTimeout(respaldo)
  const espera = realtime.value === 'conectado' && !falloUltima.value ? 60000 : 15000
  respaldo = setTimeout(async () => {
    await actualizar()
    programarRespaldo()
  }, espera)
}
watch([realtime, falloUltima], programarRespaldo)

function empezar() {
  dejarDeEscuchar?.()
  realtime.value = 'conectando'
  ultimaActualizacion.value = null
  tablas.value = []
  cargarEvento()
  actualizar()
  dejarDeEscuchar = escucharResultados(props.eventoId, { alCambiar: avisoDeCambio, alEstado: alEstadoRealtime })
  programarRespaldo()
}

watch(() => props.eventoId, empezar)

onMounted(() => {
  empezar()
  window.addEventListener('online', alVolverLaRed)
  window.addEventListener('offline', alPerderLaRed)
  reloj = setInterval(() => (ahora.value = Date.now()), 1000)
})

onBeforeUnmount(() => {
  dejarDeEscuchar?.()
  clearTimeout(respaldo)
  clearTimeout(demora)
  clearInterval(reloj)
  window.removeEventListener('online', alVolverLaRed)
  window.removeEventListener('offline', alPerderLaRed)
})

const codigo4 = (c) => String(c).padStart(4, '0')
</script>

<template>
  <div class="pantalla">
    <header class="cabecera">
      <div class="cabecera__marca">
        <LogoSintaxia variante="icono" :alto="56" alt="" />
        <div>
          <p class="cabecera__vivo">Ranking</p>
          <h1 data-prueba="nombre-evento">{{ evento?.nombre ?? 'Ranking de la expo' }}</h1>
        </div>
      </div>

      <div class="cabecera__estado">
        <p
          class="conexion"
          :class="`conexion--${estadoConexion}`"
          data-prueba="estado-conexion"
          :data-estado="estadoConexion"
          role="status"
        >
          <span class="conexion__punto" aria-hidden="true"></span>
          {{ textoEstado }}
        </p>
        <p class="actualizado">
          Actualizado <strong data-prueba="ultima-actualizacion">{{ horaActualizacion }}</strong>
        </p>
        <button type="button" class="actualizar" :disabled="cargando" @click="actualizar">
          <Icono nombre="repetir" :tamano="18" /> {{ cargando ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>
    </header>

    <p v-if="estadoConexion === 'sin-conexion'" class="aviso-conexion" role="alert" data-prueba="aviso-sin-conexion">
      <Icono nombre="alerta" :tamano="22" />
      Se perdio la conexion. Se muestra el ranking de las {{ horaActualizacion }}; se actualiza solo cuando vuelva.
    </p>

    <p v-if="errorEvento && !tablas.length" class="aviso-conexion" role="alert">
      <Icono nombre="alerta" :tamano="22" /> {{ errorEvento.message }}
    </p>

    <div class="buscador">
      <label for="buscar-alias">Busca tu resultado</label>
      <input id="buscar-alias" v-model="busqueda" type="search" placeholder="Tu alias, por ejemplo Ana#0427" autocomplete="off" />
    </div>

    <div class="tableros" data-prueba="tableros">
      <section
        v-for="t in vistas"
        :key="t.desafioId"
        class="tablero"
        :data-desafio="t.desafioId"
      >
        <h2>{{ t.desafio }} <small>{{ t.total }} {{ t.total === 1 ? 'participante' : 'participantes' }}</small></h2>
        <ol class="filas">
          <li
            v-for="f in [...t.arriba, ...t.extra]"
            :key="f.participante"
            class="fila"
            :class="{
              'fila--podio': f.posicion <= 3,
              'fila--nueva': esReciente(t.desafioId, f),
              'fila--mia': f.participante === resaltar || coincideBusqueda(f),
              'fila--extra': t.extra.includes(f)
            }"
            :data-participante="f.participante"
            :data-posicion="f.posicion"
            :data-reciente="esReciente(t.desafioId, f) ? 'si' : 'no'"
          >
            <span class="fila__pos" :class="`fila__pos--${f.posicion}`">{{ f.posicion }}</span>
            <span class="fila__alias">{{ f.alias }}<small>#{{ codigo4(f.codigo) }}</small></span>
            <span class="fila__puntaje">{{ f.puntaje }}</span>
            <span class="fila__tiempo">{{ formatoTiempo(f.duracionMs) }}</span>
          </li>
        </ol>
        <p v-if="t.filas.length === 0" class="vacio">Todavia nadie termino este desafio.</p>
      </section>

      <section v-if="!tablas.length && evento" class="tablero tablero--vacio">
        <h2>Todavia no hay resultados</h2>
        <p>Entra desde tu celular y juga:</p>
        <p class="enlace">{{ enlaceParaJugar }}</p>
      </section>
    </div>

    <footer class="pie">
      Se muestran el alias y el codigo de las cuentas, el puntaje y el tiempo de su mejor partida. A igual
      puntaje gana el menor tiempo; con el mismo puntaje y tiempo se comparte el puesto. Para jugar:
      <strong>{{ enlaceParaJugar }}</strong>
    </footer>
  </div>
</template>

<style scoped>
.pantalla {
  min-height: 100vh;
  background: var(--c-tinta, #1f2933);
  color: #fff;
  padding: clamp(16px, 2.5vw, 40px);
  display: grid;
  gap: clamp(12px, 1.5vw, 24px);
  align-content: start;
}

.cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cabecera__marca {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.cabecera__vivo {
  font-size: clamp(14px, 1.2vw, 20px);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #b6f7c6;
}

.cabecera h1 {
  font-size: clamp(28px, 3.6vw, 64px);
  line-height: 1.05;
  color: #fff;
  overflow-wrap: anywhere;
}

.cabecera__estado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  font-size: clamp(14px, 1.1vw, 20px);
}

.conexion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  padding: 6px 14px;
  border-radius: 999px;
}

.conexion__punto {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
}

.conexion--en-vivo {
  background: rgba(47, 191, 86, 0.18);
  color: #6ee28c;
}

.conexion--en-vivo .conexion__punto {
  animation: latido 1.6s infinite;
}

.conexion--respaldo {
  background: rgba(255, 200, 0, 0.18);
  color: #ffd84d;
}

.conexion--sin-conexion {
  background: rgba(255, 75, 75, 0.2);
  color: #ff8a8a;
}

.actualizado {
  color: #cbd2d9;
}

.actualizado strong {
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.actualizar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: inherit;
  font-weight: 800;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 8px 16px;
  cursor: pointer;
}

.actualizar:disabled {
  opacity: 0.6;
}

.aviso-conexion {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: clamp(16px, 1.4vw, 24px);
  font-weight: 800;
  background: rgba(255, 75, 75, 0.2);
  border: 2px solid #ff8a8a;
  color: #ffd0d0;
  border-radius: 14px;
  padding: 12px 18px;
}

.buscador {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  font-size: clamp(14px, 1.1vw, 20px);
}

.buscador label {
  font-weight: 800;
  color: #cbd2d9;
}

.buscador input {
  font: inherit;
  min-width: 0;
  width: min(420px, 100%);
  padding: 8px 14px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.tableros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
  gap: clamp(12px, 1.5vw, 28px);
}

.tablero {
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: clamp(14px, 1.6vw, 28px);
  min-width: 0;
}

.tablero h2 {
  font-size: clamp(22px, 2.2vw, 40px);
  color: #fff;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 14px;
}

.tablero h2 small {
  font-size: 0.5em;
  color: #cbd2d9;
  font-weight: 700;
}

.filas {
  display: grid;
  gap: 8px;
}

.fila {
  display: grid;
  grid-template-columns: 2.2em minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  font-size: clamp(18px, 1.7vw, 32px);
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.fila__pos {
  font-weight: 900;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.fila__pos--1 { color: #ffd84d; }
.fila__pos--2 { color: #e0e6ec; }
.fila__pos--3 { color: #f0a868; }

.fila__alias {
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fila__alias small {
  font-weight: 600;
  color: #9aa5b1;
  margin-left: 2px;
}

.fila__puntaje {
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: #b6f7c6;
}

.fila__tiempo {
  font-variant-numeric: tabular-nums;
  color: #cbd2d9;
  font-size: 0.75em;
}

.fila--podio {
  background: rgba(255, 255, 255, 0.1);
}

.fila--nueva {
  animation: recien 1.2s ease-in-out 3;
  outline: 3px solid #6ee28c;
}

.fila--mia {
  outline: 3px solid #7cc4ff;
  background: rgba(28, 176, 246, 0.25);
}

.fila--extra {
  margin-top: 10px;
}

@keyframes recien {
  50% { background: rgba(110, 226, 140, 0.35); }
}

.vacio,
.tablero--vacio p {
  color: #cbd2d9;
  font-size: clamp(16px, 1.3vw, 24px);
}

.enlace {
  font-size: clamp(20px, 2vw, 36px) !important;
  font-weight: 900;
  color: #fff !important;
  overflow-wrap: anywhere;
}

.pie {
  color: #9aa5b1;
  font-size: clamp(12px, 1vw, 18px);
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .fila--nueva,
  .conexion--en-vivo .conexion__punto {
    animation: none;
  }
}
</style>
