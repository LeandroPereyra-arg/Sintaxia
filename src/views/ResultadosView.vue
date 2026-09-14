<script setup>
import Icono from '@/components/Icono.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import MedallaCard from '@/components/MedallaCard.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import { useContador } from '@/composables/useContador.js'
import { obtenerLeccion, leccionesDeUnidad } from '@/data/lecciones/index.js'
import { obtenerUnidad } from '@/data/unidades.js'
import { useProgreso } from '@/composables/useProgreso.js'

/** Pantalla de cierre de una leccion: puntaje, XP ganado y que sigue. */
const props = defineProps({
  leccionId: { type: String, required: true }
})

const route = useRoute()
const router = useRouter()
const { estado, progresoUnidad, unidadCompletada, ultimoResultado } = useProgreso()

const leccion = computed(() => obtenerLeccion(props.leccionId))
const unidad = computed(() => (leccion.value ? obtenerUnidad(leccion.value.unidadId) : null))

const total = computed(() => Number(route.query.total ?? leccion.value?.ejercicios.length ?? 0))
const aciertos = computed(() => Number(route.query.aciertos ?? 0))
const xpGanado = computed(() => Number(route.query.xp ?? 0))
const vidas = computed(() => Number(route.query.vidas ?? 0))

const porcentaje = computed(() =>
  total.value === 0 ? 0 : Math.round((aciertos.value / total.value) * 100)
)

const sinVidas = computed(() => vidas.value <= 0)

/** Sintax reacciona segun como te fue. */
const animoSintax = computed(() => {
  if (sinVidas.value) return 'enojado'
  if (porcentaje.value === 100) return 'celebrando'
  if (porcentaje.value >= 60) return 'normal'
  return 'confundido'
})

const xpAnimado = useContador(xpGanado)
const aciertosAnimados = useContador(aciertos, { duracion: 700 })
const porcentajeAnimado = useContador(porcentaje, { duracion: 700 })

const mensaje = computed(() => {
  if (sinVidas.value) return { icono: 'corazonRoto', titulo: 'Te quedaste sin vidas', texto: 'La leccion no quedo completada y no suma XP. Volve a intentarlo: ahora ya sabes las respuestas.' }
  if (porcentaje.value === 100) return { icono: 'trofeo', titulo: 'Leccion perfecta!', texto: 'Respondiste todo bien. Asi se aprende a programar.' }
  if (porcentaje.value >= 60) return { icono: 'chispas', titulo: 'Leccion completada!', texto: 'Muy buen trabajo. Repasa lo que fallaste y segui avanzando.' }
  return { icono: 'pesa', titulo: 'Leccion terminada', texto: 'Te costo un poco: repetir la leccion es la mejor forma de fijarlo.' }
})

/** Siguiente leccion de la misma unidad, si queda alguna. */
const siguienteLeccion = computed(() => {
  if (!leccion.value) return null
  const hermanas = leccionesDeUnidad(leccion.value.unidadId)
  const pos = hermanas.findIndex((l) => l.id === leccion.value.id)
  return hermanas[pos + 1] ?? null
})

const unidadTerminada = computed(() => (unidad.value ? unidadCompletada(unidad.value.id) : false))

/** Medallas desbloqueadas justo en esta leccion (las otorga el servidor). */
const medallasNuevas = computed(() => {
  const ultimo = ultimoResultado.value
  if (!ultimo || ultimo.leccionId !== props.leccionId) return []
  return (ultimo.medallasNuevas ?? []).map((m) => ({
    codigo: m.codigo,
    nombre: m.nombre,
    descripcion: m.descripcion,
    icono: m.icono,
    nivel: m.nivel,
    obtenida: true,
    obtenidaEn: null,
    progreso: { actual: 1, objetivo: 1 }
  }))
})

function repetir() {
  router.push({ name: 'leccion', params: { leccionId: props.leccionId } })
}

function siguiente() {
  if (siguienteLeccion.value) {
    router.push({ name: 'leccion', params: { leccionId: siguienteLeccion.value.id } })
  } else {
    router.push({ name: 'curso-javascript' })
  }
}
</script>

<template>
  <div class="resultados seccion contenedor">
    <div v-if="leccion" class="tarjeta">
      <SintaxMascota :estado="animoSintax" :alto="130" alt="" class="tarjeta__sintax" />
      <Icono class="tarjeta__icono" :nombre="mensaje.icono" :tamano="46" :trazo="1.8" />
      <h1>{{ mensaje.titulo }}</h1>
      <p class="texto-secundario">{{ mensaje.texto }}</p>
      <p class="tarjeta__leccion">{{ leccion.titulo }}</p>

      <ul class="marcadores">
        <li class="marcador marcador--xp">
          <span class="marcador__valor">+{{ xpAnimado }}</span>
          <span class="marcador__texto">XP ganados</span>
        </li>
        <li class="marcador marcador--acierto">
          <span class="marcador__valor">{{ aciertosAnimados }}/{{ total }}</span>
          <span class="marcador__texto">Respuestas correctas</span>
        </li>
        <li class="marcador marcador--precision">
          <span class="marcador__valor">{{ porcentajeAnimado }} %</span>
          <span class="marcador__texto">Precision</span>
        </li>
        <li class="marcador marcador--racha">
          <span class="marcador__valor">{{ estado.racha }}</span>
          <span class="marcador__texto">Dias de racha</span>
        </li>
      </ul>

      <section v-if="medallasNuevas.length" class="medallas-nuevas">
        <p class="medallas-nuevas__titulo">
          {{ medallasNuevas.length === 1 ? 'Desbloqueaste una medalla!' : 'Desbloqueaste medallas!' }}
        </p>
        <ul class="medallas-nuevas__lista">
          <li v-for="medalla in medallasNuevas" :key="medalla.codigo">
            <MedallaCard :medalla="medalla" nueva />
          </li>
        </ul>
      </section>

      <div v-if="unidad" class="unidad">
        <p class="unidad__titulo">
          Unidad {{ unidad.numero }} · {{ unidad.titulo }}
          <strong>{{ progresoUnidad(unidad.id) }} %</strong>
        </p>
        <BarraProgreso
          :valor="progresoUnidad(unidad.id)"
          :color="unidad.color"
          :etiqueta="`Progreso de la unidad ${unidad.numero}`"
        />
        <p v-if="unidadTerminada" class="unidad__logro">
          <Icono nombre="medalla" :tamano="17" /> Desbloqueaste la unidad siguiente. Segui asi!
        </p>
      </div>

      <div class="acciones">
        <BaseBoton variante="contorno" @click="repetir">Repetir leccion</BaseBoton>
        <BaseBoton v-if="!sinVidas" @click="siguiente">
          {{ siguienteLeccion ? 'Siguiente leccion' : 'Volver al curso' }}
        </BaseBoton>
        <BaseBoton v-else variante="secundario" :to="{ name: 'curso-javascript' }">
          Volver al curso
        </BaseBoton>
      </div>

      <p class="pie-nota">
        <router-link :to="{ name: 'perfil' }">
          Ver mi progreso completo <Icono nombre="flechaDerecha" :tamano="15" />
        </router-link>
      </p>
    </div>

    <p v-else class="centrado">No encontramos los resultados de esa leccion.</p>
  </div>
</template>

<style scoped>
.tarjeta {
  animation: escalar-entrando var(--anim-media) var(--anim-rebote) both;
  max-width: 640px;
  margin-inline: auto;
  text-align: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-5) var(--e-3);
  display: grid;
  gap: var(--e-2);
  justify-items: center;
}

.tarjeta__sintax {
  margin-bottom: calc(var(--e-2) * -1);
}

.tarjeta__icono {
  animation: latido var(--anim-lenta) var(--anim-rebote);
  color: var(--c-verde-osc);
}

.tarjeta__leccion {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  background: var(--c-fondo);
  border-radius: var(--r-sm);
  padding: 0.25rem 0.75rem;
  color: var(--c-gris);
}

.marcadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--e-2);
  width: 100%;
  margin-block: var(--e-3);
}

.marcador {
  display: grid;
  gap: 0.2rem;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-2);
}

.marcador__valor {
  font-family: var(--f-titulo);
  font-weight: 900;
  font-size: var(--t-lg);
  font-variant-numeric: tabular-nums;
}

.marcador__texto {
  font-size: var(--t-xs);
  color: var(--c-gris);
  font-weight: 700;
}

.marcador--xp {
  border-color: var(--c-amarillo);
  background: var(--c-amarillo-suave);
}
.marcador--acierto {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
}
.marcador--precision {
  border-color: var(--c-azul);
  background: var(--c-azul-suave);
}
.marcador--racha {
  border-color: var(--c-rojo);
  background: var(--c-rojo-suave);
}

.medallas-nuevas {
  width: 100%;
  background: var(--c-amarillo-suave);
  border: 2px solid var(--c-amarillo);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  display: grid;
  gap: var(--e-2);
}

.medallas-nuevas__titulo {
  font-family: var(--f-titulo);
  font-weight: 900;
  color: var(--c-amarillo-osc);
}

.medallas-nuevas__lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, 170px);
  justify-content: center;
  gap: var(--e-2);
}

.unidad {
  width: 100%;
  display: grid;
  gap: 0.4rem;
  text-align: left;
}

.unidad__titulo {
  font-size: var(--t-sm);
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  gap: var(--e-2);
}

.unidad__logro {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-verde-osc);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: center;
  margin-top: var(--e-3);
}

.pie-nota {
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.pie-nota a:hover {
  text-decoration: underline;
  color: var(--c-verde-osc);
}
</style>
