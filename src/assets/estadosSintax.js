/**
 * Estados de animo de Sintax, la mascota.
 *
 * Cada uno corresponde a un archivo `public/sintax/<estado>.png`.
 * Vive en su propio modulo porque `defineProps()` no puede usar constantes
 * declaradas dentro del mismo `<script setup>`.
 */
export const ESTADOS_SINTAX = [
  'normal',
  'sorprendido',
  'pensando',
  'celebrando',
  'confundido',
  'enojado',
  'dormido',
  'saludando'
]
