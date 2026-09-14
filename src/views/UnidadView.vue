<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import { obtenerUnidad, ESTADO_UNIDAD } from '@/data/unidades.js'
import { leccionesDeUnidad } from '@/data/lecciones/index.js'
import { useProgreso } from '@/composables/useProgreso.js'

/** Detalle de una unidad: la lista de lecciones que la componen. */
const props = defineProps({
  unidadId: { type: String, required: true }
})

const router = useRouter()
const { estadoUnidad, progresoUnidad, leccionCompletada, estado } = useProgreso()

const unidad = computed(() => obtenerUnidad(props.unidadId))
const bloqueada = computed(
  () => unidad.value && estadoUnidad(unidad.value.id) === ESTADO_UNIDAD.BLOQUEADA
)

const listaLecciones = computed(() => {
  if (!unidad.value) return []
  return leccionesDeUnidad(unidad.value.id).map((leccion) => ({
    ...leccion,
    completada: leccionCompletada(leccion.id),
    resultado: estado.lecciones[leccion.id] ?? null
  }))
})

function abrirLeccion(leccion) {
  if (bloqueada.value) return
  router.push({ name: 'leccion', params: { leccionId: leccion.id } })
}
</script>

<template>
  <div class="unidad-vista seccion contenedor">
    <template v-if="unidad">
      <nav class="miga" aria-label="Ruta de navegacion">
        <router-link :to="{ name: 'cursos' }">Cursos</router-link>
        <span aria-hidden="true">›</span>
        <router-link :to="{ name: 'curso-javascript' }">JavaScript</router-link>
        <span aria-hidden="true">›</span>
        <span>Unidad {{ unidad.numero }}</span>
      </nav>

      <header class="cabecera" :style="{ '--color-unidad': unidad.color }">
        <span class="cabecera__icono" aria-hidden="true">{{ unidad.icono }}</span>
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
        🔒 Esta unidad todavia esta bloqueada. Termina la unidad anterior para abrirla.
      </p>

      <ol class="lecciones">
        <li v-for="leccion in listaLecciones" :key="leccion.id" class="leccion">
          <span class="leccion__icono" aria-hidden="true">
            {{ leccion.completada ? '✅' : bloqueada ? '🔒' : leccion.icono }}
          </span>

          <div class="leccion__texto">
            <h3>{{ leccion.numero }}. {{ leccion.titulo }}</h3>
            <p class="texto-secundario">{{ leccion.descripcion }}</p>
            <p class="leccion__meta">
              {{ leccion.ejercicios.length }} ejercicios · {{ leccion.xp }} XP
              <template v-if="leccion.resultado">
                · mejor resultado: {{ leccion.resultado.aciertos }}/{{ leccion.resultado.total }}
              </template>
            </p>
          </div>

          <BaseBoton
            :variante="leccion.completada ? 'contorno' : 'primario'"
            :deshabilitado="bloqueada"
            tamano="chico"
            @click="abrirLeccion(leccion)"
          >
            {{ leccion.completada ? 'Repasar' : 'Practicar' }}
          </BaseBoton>
        </li>
      </ol>

      <BaseBoton variante="texto" :to="{ name: 'curso-javascript' }">
        ← Volver al curso
      </BaseBoton>
    </template>

    <p v-else class="aviso">No encontramos esa unidad.</p>
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
