<script setup>
import { computed, ref, watch } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'
import { motivoAliasInvalido } from '@/utils/validaciones.js'
import {
  obtenerEvento,
  listarMisPartidas,
  elegirAliasExpo,
  formatoTiempo,
  ETIQUETA_DIFICULTAD,
  ESTADO_PARTIDA
} from '@/servicios/competencia.js'

/**
 * Un evento de expo: sus desafios con las reglas a la vista, y para cada uno
 * cuantos intentos usaste y tu mejor partida valida (la que cuenta en el ranking).
 */
const props = defineProps({
  eventoId: { type: String, required: true }
})

const { conSesion, esInvitado, entrarComoInvitado, cerrarSesion } = useAuth()

// --- Jugar solo con un alias (sin iniciar sesion) ---------------------------------
// Por detras se abre una sesion de invitado y se le pone el alias elegido: con el
// aparece en el ranking (15-ranking-publico.sql, elegir_alias_expo).
const aliasExpo = ref(null) // { alias, codigo, enRanking } o null
const aliasNuevo = ref('')
const aliasIntento = ref(false)
const aliasGuardando = ref(false)
const aliasError = ref('')
const motivoAlias = computed(() => (aliasIntento.value ? motivoAliasInvalido(aliasNuevo.value) : ''))
const necesitaAlias = computed(() => !conSesion.value || (esInvitado.value && !aliasExpo.value?.enRanking))

async function jugarConAlias() {
  aliasIntento.value = true
  aliasError.value = ''
  if (motivoAlias.value) return
  aliasGuardando.value = true
  try {
    if (!conSesion.value) await entrarComoInvitado()
    await elegirAliasExpo(aliasNuevo.value.trim())
    await cargar()
  } catch (e) {
    aliasError.value = e?.message ?? 'No pudimos guardar tu alias.'
  } finally {
    aliasGuardando.value = false
  }
}

/**
 * Compu compartida de la expo: el que termino deja lugar al siguiente. Se cierra
 * la sesion de invitado (sus puntos ya quedaron en el ranking) y vuelve a
 * aparecer el formulario del alias.
 */
const cambiando = ref(false)
async function cambiarDeJugador() {
  const actual = aliasExpo.value ? `${aliasExpo.value.alias}#${String(aliasExpo.value.codigo).padStart(4, '0')}` : 'este jugador'
  if (!window.confirm(`¿Cambiar de jugador? Los puntos de ${actual} quedan en el ranking, pero ya no se va a poder seguir jugando con ese alias.`)) return
  cambiando.value = true
  try {
    await cerrarSesion()
    aliasExpo.value = null
    aliasNuevo.value = ''
    aliasIntento.value = false
    aliasError.value = ''
  } catch (e) {
    aliasError.value = e?.message ?? 'No pudimos cambiar de jugador.'
  } finally {
    cambiando.value = false
  }
}

const evento = ref(null)
const partidas = ref([])
const cargando = ref(true)
const error = ref(null)

let pedido = 0
async function cargar() {
  const mio = ++pedido // si llega otra carga despues, vale la ultima
  cargando.value = true
  error.value = null
  try {
    const ev = await obtenerEvento(props.eventoId)
    const mias = conSesion.value ? await listarMisPartidas(props.eventoId) : []
    const alias = esInvitado.value ? await elegirAliasExpo().catch(() => null) : null
    if (mio !== pedido) return
    evento.value = ev
    partidas.value = mias
    aliasExpo.value = alias
  } catch (e) {
    if (mio === pedido) error.value = e
  } finally {
    if (mio === pedido) cargando.value = false
  }
}

watch([() => props.eventoId, conSesion], cargar, { immediate: true })

const abierto = computed(() => evento.value?.estado === 'abierto')

/** Lo mismo que hace el servidor para el ranking: mejor puntaje, despues menos tiempo. */
function mejorDe(desafioId) {
  return partidas.value
    .filter((p) => p.desafioId === desafioId && p.valida)
    .sort((a, b) => b.puntaje - a.puntaje || a.duracionMs - b.duracionMs)[0] ?? null
}

function resumenDe(desafio) {
  const propias = partidas.value.filter((p) => p.desafioId === desafio.id)
  const enCurso = propias.find((p) => p.estado === ESTADO_PARTIDA.EN_CURSO) ?? null
  return {
    usadas: propias.length,
    quedan: Math.max(0, desafio.intentosPermitidos - propias.length),
    enCurso,
    mejor: mejorDe(desafio.id)
  }
}
</script>

<template>
  <div class="evento seccion contenedor">
    <EstadoConsulta :cargando="cargando" :error="error" texto-cargando="Cargando el evento..." @reintentar="cargar">
      <template #salida>
        <BaseBoton :to="{ name: 'expo' }">Ver los eventos</BaseBoton>
      </template>

      <template v-if="evento">
        <header class="cabecera">
          <div>
            <span class="etiqueta" :class="abierto ? 'etiqueta--disponible' : 'etiqueta--bloqueada'">
              {{ abierto ? 'Abierto' : 'Cerrado' }}
            </span>
            <h1>{{ evento.nombre }}</h1>
            <p class="texto-secundario">{{ evento.descripcion }}</p>
          </div>
          <BaseBoton variante="contorno" :to="{ name: 'ranking-expo', params: { eventoId } }">
            <Icono nombre="trofeo" :tamano="16" /> Ver ranking
          </BaseBoton>
        </header>

        <!-- Sin cuenta: se juega solo con un alias -->
        <form v-if="necesitaAlias" class="alias-expo" novalidate data-prueba="alias-expo" @submit.prevent="jugarConAlias">
          <h2>Elegí tu alias para jugar</h2>
          <p class="texto-secundario">No hace falta crear una cuenta. Vas a aparecer en el ranking con este alias y un número.</p>
          <label for="alias-expo">Tu alias</label>
          <input
            id="alias-expo"
            v-model="aliasNuevo"
            name="alias-expo"
            autocomplete="nickname"
            maxlength="20"
            placeholder="Por ejemplo Ana_Dev"
            :aria-invalid="Boolean(motivoAlias)"
          />
          <p v-if="motivoAlias || aliasError" class="alias-expo__error" role="alert">{{ motivoAlias || aliasError }}</p>
          <BaseBoton type="submit" tamano="grande" ancho-completo :deshabilitado="aliasGuardando">
            {{ aliasGuardando ? 'Preparando...' : 'Jugar con este alias' }}
          </BaseBoton>
          <p class="texto-secundario alias-expo__cuenta">
            ¿Tenés cuenta? <router-link :to="{ name: 'ingresar', query: { volver: `/expo/${eventoId}` } }">Ingresá</router-link>
          </p>
        </form>
        <p v-else-if="esInvitado && aliasExpo" class="alias-expo__actual" data-prueba="alias-actual">
          <Icono nombre="usuario" :tamano="16" /> Jugás como <strong>{{ aliasExpo.alias }}#{{ String(aliasExpo.codigo).padStart(4, '0') }}</strong>
          <BaseBoton variante="texto" tamano="chico" :deshabilitado="cambiando" data-prueba="cambiar-jugador" @click="cambiarDeJugador">
            <Icono nombre="salir" :tamano="15" /> {{ cambiando ? 'Cambiando...' : 'Cambiar de jugador' }}
          </BaseBoton>
        </p>

        <ul class="desafios">
          <li v-for="desafio in evento.desafios" :key="desafio.id" class="desafio" :data-desafio="desafio.id">
            <div class="desafio__texto">
              <p class="desafio__dificultad">
                <template v-if="desafio.tipo === 'minijuego'"><Icono nombre="joystick" :tamano="14" /> Minijuego · </template>{{ ETIQUETA_DIFICULTAD[desafio.dificultad] }}
              </p>
              <h2>{{ desafio.nombre }}</h2>
              <p class="texto-secundario">{{ desafio.descripcion }}</p>
              <ul class="reglas">
                <li><Icono nombre="reloj" :tamano="15" /> {{ desafio.duracionSegundos }} segundos</li>
                <li v-if="desafio.tipo === 'minijuego'"><Icono nombre="rayo" :tamano="15" /> {{ desafio.puntosPorAcierto }} puntos por ficha</li>
                <li v-if="desafio.tipo === 'minijuego'"><Icono nombre="corazon" :tamano="15" /> 3 vidas</li>
                <li v-else><Icono nombre="rayo" :tamano="15" /> {{ desafio.puntosPorAcierto }} puntos por acierto</li>
                <li><Icono nombre="repetir" :tamano="15" /> {{ desafio.intentosPermitidos }} intentos</li>
              </ul>
            </div>

            <div v-if="conSesion && !necesitaAlias" class="desafio__mio">
              <p class="desafio__intentos" data-prueba="intentos">
                {{ resumenDe(desafio).usadas }} de {{ desafio.intentosPermitidos }} intentos usados
              </p>
              <p v-if="resumenDe(desafio).mejor" class="desafio__mejor" data-prueba="mejor">
                Tu mejor: <strong>{{ resumenDe(desafio).mejor.puntaje }} pts</strong>
                en {{ formatoTiempo(resumenDe(desafio).mejor.duracionMs) }}
              </p>
              <BaseBoton
                v-if="abierto && desafio.tipo === 'minijuego' && desafio.estado === 'publicado' && resumenDe(desafio).quedan > 0"
                :to="{ name: 'minijuego', params: { eventoId, desafioId: desafio.id } }"
              >
                Jugar
              </BaseBoton>
              <BaseBoton
                v-else-if="abierto && desafio.tipo !== 'minijuego' && resumenDe(desafio).enCurso"
                :to="{ name: 'partida', params: { eventoId, desafioId: desafio.id }, query: { partida: resumenDe(desafio).enCurso.id } }"
              >
                Retomar partida
              </BaseBoton>
              <BaseBoton
                v-else-if="abierto && desafio.estado === 'publicado' && resumenDe(desafio).quedan > 0"
                :to="{ name: 'partida', params: { eventoId, desafioId: desafio.id } }"
              >
                Jugar
              </BaseBoton>
              <p v-else-if="abierto && resumenDe(desafio).quedan === 0" class="texto-secundario">Sin intentos</p>
            </div>
          </li>
        </ul>

        <section class="como">
          <h2>Como se juega</h2>
          <ul>
            <li>El tiempo lo mide el servidor desde que empezas. Si se corta la conexion, segui: el reloj no se detiene.</li>
            <li>Para que la partida cuente, respondela entera o toca <strong>Terminar</strong> antes de que se acabe el tiempo. Si se acaba sin cerrarla, queda incompleta y no entra al ranking.</li>
            <li>Mientras jugas un desafio de preguntas no se muestra si cada respuesta estuvo bien: tu puntaje aparece al terminar.</li>
            <li>En el ranking de cada desafio cuenta tu <strong>mejor</strong> partida, no la suma. A igual puntaje gana quien tardo menos; si tambien empatan en tiempo, comparten el puesto.</li>
            <li>El <strong>puntaje total</strong> suma tu mejor partida de cada desafio, incluido el minijuego: jugar todos te hace subir.</li>
          </ul>
        </section>
      </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.evento {
  display: grid;
  gap: var(--e-3);
  max-width: 860px;
  margin-inline: auto;
}

.cabecera {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--e-3);
  align-items: start;
}

.cabecera h1 {
  margin-block: 0.3rem;
}

.desafios {
  display: grid;
  gap: var(--e-3);
}

.desafio {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--e-3);
  align-items: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
}

.desafio__dificultad {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-violeta-osc);
}

.reglas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem var(--e-2);
  margin-top: var(--e-1);
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
}

.reglas li {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.desafio__mio {
  display: grid;
  gap: var(--e-1);
  justify-items: end;
  text-align: right;
  font-size: var(--t-sm);
}

.desafio__intentos {
  color: var(--c-gris);
  font-weight: 700;
}

.como {
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
}

.como ul {
  display: grid;
  gap: var(--e-1);
  margin-top: var(--e-1);
  padding-left: 1.2rem;
  list-style: disc;
  font-size: var(--t-sm);
}

@media (max-width: 560px) {
  .cabecera,
  .desafio {
    grid-template-columns: minmax(0, 1fr);
  }
  .desafio__mio {
    justify-items: start;
    text-align: left;
  }
}
.alias-expo {
  display: grid;
  gap: var(--e-2);
  background: var(--c-blanco);
  border: 2px solid var(--c-violeta);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  margin-bottom: var(--e-3);
}

.alias-expo label {
  font-weight: 800;
}

.alias-expo input {
  font: inherit;
  font-size: var(--t-lg);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: 0.6rem 0.8rem;
  min-width: 0;
}

.alias-expo input[aria-invalid='true'] {
  border-color: var(--c-rojo);
}

.alias-expo__error {
  color: var(--c-rojo-osc);
  font-weight: 700;
  font-size: var(--t-sm);
}

.alias-expo__cuenta {
  text-align: center;
}

.alias-expo__actual {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: var(--e-3);
}
</style>
