import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * Numero que sube animado hasta su valor final.
 *
 * Se usa para el XP y los marcadores: ver el numero trepar da mucha mas
 * sensacion de logro que verlo aparecer de golpe.
 *
 * Respeta `prefers-reduced-motion`: si el sistema pide menos movimiento,
 * el valor salta directo al final.
 */
export function useContador(valorFinal, { duracion = 900 } = {}) {
  const mostrado = ref(0)
  let cuadro = null

  const sinMovimiento =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  function animar(destino) {
    if (cuadro) cancelAnimationFrame(cuadro)

    const objetivo = Number(destino) || 0
    if (sinMovimiento || duracion <= 0) {
      mostrado.value = objetivo
      return
    }

    const desde = mostrado.value
    const inicio = performance.now()

    function paso(ahora) {
      const avance = Math.min(1, (ahora - inicio) / duracion)
      // Desaceleracion: arranca rapido y frena al final.
      const suavizado = 1 - Math.pow(1 - avance, 3)
      mostrado.value = Math.round(desde + (objetivo - desde) * suavizado)
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }

    cuadro = requestAnimationFrame(paso)
  }

  watch(
    () => (typeof valorFinal === 'function' ? valorFinal() : valorFinal?.value ?? valorFinal),
    (nuevo) => animar(nuevo),
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (cuadro) cancelAnimationFrame(cuadro)
  })

  return mostrado
}
