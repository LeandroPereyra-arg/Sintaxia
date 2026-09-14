<script setup>
import { computed } from 'vue'
import { ESTADO_UNIDAD, ETIQUETA_ESTADO_UNIDAD } from '@/data/unidades.js'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'

/**
 * Tarjeta reutilizable de unidad.
 * El padre le pasa la unidad, su estado real y el progreso; ella solo avisa
 * con `seleccionar` cuando el estudiante quiere entrar.
 */
const props = defineProps({
  unidad: { type: Object, required: true },
  estado: { type: String, default: ESTADO_UNIDAD.BLOQUEADA },
  progreso: { type: Number, default: 0 },
  leccionesCompletadas: { type: Number, default: 0 },
  leccionesTotales: { type: Number, default: 0 }
})

const emit = defineEmits(['seleccionar'])

const bloqueada = computed(() => props.estado === ESTADO_UNIDAD.BLOQUEADA)
const completada = computed(() => props.estado === ESTADO_UNIDAD.COMPLETADA)
const textoEstado = computed(() => ETIQUETA_ESTADO_UNIDAD[props.estado] ?? props.estado)

const textoBoton = computed(() => {
  if (completada.value) return 'Repasar'
  if (bloqueada.value) return 'Bloqueada'
  return props.progreso > 0 ? 'Continuar' : 'Empezar'
})

function seleccionar() {
  if (bloqueada.value) return
  emit('seleccionar', props.unidad)
}
</script>

<template>
  <article class="unidad" :class="{ 'unidad--off': bloqueada, 'unidad--ok': completada }">
    <div
      class="unidad__medalla"
      :style="{ background: bloqueada ? 'var(--c-gris-claro)' : unidad.color }"
      aria-hidden="true"
    >
      <span v-if="bloqueada">🔒</span>
      <span v-else-if="completada">✓</span>
      <span v-else>{{ unidad.icono }}</span>
    </div>

    <div class="unidad__cuerpo">
      <header class="unidad__cabecera">
        <p class="unidad__numero">Unidad {{ unidad.numero }}</p>
        <span class="etiqueta" :class="`etiqueta--${estado}`">{{ textoEstado }}</span>
      </header>

      <h3 class="unidad__titulo">{{ unidad.titulo }}</h3>
      <p class="unidad__descripcion">{{ unidad.descripcion }}</p>

      <ul class="unidad__temas">
        <li v-for="tema in unidad.temas" :key="tema">{{ tema }}</li>
      </ul>

      <div class="unidad__progreso">
        <BarraProgreso
          :valor="progreso"
          :color="completada ? 'var(--c-verde)' : unidad.color"
          :etiqueta="`Progreso de la unidad ${unidad.numero}`"
        />
        <p class="unidad__contador">
          {{ leccionesCompletadas }} / {{ leccionesTotales }} lecciones · {{ progreso }} %
        </p>
      </div>
    </div>

    <BaseBoton
      class="unidad__accion"
      :variante="completada ? 'contorno' : 'primario'"
      :deshabilitado="bloqueada"
      @click="seleccionar"
    >
      {{ textoBoton }}
    </BaseBoton>
  </article>
</template>

<style scoped>
.unidad {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--e-3);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.unidad:not(.unidad--off):hover {
  border-color: var(--c-verde);
  transform: translateY(-2px);
}

.unidad--ok {
  border-color: var(--c-verde);
  background: linear-gradient(180deg, var(--c-verde-suave), var(--c-blanco) 60%);
}

.unidad--off {
  opacity: 0.7;
}

.unidad__medalla {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--r-full);
  font-size: 1.7rem;
  color: var(--c-blanco);
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.unidad__cabecera {
  display: flex;
  align-items: center;
  gap: var(--e-2);
}

.unidad__numero {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-gris);
}

.unidad__titulo {
  font-size: var(--t-md);
  margin-top: 0.15rem;
}

.unidad__descripcion {
  color: var(--c-gris);
  font-size: var(--t-sm);
  margin-bottom: var(--e-2);
}

.unidad__temas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: var(--e-2);
}

.unidad__temas li {
  font-family: var(--f-codigo);
  font-size: var(--t-xs);
  background: var(--c-fondo);
  border: 1px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.1rem 0.45rem;
  color: var(--c-gris);
}

.unidad__progreso {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.unidad__contador {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
}

@media (max-width: 700px) {
  .unidad {
    grid-template-columns: auto 1fr;
  }
  .unidad__accion {
    grid-column: 1 / -1;
  }
}
</style>
