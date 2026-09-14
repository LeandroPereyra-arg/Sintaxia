<script setup>
import { computed } from 'vue'

/**
 * Calendario de actividad (estilo "heatmap"): una celda por dia, mas oscura
 * cuanto mas XP se gano ese dia. Las semanas van en columnas, igual que el
 * grafico de contribuciones de GitHub.
 */
const props = defineProps({
  /** [{ fecha: 'YYYY-MM-DD', xp, lecciones }] */
  actividad: { type: Array, default: () => [] },
  /** Cuantas semanas mostrar (53 = un anio completo, como el grafico de GitHub). */
  semanas: { type: Number, default: 53 }
})

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function aTexto(fecha) {
  return fecha.toISOString().slice(0, 10)
}

const porFecha = computed(() => {
  const mapa = new Map()
  for (const dia of props.actividad) {
    // La API puede devolver la fecha como texto o como Date.
    const clave = typeof dia.fecha === 'string' ? dia.fecha.slice(0, 10) : aTexto(new Date(dia.fecha))
    mapa.set(clave, { xp: Number(dia.xp) || 0, lecciones: Number(dia.lecciones) || 0 })
  }
  return mapa
})

/** Las celdas se agrupan en columnas de 7 dias, empezando un lunes. */
const columnas = computed(() => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Retrocede hasta el lunes de la semana actual.
  const diaSemana = (hoy.getDay() + 6) % 7
  const finSemana = new Date(hoy)
  finSemana.setDate(hoy.getDate() - diaSemana)

  const inicio = new Date(finSemana)
  inicio.setDate(finSemana.getDate() - (props.semanas - 1) * 7)

  const resultado = []
  for (let semana = 0; semana < props.semanas; semana++) {
    const celdas = []
    for (let dia = 0; dia < 7; dia++) {
      const fecha = new Date(inicio)
      fecha.setDate(inicio.getDate() + semana * 7 + dia)
      const clave = aTexto(fecha)
      const datos = porFecha.value.get(clave)
      celdas.push({
        clave,
        fecha,
        futuro: fecha > hoy,
        xp: datos?.xp ?? 0,
        lecciones: datos?.lecciones ?? 0
      })
    }
    resultado.push({ celdas, mes: celdas[0].fecha.getMonth(), dia1: celdas[0].fecha.getDate() })
  }
  return resultado
})

/** Cinco intensidades segun el XP del dia. */
function nivel(xp) {
  if (xp <= 0) return 0
  if (xp < 15) return 1
  if (xp < 35) return 2
  if (xp < 70) return 3
  return 4
}

function titulo(celda) {
  const fecha = celda.fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  if (celda.xp === 0) return `${fecha}: sin practica`
  return `${fecha}: ${celda.xp} XP en ${celda.lecciones} leccion${celda.lecciones === 1 ? '' : 'es'}`
}

/** Etiqueta de mes solo en la primera columna de cada mes. */
function etiquetaMes(indice) {
  const columna = columnas.value[indice]
  if (!columna) return ''
  const anterior = columnas.value[indice - 1]
  if (anterior && anterior.mes === columna.mes) return ''
  return MESES[columna.mes]
}

/** Solo se cuentan los dias que realmente se ven en la grilla. */
const totales = computed(() => {
  let dias = 0
  let xp = 0
  for (const columna of columnas.value) {
    for (const celda of columna.celdas) {
      if (celda.xp > 0) {
        dias++
        xp += celda.xp
      }
    }
  }
  return { dias, xp }
})
</script>

<template>
  <div class="calendario">
    <header class="calendario__cabecera">
      <p class="calendario__resumen">
        <strong>{{ totales.dias }}</strong> {{ totales.dias === 1 ? 'dia' : 'dias' }} de practica ·
        <strong>{{ totales.xp }}</strong> XP en el ultimo anio
      </p>
      <div class="calendario__escala">
        <span>Menos</span>
        <span v-for="n in 5" :key="n" class="celda" :data-nivel="n - 1" />
        <span>Mas</span>
      </div>
    </header>

    <div class="calendario__scroll">
      <div class="calendario__grilla">
        <div class="calendario__dias" aria-hidden="true">
          <span v-for="(dia, i) in DIAS" :key="dia">{{ i % 2 === 1 ? dia : '' }}</span>
        </div>

        <div class="calendario__semanas">
          <div class="calendario__meses" aria-hidden="true">
            <span v-for="(columna, i) in columnas" :key="'m' + i">{{ etiquetaMes(i) }}</span>
          </div>

          <div class="calendario__columnas">
            <div v-for="(columna, i) in columnas" :key="i" class="calendario__columna">
              <span
                v-for="celda in columna.celdas"
                :key="celda.clave"
                class="celda"
                :class="{ 'celda--futuro': celda.futuro }"
                :data-nivel="nivel(celda.xp)"
                :title="celda.futuro ? '' : titulo(celda)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendario {
  display: grid;
  gap: var(--e-2);
}

.calendario__cabecera {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e-2);
  justify-content: space-between;
  align-items: center;
  font-size: var(--t-sm);
  color: var(--c-gris);
}

.calendario__escala {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--t-xs);
}

.calendario__scroll {
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.calendario__grilla {
  display: flex;
  gap: 6px;
  min-width: max-content;
}

.calendario__dias {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 3px;
  font-size: 9px;
  color: var(--c-gris);
  padding-top: 16px;
  align-items: center;
}

.calendario__meses {
  display: flex;
  gap: 3px;
  font-size: 9px;
  color: var(--c-gris);
  height: 13px;
}

.calendario__meses span {
  width: 13px;
  white-space: nowrap;
}

.calendario__columnas {
  display: flex;
  gap: 3px;
}

.calendario__columna {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  gap: 3px;
}

.celda {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--c-borde);
  display: inline-block;
}

.celda[data-nivel='1'] {
  background: #bdeccb;
}
.celda[data-nivel='2'] {
  background: #7fd79a;
}
.celda[data-nivel='3'] {
  background: #43c268;
}
.celda[data-nivel='4'] {
  background: var(--c-verde-osc);
}

.celda--futuro {
  opacity: 0.35;
}
</style>
