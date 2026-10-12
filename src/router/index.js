import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { bienvenidaVista } from '@/composables/useBienvenida.js'
import { useAuth } from '@/composables/useAuth.js'

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
    meta: { titulo: 'Unidad', requiereSesion: true }
  },
  {
    // Pantalla de teoria: titulo, explicacion y ejemplo de codigo.
    path: '/lecciones/:leccionId',
    name: 'leccion',
    component: () => import('@/views/LeccionIntroView.vue'),
    props: true,
    meta: { titulo: 'Leccion', requiereSesion: true }
  },
  {
    // Las actividades, a pantalla completa y sin distracciones.
    path: '/lecciones/:leccionId/actividades',
    name: 'actividades',
    component: () => import('@/views/LeccionView.vue'),
    props: true,
    meta: { titulo: 'Actividades', ocultarNavegacion: true, requiereSesion: true }
  },
  {
    path: '/lecciones/:leccionId/resultados',
    name: 'resultados',
    component: () => import('@/views/ResultadosView.vue'),
    props: true,
    meta: { titulo: 'Resultados', requiereSesion: true }
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
    meta: { titulo: 'Mi perfil', requiereSesion: true }
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
    path: '/registro',
    name: 'registro',
    component: () => import('@/views/RegistroView.vue'),
    meta: { titulo: 'Crear cuenta' }
  },
  {
    path: '/recuperar',
    name: 'recuperar',
    component: () => import('@/views/RecuperarView.vue'),
    meta: { titulo: 'Recuperar contrasena' }
  },
  {
    // A donde vuelven los enlaces de los correos (confirmar cuenta, cambiar correo).
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/AuthCallbackView.vue'),
    meta: { titulo: 'Confirmando', ocultarNavegacion: true }
  },
  {
    // A donde vuelve el enlace de "olvide mi contrasena". No exige sesion a proposito:
    // si el enlace se abrio en otro dispositivo no hay sesion, y la pantalla explica
    // que hacer en lugar de mandar a ingresar sin decir por que.
    path: '/auth/nueva-clave',
    name: 'nueva-clave',
    component: () => import('@/views/NuevaClaveView.vue'),
    meta: { titulo: 'Nueva contrasena', ocultarNavegacion: true }
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
 * Guardas de navegacion.
 *
 * 1. Bienvenida: la primera vez que alguien abre la aplicacion ve la pantalla de
 *    bienvenida, igual que al instalar una app del celular. Despues no vuelve a
 *    aparecer, salvo que se entre a /bienvenida a proposito.
 *
 * 2. Rutas protegidas: las que tienen `meta.requiereSesion` (hacer lecciones, ver
 *    resultados, el perfil) piden una sesion, aunque sea de invitado. Antes de
 *    decidir se espera a que se restaure la sesion guardada en el dispositivo;
 *    si no hay ninguna, se manda a ingresar y se recuerda a donde volver.
 *    Mirar el catalogo de cursos es publico.
 *
 *    Mas adelante, las rutas de competencia van a pedir ademas una CUENTA (no un
 *    invitado): se resuelve con otro meta, `requiereCuenta`, en este mismo lugar.
 */
router.beforeEach(async (to) => {
  if (to.name === 'inicio' && !bienvenidaVista()) {
    return { name: 'bienvenida' }
  }

  // Las pantallas de acceso y de retorno tambien esperan la restauracion: el codigo
  // que trae un enlace de correo se canjea por una sesion durante ese paso.
  const necesitaSesion = to.meta?.requiereSesion === true
  const esDeAcceso = String(to.name ?? '').startsWith('auth-') || to.name === 'nueva-clave'
  if (!necesitaSesion && !esDeAcceso) return true

  const { iniciar, conSesion, esInvitado } = useAuth()
  await iniciar()

  if (necesitaSesion && !conSesion.value) {
    return { name: 'ingresar', query: { volver: to.fullPath } }
  }
  if (to.meta?.requiereCuenta === true && esInvitado.value) {
    return { name: 'registro', query: { volver: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta?.titulo ? `Sintaxia | ${to.meta.titulo}` : 'Sintaxia'
})

export default router
