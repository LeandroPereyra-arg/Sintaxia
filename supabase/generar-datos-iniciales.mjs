/**
 * Genera supabase/02-datos-iniciales.sql a partir del contenido del proyecto.
 *
 * Los archivos de `src/data/` fueron la fuente de datos de prueba de la etapa 2.
 * En lugar de copiar el contenido a mano al SQL (y arriesgarse a que se
 * desincronice), este script lo transcribe. Se corre con:
 *
 *     npm run supabase:datos
 *
 * El archivo generado es el que se ejecuta en Supabase.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { cursos } from '../src/data/cursos.js'
import { unidadesJavaScript } from '../src/data/unidades.js'
import { lecciones } from '../src/data/lecciones/index.js'
import { TIPO_EJERCICIO } from '../src/data/tiposEjercicio.js'

const raiz = dirname(fileURLToPath(import.meta.url))

/** Unidades cuyo contenido esta completo y se publica en esta etapa. */
const UNIDADES_PUBLICADAS = new Set(['js-u1'])

/** Los colores de las unidades estan como variables CSS; la base guarda el hexadecimal. */
const COLORES = {
  'var(--c-verde)': '#2fbf56',
  'var(--c-azul)': '#1cb0f6',
  'var(--c-violeta)': '#7434db'
}

function color(valor) {
  return COLORES[valor] ?? valor
}

/** Literal de texto de SQL, con las comillas simples escapadas. */
function txt(valor) {
  if (valor === null || valor === undefined) return 'null'
  return `'${String(valor).replace(/'/g, "''")}'`
}

/** Literal de arreglo de texto de PostgreSQL. */
function arreglo(valores) {
  if (!valores || valores.length === 0) return "'{}'"
  return `array[${valores.map(txt).join(', ')}]`
}

function fila(valores) {
  return `  (${valores.join(', ')})`
}

const lineas = []
const w = (linea = '') => lineas.push(linea)

w('-- ===========================================================================')
w('--  Sintaxia - Carga inicial del contenido')
w('--  Etapa 3 - Base de datos relacional en Supabase (PostgreSQL)')
w('-- ---------------------------------------------------------------------------')
w('--  ARCHIVO GENERADO: no editarlo a mano.')
w('--  Se regenera con  npm run supabase:datos  a partir de src/data/.')
w('--')
w('--  Se ejecuta despues de 01-esquema.sql. Vuelve a dejar el contenido como')
w('--  estaba: borra lo que haya y lo inserta de nuevo, todo en una transaccion.')
w('-- ===========================================================================')
w()
w('begin;')
w()
w('-- El borrado en cascada de cursos arrastra unidades, lecciones, preguntas y opciones.')
w('delete from public.cursos;')
w()

// --- cursos ----------------------------------------------------------------
w('-- ---------------------------------------------------------------------------')
w(`-- Cursos (${cursos.length})`)
w('-- ---------------------------------------------------------------------------')
w('insert into public.cursos')
w('  (id, nombre, descripcion, nivel, icono, color, color_texto, estado,')
w('   requisito, horas_estimadas, unidades_previstas, lecciones_previstas, etiquetas, orden)')
w('values')
w(
  cursos
    .map((curso, indice) =>
      fila([
        txt(curso.id),
        txt(curso.nombre),
        txt(curso.descripcion),
        txt(curso.nivel),
        txt(curso.icono),
        txt(color(curso.color)),
        txt(color(curso.colorTexto)),
        txt(curso.estado),
        txt(curso.requisito ?? null),
        curso.horasEstimadas ?? 'null',
        curso.totalUnidades ?? 'null',
        curso.totalLecciones ?? 'null',
        arreglo(curso.etiquetas),
        indice + 1
      ])
    )
    .join(',\n') + ';'
)
w()

// --- unidades --------------------------------------------------------------
const unidades = unidadesJavaScript
w('-- ---------------------------------------------------------------------------')
w(`-- Unidades del curso de JavaScript (${unidades.length})`)
w('-- Solo la unidad 1 tiene el contenido completo; el resto queda como')
w('-- "proximamente", es decir, visible pero no disponible.')
w('-- ---------------------------------------------------------------------------')
w('insert into public.unidades')
w('  (id, curso_id, orden, titulo, descripcion, icono, color, estado, temas)')
w('values')
w(
  unidades
    .map((unidad) =>
      fila([
        txt(unidad.id),
        txt(unidad.cursoId),
        unidad.numero,
        txt(unidad.titulo),
        txt(unidad.descripcion),
        txt(unidad.icono),
        txt(color(unidad.color)),
        txt(UNIDADES_PUBLICADAS.has(unidad.id) ? 'publicada' : 'proximamente'),
        arreglo(unidad.temas)
      ])
    )
    .join(',\n') + ';'
)
w()

// --- lecciones -------------------------------------------------------------
const leccionesPublicadas = lecciones.filter((leccion) => UNIDADES_PUBLICADAS.has(leccion.unidadId))

w('-- ---------------------------------------------------------------------------')
w(`-- Lecciones publicadas (${leccionesPublicadas.length})`)
w('-- ---------------------------------------------------------------------------')
w('insert into public.lecciones')
w('  (id, unidad_id, orden, titulo, descripcion, icono, xp,')
w('   explicacion, ejemplo_titulo, ejemplo_codigo, ejemplo_nota, estado)')
w('values')
w(
  leccionesPublicadas
    .map((leccion) =>
      fila([
        txt(leccion.id),
        txt(leccion.unidadId),
        leccion.numero,
        txt(leccion.titulo),
        txt(leccion.descripcion),
        txt(leccion.icono),
        leccion.xp,
        txt(leccion.teoria?.explicacion),
        txt(leccion.teoria?.ejemplo?.titulo ?? null),
        txt(leccion.teoria?.ejemplo?.codigo ?? null),
        txt(leccion.teoria?.ejemplo?.nota ?? null),
        txt('publicada')
      ])
    )
    .join(',\n') + ';'
)
w()

// --- preguntas y opciones --------------------------------------------------
const preguntas = []
const opciones = []

for (const leccion of leccionesPublicadas) {
  let orden = 0
  for (const ejercicio of leccion.ejercicios) {
    if (ejercicio.tipo !== TIPO_EJERCICIO.OPCION_MULTIPLE) continue
    orden += 1
    preguntas.push({ ejercicio, leccionId: leccion.id, orden })

    ejercicio.opciones.forEach((opcion, indice) => {
      opciones.push({
        id: `${ejercicio.id}-${opcion.id}`,
        preguntaId: ejercicio.id,
        orden: indice + 1,
        texto: opcion.texto,
        esCorrecta: opcion.id === ejercicio.respuesta
      })
    })
  }
}

w('-- ---------------------------------------------------------------------------')
w(`-- Preguntas (${preguntas.length}) - todas de opcion multiple`)
w('-- La explicacion es parte de la solucion: el rol anon no la puede leer.')
w('-- ---------------------------------------------------------------------------')
w('insert into public.preguntas')
w('  (id, leccion_id, orden, tipo, enunciado, codigo, explicacion, estado)')
w('values')
w(
  preguntas
    .map(({ ejercicio, leccionId, orden }) =>
      fila([
        txt(ejercicio.id),
        txt(leccionId),
        orden,
        txt(ejercicio.tipo),
        txt(ejercicio.consigna),
        txt(ejercicio.codigo ?? null),
        txt(ejercicio.explicacion),
        txt('publicada')
      ])
    )
    .join(',\n') + ';'
)
w()

w('-- ---------------------------------------------------------------------------')
w(`-- Opciones de respuesta (${opciones.length})`)
w('-- es_correcta es la otra mitad de la solucion: tampoco la puede leer anon.')
w('-- ---------------------------------------------------------------------------')
w('insert into public.opciones (id, pregunta_id, orden, texto, es_correcta)')
w('values')
w(
  opciones
    .map((opcion) =>
      fila([
        txt(opcion.id),
        txt(opcion.preguntaId),
        opcion.orden,
        txt(opcion.texto),
        opcion.esCorrecta ? 'true' : 'false'
      ])
    )
    .join(',\n') + ';'
)
w()
w('commit;')
w()

const destino = join(raiz, '02-datos-iniciales.sql')
writeFileSync(destino, lineas.join('\n'), 'utf8')

console.log(`Escrito ${destino}`)
console.log(
  `  ${cursos.length} cursos · ${unidades.length} unidades · ` +
    `${leccionesPublicadas.length} lecciones · ${preguntas.length} preguntas · ` +
    `${opciones.length} opciones`
)
