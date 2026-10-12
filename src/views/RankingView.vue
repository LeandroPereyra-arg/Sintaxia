<script setup>
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { useAuth } from '@/composables/useAuth.js'

/**
 * Ranking semanal.
 *
 * Todavia no esta disponible. Un ranking necesita mostrar datos de OTRAS personas
 * (su alias y su XP), y desde la etapa 4 las politicas de la base impiden a
 * proposito que alguien lea datos ajenos. Cuando llegue la etapa de la
 * competencia se va a publicar una vista controlada con lo unico que puede verse:
 * alias con codigo y XP de la semana, solo de cuentas permanentes.
 */
const { esInvitado, conSesion } = useAuth()
</script>

<template>
  <div class="ranking seccion contenedor">
    <div class="tarjeta">
      <SintaxMascota estado="pensando" :alto="120" alt="" />
      <h1>El ranking esta en camino</h1>
      <p class="texto-secundario">
        Va a llegar junto con la competencia. Vas a poder ver tu posicion de la semana contra otras
        personas.
      </p>

      <ul class="reglas">
        <li>
          <Icono nombre="escudo" :tamano="18" />
          <span>
            Se va a mostrar <strong>solo tu alias con un codigo</strong> (por ejemplo
            <code>Ana#0427</code>) y tu XP de la semana. Nunca tu correo ni tu historial.
          </span>
        </li>
        <li>
          <Icono nombre="usuario" :tamano="18" />
          <span>Solo van a participar las <strong>cuentas</strong>: los invitados no aparecen.</span>
        </li>
      </ul>

      <BaseBoton v-if="conSesion && esInvitado" :to="{ name: 'registro' }">
        Crear mi cuenta para participar
      </BaseBoton>
      <BaseBoton v-else-if="!conSesion" :to="{ name: 'ingresar', query: { volver: '/ranking' } }">
        Ingresar
      </BaseBoton>
    </div>
  </div>
</template>

<style scoped>
.ranking {
  display: grid;
  place-items: start center;
}

.tarjeta {
  width: 100%;
  max-width: 520px;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-3);
  justify-items: center;
  text-align: center;
}

.tarjeta h1 {
  font-size: var(--t-xl);
}

.reglas {
  display: grid;
  gap: var(--e-2);
  text-align: left;
  font-size: var(--t-sm);
  width: 100%;
}

.reglas li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.reglas :deep(svg) {
  flex: none;
  color: var(--c-violeta);
  margin-top: 0.15rem;
}

code {
  font-family: var(--f-codigo);
  background: var(--c-fondo);
  padding: 0 0.3rem;
  border-radius: 4px;
}
</style>
