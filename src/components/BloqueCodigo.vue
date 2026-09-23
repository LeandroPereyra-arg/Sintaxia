<script setup>
import { ref } from 'vue'
import Icono from '@/components/Icono.vue'

/**
 * Bloque de codigo de ejemplo.
 *
 * Conserva el formato tal cual se escribio (sangrias y saltos de linea) y en el
 * celular se desplaza en horizontal DENTRO de su propia caja: el codigo largo
 * nunca empuja el ancho de la pagina, que es lo que rompe la lectura en
 * pantallas chicas.
 */
const props = defineProps({
  codigo: { type: String, required: true },
  /** Nombre del ejemplo, para el boton de copiar y los lectores de pantalla. */
  etiqueta: { type: String, default: 'Ejemplo de codigo' },
  /** Permite ocultar el boton de copiar donde no haga falta. */
  copiable: { type: Boolean, default: true }
})

const copiado = ref(false)

async function copiar() {
  try {
    await navigator.clipboard.writeText(props.codigo)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 1800)
  } catch {
    /* si el navegador no deja copiar, el codigo igual se puede seleccionar */
  }
}
</script>

<template>
  <div class="bloque">
    <button
      v-if="copiable"
      type="button"
      class="bloque__copiar"
      :aria-label="`Copiar el codigo de ${etiqueta}`"
      @click="copiar"
    >
      <Icono :nombre="copiado ? 'check' : 'carpetas'" :tamano="14" />
      {{ copiado ? 'Copiado' : 'Copiar' }}
    </button>

    <pre class="bloque__codigo" tabindex="0" :aria-label="etiqueta"><code>{{ codigo }}</code></pre>
  </div>
</template>

<style scoped>
.bloque {
  /* Imprescindible dentro de una grilla o un flex: sin esto el bloque crece
     hasta el ancho del codigo mas largo y empuja el resto de la pagina. */
  min-width: 0;
  max-width: 100%;
  position: relative;
  background: var(--c-noche);
  border-radius: var(--r-md);
  overflow: hidden;
}

.bloque__codigo {
  margin: 0;
  padding: var(--e-3);
  /* El desplazamiento horizontal queda encerrado aca adentro. */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  color: #e8eef4;
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  line-height: 1.6;
  /* pre-wrap no: se perderia la sangria del ejemplo. */
  white-space: pre;
  tab-size: 2;
}

.bloque__codigo:focus-visible {
  outline: 3px solid var(--c-verde);
  outline-offset: -3px;
}

.bloque__copiar {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--f-texto);
  font-size: var(--t-xs);
  font-weight: 700;
  color: #b9c4cf;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--r-sm);
  padding: 0.28rem 0.55rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.bloque__copiar:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

@media (max-width: 640px) {
  .bloque__codigo {
    /* Un poco mas chico para que entren mas columnas sin tener que arrastrar. */
    font-size: 0.8125rem;
    padding: var(--e-2);
    padding-top: var(--e-4);
  }
  .bloque__copiar {
    top: 4px;
    right: 4px;
  }
}
</style>
