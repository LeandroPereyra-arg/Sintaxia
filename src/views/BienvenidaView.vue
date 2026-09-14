<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Carrusel from '@/components/Carrusel.vue'
import Icono from '@/components/Icono.vue'
import BaseBoton from '@/components/BaseBoton.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { pasosBienvenida } from '@/data/bienvenida.js'
import { useAuth } from '@/composables/useAuth.js'
import { urlLogin } from '@/api/cliente.js'
import { marcarBienvenidaVista } from '@/composables/useBienvenida.js'

/**
 * Pantalla de bienvenida, como la primera vez que abris una app del celular:
 * unas pocas diapositivas que cuentan de que se trata y, al final, entrar con
 * una cuenta o seguir como invitado.
 *
 * Se muestra sola la primera vez y se puede volver a ver desde el pie.
 */
const router = useRouter()
const { estado: sesion, iniciar, entrarDemo } = useAuth()

const carrusel = ref(null)
const pasoActual = ref(0)
const entrando = ref(false)
const error = ref('')

/** Hay un paso mas que los del carrusel: el de las acciones finales. */
const totalPasos = computed(() => pasosBienvenida.length + 1)
const enUltimo = computed(() => pasoActual.value === totalPasos.value - 1)

const proveedoresVisuales = { google: 'Google', github: 'GitHub' }
const disponibles = computed(() =>
  sesion.proveedores
    .filter((p) => p in proveedoresVisuales)
    .map((p) => ({ id: p, nombre: proveedoresVisuales[p] }))
)
const hayDemo = computed(() => sesion.proveedores.includes('demo'))

onMounted(iniciar)

function siguiente() {
  carrusel.value?.siguiente()
}

function terminar(destino) {
  marcarBienvenidaVista()
  router.push(destino)
}

function comoInvitado() {
  terminar({ name: 'curso-javascript' })
}

function saltear() {
  terminar({ name: 'inicio' })
}

/** El login con proveedor se va del sitio, asi que se marca antes de salir. */
function irAProveedor(id) {
  marcarBienvenidaVista()
  window.location.href = urlLogin(id, '/perfil')
}

async function probarDemo() {
  entrando.value = true
  error.value = ''
  try {
    await entrarDemo('Estudiante de prueba')
    terminar({ name: 'perfil' })
  } catch (e) {
    error.value = e.message
  } finally {
    entrando.value = false
  }
}
</script>

<template>
  <div class="bienvenida">
    <!-- Marco tipo telefono: en el escritorio la pantalla se ve como en el celular -->
    <div class="telefono">
      <header class="telefono__barra">
        <p class="progreso" aria-hidden="true">
          <span
            v-for="n in totalPasos"
            :key="n"
            class="progreso__tramo"
            :class="{ 'progreso__tramo--hecho': pasoActual >= n - 1 }"
          />
        </p>
        <button v-if="!enUltimo" type="button" class="saltar" @click="saltear">Saltar</button>
      </header>

      <Carrusel
        ref="carrusel"
        class="telefono__carrusel"
        :cantidad="totalPasos"
        :flechas="false"
        :puntos="false"
        etiqueta="Presentacion de Sintaxia"
        @cambio="pasoActual = $event"
      >
        <!-- Pasos que cuentan de que se trata -->
        <section
          v-for="paso in pasosBienvenida"
          :key="paso.id"
          class="paso"
          :style="{ '--color-paso': paso.color }"
        >
          <div class="paso__escena">
            <span class="paso__halo" aria-hidden="true" />
            <SintaxMascota :estado="paso.sintax" :alto="190" alt="" />
          </div>
          <Icono class="paso__icono" :nombre="paso.icono" :tamano="30" :trazo="2.1" />
          <h2 class="paso__titulo">{{ paso.titulo }}</h2>
          <p class="paso__texto">{{ paso.texto }}</p>
        </section>

        <!-- Paso final: entrar o seguir sin cuenta -->
        <section class="paso paso--final">
          <div class="paso__escena">
            <span class="paso__halo" aria-hidden="true" />
            <SintaxMascota estado="celebrando" :alto="170" alt="" />
          </div>
          <h2 class="paso__titulo">Empecemos</h2>
          <p class="paso__texto">
            Con una cuenta guardas tu progreso y competis en el ranking. Tambien podes probar
            sin registrarte.
          </p>

          <div class="acciones">
            <a
              v-for="proveedor in disponibles"
              :key="proveedor.id"
              class="proveedor"
              :class="`proveedor--${proveedor.id}`"
              :href="urlLogin(proveedor.id, '/perfil')"
              @click.prevent="irAProveedor(proveedor.id)"
            >
              <Icono :nombre="proveedor.id" :tamano="19" :trazo="0" />
              Continuar con {{ proveedor.nombre }}
            </a>

            <BaseBoton
              v-if="hayDemo"
              variante="secundario"
              ancho-completo
              :deshabilitado="entrando"
              @click="probarDemo"
            >
              {{ entrando ? 'Entrando...' : 'Entrar con el modo de prueba' }}
            </BaseBoton>

            <button type="button" class="invitado" @click="comoInvitado">
              Seguir como invitado
            </button>

            <p v-if="error" class="error">{{ error }}</p>
          </div>
        </section>
      </Carrusel>

      <!-- Pie fijo: en el celular el pulgar llega comodo hasta aca -->
      <footer v-if="!enUltimo" class="telefono__pie">
        <BaseBoton tamano="grande" ancho-completo @click="siguiente">
          {{ pasoActual === totalPasos - 2 ? 'Empecemos' : 'Siguiente' }}
        </BaseBoton>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.bienvenida {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, var(--c-verde-suave), var(--c-fondo) 55%);
  padding: var(--e-3);
  /* Respeta la muesca y la barra de gestos del telefono. */
  padding-top: max(var(--e-3), env(safe-area-inset-top));
  padding-bottom: max(var(--e-3), env(safe-area-inset-bottom));
}

/* En el escritorio se ve encuadrado como una pantalla de celular. */
.telefono {
  width: 100%;
  max-width: 420px;
  min-height: min(760px, 100dvh - 2rem);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--e-3);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  box-shadow: var(--sombra-flotante);
  padding: var(--e-3);
  overflow: hidden;
}

/* ---------- Barra de progreso tipo historias ---------- */
.telefono__barra {
  display: flex;
  align-items: center;
  gap: var(--e-2);
}

.progreso {
  display: flex;
  gap: 4px;
  flex: 1;
}

.progreso__tramo {
  flex: 1;
  height: 4px;
  border-radius: var(--r-full);
  background: var(--c-borde);
  transition: background 0.3s ease;
}

.progreso__tramo--hecho {
  background: var(--c-verde);
}

.saltar {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
  padding: 0.3rem 0.6rem;
  border-radius: var(--r-sm);
}

.saltar:hover {
  color: var(--c-tinta);
  background: var(--c-fondo);
}

.telefono__carrusel {
  min-height: 0;
}

/* ---------- Cada diapositiva ---------- */
.paso {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--e-2);
  padding-inline: var(--e-2);
}

.paso__escena {
  position: relative;
  display: grid;
  place-items: center;
  margin-bottom: var(--e-2);
}

/* Circulo de color detras de Sintax: da profundidad y cambia por paso. */
.paso__halo {
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: var(--color-paso);
  opacity: 0.14;
  animation: halo-late 4s ease-in-out infinite;
}

.paso__icono {
  color: var(--color-paso);
}

.paso__titulo {
  font-size: var(--t-xl);
  line-height: 1.15;
}

.paso__texto {
  color: var(--c-gris);
  max-width: 32ch;
}

@keyframes halo-late {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .paso__halo {
    animation: none;
  }
}

/* ---------- Paso final ---------- */
.paso--final {
  --color-paso: var(--c-verde);
}

.acciones {
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
  padding: 0.9rem 1.2rem;
  border: 2px solid var(--c-borde);
  transition: transform 0.08s ease, filter 0.15s ease;
}

.proveedor:active {
  transform: translateY(3px);
  box-shadow: none;
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

.invitado {
  font-family: var(--f-titulo);
  font-weight: 700;
  font-size: var(--t-sm);
  color: var(--c-gris);
  padding: 0.7rem;
  border-radius: var(--r-md);
}

.invitado:hover {
  color: var(--c-tinta);
  background: var(--c-fondo);
}

.error {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-rojo-osc);
}

.telefono__pie {
  padding-top: var(--e-1);
}

/* A pantalla completa en el celular: se aprovecha todo el alto. */
@media (max-width: 520px) {
  .bienvenida {
    padding: 0;
  }
  .telefono {
    max-width: none;
    min-height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: var(--e-3);
    padding-top: max(var(--e-3), env(safe-area-inset-top));
    padding-bottom: max(var(--e-3), env(safe-area-inset-bottom));
  }
}
</style>
