<script setup>
import { computed } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import Icono from '@/components/Icono.vue'

/**
 * Envoltorio para el resultado de una consulta a la base.
 *
 * Centraliza los tres mensajes que se repiten en todas las pantallas:
 * mientras carga, cuando la consulta falla y cuando no hay nada que mostrar.
 * Asi ninguna vista tiene que volver a escribirlos y todos se ven igual.
 *
 * El boton de reintentar aparece SOLO si el error es reintentable (se cayo la
 * conexion). Si el contenido no existe, reintentar no arregla nada: en ese caso
 * se muestra la salida que le pase la pantalla por el slot `salida`.
 */
const props = defineProps({
  cargando: { type: Boolean, default: false },
  error: { type: Object, default: null },
  vacio: { type: Boolean, default: false },
  textoCargando: { type: String, default: 'Cargando...' },
  tituloVacio: { type: String, default: 'Todavia no hay nada por aca' },
  textoVacio: { type: String, default: 'Volve en unos dias: estamos preparando el contenido.' }
})

defineEmits(['reintentar'])

const puedeReintentar = computed(() => props.error?.reintentable === true)

const tituloError = computed(() =>
  puedeReintentar.value ? 'No pudimos cargar el contenido' : 'No encontramos ese contenido'
)
</script>

<template>
  <!-- 1. Cargando -->
  <div v-if="cargando" class="estado estado--cargando" role="status" aria-live="polite">
    <span class="estado__rueda" aria-hidden="true"></span>
    <p class="texto-secundario">{{ textoCargando }}</p>
  </div>

  <!-- 2. La consulta fallo -->
  <div v-else-if="error" class="estado" role="alert">
    <SintaxMascota estado="confundido" :alto="130" alt="" />
    <h2>{{ tituloError }}</h2>
    <p class="texto-secundario estado__mensaje">{{ error.message }}</p>

    <div class="estado__acciones">
      <BaseBoton v-if="puedeReintentar" @click="$emit('reintentar')">
        <Icono nombre="repetir" :tamano="16" /> Reintentar
      </BaseBoton>
      <slot name="salida" />
    </div>
  </div>

  <!-- 3. La consulta anduvo, pero no hay contenido -->
  <div v-else-if="vacio" class="estado">
    <SintaxMascota estado="pensando" :alto="130" alt="" />
    <h2>{{ tituloVacio }}</h2>
    <p class="texto-secundario estado__mensaje">{{ textoVacio }}</p>
    <div class="estado__acciones">
      <slot name="salida" />
    </div>
  </div>

  <!-- 4. Todo bien -->
  <slot v-else />
</template>

<style scoped>
.estado {
  display: grid;
  justify-items: center;
  gap: var(--e-2);
  text-align: center;
  padding-block: var(--e-5);
}

.estado__mensaje {
  max-width: 46ch;
}

.estado__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: center;
  margin-top: var(--e-1);
}

.estado--cargando {
  gap: var(--e-3);
}

.estado__rueda {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 4px solid var(--c-borde);
  border-top-color: var(--c-verde);
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .estado__rueda {
    animation-duration: 2.4s;
  }
}
</style>
