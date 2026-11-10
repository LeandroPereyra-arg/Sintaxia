<script setup>
import { onMounted, ref } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import { listarEventos } from '@/servicios/competencia.js'

/** Eventos de expo visibles: los abiertos para jugar y los ya cerrados. */
const eventos = ref([])
const cargando = ref(true)
const error = ref(null)

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const lista = await listarEventos()
    // Primero los abiertos.
    eventos.value = lista.sort((a, b) => (a.estado === 'abierto' ? -1 : 0) - (b.estado === 'abierto' ? -1 : 0))
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="expo seccion contenedor">
    <header class="expo__cabecera">
      <h1>Competencia</h1>
      <p class="texto-secundario">
        Desafios de programacion contra reloj. Jugas desde tu celular y el ranking se ve en la
        pantalla del evento.
      </p>
    </header>

    <EstadoConsulta
      :cargando="cargando"
      :error="error"
      :vacio="!cargando && !error && eventos.length === 0"
      titulo-vacio="Todavia no hay eventos"
      texto-vacio="Cuando se abra una expo vas a poder jugar desde aca."
      @reintentar="cargar"
    >
      <ul class="eventos">
        <li v-for="evento in eventos" :key="evento.id" class="evento" :data-evento="evento.id">
          <div>
            <span class="etiqueta" :class="evento.estado === 'abierto' ? 'etiqueta--disponible' : 'etiqueta--bloqueada'">
              {{ evento.estado === 'abierto' ? 'Abierto' : 'Cerrado' }}
            </span>
            <h2>{{ evento.nombre }}</h2>
            <p class="texto-secundario">{{ evento.descripcion }}</p>
            <p v-if="evento.lugar" class="evento__lugar"><Icono nombre="diana" :tamano="15" /> {{ evento.lugar }}</p>
          </div>
          <div class="evento__acciones">
            <BaseBoton :to="{ name: 'evento', params: { eventoId: evento.id } }">
              {{ evento.estado === 'abierto' ? 'Ver desafios' : 'Ver resultados' }}
            </BaseBoton>
          </div>
        </li>
      </ul>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.expo {
  display: grid;
  gap: var(--e-3);
  max-width: 860px;
  margin-inline: auto;
}

.eventos {
  display: grid;
  gap: var(--e-3);
}

.evento {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--e-3);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
}

.evento h2 {
  margin-block: 0.3rem;
}

.evento__lugar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  margin-top: 0.3rem;
}

.evento__acciones {
  display: grid;
  gap: var(--e-1);
}

@media (max-width: 560px) {
  .evento {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
