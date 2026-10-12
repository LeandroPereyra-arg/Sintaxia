<script setup>
import { ref } from 'vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'

/**
 * Cerrar sesion.
 *
 * Para una CUENTA es inmediato: su historial queda guardado y vuelve al ingresar.
 * Para un INVITADO no: su identidad es la propia sesion, asi que al cerrarla se
 * pierde el acceso a su historial para siempre. Antes se le avisa y se le ofrece
 * crear la cuenta, que es lo que lo conserva.
 */
defineProps({
  variante: { type: String, default: 'texto' },
  tamano: { type: String, default: 'chico' }
})

const emit = defineEmits(['cerrada'])

const { esInvitado, cerrarSesion } = useAuth()

const confirmando = ref(false)
const saliendo = ref(false)
const error = ref(null)

async function salir() {
  saliendo.value = true
  error.value = null
  try {
    await cerrarSesion()
    confirmando.value = false
    emit('cerrada')
  } catch (e) {
    error.value = e
  } finally {
    saliendo.value = false
  }
}

function pedir() {
  if (esInvitado.value) confirmando.value = true
  else salir()
}
</script>

<template>
  <div class="cerrar">
    <BaseBoton v-if="!confirmando" :variante="variante" :tamano="tamano" :deshabilitado="saliendo" @click="pedir">
      <Icono nombre="salir" :tamano="16" /> Cerrar sesion
    </BaseBoton>

    <MensajeEstado v-else tipo="alerta">
      <p>
        <strong>Sos invitado: si cerras sesion perdes tu historial para siempre.</strong>
        No hay forma de recuperarlo despues.
      </p>
      <p>Creando una cuenta lo conservas.</p>
      <div class="botones">
        <BaseBoton tamano="chico" :to="{ name: 'registro' }" @click="confirmando = false">
          Crear mi cuenta
        </BaseBoton>
        <BaseBoton variante="peligro" tamano="chico" :deshabilitado="saliendo" @click="salir">
          {{ saliendo ? 'Saliendo...' : 'Salir igual' }}
        </BaseBoton>
        <BaseBoton variante="texto" tamano="chico" :deshabilitado="saliendo" @click="confirmando = false">
          Quedarme
        </BaseBoton>
      </div>
    </MensajeEstado>

    <MensajeEstado v-if="error" tipo="error">{{ error.message }}</MensajeEstado>
  </div>
</template>

<style scoped>
.cerrar {
  display: grid;
  gap: var(--e-2);
}

.botones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-1);
}
</style>
