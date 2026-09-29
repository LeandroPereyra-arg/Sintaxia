<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraFeedback from '@/components/BarraFeedback.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import EjercicioOpcionMultiple from '@/components/ejercicios/EjercicioOpcionMultiple.vue'
import {
  obtenerLeccionConActividades,
  obtenerUnidad,
  comprobarRespuesta
} from '@/servicios/contenido.js'
import { TIPO_EJERCICIO, ETIQUETA_TIPO_EJERCICIO } from '@/data/tiposEjercicio.js'
import { useProgreso } from '@/composables/useProgreso.js'

/**
 * Pantalla donde el estudiante resuelve las actividades de una leccion.
 *
 * La correccion NO se hace aca: la aplicacion nunca se descarga las soluciones.
 * Al comprobar, se le manda al servidor el identificador de la pregunta y el de
 * la opcion elegida, y el servidor responde si acerto y por que
 * (ver supabase/04-funcion-comprobar.sql).
 *
 * Si esa llamada falla por conexion, la respuesta NO se da por incorrecta: se
 * avisa y se puede volver a comprobar la misma opcion.
 */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const router = useRouter()
const { completarLeccion } = useProgreso()

const VIDAS_INICIALES = 3

// El contenido se le pide al modulo de acceso a datos.
const leccion = ref(null)
const unidad = ref(null)
const cargando = ref(true)
const error = ref(null)
const ejercicios = computed(() => leccion.value?.ejercicios ?? [])

const indice = ref(0)
const respuesta = ref(null)
const comprobado = ref(false)
const aciertos = ref(0)
const vidas = ref(VIDAS_INICIALES)

// Resultado que devolvio el servidor para la actividad actual.
const resultado = ref(null)
const comprobando = ref(false)
const errorComprobacion = ref('')

const ejercicio = computed(() => ejercicios.value[indice.value] ?? null)
const esUltimo = computed(() => indice.value === ejercicios.value.length - 1)

const correcta = computed(() => resultado.value?.correcta === true)

/** Cual era la opcion correcta, para pintarla una vez comprobada. */
const idCorrecto = computed(() => {
  if (!resultado.value) return null
  return resultado.value.correcta ? respuesta.value : resultado.value.opcionCorrectaId
})

const puedeComprobar = computed(
  () => ejercicio.value !== null && respuesta.value !== null && !comprobando.value
)

const progreso = computed(() => {
  if (ejercicios.value.length === 0) return 0
  const resueltos = indice.value + (comprobado.value ? 1 : 0)
  return Math.round((resueltos / ejercicios.value.length) * 100)
})

/**
 * Arranca un intento limpio: las respuestas y el puntaje del intento anterior
 * no se arrastran. Se llama al entrar y cada vez que cambia la leccion.
 */
function reiniciar() {
  indice.value = 0
  respuesta.value = null
  comprobado.value = false
  resultado.value = null
  errorComprobacion.value = ''
  aciertos.value = 0
  vidas.value = VIDAS_INICIALES
}

async function cargar() {
  cargando.value = true
  error.value = null
  leccion.value = null
  unidad.value = null
  try {
    const datos = await obtenerLeccionConActividades(props.leccionId)
    leccion.value = datos
    unidad.value = await obtenerUnidad(datos.unidadId)
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
    reiniciar()
  }
}

watch(() => props.leccionId, cargar, { immediate: true })

/**
 * Le pregunta al servidor si la opcion elegida es la correcta.
 *
 * `comprobado` se marca UNICAMENTE cuando llega la respuesta, asi que apretar
 * el boton varias veces no suma aciertos ni descuenta vidas de mas: mientras
 * hay una comprobacion en curso, `comprobando` bloquea las siguientes.
 */
async function comprobar() {
  if (!puedeComprobar.value || comprobado.value) return

  comprobando.value = true
  errorComprobacion.value = ''
  try {
    const respuestaServidor = await comprobarRespuesta(ejercicio.value.id, respuesta.value)
    resultado.value = respuestaServidor
    comprobado.value = true
    if (respuestaServidor.correcta) {
      aciertos.value++
    } else {
      vidas.value--
    }
  } catch (e) {
    // No se pudo comprobar: la respuesta NO se cuenta como incorrecta.
    errorComprobacion.value = e?.reintentable
      ? 'No pudimos comprobar tu respuesta. Revisa la conexion y volve a intentarlo.'
      : (e?.message ?? 'No pudimos comprobar tu respuesta.')
  } finally {
    comprobando.value = false
  }
}

const guardando = ref(false)

async function terminar() {
  if (guardando.value) return
  const total = ejercicios.value.length
  // Si se quedo sin vidas la leccion no se aprueba: no suma XP ni queda completada.
  const aprobada = vidas.value > 0

  let xpGanado = 0
  if (aprobada) {
    guardando.value = true
    try {
      const resumen = await completarLeccion(props.leccionId, {
        aciertos: aciertos.value,
        total,
        xp: leccion.value?.xp ?? null
      })
      xpGanado = resumen.xpGanado
    } finally {
      guardando.value = false
    }
  }

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

async function continuar() {
  if (vidas.value <= 0 || esUltimo.value) {
    await terminar()
    return
  }
  indice.value++
  respuesta.value = null
  comprobado.value = false
  resultado.value = null
  errorComprobacion.value = ''
}

function salir() {
  router.push({ name: 'leccion', params: { leccionId: props.leccionId } })
}
</script>

<template>
  <div v-if="leccion && ejercicio" class="leccion">
    <!-- Barra superior -->
    <header class="leccion__barra">
      <div class="contenedor leccion__barra-interior">
        <button type="button" class="salir" aria-label="Salir de la leccion" @click="salir">
          <Icono nombre="cerrar" :tamano="18" :trazo="2.4" />
        </button>

        <BarraProgreso
          :valor="progreso"
          :color="unidad?.color ?? 'var(--c-verde)'"
          etiqueta="Progreso de la leccion"
        />

        <p class="vidas" :aria-label="`Te quedan ${vidas} vidas`">
          <Icono nombre="corazon" :tamano="17" :trazo="2.3" />{{ vidas }}
        </p>
      </div>
    </header>

    <!-- Actividad -->
    <section class="leccion__cuerpo contenedor">
      <p class="leccion__tipo">
        {{ ETIQUETA_TIPO_EJERCICIO[ejercicio.tipo] }} ·
        <span>ejercicio {{ indice + 1 }} de {{ ejercicios.length }}</span>
      </p>

      <h1 class="leccion__consigna">{{ ejercicio.consigna }}</h1>

      <pre v-if="ejercicio.codigo" class="bloque-codigo leccion__codigo">{{ ejercicio.codigo }}</pre>

      <EjercicioOpcionMultiple
        v-if="ejercicio.tipo === TIPO_EJERCICIO.OPCION_MULTIPLE"
        v-model="respuesta"
        :ejercicio="ejercicio"
        :bloqueado="comprobado"
        :id-correcto="idCorrecto"
      />
      <p v-else class="leccion__aviso">
        Este tipo de actividad todavia no esta disponible.
      </p>

      <!-- No se pudo comprobar: la respuesta no se cuenta como incorrecta -->
      <p v-if="errorComprobacion" class="leccion__error" role="alert">
        <Icono nombre="alerta" :tamano="17" /> {{ errorComprobacion }}
      </p>
    </section>

    <!-- Pie: comprobar o devolucion -->
    <BarraFeedback
      v-if="comprobado"
      :correcta="correcta"
      :explicacion="resultado?.explicacion ?? ''"
      :respuesta-correcta="resultado?.opcionCorrectaTexto ?? ''"
      :texto-boton="vidas <= 0 ? 'Ver resultados' : esUltimo ? 'Terminar' : 'Continuar'"
      @continuar="continuar"
    />

    <footer v-else class="leccion__pie">
      <div class="contenedor leccion__pie-interior">
        <BaseBoton variante="texto" @click="salir">Salir</BaseBoton>
        <BaseBoton
          tamano="grande"
          :deshabilitado="!puedeComprobar"
          @click="comprobar"
        >
          {{ comprobando ? 'Comprobando...' : errorComprobacion ? 'Reintentar' : 'Comprobar' }}
        </BaseBoton>
      </div>
    </footer>
  </div>

  <div v-else class="seccion contenedor">
    <EstadoConsulta
      :cargando="cargando"
      :error="error"
      :vacio="!cargando && !error && ejercicios.length === 0"
      texto-cargando="Cargando las actividades..."
      titulo-vacio="Esta leccion todavia no tiene actividades"
      texto-vacio="El equipo las esta preparando. Volve a mirar en unos dias."
      @reintentar="cargar"
    >
      <template #salida>
        <BaseBoton :to="{ name: 'cursos' }">Ver los cursos</BaseBoton>
      </template>
    </EstadoConsulta>
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

.leccion__aviso {
  color: var(--c-gris);
  font-weight: 600;
}

.leccion__error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  color: var(--c-amarillo-osc);
  border-radius: var(--r-md);
  padding: var(--e-2) var(--e-3);
  font-weight: 700;
  font-size: var(--t-sm);
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
