import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { bienvenidaVista } from '@/composables/useBienvenida.js'

/**
 * Rutas de Sintaxia.
 * Cada ruta tiene nombre propio para poder navegar con `:to="{ name: ... }"`
 * sin escribir las URLs a mano en las plantillas.
 */
const routes = [
  {
    path: '/',
    name: 'inicio',
    component: HomeView,
    meta: { titulo: 'Aprende a programar jugando' }
  },
  {
    path: '/cursos',
    name: 'cursos',
    component: () => import('@/views/CursosView.vue'),
    meta: { titulo: 'Cursos disponibles' }
  },
  {
    // El curso ya no esta escrito en la URL: se toma el identificador del
    // curso en la base y con el se piden sus unidades.
    path: '/cursos/:cursoId',
    name: 'curso',
    component: () => import('@/views/CursoView.vue'),
    props: true,
    meta: { titulo: 'Curso' }
  },
  {
    path: '/unidades/:unidadId',
    name: 'unidad',
    component: () => import('@/views/UnidadView.vue'),
    props: true,
    meta: { titulo: 'Unidad' }
  },
  {
    // Pantalla de teoria: titulo, explicacion y ejemplo de codigo.
    path: '/lecciones/:leccionId',
    name: 'leccion',
    component: () => import('@/views/LeccionIntroView.vue'),
    props: true,
    meta: { titulo: 'Leccion' }
  },
  {
    // Las actividades, a pantalla completa y sin distracciones.
    path: '/lecciones/:leccionId/actividades',
    name: 'actividades',
    component: () => import('@/views/LeccionView.vue'),
    props: true,
    meta: { titulo: 'Actividades', ocultarNavegacion: true }
  },
  {
    path: '/lecciones/:leccionId/resultados',
    name: 'resultados',
    component: () => import('@/views/ResultadosView.vue'),
    props: true,
    meta: { titulo: 'Resultados' }
  },

  // --- Direcciones viejas -------------------------------------------------
  // Las URLs de la etapa 2 tenian el curso escrito a mano. Se mantienen como
  // redirecciones para que los enlaces que ya existen sigan funcionando.
  {
    path: '/cursos/:cursoId/unidades/:unidadId',
    redirect: (a) => ({ name: 'unidad', params: { unidadId: a.params.unidadId } })
  },
  {
    path: '/cursos/:cursoId/lecciones/:leccionId',
    redirect: (a) => ({ name: 'leccion', params: { leccionId: a.params.leccionId } })
  },
  {
    path: '/cursos/:cursoId/lecciones/:leccionId/actividades',
    redirect: (a) => ({ name: 'actividades', params: { leccionId: a.params.leccionId } })
  },
  {
    path: '/cursos/:cursoId/lecciones/:leccionId/resultados',
    redirect: (a) => ({ name: 'resultados', params: { leccionId: a.params.leccionId } })
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { titulo: 'Mi perfil' }
  },
  {
    path: '/ranking',
    name: 'ranking',
    component: () => import('@/views/RankingView.vue'),
    meta: { titulo: 'Ranking semanal' }
  },
  {
    path: '/bienvenida',
    name: 'bienvenida',
    component: () => import('@/views/BienvenidaView.vue'),
    meta: { titulo: 'Bienvenida', ocultarNavegacion: true }
  },
  {
    path: '/ingresar',
    name: 'ingresar',
    component: () => import('@/views/IngresarView.vue'),
    meta: { titulo: 'Iniciar sesion' }
  },
  {
    path: '/:rutaInexistente(.*)*',
    name: 'no-encontrado',
    component: () => import('@/views/NoEncontradoView.vue'),
    meta: { titulo: 'Pagina no encontrada' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 }
  }
})

/**
 * La primera vez que alguien abre la aplicacion ve la pantalla de bienvenida,
 * igual que al instalar una app del celular. Despues no vuelve a aparecer,
 * salvo que se entre a /bienvenida a proposito.
 */
router.beforeEach((to) => {
  if (to.name === 'inicio' && !bienvenidaVista()) {
    return { name: 'bienvenida' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta?.titulo ? `Sintaxia | ${to.meta.titulo}` : 'Sintaxia'
})

export default router
