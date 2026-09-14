<script setup>
import { computed, ref, watch } from 'vue'
import { mezclar } from '@/utils/verificarRespuesta.js'

/**
 * Ejercicio de ordenar bloques de codigo.
 * Se toca un bloque del banco para agregarlo a la respuesta y se lo vuelve a
 * tocar arriba para devolverlo (mismo gesto que usa Duolingo con las palabras).
 */
const props = defineProps({
  ejercicio: { type: Object, required: true },
  modelValue: { type: Array, default: () => [] },
  bloqueado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const banco = ref(mezclar(props.ejercicio.fragmentos))

watch(
  () => props.ejercicio.id,
  () => {
    banco.value = mezclar(props.ejercicio.fragmentos)
  }
)

const elegidos = computed(() =>
  props.modelValue
    .map((id) => props.ejercicio.fragmentos.find((f) => f.id === id))
    .filter(Boolean)
)

const disponibles = computed(() =>
  banco.value.filter((fragmento) => !props.modelValue.includes(fragmento.id))
)

function agregar(fragmento) {
  if (props.bloqueado) return
  emit('update:modelValue', [...props.modelValue, fragmento.id])
}

function quitar(indice) {
  if (props.bloqueado) return
  const copia = [...props.modelValue]
  copia.splice(indice, 1)
  emit('update:modelValue', copia)
}

/** Cuando se corrige, marca en verde los bloques que quedaron en su lugar. */
function claseDe(indice, id) {
  if (!props.bloqueado) return ''
  return props.ejercicio.respuesta[indice] === id ? 'ficha--correcta' : 'ficha--incorrecta'
}
</script>

<template>
  <div class="ordenar">
    <ol class="ordenar__respuesta" aria-label="Tu respuesta">
      <li v-for="(fragmento, indice) in elegidos" :key="fragmento.id">
        <button
          type="button"
          class="ficha ficha--puesta"
          :class="claseDe(indice, fragmento.id)"
          :disabled="bloqueado"
          @click="quitar(indice)"
        >
          <span class="ficha__numero">{{ indice + 1 }}</span>
          <code>{{ fragmento.texto }}</code>
        </button>
      </li>
      <li v-if="elegidos.length === 0" class="ordenar__vacio">
        Toca los bloques de abajo para armar el codigo
      </li>
    </ol>

    <div class="ordenar__banco" aria-label="Bloques disponibles">
      <button
        v-for="fragmento in disponibles"
        :key="fragmento.id"
        type="button"
        class="ficha"
        :disabled="bloqueado"
        @click="agregar(fragmento)"
      >
        <code>{{ fragmento.texto }}</code>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ordenar {
  display: flex;
  flex-direction: column;
  gap: var(--e-3);
}

.ordenar__respuesta {
  display: flex;
  flex-direction: column;
  gap: var(--e-1);
  min-height: 92px;
  background: var(--c-fondo);
  border: 2px dashed var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-2);
  list-style: none;
}

.ordenar__vacio {
  color: var(--c-gris-claro);
  font-size: var(--t-sm);
  text-align: center;
  padding: var(--e-3);
}

.ordenar__banco {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
}

.ficha {
  display: flex;
  align-items: center;
  gap: var(--e-2);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  box-shadow: 0 3px 0 var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.55rem 0.8rem;
  text-align: left;
  transition: transform 0.08s ease, border-color 0.15s ease;
}

.ficha code {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  white-space: pre;
}

.ficha:not(:disabled):hover {
  border-color: var(--c-violeta);
}

.ficha:not(:disabled):active {
  transform: translateY(3px);
  box-shadow: none;
}

.ficha--puesta {
  width: 100%;
  background: var(--c-blanco);
  border-color: var(--c-violeta);
}

.ficha__numero {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: var(--r-full);
  background: var(--c-violeta-suave);
  color: var(--c-violeta-osc);
  font-size: var(--t-xs);
  font-weight: 800;
}

.ficha--correcta {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
}

.ficha--incorrecta {
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
}

.ficha:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 2px;
}
</style>
