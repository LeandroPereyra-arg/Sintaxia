<script setup>
import { computed, ref, watch } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { useAuth } from '@/composables/useAuth.js'
import { obtenerPartida, formatoTiempo, ESTADO_PARTIDA } from '@/servicios/competencia.js'
import { miPosicion } from '@/servicios/ranking.js'

/**
 * Puntaje final de una partida, tal como lo guardo el servidor. Lo ven igual
 * un invitado y una cuenta; la diferencia es que solo las cuentas entran al
 * ranking (y la pantalla lo dice).
 */
const props = defineProps({
  eventoId: { type: String, required: true },
  partidaId: { type: String, required: true }
})

const { esInvitado } = useAuth()

const partida = ref(null)
const posicion = ref(null)
const cargando = ref(true)
const error = ref(null)

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    partida.value = await obtenerPartida(props.partidaId)
    // La posicion sale del ranking publico (etapa 7): si falla, el puntaje se muestra igual.
    posicion.value = partida.value.valida ? await miPosicion(partida.value.desafioId).catch(() => null) : null
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

watch(() => props.partidaId, cargar, { immediate: true })

const enCurso = computed(() => partida.value?.estado === ESTADO_PARTIDA.EN_CURSO)
const vencida = computed(() => partida.value?.estado === ESTADO_PARTIDA.VENCIDA)
</script>

<template>
  <div class="resultado seccion contenedor">
    <EstadoConsulta :cargando="cargando" :error="error" texto-cargando="Confirmando tu puntaje con el servidor..." @reintentar="cargar">
      <template #salida>
        <BaseBoton :to="{ name: 'evento', params: { eventoId } }">Volver al evento</BaseBoton>
      </template>

      <div v-if="partida" class="tarjeta">
        <SintaxMascota :estado="vencida ? 'dormido' : partida.puntaje === partida.puntajeMaximo ? 'celebrando' : 'normal'" :alto="120" alt="" />

        <template v-if="enCurso">
          <h1>La partida sigue en curso</h1>
          <p class="texto-secundario">Te quedan {{ partida.segundosRestantes }} segundos.</p>
          <BaseBoton :to="{ name: 'partida', params: { eventoId, desafioId: partida.desafioId }, query: { partida: partida.id } }">
            Seguir jugando
          </BaseBoton>
        </template>

        <template v-else>
          <p class="confirmado" data-prueba="estado-partida" :data-estado="partida.estado">
            <Icono nombre="checkCirculo" :tamano="15" />
            Puntaje guardado · partida {{ partida.numero }}
          </p>
          <h1 class="puntaje" data-prueba="puntaje-final">{{ partida.puntaje }} <small>pts</small></h1>
          <p class="texto-secundario">
            {{ partida.aciertos }} de {{ partida.total }} correctas · {{ formatoTiempo(partida.duracionMs) }}
          </p>

          <MensajeEstado v-if="vencida" tipo="alerta">
            <p>
              <strong>Se termino el tiempo sin cerrar la partida.</strong> Tus respuestas quedaron
              guardadas, pero una partida incompleta no entra al ranking.
            </p>
          </MensajeEstado>
          <MensajeEstado v-else-if="esInvitado" tipo="info" data-prueba="aviso-invitado-resultado">
            <p>
              Jugaste como invitado: este puntaje es tuyo, pero <strong>no aparece en el ranking</strong>.
              Si creas tu cuenta ahora, tus partidas pasan a contar con tu alias.
            </p>
            <BaseBoton tamano="chico" :to="{ name: 'registro' }">Crear mi cuenta</BaseBoton>
          </MensajeEstado>
          <p v-else-if="posicion?.posicion" class="posicion" data-prueba="posicion">
            <Icono nombre="trofeo" :tamano="18" />
            Vas <strong>#{{ posicion.posicion }}</strong> de {{ posicion.participantes }} en este desafio
            <span v-if="posicion.mejorPuntaje > partida.puntaje"> (con tu mejor partida, de {{ posicion.mejorPuntaje }} pts)</span>
          </p>
        </template>

        <div class="acciones">
          <BaseBoton variante="contorno" :to="{ name: 'evento', params: { eventoId } }">Volver al evento</BaseBoton>
          <BaseBoton
            :to="{ name: 'ranking-expo', params: { eventoId }, query: posicion?.participante && posicion?.posicion ? { resaltar: posicion.participante } : {} }"
          >
            <Icono nombre="trofeo" :tamano="16" /> Ver ranking
          </BaseBoton>
        </div>
      </div>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.tarjeta {
  max-width: 560px;
  margin-inline: auto;
  text-align: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
}

.confirmado {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--t-sm);
  font-weight: 800;
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.puntaje {
  font-size: 3.2rem;
  font-variant-numeric: tabular-nums;
  color: var(--c-violeta-osc);
}

.puntaje small {
  font-size: var(--t-lg);
}

.posicion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: center;
  margin-top: var(--e-2);
}
</style>
