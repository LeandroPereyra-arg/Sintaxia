<script setup>
import Icono from '@/components/Icono.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import MedallaCard from '@/components/MedallaCard.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { useContador } from '@/composables/useContador.js'
import { obtenerLeccion, obtenerUnidad, listarLecciones } from '@/servicios/contenido.js'
import { useProgreso, UMBRAL_APROBACION } from '@/composables/useProgreso.js'

/** Pantalla de cierre de una leccion: puntaje, XP ganado y que sigue. */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const route = useRoute()
const router = useRouter()
const { estado, progresoUnidad, unidadCompletada, ultimoResultado } = useProgreso()

const leccion = ref(null)
const unidad = ref(null)
const hermanas = ref([])

async function cargar() {
  try {
    leccion.value = await obtenerLeccion(props.leccionId)
    unidad.value = await obtenerUnidad(leccion.value.unidadId)
    hermanas.value = await listarLecciones(leccion.value.unidadId)
  } catch {
    leccion.value = null
  }
}

onMounted(cargar)
watch(() => props.leccionId, cargar)

const total = computed(() => Number(route.query.total ?? leccion.value?.ejercicios.length ?? 0))
const aciertos = computed(() => Number(route.query.aciertos ?? 0))
const xpGanado = computed(() => Number(route.query.xp ?? 0))
const vidas = computed(() => Number(route.query.vidas ?? 0))

const incorrectas = computed(() => Math.max(0, total.value - aciertos.value))
const porcentaje = computed(() =>
  total.value === 0 ? 0 : Math.round((aciertos.value / total.value) * 100)
)

/** Una leccion se aprueba a partir del umbral definido en useProgreso. */
const aprobada = computed(() => !sinVidas.value && porcentaje.value >= UMBRAL_APROBACION * 100)

const sinVidas = computed(() => vidas.value <= 0)

/** Sintax reacciona segun como te fue. */
const animoSintax = computed(() => {
  if (sinVidas.value) return 'enojado'
  if (porcentaje.value === 100) return 'celebrando'
  if (porcentaje.value >= 60) return 'normal'
  return 'confundido'
})

const xpAnimado = useContador(xpGanado)
const incorrectasAnimadas = useContador(incorrectas, { duracion: 700 })
const aciertosAnimados = useContador(aciertos, { duracion: 700 })
const porcentajeAnimado = useContador(porcentaje, { duracion: 700 })

const mensaje = computed(() => {
  if (sinVidas.value) return { icono: 'corazonRoto', titulo: 'Te quedaste sin vidas', texto: 'La leccion no quedo completada y no suma XP. Volve a intentarlo: ahora ya sabes las respuestas.' }
  if (porcentaje.value === 100) return { icono: 'trofeo', titulo: 'Leccion perfecta!', texto: 'Respondiste todo bien. Asi se aprende a programar.' }
  if (porcentaje.value >= 60) return { icono: 'chispas', titulo: 'Leccion completada!', texto: 'Muy buen trabajo. Repasa lo que fallaste y segui avanzando.' }
  return { icono: 'pesa', titulo: 'Leccion terminada', texto: 'Te costo un poco: repetir la leccion es la mejor forma de fijarlo.' }
})

/** Siguiente leccion de la misma unidad, si queda alguna. */
const siguienteLeccion = computed(() => {
  if (!leccion.value) return null
  const pos = hermanas.value.findIndex((l) => l.id === leccion.value.id)
  return hermanas.value[pos + 1] ?? null
})

const unidadTerminada = computed(() => (unidad.value ? unidadCompletada(unidad.value.id) : false))

/** Medallas desbloqueadas justo en esta leccion (las otorga el servidor). */
const medallasNuevas = computed(() => {
  const ultimo = ultimoResultado.value
  if (!ultimo || ultimo.leccionId !== props.leccionId) return []
  return (ultimo.medallasNuevas ?? []).map((m) => ({
    codigo: m.codigo,
    nombre: m.nombre,
    descripcion: m.descripcion,
    icono: m.icono,
    nivel: m.nivel,
    obtenida: true,
    obtenidaEn: null,
    progreso: { actual: 1, objetivo: 1 }
  }))
})

/** Reintentar arranca un intento nuevo: las respuestas anteriores no cuentan. */
function repetir() {
  router.push({ name: 'actividades', params: { leccionId: props.leccionId } })
}

function siguiente() {
  if (siguienteLeccion.value) {
    router.push({ name: 'leccion', params: { leccionId: siguienteLeccion.value.id } })
  } else {
    router.push({ name: 'curso-javascript' })
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

      <ul class="marcadores">
        <li class="marcador marcador--total">
          <span class="marcador__valor">{{ total }}</span>
          <span class="marcador__texto">Actividades</span>
        </li>
        <li class="marcador marcador--acierto">
          <span class="marcador__valor">{{ aciertosAnimados }}</span>
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
        <span class="extras__estado" :class="aprobada ? 'extras__estado--ok' : 'extras__estado--no'">
          <Icono :nombre="aprobada ? 'checkCirculo' : 'equisCirculo'" :tamano="15" />
          {{ aprobada ? 'Leccion aprobada' : 'Leccion no aprobada' }}
        </span>
      </p>

      <section v-if="medallasNuevas.length" class="medallas-nuevas">
        <p class="medallas-nuevas__titulo">
          {{ medallasNuevas.length === 1 ? 'Desbloqueaste una medalla!' : 'Desbloqueaste medallas!' }}
        </p>
        <ul class="medallas-nuevas__lista">
          <li v-for="medalla in medallasNuevas" :key="medalla.codigo">
            <MedallaCard :medalla="medalla" nueva />
          </li>
        </ul>
      </section>

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
        <BaseBoton variante="contorno" @click="repetir">Intentar de nuevo</BaseBoton>

        <BaseBoton
          variante="contorno"
          :to="{ name: 'unidad', params: { unidadId: leccion.unidadId } }"
        >
          Volver a la unidad
        </BaseBoton>

        <BaseBoton v-if="aprobada && siguienteLeccion" @click="siguiente">
          Siguiente leccion
        </BaseBoton>
        <BaseBoton v-else-if="aprobada" :to="{ name: 'curso-javascript' }">
          Volver al curso
        </BaseBoton>
      </div>

      <p class="pie-nota">
        <router-link :to="{ name: 'perfil' }">
          Ver mi progreso completo <Icono nombre="flechaDerecha" :tamano="15" />
        </router-link>
      </p>
    </div>

    <p v-else class="centrado">No encontramos los resultados de esa leccion.</p>
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

.medallas-nuevas {
  width: 100%;
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  display: grid;
  gap: var(--e-2);
}

.medallas-nuevas__titulo {
  font-family: var(--f-titulo);
  font-weight: 900;
  color: var(--c-amarillo-osc);
}

.medallas-nuevas__lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, 170px);
  justify-content: center;
  gap: var(--e-2);
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
