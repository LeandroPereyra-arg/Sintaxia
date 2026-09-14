<script setup>
import Icono from '@/components/Icono.vue'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoSintaxia from '@/components/LogoSintaxia.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useProgreso } from '@/composables/useProgreso.js'

const route = useRoute()
const router = useRouter()
const { estado: sesion, autenticado, salir } = useAuth()
const { estado } = useProgreso()

const menuAbierto = ref(false)
const menuUsuario = ref(false)
const contenedorUsuario = ref(null)

const enlaces = [
  { nombre: 'inicio', texto: 'Inicio' },
  { nombre: 'cursos', texto: 'Cursos' },
  { nombre: 'curso-javascript', texto: 'JavaScript' },
  { nombre: 'ranking', texto: 'Ranking' }
]

const usuario = computed(() => sesion.usuario)
const xp = computed(() => usuario.value?.xp ?? estado.xp)
const racha = computed(() => usuario.value?.racha ?? estado.racha)

const inicial = computed(() => {
  const texto = usuario.value?.nombre ?? estado.nombre ?? '?'
  return texto.trim().charAt(0).toUpperCase()
})

function cerrarTodo() {
  menuAbierto.value = false
  menuUsuario.value = false
}

async function cerrarSesion() {
  cerrarTodo()
  await salir()
  router.push({ name: 'inicio' })
}

/** Cierra el menu del usuario al hacer clic afuera. */
function clicAfuera(evento) {
  if (contenedorUsuario.value && !contenedorUsuario.value.contains(evento.target)) {
    menuUsuario.value = false
  }
}

onMounted(() => document.addEventListener('click', clicAfuera))
onBeforeUnmount(() => document.removeEventListener('click', clicAfuera))
</script>

<template>
  <header class="cabecera">
    <div class="cabecera__interior contenedor">
      <router-link :to="{ name: 'inicio' }" class="marca" @click="cerrarTodo">
        <LogoSintaxia variante="icono" :alto="36" alt="" class="marca__logo" />
        <span class="marca__nombre">Sintaxia</span>
      </router-link>

      <button
        class="cabecera__hamburguesa"
        :aria-expanded="menuAbierto"
        aria-label="Abrir menu de navegacion"
        @click="menuAbierto = !menuAbierto"
      >
        <span />
        <span />
        <span />
      </button>

      <nav class="nav" :class="{ 'nav--abierto': menuAbierto }">
        <router-link
          v-for="enlace in enlaces"
          :key="enlace.nombre"
          :to="{ name: enlace.nombre }"
          class="nav__enlace"
          @click="cerrarTodo"
        >
          {{ enlace.texto }}
        </router-link>
      </nav>

      <ul class="indicadores">
        <li class="indicador indicador--racha" :title="`Racha de ${racha} dias`">
          <Icono nombre="llama" :tamano="16" />{{ racha }}
        </li>
        <li class="indicador indicador--xp" :title="`${xp} puntos de experiencia`">
          <Icono nombre="rayo" :tamano="16" />{{ xp }}
        </li>
      </ul>

      <!-- Sesion iniciada: avatar con menu -->
      <div v-if="autenticado" ref="contenedorUsuario" class="usuario">
        <button
          class="usuario__boton"
          :aria-expanded="menuUsuario"
          aria-label="Abrir menu de la cuenta"
          @click="menuUsuario = !menuUsuario"
        >
          <img v-if="usuario.avatarUrl && !usuario.avatarIcono" :src="usuario.avatarUrl" alt="" />
          <Icono v-else-if="usuario.avatarIcono" :nombre="usuario.avatarIcono" :tamano="21" />
          <span v-else>{{ inicial }}</span>
        </button>

        <div v-if="menuUsuario" class="menu">
          <p class="menu__nombre">{{ usuario.nombre }}</p>
          <p class="menu__usuario">@{{ usuario.usuario }}</p>
          <p v-if="usuario.liga" class="menu__liga" :style="{ '--color-liga': usuario.liga.color }">
            <Icono :nombre="usuario.liga.icono" :tamano="14" /> Liga {{ usuario.liga.nombre }}
          </p>
          <hr />
          <router-link :to="{ name: 'perfil' }" class="menu__opcion" @click="cerrarTodo">
            Mi perfil
          </router-link>
          <router-link :to="{ name: 'ranking' }" class="menu__opcion" @click="cerrarTodo">
            Ranking
          </router-link>
          <button type="button" class="menu__opcion menu__opcion--salir" @click="cerrarSesion">
            Cerrar sesion
          </button>
        </div>
      </div>

      <!-- Invitado: boton de entrar -->
      <router-link
        v-else
        class="entrar"
        :to="{ name: 'ingresar', query: { destino: route.fullPath } }"
        @click="cerrarTodo"
      >
        Entrar
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.cabecera {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--c-blanco);
  border-bottom: 2px solid var(--c-borde);
}

.cabecera__interior {
  min-height: var(--alto-header);
  display: flex;
  align-items: center;
  gap: var(--e-2);
  flex-wrap: wrap;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--f-titulo);
  font-weight: 900;
  font-size: var(--t-md);
  margin-right: auto;
}

.marca__logo {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.marca:hover .marca__logo {
  transform: rotate(-6deg) scale(1.08);
}

.nav {
  display: flex;
  gap: var(--e-1);
}

.nav__enlace {
  font-weight: 700;
  font-size: var(--t-sm);
  color: var(--c-gris);
  padding: 0.45rem 0.8rem;
  border-radius: var(--r-sm);
  transition: background 0.15s ease, color 0.15s ease;
}

.nav__enlace:hover {
  background: var(--c-fondo);
  color: var(--c-tinta);
}

.nav__enlace.router-link-active {
  color: var(--c-verde-osc);
  background: var(--c-verde-suave);
}

.indicadores {
  display: flex;
  gap: var(--e-2);
}

.indicador {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 800;
  font-size: var(--t-sm);
  padding: 0.3rem 0.7rem;
  border-radius: var(--r-full);
}

.indicador--racha {
  background: var(--c-rojo-suave);
  color: var(--c-rojo-osc);
}

/* La llama de la racha late despacio: recuerda que hay algo que mantener. */
.indicador--racha :deep(.icono) {
  animation: latido 2.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .indicador--racha :deep(.icono) {
    animation: none;
  }
}
.indicador--xp {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
}

/* --- cuenta --- */
.usuario {
  position: relative;
}

.usuario__boton {
  width: 40px;
  height: 40px;
  border-radius: var(--r-full);
  border: 2px solid var(--c-violeta);
  background: var(--c-violeta-suave);
  color: var(--c-violeta-osc);
  font-weight: 800;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.usuario__boton img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 210px;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  box-shadow: var(--sombra-flotante);
  padding: var(--e-2);
  display: grid;
  gap: 0.15rem;
  z-index: 30;
}

.menu__nombre {
  font-family: var(--f-titulo);
  font-weight: 800;
}

.menu__usuario {
  font-family: var(--f-codigo);
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.menu__liga {
  font-size: var(--t-xs);
  font-weight: 800;
  color: var(--color-liga);
  margin-top: 0.2rem;
}

.menu hr {
  border: none;
  border-top: 2px solid var(--c-borde);
  margin: var(--e-1) 0;
}

.menu__opcion {
  display: block;
  width: 100%;
  text-align: left;
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
  padding: 0.45rem 0.6rem;
  border-radius: var(--r-sm);
}

.menu__opcion:hover {
  background: var(--c-fondo);
  color: var(--c-tinta);
}

.menu__opcion--salir {
  color: var(--c-rojo-osc);
}

.menu__opcion--salir:hover {
  background: var(--c-rojo-suave);
  color: var(--c-rojo-osc);
}

.entrar {
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-sm);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--c-blanco);
  background: var(--c-verde);
  box-shadow: 0 4px 0 var(--c-verde-osc);
  border-radius: var(--r-md);
  padding: 0.55rem 1.1rem;
  transition: transform 0.08s ease;
}

.entrar:active {
  transform: translateY(4px);
  box-shadow: none;
}

.cabecera__hamburguesa {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 0.5rem;
}
.cabecera__hamburguesa span {
  width: 22px;
  height: 3px;
  border-radius: 2px;
  background: var(--c-tinta);
}

@media (max-width: 860px) {
  .cabecera__hamburguesa {
    display: flex;
    order: 4;
  }
  .indicadores {
    order: 2;
  }
  .usuario,
  .entrar {
    order: 3;
  }
  .nav {
    order: 5;
    display: none;
    width: 100%;
    flex-direction: column;
    padding-bottom: var(--e-2);
  }
  .nav--abierto {
    display: flex;
  }
}
</style>
