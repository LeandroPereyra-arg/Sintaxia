<script setup>
import Icono from '@/components/Icono.vue'
import { computed } from 'vue'
import { ESTADO_CURSO, ETIQUETA_ESTADO_CURSO } from '@/data/cursos.js'
import BaseBoton from '@/components/BaseBoton.vue'

/**
 * Tarjeta reutilizable de curso.
 * Recibe el curso completo desde el componente padre y avisa con el evento
 * `seleccionar` cuando el estudiante quiere entrar; la navegacion la decide
 * el padre, no la tarjeta.
 */
const props = defineProps({
  curso: { type: Object, required: true }
})

const emit = defineEmits(['seleccionar'])

const disponible = computed(() => props.curso.estado === ESTADO_CURSO.DISPONIBLE)
const bloqueado = computed(() => props.curso.estado === ESTADO_CURSO.BLOQUEADO)
const textoEstado = computed(() => ETIQUETA_ESTADO_CURSO[props.curso.estado] ?? props.curso.estado)

const textoBoton = computed(() => {
  if (disponible.value) return 'Empezar'
  if (bloqueado.value) return 'Bloqueado'
  return 'Proximamente'
})

function seleccionar() {
  if (!disponible.value) return
  emit('seleccionar', props.curso)
}
</script>

<template>
  <article class="curso" :class="{ 'curso--off': !disponible }">
    <header class="curso__cabecera">
      <div
        class="curso__icono"
        :style="{ background: curso.color, color: curso.colorTexto }"
        aria-hidden="true"
      >
        {{ curso.icono }}
      </div>
      <div>
        <h3 class="curso__nombre">{{ curso.nombre }}</h3>
        <p class="curso__nivel">{{ curso.nivel }}</p>
      </div>
      <span class="etiqueta" :class="`etiqueta--${curso.estado}`">{{ textoEstado }}</span>
    </header>

    <p class="curso__descripcion">{{ curso.descripcion }}</p>

    <ul class="curso__datos">
      <li><Icono nombre="libros" :tamano="15" /> {{ curso.totalUnidades }} unidades</li>
      <li><Icono nombre="diana" :tamano="15" /> {{ curso.totalLecciones }} lecciones</li>
      <li><Icono nombre="reloj" :tamano="15" /> {{ curso.horasEstimadas }} h aprox.</li>
    </ul>

    <ul class="curso__etiquetas">
      <li v-for="tag in curso.etiquetas" :key="tag">#{{ tag }}</li>
    </ul>

    <p v-if="curso.requisito" class="curso__requisito">
      <Icono nombre="candado" :tamano="15" /> {{ curso.requisito }}
    </p>

    <BaseBoton
      class="curso__accion"
      :variante="disponible ? 'primario' : 'contorno'"
      :deshabilitado="!disponible"
      ancho-completo
      @click="seleccionar"
    >
      {{ textoBoton }}
    </BaseBoton>
  </article>
</template>

<style scoped>
.curso {
  display: flex;
  flex-direction: column;
  gap: var(--e-2);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  height: 100%;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.curso:not(.curso--off):hover {
  transform: translateY(-4px);
  border-color: var(--c-verde);
  box-shadow: var(--sombra-flotante);
}

.curso--off {
  opacity: 0.75;
}

.curso__cabecera {
  display: flex;
  align-items: center;
  gap: var(--e-2);
}

.curso__icono {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--r-md);
  font-family: var(--f-codigo);
  font-weight: 700;
  font-size: var(--t-base);
  flex-shrink: 0;
}

.curso__nombre {
  font-size: var(--t-md);
}

.curso__nivel {
  font-size: var(--t-xs);
  color: var(--c-gris);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.curso__cabecera .etiqueta {
  margin-left: auto;
  align-self: flex-start;
}

.curso__descripcion {
  color: var(--c-gris);
  font-size: var(--t-sm);
}

.curso__datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
}

.curso__etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: var(--t-xs);
  color: var(--c-violeta-osc);
  font-weight: 700;
}

.curso__requisito {
  font-size: var(--t-xs);
  color: var(--c-gris);
  background: var(--c-fondo);
  border-radius: var(--r-sm);
  padding: 0.5rem;
}

.curso__accion {
  margin-top: auto;
}
</style>
