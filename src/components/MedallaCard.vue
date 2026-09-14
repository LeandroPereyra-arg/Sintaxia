<script setup>
import { computed } from 'vue'

/**
 * Medalla de logro.
 * Se dibuja como una medalla de verdad: disco con anillo del color del nivel
 * y una cinta debajo. Las que faltan se ven en gris con su barra de avance.
 */
const props = defineProps({
  medalla: { type: Object, required: true },
  /** Marca visualmente una medalla recien ganada. */
  nueva: { type: Boolean, default: false }
})

const COLORES = {
  bronce: { base: '#c8834a', claro: '#e8b48a', oscuro: '#8f5a2d' },
  plata: { base: '#9aa7b4', claro: '#cfd8e0', oscuro: '#6d7a86' },
  oro: { base: '#e8b923', claro: '#f7db7d', oscuro: '#b08c0c' },
  diamante: { base: '#4fc3e8', claro: '#a5e6f7', oscuro: '#2790b3' }
}

const color = computed(() => COLORES[props.medalla.nivel] ?? COLORES.bronce)

const porcentaje = computed(() => {
  const { actual, objetivo } = props.medalla.progreso ?? {}
  if (!objetivo) return 0
  return Math.min(100, Math.round((actual / objetivo) * 100))
})

const fecha = computed(() => {
  if (!props.medalla.obtenidaEn) return ''
  return new Date(props.medalla.obtenidaEn).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})
</script>

<template>
  <article
    class="medalla"
    :class="{ 'medalla--off': !medalla.obtenida, 'medalla--nueva': nueva }"
    :style="{
      '--base': color.base,
      '--claro': color.claro,
      '--oscuro': color.oscuro
    }"
  >
    <div class="medalla__disco">
      <span class="medalla__cinta medalla__cinta--izq" aria-hidden="true" />
      <span class="medalla__cinta medalla__cinta--der" aria-hidden="true" />
      <span class="medalla__icono" aria-hidden="true">
        {{ medalla.obtenida ? medalla.icono : '🔒' }}
      </span>
    </div>

    <h3 class="medalla__nombre">{{ medalla.nombre }}</h3>
    <p class="medalla__descripcion">{{ medalla.descripcion }}</p>

    <p v-if="medalla.obtenida" class="medalla__fecha">
      <span class="medalla__nivel">{{ medalla.nivel }}</span>
      <span v-if="fecha"> · {{ fecha }}</span>
    </p>

    <div v-else class="medalla__avance">
      <div class="medalla__barra">
        <div class="medalla__relleno" :style="{ width: porcentaje + '%' }" />
      </div>
      <span>{{ medalla.progreso.actual }} / {{ medalla.progreso.objetivo }}</span>
    </div>
  </article>
</template>

<style scoped>
.medalla {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3) var(--e-2) var(--e-2);
  position: relative;
}

.medalla:not(.medalla--off) {
  border-color: color-mix(in srgb, var(--base) 45%, var(--c-borde));
}

/* --- el disco de la medalla --- */
.medalla__disco {
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 32% 28%, var(--claro), var(--base) 62%, var(--oscuro));
  box-shadow: inset 0 -3px 6px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(31, 41, 51, 0.18);
  margin-bottom: 0.4rem;
}

/* las dos puntas de la cinta, atras del disco */
.medalla__cinta {
  position: absolute;
  top: 78%;
  width: 14px;
  height: 26px;
  background: var(--oscuro);
  z-index: -1;
}
.medalla__cinta--izq {
  left: 12px;
  transform: rotate(10deg);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}
.medalla__cinta--der {
  right: 12px;
  transform: rotate(-10deg);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}

.medalla__icono {
  font-size: 1.7rem;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
}

.medalla__nombre {
  font-size: var(--t-sm);
  font-weight: 800;
}

.medalla__descripcion {
  font-size: var(--t-xs);
  color: var(--c-gris);
  line-height: 1.35;
}

.medalla__fecha {
  font-size: var(--t-xs);
  color: var(--c-gris);
  margin-top: auto;
  padding-top: 0.3rem;
}

.medalla__nivel {
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--oscuro);
}

.medalla__avance {
  width: 100%;
  margin-top: auto;
  padding-top: 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
}

.medalla__barra {
  width: 100%;
  height: 6px;
  background: var(--c-borde);
  border-radius: var(--r-full);
  overflow: hidden;
}

.medalla__relleno {
  height: 100%;
  background: var(--c-gris-claro);
  border-radius: var(--r-full);
  transition: width 0.35s ease;
}

/* --- bloqueada --- */
.medalla--off {
  background: var(--c-fondo);
}
.medalla--off .medalla__disco {
  background: radial-gradient(circle at 32% 28%, #d7dde3, #b3bcc5 62%, #8e989f);
  box-shadow: inset 0 -3px 6px rgba(0, 0, 0, 0.15);
}
.medalla--off .medalla__cinta {
  background: #97a1a9;
}
.medalla--off .medalla__nombre {
  color: var(--c-gris);
}

/* --- recien ganada --- */
.medalla--nueva {
  animation: aparecer 0.5s ease;
  border-color: var(--base);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--base) 35%, transparent);
}

@keyframes aparecer {
  0% {
    transform: scale(0.6) rotate(-12deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.08) rotate(4deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}
</style>
