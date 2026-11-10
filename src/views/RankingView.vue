<script setup>
import { onMounted, ref } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { useAuth } from '@/composables/useAuth.js'
import { listarEventos } from '@/servicios/competencia.js'

/**
 * Ranking: lleva a la pantalla del ranking de cada evento de expo (etapa 7) y
 * recuerda que se publica. Lo que dice aca es lo mismo que se anuncio desde la
 * etapa 4 y lo que de verdad publica resultados_publicos: alias con codigo,
 * puntaje y tiempo, solo de cuentas.
 */
const { esInvitado, conSesion } = useAuth()
const eventos = ref([])

onMounted(async () => {
  eventos.value = await listarEventos().catch(() => [])
})
</script>

<template>
  <div class="ranking seccion contenedor">
    <div class="tarjeta">
      <SintaxMascota estado="celebrando" :alto="120" alt="" />
      <h1>Ranking de la expo</h1>

      <ul v-if="eventos.length" class="eventos">
        <li v-for="e in eventos" :key="e.id">
          <BaseBoton variante="contorno" ancho-completo :to="{ name: 'ranking-expo', params: { eventoId: e.id } }">
            <Icono nombre="trofeo" :tamano="16" /> {{ e.nombre }}
          </BaseBoton>
        </li>
      </ul>
      <p v-else class="texto-secundario">Todavia no hay eventos con ranking.</p>

      <ul class="reglas" data-prueba="reglas-ranking">
        <li>
          <Icono nombre="escudo" :tamano="18" />
          <span>
            Se muestra <strong>solo tu alias con su codigo</strong> (por ejemplo <code>Ana#0427</code>), el
            puntaje y el tiempo de tu mejor partida. Nunca tu correo, tus respuestas ni tus otras partidas.
          </span>
        </li>
        <li>
          <Icono nombre="usuario" :tamano="18" />
          <span>Solo aparecen las <strong>cuentas</strong>: los invitados juegan y ven su puntaje, pero no figuran.</span>
        </li>
      </ul>

      <BaseBoton v-if="conSesion && esInvitado" :to="{ name: 'registro' }">
        Crear mi cuenta para aparecer
      </BaseBoton>
      <BaseBoton v-else-if="!conSesion" :to="{ name: 'ingresar', query: { volver: '/ranking' } }">
        Ingresar
      </BaseBoton>
    </div>
  </div>
</template>

<style scoped>
.ranking {
  display: grid;
  place-items: start center;
}

.tarjeta {
  width: 100%;
  max-width: 520px;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-3);
  justify-items: center;
  text-align: center;
}

.eventos {
  display: grid;
  gap: var(--e-1);
  width: 100%;
}

.tarjeta h1 {
  font-size: var(--t-xl);
}

.reglas {
  display: grid;
  gap: var(--e-2);
  text-align: left;
  font-size: var(--t-sm);
  width: 100%;
}

.reglas li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.reglas :deep(svg) {
  flex: none;
  color: var(--c-violeta);
  margin-top: 0.15rem;
}

code {
  font-family: var(--f-codigo);
  background: var(--c-fondo);
  padding: 0 0.3rem;
  border-radius: 4px;
}
</style>
