<script setup>
import Icono from '@/components/Icono.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CursoCard from '@/components/CursoCard.vue'
import EstadoConsulta from '@/components/EstadoConsulta.vue'
import { useCatalogo } from '@/composables/useCatalogo.js'
import { ESTADO_CURSO } from '@/constantes/estados.js'

const router = useRouter()
const { estado: catalogo, cargarCursos, recargarCursos } = useCatalogo()

const filtros = [
  { id: 'todos', texto: 'Todos' },
  { id: ESTADO_CURSO.DISPONIBLE, texto: 'Disponibles' },
  { id: ESTADO_CURSO.PROXIMAMENTE, texto: 'Proximamente' },
  { id: ESTADO_CURSO.BLOQUEADO, texto: 'Bloqueados' }
]

const filtroActivo = ref('todos')
const busqueda = ref('')

const cursos = computed(() => catalogo.cursos)

onMounted(() => cargarCursos())

/** Los filtros y el buscador trabajan sobre lo que ya vino de la base. */
const cursosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return cursos.value.filter((curso) => {
    const coincideEstado = filtroActivo.value === 'todos' || curso.estado === filtroActivo.value
    const coincideTexto =
      texto === '' ||
      curso.nombre.toLowerCase().includes(texto) ||
      curso.descripcion.toLowerCase().includes(texto) ||
      curso.etiquetas.some((tag) => tag.toLowerCase().includes(texto))
    return coincideEstado && coincideTexto
  })
})

/**
 * La tarjeta solo avisa que el estudiante eligio un curso:
 * la vista es la que decide a donde navegar.
 */
function abrirCurso(curso) {
  if (curso.ruta) router.push(curso.ruta)
}
</script>

<template>
  <div class="cursos seccion contenedor">
    <header class="cursos__cabecera">
      <div>
        <h1>Cursos</h1>
        <p class="texto-secundario">
          Elegi el lenguaje con el que queres empezar. Vamos sumando cursos nuevos todos los meses.
        </p>
      </div>

      <label class="buscador">
        <Icono class="buscador__icono" nombre="lupa" :tamano="17" />
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar un lenguaje o tema"
          aria-label="Buscar cursos"
        />
      </label>
    </header>

    <div class="filtros" role="group" aria-label="Filtrar cursos por estado">
      <button
        v-for="filtro in filtros"
        :key="filtro.id"
        type="button"
        class="filtro"
        :class="{ 'filtro--activo': filtroActivo === filtro.id }"
        @click="filtroActivo = filtro.id"
      >
        {{ filtro.texto }}
      </button>
    </div>

    <EstadoConsulta
      :cargando="catalogo.cargandoCursos"
      :error="catalogo.errorCursos"
      :vacio="!catalogo.cargandoCursos && !catalogo.errorCursos && cursos.length === 0"
      texto-cargando="Cargando los cursos..."
      titulo-vacio="Todavia no hay cursos publicados"
      texto-vacio="Cuando el equipo publique el primer curso vas a verlo aca."
      @reintentar="recargarCursos"
    >
      <ul v-if="cursosFiltrados.length" class="grilla anim-lista">
        <li v-for="curso in cursosFiltrados" :key="curso.id">
          <CursoCard :curso="curso" @seleccionar="abrirCurso" />
        </li>
      </ul>

      <p v-else class="vacio">
        No encontramos cursos con ese filtro. Proba con otra busqueda.
      </p>
    </EstadoConsulta>
  </div>
</template>

<style scoped>
.cursos__cabecera {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-3);
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--e-3);
}

.buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-full);
  padding: 0.45rem 1rem;
  min-width: 260px;
}

.buscador input {
  border: none;
  outline: none;
  font-family: inherit;
  font-size: var(--t-sm);
  width: 100%;
  background: transparent;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-1);
  margin-bottom: var(--e-4);
}

.filtro {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-full);
  padding: 0.35rem 1rem;
  transition: all 0.15s ease;
}

.filtro:hover {
  border-color: var(--c-verde);
}

.filtro--activo {
  background: var(--c-verde);
  border-color: var(--c-verde);
  color: var(--c-blanco);
}

.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: var(--e-3);
}

.vacio {
  text-align: center;
  color: var(--c-gris);
  padding: var(--e-6) 0;
}
</style>
