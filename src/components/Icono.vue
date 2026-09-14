<script setup>
import { computed } from 'vue'
import { iconos } from '@/assets/iconos.js'

/**
 * Icono SVG del set propio (`src/assets/iconos.js`).
 *
 * Hereda el color del texto, asi que no hace falta pasarle color salvo que se
 * quiera uno distinto. Si no se le da `etiqueta` se marca como decorativo para
 * que el lector de pantalla lo ignore.
 */
const props = defineProps({
  nombre: { type: String, required: true },
  /** Tamanio en pixeles. */
  tamano: { type: [Number, String], default: 20 },
  /** Grosor del trazo. */
  trazo: { type: [Number, String], default: 2 },
  /** Texto para lectores de pantalla. Vacio = icono decorativo. */
  etiqueta: { type: String, default: '' }
})

const contenido = computed(() => {
  const svg = iconos[props.nombre]
  if (!svg && import.meta.env.DEV) {
    console.warn(`[Icono] no existe el icono "${props.nombre}"`)
  }
  return svg ?? ''
})
</script>

<template>
  <svg
    class="icono"
    :width="tamano"
    :height="tamano"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="trazo"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="etiqueta ? 'img' : undefined"
    :aria-label="etiqueta || undefined"
    :aria-hidden="etiqueta ? undefined : 'true'"
    v-html="contenido"
  />
</template>

<style scoped>
.icono {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
