<script setup>
import Icono from '@/components/Icono.vue'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import UnidadCard from '@/components/UnidadCard.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import { useCatalogo } from '@/composables/useCatalogo.js'
import { useProgreso } from '@/composables/useProgreso.js'

/**
 * Pantalla de un curso: muestra SOLO las unidades de ese curso.
 * El identificador llega por la URL y es el mismo que tiene la fila en la base.
 */
const props = defineProps({
  cursoId: { type: String, required: true }
})

const router = useRouter()
const { estado: catalogo, cargarCurso, recargarCurso, leccionesDeUnidad } = useCatalogo()

watch(() => props.cursoId, (cursoId) => cargarCurso(cursoId), { immediate: true })

const curso = computed(() => catalogo.curso)
const unidadesCurso = computed(() => catalogo.unidades)
const leccionesCurso = computed(() => catalogo.lecciones)

const {
  estado,
  estadoUnidad,
  progresoUnidad,
  leccionesAprobadasDeUnidad,
  progresoCurso,
  totalLeccionesCompletadas,
  proximaLeccion
} = useProgreso()

/** Se arma una lista con la unidad y su progreso ya calculado. */
const unidades = computed(() =>
  unidadesCurso.value.map((unidad) => ({
    unidad,
    estado: estadoUnidad(unidad.id),
    progreso: progresoUnidad(unidad.id),
    completadas: leccionesAprobadasDeUnidad(unidad.id),
    totales: leccionesDeUnidad(unidad.id).length
  }))
)

function abrirUnidad(unidad) {
  router.push({ name: 'unidad', params: { unidadId: unidad.id } })
}

function continuar() {
  const leccion = proximaLeccion.value
  if (leccion) router.push({ name: 'leccion', params: { leccionId: leccion.id } })
}
</script>

<template>
  <div class="curso seccion contenedor">
    <EstadoConsulta
      :cargando="catalogo.cargandoCurso"
      :error="catalogo.errorCurso"
      :vacio="!catalogo.cargandoCurso && !catalogo.errorCurso && unidadesCurso.length === 0"
      texto-cargando="Cargando el curso..."
      titulo-vacio="Este curso todavia no tiene unidades"
      texto-vacio="Estamos preparando el contenido. Mientras tanto podes mirar los otros cursos."
      @reintentar="recargarCurso(props.cursoId)"
    >
      <template #salida>
        <BaseBoton variante="contorno" :to="{ name: 'cursos' }">Ver todos los cursos</BaseBoton>
      </template>

    <template v-if="curso">
    <nav class="miga" aria-label="Ruta de navegacion">
      <router-link :to="{ name: 'cursos' }">Cursos</router-link>
      <span aria-hidden="true">›</span>
      <span>{{ curso.nombre }}</span>
    </nav>

    <!-- Encabezado del curso -->
    <header class="portada">
      <div
        class="portada__icono"
        :style="{ background: curso.color, color: curso.colorTexto }"
        aria-hidden="true"
      >
        {{ curso.icono }}
      </div>

      <div class="portada__texto">
        <h1>Curso de {{ curso.nombre }}</h1>
        <p class="texto-secundario">{{ curso.descripcion }}</p>
        <ul class="portada__datos">
          <li><strong>{{ unidadesCurso.length }}</strong> unidades</li>
          <li><strong>{{ leccionesCurso.length }}</strong> lecciones</li>
          <li><strong>{{ estado.xp }}</strong> XP acumulados</li>
          <li><strong>{{ estado.racha }}</strong> dias de racha</li>
        </ul>
      </div>

      <div class="portada__progreso">
        <BarraProgreso :valor="progresoCurso" etiqueta="Progreso del curso" />
        <p class="portada__contador">
          {{ totalLeccionesCompletadas }} / {{ leccionesCurso.length }} lecciones · {{ progresoCurso }} %
        </p>
        <BaseBoton v-if="proximaLeccion" ancho-completo @click="continuar">
          {{ totalLeccionesCompletadas > 0 ? 'Continuar' : 'Empezar' }}
        </BaseBoton>
        <p v-else class="portada__listo">
          <Icono nombre="trofeo" :tamano="18" /> Curso completado!
        </p>
      </div>
    </header>

    <!-- Camino de unidades -->
    <section class="camino">
      <h2>Tu camino de aprendizaje</h2>
      <p class="texto-secundario">
        Completa todas las lecciones de una unidad para desbloquear la siguiente.
      </p>

      <ul class="camino__lista anim-lista">
        <li v-for="item in unidades" :key="item.unidad.id">
          <UnidadCard
            :unidad="item.unidad"
            :estado="item.estado"
            :progreso="item.progreso"
            :lecciones-completadas="item.completadas"
            :lecciones-totales="item.totales"
            @seleccionar="abrirUnidad"
          />
        </li>
      </ul>
    </section>
    </template>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.miga {
  display: flex;
  gap: 0.5rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  margin-bottom: var(--e-3);
}

.miga a:hover {
  color: var(--c-verde-osc);
  text-decoration: underline;
}

.portada {
  display: grid;
  grid-template-columns: auto 1fr 280px;
  gap: var(--e-3);
  align-items: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-4);
  margin-bottom: var(--e-5);
}

.portada__icono {
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border-radius: var(--r-lg);
  font-family: var(--f-codigo);
  font-weight: 700;
  font-size: var(--t-lg);
}

.portada__datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-3);
  margin-top: var(--e-2);
  font-size: var(--t-xs);
  color: var(--c-gris);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.portada__datos strong {
  display: block;
  font-size: var(--t-md);
  color: var(--c-tinta);
  text-transform: none;
}

.portada__progreso {
  display: grid;
  gap: var(--e-2);
}

.portada__contador {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
}

.portada__listo {
  font-weight: 800;
  color: var(--c-verde-osc);
  text-align: center;
}

.camino__lista {
  display: grid;
  gap: var(--e-3);
  margin-top: var(--e-3);
}

@media (max-width: 900px) {
  .portada {
    grid-template-columns: auto 1fr;
  }
  .portada__progreso {
    grid-column: 1 / -1;
  }
}
</style>
