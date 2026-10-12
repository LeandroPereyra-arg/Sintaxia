<script setup>
import { computed } from 'vue'
import Icono from '@/components/Icono.vue'

/**
 * Mensaje en un recuadro de color: error, exito, informacion o advertencia.
 *
 * Nunca depende solo del color: lleva un icono y el texto, y los errores se
 * anuncian solos a los lectores de pantalla (role="alert").
 */
const props = defineProps({
  tipo: {
    type: String,
    default: 'info',
    validator: (v) => ['error', 'exito', 'info', 'alerta'].includes(v)
  }
})

const ICONOS = { error: 'equisCirculo', exito: 'checkCirculo', info: 'bombita', alerta: 'alerta' }
const icono = computed(() => ICONOS[props.tipo])
const rol = computed(() => (props.tipo === 'error' ? 'alert' : 'status'))
</script>

<template>
  <div class="mensaje" :class="`mensaje--${tipo}`" :role="rol">
    <Icono class="mensaje__icono" :nombre="icono" :tamano="20" :trazo="2.2" />
    <div class="mensaje__texto"><slot /></div>
  </div>
</template>

<style scoped>
.mensaje {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  font-size: var(--t-sm);
  border-radius: var(--r-md);
  padding: var(--e-2) var(--e-3);
  border: 2px solid;
}

.mensaje__icono {
  flex: none;
  margin-top: 0.1rem;
}

.mensaje__texto {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.mensaje--error {
  background: var(--c-rojo-suave);
  border-color: var(--c-rojo);
  color: var(--c-rojo-osc);
  font-weight: 700;
}

.mensaje--exito {
  background: var(--c-verde-suave);
  border-color: var(--c-verde);
  color: var(--c-verde-osc);
  font-weight: 700;
}

.mensaje--info {
  background: var(--c-azul-suave);
  border-color: var(--c-azul);
  color: var(--c-azul-osc);
}

.mensaje--alerta {
  background: var(--c-amarillo-suave);
  border-color: var(--c-amarillo);
  color: var(--c-amarillo-osc);
}
</style>
