<script setup>
import LogoSintaxia from '@/components/LogoSintaxia.vue'

const anio = new Date().getFullYear()
</script>

<template>
  <footer class="pie">
    <div class="contenedor pie__interior">
      <p class="pie__marca">
        <LogoSintaxia variante="icono" :alto="26" alt="" />
        <span><strong>Sintaxia</strong> · Aprende a programar jugando</span>
      </p>
      <p class="texto-secundario">
        <router-link :to="{ name: 'bienvenida' }" class="pie__enlace">Ver la presentacion</router-link>
        · Proyecto academico con Vue 3 y Vue Router · {{ anio }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.pie {
  margin-top: auto;
  border-top: 2px solid var(--c-borde);
  background: var(--c-blanco);
  padding-block: var(--e-4);
  font-size: var(--t-sm);
}

.pie__interior {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: space-between;
  align-items: center;
}

.pie__enlace:hover {
  color: var(--c-verde-osc);
  text-decoration: underline;
}

.pie__marca {
  font-family: var(--f-titulo);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
</style>
