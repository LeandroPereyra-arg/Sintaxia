<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import { api } from '@/api/cliente.js'
import { useAuth } from '@/composables/useAuth.js'

/** Tabla de posiciones de la semana, con las ligas explicadas al costado. */
const { estado: sesion, autenticado } = useAuth()

const cargando = ref(true)
const error = ref('')
const tabla = ref([])
const ligas = ref([])
const yo = ref(null)
const miId = ref(null)

const podio = computed(() => tabla.value.slice(0, 3))
const resto = computed(() => tabla.value.slice(3))

const MEDALLAS_PODIO = ['🥇', '🥈', '🥉']

onMounted(async () => {
  try {
    const datos = await api.ranking()
    tabla.value = datos.tabla
    ligas.value = datos.ligas
    yo.value = datos.yo
    miId.value = datos.usuarioId
  } catch (e) {
    // estado 0 = no hubo respuesta; 5xx = el servidor esta caido detras del proxy.
    error.value =
      e.estado === 0 || e.estado >= 500
        ? 'El servidor no esta disponible, asi que todavia no se puede ver la tabla de posiciones.'
        : e.message
  } finally {
    cargando.value = false
  }
})

/** Inicial para cuando el usuario no tiene foto ni emoji. */
function inicial(fila) {
  return (fila.nombre ?? fila.usuario ?? '?').trim().charAt(0).toUpperCase()
}

function esMio(fila) {
  return miId.value !== null && fila.usuarioId === miId.value
}
</script>

<template>
  <div class="ranking seccion contenedor">
    <header class="cabecera">
      <div>
        <h1>Ranking semanal</h1>
        <p class="texto-secundario">
          Se ordena por el XP que ganaste esta semana. Arranca de cero todos los lunes.
        </p>
      </div>
      <p v-if="yo && yo.puesto" class="mi-puesto">
        Vas <strong>{{ yo.puesto }}º</strong> con <strong>{{ yo.xpSemana }}</strong> XP
      </p>
    </header>

    <p v-if="cargando" class="estado">Cargando la tabla...</p>
    <p v-else-if="error" class="estado estado--error">{{ error }}</p>

    <template v-else>
      <p v-if="tabla.length === 0" class="estado">
        Todavia nadie sumo XP esta semana. Resolve una leccion y sé el primero 🚀
      </p>

      <!-- Podio -->
      <ol v-if="podio.length" class="podio">
        <li
          v-for="(fila, i) in podio"
          :key="fila.usuarioId"
          class="podio__puesto"
          :class="[`podio__puesto--${i + 1}`, { 'podio__puesto--yo': esMio(fila) }]"
        >
          <span class="podio__medalla" aria-hidden="true">{{ MEDALLAS_PODIO[i] }}</span>
          <div class="avatar avatar--grande">
            <img v-if="fila.avatarUrl" :src="fila.avatarUrl" :alt="''" />
            <span v-else-if="fila.avatarEmoji">{{ fila.avatarEmoji }}</span>
            <span v-else>{{ inicial(fila) }}</span>
          </div>
          <p class="podio__nombre">{{ fila.nombre }}</p>
          <p class="podio__usuario">@{{ fila.usuario }}</p>
          <p class="podio__xp">{{ fila.xpSemana }} XP</p>
        </li>
      </ol>

      <!-- Resto de la tabla -->
      <ul v-if="resto.length" class="tabla">
        <li
          v-for="fila in resto"
          :key="fila.usuarioId"
          class="fila"
          :class="{ 'fila--yo': esMio(fila) }"
        >
          <span class="fila__puesto">{{ fila.puesto }}</span>
          <div class="avatar">
            <img v-if="fila.avatarUrl" :src="fila.avatarUrl" :alt="''" />
            <span v-else-if="fila.avatarEmoji">{{ fila.avatarEmoji }}</span>
            <span v-else>{{ inicial(fila) }}</span>
          </div>
          <div class="fila__datos">
            <p class="fila__nombre">{{ fila.nombre }}</p>
            <p class="fila__usuario">@{{ fila.usuario }} · 🔥 {{ fila.racha }}</p>
          </div>
          <span class="fila__xp">{{ fila.xpSemana }} XP</span>
        </li>
      </ul>

      <!-- Explicacion de las ligas -->
      <section class="ligas">
        <h2>Ligas</h2>
        <p class="texto-secundario">
          Tu liga depende del XP total que acumulaste desde que empezaste.
        </p>
        <ul class="ligas__lista">
          <li
            v-for="liga in ligas"
            :key="liga.codigo"
            class="liga"
            :class="{ 'liga--mia': sesion.usuario?.liga?.codigo === liga.codigo }"
            :style="{ '--color-liga': liga.color }"
          >
            <span class="liga__icono" aria-hidden="true">{{ liga.icono }}</span>
            <div>
              <p class="liga__nombre">{{ liga.nombre }}</p>
              <p class="liga__requisito">desde {{ liga.desde }} XP</p>
            </div>
          </li>
        </ul>
      </section>

      <p v-if="!autenticado" class="invitacion">
        <BaseBoton :to="{ name: 'ingresar' }">Inicia sesion para competir</BaseBoton>
      </p>
    </template>
  </div>
</template>

<style scoped>
.cabecera {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--e-4);
}

.mi-puesto {
  background: var(--c-verde-suave);
  border: 2px solid var(--c-verde);
  color: var(--c-verde-osc);
  border-radius: var(--r-full);
  padding: 0.4rem 1rem;
  font-size: var(--t-sm);
}

.estado {
  text-align: center;
  color: var(--c-gris);
  padding: var(--e-5) 0;
}

.estado--error {
  color: var(--c-rojo-osc);
}

/* --- avatares --- */
.avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--r-full);
  background: var(--c-violeta-suave);
  color: var(--c-violeta-osc);
  display: grid;
  place-items: center;
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--grande {
  width: 62px;
  height: 62px;
  font-size: 1.5rem;
}

/* --- podio --- */
.podio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--e-2);
  align-items: end;
  margin-bottom: var(--e-4);
  list-style: none;
}

.podio__puesto {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3) var(--e-2);
  text-align: center;
}

.podio__puesto--1 {
  order: 2;
  border-color: var(--c-amarillo);
  background: linear-gradient(180deg, var(--c-amarillo-suave), var(--c-blanco) 70%);
  padding-block: var(--e-4);
}
.podio__puesto--2 {
  order: 1;
}
.podio__puesto--3 {
  order: 3;
}

.podio__puesto--yo {
  outline: 3px solid var(--c-verde);
  outline-offset: 2px;
}

.podio__medalla {
  font-size: 1.6rem;
}

.podio__nombre {
  font-family: var(--f-titulo);
  font-weight: 800;
  font-size: var(--t-sm);
}

.podio__usuario {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.podio__xp {
  font-weight: 800;
  color: var(--c-verde-osc);
}

/* --- tabla --- */
.tabla {
  display: grid;
  gap: var(--e-1);
  margin-bottom: var(--e-5);
}

.fila {
  display: flex;
  align-items: center;
  gap: var(--e-2);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: 0.6rem var(--e-2);
}

.fila--yo {
  border-color: var(--c-verde);
  background: var(--c-verde-suave);
}

.fila__puesto {
  width: 26px;
  text-align: center;
  font-weight: 800;
  color: var(--c-gris);
}

.fila__datos {
  flex: 1;
  min-width: 0;
}

.fila__nombre {
  font-weight: 700;
  font-size: var(--t-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fila__usuario {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.fila__xp {
  font-weight: 800;
  color: var(--c-verde-osc);
  font-size: var(--t-sm);
}

/* --- ligas --- */
.ligas__lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--e-2);
  margin-top: var(--e-2);
}

.liga {
  display: flex;
  align-items: center;
  gap: var(--e-2);
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-left: 6px solid var(--color-liga);
  border-radius: var(--r-md);
  padding: var(--e-2);
}

.liga--mia {
  border-color: var(--color-liga);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-liga) 25%, transparent);
}

.liga__icono {
  font-size: 1.5rem;
}

.liga__nombre {
  font-weight: 800;
  font-size: var(--t-sm);
}

.liga__requisito {
  font-size: var(--t-xs);
  color: var(--c-gris);
}

.invitacion {
  text-align: center;
  margin-top: var(--e-4);
}

@media (max-width: 560px) {
  .podio {
    grid-template-columns: 1fr;
  }
  .podio__puesto--1,
  .podio__puesto--2,
  .podio__puesto--3 {
    order: 0;
  }
}
</style>
