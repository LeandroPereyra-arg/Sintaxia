<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuth } from '@/composables/useAuth.js'

const route = useRoute()
const { iniciar } = useAuth()

/** Las lecciones se ven a pantalla completa, sin cabecera ni pie. */
const modoLeccion = computed(() => Boolean(route.meta?.ocultarNavegacion))

// Restaura la sesion guardada en el dispositivo. El router tambien la espera antes
// de entrar a una ruta protegida; llamarla de nuevo no hace nada.
onMounted(iniciar)
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
</style>
