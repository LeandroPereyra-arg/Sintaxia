<script setup>
import { computed, reactive, watch } from 'vue'
import BaseBoton from '@/components/BaseBoton.vue'
import MensajeEstado from '@/components/MensajeEstado.vue'

/**
 * Editor de una pregunta de opcion multiple con su solucion (panel de
 * administracion). Valida lo mismo que el servidor antes de mandar: al menos dos
 * opciones, sin texto vacio ni repetido y exactamente una correcta. El servidor
 * vuelve a validar (16-administracion.sql): esto es solo para avisar antes.
 */
const props = defineProps({
  /** { id, orden, enunciado, codigo, explicacion, estado, opciones: [{ id, texto, es_correcta }] } */
  pregunta: { type: Object, required: true },
  nueva: { type: Boolean, default: false },
  /** 'practica' (estados borrador/publicada) o 'desafio' */
  modo: { type: String, default: 'practica' },
  bloqueada: { type: Boolean, default: false },
  guardando: { type: Boolean, default: false },
  error: { type: Object, default: null }
})

const emit = defineEmits(['guardar', 'cancelar'])

const f = reactive({})
watch(
  () => props.pregunta,
  (p) => {
    Object.assign(f, {
      id: p.id ?? '',
      orden: p.orden ?? 1,
      enunciado: p.enunciado ?? '',
      codigo: p.codigo ?? '',
      explicacion: p.explicacion ?? '',
      estado: p.estado ?? (props.modo === 'desafio' ? 'publicada' : 'borrador'),
      opciones: (p.opciones?.length ? p.opciones : [{ texto: '', es_correcta: true }, { texto: '', es_correcta: false }])
        .map((o) => ({ id: o.id ?? '', texto: o.texto ?? '', es_correcta: Boolean(o.es_correcta) }))
    })
  },
  { immediate: true }
)

const correcta = computed({
  get: () => f.opciones.findIndex((o) => o.es_correcta),
  set: (i) => f.opciones.forEach((o, j) => (o.es_correcta = i === j))
})

const problemas = computed(() => {
  const lista = []
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(f.id)) lista.push('El id va en minusculas, numeros y guiones.')
  if (f.enunciado.trim().length < 5) lista.push('El enunciado necesita al menos 5 caracteres.')
  if (f.explicacion.trim().length < 10) lista.push('La explicacion (solucion) necesita al menos 10 caracteres.')
  if (f.opciones.length < 2) lista.push('Hace falta al menos dos opciones.')
  if (f.opciones.some((o) => !o.texto.trim())) lista.push('Hay una opcion sin texto.')
  const textos = f.opciones.map((o) => o.texto.trim().toLowerCase())
  if (new Set(textos).size !== textos.length) lista.push('Hay opciones repetidas.')
  if (f.opciones.filter((o) => o.es_correcta).length !== 1) lista.push('Marca exactamente una opcion correcta.')
  return lista
})

function agregar() {
  f.opciones.push({ id: '', texto: '', es_correcta: false })
}

function quitar(i) {
  const eraCorrecta = f.opciones[i].es_correcta
  f.opciones.splice(i, 1)
  if (eraCorrecta && f.opciones.length) f.opciones[0].es_correcta = true
}

function guardar() {
  if (problemas.value.length || props.bloqueada) return
  emit('guardar', {
    id: f.id,
    orden: Number(f.orden),
    enunciado: f.enunciado.trim(),
    codigo: f.codigo,
    explicacion: f.explicacion.trim(),
    estado: f.estado,
    opciones: f.opciones.map((o) => ({ id: o.id || undefined, texto: o.texto.trim(), es_correcta: o.es_correcta }))
  })
}
</script>

<template>
  <form class="editor" novalidate data-prueba="editor-pregunta" @submit.prevent="guardar">
    <MensajeEstado v-if="bloqueada" tipo="alerta">
      <p>Este desafio ya tiene partidas: sus preguntas no se pueden cambiar. Crea otra version.</p>
    </MensajeEstado>

    <div class="fila2">
      <label>Id <input v-model.trim="f.id" :disabled="!nueva || bloqueada" name="id" /></label>
      <label>Orden <input v-model.number="f.orden" type="number" min="1" :disabled="bloqueada" name="orden" /></label>
      <label>
        Estado
        <select v-model="f.estado" :disabled="bloqueada" name="estado">
          <option value="borrador">Borrador</option>
          <option value="publicada">Publicada</option>
        </select>
      </label>
    </div>

    <label>Enunciado <textarea v-model="f.enunciado" rows="2" :disabled="bloqueada" name="enunciado"></textarea></label>
    <label>Codigo (opcional) <textarea v-model="f.codigo" rows="3" class="mono" :disabled="bloqueada" name="codigo"></textarea></label>

    <fieldset class="opciones" :disabled="bloqueada">
      <legend>Opciones (marca la correcta)</legend>
      <div v-for="(o, i) in f.opciones" :key="i" class="opcion">
        <input
          type="radio"
          name="correcta"
          :checked="correcta === i"
          :aria-label="`La opcion ${i + 1} es la correcta`"
          @change="correcta = i"
        />
        <input v-model="o.texto" class="mono" :aria-label="`Texto de la opcion ${i + 1}`" :name="`opcion-${i}`" />
        <button type="button" class="quitar" :disabled="f.opciones.length <= 2" @click="quitar(i)">Quitar</button>
      </div>
      <BaseBoton tamano="chico" variante="texto" :deshabilitado="f.opciones.length >= 6" @click="agregar">
        + Agregar opcion
      </BaseBoton>
    </fieldset>

    <label>
      Explicacion de la solucion
      <textarea v-model="f.explicacion" rows="2" :disabled="bloqueada" name="explicacion"></textarea>
    </label>

    <ul v-if="problemas.length" class="problemas" data-prueba="problemas">
      <li v-for="p in problemas" :key="p">{{ p }}</li>
    </ul>
    <MensajeEstado v-if="error" tipo="error" data-prueba="error-servidor">{{ error.message }}</MensajeEstado>

    <div class="acciones">
      <BaseBoton type="submit" tamano="chico" :deshabilitado="guardando || problemas.length > 0 || bloqueada">
        {{ guardando ? 'Guardando...' : 'Guardar pregunta' }}
      </BaseBoton>
      <BaseBoton tamano="chico" variante="texto" @click="emit('cancelar')">Cancelar</BaseBoton>
    </div>
  </form>
</template>

<style scoped>
.editor {
  display: grid;
  gap: var(--e-2);
}

label {
  display: grid;
  gap: 0.25rem;
  font-size: var(--t-sm);
  font-weight: 700;
}

input,
textarea,
select {
  font: inherit;
  font-weight: 500;
  border: 2px solid var(--c-borde);
  border-radius: var(--r-sm);
  padding: 0.4rem 0.6rem;
  min-width: 0;
}

.mono {
  font-family: var(--f-codigo);
  font-variant-ligatures: none;
}

.fila2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--e-2);
}

.opciones {
  border: 2px solid var(--c-borde);
  border-radius: var(--r-md);
  padding: var(--e-2);
  display: grid;
  gap: var(--e-1);
}

.opciones legend {
  font-size: var(--t-sm);
  font-weight: 800;
  padding-inline: 0.3rem;
}

.opcion {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--e-1);
}

.quitar {
  font-size: var(--t-xs);
  font-weight: 700;
  color: var(--c-rojo-osc);
}

.problemas {
  font-size: var(--t-sm);
  color: var(--c-amarillo-osc);
  background: var(--c-amarillo-suave);
  border-radius: var(--r-sm);
  padding: var(--e-2) var(--e-2) var(--e-2) 1.6rem;
  list-style: disc;
}

.acciones {
  display: flex;
  gap: var(--e-2);
  flex-wrap: wrap;
}
</style>
