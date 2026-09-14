<script setup>
import { computed } from 'vue'

/** Barra de progreso reutilizable (unidades, lecciones y perfil). */
const props = defineProps({
  valor: { type: Number, required: true },
  maximo: { type: Number, default: 100 },
  color: { type: String, default: 'var(--c-verde)' },
  alto: { type: String, default: '12px' },
  etiqueta: { type: String, default: 'Progreso' }
})

const porcentaje = computed(() => {
  if (props.maximo <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((props.valor / props.maximo) * 100)))
})
</script>

<template>
  <div
    class="barra"
    :style="{ height: alto }"
    role="progressbar"
    :aria-valuenow="porcentaje"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="etiqueta"
  >
    <div class="barra__relleno" :style="{ width: porcentaje + '%', background: color }" />
  </div>
</template>

<style scoped>
.barra {
  width: 100%;
  background: var(--c-borde);
  border-radius: var(--r-full);
  overflow: hidden;
}

.barra__relleno {
  height: 100%;
  border-radius: var(--r-full);
  transition: width 0.35s ease;
}
</style>
