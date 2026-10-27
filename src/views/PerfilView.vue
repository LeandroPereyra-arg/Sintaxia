<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBoton from '@/components/BaseBoton.vue'
import Icono from '@/components/Icono.vue'
import BarraProgreso from '@/components/BarraProgreso.vue'
import MedallaCard from '@/components/MedallaCard.vue'
import CalendarioActividad from '@/components/CalendarioActividad.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import AvisoDatos from '@/components/AvisoDatos.vue'
import BotonCerrarSesion from '@/components/BotonCerrarSesion.vue'
import { ESTADO_UNIDAD } from '@/constantes/estados.js'
import { useCatalogo, CURSO_POR_DEFECTO } from '@/composables/useCatalogo.js'
import { useAuth } from '@/composables/useAuth.js'
import { useProgreso } from '@/composables/useProgreso.js'
import { ETIQUETA_ESTADO_INTENTO } from '@/servicios/progreso.js'
import { ALIAS_MAXIMO, motivoAliasInvalido } from '@/utils/validaciones.js'

/**
 * Perfil de la persona que esta usando la app: su alias con codigo, si es invitado
 * o tiene cuenta, que datos guarda Sintaxia, y su progreso.
 */
const route = useRoute()
const router = useRouter()
const { estado: sesion, usuario, esInvitado, esCuenta, etiqueta, actualizarPerfil, recargarPerfil } = useAuth()
const { estado: catalogo, cargarCurso, leccionesDeUnidad, obtenerLeccionCacheada } = useCatalogo()
const {
  estado,
  progresoCurso,
  totalLeccionesCompletadas,
  precisionGeneral,
  metaCumplida,
  progresoUnidad,
  estadoUnidad,
  leccionesCompletadasDeUnidad,
  leccionCompletada,
  leccionAprobada,
  leccionDisponible,
  precisionLeccion,
  intentoEnCurso,
  reiniciarProgreso,
  recargarHistorial
} = useProgreso()

const AVATARES = ['buho', 'robot', 'astronauta', 'cohete', 'gema', 'rayo', 'corona', 'diana']
const METAS = [20, 50, 100]

const perfil = computed(() => sesion.perfil)

const editando = ref(false)
const guardando = ref(false)
const errorEdicion = ref(null)
const errorGeneral = ref(null)
const borrador = ref('')
const intento = ref(false)

const errorAlias = computed(() => (intento.value ? motivoAliasInvalido(borrador.value) : ''))
const cuentaCreada = computed(() => route.query.cuenta === 'creada' && esCuenta.value)

const resumenUnidades = computed(() =>
  catalogo.unidades.map((unidad) => ({
    ...unidad,
    estado: estadoUnidad(unidad.id),
    progreso: progresoUnidad(unidad.id),
    completadas: leccionesCompletadasDeUnidad(unidad.id),
    totales: leccionesDeUnidad(unidad.id).length
  }))
)

// ---------------------------------------------------------------------------
// Lecciones: completadas, pendientes y resultados personales
// ---------------------------------------------------------------------------
const ESTADO_LECCION = {
  aprobada: 'Aprobada',
  completada: 'Completada sin aprobar',
  en_curso: 'En curso',
  pendiente: 'Pendiente',
  bloqueada: 'Bloqueada'
}

/**
 * Una fila por leccion. Separa el MEJOR resultado (el que cuenta para avanzar)
 * del ULTIMO intento (el resumen de la ultima vez, haya terminado como haya
 * terminado).
 */
const misLecciones = computed(() =>
  catalogo.lecciones.map((leccion) => {
    let situacion = 'bloqueada'
    if (leccionAprobada(leccion.id)) situacion = 'aprobada'
    else if (leccionCompletada(leccion.id)) situacion = 'completada'
    else if (intentoEnCurso(leccion.id)) situacion = 'en_curso'
    else if (leccionDisponible(leccion.id)) situacion = 'pendiente'
    return {
      ...leccion,
      situacion,
      mejor: leccionCompletada(leccion.id) ? precisionLeccion(leccion.id) : null,
      ultimo: estado.ultimos[leccion.id] ?? null,
      cantidad: estado.intentos.filter((i) => i.leccionId === leccion.id).length
    }
  })
)

const cantidadPendientes = computed(
  () => misLecciones.value.filter((l) => l.situacion !== 'aprobada' && l.situacion !== 'completada').length
)

// ---------------------------------------------------------------------------
// Historial: TODOS los intentos, del mas nuevo al mas viejo
// ---------------------------------------------------------------------------
const MOSTRAR_DE_A = 10
const mostrarTodo = ref(false)
const historialVisible = computed(() =>
  mostrarTodo.value ? estado.intentos : estado.intentos.slice(0, MOSTRAR_DE_A)
)

const tituloDe = (leccionId) => obtenerLeccionCacheada(leccionId)?.titulo ?? leccionId

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})
const fechaCorta = (fecha) => (fecha ? formatoFecha.format(new Date(fecha)) : '')

/** Medallas calculadas a partir del historial. */
const medallas = computed(() => {
  const unidadesListas = resumenUnidades.value.filter((u) => u.estado === ESTADO_UNIDAD.COMPLETADA).length
  const stats = {
    lecciones: totalLeccionesCompletadas.value,
    racha: estado.racha,
    xp: estado.xp,
    unidades: unidadesListas,
    curso: totalLeccionesCompletadas.value >= catalogo.lecciones.length && catalogo.lecciones.length > 0 ? 1 : 0
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

onMounted(() => cargarCurso(CURSO_POR_DEFECTO))

function abrirEdicion() {
  borrador.value = perfil.value?.alias ?? ''
  errorEdicion.value = null
  intento.value = false
  editando.value = true
}

async function guardarAlias() {
  intento.value = true
  errorEdicion.value = null
  if (motivoAliasInvalido(borrador.value)) return

  guardando.value = true
  try {
    await actualizarPerfil({ alias: borrador.value })
    editando.value = false
  } catch (error) {
    errorEdicion.value = error
  } finally {
    guardando.value = false
  }
}

async function cambiarAvatar(avatar) {
  errorGeneral.value = null
  try {
    await actualizarPerfil({ avatar })
  } catch (error) {
    errorGeneral.value = error
  }
}

async function cambiarMeta(meta) {
  errorGeneral.value = null
  try {
    await actualizarPerfil({ metaDiaria: meta })
  } catch (error) {
    errorGeneral.value = error
  }
}

async function confirmarReinicio() {
  const seguro = window.confirm(
    'Se va a borrar tu historial: tus XP, tu racha y las lecciones completadas. No se puede deshacer. Continuar?'
  )
  if (!seguro) return
  errorGeneral.value = null
  try {
    await reiniciarProgreso()
  } catch (error) {
    errorGeneral.value = error
  }
}

const fechaRegistro = computed(() => {
  if (!perfil.value?.creadoEn) return ''
  return new Date(perfil.value.creadoEn).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
})

/** Sintax acompania segun como venga el estudiante. */
const animoSintax = computed(() => {
  if (totalLeccionesCompletadas.value === 0) return 'dormido'
  if (estado.racha >= 3) return 'celebrando'
  return 'normal'
})
</script>

<template>
  <div class="perfil seccion contenedor">
    <MensajeEstado v-if="cuentaCreada" tipo="exito">
      <p><strong>Tu cuenta esta lista.</strong> Es la misma de antes: tu historial se conservo.</p>
    </MensajeEstado>

    <MensajeEstado v-if="sesion.errorPerfil" tipo="error">
      <p>{{ sesion.errorPerfil.message }}</p>
      <BaseBoton v-if="sesion.errorPerfil.reintentable" tamano="chico" variante="contorno" @click="recargarPerfil">
        Reintentar
      </BaseBoton>
    </MensajeEstado>

    <MensajeEstado v-if="estado.error" tipo="error">
      <p>{{ estado.error.message }}</p>
      <BaseBoton v-if="estado.error.reintentable" tamano="chico" variante="contorno" @click="recargarHistorial">
        Reintentar
      </BaseBoton>
    </MensajeEstado>

    <!-- Cabecera del perfil -->
    <header class="cabecera">
      <div class="cabecera__avatar">
        <Icono :nombre="perfil?.avatar ?? 'buho'" :tamano="52" :trazo="1.8" />
      </div>

      <div class="cabecera__datos">
        <template v-if="editando">
          <form class="edicion" novalidate @submit.prevent="guardarAlias">
            <CampoTexto
              v-model="borrador"
              etiqueta="Alias"
              autocomplete="nickname"
              :maxlength="ALIAS_MAXIMO"
              ayuda="Al cambiarlo te asignamos un codigo nuevo."
              :error="errorAlias"
              :deshabilitado="guardando"
            />
            <MensajeEstado v-if="errorEdicion" tipo="error">{{ errorEdicion.message }}</MensajeEstado>
            <div class="cabecera__acciones">
              <BaseBoton type="submit" tamano="chico" :deshabilitado="guardando">
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </BaseBoton>
              <BaseBoton tamano="chico" variante="texto" :deshabilitado="guardando" @click="editando = false">
                Cancelar
              </BaseBoton>
            </div>
          </form>
        </template>

        <template v-else>
          <h1 data-prueba="alias">{{ etiqueta }}</h1>

          <ul class="cabecera__insignias">
            <li class="insignia" :class="esInvitado ? 'insignia--invitado' : 'insignia--cuenta'">
              <Icono :nombre="esInvitado ? 'usuario' : 'escudo'" :tamano="14" />
              {{ esInvitado ? 'Invitado' : 'Cuenta' }}
            </li>
            <li v-if="fechaRegistro" class="insignia insignia--suave">Desde {{ fechaRegistro }}</li>
          </ul>

          <p v-if="esCuenta && usuario?.email" class="cabecera__correo">{{ usuario.email }}</p>
          <p v-else-if="esInvitado" class="texto-secundario">
            Los invitados no eligen alias: crea tu cuenta para elegir el tuyo.
          </p>

          <div class="cabecera__acciones">
            <BaseBoton v-if="esCuenta" tamano="chico" variante="contorno" @click="abrirEdicion">
              Cambiar alias
            </BaseBoton>
            <BaseBoton v-else-if="esInvitado" tamano="chico" :to="{ name: 'registro' }">
              Crear mi cuenta
            </BaseBoton>
            <BotonCerrarSesion @cerrada="router.push({ name: 'inicio' })" />
          </div>
        </template>

        <ul class="avatares" aria-label="Elegir avatar">
          <li v-for="opcion in AVATARES" :key="opcion">
            <button
              type="button"
              class="avatares__boton"
              :class="{ 'avatares__boton--activo': (perfil?.avatar ?? 'buho') === opcion }"
              :aria-label="`Usar el avatar ${opcion}`"
              @click="cambiarAvatar(opcion)"
            >
              <Icono :nombre="opcion" :tamano="20" />
            </button>
          </li>
        </ul>
      </div>

      <ul class="estadisticas">
        <li><strong>{{ estado.xp }}</strong> XP totales</li>
        <li><strong>{{ estado.racha }}</strong> dias de racha</li>
        <li><strong>{{ estado.rachaMaxima }}</strong> racha maxima</li>
        <li><strong>{{ totalLeccionesCompletadas }}</strong> lecciones</li>
        <li><strong>{{ precisionGeneral }} %</strong> precision</li>
      </ul>
    </header>

    <MensajeEstado v-if="errorGeneral" tipo="error">{{ errorGeneral.message }}</MensajeEstado>

    <!-- Aviso al invitado: su historial depende de esta sesion -->
    <section v-if="esInvitado" class="tarjeta tarjeta--invitacion" data-prueba="aviso-invitado">
      <div>
        <h2>Estas como invitado</h2>
        <p class="texto-secundario">
          Tu progreso esta guardado en esta sesion. <strong>Si cerras sesion, borras los datos del
          navegador o cambias de dispositivo, perdes el acceso a tu historial.</strong> Creando una cuenta
          lo conservas: sigue siendo tuyo, sin empezar de cero.
        </p>
      </div>
      <BaseBoton :to="{ name: 'registro' }">Crear mi cuenta</BaseBoton>
    </section>

    <!-- Seguridad de la cuenta -->
    <section v-if="esCuenta" class="tarjeta">
      <h2>Seguridad</h2>
      <p class="texto-secundario">Tu contrasena esta guardada de forma cifrada: nadie puede verla, ni nosotros.</p>
      <div>
        <BaseBoton variante="contorno" tamano="chico" :to="{ name: 'nueva-clave' }">Cambiar mi contrasena</BaseBoton>
      </div>
    </section>

    <!-- Que datos hay -->
    <AvisoDatos />

    <!-- Meta diaria -->
    <section class="tarjeta">
      <h2>Meta diaria</h2>
      <p class="texto-secundario">
        Llevas <strong>{{ estado.xpDeHoy }}</strong> de {{ estado.metaDiaria }} XP de hoy.
        <span v-if="metaCumplida" class="meta-lista">
          <Icono nombre="chispas" :tamano="15" /> Meta cumplida!
        </span>
      </p>
      <BarraProgreso
        :valor="estado.xpDeHoy"
        :maximo="estado.metaDiaria"
        color="var(--c-amarillo)"
        etiqueta="Meta diaria de XP"
      />
      <div class="metas">
        <button
          v-for="meta in METAS"
          :key="meta"
          type="button"
          class="meta"
          :class="{ 'meta--activa': estado.metaDiaria === meta }"
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
          {{ medallas.filter((m) => m.obtenida).length }} / {{ medallas.length }}
        </span>
      </div>

      <ul class="medallas anim-lista">
        <li v-for="medalla in medallas" :key="medalla.codigo">
          <MedallaCard :medalla="medalla" />
        </li>
      </ul>
    </section>

    <!-- Calendario de actividad -->
    <section class="tarjeta">
      <h2>Tu actividad</h2>
      <CalendarioActividad :actividad="estado.actividad" />
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

    <!-- Lecciones: completadas, pendientes y resultados personales -->
    <section class="tarjeta" data-prueba="mis-lecciones">
      <div class="tarjeta__cabecera">
        <h2>Tus lecciones</h2>
        <span class="tarjeta__dato">
          {{ totalLeccionesCompletadas }} completadas · {{ cantidadPendientes }} pendientes
        </span>
      </div>
      <p class="texto-secundario">
        El <strong>mejor resultado</strong> es el que cuenta para avanzar. El <strong>ultimo
        intento</strong> es como te fue la ultima vez.
      </p>

      <ul class="lecciones">
        <li
          v-for="leccion in misLecciones"
          :key="leccion.id"
          class="leccion-fila"
          :data-leccion="leccion.id"
          :data-situacion="leccion.situacion"
        >
          <div class="leccion-fila__texto">
            <router-link :to="{ name: 'leccion', params: { leccionId: leccion.id } }" class="leccion-fila__titulo">
              {{ leccion.titulo }}
            </router-link>
            <p class="leccion-fila__datos">
              <span v-if="leccion.mejor !== null">Mejor: {{ leccion.mejor }} %</span>
              <span v-if="leccion.ultimo" data-prueba="ultimo">
                Ultimo: {{ leccion.ultimo.aciertos }}/{{ leccion.ultimo.total }}
                ({{ ETIQUETA_ESTADO_INTENTO[leccion.ultimo.estado].toLowerCase() }})
              </span>
              <span v-if="leccion.cantidad">
                {{ leccion.cantidad }} {{ leccion.cantidad === 1 ? 'intento' : 'intentos' }}
              </span>
            </p>
          </div>
          <span class="situacion" :class="`situacion--${leccion.situacion}`">
            {{ ESTADO_LECCION[leccion.situacion] }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Historial completo de intentos -->
    <section class="tarjeta" data-prueba="historial">
      <div class="tarjeta__cabecera">
        <h2>Historial de intentos</h2>
        <span class="tarjeta__dato">{{ estado.intentos.length }}</span>
      </div>

      <p v-if="estado.intentos.length === 0" class="texto-secundario">
        Todavia no hiciste ninguna leccion. Cada vez que empieces una va a quedar registrada aca.
      </p>

      <ol v-else class="historial">
        <li
          v-for="intento in historialVisible"
          :key="intento.id"
          class="historial__fila"
          :data-intento="intento.id"
          :data-estado="intento.estado"
        >
          <span class="historial__fecha">{{ fechaCorta(intento.fecha) }}</span>
          <span class="historial__leccion">
            {{ tituloDe(intento.leccionId) }} <small>· intento {{ intento.numero }}</small>
          </span>
          <span class="historial__puntaje">{{ intento.aciertos }}/{{ intento.total }}</span>
          <span class="historial__estado" :class="`historial__estado--${intento.estado}`">
            {{ ETIQUETA_ESTADO_INTENTO[intento.estado] }}<template v-if="intento.aprobado"> · aprobado</template>
          </span>
          <span v-if="intento.origen === 'etapa4'" class="historial__origen" title="Registrado antes de que el servidor corrigiera los intentos">
            anterior
          </span>
        </li>
      </ol>

      <div v-if="estado.intentos.length > MOSTRAR_DE_A">
        <BaseBoton tamano="chico" variante="texto" @click="mostrarTodo = !mostrarTodo">
          {{ mostrarTodo ? 'Ver menos' : `Ver los ${estado.intentos.length} intentos` }}
        </BaseBoton>
      </div>
    </section>

    <!-- Borrar el historial -->
    <section class="tarjeta tarjeta--peligro">
      <h2>Reiniciar progreso</h2>
      <p class="texto-secundario">
        Borra tu historial (XP, racha y lecciones completadas) para empezar el curso desde cero. No se
        puede deshacer.
      </p>
      <BaseBoton variante="peligro" @click="confirmarReinicio">Borrar mi historial</BaseBoton>
    </section>
  </div>
</template>

<style scoped>
.perfil {
  display: grid;
  /* minmax(0, 1fr) y no "auto": una columna automatica crece hasta el contenido mas
     ancho (aca, un alias largo) y arrastra a todas las tarjetas fuera de la pantalla. */
  grid-template-columns: minmax(0, 1fr);
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

.cabecera__datos {
  min-width: 0;
}

.cabecera__datos h1 {
  font-size: var(--t-xl);
  /* El alias con su codigo (Ana#0427) puede ser largo: se parte en vez de desbordar. */
  overflow-wrap: anywhere;
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

.lecciones,
.historial {
  display: grid;
  gap: var(--e-1);
}

.leccion-fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--e-2);
  border-top: 1px solid var(--c-borde);
  padding-top: var(--e-1);
}

.leccion-fila__titulo {
  font-weight: 800;
}

.leccion-fila__titulo:hover {
  color: var(--c-verde-osc);
  text-decoration: underline;
}

.leccion-fila__datos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem var(--e-2);
  font-size: var(--t-xs);
  color: var(--c-gris);
  font-weight: 700;
}

.situacion {
  font-size: var(--t-xs);
  font-weight: 800;
  border-radius: var(--r-full);
  padding: 0.2rem 0.7rem;
  background: var(--c-fondo);
  color: var(--c-gris);
  white-space: nowrap;
}

.situacion--aprobada {
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.situacion--completada,
.situacion--en_curso {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
}

.situacion--pendiente {
  background: var(--c-azul-suave);
  color: var(--c-azul-osc);
}

.historial__fila {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr) auto auto auto;
  align-items: baseline;
  gap: var(--e-2);
  font-size: var(--t-sm);
  border-top: 1px solid var(--c-borde);
  padding-top: var(--e-1);
}

.historial__fecha {
  color: var(--c-gris);
  font-variant-numeric: tabular-nums;
}

.historial__leccion {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.historial__leccion small {
  color: var(--c-gris);
  font-weight: 600;
}

.historial__puntaje {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.historial__estado {
  font-size: var(--t-xs);
  font-weight: 800;
  color: var(--c-gris);
}

.historial__estado--completado {
  color: var(--c-verde-osc);
}

.historial__estado--sin_vidas {
  color: var(--c-rojo-osc);
}

.historial__origen {
  font-size: var(--t-xs);
  color: var(--c-gris);
  border: 1px dashed var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0 0.35rem;
}

@media (max-width: 860px) {
  .cabecera {
    grid-template-columns: auto minmax(0, 1fr);
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

@media (max-width: 560px) {
  /* En el celular cada intento ocupa dos renglones: fecha y estado arriba, la
     leccion y el puntaje abajo. */
  .historial__fila {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .historial__leccion {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

@media (max-width: 480px) {
  /* En el celular el avatar va arriba y los datos debajo, con todo el ancho. */
  .cabecera {
    grid-template-columns: minmax(0, 1fr);
    padding: var(--e-3);
  }
  .cabecera__avatar {
    width: 72px;
    height: 72px;
  }
}

.cabecera__correo {
  font-family: var(--f-codigo);
  font-size: var(--t-sm);
  color: var(--c-gris);
  word-break: break-all;
}

.edicion {
  display: grid;
  gap: var(--e-2);
  max-width: 340px;
}

.insignia--invitado {
  background: var(--c-amarillo-suave);
  color: var(--c-amarillo-osc);
  border: 2px dashed var(--c-amarillo);
}

.insignia--cuenta {
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}
</style>
