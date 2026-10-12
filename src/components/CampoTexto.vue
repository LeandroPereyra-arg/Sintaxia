<script setup>
import { computed, ref, useId } from 'vue'

/**
 * Campo de formulario reutilizable: etiqueta, ayuda y mensaje de error.
 *
 * El error se asocia al campo con aria-describedby y aria-invalid, asi que un
 * lector de pantalla lo anuncia al entrar. Los campos de contrasena traen un
 * boton para mostrarla, util en el celular donde se tipea mal.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  etiqueta: { type: String, required: true },
  tipo: { type: String, default: 'text' },
  ayuda: { type: String, default: '' },
  error: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  maxlength: { type: Number, default: undefined },
  placeholder: { type: String, default: '' },
  requerido: { type: Boolean, default: false },
  deshabilitado: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const id = useId()
const visible = ref(false)

const esClave = computed(() => props.tipo === 'password')
const tipoReal = computed(() => (esClave.value && visible.value ? 'text' : props.tipo))
const descripcion = computed(() =>
  props.error ? `${id}-error` : props.ayuda ? `${id}-ayuda` : undefined
)
</script>

<template>
  <div class="campo" :class="{ 'campo--error': error }">
    <label :for="id" class="campo__etiqueta">{{ etiqueta }}</label>

    <div class="campo__control">
      <input
        :id="id"
        class="campo__input"
        :type="tipoReal"
        :value="modelValue"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :required="requerido"
        :disabled="deshabilitado"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="descripcion"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="esClave"
        type="button"
        class="campo__alternar"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>

    <p v-if="error" :id="`${id}-error`" class="campo__mensaje campo__mensaje--error">{{ error }}</p>
    <p v-else-if="ayuda" :id="`${id}-ayuda`" class="campo__mensaje">{{ ayuda }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: grid;
  gap: 0.3rem;
  text-align: left;
  width: 100%;
}

.campo__etiqueta {
  font-size: var(--t-sm);
  font-weight: 800;
  color: var(--c-tinta);
}

.campo__control {
  position: relative;
  display: flex;
}

.campo__input {
  width: 100%;
  font-family: inherit;
  font-size: var(--t-base);
  /* 16px como minimo: en iOS un campo mas chico hace zoom al tocarlo. */
  min-height: 48px;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: 0.55rem 0.8rem;
  background: var(--c-blanco);
  color: var(--c-tinta);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.campo__input::placeholder {
  color: var(--c-gris-claro);
}

.campo__input:focus {
  outline: none;
  border-color: var(--c-azul);
  box-shadow: 0 0 0 3px var(--c-azul-suave);
}

.campo--error .campo__input {
  border-color: var(--c-rojo);
}

.campo--error .campo__input:focus {
  box-shadow: 0 0 0 3px var(--c-rojo-suave);
}

.campo__input:disabled {
  background: var(--c-fondo);
  cursor: not-allowed;
}

.campo__control:has(.campo__alternar) .campo__input {
  padding-right: 5.2rem;
}

.campo__alternar {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--t-xs);
  font-weight: 800;
  color: var(--c-azul-osc);
  padding: 0.4rem 0.6rem;
  border-radius: var(--r-sm);
}

.campo__alternar:hover {
  background: var(--c-azul-suave);
}

.campo__mensaje {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.campo__mensaje--error {
  color: var(--c-rojo-osc);
  font-weight: 700;
}
</style>
