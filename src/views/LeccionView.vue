<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BarraProgreso from '@/components/BarraProgreso.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraFeedback from '@/components/BarraFeedback.vue'
import EjercicioOpcionMultiple from '@/components/ejercicios/EjercicioOpcionMultiple.vue'
import EjercicioVerdaderoFalso from '@/components/ejercicios/EjercicioVerdaderoFalso.vue'
import EjercicioCompletar from '@/components/ejercicios/EjercicioCompletar.vue'
import EjercicioOrdenar from '@/components/ejercicios/EjercicioOrdenar.vue'
import { obtenerLeccion } from '@/data/lecciones/index.js'
import { obtenerUnidad } from '@/data/unidades.js'
import { TIPO_EJERCICIO, ETIQUETA_TIPO_EJERCICIO } from '@/data/tiposEjercicio.js'
import { esRespuestaCorrecta, respuestaVacia, textoRespuestaCorrecta } from '@/utils/verificarRespuesta.js'
import { useProgreso } from '@/composables/useProgreso.js'

/** Pantalla donde el estudiante resuelve los ejercicios de una leccion. */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const router = useRouter()
const { completarLeccion } = useProgreso()

const VIDAS_INICIALES = 3

const leccion = computed(() => obtenerLeccion(props.leccionId))
const unidad = computed(() => (leccion.value ? obtenerUnidad(leccion.value.unidadId) : null))
const ejercicios = computed(() => leccion.value?.ejercicios ?? [])

const indice = ref(0)
const respuesta = ref(null)
const comprobado = ref(false)
const aciertos = ref(0)
const vidas = ref(VIDAS_INICIALES)

const ejercicio = computed(() => ejercicios.value[indice.value] ?? null)
const esUltimo = computed(() => indice.value === ejercicios.value.length - 1)

const correcta = computed(() =>
  ejercicio.value ? esRespuestaCorrecta(ejercicio.value, respuesta.value) : false
)

const puedeComprobar = computed(
  () => ejercicio.value !== null && !respuestaVacia(ejercicio.value, respuesta.value)
)

const progreso = computed(() => {
  if (ejercicios.value.length === 0) return 0
  const resueltos = indice.value + (comprobado.value ? 1 : 0)
  return Math.round((resueltos / ejercicios.value.length) * 100)
})

/** Cada tipo de ejercicio se dibuja con su propio componente. */
const componenteEjercicio = computed(() => {
  switch (ejercicio.value?.tipo) {
    case TIPO_EJERCICIO.OPCION_MULTIPLE:
      return EjercicioOpcionMultiple
    case TIPO_EJERCICIO.VERDADERO_FALSO:
      return EjercicioVerdaderoFalso
    case TIPO_EJERCICIO.COMPLETAR:
      return EjercicioCompletar
    case TIPO_EJERCICIO.ORDENAR:
      return EjercicioOrdenar
    default:
      return null
  }
})

/** Valor inicial de la respuesta segun el tipo (texto, lista o nada). */
function respuestaVaciaDe(tipo) {
  if (tipo === TIPO_EJERCICIO.COMPLETAR) return ''
  if (tipo === TIPO_EJERCICIO.ORDENAR) return []
  return null
}

function reiniciar() {
  indice.value = 0
  respuesta.value = respuestaVaciaDe(ejercicios.value[0]?.tipo)
  comprobado.value = false
  aciertos.value = 0
  vidas.value = VIDAS_INICIALES
}

watch(() => props.leccionId, reiniciar, { immediate: true })

function comprobar() {
  if (!puedeComprobar.value || comprobado.value) return
  comprobado.value = true
  if (correcta.value) {
    aciertos.value++
  } else {
    vidas.value--
  }
}

function terminar() {
  const total = ejercicios.value.length
  // Si se quedo sin vidas la leccion no se aprueba: no suma XP ni queda completada.
  const aprobada = vidas.value > 0
  const xpGanado = aprobada
    ? completarLeccion(props.leccionId, { aciertos: aciertos.value, total })
    : 0
  router.replace({
    name: 'resultados',
    params: { leccionId: props.leccionId },
    query: {
      aciertos: aciertos.value,
      total,
      xp: xpGanado,
      vidas: vidas.value
    }
  })
}

function continuar() {
  if (vidas.value <= 0 || esUltimo.value) {
    terminar()
    return
  }
  indice.value++
  respuesta.value = respuestaVaciaDe(ejercicio.value?.tipo)
  comprobado.value = false
}

function salir() {
  router.push({ name: 'unidad', params: { unidadId: leccion.value?.unidadId ?? 'js-u1' } })
}
</script>

<template>
  <div v-if="leccion && ejercicio" class="leccion">
    <!-- Barra superior -->
    <header class="leccion__barra">
      <div class="contenedor leccion__barra-interior">
        <button type="button" class="salir" aria-label="Salir de la leccion" @click="salir">✕</button>

        <BarraProgreso
          :valor="progreso"
          :color="unidad?.color ?? 'var(--c-verde)'"
          etiqueta="Progreso de la leccion"
        />

        <p class="vidas" :aria-label="`Te quedan ${vidas} vidas`">
          <span aria-hidden="true">❤️</span>{{ vidas }}
        </p>
      </div>
    </header>

    <!-- Ejercicio -->
    <section class="leccion__cuerpo contenedor">
      <p class="leccion__tipo">
        {{ ETIQUETA_TIPO_EJERCICIO[ejercicio.tipo] }} ·
        <span>ejercicio {{ indice + 1 }} de {{ ejercicios.length }}</span>
      </p>

      <h1 class="leccion__consigna">{{ ejercicio.consigna }}</h1>

      <pre
        v-if="ejercicio.codigo && ejercicio.tipo !== TIPO_EJERCICIO.COMPLETAR"
        class="bloque-codigo leccion__codigo"
      >{{ ejercicio.codigo }}</pre>

      <component
        :is="componenteEjercicio"
        v-model="respuesta"
        :ejercicio="ejercicio"
        :bloqueado="comprobado"
        @comprobar="comprobar"
      />
    </section>

    <!-- Pie: comprobar o feedback -->
    <BarraFeedback
      v-if="comprobado"
      :correcta="correcta"
      :explicacion="ejercicio.explicacion"
      :respuesta-correcta="textoRespuestaCorrecta(ejercicio)"
      :texto-boton="vidas <= 0 ? 'Ver resultados' : esUltimo ? 'Terminar' : 'Continuar'"
      @continuar="continuar"
    />

    <footer v-else class="leccion__pie">
      <div class="contenedor leccion__pie-interior">
        <BaseBoton variante="texto" @click="salir">Salir</BaseBoton>
        <BaseBoton tamano="grande" :deshabilitado="!puedeComprobar" @click="comprobar">
          Comprobar
        </BaseBoton>
      </div>
    </footer>
  </div>

  <div v-else class="seccion contenedor centrado">
    <h1>No encontramos esa leccion</h1>
    <p class="texto-secundario">Puede que el enlace sea viejo o que la leccion haya cambiado.</p>
    <BaseBoton :to="{ name: 'curso-javascript' }">Volver al curso</BaseBoton>
  </div>
</template>

<style scoped>
.leccion {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-blanco);
}

.leccion__barra {
  border-bottom: 2px solid var(--c-borde);
  padding-block: var(--e-2);
}

.leccion__barra-interior {
  display: flex;
  align-items: center;
  gap: var(--e-3);
}

.salir {
  font-size: var(--t-md);
  color: var(--c-gris-claro);
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--r-sm);
}

.salir:hover {
  color: var(--c-rojo);
  background: var(--c-rojo-suave);
}

.vidas {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 800;
  color: var(--c-rojo-osc);
}

.leccion__cuerpo {
  flex: 1;
  width: 100%;
  max-width: 720px;
  padding-block: var(--e-5);
  display: flex;
  flex-direction: column;
  gap: var(--e-3);
}

.leccion__tipo {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-violeta-osc);
}

.leccion__tipo span {
  color: var(--c-gris);
}

.leccion__consigna {
  font-size: var(--t-lg);
}

.leccion__codigo {
  margin-bottom: var(--e-1);
}

.leccion__pie {
  border-top: 2px solid var(--c-borde);
  padding-block: var(--e-3);
  background: var(--c-fondo);
}

.leccion__pie-interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--e-2);
}
</style>
