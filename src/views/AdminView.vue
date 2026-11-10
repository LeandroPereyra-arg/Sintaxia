<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'
import EditorPregunta from '@/components/admin/EditorPregunta.vue'
import * as admin from '@/servicios/admin.js'

/**
 * Panel de administracion (etapa 7): contenidos (cursos, unidades, lecciones,
 * preguntas y opciones) y eventos de expo (eventos, desafios y su banco).
 *
 * Todo lo que escribe pasa por funciones del servidor que verifican el rol
 * (supabase/16-administracion.sql). Si alguien sin permiso llega aca, la
 * pantalla lo dice; y aunque forzara las llamadas, la base las rechaza.
 */

const permiso = ref(null) // null = verificando
const pestana = ref(leer('admin:pestana', 'contenido'))
const mensaje = ref('')
const errorGeneral = ref(null)

function leer(clave, defecto) {
  try {
    return localStorage.getItem(clave) ?? defecto
  } catch {
    return defecto
  }
}
function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    // sin almacenamiento: los filtros no se recuerdan
  }
}
watch(pestana, (v) => guardarPreferencia('admin:pestana', v))

// ---------------------------------------------------------------------------
// Definicion de formularios
// ---------------------------------------------------------------------------
const ESTADOS = {
  curso: ['borrador', 'proximamente', 'disponible', 'bloqueado'],
  unidad: ['borrador', 'proximamente', 'publicada'],
  leccion: ['borrador', 'publicada'],
  pregunta: ['borrador', 'publicada'],
  desafio: ['borrador', 'publicado', 'cerrado']
}
const PUBLICADO = { curso: 'disponible', unidad: 'publicada', leccion: 'publicada', pregunta: 'publicada' }

const CAMPOS = {
  curso: [
    { n: 'id', t: 'id' }, { n: 'nombre', r: true }, { n: 'descripcion', t: 'area', r: true },
    { n: 'nivel', t: 'select', o: ['Principiante', 'Intermedio', 'Avanzado'] },
    { n: 'icono', r: true }, { n: 'color', r: true, p: '#2fbf56' }, { n: 'color_texto', r: true, p: '#ffffff' },
    { n: 'orden', t: 'number', r: true }, { n: 'estado', t: 'select', o: ESTADOS.curso }, { n: 'requisito' }
  ],
  unidad: [
    { n: 'id', t: 'id' }, { n: 'orden', t: 'number', r: true }, { n: 'titulo', r: true },
    { n: 'descripcion', t: 'area', r: true }, { n: 'icono', r: true }, { n: 'color', r: true, p: '#2fbf56' },
    { n: 'estado', t: 'select', o: ESTADOS.unidad }
  ],
  leccion: [
    { n: 'id', t: 'id' }, { n: 'orden', t: 'number', r: true }, { n: 'titulo', r: true },
    { n: 'descripcion', t: 'area', r: true }, { n: 'icono', r: true }, { n: 'xp', t: 'number', r: true },
    { n: 'explicacion', t: 'area', r: true }, { n: 'ejemplo_titulo' }, { n: 'ejemplo_codigo', t: 'area' },
    { n: 'ejemplo_nota' }, { n: 'estado', t: 'select', o: ESTADOS.leccion }
  ],
  evento: [
    { n: 'id', t: 'id' }, { n: 'nombre', r: true }, { n: 'descripcion', t: 'area' }, { n: 'lugar' },
    { n: 'abre_en', t: 'fecha' }, { n: 'cierra_en', t: 'fecha' }
  ],
  desafio: [
    { n: 'id', t: 'id' }, { n: 'orden', t: 'number', r: true }, { n: 'nombre', r: true }, { n: 'descripcion', t: 'area' },
    { n: 'dificultad', t: 'select', o: ['facil', 'media', 'dificil'] },
    { n: 'duracion_segundos', t: 'number', r: true, regla: true }, { n: 'puntos_por_acierto', t: 'number', r: true, regla: true },
    { n: 'intentos_permitidos', t: 'number', r: true, regla: true }, { n: 'gracia_segundos', t: 'number', r: true, regla: true },
    { n: 'estado', t: 'select', o: ESTADOS.desafio }
  ]
}

const NUEVOS = {
  curso: () => ({ id: '', nombre: '', descripcion: '', nivel: 'Principiante', icono: 'JS', color: '#2fbf56', color_texto: '#ffffff', orden: cursos.value.length + 1, estado: 'borrador', requisito: '' }),
  unidad: () => ({ id: '', curso_id: filtro.curso, orden: unidades.value.length + 1, titulo: '', descripcion: '', icono: 'cohete', color: '#2fbf56', estado: 'borrador' }),
  leccion: () => ({ id: '', unidad_id: filtro.unidad, orden: lecciones.value.length + 1, titulo: '', descripcion: '', icono: 'libro', xp: 10, explicacion: '', ejemplo_titulo: '', ejemplo_codigo: '', ejemplo_nota: '', estado: 'borrador' }),
  evento: () => ({ id: '', nombre: '', descripcion: '', lugar: '', abre_en: '', cierra_en: '' }),
  desafio: () => ({ id: '', evento_id: seleccion.evento, orden: desafios.value.length + 1, nombre: '', descripcion: '', dificultad: 'media', duracion_segundos: 120, puntos_por_acierto: 100, intentos_permitidos: 3, gracia_segundos: 5, estado: 'borrador' })
}

const GUARDAR = {
  curso: admin.guardarCurso,
  unidad: admin.guardarUnidad,
  leccion: admin.guardarLeccion,
  evento: admin.guardarEvento,
  desafio: admin.guardarDesafio
}

// Formulario abierto: { tipo, datos, nuevo, bloqueado }
const edicion = ref(null)
const guardando = ref(false)
const errorEdicion = ref(null)

function abrir(tipo, datos = null) {
  errorEdicion.value = null
  const copia = datos ? { ...datos } : NUEVOS[tipo]()
  for (const c of CAMPOS[tipo] ?? []) {
    if (c.t === 'fecha' && copia[c.n]) copia[c.n] = String(copia[c.n]).slice(0, 16)
  }
  edicion.value = { tipo, datos: copia, nuevo: !datos, bloqueado: tipo === 'desafio' && Boolean(datos?.congelado_en) }
}

const faltantes = computed(() => {
  if (!edicion.value || !CAMPOS[edicion.value.tipo]) return []
  const d = edicion.value.datos
  return CAMPOS[edicion.value.tipo]
    .filter((c) => (c.r || c.t === 'id') && (d[c.n] === '' || d[c.n] === null || d[c.n] === undefined))
    .map((c) => c.n)
})

async function guardarFormulario() {
  if (faltantes.value.length) return
  guardando.value = true
  errorEdicion.value = null
  try {
    const datos = { ...edicion.value.datos }
    for (const c of CAMPOS[edicion.value.tipo]) {
      if (c.t === 'fecha') datos[c.n] = datos[c.n] ? new Date(datos[c.n]).toISOString() : ''
    }
    await GUARDAR[edicion.value.tipo](datos)
    avisar(`Guardado: ${datos.id}`)
    const tipo = edicion.value.tipo
    edicion.value = null
    await recargar(tipo)
  } catch (e) {
    errorEdicion.value = e
  } finally {
    guardando.value = false
  }
}

function avisar(texto) {
  mensaje.value = texto
  errorGeneral.value = null
  setTimeout(() => (mensaje.value === texto ? (mensaje.value = '') : null), 4000)
}

async function intentar(accion, exito) {
  errorGeneral.value = null
  try {
    await accion()
    if (exito) avisar(exito)
  } catch (e) {
    errorGeneral.value = e
  }
}

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------
const cursos = ref([])
const unidades = ref([])
const lecciones = ref([])
const preguntas = ref([])
const filtro = reactive({
  curso: leer('admin:curso', ''),
  unidad: leer('admin:unidad', ''),
  leccion: leer('admin:leccion', ''),
  estado: leer('admin:estado', 'todos'),
  texto: ''
})
watch(() => [filtro.curso, filtro.unidad, filtro.leccion, filtro.estado], () => {
  guardarPreferencia('admin:curso', filtro.curso)
  guardarPreferencia('admin:unidad', filtro.unidad)
  guardarPreferencia('admin:leccion', filtro.leccion)
  guardarPreferencia('admin:estado', filtro.estado)
})

function filtrar(lista, campoTexto) {
  const t = filtro.texto.trim().toLowerCase()
  return lista
    .filter((x) => filtro.estado === 'todos'
      || (filtro.estado === 'publicado' ? ['publicada', 'disponible'].includes(x.estado) : !['publicada', 'disponible'].includes(x.estado)))
    .filter((x) => !t || `${x.id} ${x[campoTexto] ?? ''}`.toLowerCase().includes(t))
    .sort((a, b) => a.orden - b.orden)
}

async function cargarCursos() {
  cursos.value = await admin.listarCursos()
  if (!cursos.value.some((c) => c.id === filtro.curso)) filtro.curso = cursos.value[0]?.id ?? ''
}
async function cargarUnidades() {
  unidades.value = filtro.curso ? await admin.listarUnidades(filtro.curso) : []
  if (!unidades.value.some((u) => u.id === filtro.unidad)) filtro.unidad = unidades.value[0]?.id ?? ''
}
async function cargarLecciones() {
  lecciones.value = filtro.unidad ? await admin.listarLecciones(filtro.unidad) : []
  if (!lecciones.value.some((l) => l.id === filtro.leccion)) filtro.leccion = lecciones.value[0]?.id ?? ''
}
async function cargarPreguntas() {
  preguntas.value = filtro.leccion ? await admin.listarPreguntas(filtro.leccion) : []
}

watch(() => filtro.curso, () => intentar(cargarUnidades))
watch(() => filtro.unidad, () => intentar(cargarLecciones))
watch(() => filtro.leccion, () => intentar(cargarPreguntas))

async function recargar(tipo) {
  if (tipo === 'curso') await cargarCursos()
  if (tipo === 'unidad') await cargarUnidades()
  if (tipo === 'leccion') await cargarLecciones()
  if (tipo === 'pregunta') await cargarPreguntas()
  if (tipo === 'evento') await cargarEventos()
  if (tipo === 'desafio') await cargarDesafios()
  if (tipo === 'pregunta_desafio') await cargarBanco()
}

function estaPublicado(tipo, x) {
  return x.estado === PUBLICADO[tipo]
}

function alternarPublicacion(tipo, x) {
  const nuevo = estaPublicado(tipo, x) ? 'borrador' : PUBLICADO[tipo]
  intentar(async () => {
    await admin.cambiarEstado(tipo, x.id, nuevo)
    await recargar(tipo)
  }, `${x.id}: ${nuevo}`)
}

function eliminar(tipo, x) {
  const confirmacion = window.prompt(
    `Eliminar "${x.id}" no se puede deshacer. Si tiene historial no se va a poder (despublicalo).\nEscribi el id para confirmar:`
  )
  if (confirmacion === null) return
  intentar(async () => {
    await admin.eliminar(tipo, x.id, confirmacion)
    await recargar(tipo)
  }, `Eliminado: ${x.id}`)
}

// Preguntas de practica (con su solucion, solo por funcion admin)
const preguntaEditada = ref(null)
const preguntaNueva = ref(false)
const errorPregunta = ref(null)

async function editarPregunta(q) {
  errorPregunta.value = null
  if (q) {
    await intentar(async () => {
      preguntaEditada.value = await admin.obtenerPregunta(q.id)
      preguntaNueva.value = false
    })
  } else {
    preguntaEditada.value = { id: `${filtro.leccion}-a${preguntas.value.length + 1}`, orden: preguntas.value.length + 1 }
    preguntaNueva.value = true
  }
}

async function guardarPregunta(datos) {
  guardando.value = true
  errorPregunta.value = null
  try {
    await admin.guardarPregunta({ ...datos, leccion_id: filtro.leccion })
    preguntaEditada.value = null
    avisar(`Guardado: ${datos.id}`)
    await cargarPreguntas()
  } catch (e) {
    errorPregunta.value = e
  } finally {
    guardando.value = false
  }
}

// ---------------------------------------------------------------------------
// Eventos y desafios
// ---------------------------------------------------------------------------
const eventos = ref([])
const desafios = ref([])
const banco = ref([])
const seleccion = reactive({ evento: leer('admin:evento', ''), desafio: '' })
watch(() => seleccion.evento, (v) => {
  guardarPreferencia('admin:evento', v)
  intentar(cargarDesafios)
})
watch(() => seleccion.desafio, () => intentar(cargarBanco))

const desafioActual = computed(() => desafios.value.find((d) => d.id === seleccion.desafio) ?? null)

async function cargarEventos() {
  eventos.value = await admin.listarEventosAdmin()
  if (!eventos.value.some((e) => e.id === seleccion.evento)) seleccion.evento = eventos.value[0]?.id ?? ''
}
async function cargarDesafios() {
  desafios.value = seleccion.evento ? await admin.listarDesafiosAdmin(seleccion.evento) : []
  if (!desafios.value.some((d) => d.id === seleccion.desafio)) seleccion.desafio = desafios.value[0]?.id ?? ''
}
async function cargarBanco() {
  banco.value = seleccion.desafio ? await admin.listarBanco(seleccion.desafio) : []
}

function cambiarEstadoEvento(ev, estado) {
  if (estado === 'cerrado' && !window.confirm(`Cerrar "${ev.nombre}"? Las partidas en curso quedan vencidas y no se puede seguir jugando.`)) return
  intentar(async () => {
    await admin.cambiarEstadoEvento(ev.id, estado)
    await cargarEventos()
  }, `${ev.id}: ${estado}`)
}

function nuevaVersion(d) {
  const nuevoId = window.prompt('Id de la nueva version:', `${d.id}-v${d.version + 1}`)
  if (!nuevoId) return
  intentar(async () => {
    await admin.nuevaVersionDesafio(d.id, nuevoId)
    await cargarDesafios()
    seleccion.desafio = nuevoId
  }, `Nueva version: ${nuevoId}`)
}

const preguntaDesafio = ref(null)
const preguntaDesafioNueva = ref(false)
const errorPreguntaDesafio = ref(null)

function editarPreguntaDesafio(q) {
  errorPreguntaDesafio.value = null
  preguntaDesafioNueva.value = !q
  preguntaDesafio.value = q ?? { id: `${seleccion.desafio}-${banco.value.length + 1}`, orden: banco.value.length + 1, estado: 'publicada' }
}

async function guardarPreguntaDesafio(datos) {
  guardando.value = true
  errorPreguntaDesafio.value = null
  try {
    await admin.guardarPreguntaDesafio({ ...datos, desafio_id: seleccion.desafio })
    preguntaDesafio.value = null
    avisar(`Guardado: ${datos.id}`)
    await cargarBanco()
  } catch (e) {
    errorPreguntaDesafio.value = e
  } finally {
    guardando.value = false
  }
}

// ---------------------------------------------------------------------------
onMounted(async () => {
  permiso.value = await admin.soyAdmin()
  if (!permiso.value) return
  await intentar(async () => {
    await cargarCursos()
    await cargarUnidades()
    await cargarLecciones()
    await cargarPreguntas()
    await cargarEventos()
    await cargarDesafios()
    await cargarBanco()
  })
})

const etiqueta = (n) => n.replace(/_/g, ' ')
</script>

<template>
  <div class="admin seccion contenedor">
    <h1>Administracion</h1>

    <p v-if="permiso === null" class="texto-secundario">Verificando permisos...</p>

    <MensajeEstado v-else-if="!permiso" tipo="error" data-prueba="sin-permiso">
      <p>
        <strong>No tenes permiso de administrador.</strong> El rol lo otorga el equipo desde el servidor;
        no se puede pedir ni activar desde la app.
      </p>
    </MensajeEstado>

    <template v-else>
      <nav class="pestanas" aria-label="Secciones">
        <button type="button" :class="{ activa: pestana === 'contenido' }" @click="pestana = 'contenido'">Contenido</button>
        <button type="button" :class="{ activa: pestana === 'eventos' }" @click="pestana = 'eventos'">Eventos de expo</button>
      </nav>

      <MensajeEstado v-if="mensaje" tipo="exito" data-prueba="aviso-admin">{{ mensaje }}</MensajeEstado>
      <MensajeEstado v-if="errorGeneral" tipo="error" data-prueba="error-admin">{{ errorGeneral.message }}</MensajeEstado>

      <!-- Formulario generico (curso, unidad, leccion, evento, desafio) -->
      <section v-if="edicion" class="tarjeta formulario" data-prueba="formulario">
        <h2>{{ edicion.nuevo ? 'Nuevo' : 'Editar' }} {{ edicion.tipo }}</h2>
        <MensajeEstado v-if="edicion.bloqueado" tipo="alerta">
          <p>Este desafio ya tiene partidas: sus reglas no se pueden cambiar (si el estado, el nombre y la descripcion). Para otras reglas, crea otra version.</p>
        </MensajeEstado>
        <form novalidate @submit.prevent="guardarFormulario">
          <div class="campos">
            <label v-for="c in CAMPOS[edicion.tipo]" :key="c.n" :class="{ ancho: c.t === 'area' }">
              {{ etiqueta(c.n) }}{{ c.r || c.t === 'id' ? ' *' : '' }}
              <select v-if="c.t === 'select'" v-model="edicion.datos[c.n]" :name="c.n">
                <option v-for="o in c.o" :key="o" :value="o">{{ o }}</option>
              </select>
              <textarea v-else-if="c.t === 'area'" v-model="edicion.datos[c.n]" rows="3" :name="c.n"></textarea>
              <input
                v-else
                v-model="edicion.datos[c.n]"
                :type="c.t === 'number' ? 'number' : c.t === 'fecha' ? 'datetime-local' : 'text'"
                :placeholder="c.p"
                :disabled="(c.t === 'id' && !edicion.nuevo) || (c.regla && edicion.bloqueado)"
                :name="c.n"
              />
            </label>
          </div>
          <p v-if="faltantes.length" class="faltan" data-prueba="faltantes">Faltan: {{ faltantes.map(etiqueta).join(', ') }}</p>
          <MensajeEstado v-if="errorEdicion" tipo="error" data-prueba="error-formulario">{{ errorEdicion.message }}</MensajeEstado>
          <div class="acciones">
            <BaseBoton type="submit" tamano="chico" :deshabilitado="guardando || faltantes.length > 0">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </BaseBoton>
            <BaseBoton tamano="chico" variante="texto" @click="edicion = null">Cancelar</BaseBoton>
          </div>
        </form>
      </section>

      <!-- ===================== CONTENIDO ===================== -->
      <template v-if="pestana === 'contenido'">
        <section class="tarjeta filtros">
          <label>Curso
            <select v-model="filtro.curso" name="filtro-curso">
              <option v-for="c in cursos" :key="c.id" :value="c.id">{{ c.orden }}. {{ c.nombre }} ({{ c.estado }})</option>
            </select>
          </label>
          <label>Unidad
            <select v-model="filtro.unidad" name="filtro-unidad">
              <option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.orden }}. {{ u.titulo }} ({{ u.estado }})</option>
            </select>
          </label>
          <label>Leccion
            <select v-model="filtro.leccion" name="filtro-leccion">
              <option v-for="l in lecciones" :key="l.id" :value="l.id">{{ l.orden }}. {{ l.titulo }} ({{ l.estado }})</option>
            </select>
          </label>
          <label>Estado
            <select v-model="filtro.estado" name="filtro-estado">
              <option value="todos">Todos</option>
              <option value="publicado">Publicados</option>
              <option value="borrador">No publicados</option>
            </select>
          </label>
          <label>Buscar <input v-model="filtro.texto" type="search" name="filtro-texto" /></label>
        </section>

        <div class="listas">
          <section v-for="[tipo, lista, campo] in [['curso', cursos, 'nombre'], ['unidad', unidades, 'titulo'], ['leccion', lecciones, 'titulo']]" :key="tipo" class="tarjeta" :data-lista="tipo">
            <div class="tarjeta__cabecera">
              <h2>{{ tipo === 'curso' ? 'Cursos' : tipo === 'unidad' ? 'Unidades' : 'Lecciones' }}</h2>
              <BaseBoton tamano="chico" variante="contorno" :deshabilitado="(tipo === 'unidad' && !filtro.curso) || (tipo === 'leccion' && !filtro.unidad)" @click="abrir(tipo)">+ Nuevo</BaseBoton>
            </div>
            <ul class="items">
              <li v-for="x in filtrar(lista, campo)" :key="x.id" class="item" :data-id="x.id" :data-estado="x.estado">
                <span class="item__texto"><strong>{{ x.orden }}. {{ x[campo] }}</strong> <small>{{ x.id }}</small></span>
                <span class="estado" :class="{ 'estado--ok': estaPublicado(tipo, x) }">{{ x.estado }}</span>
                <span class="item__acciones">
                  <button type="button" @click="abrir(tipo, x)">Editar</button>
                  <button type="button" @click="alternarPublicacion(tipo, x)">{{ estaPublicado(tipo, x) ? 'Despublicar' : 'Publicar' }}</button>
                  <button type="button" class="peligro" @click="eliminar(tipo, x)">Eliminar</button>
                </span>
              </li>
            </ul>
          </section>

          <section class="tarjeta" data-lista="pregunta">
            <div class="tarjeta__cabecera">
              <h2>Preguntas</h2>
              <BaseBoton tamano="chico" variante="contorno" :deshabilitado="!filtro.leccion" @click="editarPregunta(null)">+ Nueva</BaseBoton>
            </div>
            <EditorPregunta
              v-if="preguntaEditada"
              :pregunta="preguntaEditada"
              :nueva="preguntaNueva"
              :guardando="guardando"
              :error="errorPregunta"
              @guardar="guardarPregunta"
              @cancelar="preguntaEditada = null"
            />
            <ul class="items">
              <li v-for="q in filtrar(preguntas, 'enunciado')" :key="q.id" class="item" :data-id="q.id" :data-estado="q.estado">
                <span class="item__texto"><strong>{{ q.orden }}. {{ q.enunciado }}</strong> <small>{{ q.id }}</small></span>
                <span class="estado" :class="{ 'estado--ok': q.estado === 'publicada' }">{{ q.estado }}</span>
                <span class="item__acciones">
                  <button type="button" @click="editarPregunta(q)">Editar</button>
                  <button type="button" @click="alternarPublicacion('pregunta', q)">{{ q.estado === 'publicada' ? 'Despublicar' : 'Publicar' }}</button>
                  <button type="button" class="peligro" @click="eliminar('pregunta', q)">Eliminar</button>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </template>

      <!-- ===================== EVENTOS ===================== -->
      <template v-else>
        <div class="listas">
          <section class="tarjeta" data-lista="evento">
            <div class="tarjeta__cabecera">
              <h2>Eventos</h2>
              <BaseBoton tamano="chico" variante="contorno" @click="abrir('evento')">+ Nuevo</BaseBoton>
            </div>
            <ul class="items">
              <li v-for="ev in eventos" :key="ev.id" class="item" :class="{ 'item--sel': ev.id === seleccion.evento }" :data-id="ev.id" :data-estado="ev.estado">
                <button type="button" class="item__texto sel" @click="seleccion.evento = ev.id"><strong>{{ ev.nombre }}</strong> <small>{{ ev.id }}</small></button>
                <span class="estado" :class="{ 'estado--ok': ev.estado === 'abierto' }">{{ ev.estado }}</span>
                <span class="item__acciones">
                  <button type="button" @click="abrir('evento', ev)">Editar</button>
                  <button v-if="ev.estado !== 'abierto'" type="button" @click="cambiarEstadoEvento(ev, 'abierto')">Abrir</button>
                  <button v-if="ev.estado === 'abierto'" type="button" class="peligro" @click="cambiarEstadoEvento(ev, 'cerrado')">Cerrar</button>
                  <button v-if="ev.estado === 'cerrado'" type="button" @click="cambiarEstadoEvento(ev, 'preparacion')">A preparacion</button>
                </span>
              </li>
            </ul>
          </section>

          <section class="tarjeta" data-lista="desafio">
            <div class="tarjeta__cabecera">
              <h2>Desafios</h2>
              <BaseBoton tamano="chico" variante="contorno" :deshabilitado="!seleccion.evento" @click="abrir('desafio')">+ Nuevo</BaseBoton>
            </div>
            <ul class="items">
              <li v-for="d in desafios" :key="d.id" class="item" :class="{ 'item--sel': d.id === seleccion.desafio }" :data-id="d.id" :data-estado="d.estado">
                <button type="button" class="item__texto sel" @click="seleccion.desafio = d.id">
                  <strong>{{ d.orden }}. {{ d.nombre }}</strong>
                  <small>{{ d.id }} · v{{ d.version }} · {{ d.duracion_segundos }} s · {{ d.puntos_por_acierto }} pts · {{ d.intentos_permitidos }} intentos</small>
                </button>
                <span class="estado" :class="{ 'estado--ok': d.estado === 'publicado' }">{{ d.estado }}{{ d.congelado_en ? ' · congelado' : '' }}</span>
                <span class="item__acciones">
                  <button type="button" @click="abrir('desafio', d)">Editar</button>
                  <button v-if="d.congelado_en" type="button" @click="nuevaVersion(d)">Nueva version</button>
                  <button type="button" class="peligro" @click="eliminar('desafio', d)">Eliminar</button>
                </span>
              </li>
            </ul>
          </section>

          <section class="tarjeta" data-lista="banco">
            <div class="tarjeta__cabecera">
              <h2>Banco del desafio <small v-if="desafioActual">{{ desafioActual.nombre }}</small></h2>
              <BaseBoton tamano="chico" variante="contorno" :deshabilitado="!seleccion.desafio || Boolean(desafioActual?.congelado_en)" @click="editarPreguntaDesafio(null)">+ Nueva</BaseBoton>
            </div>
            <EditorPregunta
              v-if="preguntaDesafio"
              modo="desafio"
              :pregunta="preguntaDesafio"
              :nueva="preguntaDesafioNueva"
              :bloqueada="Boolean(desafioActual?.congelado_en)"
              :guardando="guardando"
              :error="errorPreguntaDesafio"
              @guardar="guardarPreguntaDesafio"
              @cancelar="preguntaDesafio = null"
            />
            <ul class="items">
              <li v-for="q in banco" :key="q.id" class="item item--banco" :data-id="q.id">
                <span class="item__texto">
                  <strong>{{ q.orden }}. {{ q.enunciado }}</strong>
                  <small>Correcta: {{ q.opciones.find((o) => o.es_correcta)?.texto }}</small>
                </span>
                <span class="item__acciones">
                  <button type="button" @click="editarPreguntaDesafio(q)">{{ desafioActual?.congelado_en ? 'Ver' : 'Editar' }}</button>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  gap: var(--e-3);
}

.pestanas {
  display: flex;
  gap: var(--e-1);
  flex-wrap: wrap;
}

.pestanas button {
  font-weight: 800;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 2px solid var(--c-borde);
  background: var(--c-blanco);
}

.pestanas .activa {
  border-color: var(--c-violeta);
  background: var(--c-violeta-suave);
  color: var(--c-violeta-osc);
}

.tarjeta {
  background: var(--c-blanco);
  border: 2px solid var(--c-borde);
  border-radius: var(--r-lg);
  padding: var(--e-3);
  display: grid;
  gap: var(--e-2);
  min-width: 0;
}

.tarjeta__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--e-2);
}

.tarjeta h2 small {
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.filtros {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

label {
  display: grid;
  gap: 0.25rem;
  font-size: var(--t-sm);
  font-weight: 700;
  text-transform: capitalize;
}

input,
textarea,
select {
  font: inherit;
  font-weight: 500;
  text-transform: none;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.6rem;
  min-width: 0;
}

.campos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--e-2);
}

.campos .ancho {
  grid-column: 1 / -1;
}

.faltan {
  font-size: var(--t-sm);
  color: var(--c-amarillo-osc);
  font-weight: 700;
}

.acciones {
  display: flex;
  gap: var(--e-2);
  margin-top: var(--e-2);
}

.listas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: var(--e-3);
}

.items {
  display: grid;
  gap: var(--e-1);
}

.item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.3rem var(--e-2);
  align-items: center;
  border-top: 1px solid var(--c-borde);
  padding-top: var(--e-1);
}

.item--sel {
  background: var(--c-violeta-suave);
  border-radius: var(--r-sm);
}

.item__texto {
  overflow-wrap: anywhere;
  text-align: left;
}

.item__texto small {
  display: block;
  color: var(--c-gris);
}

.sel {
  font: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.estado {
  font-size: var(--t-xs);
  font-weight: 800;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  background: var(--c-fondo);
  color: var(--c-gris);
  white-space: nowrap;
}

.estado--ok {
  background: var(--c-verde-suave);
  color: var(--c-verde-osc);
}

.item__acciones {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  font-size: var(--t-sm);
  font-weight: 700;
}

.item__acciones button {
  color: var(--c-azul-osc);
}

.item__acciones .peligro {
  color: var(--c-rojo-osc);
}
</style>
