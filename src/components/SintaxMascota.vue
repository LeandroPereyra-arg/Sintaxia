<script setup>
import { computed, ref, watch } from 'vue'
import LogoSintaxia from '@/components/LogoSintaxia.vue'
import { ESTADOS_SINTAX } from '@/assets/estadosSintax.js'

/**
 * Sintax, la mascota de Sintaxia.
 *
 * Cada estado de animo es una imagen en `public/sintax/<estado>.webp`
 * (ver los nombres en `src/assets/estadosSintax.js`).
 *
 * Se usa WebP porque pesa unas cinco veces menos que el PNG con la misma
 * calidad, y eso se nota en el celular con datos moviles.
 *
 * Si algo falta, se va probando en orden hasta encontrar algo que mostrar:
 *
 *   <estado>.webp  ->  <estado>.png  ->  normal.webp  ->  normal.png  ->  logo
 *
 * Asi que alcanza con dejar el archivo en la carpeta, en cualquiera de los dos
 * formatos, y nunca se ve una imagen rota.
 *
 * Cada estado trae ademas su propia animacion (flotar, asentir, dormir...),
 * que se apaga sola si el sistema pide menos movimiento.
 */
const props = defineProps({
  estado: {
    type: String,
    default: 'normal',
    validator: (v) => ESTADOS_SINTAX.includes(v)
  },
  /** Alto en pixeles. */
  alto: { type: Number, default: 140 },
  /** Texto alternativo. Vacio = decorativo. */
  alt: { type: String, default: '' },
  /** Permite apagar la animacion propia del estado. */
  animar: { type: Boolean, default: true }
})

const base = import.meta.env.BASE_URL

/** Orden en el que se busca la imagen, del ideal al ultimo recurso. */
const intentos = computed(() => [
  `${base}sintax/${props.estado}.webp`,
  `${base}sintax/${props.estado}.png`,
  `${base}sintax/normal.webp`,
  `${base}sintax/normal.png`
])

const intento = ref(0)

watch(() => props.estado, () => {
  intento.value = 0
})

const ruta = computed(() => intentos.value[intento.value])
const hayImagen = computed(() => intento.value < intentos.value.length)

function alFallar() {
  intento.value++
}

// Se expone para poder achicar el respaldo desde la plantilla.
const { round } = Math
</script>

<template>
  <span
    class="sintax"
    :class="[`sintax--${estado}`, { 'sintax--quieto': !animar }]"
    :style="{ '--alto': alto + 'px' }"
  >
    <img
      v-if="hayImagen"
      :key="ruta"
      :src="ruta"
      :alt="alt"
      class="sintax__imagen"
      decoding="async"
      @error="alFallar"
    />
    <!-- Ultimo recurso: el logo, que ya trae su propio respaldo en SVG. -->
    <LogoSintaxia v-else variante="icono" :alto="round(alto * 0.55)" :alt="alt" />
  </span>
</template>

<style scoped>
.sintax {
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  height: var(--alto);
  flex-shrink: 0;
}

.sintax__imagen {
  height: 100%;
  width: auto;
  display: block;
  transform-origin: 50% 90%;
}

/* ---------- Una animacion propia por estado ---------- */

/* Normal: respira, apenas se nota. */
.sintax--normal .sintax__imagen {
  animation: sintax-respira 4s ease-in-out infinite;
}

/* Saludando: se inclina de un lado a otro. */
.sintax--saludando .sintax__imagen {
  animation: sintax-saluda 2.4s ease-in-out infinite;
}

/* Sorprendido: pega un saltito y se queda grande. */
.sintax--sorprendido .sintax__imagen {
  animation: sintax-sobresalto 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Pensando: se balancea despacio, como dudando. */
.sintax--pensando .sintax__imagen {
  animation: sintax-piensa 3.2s ease-in-out infinite;
}

/* Celebrando: saltos con entusiasmo. */
.sintax--celebrando .sintax__imagen {
  animation: sintax-festeja 0.9s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
}

/* Confundido: ladea la cabeza de a ratos. */
.sintax--confundido .sintax__imagen {
  animation: sintax-duda 2.8s ease-in-out infinite;
}

/* Enojado: tiembla apenas. */
.sintax--enojado .sintax__imagen {
  animation: sintax-tiembla 0.35s ease-in-out 3;
}

/* Dormido: sube y baja, mas lento que el normal. */
.sintax--dormido .sintax__imagen {
  animation: sintax-duerme 4.5s ease-in-out infinite;
}

.sintax--quieto .sintax__imagen {
  animation: none;
}

@keyframes sintax-respira {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.015); }
}

@keyframes sintax-saluda {
  0%, 100% { transform: rotate(-3deg) translateY(0); }
  25% { transform: rotate(4deg) translateY(-5px); }
  50% { transform: rotate(-2deg) translateY(0); }
  75% { transform: rotate(5deg) translateY(-4px); }
}

@keyframes sintax-sobresalto {
  0% { transform: scale(0.85) translateY(6px); }
  55% { transform: scale(1.12) translateY(-10px); }
  100% { transform: scale(1) translateY(0); }
}

@keyframes sintax-piensa {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}

@keyframes sintax-festeja {
  0%, 100% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-16px) scale(1.06, 0.96); }
  60% { transform: translateY(0) scale(0.97, 1.04); }
}

@keyframes sintax-duda {
  0%, 60%, 100% { transform: rotate(0); }
  70% { transform: rotate(-9deg); }
  85% { transform: rotate(7deg); }
}

@keyframes sintax-tiembla {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-1.5deg); }
  75% { transform: translateX(4px) rotate(1.5deg); }
}

@keyframes sintax-duerme {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-7px) scale(1.03, 0.97); }
}
</style>
