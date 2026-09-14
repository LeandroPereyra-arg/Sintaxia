<script setup>
import { computed, ref } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import { unidadesJavaScript, ESTADO_UNIDAD } from '@/data/unidades.js'
import { lecciones, leccionesDeUnidad } from '@/data/lecciones/index.js'
import { useProgreso } from '@/composables/useProgreso.js'

const {
  estado,
  progresoCurso,
  totalLeccionesCompletadas,
  precisionGeneral,
  metaCumplida,
  progresoUnidad,
  estadoUnidad,
  leccionesCompletadasDeUnidad,
  actualizarPerfil,
  reiniciarProgreso
} = useProgreso()

const avatares = ['👩‍💻', '👨‍💻', '🧑‍🚀', '🦊', '🐧', '🤖']
const metas = [20, 50, 100]

const editando = ref(false)
const nombreBorrador = ref(estado.nombre)

function guardar() {
  actualizarPerfil({ nombre: nombreBorrador.value.trim() || 'Estudiante' })
  editando.value = false
}

function confirmarReinicio() {
  const seguro = window.confirm(
    'Se van a borrar tus XP, tu racha y todas las lecciones completadas. Continuar?'
  )
  if (seguro) reiniciarProgreso()
}

const resumenUnidades = computed(() =>
  unidadesJavaScript.map((unidad) => ({
    ...unidad,
    estado: estadoUnidad(unidad.id),
    progreso: progresoUnidad(unidad.id),
    completadas: leccionesCompletadasDeUnidad(unidad.id),
    totales: leccionesDeUnidad(unidad.id).length
  }))
)

const logros = computed(() => [
  {
    id: 'primer-paso',
    icono: '🥚',
    titulo: 'Primer paso',
    texto: 'Resolve tu primera leccion',
    conseguido: totalLeccionesCompletadas.value >= 1
  },
  {
    id: 'constante',
    icono: '🔥',
    titulo: 'Constante',
    texto: 'Manten una racha de 3 dias',
    conseguido: estado.racha >= 3
  },
  {
    id: 'unidad-lista',
    icono: '🎖️',
    titulo: 'Unidad completa',
    texto: 'Termina una unidad entera',
    conseguido: resumenUnidades.value.some((u) => u.estado === ESTADO_UNIDAD.COMPLETADA)
  },
  {
    id: 'preciso',
    icono: '🎯',
    titulo: 'Punteria fina',
    texto: 'Llega al 80 % de precision',
    conseguido: precisionGeneral.value >= 80
  },
  {
    id: 'maraton',
    icono: '🚀',
    titulo: 'Maratonista',
    texto: 'Suma 200 XP',
    conseguido: estado.xp >= 200
  },
  {
    id: 'experto',
    icono: '👑',
    titulo: 'JavaScript listo',
    texto: 'Completa las 14 lecciones',
    conseguido: totalLeccionesCompletadas.value >= lecciones.length
  }
])
</script>

<template>
  <div class="perfil seccion contenedor">
    <!-- Datos del estudiante -->
    <header class="cabecera">
      <div class="cabecera__avatar" aria-hidden="true">{{ estado.avatar }}</div>

      <div class="cabecera__datos">
        <template v-if="editando">
          <label class="campo">
            <span>Nombre</span>
            <input v-model="nombreBorrador" type="text" maxlength="24" @keyup.enter="guardar" />
          </label>
          <div class="cabecera__acciones">
            <BaseBoton tamano="chico" @click="guardar">Guardar</BaseBoton>
            <BaseBoton tamano="chico" variante="texto" @click="editando = false">Cancelar</BaseBoton>
          </div>
        </template>

        <template v-else>
          <h1>{{ estado.nombre }}</h1>
          <p class="texto-secundario">Estudiante de JavaScript en Sintaxia</p>
          <BaseBoton tamano="chico" variante="contorno" @click="editando = true">
            Editar perfil
          </BaseBoton>
        </template>

        <ul class="avatares" aria-label="Elegir avatar">
          <li v-for="opcion in avatares" :key="opcion">
            <button
              type="button"
              class="avatares__boton"
              :class="{ 'avatares__boton--activo': estado.avatar === opcion }"
              :aria-label="`Usar el avatar ${opcion}`"
              @click="actualizarPerfil({ avatar: opcion })"
            >
              {{ opcion }}
            </button>
          </li>
        </ul>
      </div>

      <ul class="estadisticas">
        <li><strong>{{ estado.xp }}</strong> XP totales</li>
        <li><strong>{{ estado.racha }}</strong> dias de racha</li>
        <li><strong>{{ totalLeccionesCompletadas }}</strong> lecciones</li>
        <li><strong>{{ precisionGeneral }} %</strong> precision</li>
      </ul>
    </header>

    <!-- Meta diaria -->
    <section class="tarjeta">
      <h2>Meta diaria</h2>
      <p class="texto-secundario">
        Llevas <strong>{{ estado.xpDeHoy }}</strong> de {{ estado.metaDiaria }} XP de hoy.
        <span v-if="metaCumplida">Meta cumplida! 🎉</span>
      </p>
      <BarraProgreso
        :valor="estado.xpDeHoy"
        :maximo="estado.metaDiaria"
        color="var(--c-amarillo)"
        etiqueta="Meta diaria de XP"
      />
      <div class="metas">
        <button
          v-for="meta in metas"
          :key="meta"
          type="button"
          class="meta"
          :class="{ 'meta--activa': estado.metaDiaria === meta }"
          @click="actualizarPerfil({ metaDiaria: meta })"
        >
          {{ meta }} XP / dia
        </button>
      </div>
    </section>

    <!-- Progreso por unidad -->
    <section class="tarjeta">
      <div class="tarjeta__cabecera">
        <h2>Progreso del curso</h2>
        <span class="tarjeta__dato">{{ progresoCurso }} %</span>
      </div>
      <BarraProgreso :valor="progresoCurso" etiqueta="Progreso general del curso" />

      <ul class="unidades">
        <li v-for="unidad in resumenUnidades" :key="unidad.id" class="unidad">
          <span class="unidad__icono" aria-hidden="true">{{ unidad.icono }}</span>
          <div class="unidad__texto">
            <p class="unidad__titulo">{{ unidad.numero }}. {{ unidad.titulo }}</p>
            <BarraProgreso
              :valor="unidad.progreso"
              :color="unidad.color"
              alto="8px"
              :etiqueta="`Progreso de la unidad ${unidad.numero}`"
            />
          </div>
          <span class="etiqueta" :class="`etiqueta--${unidad.estado}`">
            {{ unidad.completadas }}/{{ unidad.totales }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Logros -->
    <section class="tarjeta">
      <h2>Logros</h2>
      <ul class="logros">
        <li
          v-for="logro in logros"
          :key="logro.id"
          class="logro"
          :class="{ 'logro--off': !logro.conseguido }"
        >
          <span class="logro__icono" aria-hidden="true">{{ logro.conseguido ? logro.icono : '🔒' }}</span>
          <p class="logro__titulo">{{ logro.titulo }}</p>
          <p class="logro__texto">{{ logro.texto }}</p>
        </li>
      </ul>
    </section>

    <section class="tarjeta tarjeta--peligro">
      <h2>Reiniciar progreso</h2>
      <p class="texto-secundario">
        Borra el progreso guardado en este navegador para empezar el curso desde cero.
      </p>
      <BaseBoton variante="peligro" @click="confirmarReinicio">Borrar mi progreso</BaseBoton>
    </section>
  </div>
</template>

<style scoped>
.perfil {
  display: grid;
  gap: var(--e-3);
}

.cabecera {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--e-3);
  align-items: center;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-4);
}

.cabecera__avatar {
  display: grid;
  place-items: center;
  width: 90px;
  height: 90px;
  font-size: 2.6rem;
  border-radius: var(--r-full);
  background: var(--c-violeta-suave);
  border: 3px solid var(--c-violeta);
}

.cabecera__datos h1 {
  font-size: var(--t-xl);
}

.cabecera__acciones {
  display: flex;
  gap: var(--e-1);
  margin-top: var(--e-1);
}

.campo {
  display: grid;
  gap: 0.2rem;
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-gris);
  text-transform: uppercase;
}

.campo input {
  font-family: var(--f-titulo);
  font-size: var(--t-md);
  font-weight: 800;
  color: var(--c-tinta);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.35rem 0.6rem;
  text-transform: none;
}

.campo input:focus {
  outline: 3px solid var(--c-verde);
  outline-offset: 1px;
}

.avatares {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: var(--e-2);
}

.avatares__boton {
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  border-radius: var(--r-full);
  border: 2px solid var(--c-borde);
  background: var(--c-blanco);
}

.avatares__boton--activo {
  border-color: var(--c-violeta);
  background: var(--c-violeta-suave);
}

.estadisticas {
  display: grid;
  gap: 0.3rem;
  font-size: var(--t-sm);
  color: var(--c-gris);
  text-align: right;
}

.estadisticas strong {
  font-family: var(--f-titulo);
  font-size: var(--t-md);
  color: var(--c-tinta);
}

.tarjeta {
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  display: grid;
  gap: var(--e-2);
}

.tarjeta h2 {
  font-size: var(--t-lg);
}

.tarjeta--peligro {
  border-color: var(--c-rojo-suave);
  justify-items: start;
}

.tarjeta__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.tarjeta__dato {
  font-family: var(--f-titulo);
  font-weight: 900;
  color: var(--c-verde-osc);
}

.metas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-1);
}

.meta {
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-gris);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-full);
  padding: 0.3rem 0.9rem;
}

.meta--activa {
  border-color: var(--c-amarillo);
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
}

.unidades {
  display: grid;
  gap: var(--e-2);
  margin-top: var(--e-2);
}

.unidad {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--e-2);
}

.unidad__icono {
  font-size: 1.3rem;
}

.unidad__titulo {
  font-size: var(--t-sm);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.logros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--e-2);
}

.logro {
  text-align: center;
  border: 2px solid var(--c-amarillo);
  background: var(--c-amarillo-suave);
  border-radius: var(--r-md);
  padding: var(--e-2);
}

.logro--off {
  border-color: var(--c-borde);
  background: var(--c-fondo);
  opacity: 0.7;
}

.logro__icono {
  font-size: 1.8rem;
  display: block;
}

.logro__titulo {
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-sm);
}

.logro__texto {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

@media (max-width: 820px) {
  .cabecera {
    grid-template-columns: auto 1fr;
  }
  .estadisticas {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    text-align: left;
  }
}
</style>
