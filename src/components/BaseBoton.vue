<script setup>
import { computed } from 'vue'

/**
 * Boton reutilizable con el estilo "3D" de la identidad visual:
 * un borde inferior solido que desaparece al presionarlo.
 * Si recibe `to` se renderiza como <router-link>, si no como <button>.
 */
const props = defineProps({
  variante: {
    type: String,
    default: 'primario',
    validator: (v) => ['primario', 'secundario', 'contorno', 'peligro', 'texto'].includes(v)
  },
  tamano: {
    type: String,
    default: 'medio',
    validator: (v) => ['chico', 'medio', 'grande'].includes(v)
  },
  anchoCompleto: { type: Boolean, default: false },
  deshabilitado: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
  type: { type: String, default: 'button' }
})

const etiqueta = computed(() => (props.to && !props.deshabilitado ? 'router-link' : 'button'))

const clases = computed(() => [
  'boton',
  `boton--${props.variante}`,
  `boton--${props.tamano}`,
  { 'boton--ancho': props.anchoCompleto, 'boton--off': props.deshabilitado }
])
</script>

<template>
  <component
    :is="etiqueta"
    :class="clases"
    :to="to && !deshabilitado ? to : undefined"
    :type="etiqueta === 'button' ? type : undefined"
    :disabled="etiqueta === 'button' ? deshabilitado : undefined"
    :aria-disabled="deshabilitado ? 'true' : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: var(--f-titulo);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: var(--r-md);
  border: 2px solid transparent;
  transition: transform 0.06s ease, filter 0.15s ease, background-color 0.15s ease;
  text-align: center;
  user-select: none;
}

/* Tamanos */
.boton--chico {
  font-size: var(--t-xs);
  padding: 0.5rem 0.9rem;
}
.boton--medio {
  font-size: var(--t-sm);
  padding: 0.75rem 1.4rem;
}
.boton--grande {
  font-size: var(--t-base);
  padding: 1rem 2rem;
}
.boton--ancho {
  width: 100%;
}

/* Variantes */
.boton--primario {
  background: var(--c-verde);
  color: var(--c-blanco);
  box-shadow: 0 4px 0 var(--c-verde-osc);
}
.boton--secundario {
  background: var(--c-violeta);
  color: var(--c-blanco);
  box-shadow: 0 4px 0 var(--c-violeta-osc);
}
.boton--peligro {
  background: var(--c-rojo);
  color: var(--c-blanco);
  box-shadow: 0 4px 0 var(--c-rojo-osc);
}
.boton--contorno {
  background: var(--c-blanco);
  color: var(--c-gris);
  border-color: var(--c-borde);
  box-shadow: 0 4px 0 var(--c-borde);
}
.boton--texto {
  background: transparent;
  color: var(--c-gris);
  text-transform: none;
  letter-spacing: 0;
}

.boton:not(.boton--off):not(.boton--texto):hover {
  filter: brightness(1.05);
}
.boton--texto:hover {
  color: var(--c-tinta);
  background: var(--c-borde);
}

/* Efecto de "hundido" al presionar */
.boton:not(.boton--off):not(.boton--texto):active {
  transform: translateY(4px);
  box-shadow: none;
}

.boton--off {
  background: var(--c-borde);
  color: var(--c-gris-claro);
  border-color: transparent;
  box-shadow: none;
  cursor: not-allowed;
}

.boton:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 2px;
}
</style>
