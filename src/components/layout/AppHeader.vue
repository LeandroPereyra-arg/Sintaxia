<script setup>
import { ref } from 'vue'
import { useProgreso } from '@/composables/useProgreso.js'

const { estado } = useProgreso()
const menuAbierto = ref(false)

const enlaces = [
  { nombre: 'inicio', texto: 'Inicio' },
  { nombre: 'cursos', texto: 'Cursos' },
  { nombre: 'curso-javascript', texto: 'JavaScript' },
  { nombre: 'perfil', texto: 'Mi perfil' }
]
</script>

<template>
  <header class="cabecera">
    <div class="cabecera__interior contenedor">
      <router-link :to="{ name: 'inicio' }" class="marca" @click="menuAbierto = false">
        <span class="marca__logo" aria-hidden="true">&lt;/&gt;</span>
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
          @click="menuAbierto = false"
        >
          {{ enlace.texto }}
        </router-link>
      </nav>

      <ul class="indicadores">
        <li class="indicador indicador--racha" :title="`Racha de ${estado.racha} dias`">
          <span aria-hidden="true">🔥</span>{{ estado.racha }}
        </li>
        <li class="indicador indicador--xp" :title="`${estado.xp} puntos de experiencia`">
          <span aria-hidden="true">⚡</span>{{ estado.xp }}
        </li>
      </ul>
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
  gap: var(--e-3);
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
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  background: var(--c-verde);
  color: var(--c-blanco);
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
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
.indicador--xp {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
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

@media (max-width: 760px) {
  .cabecera__hamburguesa {
    display: flex;
    order: 3;
  }
  .indicadores {
    order: 2;
  }
  .nav {
    order: 4;
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
