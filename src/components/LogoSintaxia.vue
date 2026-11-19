<script setup>
import { ref } from 'vue'

/**
 * Logo de Sintaxia: Sintax, la cotorra con la notebook (public/sintax/normal.webp).
 *
 * Variantes:
 *   icono    -> solo la cotorra (cabecera, pie, pantalla del ranking)
 *   completo -> la cotorra y la palabra "Sintaxia"
 *
 * Si la imagen no carga, se dibuja un SVG de respaldo: nunca se ve una imagen rota.
 */
const props = defineProps({
  variante: {
    type: String,
    default: 'icono',
    validator: (v) => ['icono', 'completo'].includes(v)
  },
  /** Alto en pixeles (el ancho se calcula solo). */
  alto: { type: Number, default: 38 },
  /** Texto alternativo; vacio si el logo es decorativo. */
  alt: { type: String, default: 'Sintaxia' },
  /** Anima el logo al aparecer. */
  animado: { type: Boolean, default: false }
})

const RUTA = `${import.meta.env.BASE_URL}sintax/normal.webp`

// Si la imagen no esta, se muestra el respaldo.
const hayImagen = ref(true)
</script>

<template>
  <span
    class="logo"
    :class="[`logo--${variante}`, { 'logo--animado': animado }]"
    :style="{ '--alto': alto + 'px' }"
  >
    <img
      v-if="hayImagen"
      :src="RUTA"
      :alt="variante === 'completo' ? '' : alt"
      class="logo__imagen"
      decoding="async"
      @error="hayImagen = false"
    />
    <!-- Respaldo: se dibuja solo si falta la imagen de la cotorra -->
    <svg
      v-else
      class="logo__respaldo"
      viewBox="0 0 64 64"
      role="img"
      :aria-label="alt || undefined"
    >
      <rect width="64" height="64" rx="16" fill="#2FBF56" />
      <path d="M24 21 13 32l11 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M40 21l11 11-11 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-if="variante === 'completo'" class="logo__palabra" :aria-label="alt || undefined">Sintaxia</span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
  flex-shrink: 0;
  height: var(--alto);
}

.logo__imagen,
.logo__respaldo {
  height: 100%;
  width: auto;
  display: block;
  object-fit: contain;
}

.logo--icono {
  min-width: var(--alto);
}

.logo__palabra {
  font-size: calc(var(--alto) * 0.42);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--c-violeta-osc);
}

/* Entrada suave, para la portada y la pantalla de ingreso. */
.logo--animado {
  animation: logo-entra 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes logo-entra {
  from {
    opacity: 0;
    transform: scale(0.82) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
