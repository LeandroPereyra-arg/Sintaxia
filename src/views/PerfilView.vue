<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import Icono from '@/components/Icono.vue'
import SintaxMascota from '@/components/SintaxMascota.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import MedallaCard from '@/components/MedallaCard.vue'
import CalendarioActividad from '@/components/CalendarioActividad.vue'
import { unidadesJavaScript, ESTADO_UNIDAD } from '@/data/unidades.js'
import { lecciones, leccionesDeUnidad } from '@/data/lecciones/index.js'
import { api } from '@/api/cliente.js'
import { useAuth } from '@/composables/useAuth.js'
import { useProgreso } from '@/composables/useProgreso.js'

const { estado: sesion, autenticado, salir, iniciar } = useAuth()
const {
  estado,
  enCuenta,
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

const AVATARES = ['buho', 'robot', 'astronauta', 'cohete', 'gema', 'rayo', 'corona', 'diana']
const METAS = [20, 50, 100]

const editando = ref(false)
const guardando = ref(false)
const errorEdicion = ref('')
const borrador = ref({ nombre: '', usuario: '', bio: '', pais: '' })

const medallas = ref([])
const actividad = ref([])
const rankingPropio = ref(null)
const cargandoDatos = ref(false)

/** En modo cuenta los datos salen de la API; como invitado, del estado local. */
const usuario = computed(() => sesion.usuario)

const medallasObtenidas = computed(() => medallas.value.filter((m) => m.obtenida).length)

const resumenUnidades = computed(() =>
  unidadesJavaScript.map((unidad) => ({
    ...unidad,
    estado: estadoUnidad(unidad.id),
    progreso: progresoUnidad(unidad.id),
    completadas: leccionesCompletadasDeUnidad(unidad.id),
    totales: leccionesDeUnidad(unidad.id).length
  }))
)

/** Medallas calculadas localmente para el modo invitado (sin backend). */
const medallasInvitado = computed(() => {
  const unidadesListas = resumenUnidades.value.filter((u) => u.estado === ESTADO_UNIDAD.COMPLETADA).length
  const stats = {
    lecciones: totalLeccionesCompletadas.value,
    racha: estado.racha,
    xp: estado.xp,
    unidades: unidadesListas,
    curso: totalLeccionesCompletadas.value >= lecciones.length ? 1 : 0
  }
  const definiciones = [
    { codigo: 'primer_paso', nombre: 'Primer paso', descripcion: 'Completa tu primera leccion.', icono: 'huevo', nivel: 'bronce', tipo: 'lecciones', objetivo: 1 },
    { codigo: 'aprendiz', nombre: 'Aprendiz', descripcion: 'Completa 5 lecciones.', icono: 'libro', nivel: 'plata', tipo: 'lecciones', objetivo: 5 },
    { codigo: 'estudioso', nombre: 'Estudioso', descripcion: 'Completa 10 lecciones.', icono: 'birrete', nivel: 'oro', tipo: 'lecciones', objetivo: 10 },
    { codigo: 'unidad_completa', nombre: 'Unidad completa', descripcion: 'Termina una unidad entera.', icono: 'medalla', nivel: 'plata', tipo: 'unidades', objetivo: 1 },
    { codigo: 'racha_3', nombre: 'Constante', descripcion: 'Manten una racha de 3 dias.', icono: 'llama', nivel: 'bronce', tipo: 'racha', objetivo: 3 },
    { codigo: 'xp_100', nombre: 'Cien puntos', descripcion: 'Acumula 100 XP.', icono: 'gema', nivel: 'bronce', tipo: 'xp', objetivo: 100 },
    { codigo: 'javascript_listo', nombre: 'JavaScript listo', descripcion: 'Completa el curso entero.', icono: 'corona', nivel: 'diamante', tipo: 'curso', objetivo: 1 }
  ]
  return definiciones.map((d) => {
    const actual = Math.min(stats[d.tipo] ?? 0, d.objetivo)
    return {
      codigo: d.codigo,
      nombre: d.nombre,
      descripcion: d.descripcion,
      icono: d.icono,
      nivel: d.nivel,
      obtenida: actual >= d.objetivo,
      obtenidaEn: null,
      progreso: { actual, objetivo: d.objetivo }
    }
  })
})

const medallasAMostrar = computed(() => (enCuenta.value ? medallas.value : medallasInvitado.value))

async function cargarDatosDeCuenta() {
  if (!autenticado.value) return
  cargandoDatos.value = true
  try {
    const datos = await api.perfil()
    // El perfil trae el usuario al dia: lo aplicamos para que la cabecera y el
    // menu de la cuenta no muestren un XP viejo.
    sesion.usuario = datos.usuario
    medallas.value = datos.medallas
    actividad.value = datos.actividad
    rankingPropio.value = datos.ranking
    estado.xpDeHoy = datos.xpDeHoy
  } catch {
    /* si falla seguimos mostrando lo que haya */
  } finally {
    cargandoDatos.value = false
  }
}

onMounted(async () => {
  await iniciar()
  await cargarDatosDeCuenta()
})

watch(autenticado, (hay) => {
  if (hay) cargarDatosDeCuenta()
  else {
    medallas.value = []
    actividad.value = []
    rankingPropio.value = null
  }
})

function abrirEdicion() {
  borrador.value = {
    nombre: usuario.value?.nombre ?? estado.nombre,
    usuario: usuario.value?.usuario ?? '',
    bio: usuario.value?.bio ?? '',
    pais: usuario.value?.pais ?? ''
  }
  errorEdicion.value = ''
  editando.value = true
}

async function guardar() {
  guardando.value = true
  errorEdicion.value = ''
  try {
    const cambios = { nombre: borrador.value.nombre.trim() || 'Estudiante' }
    if (enCuenta.value) {
      cambios.usuario = borrador.value.usuario
      cambios.bio = borrador.value.bio
      cambios.pais = borrador.value.pais
    }
    await actualizarPerfil(cambios)
    editando.value = false
  } catch (error) {
    errorEdicion.value = error.message
  } finally {
    guardando.value = false
  }
}

async function cambiarAvatar(emoji) {
  try {
    await actualizarPerfil({ avatar: emoji })
  } catch (error) {
    errorEdicion.value = error.message
  }
}

async function cambiarMeta(meta) {
  try {
    await actualizarPerfil({ metaDiaria: meta })
  } catch (error) {
    errorEdicion.value = error.message
  }
}

function confirmarReinicio() {
  const seguro = window.confirm(
    'Se van a borrar tus XP, tu racha y las lecciones completadas en este navegador. Continuar?'
  )
  if (seguro) reiniciarProgreso()
}

async function cerrarSesion() {
  await salir()
}

const fechaRegistro = computed(() => {
  if (!usuario.value?.creadoEn) return ''
  return new Date(usuario.value.creadoEn).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric'
  })
})

const NOMBRE_PROVEEDOR = { google: 'Google', github: 'GitHub', demo: 'Prueba' }

/** Sintax acompania segun como venga el estudiante. */
const animoSintax = computed(() => {
  if (totalLeccionesCompletadas.value === 0) return 'dormido'
  if ((usuario.value?.racha ?? estado.racha) >= 3) return 'celebrando'
  return 'normal'
})
</script>

<template>
  <div class="perfil seccion contenedor">
    <!-- Cabecera del perfil -->
    <header class="cabecera">
      <div class="cabecera__avatar">
        <img v-if="usuario?.avatarUrl && !usuario?.avatarIcono" :src="usuario.avatarUrl" alt="" />
        <Icono v-else :nombre="usuario?.avatarIcono ?? estado.avatar" :tamano="52" :trazo="1.8" />
      </div>

      <div class="cabecera__datos">
        <template v-if="editando">
          <div class="campos">
            <label class="campo">
              <span>Nombre</span>
              <input v-model="borrador.nombre" type="text" maxlength="40" />
            </label>
            <label v-if="enCuenta" class="campo">
              <span>Nombre de usuario</span>
              <input v-model="borrador.usuario" type="text" maxlength="24" />
            </label>
            <label v-if="enCuenta" class="campo campo--ancho">
              <span>Bio</span>
              <input v-model="borrador.bio" type="text" maxlength="160" placeholder="Conta algo tuyo" />
            </label>
            <label v-if="enCuenta" class="campo">
              <span>Pais (2 letras)</span>
              <input v-model="borrador.pais" type="text" maxlength="2" placeholder="AR" />
            </label>
          </div>
          <p v-if="errorEdicion" class="error">{{ errorEdicion }}</p>
          <div class="cabecera__acciones">
            <BaseBoton tamano="chico" :deshabilitado="guardando" @click="guardar">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </BaseBoton>
            <BaseBoton tamano="chico" variante="texto" @click="editando = false">Cancelar</BaseBoton>
          </div>
        </template>

        <template v-else>
          <h1>{{ usuario?.nombre ?? estado.nombre }}</h1>
          <p v-if="usuario" class="cabecera__usuario">@{{ usuario.usuario }}</p>
          <p v-if="usuario?.bio" class="cabecera__bio">{{ usuario.bio }}</p>
          <p v-else class="texto-secundario">Estudiante de JavaScript en Sintaxia</p>

          <ul class="cabecera__insignias">
            <li v-if="usuario?.liga" class="insignia" :style="{ '--color-liga': usuario.liga.color }">
              <Icono :nombre="usuario.liga.icono" :tamano="14" /> Liga {{ usuario.liga.nombre }}
            </li>
            <li v-if="usuario?.pais" class="insignia insignia--suave">
              <Icono nombre="ubicacion" :tamano="14" /> {{ usuario.pais }}
            </li>
            <li v-if="fechaRegistro" class="insignia insignia--suave">Desde {{ fechaRegistro }}</li>
            <li
              v-for="proveedor in usuario?.proveedores ?? []"
              :key="proveedor"
              class="insignia insignia--suave"
            >
              {{ NOMBRE_PROVEEDOR[proveedor] ?? proveedor }}
            </li>
          </ul>

          <div class="cabecera__acciones">
            <BaseBoton tamano="chico" variante="contorno" @click="abrirEdicion">
              Editar perfil
            </BaseBoton>
            <BaseBoton v-if="autenticado" tamano="chico" variante="texto" @click="cerrarSesion">
              Cerrar sesion
            </BaseBoton>
          </div>
        </template>

        <ul class="avatares" aria-label="Elegir avatar">
          <li v-for="opcion in AVATARES" :key="opcion">
            <button
              type="button"
              class="avatares__boton"
              :class="{ 'avatares__boton--activo': (usuario?.avatarIcono ?? estado.avatar) === opcion }"
              :aria-label="`Usar el avatar ${opcion}`"
              @click="cambiarAvatar(opcion)"
            >
              <Icono :nombre="opcion" :tamano="20" />
            </button>
          </li>
        </ul>
      </div>

      <ul class="estadisticas">
        <li><strong>{{ usuario?.xp ?? estado.xp }}</strong> XP totales</li>
        <li><strong>{{ usuario?.racha ?? estado.racha }}</strong> dias de racha</li>
        <li v-if="usuario"><strong>{{ usuario.rachaMaxima }}</strong> racha maxima</li>
        <li><strong>{{ totalLeccionesCompletadas }}</strong> lecciones</li>
        <li><strong>{{ precisionGeneral }} %</strong> precision</li>
        <li v-if="rankingPropio?.puesto">
          <strong>{{ rankingPropio.puesto }}º</strong> esta semana
        </li>
      </ul>
    </header>

    <!-- Invitacion a crear cuenta -->
    <section v-if="!autenticado" class="tarjeta tarjeta--invitacion">
      <SintaxMascota estado="saludando" :alto="96" alt="" />
      <div>
        <h2>Guarda tu progreso</h2>
        <p class="texto-secundario">
          Estas practicando como invitado: si borras los datos del navegador, perdes todo. Al
          iniciar sesion se sube automaticamente lo que ya hiciste.
        </p>
      </div>
      <BaseBoton :to="{ name: 'ingresar' }">Iniciar sesion</BaseBoton>
    </section>

    <!-- Meta diaria -->
    <section class="tarjeta">
      <h2>Meta diaria</h2>
      <p class="texto-secundario">
        Llevas <strong>{{ estado.xpDeHoy }}</strong> de {{ usuario?.metaDiaria ?? estado.metaDiaria }} XP de hoy.
        <span v-if="metaCumplida" class="meta-lista">
          <Icono nombre="chispas" :tamano="15" /> Meta cumplida!
        </span>
      </p>
      <BarraProgreso
        :valor="estado.xpDeHoy"
        :maximo="usuario?.metaDiaria ?? estado.metaDiaria"
        color="var(--c-amarillo)"
        etiqueta="Meta diaria de XP"
      />
      <div class="metas">
        <button
          v-for="meta in METAS"
          :key="meta"
          type="button"
          class="meta"
          :class="{ 'meta--activa': (usuario?.metaDiaria ?? estado.metaDiaria) === meta }"
          @click="cambiarMeta(meta)"
        >
          {{ meta }} XP / dia
        </button>
      </div>
    </section>

    <!-- Medallas -->
    <section class="tarjeta">
      <div class="tarjeta__cabecera">
        <h2>Medallas</h2>
        <span class="tarjeta__dato">
          {{ medallasAMostrar.filter((m) => m.obtenida).length }} / {{ medallasAMostrar.length }}
        </span>
      </div>
      <p v-if="!enCuenta" class="texto-secundario">
        Como invitado se muestran solo algunas. Inicia sesion para desbloquear las 14 medallas.
      </p>

      <ul class="medallas anim-lista">
        <li v-for="medalla in medallasAMostrar" :key="medalla.codigo">
          <MedallaCard :medalla="medalla" />
        </li>
      </ul>
    </section>

    <!-- Calendario de actividad (solo con cuenta: necesita el historial del servidor) -->
    <section v-if="enCuenta" class="tarjeta">
      <h2>Tu actividad</h2>
      <CalendarioActividad :actividad="actividad" />
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
          <Icono class="unidad__icono" :nombre="unidad.icono" :tamano="22" :trazo="2.1" />
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

    <!-- Borrar progreso: solo tiene sentido como invitado -->
    <section v-if="!enCuenta" class="tarjeta tarjeta--peligro">
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
  align-items: start;
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-xl);
  padding: var(--e-4);
}

.cabecera__avatar {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  font-size: 2.6rem;
  border-radius: var(--r-full);
  background: var(--c-violeta-suave);
  border: 3px solid var(--c-violeta);
  overflow: hidden;
}

.cabecera__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cabecera__datos h1 {
  font-size: var(--t-xl);
}

.cabecera__usuario {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.cabecera__bio {
  margin-top: 0.3rem;
  font-size: var(--t-sm);
}

.cabecera__insignias {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: var(--e-2);
}

.insignia {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--t-xs);
  font-weight: 700;
  border-radius: var(--r-full);
  padding: 0.2rem 0.7rem;
  border: 2px solid var(--color-liga, var(--c-borde));
  color: var(--color-liga, var(--c-gris));
}

.insignia--suave {
  border-color: var(--c-borde);
  color: var(--c-gris);
  background: var(--c-fondo);
}

.cabecera__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-1);
  margin-top: var(--e-2);
}

.campos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--e-2);
}

.campo--ancho {
  grid-column: 1 / -1;
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
  font-family: var(--f-texto);
  font-size: var(--t-sm);
  font-weight: 700;
  color: var(--c-tinta);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.6rem;
  text-transform: none;
}

.campo input:focus {
  outline: 3px solid var(--c-verde);
  outline-offset: 1px;
}

.error {
  color: var(--c-rojo-osc);
  font-size: var(--t-sm);
  font-weight: 700;
  margin-top: var(--e-1);
}

.avatares {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: var(--e-2);
}

.avatares__boton {
  font-size: 1.1rem;
  width: 38px;
  height: 38px;
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

.tarjeta--invitacion {
  grid-template-columns: auto 1fr auto;
  align-items: center;
  border-color: var(--c-verde);
  background: linear-gradient(180deg, var(--c-verde-suave), var(--c-blanco) 70%);
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

.meta-lista {
  color: var(--c-verde-osc);
  font-weight: 800;
  white-space: nowrap;
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

.medallas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--e-2);
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

@media (max-width: 860px) {
  .cabecera {
    grid-template-columns: auto 1fr;
  }
  .estadisticas {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    text-align: left;
  }
  .tarjeta--invitacion {
    grid-template-columns: 1fr;
  }
}
</style>
