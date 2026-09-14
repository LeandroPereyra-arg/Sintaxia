<script setup>
import { ref } from 'vue'

/**
 * Logo de Sintaxia.
 *
 * Usa la imagen `public/sintaxia.png`. Si ese archivo todavia no existe, cae
 * automaticamente en un dibujo SVG de respaldo para que nunca se vea una
 * imagen rota; en cuanto se agrega el PNG, aparece solo sin tocar codigo.
 *
 * Variantes:
 *   icono    -> recorte cuadrado centrado en el buho (cabecera, avatares)
 *   completo -> la imagen entera, con el buho y la palabra "Sintaxia"
 *
 * El recorte de la variante "icono" se controla con dos variables CSS, porque
 * depende de donde este el buho dentro del PNG:
 *   --logo-zoom   cuanto se agranda la imagen (263% = el buho llena el cuadrado)
 *   --logo-foco-y que parte de la imagen queda a la vista (29% = la franja del buho)
 * Si el logo cambia de composicion, se ajustan esos dos numeros y listo.
 */
const props = defineProps({
  variante: {
    type: String,
    default: 'icono',
    validator: (v) => ['icono', 'completo'].includes(v)
  },
  /** Alto en pixeles (el ancho se calcula solo). */
  alto: { type: Number, default: 38 },
  /** Texto alternativo; vacio si el logo es decorativo. */
  alt: { type: String, default: 'Sintaxia' },
  /** Anima el logo al aparecer. */
  animado: { type: Boolean, default: false }
})

const RUTA = `${import.meta.env.BASE_URL}sintaxia.png`

// Si el PNG no esta, se muestra el respaldo.
const hayImagen = ref(true)
</script>

<template>
  <span
    class="logo"
    :class="[`logo--${variante}`, { 'logo--animado': animado }]"
    :style="{ '--alto': alto + 'px' }"
  >
    <!-- Imagen invisible: solo sirve para saber si el PNG existe. -->
    <img
      v-if="variante === 'icono'"
      :src="RUTA"
      alt=""
      class="logo__sonda"
      aria-hidden="true"
      decoding="async"
      @error="hayImagen = false"
    />

    <!-- Recorte cuadrado sobre el buho (se pinta de fondo para poder encuadrarlo). -->
    <span
      v-if="variante === 'icono' && hayImagen"
      class="logo__recorte"
      :style="{ backgroundImage: `url(${RUTA})` }"
      role="img"
      :aria-label="alt || undefined"
    />

    <img
      v-else-if="hayImagen"
      :src="RUTA"
      :alt="alt"
      class="logo__imagen"
      decoding="async"
      @error="hayImagen = false"
    />

    <!-- Respaldo: se dibuja solo si falta public/sintaxia.png -->
    <svg
      v-else
      class="logo__respaldo"
      viewBox="0 0 64 64"
      role="img"
      :aria-label="alt || 'Sintaxia'"
    >
      <rect width="64" height="64" rx="16" fill="var(--c-verde)" />
      <circle cx="24" cy="26" r="8" fill="#fff" />
      <circle cx="40" cy="26" r="8" fill="#fff" />
      <circle cx="24" cy="26" r="4" fill="var(--c-noche)" />
      <circle cx="40" cy="26" r="4" fill="var(--c-noche)" />
      <path d="M32 33l-3 4h6z" fill="var(--c-amarillo)" />
      <path
        d="M22 48l-5-5 5-5M42 38l5 5-5 5M36 36l-8 14"
        fill="none"
        stroke="#fff"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: var(--alto);
}

.logo__imagen,
.logo__respaldo {
  height: 100%;
  display: block;
}

/* El respaldo es solo un marcador de posicion mientras falta el PNG:
   se acota para que no domine la pantalla en los tamanios grandes. */
.logo__respaldo {
  max-width: 64px;
  max-height: 64px;
}

/* Recorte cuadrado: el PNG trae el buho arriba y la palabra abajo. Como la
   imagen es mas ancha que alta, object-fit no alcanza para recortar en
   vertical, asi que se pinta de fondo y se encuadra con background-position. */
.logo--icono {
  width: var(--alto);
  --logo-zoom: 263%;
  --logo-foco-y: 29%;
}

.logo__sonda {
  display: none;
}

.logo__recorte {
  width: 100%;
  height: 100%;
  background-size: var(--logo-zoom) auto;
  background-position: 50% var(--logo-foco-y);
  background-repeat: no-repeat;
  border-radius: var(--r-sm);
}

.logo--icono .logo__respaldo {
  width: 100%;
  border-radius: var(--r-sm);
}

/* Imagen completa, con la palabra incluida. */
.logo--completo {
  width: auto;
}

.logo--completo .logo__imagen {
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.logo--completo .logo__respaldo {
  width: var(--alto);
}

/* Entrada suave, para la portada y la pantalla de ingreso. */
.logo--animado {
  animation: logo-entra 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes logo-entra {
  from {
    opacity: 0;
    transform: scale(0.82) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
