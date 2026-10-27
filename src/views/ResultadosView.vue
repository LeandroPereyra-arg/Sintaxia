<script setup>
import Icono from '@/components/Icono.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useContador } from '@/composables/useContador.js'
import { obtenerLeccion, obtenerUnidad, listarLecciones } from '@/servicios/contenido.js'
import { obtenerIntento, ESTADO_INTENTO } from '@/servicios/progreso.js'
import { useProgreso } from '@/composables/useProgreso.js'
import { useCatalogo, CURSO_POR_DEFECTO } from '@/composables/useCatalogo.js'

/**
 * Pantalla de cierre de un intento: puntaje, XP ganado y que sigue.
 *
 * Recibe SOLO el id del intento (?intento=...). Los numeros no viajan en la
 * direccion: se le piden al servidor, que es quien los calculo. Asi la pantalla
 * muestra lo que de verdad quedo guardado, se puede recargar y se puede abrir
 * desde otro dispositivo con la misma cuenta.
 *
 * Mientras no hay confirmacion del servidor NO se dice "guardado": se muestra
 * "confirmando" o, si fallo la consulta, que no se pudo confirmar.
 */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const route = useRoute()
const router = useRouter()
const { estado, progresoUnidad, unidadCompletada, anotarIntento } = useProgreso()
const { cargarCurso } = useCatalogo()

const leccion = ref(null)
const unidad = ref(null)
const hermanas = ref([])
const errorCarga = ref(null)

async function cargar() {
  errorCarga.value = null
  try {
    leccion.value = await obtenerLeccion(props.leccionId)
    unidad.value = await obtenerUnidad(leccion.value.unidadId)
    hermanas.value = await listarLecciones(leccion.value.unidadId)
    // El XP de cada leccion y el progreso de la unidad salen del catalogo.
    cargarCurso(unidad.value.cursoId)
  } catch (e) {
    leccion.value = null
    errorCarga.value = e
  }
}

// --- El intento, confirmado por el servidor ---------------------------------
const intentoId = computed(() => String(route.query.intento ?? ''))
const intento = ref(null)
/** 'confirmando' | 'confirmado' | 'error' | 'no-encontrado' */
const confirmacion = ref('confirmando')
const errorConfirmacion = ref(null)

async function confirmar() {
  if (!intentoId.value) {
    confirmacion.value = 'no-encontrado'
    return
  }
  confirmacion.value = 'confirmando'
  errorConfirmacion.value = null
  try {
    const leido = await obtenerIntento(intentoId.value)
    if (!leido || leido.leccionId !== props.leccionId) {
      intento.value = null
      confirmacion.value = 'no-encontrado'
      return
    }
    intento.value = leido
    anotarIntento(leido)
    confirmacion.value = 'confirmado'
  } catch (e) {
    errorConfirmacion.value = e
    confirmacion.value = 'error'
  }
}

onMounted(() => {
  cargar()
  confirmar()
})
watch(() => props.leccionId, cargar)
watch(intentoId, confirmar)

const confirmado = computed(() => confirmacion.value === 'confirmado' && intento.value !== null)
const total = computed(() => intento.value?.total ?? 0)
const aciertos = computed(() => intento.value?.aciertos ?? 0)
const incorrectas = computed(() => intento.value?.errores ?? 0)
const porcentaje = computed(() => intento.value?.porcentaje ?? 0)
const xpGanado = computed(() => (intento.value ? (estado.xpPorIntento[intento.value.id] ?? 0) : 0))

const sinVidas = computed(() => intento.value?.estado === ESTADO_INTENTO.SIN_VIDAS)
const enCurso = computed(() => intento.value?.estado === ESTADO_INTENTO.EN_CURSO)
const abandonado = computed(() => intento.value?.estado === ESTADO_INTENTO.ABANDONADO)
/** Aprobada lo decide el servidor al cerrar el intento (60 % o mas). */
const aprobada = computed(() => intento.value?.aprobado === true)

/** Sintax reacciona segun como te fue. */
const animoSintax = computed(() => {
  if (!confirmado.value) return 'pensando'
  if (sinVidas.value) return 'enojado'
  if (porcentaje.value === 100) return 'celebrando'
  if (aprobada.value) return 'normal'
  return 'confundido'
})

const xpAnimado = useContador(xpGanado)
const incorrectasAnimadas = useContador(incorrectas, { duracion: 700 })
const aciertosAnimados = useContador(aciertos, { duracion: 700 })
const porcentajeAnimado = useContador(porcentaje, { duracion: 700 })

const mensaje = computed(() => {
  if (!confirmado.value) return { icono: 'reloj', titulo: 'Tu resultado', texto: '' }
  if (enCurso.value) return { icono: 'reloj', titulo: 'Este intento sigue en curso', texto: 'Todavia te quedan actividades por responder. Podes retomarlo donde lo dejaste.' }
  if (abandonado.value) return { icono: 'repetir', titulo: 'Intento abandonado', texto: 'Empezaste otro intento de esta leccion, asi que este quedo en tu historial sin terminar.' }
  if (sinVidas.value) return { icono: 'corazonRoto', titulo: 'Te quedaste sin vidas', texto: 'La leccion no quedo completada y no suma XP. Volve a intentarlo: tu intento anterior queda en el historial.' }
  if (porcentaje.value === 100) return { icono: 'trofeo', titulo: 'Leccion perfecta!', texto: 'Respondiste todo bien. Asi se aprende a programar.' }
  if (aprobada.value) return { icono: 'chispas', titulo: 'Leccion aprobada!', texto: 'Muy buen trabajo. Repasa lo que fallaste y segui avanzando.' }
  return { icono: 'pesa', titulo: 'Leccion completada, sin aprobar', texto: 'Para aprobar hace falta el 60 % de aciertos. Repetir la leccion es la mejor forma de fijarlo.' }
})

/** Siguiente leccion de la misma unidad, si queda alguna. */
const siguienteLeccion = computed(() => {
  if (!leccion.value) return null
  const pos = hermanas.value.findIndex((l) => l.id === leccion.value.id)
  return hermanas.value[pos + 1] ?? null
})

const unidadTerminada = computed(() => (unidad.value ? unidadCompletada(unidad.value.id) : false))

/** Repetir = un intento NUEVO. El anterior queda guardado en el historial. */
function repetir() {
  router.push({ name: 'actividades', params: { leccionId: props.leccionId }, query: { nuevo: 1 } })
}

function retomar() {
  router.push({ name: 'actividades', params: { leccionId: props.leccionId } })
}

function siguiente() {
  if (siguienteLeccion.value) {
    router.push({ name: 'leccion', params: { leccionId: siguienteLeccion.value.id } })
  } else {
    router.push({ name: 'curso', params: { cursoId: unidad.value?.cursoId ?? CURSO_POR_DEFECTO } })
  }
}
</script>

<template>
  <div class="resultados seccion contenedor">
    <div v-if="leccion" class="tarjeta">
      <SintaxMascota :estado="animoSintax" :alto="130" alt="" class="tarjeta__sintax" />
      <Icono class="tarjeta__icono" :nombre="mensaje.icono" :tamano="46" :trazo="1.8" />
      <h1>{{ mensaje.titulo }}</h1>
      <p class="texto-secundario">{{ mensaje.texto }}</p>
      <p class="tarjeta__leccion">{{ leccion.titulo }}</p>

      <!-- Estado del guardado: solo se afirma con la confirmacion del servidor -->
      <p
        class="confirmacion"
        :class="`confirmacion--${confirmacion}`"
        data-prueba="estado-resultado"
        :data-estado="confirmacion"
        role="status"
      >
        <template v-if="confirmacion === 'confirmando'">
          <Icono nombre="reloj" :tamano="15" /> Confirmando tu resultado con el servidor...
        </template>
        <template v-else-if="confirmado">
          <Icono nombre="checkCirculo" :tamano="15" />
          Resultado guardado · intento {{ intento.numero }}
        </template>
        <template v-else-if="confirmacion === 'no-encontrado'">
          <Icono nombre="alerta" :tamano="15" /> No encontramos ese intento entre los tuyos.
        </template>
        <template v-else>
          <Icono nombre="alerta" :tamano="15" /> No pudimos confirmar tu resultado.
        </template>
      </p>

      <MensajeEstado v-if="confirmacion === 'error'" tipo="alerta">
        <p>
          Las respuestas que el servidor ya confirmo estan guardadas, pero ahora no pudimos
          consultar el resultado. No lo damos por guardado hasta tener respuesta.
        </p>
        <p v-if="errorConfirmacion">{{ errorConfirmacion.message }}</p>
        <BaseBoton tamano="chico" @click="confirmar">Reintentar</BaseBoton>
      </MensajeEstado>

      <template v-if="confirmado">
        <ul class="marcadores">
          <li class="marcador marcador--total">
            <span class="marcador__valor">{{ total }}</span>
            <span class="marcador__texto">Actividades</span>
          </li>
          <li class="marcador marcador--acierto">
            <span class="marcador__valor" data-prueba="aciertos">{{ aciertosAnimados }}</span>
            <span class="marcador__texto">Correctas</span>
          </li>
          <li class="marcador marcador--error">
            <span class="marcador__valor">{{ incorrectasAnimadas }}</span>
            <span class="marcador__texto">Incorrectas</span>
          </li>
          <li class="marcador marcador--precision">
            <span class="marcador__valor">{{ porcentajeAnimado }} %</span>
            <span class="marcador__texto">Precision</span>
          </li>
        </ul>

        <p class="extras">
          <span><Icono nombre="rayo" :tamano="15" /> +{{ xpAnimado }} XP</span>
          <span><Icono nombre="llama" :tamano="15" /> {{ estado.racha }} dias de racha</span>
          <span
            class="extras__estado"
            :class="aprobada ? 'extras__estado--ok' : 'extras__estado--no'"
            data-prueba="aprobada"
          >
            <Icono :nombre="aprobada ? 'checkCirculo' : 'equisCirculo'" :tamano="15" />
            {{ aprobada ? 'Leccion aprobada' : 'Leccion no aprobada' }}
          </span>
        </p>
      </template>

      <div v-if="unidad" class="unidad">
        <p class="unidad__titulo">
          Unidad {{ unidad.numero }} · {{ unidad.titulo }}
          <strong>{{ progresoUnidad(unidad.id) }} %</strong>
        </p>
        <BarraProgreso
          :valor="progresoUnidad(unidad.id)"
          :color="unidad.color"
          :etiqueta="`Progreso de la unidad ${unidad.numero}`"
        />
        <p v-if="unidadTerminada" class="unidad__logro">
          <Icono nombre="medalla" :tamano="17" /> Desbloqueaste la unidad siguiente. Segui asi!
        </p>
      </div>

      <div class="acciones">
        <BaseBoton v-if="enCurso" @click="retomar">Continuar el intento</BaseBoton>
        <BaseBoton variante="contorno" @click="repetir">
          {{ enCurso ? 'Empezar de nuevo' : 'Intentar de nuevo' }}
        </BaseBoton>

        <BaseBoton
          variante="contorno"
          :to="{ name: 'unidad', params: { unidadId: leccion.unidadId } }"
        >
          Volver a la unidad
        </BaseBoton>

        <BaseBoton v-if="aprobada && siguienteLeccion" @click="siguiente">
          Siguiente leccion
        </BaseBoton>
        <BaseBoton
          v-else-if="aprobada && unidad"
          :to="{ name: 'curso', params: { cursoId: unidad.cursoId } }"
        >
          Volver al curso
        </BaseBoton>
      </div>

      <p class="pie-nota">
        <router-link :to="{ name: 'perfil' }">
          Ver mi progreso completo <Icono nombre="flechaDerecha" :tamano="15" />
        </router-link>
      </p>
    </div>

    <EstadoConsulta
      v-else
      :error="errorCarga ?? { message: 'No encontramos los resultados de esa leccion.', reintentable: false }"
      @reintentar="cargar"
    >
      <template #salida>
        <BaseBoton :to="{ name: 'cursos' }">Ver los cursos</BaseBoton>
      </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.tarjeta {
  animation: escalar-entrando var(--anim-media) var(--anim-rebote) both;
  max-width: 640px;
  margin-inline: auto;
  text-align: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
}

.tarjeta__sintax {
  margin-bottom: calc(var(--e-2) * -1);
}

.tarjeta__icono {
  animation: latido var(--anim-lenta) var(--anim-rebote);
  color: var(--c-verde-osc);
}

.tarjeta__leccion {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  background: var(--c-fondo);
  border-radius: var(--r-sm);
  padding: 0.25rem 0.75rem;
  color: var(--c-gris);
}

.marcadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--e-2);
  width: 100%;
  margin-block: var(--e-3);
}

.marcador {
  display: grid;
  gap: 0.2rem;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-2);
}

.marcador__valor {
  font-family: var(--f-titulo);
  font-weight: 900;
  font-size: var(--t-lg);
  font-variant-numeric: tabular-nums;
}

.marcador__texto {
  font-size: var(--t-xs);
  color: var(--c-gris);
  font-weight: 700;
}

.marcador--total {
  border-color: var(--c-violeta);
  background: var(--c-violeta-suave);
}
.marcador--acierto {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
}
.marcador--precision {
  border-color: var(--c-azul);
  background: var(--c-azul-suave);
}
.marcador--error {
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
}

.extras {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-3);
  justify-content: center;
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
}

.extras span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.extras__estado--ok {
  color: var(--c-verde-osc);
}

.extras__estado--no {
  color: var(--c-rojo-osc);
}

.confirmacion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--t-sm);
  font-weight: 800;
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  background: var(--c-fondo);
  color: var(--c-gris);
}

.confirmacion--confirmado {
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.confirmacion--error,
.confirmacion--no-encontrado {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
}

.unidad {
  width: 100%;
  display: grid;
  gap: 0.4rem;
  text-align: left;
}

.unidad__titulo {
  font-size: var(--t-sm);
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  gap: var(--e-2);
}

.unidad__logro {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-verde-osc);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: center;
  margin-top: var(--e-3);
}

.pie-nota {
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.pie-nota a:hover {
  text-decoration: underline;
  color: var(--c-verde-osc);
}
</style>
