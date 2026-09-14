<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icono from '@/components/Icono.vue'

/**
 * Carrusel deslizable.
 *
 * Se apoya en `scroll-snap` del navegador en vez de mover las diapositivas con
 * JavaScript. Esa decision importa para el celular: el desplazamiento lo maneja
 * el sistema, asi que el gesto se siente igual que en una app nativa (arranca
 * apenas tocas, sigue el dedo y frena con inercia), y sigue andando aunque el
 * JavaScript tarde en cargar.
 *
 * JavaScript solo se usa para lo que el navegador no da solo: saber en que
 * diapositiva estamos, las flechas y el teclado.
 */
const props = defineProps({
  /** Cuantas diapositivas hay (para los puntos y la navegacion). */
  cantidad: { type: Number, required: true },
  /** Mostrar flechas (utiles con mouse, sobran en el celular). */
  flechas: { type: Boolean, default: true },
  /** Mostrar los puntos de posicion. */
  puntos: { type: Boolean, default: true },
  /** Nombre para lectores de pantalla. */
  etiqueta: { type: String, default: 'Carrusel' },
  /** Ancho de cada diapositiva (CSS). Por defecto ocupa todo el ancho. */
  anchoDiapositiva: { type: String, default: '100%' }
})

const emit = defineEmits(['cambio'])

const pista = ref(null)
const actual = ref(0)
/** Si todas las diapositivas entran a la vez, los controles sobran. */
const hayDesborde = ref(false)

const esPrimera = computed(() => actual.value === 0)
const esUltima = computed(() => actual.value >= props.cantidad - 1)

/** Calcula cual es la diapositiva visible segun donde quedo el scroll. */
function alDesplazar() {
  const el = pista.value
  if (!el) return
  const hijos = Array.from(el.children)
  if (hijos.length === 0) return

  const centro = el.scrollLeft + el.clientWidth / 2
  let masCerca = 0
  let menorDistancia = Infinity

  hijos.forEach((hijo, indice) => {
    const centroHijo = hijo.offsetLeft + hijo.clientWidth / 2
    const distancia = Math.abs(centroHijo - centro)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      masCerca = indice
    }
  })

  if (masCerca !== actual.value) {
    actual.value = masCerca
    emit('cambio', masCerca)
  }
}

function irA(indice) {
  const el = pista.value
  if (!el) return
  const destino = el.children[Math.max(0, Math.min(indice, props.cantidad - 1))]
  if (destino) el.scrollTo({ left: destino.offsetLeft, behavior: 'smooth' })
}

function siguiente() {
  irA(actual.value + 1)
}

function anterior() {
  irA(actual.value - 1)
}

function alTeclado(evento) {
  if (evento.key === 'ArrowRight') {
    evento.preventDefault()
    siguiente()
  } else if (evento.key === 'ArrowLeft') {
    evento.preventDefault()
    anterior()
  }
}

function medirDesborde() {
  const el = pista.value
  if (!el) return
  hayDesborde.value = el.scrollWidth > el.clientWidth + 2
}

let observador = null
let temporizador = null
function alDesplazarConRetardo() {
  clearTimeout(temporizador)
  temporizador = setTimeout(alDesplazar, 60)
}

onMounted(() => {
  pista.value?.addEventListener('scroll', alDesplazarConRetardo, { passive: true })
  medirDesborde()
  // Al cambiar el ancho de la ventana pueden entrar mas o menos diapositivas.
  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(medirDesborde)
    observador.observe(pista.value)
  }
})

onBeforeUnmount(() => {
  clearTimeout(temporizador)
  observador?.disconnect()
  pista.value?.removeEventListener('scroll', alDesplazarConRetardo)
})

defineExpose({ irA, siguiente, anterior, actual })
</script>

<template>
  <div class="carrusel" :style="{ '--ancho-diapositiva': anchoDiapositiva }">
    <div
      ref="pista"
      class="carrusel__pista"
      role="group"
      :aria-label="etiqueta"
      tabindex="0"
      @keydown="alTeclado"
    >
      <slot />
    </div>

    <!-- Controles: puntos para tocar, flechas para el mouse.
         Solo aparecen si de verdad hay algo que desplazar. -->
    <div v-if="(puntos || flechas) && hayDesborde" class="carrusel__controles">
      <button
        v-if="flechas"
        type="button"
        class="carrusel__flecha"
        :disabled="esPrimera"
        aria-label="Anterior"
        @click="anterior"
      >
        <Icono nombre="flechaIzquierda" :tamano="18" />
      </button>

      <ol v-if="puntos" class="carrusel__puntos">
        <li v-for="n in cantidad" :key="n">
          <button
            type="button"
            class="carrusel__punto"
            :class="{ 'carrusel__punto--activo': actual === n - 1 }"
            :aria-label="`Ir a la diapositiva ${n}`"
            :aria-current="actual === n - 1 ? 'true' : undefined"
            @click="irA(n - 1)"
          />
        </li>
      </ol>

      <button
        v-if="flechas"
        type="button"
        class="carrusel__flecha"
        :disabled="esUltima"
        aria-label="Siguiente"
        @click="siguiente"
      >
        <Icono nombre="flechaDerecha" :tamano="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.carrusel {
  display: grid;
  gap: var(--e-2);
}

.carrusel__pista {
  display: flex;
  gap: var(--e-3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  /* En iOS y Android esto hace que el gesto tenga inercia. */
  -webkit-overflow-scrolling: touch;
  /* Espacio para que la tarjeta activa no quede pegada al borde. */
  scroll-padding-inline: var(--e-3);
  padding-block: 4px;
  /* La barra de desplazamiento se oculta: se navega con el dedo o los puntos. */
  scrollbar-width: none;
}

.carrusel__pista::-webkit-scrollbar {
  display: none;
}

.carrusel__pista:focus-visible {
  outline: 3px solid var(--c-azul);
  outline-offset: 4px;
  border-radius: var(--r-md);
}

/* Cada hijo directo es una diapositiva. */
.carrusel__pista > :deep(*) {
  flex: 0 0 var(--ancho-diapositiva);
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.carrusel__controles {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--e-2);
}

.carrusel__flecha {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-full);
  border: 2px solid var(--c-borde);
  background: var(--c-blanco);
  color: var(--c-gris);
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.carrusel__flecha:not(:disabled):hover {
  border-color: var(--c-verde);
  color: var(--c-verde-osc);
}

.carrusel__flecha:not(:disabled):active {
  transform: scale(0.92);
}

.carrusel__flecha:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.carrusel__puntos {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  list-style: none;
}

.carrusel__punto {
  display: block;
  width: 9px;
  height: 9px;
  border-radius: var(--r-full);
  background: var(--c-borde);
  transition: width 0.25s var(--anim-rebote), background 0.2s ease;
  /* Area tocable comoda en el celular sin agrandar el punto. */
  position: relative;
}

.carrusel__punto::after {
  content: '';
  position: absolute;
  inset: -11px;
}

.carrusel__punto--activo {
  width: 26px;
  background: var(--c-verde);
}

/* En pantallas chicas las flechas sobran: se navega con el dedo. */
@media (max-width: 720px) {
  .carrusel__flecha {
    display: none;
  }
}
</style>
