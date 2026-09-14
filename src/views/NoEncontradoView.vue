<script setup>
import BaseBoton from '@/components/BaseBoton.vue'
import LogoSintaxia from '@/components/LogoSintaxia.vue'
</script>

<template>
  <div class="error seccion contenedor centrado">
    <LogoSintaxia variante="icono" :alto="88" alt="" animado />
    <pre class="bloque-codigo error__codigo">throw new Error("404: pagina no encontrada")</pre>
    <h1>Esta ruta no existe</h1>
    <p class="texto-secundario">
      El enlace puede estar mal escrito o la pagina se movio. Volve al inicio y segui aprendiendo.
    </p>
    <div class="error__acciones">
      <BaseBoton :to="{ name: 'inicio' }">Ir al inicio</BaseBoton>
      <BaseBoton variante="contorno" :to="{ name: 'cursos' }">Ver cursos</BaseBoton>
    </div>
  </div>
</template>

<style scoped>
.error {
  display: grid;
  gap: var(--e-3);
  justify-items: center;
  padding-block: var(--e-6);
}

.error__codigo {
  display: inline-block;
  text-align: left;
}

.error__acciones {
  display: flex;
  gap: var(--e-2);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
