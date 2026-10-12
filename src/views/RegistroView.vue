<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import AvisoDatos from '@/components/AvisoDatos.vue'
import { useAuth } from '@/composables/useAuth.js'
import { reenviarConfirmacion, traducirErrorAuth } from '@/servicios/auth.js'
import {
  ALIAS_MAXIMO,
  ALIAS_MINIMO,
  CLAVE_MINIMA,
  motivoAliasInvalido,
  motivoClaveInvalida,
  motivoCorreoInvalido,
  rutaSegura
} from '@/utils/validaciones.js'

/**
 * Crear una cuenta con correo y contrasena.
 *
 * Hay dos casos que se ven casi igual pero son distintos por dentro:
 *
 *   · SIN SESION  -> se registra un usuario nuevo (signUp).
 *   · COMO INVITADO -> se CONVIERTE el invitado en cuenta (updateUser). Es el mismo
 *     usuario: conserva su id y por eso su historial. No se crea otra cuenta ni se
 *     copia nada desde el cliente.
 *
 * Con la confirmacion de correo activada en Supabase, en los dos casos hay que
 * abrir el enlace que llega por correo. Hasta entonces el invitado sigue siendo
 * invitado.
 */
const route = useRoute()
const router = useRouter()
const { estado: sesion, esInvitado, esCuenta, hayConfig, iniciar, registrar, convertir, refrescar } = useAuth()

const alias = ref('')
const correo = ref('')
const clave = ref('')
const intento = ref(false)
const enviando = ref(false)
const error = ref(null)

/** Se llena cuando falta confirmar el correo: { correo, conversion } */
const pendiente = ref(null)
const reenvio = ref({ enviando: false, mensaje: '', error: null })
const verificando = ref(false)
const sinConfirmarAun = ref(false)

const volver = computed(() => rutaSegura(route.query.volver, '/perfil'))
const cargando = computed(() => sesion.estadoCarga === 'cargando')

const errorAlias = computed(() => (intento.value ? motivoAliasInvalido(alias.value) : ''))
const errorCorreo = computed(() => (intento.value ? motivoCorreoInvalido(correo.value) : ''))
const errorClave = computed(() => (intento.value ? motivoClaveInvalida(clave.value) : ''))

onMounted(async () => {
  await iniciar()
  // Quien ya tiene cuenta no necesita crear otra.
  if (esCuenta.value && !pendiente.value) router.replace(volver.value)
})

async function crear() {
  intento.value = true
  error.value = null
  if (motivoAliasInvalido(alias.value) || motivoCorreoInvalido(correo.value) || motivoClaveInvalida(clave.value)) {
    return
  }

  enviando.value = true
  try {
    const datos = { alias: alias.value, correo: correo.value, clave: clave.value }

    if (esInvitado.value) {
      const resultado = await convertir(datos)
      if (resultado.convertida) {
        router.push({ name: 'perfil', query: { cuenta: 'creada' } })
      } else {
        pendiente.value = { correo: correo.value.trim(), conversion: true }
      }
    } else {
      const resultado = await registrar(datos)
      if (resultado.confirmacionPendiente) {
        pendiente.value = { correo: correo.value.trim(), conversion: false }
      } else {
        router.push({ name: 'perfil', query: { cuenta: 'creada' } })
      }
    }
  } catch (e) {
    error.value = e
  } finally {
    enviando.value = false
  }
}

async function reenviar() {
  reenvio.value = { enviando: true, mensaje: '', error: null }
  try {
    // Un invitado que cambio de correo recibe un correo de "cambio de correo", no de registro.
    await reenviarConfirmacion({
      correo: pendiente.value.correo,
      tipo: pendiente.value.conversion ? 'email_change' : 'signup'
    })
    reenvio.value = { enviando: false, mensaje: 'Listo, te mandamos el correo de nuevo.', error: null }
  } catch (e) {
    reenvio.value = { enviando: false, mensaje: '', error: traducirErrorAuth(e) }
  }
}

/**
 * "Ya confirme mi correo": sirve cuando el enlace se abrio en otro dispositivo o
 * pestana. Se renueva la sesion para ver si el invitado ya paso a ser cuenta.
 */
async function yaConfirme() {
  verificando.value = true
  sinConfirmarAun.value = false
  try {
    await refrescar()
    if (esCuenta.value) {
      router.push({ name: 'perfil', query: { cuenta: 'creada' } })
    } else {
      sinConfirmarAun.value = true
    }
  } catch (e) {
    error.value = e
  } finally {
    verificando.value = false
  }
}

// Al volver a esta pestana (por ejemplo despues de abrir el enlace del correo en otra)
// se comprueba solo si ya se confirmo.
function alVolverALaPestana() {
  if (document.visibilityState === 'visible' && pendiente.value?.conversion && !verificando.value) {
    refrescar()
      .then(() => {
        if (esCuenta.value) router.push({ name: 'perfil', query: { cuenta: 'creada' } })
      })
      .catch(() => {})
  }
}
onMounted(() => document.addEventListener('visibilitychange', alVolverALaPestana))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', alVolverALaPestana))
</script>

<template>
  <div class="registro seccion contenedor">
    <div class="tarjeta">
      <!-- Falta confirmar el correo -->
      <template v-if="pendiente">
        <SintaxMascota estado="pensando" :alto="110" alt="" />
        <h1>Revisa tu correo</h1>
        <p>
          Te mandamos un enlace a <strong>{{ pendiente.correo }}</strong
          >. Abrilo para confirmar tu cuenta.
        </p>

        <MensajeEstado v-if="pendiente.conversion" tipo="info">
          <p>
            <strong>Seguis como invitado hasta que confirmes.</strong> Tu progreso esta a salvo y es el
            mismo: al confirmar, tu cuenta lo conserva.
          </p>
        </MensajeEstado>

        <MensajeEstado v-if="sinConfirmarAun" tipo="alerta">
          Todavia no vemos el correo confirmado. Abri el enlace y volve a probar.
        </MensajeEstado>
        <MensajeEstado v-if="reenvio.mensaje" tipo="exito">{{ reenvio.mensaje }}</MensajeEstado>
        <MensajeEstado v-if="reenvio.error" tipo="error">{{ reenvio.error.message }}</MensajeEstado>
        <MensajeEstado v-if="error" tipo="error">{{ error.message }}</MensajeEstado>

        <div class="acciones">
          <BaseBoton v-if="pendiente.conversion" ancho-completo :deshabilitado="verificando" @click="yaConfirme">
            {{ verificando ? 'Comprobando...' : 'Ya confirme mi correo' }}
          </BaseBoton>
          <BaseBoton
            variante="contorno"
            ancho-completo
            :deshabilitado="reenvio.enviando"
            @click="reenviar"
          >
            {{ reenvio.enviando ? 'Enviando...' : 'Reenviar el correo' }}
          </BaseBoton>
          <BaseBoton v-if="!pendiente.conversion" variante="texto" :to="{ name: 'ingresar' }">
            Ya confirme: ir a ingresar
          </BaseBoton>
        </div>
        <p class="nota">
          No te llega? Mira en el spam o revisa que el correo este bien escrito.
        </p>
      </template>

      <!-- Formulario -->
      <template v-else>
        <SintaxMascota estado="saludando" :alto="110" alt="" />
        <h1>{{ esInvitado ? 'Crea tu cuenta' : 'Crear una cuenta' }}</h1>

        <MensajeEstado v-if="esInvitado" tipo="exito">
          <p>
            <strong>Tu progreso se conserva.</strong> Vas a seguir siendo vos: mismo historial, misma racha,
            sin empezar de cero.
          </p>
        </MensajeEstado>
        <p v-else class="texto-secundario">
          Con una cuenta guardas tu progreso y lo ves desde cualquier dispositivo.
        </p>

        <MensajeEstado v-if="!hayConfig" tipo="alerta">
          Falta configurar la conexion con Supabase. Copia <code>.env.example</code> a
          <code>.env</code> y completa las variables.
        </MensajeEstado>

        <p v-else-if="cargando" class="texto-secundario" role="status">Un momento...</p>

        <form v-else class="formulario" novalidate @submit.prevent="crear">
          <CampoTexto
            v-model="alias"
            etiqueta="Alias"
            autocomplete="nickname"
            :maxlength="ALIAS_MAXIMO"
            :ayuda="`De ${ALIAS_MINIMO} a ${ALIAS_MAXIMO} caracteres: letras sin tilde, numeros y guion bajo. Te asignamos un codigo (como #0427) para distinguirte de quien se llame igual.`"
            :error="errorAlias"
            :deshabilitado="enviando"
          />
          <CampoTexto
            v-model="correo"
            etiqueta="Correo"
            tipo="email"
            autocomplete="email"
            placeholder="nombre@correo.com"
            :error="errorCorreo"
            :deshabilitado="enviando"
          />
          <CampoTexto
            v-model="clave"
            etiqueta="Contrasena"
            tipo="password"
            autocomplete="new-password"
            :ayuda="`Al menos ${CLAVE_MINIMA} caracteres.`"
            :error="errorClave"
            :deshabilitado="enviando"
          />

          <MensajeEstado v-if="error" tipo="error">
            <p>{{ error.message }}</p>
            <p v-if="error.codigo === 'user_already_exists' || error.codigo === 'email_exists'">
              <router-link :to="{ name: 'ingresar', query: route.query }">Iniciar sesion</router-link>
              ·
              <router-link :to="{ name: 'recuperar' }">Recuperar mi contrasena</router-link>
            </p>
          </MensajeEstado>

          <BaseBoton type="submit" tamano="grande" ancho-completo :deshabilitado="enviando">
            {{ enviando ? 'Creando...' : esInvitado ? 'Crear mi cuenta' : 'Crear cuenta' }}
          </BaseBoton>
        </form>

        <p v-if="hayConfig && !cargando" class="nota">
          Ya tenes cuenta?
          <router-link :to="{ name: 'ingresar', query: route.query }">Inicia sesion</router-link>
        </p>

        <AvisoDatos v-if="hayConfig && !cargando" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.registro {
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

.formulario,
.acciones {
  width: 100%;
  display: grid;
  gap: var(--e-3);
}

.nota {
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.tarjeta :deep(a:not(.boton)) {
  color: var(--c-azul-osc);
  font-weight: 700;
  text-decoration: underline;
}

code {
  font-family: var(--f-codigo);
}
</style>
