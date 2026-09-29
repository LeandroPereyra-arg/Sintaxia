<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import Icono from '@/components/Icono.vue'
import BloqueCodigo from '@/components/BloqueCodigo.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import { obtenerLeccion, obtenerUnidad, contarActividades } from '@/servicios/contenido.js'
import { useCatalogo } from '@/composables/useCatalogo.js'
import { useProgreso } from '@/composables/useProgreso.js'

/**
 * Pantalla de teoria: lo primero que se ve al entrar a una leccion.
 *
 * Muestra el titulo, la explicacion y el ejemplo de codigo, y recien despues
 * ofrece empezar las actividades. La idea es que nadie llegue a una pregunta
 * sobre algo que todavia no le explicaron.
 *
 * La leccion se pide por su identificador; la unidad, por la clave foranea que
 * trae la propia leccion.
 */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const router = useRouter()
const { estado: catalogo, cargarCurso } = useCatalogo()
const { leccionDisponible, leccionCompletada, leccionAprobada, precisionLeccion, motivoBloqueo } =
  useProgreso()

const leccion = ref(null)
const unidad = ref(null)
const totalActividades = ref(0)
const cargando = ref(true)
const error = ref(null)

async function cargar() {
  cargando.value = true
  error.value = null
  leccion.value = null
  unidad.value = null
  try {
    const datos = await obtenerLeccion(props.leccionId)
    const [suUnidad, cantidad] = await Promise.all([
      obtenerUnidad(datos.unidadId),
      contarActividades(datos.id)
    ])
    leccion.value = datos
    unidad.value = suUnidad
    totalActividades.value = cantidad
    // El catalogo hace falta para saber si la leccion esta habilitada.
    cargarCurso(suUnidad.cursoId)
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

watch(() => props.leccionId, cargar, { immediate: true })

const bloqueada = computed(() => leccion.value && !leccionDisponible(props.leccionId))
const motivo = computed(() => (bloqueada.value ? motivoBloqueo(props.leccionId) : ''))
const completada = computed(() => leccionCompletada(props.leccionId))
const aprobada = computed(() => leccionAprobada(props.leccionId))
const ejemplo = computed(() => leccion.value?.teoria?.ejemplo ?? null)

const textoBoton = computed(() => {
  if (aprobada.value) return 'Volver a practicar'
  if (completada.value) return 'Intentar de nuevo'
  return 'Comenzar actividades'
})

function comenzar() {
  if (bloqueada.value || totalActividades.value === 0) return
  router.push({ name: 'actividades', params: { leccionId: props.leccionId } })
}
</script>

<template>
  <div class="intro seccion contenedor">
    <EstadoConsulta
      :cargando="cargando"
      :error="error"
      texto-cargando="Cargando la leccion..."
      @reintentar="cargar"
    >
      <template #salida>
        <BaseBoton variante="contorno" :to="{ name: 'cursos' }">Ver todos los cursos</BaseBoton>
      </template>

    <template v-if="leccion">
      <nav class="miga" aria-label="Ruta de navegacion">
        <router-link :to="{ name: 'cursos' }">Cursos</router-link>
        <span aria-hidden="true">›</span>
        <router-link
          v-if="unidad"
          :to="{ name: 'curso', params: { cursoId: unidad.cursoId } }"
        >
          {{ catalogo.curso?.nombre ?? 'Curso' }}
        </router-link>
        <span aria-hidden="true">›</span>
        <router-link :to="{ name: 'unidad', params: { unidadId: leccion.unidadId } }">
          Unidad {{ unidad?.numero }}
        </router-link>
        <span aria-hidden="true">›</span>
        <span>{{ leccion.titulo }}</span>
      </nav>

      <article class="tarjeta">
        <header class="cabecera">
          <Icono class="cabecera__icono" :nombre="leccion.icono" :tamano="34" :trazo="2" />
          <div>
            <p class="cabecera__paso">
              Leccion {{ leccion.numero }} · Unidad {{ unidad?.numero }}
            </p>
            <h1>{{ leccion.titulo }}</h1>
            <p class="texto-secundario">{{ leccion.descripcion }}</p>
          </div>

          <span v-if="aprobada" class="etiqueta etiqueta--completada">Aprobada</span>
          <span v-else-if="completada" class="etiqueta etiqueta--disponible">Completada</span>
        </header>

        <!-- Explicacion -->
        <section class="teoria">
          <h2>Como funciona</h2>
          <p class="teoria__texto">{{ leccion.teoria.explicacion }}</p>
        </section>

        <!-- Ejemplo de codigo (la leccion puede no tenerlo) -->
        <section v-if="ejemplo" class="ejemplo">
          <h2>
            <Icono nombre="pieza" :tamano="19" />
            {{ ejemplo.titulo }}
          </h2>
          <BloqueCodigo :codigo="ejemplo.codigo" :etiqueta="ejemplo.titulo" />
          <p v-if="ejemplo.nota" class="ejemplo__nota">
            <Icono nombre="bombita" :tamano="15" />
            {{ ejemplo.nota }}
          </p>
        </section>

        <!-- Que viene despues -->
        <footer class="pie">
          <ul class="pie__datos">
            <li>
              <Icono nombre="diana" :tamano="16" />
              {{ totalActividades }} actividades
            </li>
            <li>
              <Icono nombre="rayo" :tamano="16" />
              {{ leccion.xp }} XP
            </li>
            <li v-if="completada">
              <Icono nombre="check" :tamano="16" />
              Mejor resultado: {{ precisionLeccion(leccionId) }} %
            </li>
          </ul>

          <p v-if="bloqueada" class="aviso">
            <Icono nombre="candado" :tamano="16" /> {{ motivo }}
          </p>
          <p v-else-if="totalActividades === 0" class="aviso">
            <Icono nombre="reloj" :tamano="16" /> Esta leccion todavia no tiene actividades publicadas.
          </p>

          <BaseBoton
            tamano="grande"
            ancho-completo
            :deshabilitado="bloqueada || totalActividades === 0"
            @click="comenzar"
          >
            {{ bloqueada ? 'Leccion bloqueada' : totalActividades === 0 ? 'Sin actividades' : textoBoton }}
          </BaseBoton>

          <BaseBoton
            variante="texto"
            :to="{ name: 'unidad', params: { unidadId: leccion.unidadId } }"
          >
            <Icono nombre="flechaIzquierda" :tamano="16" /> Volver a la unidad
          </BaseBoton>
        </footer>
      </article>
    </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.intro {
  max-width: 760px;
  margin-inline: auto;
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

.vacio__acciones {
  display: flex;
  gap: var(--e-2);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--e-2);
}

.miga {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  margin-bottom: var(--e-3);
}

.miga a:hover {
  color: var(--c-verde-osc);
  text-decoration: underline;
}

/* Los hijos de una grilla traen min-width: auto, asi que el ejemplo de codigo
   (que es ancho por definicion) estiraba toda la tarjeta y desbordaba la
   pagina en el celular. Con min-width: 0 el bloque se queda dentro y scrollea
   en su propia caja. */
.tarjeta > * {
  min-width: 0;
}

.tarjeta {
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-4);
  display: grid;
  gap: var(--e-4);
  animation: subir-entrando var(--anim-media) var(--anim-suave) both;
}

.cabecera {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: var(--e-3);
}

.cabecera__icono {
  color: var(--c-verde-osc);
  margin-top: 0.2rem;
}

.cabecera__paso {
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--c-gris);
}

.cabecera h1 {
  font-size: var(--t-xl);
  margin-block: 0.15rem;
}

.teoria__texto {
  font-size: var(--t-md);
  line-height: 1.65;
  color: var(--c-tinta);
}

.teoria h2,
.ejemplo h2 {
  font-size: var(--t-base);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-gris);
  margin-bottom: var(--e-2);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.ejemplo__nota {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  background: var(--c-amarillo-suave);
  border-radius: var(--r-sm);
  padding: var(--e-2);
  margin-top: var(--e-2);
}

.pie {
  display: grid;
  gap: var(--e-2);
  justify-items: center;
  border-top: 2px solid var(--c-borde);
  padding-top: var(--e-3);
}

.pie__datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-3);
  justify-content: center;
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
}

.pie__datos li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.aviso {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-amarillo-osc);
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  border-radius: var(--r-md);
  padding: var(--e-2);
  width: 100%;
}

@media (max-width: 640px) {
  .tarjeta {
    padding: var(--e-3);
  }
  .cabecera {
    grid-template-columns: auto 1fr;
  }
  .cabecera .etiqueta {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>
