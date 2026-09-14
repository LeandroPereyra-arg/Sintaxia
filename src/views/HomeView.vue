<script setup>
import Icono from '@/components/Icono.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import LogoSintaxia from '@/components/LogoSintaxia.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import { cursos, ESTADO_CURSO } from '@/data/cursos.js'
import { lecciones } from '@/data/lecciones/index.js'
import { useProgreso } from '@/composables/useProgreso.js'

const router = useRouter()
const { estado, progresoCurso, proximaLeccion, totalLeccionesCompletadas } = useProgreso()

const cursosDisponibles = computed(
  () => cursos.filter((curso) => curso.estado === ESTADO_CURSO.DISPONIBLE).length
)

const beneficios = [
  {
    icono: 'cerebro',
    titulo: 'Lecciones de 5 minutos',
    texto:
      'Micro-lecciones con teoria minima y practica inmediata. Aprendes haciendo, no leyendo manuales.'
  },
  {
    icono: 'joystick',
    titulo: 'Ejercicios interactivos',
    texto:
      'Opcion multiple, verdadero o falso, completar codigo y ordenar bloques: cuatro formas de fijar lo aprendido.'
  },
  {
    icono: 'llama',
    titulo: 'Rachas y XP',
    texto:
      'Cada leccion suma experiencia y mantiene viva tu racha diaria. Volver todos los dias se vuelve un habito.'
  },
  {
    icono: 'mapa',
    titulo: 'Un camino claro',
    texto:
      'Las unidades se desbloquean de a una: siempre sabes cual es tu proximo paso y cuanto te falta.'
  }
]

const pasos = [
  { numero: 1, titulo: 'Elegi un lenguaje', texto: 'Empeza por JavaScript o mira los cursos que vienen.' },
  { numero: 2, titulo: 'Resolve la leccion', texto: 'Ejercicios cortos con correccion y explicacion al instante.' },
  { numero: 3, titulo: 'Desbloquea la unidad', texto: 'Al completar todas las lecciones se abre la unidad siguiente.' }
]

function comenzar() {
  const leccion = proximaLeccion.value
  if (leccion) {
    router.push({ name: 'leccion', params: { leccionId: leccion.id } })
  } else {
    router.push({ name: 'curso-javascript' })
  }
}
</script>

<template>
  <div class="inicio">
    <!-- Portada -->
    <section class="portada">
      <div class="contenedor portada__interior">
        <div class="portada__texto">
          <LogoSintaxia variante="completo" :alto="120" alt="Sintaxia" animado class="portada__logo" />
          <p class="portada__cinta">Aprende a programar jugando</p>
          <h1>
            Un lenguaje nuevo,<br />
            <span class="resaltado">cinco minutos por dia</span>
          </h1>
          <p class="portada__bajada">
            Sintaxia convierte el estudio de la programacion en lecciones cortas, ejercicios
            interactivos y rachas diarias. Gratis, en espanol y desde cero.
          </p>

          <div class="portada__acciones">
            <BaseBoton tamano="grande" @click="comenzar">
              {{ totalLeccionesCompletadas > 0 ? 'Continuar aprendiendo' : 'Empezar ahora' }}
            </BaseBoton>
            <BaseBoton variante="contorno" tamano="grande" :to="{ name: 'cursos' }">
              Ver cursos
            </BaseBoton>
          </div>

          <ul class="portada__datos">
            <li><strong>{{ cursosDisponibles }}</strong> curso disponible</li>
            <li><strong>{{ lecciones.length }}</strong> lecciones</li>
            <li><strong>{{ cursos.length }}</strong> lenguajes en camino</li>
          </ul>
        </div>

        <!-- Sintax saluda al lado del ejemplo de ejercicio -->
        <aside class="demo" aria-label="Ejemplo de ejercicio">
          <SintaxMascota estado="saludando" :alto="110" alt="" class="demo__sintax" />
          <div class="demo__barra">
            <Icono class="demo__cerrar" nombre="cerrar" :tamano="15" />
            <BarraProgreso :valor="60" alto="10px" etiqueta="Progreso de ejemplo" />
            <span class="demo__vidas"><Icono nombre="corazon" :tamano="15" /> 3</span>
          </div>
          <p class="demo__consigna">Que palabra clave declara una constante?</p>
          <pre class="bloque-codigo">___ PI = 3.14</pre>
          <ul class="demo__opciones">
            <li>var</li>
            <li>let</li>
            <li class="demo__opciones--ok">const</li>
          </ul>
          <p class="demo__pie"><Icono nombre="checkCirculo" :tamano="17" /> Muy bien! +10 XP</p>
        </aside>
      </div>
    </section>

    <!-- Tu progreso -->
    <section v-if="totalLeccionesCompletadas > 0" class="seccion contenedor">
      <div class="progreso">
        <div>
          <h2>Hola de nuevo, {{ estado.nombre }}</h2>
          <p class="texto-secundario">
            Llevas {{ totalLeccionesCompletadas }} de {{ lecciones.length }} lecciones del curso de
            JavaScript.
          </p>
        </div>
        <div class="progreso__barra">
          <BarraProgreso :valor="progresoCurso" etiqueta="Progreso del curso de JavaScript" />
          <p class="progreso__porcentaje">{{ progresoCurso }} % completado</p>
        </div>
        <BaseBoton :to="{ name: 'curso-javascript' }">Ir al curso</BaseBoton>
      </div>
    </section>

    <!-- Por que Sintaxia -->
    <section class="seccion contenedor">
      <h2 class="centrado">Por que vas a volver todos los dias</h2>
      <p class="centrado texto-secundario subtitulo">
        La misma mecanica que funciona para los idiomas, aplicada a los lenguajes de programacion.
      </p>

      <ul class="beneficios anim-lista">
        <li v-for="beneficio in beneficios" :key="beneficio.titulo" class="beneficio">
          <Icono class="beneficio__icono" :nombre="beneficio.icono" :tamano="30" :trazo="2.1" />
          <h3>{{ beneficio.titulo }}</h3>
          <p class="texto-secundario">{{ beneficio.texto }}</p>
        </li>
      </ul>
    </section>

    <!-- Como funciona -->
    <section class="seccion pasos-seccion">
      <div class="contenedor">
        <h2 class="centrado">Como funciona</h2>
        <ol class="pasos anim-lista">
          <li v-for="paso in pasos" :key="paso.numero" class="paso">
            <span class="paso__numero">{{ paso.numero }}</span>
            <h3>{{ paso.titulo }}</h3>
            <p class="texto-secundario">{{ paso.texto }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Llamada final -->
    <section class="seccion contenedor">
      <div class="cta">
        <SintaxMascota estado="celebrando" :alto="120" alt="" />
        <h2>Tu primera leccion te espera</h2>
        <p>Empeza por las variables de JavaScript. Son cuatro ejercicios y no lleva ni 5 minutos.</p>
        <BaseBoton variante="secundario" tamano="grande" @click="comenzar">
          Empezar la leccion 1
        </BaseBoton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.portada {
  background: linear-gradient(180deg, var(--c-verde-suave), var(--c-fondo));
  padding-block: var(--e-6);
}

.portada__interior {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: var(--e-5);
  align-items: center;
}

.portada__logo {
  margin-bottom: var(--e-2);
}

.portada__cinta {
  display: inline-block;
  font-size: var(--t-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-verde-osc);
  background: var(--c-blanco);
  border: 2px solid var(--c-verde);
  border-radius: var(--r-full);
  padding: 0.25rem 0.9rem;
  margin-bottom: var(--e-2);
}

.resaltado {
  color: var(--c-verde-osc);
}

.portada__bajada {
  color: var(--c-gris);
  font-size: var(--t-md);
  max-width: 46ch;
  margin-block: var(--e-3);
}

.portada__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
}

.portada__datos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-4);
  margin-top: var(--e-4);
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.portada__datos strong {
  display: block;
  font-size: var(--t-lg);
  color: var(--c-tinta);
}

/* Mock de ejercicio */
.demo {
  position: relative;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  box-shadow: var(--sombra-flotante);
  padding: var(--e-3);
  display: flex;
  flex-direction: column;
  gap: var(--e-2);
}

.demo__sintax {
  position: absolute;
  right: -18px;
  top: -86px;
  pointer-events: none;
}

.demo__barra {
  display: flex;
  align-items: center;
  gap: var(--e-2);
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.demo__vidas {
  white-space: nowrap;
}

.demo__consigna {
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-md);
}

.demo__opciones {
  display: grid;
  gap: var(--e-1);
}

.demo__opciones li {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.55rem 0.8rem;
}

.demo__opciones--ok {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
  font-weight: 700;
}

.demo__pie {
  font-weight: 800;
  color: var(--c-verde-osc);
}

/* Progreso */
.progreso {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: var(--e-3);
  align-items: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
}

.progreso__porcentaje {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
  margin-top: 0.3rem;
}

.subtitulo {
  max-width: 60ch;
  margin: var(--e-2) auto var(--e-4);
}

/* Beneficios */
.beneficios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--e-3);
}

.beneficio {
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
}

.beneficio__icono {
  font-size: 2rem;
  display: block;
  margin-bottom: var(--e-2);
}

.beneficio h3 {
  font-size: var(--t-base);
  margin-bottom: var(--e-1);
}

.beneficio p {
  font-size: var(--t-sm);
}

/* Pasos */
.pasos-seccion {
  background: var(--c-violeta-suave);
}

.pasos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--e-3);
  margin-top: var(--e-4);
  list-style: none;
}

.paso {
  background: var(--c-blanco);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  border: 2px solid transparent;
}

.paso__numero {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--r-full);
  background: var(--c-violeta);
  color: var(--c-blanco);
  font-family: var(--f-titulo);
  font-weight: 900;
  margin-bottom: var(--e-2);
}

.paso h3 {
  font-size: var(--t-base);
  margin-bottom: var(--e-1);
}

.paso p {
  font-size: var(--t-sm);
}

/* CTA */
.cta {
  text-align: center;
  background: var(--c-noche);
  color: var(--c-blanco);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
}

.cta h2 {
  color: var(--c-blanco);
}

.cta p {
  color: #b9c4cf;
  max-width: 50ch;
}

@media (max-width: 900px) {
  .portada__interior {
    grid-template-columns: 1fr;
  }
  .progreso {
    grid-template-columns: 1fr;
  }
}
</style>
