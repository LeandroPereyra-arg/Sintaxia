<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import { useAuth } from '@/composables/useAuth.js'
import { rutaSegura } from '@/utils/validaciones.js'

/**
 * A donde vuelve el enlace de un correo: confirmar la cuenta, confirmar el correo
 * de un invitado que se convierte en cuenta, o cambiar el correo.
 *
 * Cuando esta pantalla se abre, el cliente de Supabase ya canjeo el codigo de la
 * direccion por una sesion (el router espera ese paso). Aca solo se mira el
 * resultado y se le cuenta a la persona que paso.
 *
 * Supabase avisa los fallos con parametros en la direccion (error_code,
 * error_description), a veces en el "?" y a veces en el "#".
 */
const route = useRoute()
const router = useRouter()
const { estado: sesion, conSesion, esCuenta, etiqueta, iniciar } = useAuth()

const listo = ref(false)

const MENSAJES = {
  otp_expired: 'El enlace vencio o ya se uso. Pedi uno nuevo.',
  access_denied: 'El enlace no es valido o ya se uso. Pedi uno nuevo.',
  flow_state_not_found:
    'Este enlace hay que abrirlo en el mismo dispositivo y navegador donde lo pediste.'
}

/** Parametros de la direccion, tanto del "?" como del "#". */
const parametros = computed(() => {
  const consulta = new URLSearchParams(window.location.search)
  const fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const leer = (nombre) => consulta.get(nombre) ?? fragmento.get(nombre)
  return {
    codigoDeError: leer('error_code') ?? leer('error'),
    descripcion: leer('error_description'),
    hayCodigo: consulta.has('code')
  }
})

const errorDelEnlace = computed(() => {
  const { codigoDeError, descripcion } = parametros.value
  if (!codigoDeError) return ''
  return MENSAJES[codigoDeError] ?? descripcion?.replace(/\+/g, ' ') ?? 'El enlace no es valido.'
})

const volver = computed(() => rutaSegura(route.query.volver, '/perfil'))

onMounted(async () => {
  await iniciar()
  listo.value = true
})
</script>

<template>
  <div class="retorno seccion contenedor">
    <div class="tarjeta">
      <p v-if="!listo || sesion.estadoCarga === 'cargando'" class="texto-secundario" role="status">
        Confirmando...
      </p>

      <!-- El enlace fallo -->
      <template v-else-if="errorDelEnlace">
        <SintaxMascota estado="confundido" :alto="110" alt="" />
        <h1>No pudimos confirmar</h1>
        <MensajeEstado tipo="error">{{ errorDelEnlace }}</MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo :to="{ name: 'ingresar' }">Ir a ingresar</BaseBoton>
      </template>

      <!-- Sesion abierta como cuenta: todo salio bien -->
      <template v-else-if="esCuenta">
        <SintaxMascota estado="celebrando" :alto="110" alt="" />
        <h1>Listo, tu cuenta esta confirmada</h1>
        <MensajeEstado tipo="exito">
          Ya sos <strong>{{ etiqueta }}</strong
          >. Tu progreso queda guardado en tu cuenta.
        </MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo @click="router.replace(volver)">Continuar</BaseBoton>
      </template>

      <!-- Hay sesion pero sigue como invitado: todavia no se confirmo -->
      <template v-else-if="conSesion">
        <SintaxMascota estado="pensando" :alto="110" alt="" />
        <h1>Seguis como invitado</h1>
        <MensajeEstado tipo="info">
          Todavia no vemos tu correo confirmado. Abri el enlace que te mandamos o volve a pedirlo.
        </MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo :to="{ name: 'registro' }">Volver a crear mi cuenta</BaseBoton>
      </template>

      <!-- Sin sesion: se confirmo, pero hay que ingresar -->
      <template v-else>
        <SintaxMascota estado="normal" :alto="110" alt="" />
        <h1>{{ parametros.hayCodigo ? 'Tu correo esta confirmado' : 'No hay nada para confirmar' }}</h1>
        <MensajeEstado v-if="parametros.hayCodigo" tipo="exito">
          <p>
            Ya podes ingresar con tu correo y tu contrasena.
          </p>
          <p>
            Como abriste el enlace en un dispositivo distinto del que usaste para pedirlo, la sesion no se
            abre sola.
          </p>
        </MensajeEstado>
        <MensajeEstado v-else tipo="info">Este enlace ya se uso o no trae nada para confirmar.</MensajeEstado>
        <BaseBoton tamano="grande" ancho-completo :to="{ name: 'ingresar' }">Ingresar</BaseBoton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.retorno {
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
</style>
