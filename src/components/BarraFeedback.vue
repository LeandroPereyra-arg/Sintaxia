<script setup>
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'

/**
 * Barra inferior de correccion: aparece cuando el estudiante comprueba su
 * respuesta y muestra si acerto, la explicacion y el boton para continuar.
 */
defineProps({
  correcta: { type: Boolean, required: true },
  explicacion: { type: String, default: '' },
  respuestaCorrecta: { type: String, default: '' },
  textoBoton: { type: String, default: 'Continuar' }
})

defineEmits(['continuar'])
</script>

<template>
  <div class="feedback" :class="correcta ? 'feedback--ok' : 'feedback--mal'" role="status">
    <div class="feedback__interior contenedor">
      <div class="feedback__mensaje">
        <Icono class="feedback__icono" :nombre="correcta ? 'checkCirculo' : 'equisCirculo'" :tamano="30" :trazo="2.4" />
        <div>
          <p class="feedback__titulo">
            {{ correcta ? 'Muy bien!' : 'Respuesta incorrecta' }}
          </p>
          <p v-if="!correcta && respuestaCorrecta" class="feedback__correcta">
            Respuesta correcta: <code>{{ respuestaCorrecta }}</code>
          </p>
          <p v-if="explicacion" class="feedback__explicacion">{{ explicacion }}</p>
        </div>
      </div>

      <BaseBoton
        :variante="correcta ? 'primario' : 'peligro'"
        tamano="grande"
        @click="$emit('continuar')"
      >
        {{ textoBoton }}
      </BaseBoton>
    </div>
  </div>
</template>

<style scoped>
.feedback {
  position: sticky;
  bottom: 0;
  border-top: 2px solid transparent;
  padding-block: var(--e-3);
  animation: entrar-desde-abajo var(--anim-media) var(--anim-suave);
}

.feedback--ok {
  background: var(--c-verde-suave);
  border-color: var(--c-verde);
  color: var(--c-verde-osc);
}

.feedback--mal {
  background: var(--c-rojo-suave);
  border-color: var(--c-rojo);
  color: var(--c-rojo-osc);
}

.feedback__interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e-3);
  flex-wrap: wrap;
}

.feedback__mensaje {
  display: flex;
  gap: var(--e-2);
  align-items: flex-start;
}

.feedback__icono {
  animation: latido var(--anim-lenta) var(--anim-rebote);
}

.feedback__titulo {
  font-family: var(--f-titulo);
  font-weight: 900;
  font-size: var(--t-md);
}

.feedback__correcta code {
  font-family: var(--f-codigo);
  font-weight: 700;
  white-space: pre-wrap;
}

.feedback__explicacion {
  font-size: var(--t-sm);
  color: var(--c-tinta);
  max-width: 60ch;
  margin-top: 0.2rem;
}

@media (max-width: 640px) {
  .feedback__interior > :last-child {
    width: 100%;
  }
}
</style>
