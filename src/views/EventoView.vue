<script setup>
import { computed, ref, watch } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'
import {
  obtenerEvento,
  listarMisPartidas,
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

const { conSesion, esInvitado } = useAuth()

const evento = ref(null)
const partidas = ref([])
const cargando = ref(true)
const error = ref(null)

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    evento.value = await obtenerEvento(props.eventoId)
    partidas.value = conSesion.value ? await listarMisPartidas(props.eventoId) : []
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
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

        <MensajeEstado v-if="!conSesion" tipo="info">
          <p>Para jugar necesitas ingresar, aunque sea como invitado.</p>
          <BaseBoton tamano="chico" :to="{ name: 'ingresar', query: { volver: `/expo/${eventoId}` } }">Ingresar</BaseBoton>
        </MensajeEstado>
        <MensajeEstado v-else-if="esInvitado" tipo="alerta" data-prueba="aviso-invitado-expo">
          <p>
            Como invitado podes jugar y ver tu puntaje, pero <strong>no apareces en el ranking</strong>:
            solo figuran las cuentas, con su alias. Si creas tu cuenta, tus partidas pasan a contar.
          </p>
          <BaseBoton tamano="chico" :to="{ name: 'registro' }">Crear mi cuenta</BaseBoton>
        </MensajeEstado>

        <ul class="desafios">
          <li v-for="desafio in evento.desafios" :key="desafio.id" class="desafio" :data-desafio="desafio.id">
            <div class="desafio__texto">
              <p class="desafio__dificultad">{{ ETIQUETA_DIFICULTAD[desafio.dificultad] }}</p>
              <h2>{{ desafio.nombre }}</h2>
              <p class="texto-secundario">{{ desafio.descripcion }}</p>
              <ul class="reglas">
                <li><Icono nombre="reloj" :tamano="15" /> {{ desafio.duracionSegundos }} segundos</li>
                <li><Icono nombre="rayo" :tamano="15" /> {{ desafio.puntosPorAcierto }} puntos por acierto</li>
                <li><Icono nombre="repetir" :tamano="15" /> {{ desafio.intentosPermitidos }} intentos</li>
              </ul>
            </div>

            <div v-if="conSesion" class="desafio__mio">
              <p class="desafio__intentos" data-prueba="intentos">
                {{ resumenDe(desafio).usadas }} de {{ desafio.intentosPermitidos }} intentos usados
              </p>
              <p v-if="resumenDe(desafio).mejor" class="desafio__mejor" data-prueba="mejor">
                Tu mejor: <strong>{{ resumenDe(desafio).mejor.puntaje }} pts</strong>
                en {{ formatoTiempo(resumenDe(desafio).mejor.duracionMs) }}
              </p>
              <BaseBoton
                v-if="abierto && resumenDe(desafio).enCurso"
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
            <li>En el ranking cuenta tu <strong>mejor</strong> partida, no la suma. A igual puntaje gana quien tardo menos; si tambien empatan en tiempo, comparten el puesto.</li>
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
</style>
