<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'
import { CLAVE_MINIMA, motivoClaveInvalida } from '@/utils/validaciones.js'

/**
 * Elegir una contrasena nueva. A esta pantalla se llega desde el enlace del correo
 * de "olvide mi contrasena".
 *
 * Hay tres situaciones:
 *   · SIN SESION: el enlace no sirvio (vencio, ya se uso, o se abrio en otro
 *     dispositivo, donde el codigo de un solo uso no vale). Se explica y se ofrece
 *     pedir otro.
 *   · INVITADO: los invitados no tienen contrasena. Se les ofrece crear la cuenta.
 *   · CUENTA: se elige la contrasena nueva.
 */
const router = useRouter()
const { estado: sesion, conSesion, esInvitado, iniciar, cambiarClave } = useAuth()

const clave = ref('')
const repetida = ref('')
const intento = ref(false)
const enviando = ref(false)
const error = ref(null)
const listo = ref(false)

const cargando = computed(() => sesion.estadoCarga === 'cargando')
const errorClave = computed(() => (intento.value ? motivoClaveInvalida(clave.value) : ''))
const errorRepetida = computed(() =>
  intento.value && clave.value !== repetida.value ? 'Las dos contrasenas tienen que ser iguales.' : ''
)

onMounted(iniciar)

async function guardar() {
  intento.value = true
  error.value = null
  if (motivoClaveInvalida(clave.value) || clave.value !== repetida.value) return

  enviando.value = true
  try {
    await cambiarClave(clave.value)
    listo.value = true
  } catch (e) {
    error.value = e
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="nueva seccion contenedor">
    <div class="tarjeta">
      <p v-if="cargando" class="texto-secundario" role="status">Un momento...</p>

      <!-- Listo -->
      <template v-else-if="listo">
        <SintaxMascota estado="celebrando" :alto="110" alt="" />
        <h1>Contrasena cambiada</h1>
        <MensajeEstado tipo="exito">Listo: ya podes ingresar con tu contrasena nueva.</MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo @click="router.push({ name: 'perfil' })">
          Ir a mi perfil
        </BaseBoton>
      </template>

      <!-- El enlace no sirvio -->
      <template v-else-if="!conSesion">
        <SintaxMascota estado="confundido" :alto="110" alt="" />
        <h1>Este enlace no sirve</h1>
        <MensajeEstado tipo="alerta">
          <p>Puede que haya vencido, que ya lo hayas usado, o que lo hayas abierto en otro dispositivo.</p>
          <p>
            Por seguridad, el enlace solo funciona en el <strong>mismo dispositivo y navegador</strong> desde
            donde lo pediste.
          </p>
        </MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo :to="{ name: 'recuperar' }">Pedir un enlace nuevo</BaseBoton>
        <BaseBoton variante="texto" :to="{ name: 'ingresar' }">Volver a ingresar</BaseBoton>
      </template>

      <!-- Un invitado no tiene contrasena -->
      <template v-else-if="esInvitado">
        <SintaxMascota estado="pensando" :alto="110" alt="" />
        <h1>Los invitados no tienen contrasena</h1>
        <p class="texto-secundario">
          Para tener una contrasena primero hay que crear una cuenta. Tu progreso se conserva.
        </p>
        <BaseBoton tamano="grande" ancho-completo :to="{ name: 'registro' }">Crear mi cuenta</BaseBoton>
      </template>

      <!-- Elegir la contrasena -->
      <template v-else>
        <SintaxMascota estado="normal" :alto="110" alt="" />
        <h1>{{ sesion.enRecuperacion ? 'Elegi tu contrasena nueva' : 'Cambiar mi contrasena' }}</h1>

        <form class="formulario" novalidate @submit.prevent="guardar">
          <CampoTexto
            v-model="clave"
            etiqueta="Contrasena nueva"
            tipo="password"
            autocomplete="new-password"
            :ayuda="`Al menos ${CLAVE_MINIMA} caracteres.`"
            :error="errorClave"
            :deshabilitado="enviando"
          />
          <CampoTexto
            v-model="repetida"
            etiqueta="Repetila"
            tipo="password"
            autocomplete="new-password"
            :error="errorRepetida"
            :deshabilitado="enviando"
          />

          <MensajeEstado v-if="error" tipo="error">{{ error.message }}</MensajeEstado>

          <BaseBoton type="submit" tamano="grande" ancho-completo :deshabilitado="enviando">
            {{ enviando ? 'Guardando...' : 'Guardar contrasena' }}
          </BaseBoton>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.nueva {
  display: grid;
  place-items: start center;
}

.tarjeta {
  animation: escalar-entrando var(--anim-media) var(--anim-rebote) both;
  width: 100%;
  max-width: 480px;
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

.formulario {
  width: 100%;
  display: grid;
  gap: var(--e-3);
}
</style>
