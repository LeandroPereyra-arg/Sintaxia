<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import AvisoDatos from '@/components/AvisoDatos.vue'
import { useAuth } from '@/composables/useAuth.js'
import { motivoCorreoInvalido, rutaSegura } from '@/utils/validaciones.js'

/**
 * Entrada a la app: ingresar con correo y contrasena, o seguir como invitado.
 *
 * Si ya hay una sesion de INVITADO y la persona quiere entrar a una cuenta que ya
 * existe, se le advierte que su historial de invitado no se va a pasar a esa
 * cuenta (en esta primera version los historiales no se fusionan) y tiene que
 * confirmarlo. Para conservar el historial existe otro camino: crear la cuenta
 * desde el invitado (pantalla "Crear cuenta").
 */
const route = useRoute()
const router = useRouter()
const {
  estado: sesion,
  conSesion,
  esInvitado,
  esCuenta,
  hayConfig,
  iniciar,
  iniciarSesion,
  entrarComoInvitado
} = useAuth()

const correo = ref('')
const clave = ref('')
const entiendeElCambio = ref(false)
const enviando = ref(false)
const error = ref(null)
const intento = ref(false)

const volver = computed(() => rutaSegura(route.query.volver, '/perfil'))
const cargando = computed(() => sesion.estadoCarga === 'cargando')

const errorCorreo = computed(() => (intento.value ? motivoCorreoInvalido(correo.value) : ''))
const errorClave = computed(() => (intento.value && !clave.value ? 'Escribi tu contrasena.' : ''))

// Quien ya tiene una cuenta no necesita esta pantalla.
watch(
  () => [sesion.estadoCarga, esCuenta.value],
  ([carga, cuenta]) => {
    if (carga === 'listo' && cuenta && !enviando.value) router.replace(volver.value)
  },
  { immediate: true }
)
iniciar()

async function entrar() {
  intento.value = true
  error.value = null
  if (motivoCorreoInvalido(correo.value) || !clave.value) return
  if (esInvitado.value && !entiendeElCambio.value) return

  enviando.value = true
  try {
    await iniciarSesion({ correo: correo.value, clave: clave.value })
    router.push(volver.value)
  } catch (e) {
    error.value = e
  } finally {
    enviando.value = false
  }
}

async function comoInvitado() {
  error.value = null
  enviando.value = true
  try {
    if (!conSesion.value) await entrarComoInvitado()
    router.push(volver.value)
  } catch (e) {
    error.value = e
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="ingresar seccion contenedor">
    <div class="tarjeta">
      <SintaxMascota estado="saludando" :alto="120" alt="" />
      <h1>Entra a Sintaxia</h1>
      <p class="texto-secundario">
        Tu progreso, tu racha y tus medallas, guardados y a mano en cualquier dispositivo.
      </p>

      <MensajeEstado v-if="!hayConfig" tipo="alerta">
        Falta configurar la conexion con Supabase. Copia <code>.env.example</code> a
        <code>.env</code> y completa las variables.
      </MensajeEstado>

      <p v-else-if="cargando" class="texto-secundario" role="status">Un momento...</p>

      <template v-else>
        <!-- Ya hay un invitado: se avisa antes de entrar a otra cuenta -->
        <MensajeEstado v-if="esInvitado" tipo="alerta">
          <p>
            <strong>Estas usando Sintaxia como invitado.</strong> Si entras a una cuenta que ya existe,
            tu progreso de invitado <strong>no se va a pasar</strong> a esa cuenta: los historiales no se
            fusionan.
          </p>
          <p>
            Si queres conservarlo, <router-link :to="{ name: 'registro', query: route.query }">crea tu
            cuenta desde aca</router-link> en lugar de entrar a otra.
          </p>
        </MensajeEstado>

        <form class="formulario" novalidate @submit.prevent="entrar">
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
            autocomplete="current-password"
            :error="errorClave"
            :deshabilitado="enviando"
          />

          <label v-if="esInvitado" class="confirmar">
            <input v-model="entiendeElCambio" type="checkbox" :disabled="enviando" />
            <span>
              Entiendo que mi progreso de invitado no se va a pasar a la cuenta a la que entro.
            </span>
          </label>

          <MensajeEstado v-if="error" tipo="error">{{ error.message }}</MensajeEstado>

          <BaseBoton
            type="submit"
            tamano="grande"
            ancho-completo
            :deshabilitado="enviando || (esInvitado && !entiendeElCambio)"
          >
            {{ enviando ? 'Entrando...' : 'Entrar' }}
          </BaseBoton>

          <p class="enlaces">
            <router-link :to="{ name: 'recuperar' }">Olvide mi contrasena</router-link>
          </p>
        </form>

        <div class="alternativas">
          <BaseBoton variante="contorno" ancho-completo :to="{ name: 'registro', query: route.query }">
            {{ esInvitado ? 'Crear mi cuenta y conservar mi progreso' : 'Crear una cuenta' }}
          </BaseBoton>

          <BaseBoton variante="texto" :deshabilitado="enviando" @click="comoInvitado">
            {{ esInvitado ? 'Seguir como invitado' : 'Continuar como invitado' }}
            <Icono nombre="flechaDerecha" :tamano="16" />
          </BaseBoton>
        </div>

        <AvisoDatos />
      </template>
    </div>
  </div>
</template>

<style scoped>
.ingresar {
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

.confirmar {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  text-align: left;
  font-size: var(--t-sm);
  cursor: pointer;
}

.confirmar input {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 0.1rem;
  accent-color: var(--c-verde);
}

.enlaces {
  font-size: var(--t-sm);
  font-weight: 700;
}

.enlaces a,
.tarjeta :deep(a:not(.boton)) {
  color: var(--c-azul-osc);
  text-decoration: underline;
}

.alternativas {
  width: 100%;
  display: grid;
  gap: var(--e-1);
  justify-items: center;
  border-top: 2px solid var(--c-borde);
  padding-top: var(--e-3);
}

code {
  font-family: var(--f-codigo);
}
</style>
