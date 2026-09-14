<script setup>
import Icono from '@/components/Icono.vue'
/** Ejercicio de verdadero o falso. */
const props = defineProps({
  ejercicio: { type: Object, required: true },
  modelValue: { type: [Boolean, null], default: null },
  bloqueado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const opciones = [
  { valor: true, texto: 'Verdadero', icono: 'check' },
  { valor: false, texto: 'Falso', icono: 'equis' }
]

function elegir(valor) {
  if (props.bloqueado) return
  emit('update:modelValue', valor)
}

function clasesDe(valor) {
  const elegida = props.modelValue === valor
  if (!props.bloqueado) return { 'vf--elegida': elegida }
  return {
    'vf--elegida': elegida,
    'vf--correcta': valor === props.ejercicio.respuesta,
    'vf--incorrecta': elegida && valor !== props.ejercicio.respuesta
  }
}
</script>

<template>
  <div class="vf">
    <button
      v-for="opcion in opciones"
      :key="String(opcion.valor)"
      type="button"
      class="vf__boton"
      :class="clasesDe(opcion.valor)"
      :aria-pressed="modelValue === opcion.valor"
      :disabled="bloqueado"
      @click="elegir(opcion.valor)"
    >
      <Icono class="vf__icono" :nombre="opcion.icono" :tamano="34" :trazo="2.6" />
      {{ opcion.texto }}
    </button>
  </div>
</template>

<style scoped>
.vf {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--e-3);
}

.vf__boton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--e-1);
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-base);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  box-shadow: 0 4px 0 var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-4) var(--e-2);
  transition: transform 0.08s ease, background 0.15s ease;
}

.vf__icono {
  font-size: 1.6rem;
}

.vf__boton:not(:disabled):active {
  transform: translateY(4px);
  box-shadow: none;
}

.vf--elegida {
  border-color: var(--c-azul);
  background: var(--c-azul-suave);
  box-shadow: 0 4px 0 var(--c-azul);
  color: var(--c-azul-osc);
}

.vf--correcta {
  animation: saltito 0.45s var(--anim-rebote);
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
  box-shadow: 0 4px 0 var(--c-verde);
  color: var(--c-verde-osc);
}

.vf--incorrecta {
  animation: sacudir 0.45s ease;
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
  box-shadow: 0 4px 0 var(--c-rojo);
  color: var(--c-rojo-osc);
}

.vf__boton:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 2px;
}
</style>
