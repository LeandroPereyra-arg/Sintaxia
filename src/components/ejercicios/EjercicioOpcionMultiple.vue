<script setup>
import { computed, ref, watch } from 'vue'
import { mezclar } from '@/utils/verificarRespuesta.js'

/** Ejercicio de opcion multiple: una sola opcion correcta. */
const props = defineProps({
  ejercicio: { type: Object, required: true },
  modelValue: { type: [String, null], default: null },
  bloqueado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

// Las opciones se mezclan una vez por ejercicio para que el orden no sea una pista.
const opciones = ref(mezclar(props.ejercicio.opciones))
watch(
  () => props.ejercicio.id,
  () => {
    opciones.value = mezclar(props.ejercicio.opciones)
  }
)

const idCorrecto = computed(() => props.ejercicio.respuesta)

function elegir(opcion) {
  if (props.bloqueado) return
  emit('update:modelValue', opcion.id)
}

function clasesDe(opcion) {
  const elegida = props.modelValue === opcion.id
  if (!props.bloqueado) return { 'opcion--elegida': elegida }
  return {
    'opcion--elegida': elegida,
    'opcion--correcta': opcion.id === idCorrecto.value,
    'opcion--incorrecta': elegida && opcion.id !== idCorrecto.value
  }
}
</script>

<template>
  <ul class="opciones">
    <li v-for="opcion in opciones" :key="opcion.id">
      <button
        type="button"
        class="opcion"
        :class="clasesDe(opcion)"
        :aria-pressed="modelValue === opcion.id"
        :disabled="bloqueado"
        @click="elegir(opcion)"
      >
        <span class="opcion__texto">{{ opcion.texto }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.opciones {
  display: grid;
  gap: var(--e-2);
}

.opcion {
  width: 100%;
  text-align: left;
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  box-shadow: 0 4px 0 var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-3);
  transition: transform 0.08s ease, border-color 0.15s ease, background 0.15s ease;
}

.opcion:not(:disabled):hover {
  background: var(--c-fondo);
}

.opcion:not(:disabled):active {
  transform: translateY(4px);
  box-shadow: none;
}

.opcion--elegida {
  border-color: var(--c-azul);
  background: var(--c-azul-suave);
  box-shadow: 0 4px 0 var(--c-azul);
  color: var(--c-azul-osc);
}

.opcion--correcta {
  animation: saltito 0.45s var(--anim-rebote);
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
  box-shadow: 0 4px 0 var(--c-verde);
  color: var(--c-verde-osc);
}

.opcion--incorrecta {
  animation: sacudir 0.45s ease;
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
  box-shadow: 0 4px 0 var(--c-rojo);
  color: var(--c-rojo-osc);
}

.opcion:disabled {
  cursor: default;
}

.opcion:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 2px;
}
</style>
