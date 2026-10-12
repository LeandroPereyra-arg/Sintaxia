<script setup>
import { computed, ref } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'
import { motivoCorreoInvalido } from '@/utils/validaciones.js'

/**
 * "Olvide mi contrasena": se pide el correo y Supabase manda un enlace para elegir
 * una nueva.
 *
 * La respuesta es siempre la misma, tenga o no cuenta ese correo: asi nadie puede
 * usar esta pantalla para averiguar quien esta registrado.
 */
const { hayConfig, pedirRecuperacion } = useAuth()

const correo = ref('')
const intento = ref(false)
const enviando = ref(false)
const enviado = ref(false)
const error = ref(null)

const errorCorreo = computed(() => (intento.value ? motivoCorreoInvalido(correo.value) : ''))

async function enviar() {
  intento.value = true
  error.value = null
  if (motivoCorreoInvalido(correo.value)) return

  enviando.value = true
  try {
    await pedirRecuperacion(correo.value)
    enviado.value = true
  } catch (e) {
    error.value = e
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="recuperar seccion contenedor">
    <div class="tarjeta">
      <SintaxMascota :estado="enviado ? 'normal' : 'pensando'" :alto="110" alt="" />
      <h1>Recuperar mi contrasena</h1>

      <template v-if="enviado">
        <MensajeEstado tipo="exito">
          <p>
            Si <strong>{{ correo.trim() }}</strong> tiene una cuenta, te mandamos un enlace para elegir una
            contrasena nueva.
          </p>
        </MensajeEstado>
        <p class="nota">
          Abrilo desde <strong>este mismo dispositivo y navegador</strong>. Si no te llega, mira en el
          spam o proba de nuevo en un minuto.
        </p>
        <BaseBoton variante="contorno" ancho-completo :to="{ name: 'ingresar' }">Volver a ingresar</BaseBoton>
      </template>

      <template v-else>
        <p class="texto-secundario">
          Escribi el correo de tu cuenta y te mandamos un enlace para elegir una contrasena nueva.
        </p>

        <MensajeEstado v-if="!hayConfig" tipo="alerta">
          Falta configurar la conexion con Supabase. Copia <code>.env.example</code> a
          <code>.env</code>.
        </MensajeEstado>

        <form v-else class="formulario" novalidate @submit.prevent="enviar">
          <CampoTexto
            v-model="correo"
            etiqueta="Correo"
            tipo="email"
            autocomplete="email"
            placeholder="nombre@correo.com"
            :error="errorCorreo"
            :deshabilitado="enviando"
          />

          <MensajeEstado v-if="error" tipo="error">{{ error.message }}</MensajeEstado>

          <BaseBoton type="submit" tamano="grande" ancho-completo :deshabilitado="enviando">
            {{ enviando ? 'Enviando...' : 'Mandar el enlace' }}
          </BaseBoton>
          <BaseBoton variante="texto" :to="{ name: 'ingresar' }">Volver</BaseBoton>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.recuperar {
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

.nota {
  font-size: var(--t-sm);
  color: var(--c-gris);
}

code {
  font-family: var(--f-codigo);
}
</style>
