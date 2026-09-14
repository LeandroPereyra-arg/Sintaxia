<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import { useAuth } from '@/composables/useAuth.js'
import { urlLogin } from '@/api/cliente.js'

const route = useRoute()
const router = useRouter()
const { estado: sesion, iniciar, entrarDemo, autenticado } = useAuth()

const nombreDemo = ref('Estudiante de prueba')
const entrando = ref(false)
const errorDemo = ref('')

const MENSAJES_ERROR = {
  cancelado: 'Cancelaste el inicio de sesion.',
  estado_invalido: 'La solicitud vencio o no se pudo verificar. Proba de nuevo.',
  sin_codigo: 'El proveedor no devolvio el codigo de autorizacion.',
  fallo_proveedor: 'No pudimos completar el inicio de sesion. Proba de nuevo en un rato.',
  proveedor_no_configurado: 'Ese proveedor todavia no esta configurado en el servidor.'
}

const errorUrl = computed(() => MENSAJES_ERROR[route.query.error] ?? '')
const destino = computed(() => (typeof route.query.destino === 'string' ? route.query.destino : '/perfil'))

const proveedoresVisuales = {
  google: { nombre: 'Google', clase: 'google' },
  github: { nombre: 'GitHub', clase: 'github' }
}

const disponibles = computed(() =>
  sesion.proveedores.filter((p) => p in proveedoresVisuales).map((p) => ({ id: p, ...proveedoresVisuales[p] }))
)

const hayDemo = computed(() => sesion.proveedores.includes('demo'))
const sinApi = computed(() => sesion.estadoCarga === 'sin-api')

onMounted(async () => {
  await iniciar()
  if (autenticado.value) router.replace(destino.value)
})

async function usarDemo() {
  entrando.value = true
  errorDemo.value = ''
  try {
    await entrarDemo(nombreDemo.value)
    router.push(destino.value)
  } catch (error) {
    errorDemo.value = error.message
  } finally {
    entrando.value = false
  }
}
</script>

<template>
  <div class="ingresar seccion contenedor">
    <div class="tarjeta">
      <span class="tarjeta__logo" aria-hidden="true">&lt;/&gt;</span>
      <h1>Entra a Sintaxia</h1>
      <p class="texto-secundario">
        Tu progreso, tus medallas y tu racha guardados en tu cuenta, en cualquier dispositivo.
      </p>

      <p v-if="errorUrl" class="aviso aviso--error">{{ errorUrl }}</p>

      <p v-if="sinApi" class="aviso aviso--info">
        El servidor no responde, asi que no se puede iniciar sesion ahora mismo. Igual podes
        seguir practicando: tu progreso se guarda en este navegador.
      </p>

      <!-- Proveedores reales -->
      <div v-if="disponibles.length" class="proveedores">
        <a
          v-for="proveedor in disponibles"
          :key="proveedor.id"
          class="proveedor"
          :class="`proveedor--${proveedor.clase}`"
          :href="urlLogin(proveedor.id, destino)"
        >
          <!-- Logos dibujados a mano para no depender de un CDN -->
          <svg v-if="proveedor.id === 'google'" class="proveedor__logo" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.3z"/>
            <path fill="#FBBC05" d="M10.4 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6C.9 16.7 0 20.2 0 24s.9 7.3 2.6 10.4l7.8-6z"/>
            <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.4 0-11.7-4.3-13.6-10.1l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z"/>
          </svg>
          <svg v-else class="proveedor__logo" viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Continuar con {{ proveedor.nombre }}
        </a>
      </div>

      <!-- Login de prueba, solo si el servidor lo habilito -->
      <div v-if="hayDemo" class="demo">
        <p class="demo__titulo">
          <span aria-hidden="true">🧪</span> Entrar sin OAuth (modo de prueba)
        </p>
        <p class="demo__texto">
          El servidor tiene activado el login de prueba. Escribi un nombre y entra directamente,
          sin configurar credenciales de Google ni de GitHub.
        </p>
        <div class="demo__campos">
          <input
            v-model="nombreDemo"
            type="text"
            maxlength="40"
            aria-label="Nombre para el usuario de prueba"
            @keyup.enter="usarDemo"
          />
          <BaseBoton variante="secundario" :deshabilitado="entrando" @click="usarDemo">
            {{ entrando ? 'Entrando...' : 'Entrar' }}
          </BaseBoton>
        </div>
        <p v-if="errorDemo" class="aviso aviso--error">{{ errorDemo }}</p>
      </div>

      <p v-if="!disponibles.length && !hayDemo && !sinApi" class="aviso aviso--info">
        Todavia no hay ningun proveedor configurado en el servidor. Carga las credenciales en el
        archivo <code class="codigo-inline">.env</code> y volve a levantar la API.
      </p>

      <div class="invitado">
        <p class="texto-secundario">
          Tambien podes practicar sin cuenta. Cuando entres, ese progreso se sube solo.
        </p>
        <BaseBoton variante="texto" :to="{ name: 'curso-javascript' }">
          Seguir como invitado →
        </BaseBoton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ingresar {
  display: grid;
  place-items: center;
}

.tarjeta {
  width: 100%;
  max-width: 480px;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
  text-align: center;
}

.tarjeta__logo {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: var(--r-md);
  background: var(--c-verde);
  color: var(--c-blanco);
  font-family: var(--f-codigo);
  font-weight: 700;
}

.tarjeta h1 {
  font-size: var(--t-xl);
}

.proveedores {
  width: 100%;
  display: grid;
  gap: var(--e-2);
  margin-top: var(--e-2);
}

.proveedor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-sm);
  border-radius: var(--r-md);
  padding: 0.85rem 1.2rem;
  border: 2px solid var(--c-borde);
  transition: transform 0.08s ease, filter 0.15s ease;
}

.proveedor:active {
  transform: translateY(3px);
  box-shadow: none;
}

.proveedor__logo {
  width: 20px;
  height: 20px;
}

.proveedor--google {
  background: var(--c-blanco);
  color: var(--c-tinta);
  box-shadow: 0 4px 0 var(--c-borde);
}

.proveedor--github {
  background: #1f2933;
  color: #ffffff;
  border-color: #1f2933;
  box-shadow: 0 4px 0 #0d141b;
}

.proveedor:hover {
  filter: brightness(1.04);
}

.demo {
  width: 100%;
  background: var(--c-violeta-suave);
  border: 2px dashed var(--c-violeta);
  border-radius: var(--r-md);
  padding: var(--e-3);
  display: grid;
  gap: var(--e-2);
  text-align: left;
  margin-top: var(--e-2);
}

.demo__titulo {
  font-family: var(--f-titulo);
  font-weight: 800;
  color: var(--c-violeta-osc);
}

.demo__texto {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.demo__campos {
  display: flex;
  gap: var(--e-2);
  flex-wrap: wrap;
}

.demo__campos input {
  flex: 1;
  min-width: 150px;
  font-family: inherit;
  font-size: var(--t-sm);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.5rem 0.7rem;
  background: var(--c-blanco);
}

.demo__campos input:focus {
  outline: 3px solid var(--c-violeta);
  outline-offset: 1px;
}

.aviso {
  width: 100%;
  font-size: var(--t-sm);
  border-radius: var(--r-md);
  padding: var(--e-2);
  text-align: left;
}

.aviso--error {
  background: var(--c-rojo-suave);
  color: var(--c-rojo-osc);
  border: 2px solid var(--c-rojo);
  font-weight: 700;
}

.aviso--info {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
  border: 2px solid var(--c-amarillo);
}

.invitado {
  border-top: 2px solid var(--c-borde);
  padding-top: var(--e-3);
  margin-top: var(--e-2);
  width: 100%;
  display: grid;
  gap: var(--e-1);
  justify-items: center;
}

.invitado p {
  font-size: var(--t-sm);
}
</style>
