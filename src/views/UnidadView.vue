<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import {
  obtenerUnidad,
  listarLecciones,
  ESTADO_UNIDAD,
  ContenidoNoEncontrado
} from '@/servicios/contenido.js'
import { useProgreso } from '@/composables/useProgreso.js'

/**
 * Detalle de una unidad: las lecciones que la componen.
 * Todo el contenido se le pide al modulo de acceso a datos.
 */
const props = defineProps({
  unidadId: { type: String, required: true }
})

const router = useRouter()
const {
  estadoUnidad,
  progresoUnidad,
  leccionCompletada,
  leccionAprobada,
  leccionDisponible,
  precisionLeccion,
  motivoBloqueo
} = useProgreso()

const unidad = ref(null)
const lecciones = ref([])
const cargando = ref(true)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  unidad.value = null
  lecciones.value = []
  try {
    unidad.value = await obtenerUnidad(props.unidadId)
    lecciones.value = await listarLecciones(props.unidadId)
  } catch (e) {
    error.value =
      e instanceof ContenidoNoEncontrado
        ? 'No encontramos esa unidad.'
        : 'Hubo un problema al cargar la unidad.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(() => props.unidadId, cargar)

const bloqueada = computed(
  () => unidad.value && estadoUnidad(unidad.value.id) === ESTADO_UNIDAD.BLOQUEADA
)

/** Cada leccion con su estado ya resuelto, para no calcularlo en la plantilla. */
const listaLecciones = computed(() =>
  lecciones.value.map((leccion) => ({
    ...leccion,
    completada: leccionCompletada(leccion.id),
    aprobada: leccionAprobada(leccion.id),
    disponible: leccionDisponible(leccion.id),
    precision: precisionLeccion(leccion.id),
    motivo: motivoBloqueo(leccion.id)
  }))
)

function abrirLeccion(leccion) {
  if (!leccion.disponible) return
  router.push({ name: 'leccion', params: { leccionId: leccion.id } })
}
</script>

<template>
  <div class="unidad-vista seccion contenedor">
    <p v-if="cargando" class="estado">Cargando la unidad...</p>

    <div v-else-if="error" class="vacio">
      <SintaxMascota estado="confundido" :alto="130" alt="" />
      <h1>No encontramos esa unidad</h1>
      <p class="texto-secundario">{{ error }}</p>
      <BaseBoton :to="{ name: 'curso-javascript' }">Volver al curso</BaseBoton>
    </div>

    <template v-else-if="unidad">
      <nav class="miga" aria-label="Ruta de navegacion">
        <router-link :to="{ name: 'cursos' }">Cursos</router-link>
        <span aria-hidden="true">›</span>
        <router-link :to="{ name: 'curso-javascript' }">JavaScript</router-link>
        <span aria-hidden="true">›</span>
        <span>Unidad {{ unidad.numero }}</span>
      </nav>

      <header class="cabecera" :style="{ '--color-unidad': unidad.color }">
        <Icono class="cabecera__icono" :nombre="unidad.icono" :tamano="40" :trazo="1.9" />
        <div>
          <p class="cabecera__numero">Unidad {{ unidad.numero }}</p>
          <h1>{{ unidad.titulo }}</h1>
          <p class="texto-secundario">{{ unidad.descripcion }}</p>
        </div>
        <div class="cabecera__progreso">
          <BarraProgreso
            :valor="progresoUnidad(unidad.id)"
            :color="unidad.color"
            :etiqueta="`Progreso de la unidad ${unidad.numero}`"
          />
          <p class="cabecera__porcentaje">{{ progresoUnidad(unidad.id) }} % completado</p>
        </div>
      </header>

      <p v-if="bloqueada" class="aviso">
        <Icono nombre="candado" :tamano="17" /> Esta unidad todavia esta bloqueada. Termina la unidad anterior para abrirla.
      </p>

      <ol class="lecciones anim-lista">
        <li v-for="leccion in listaLecciones" :key="leccion.id" class="leccion">
          <Icono
            class="leccion__icono"
            :class="{ 'leccion__icono--ok': leccion.aprobada }"
            :nombre="leccion.aprobada ? 'checkCirculo' : !leccion.disponible ? 'candado' : leccion.icono"
            :tamano="26"
            :trazo="2.1"
          />

          <div class="leccion__texto">
            <h3>{{ leccion.numero }}. {{ leccion.titulo }}</h3>
            <p class="texto-secundario">{{ leccion.descripcion }}</p>
            <p class="leccion__meta">
              {{ leccion.ejercicios.length }} actividades · {{ leccion.xp }} XP
              <template v-if="leccion.completada">
                · mejor intento: {{ leccion.precision }} %
              </template>
            </p>

            <p v-if="leccion.aprobada" class="leccion__estado leccion__estado--ok">
              <Icono nombre="check" :tamano="14" /> Aprobada
            </p>
            <p v-else-if="leccion.completada" class="leccion__estado leccion__estado--media">
              <Icono nombre="equis" :tamano="14" /> Completada, pero todavia no aprobada
            </p>
            <p v-else-if="!leccion.disponible" class="leccion__estado leccion__estado--off">
              <Icono nombre="candado" :tamano="14" /> {{ leccion.motivo }}
            </p>
          </div>

          <BaseBoton
            :variante="leccion.aprobada ? 'contorno' : 'primario'"
            :deshabilitado="!leccion.disponible"
            tamano="chico"
            @click="abrirLeccion(leccion)"
          >
            {{ leccion.aprobada ? 'Repasar' : leccion.completada ? 'Reintentar' : 'Empezar' }}
          </BaseBoton>
        </li>
      </ol>

      <BaseBoton variante="texto" :to="{ name: 'curso-javascript' }">
        <Icono nombre="flechaIzquierda" :tamano="16" /> Volver al curso
      </BaseBoton>
    </template>

  </div>
</template>

<style scoped>
.miga {
  display: flex;
  gap: 0.5rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  margin-bottom: var(--e-3);
  flex-wrap: wrap;
}

.miga a:hover {
  color: var(--c-verde-osc);
  text-decoration: underline;
}

.cabecera {
  display: grid;
  grid-template-columns: auto 1fr 260px;
  gap: var(--e-3);
  align-items: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-left: 8px solid var(--color-unidad, var(--c-verde));
  border-radius: var(--r-lg);
  padding: var(--e-3);
  margin-bottom: var(--e-4);
}

.cabecera__icono {
  font-size: 2.5rem;
}

.cabecera__numero {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-gris);
}

.cabecera h1 {
  font-size: var(--t-xl);
}

.cabecera__porcentaje {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
  margin-top: 0.3rem;
}

.aviso {
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  border-radius: var(--r-md);
  padding: var(--e-2) var(--e-3);
  font-weight: 700;
  color: var(--c-amarillo-osc);
  margin-bottom: var(--e-3);
}

.estado {
  text-align: center;
  color: var(--c-gris);
  padding: var(--e-6) 0;
}

.vacio {
  display: grid;
  justify-items: center;
  gap: var(--e-2);
  text-align: center;
  padding-block: var(--e-5);
}

.leccion__icono--ok {
  color: var(--c-verde);
}

.leccion__estado {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--t-xs);
  font-weight: 700;
  margin-top: 0.3rem;
}

.leccion__estado--ok {
  color: var(--c-verde-osc);
}

.leccion__estado--media {
  color: var(--c-amarillo-osc);
}

.leccion__estado--off {
  color: var(--c-gris);
}

.lecciones {
  display: grid;
  gap: var(--e-2);
  margin-bottom: var(--e-4);
  list-style: none;
}

.leccion {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--e-3);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-3);
  transition: border-color 0.15s ease;
}

.leccion:hover {
  border-color: var(--c-verde);
}

.leccion__icono {
  font-size: 1.6rem;
}

.leccion__texto h3 {
  font-size: var(--t-base);
}

.leccion__texto p {
  font-size: var(--t-sm);
}

.leccion__meta {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
  margin-top: 0.2rem;
}

@media (max-width: 820px) {
  .cabecera {
    grid-template-columns: auto 1fr;
  }
  .cabecera__progreso {
    grid-column: 1 / -1;
  }
  .leccion {
    grid-template-columns: auto 1fr;
  }
  .leccion :deep(.boton) {
    grid-column: 1 / -1;
  }
}
</style>
