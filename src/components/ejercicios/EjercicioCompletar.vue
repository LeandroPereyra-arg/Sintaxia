<script setup>
import Icono from '@/components/Icono.vue'
import { computed, ref, watch, nextTick } from 'vue'

/**
 * Ejercicio de completar: la plantilla trae "___" donde falta el codigo y el
 * estudiante escribe la palabra que corresponde.
 */
const props = defineProps({
  ejercicio: { type: Object, required: true },
  modelValue: { type: String, default: '' },
  bloqueado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'comprobar'])

const campo = ref(null)
const mostrarPista = ref(false)

// La plantilla se parte en el hueco para poder dibujar el input en el medio.
const partes = computed(() => {
  const [antes, ...resto] = props.ejercicio.plantilla.split('___')
  return { antes, despues: resto.join('___') }
})

watch(
  () => props.ejercicio.id,
  async () => {
    mostrarPista.value = false
    await nextTick()
    campo.value?.focus()
  },
  { immediate: true }
)
</script>

<template>
  <div class="completar">
    <pre v-if="ejercicio.codigo" class="bloque-codigo">{{ ejercicio.codigo }}</pre>

    <div class="completar__editor">
      <span class="completar__texto">{{ partes.antes }}</span>
      <input
        ref="campo"
        class="completar__campo"
        :value="modelValue"
        :disabled="bloqueado"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="Escribi el codigo que falta"
        placeholder="..."
        @input="emit('update:modelValue', $event.target.value)"
        @keyup.enter="emit('comprobar')"
      />
      <span class="completar__texto">{{ partes.despues }}</span>
    </div>

    <button
      v-if="ejercicio.pista && !bloqueado"
      type="button"
      class="completar__pista"
      @click="mostrarPista = !mostrarPista"
    >
      <Icono nombre="bombita" :tamano="16" />
      {{ mostrarPista ? 'Ocultar pista' : 'Ver pista' }}
    </button>
    <p v-if="mostrarPista && !bloqueado" class="completar__pista-texto">{{ ejercicio.pista }}</p>
  </div>
</template>

<style scoped>
.completar {
  display: flex;
  flex-direction: column;
  gap: var(--e-2);
  align-items: flex-start;
}

.completar__editor {
  width: 100%;
  background: var(--c-noche);
  color: #e8eef4;
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  border-radius: var(--r-md);
  padding: var(--e-3);
  overflow-x: auto;
}

.completar__texto {
  white-space: pre-wrap;
}

.completar__campo {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-noche);
  background: var(--c-amarillo);
  border: none;
  border-radius: var(--r-sm);
  padding: 0.1rem 0.5rem;
  min-width: 7ch;
  width: 10ch;
}

.completar__campo:focus {
  outline: 3px solid var(--c-verde);
  outline-offset: 1px;
}

.completar__campo:disabled {
  opacity: 0.9;
}

.completar__pista {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-violeta-osc);
  text-decoration: underline;
}

.completar__pista-texto {
  font-size: var(--t-sm);
  color: var(--c-gris);
  background: var(--c-violeta-suave);
  border-radius: var(--r-sm);
  padding: var(--e-2);
}
</style>
