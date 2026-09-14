<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()

/** Las lecciones se ven a pantalla completa, sin cabecera ni pie. */
const modoLeccion = computed(() => Boolean(route.meta?.ocultarNavegacion))
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
