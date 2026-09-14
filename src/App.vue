<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useProgreso } from '@/composables/useProgreso.js'

const route = useRoute()
const { estado: sesion, iniciar, autenticado } = useAuth()
const { cargarCuenta, volverAInvitado } = useProgreso()

/** Las lecciones se ven a pantalla completa, sin cabecera ni pie. */
const modoLeccion = computed(() => Boolean(route.meta?.ocultarNavegacion))

onMounted(iniciar)

/**
 * Cuando aparece o desaparece la sesion, el progreso cambia de fuente:
 * al entrar se sube lo hecho como invitado y se carga la cuenta;
 * al salir se vuelve a empezar en local.
 */
watch(autenticado, (hay, habia) => {
  if (hay) cargarCuenta()
  else if (habia) volverAInvitado()
})
</script>

<template>
  <div class="app" :class="{ 'app--leccion': modoLeccion }">
    <AppHeader v-if="!modoLeccion" />

    <main class="app__contenido">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppFooter v-if="!modoLeccion" />

    <!-- Aviso discreto cuando la app corre sin backend -->
    <p v-if="sesion.estadoCarga === 'sin-api' && !modoLeccion" class="sin-api">
      Modo invitado: tu progreso se guarda solo en este navegador.
    </p>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app__contenido {
  flex: 1;
}

.sin-api {
  position: fixed;
  bottom: var(--e-2);
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-full);
  padding: 0.35rem 1rem;
  box-shadow: var(--sombra-flotante);
  max-width: calc(100% - 2rem);
  text-align: center;
}
</style>
