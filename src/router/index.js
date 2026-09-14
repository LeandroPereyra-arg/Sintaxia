import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
    path: '/cursos/javascript',
    name: 'curso-javascript',
    component: () => import('@/views/CursoJavaScriptView.vue'),
    meta: { titulo: 'Curso de JavaScript' }
  },
  {
    path: '/cursos/javascript/unidades/:unidadId',
    name: 'unidad',
    component: () => import('@/views/UnidadView.vue'),
    props: true,
    meta: { titulo: 'Unidad' }
  },
  {
    path: '/cursos/javascript/lecciones/:leccionId',
    name: 'leccion',
    component: () => import('@/views/LeccionView.vue'),
    props: true,
    meta: { titulo: 'Leccion', ocultarNavegacion: true }
  },
  {
    path: '/cursos/javascript/lecciones/:leccionId/resultados',
    name: 'resultados',
    component: () => import('@/views/ResultadosView.vue'),
    props: true,
    meta: { titulo: 'Resultados' }
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

router.afterEach((to) => {
  document.title = to.meta?.titulo ? `Sintaxia | ${to.meta.titulo}` : 'Sintaxia'
})

export default router
