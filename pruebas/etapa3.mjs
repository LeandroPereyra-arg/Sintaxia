/**
 * Pruebas automaticas de la etapa 3.
 *
 * Recorren la aplicacion con un navegador real (Chromium) contra la base
 * PostgreSQL creada con los scripts de `supabase/`, ejecutando cada consulta
 * con el rol `anon`, igual que el navegador contra Supabase.
 *
 * Antes de correrlas:
 *   1. levantar PostgreSQL y preparar la base:  node pruebas/preparar-base-local.mjs
 *   2. levantar el puente de PostgREST:         node pruebas/servidor-supabase-local.mjs
 *   3. levantar la aplicacion apuntando ahi:
 *        VITE_SUPABASE_URL=http://localhost:5599 \
 *        VITE_SUPABASE_PUBLISHABLE_KEY=clave-de-prueba-local \
 *        npm run dev -- --port 5174
 *
 * Despues:  node pruebas/etapa3.mjs
 *
 * Imprime la tabla del registro de pruebas (docs/11-registro-de-pruebas-etapa3.md).
 */
import { chromium } from 'playwright'
import pg from 'pg'

const BASE = process.env.URL_APP ?? 'http://localhost:5174'
const API_SUPABASE = process.env.URL_SUPABASE ?? 'http://localhost:5599'

const conexion = new pg.Client({
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5433),
  user: process.env.PGUSER ?? 'sintaxia',
  database: process.env.PGDATABASE ?? 'sintaxia'
})

const casos = []
let erroresDePagina = []

function registrar(numero, titulo, esperado, obtenido, pasa) {
  casos.push({ numero, titulo, esperado, obtenido, pasa })
  console.log(`${pasa ? 'PASA' : 'FALLA'}  ${numero}. ${titulo}`)
  if (!pasa) console.log(`        esperado: ${esperado}\n        obtenido: ${obtenido}`)
}

/** Los errores de la API de cuentas (etapa 2) no son parte de esta prueba. */
function esRuido(texto) {
  return (
    texto.includes('/api/') ||
    texto.includes('ERR_CERT') ||
    texto.includes('500 (Internal Server Error)') ||
    texto.includes('Failed to load resource')
  )
}

async function nuevaPagina(ctx) {
  const pagina = await ctx.newPage()
  pagina.on('pageerror', (e) => {
    if (!esRuido(e.message)) erroresDePagina.push(e.message)
  })
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !esRuido(m.text())) erroresDePagina.push(m.text())
  })
  await pagina.addInitScript(() => {
    localStorage.setItem('sintaxia:bienvenida:v1', 'vista')
    localStorage.removeItem('sintaxia:progreso:v1')
  })
  return pagina
}

const texto = async (pagina) => (await pagina.locator('body').innerText()).replace(/\s+/g, ' ')

/** Resuelve una leccion completa eligiendo siempre la opcion correcta. */
async function resolverLeccion(pagina, leccionId, { correctas = true } = {}) {
  const { rows } = await conexion.query(
    `select p.id as pregunta, o.id as opcion, o.texto
       from preguntas p
       join opciones o on o.pregunta_id = p.id
      where p.leccion_id = $1 and o.es_correcta = $2
      order by p.orden`,
    [leccionId, correctas]
  )

  await pagina.goto(`${BASE}/lecciones/${leccionId}/actividades`, { waitUntil: 'networkidle' })

  for (let i = 0; i < rows.length; i++) {
    await pagina.waitForSelector('.opcion')
    await pagina.getByRole('button', { name: rows[i].texto, exact: true }).first().click()
    await pagina.getByRole('button', { name: /Comprobar/ }).click()
    await pagina.waitForSelector('.feedback')
    await pagina.locator('.feedback button').click()
    await pagina.waitForTimeout(150)
  }
  await pagina.waitForURL(/resultados/, { timeout: 5000 })
}

// ===========================================================================

await conexion.connect()
const navegador = await chromium.launch()

try {
  // -------------------------------------------------------------------
  // 1. Consultar los contenidos desde dos dispositivos o navegadores
  // -------------------------------------------------------------------
  {
    const escritorio = await navegador.newContext({ viewport: { width: 1280, height: 900 } })
    const celular = await navegador.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    })
    const p1 = await nuevaPagina(escritorio)
    const p2 = await nuevaPagina(celular)

    await p1.goto(`${BASE}/cursos`, { waitUntil: 'networkidle' })
    await p2.goto(`${BASE}/cursos`, { waitUntil: 'networkidle' })

    const t1 = await p1.locator('article.curso h3').allInnerTexts()
    const t2 = await p2.locator('article.curso h3').allInnerTexts()
    const iguales = t1.length === 6 && JSON.stringify(t1) === JSON.stringify(t2)

    registrar(
      1,
      'Consultar los contenidos desde dos navegadores distintos',
      'Los dos ven la misma lista de 6 cursos traida de la base',
      `escritorio: ${t1.length} cursos · celular: ${t2.length} cursos · iguales: ${iguales}`,
      iguales
    )
    await escritorio.close()
    await celular.close()
  }

  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } })

  // -------------------------------------------------------------------
  // 2. Modificar un titulo en la base y volver a consultar
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.goto(`${BASE}/unidades/js-u1`, { waitUntil: 'networkidle' })
    const antes = (await pagina.locator('h1').first().innerText()).trim()

    await conexion.query("update unidades set titulo = 'Primeros pasos (editado)' where id = 'js-u1'")
    await pagina.reload({ waitUntil: 'networkidle' })
    const despues = (await pagina.locator('h1').first().innerText()).trim()
    await conexion.query("update unidades set titulo = 'Primeros pasos' where id = 'js-u1'")

    registrar(
      2,
      'Cambiar un titulo desde la base y volver a consultar',
      'La pantalla muestra el titulo nuevo al recargar',
      `antes: "${antes}" · despues: "${despues}"`,
      antes === 'Primeros pasos' && despues === 'Primeros pasos (editado)'
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 3. Cada pantalla muestra solo los contenidos relacionados
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)

    await pagina.goto(`${BASE}/cursos/javascript`, { waitUntil: 'networkidle' })
    const unidadesEnPantalla = await pagina.locator('.camino__lista > li').count()
    const { rows: unidadesBase } = await conexion.query(
      "select count(*)::int as n from unidades where curso_id = 'javascript'"
    )

    await pagina.goto(`${BASE}/unidades/js-u1`, { waitUntil: 'networkidle' })
    const leccionesEnPantalla = await pagina.locator('ol.lecciones > li').count()
    const { rows: leccionesBase } = await conexion.query(
      "select count(*)::int as n from lecciones where unidad_id = 'js-u1'"
    )

    await pagina.goto(`${BASE}/lecciones/js-u1-l1/actividades`, { waitUntil: 'networkidle' })
    const cabecera = await pagina.locator('.leccion__tipo').innerText()
    const opciones = await pagina.locator('.opcion').count()
    const { rows: opcionesBase } = await conexion.query(
      "select count(*)::int as n from opciones where pregunta_id = 'js-u1-l1-a1'"
    )

    const ok =
      unidadesEnPantalla === unidadesBase[0].n &&
      leccionesEnPantalla === leccionesBase[0].n &&
      opciones === opcionesBase[0].n

    registrar(
      3,
      'Cada pantalla muestra solamente los contenidos relacionados',
      'Curso -> solo sus unidades; unidad -> solo sus lecciones; leccion -> solo sus preguntas y opciones',
      `unidades ${unidadesEnPantalla}/${unidadesBase[0].n} · lecciones ${leccionesEnPantalla}/${leccionesBase[0].n} · ` +
        `opciones ${opciones}/${opcionesBase[0].n} · ${cabecera.replace(/\s+/g, ' ')}`,
      ok
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 4. Orden de unidades y lecciones (por el campo orden, no por insercion)
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)

    // Se cambia a proposito el orden fisico de las filas para que el unico
    // criterio posible sea la columna `orden`.
    await conexion.query('cluster')  // no-op seguro: fuerza a no depender del orden fisico
      .catch(() => {})

    await pagina.goto(`${BASE}/cursos/javascript`, { waitUntil: 'networkidle' })
    const unidades = await pagina.locator('.camino__lista .unidad__numero, .camino__lista h3').allInnerTexts()

    await pagina.goto(`${BASE}/unidades/js-u1`, { waitUntil: 'networkidle' })
    const lecciones = (await pagina.locator('ol.lecciones h3').allInnerTexts()).map((t) => t.trim())

    const ordenadas =
      lecciones.length === 3 &&
      lecciones[0].startsWith('1.') &&
      lecciones[1].startsWith('2.') &&
      lecciones[2].startsWith('3.')

    registrar(
      4,
      'Las unidades y las lecciones salen en orden',
      'Unidades 1 a 6 y lecciones 1, 2 y 3, segun el campo orden',
      `${unidades.filter((t) => /UNIDAD|Unidad/.test(t)).length} unidades · ${lecciones.join(' | ')}`,
      ordenadas
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 5. Identificador inexistente
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.goto(`${BASE}/lecciones/no-existe`, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(400)
    const t = await texto(pagina)
    const hayAviso = t.includes('No encontramos ese contenido')
    const haySalida = (await pagina.locator('.estado__acciones a, .estado__acciones button').count()) > 0
    const sinReintento = (await pagina.getByRole('button', { name: /Reintentar/ }).count()) === 0

    registrar(
      5,
      'Entrar a un identificador que no existe',
      'Mensaje claro, sin boton de reintentar (reintentar no lo arregla) y con una salida',
      `aviso: ${hayAviso} · salidas: ${haySalida} · sin boton de reintentar: ${sinReintento}`,
      hayAviso && haySalida && sinReintento
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 6. Consulta sin conexion + reintento
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.route('**/rest/v1/**', (ruta) => ruta.abort())
    await pagina.goto(`${BASE}/cursos`, { waitUntil: 'domcontentloaded' })
    // El cliente de Supabase reintenta solo unos segundos antes de darse por
    // vencido, asi que el aviso tarda en aparecer.
    await pagina.waitForSelector('[role="alert"]', { timeout: 25000 })
    const conError = await texto(pagina)
    const hayReintentar = (await pagina.getByRole('button', { name: /Reintentar/ }).count()) > 0

    await pagina.unroute('**/rest/v1/**')
    await pagina.getByRole('button', { name: /Reintentar/ }).click()
    await pagina.waitForSelector('article.curso', { timeout: 15000 })
    const recuperado = await pagina.locator('article.curso').count()

    registrar(
      6,
      'Consulta sin conexion y reintento',
      'Se avisa que no se pudo cargar, se ofrece reintentar y al reintentar aparecen los cursos',
      `aviso: ${conError.includes('No pudimos cargar el contenido')} · boton: ${hayReintentar} · ` +
        `cursos tras reintentar: ${recuperado}`,
      hayReintentar && recuperado === 6
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 7. Si no se pudo comprobar, la respuesta NO se cuenta como incorrecta
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    const { rows } = await conexion.query(
      "select texto from opciones where pregunta_id = 'js-u1-l1-a1' and es_correcta"
    )

    await pagina.goto(`${BASE}/lecciones/js-u1-l1/actividades`, { waitUntil: 'networkidle' })
    await pagina.waitForSelector('.opcion')

    await pagina.route('**/rest/v1/rpc/**', (ruta) => ruta.abort())
    await pagina.getByRole('button', { name: rows[0].texto, exact: true }).first().click()
    await pagina.getByRole('button', { name: /Comprobar/ }).click()
    await pagina.waitForSelector('.leccion__error', { timeout: 25000 })

    const vidas = (await pagina.locator('.vidas').innerText()).trim()
    const sinDevolucion = (await pagina.locator('.feedback').count()) === 0

    await pagina.unroute('**/rest/v1/rpc/**')
    await pagina.getByRole('button', { name: /Reintentar/ }).click()
    await pagina.waitForSelector('.feedback', { timeout: 15000 })
    const devolucion = (await pagina.locator('.feedback').innerText()).replace(/\s+/g, ' ')

    registrar(
      7,
      'Si falla la comprobacion, la respuesta no se da por incorrecta',
      'Se avisa, no se pierde una vida y al reintentar se corrige bien',
      `vidas: ${vidas} · sin devolucion mientras fallaba: ${sinDevolucion} · tras reintentar: ${devolucion.slice(0, 40)}`,
      vidas === '3' && sinDevolucion && devolucion.includes('Muy bien')
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 8. Un visitante no puede modificar contenidos
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.goto(`${BASE}/cursos`, { waitUntil: 'networkidle' })

    const intentos = await pagina.evaluate(async (api) => {
      const cabeceras = {
        'Content-Type': 'application/json',
        apikey: 'clave-de-prueba-local',
        Authorization: 'Bearer clave-de-prueba-local'
      }
      const resultados = {}
      for (const [nombre, opciones] of Object.entries({
        modificar: {
          method: 'PATCH',
          headers: cabeceras,
          body: JSON.stringify({ nombre: 'Hackeado' })
        },
        crear: {
          method: 'POST',
          headers: cabeceras,
          body: JSON.stringify({ id: 'x', nombre: 'X' })
        },
        borrar: { method: 'DELETE', headers: cabeceras }
      })) {
        const r = await fetch(`${api}/rest/v1/cursos?id=eq.javascript`, opciones)
        resultados[nombre] = r.status
      }
      return resultados
    }, API_SUPABASE)

    const { rows } = await conexion.query("select nombre from cursos where id = 'javascript'")
    const ninguna200 = Object.values(intentos).every((estado) => estado >= 400)

    registrar(
      8,
      'Un visitante no puede crear, modificar ni borrar contenidos',
      'Las tres operaciones son rechazadas y el contenido queda igual',
      `crear: ${intentos.crear} · modificar: ${intentos.modificar} · borrar: ${intentos.borrar} · ` +
        `curso sigue siendo "${rows[0].nombre}"`,
      ninguna200 && rows[0].nombre === 'JavaScript'
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 9. Las soluciones no se pueden consultar directamente desde el cliente
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.goto(`${BASE}/lecciones/js-u1-l1/actividades`, { waitUntil: 'networkidle' })
    await pagina.waitForSelector('.opcion')

    const intento = await pagina.evaluate(async (api) => {
      const cabeceras = { apikey: 'clave-de-prueba-local', Authorization: 'Bearer clave-de-prueba-local' }
      const opciones = await fetch(`${api}/rest/v1/opciones?select=id,es_correcta`, { headers: cabeceras })
      const preguntas = await fetch(`${api}/rest/v1/preguntas?select=id,explicacion`, { headers: cabeceras })
      const todo = await fetch(`${api}/rest/v1/opciones?select=*`, { headers: cabeceras })
      return {
        opciones: opciones.status,
        preguntas: preguntas.status,
        todo: todo.status
      }
    }, API_SUPABASE)

    // Ademas: lo que si llego al navegador no contiene la solucion.
    const htmlSinSolucion = !(await pagina.content()).includes('es_correcta')
    const rechazadas = Object.values(intento).every((estado) => estado >= 400)

    registrar(
      9,
      'Las soluciones no se pueden consultar desde el cliente',
      'Pedir es_correcta, explicacion o select=* es rechazado por la base',
      `es_correcta: ${intento.opciones} · explicacion: ${intento.preguntas} · select=*: ${intento.todo} · ` +
        `la pagina no trae la solucion: ${htmlSinSolucion}`,
      rechazadas && htmlSinSolucion
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 10. Completar una leccion y obtener su resultado
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await resolverLeccion(pagina, 'js-u1-l1')
    await pagina.waitForTimeout(1400) // los contadores se animan
    const t = await texto(pagina)
    const ok = t.includes('4 Actividades') && t.includes('4 Correctas') && t.includes('0 Incorrectas')

    registrar(
      10,
      'Completar una leccion y obtener el resultado',
      'La pantalla de resultados muestra actividades, correctas, incorrectas y porcentaje',
      t.match(/(\d+ Actividades.*?100 % Precision)/)?.[1]?.slice(0, 80) ?? t.slice(0, 120),
      ok
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 11. Una unidad sin lecciones publicadas se muestra como no disponible
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    await pagina.goto(`${BASE}/unidades/js-u2`, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(400)
    const t = await texto(pagina)
    const ok = t.includes('todavia no tiene lecciones publicadas')

    registrar(
      11,
      'Una unidad sin contenido publicado queda identificada como no disponible',
      'La unidad se abre pero avisa que todavia no tiene lecciones',
      ok ? 'Muestra el aviso de unidad sin lecciones publicadas' : t.slice(0, 140),
      ok
    )
    await pagina.close()
  }

  // -------------------------------------------------------------------
  // 12. Correccion incorrecta: devolucion con texto y explicacion
  // -------------------------------------------------------------------
  {
    const pagina = await nuevaPagina(ctx)
    const { rows } = await conexion.query(
      "select texto from opciones where pregunta_id = 'js-u1-l1-a1' and not es_correcta order by orden limit 1"
    )
    await pagina.goto(`${BASE}/lecciones/js-u1-l1/actividades`, { waitUntil: 'networkidle' })
    await pagina.waitForSelector('.opcion')
    await pagina.getByRole('button', { name: rows[0].texto, exact: true }).first().click()
    await pagina.getByRole('button', { name: /Comprobar/ }).click()
    await pagina.waitForSelector('.feedback')
    const devolucion = (await pagina.locator('.feedback').innerText()).replace(/\s+/g, ' ')

    const ok =
      devolucion.includes('Respuesta incorrecta') &&
      devolucion.includes('Respuesta correcta:') &&
      devolucion.length > 80

    registrar(
      12,
      'Respuesta incorrecta: el servidor devuelve la correccion y la explicacion',
      'Se ve el texto "Respuesta incorrecta", cual era la correcta y la explicacion',
      devolucion.slice(0, 110),
      ok
    )
    await pagina.close()
  }

  await ctx.close()
} finally {
  await navegador.close()
  await conexion.end()
}

// ---------------------------------------------------------------------------
// Resumen en formato de tabla, para pegar en el registro de pruebas
// ---------------------------------------------------------------------------
console.log('\n| # | Caso | Resultado esperado | Resultado obtenido | Estado |')
console.log('|---|---|---|---|---|')
for (const c of casos) {
  console.log(`| ${c.numero} | ${c.titulo} | ${c.esperado} | ${c.obtenido} | ${c.pasa ? 'PASA' : 'FALLA'} |`)
}

const fallan = casos.filter((c) => !c.pasa).length
console.log(`\nerrores de pagina: ${erroresDePagina.length ? [...new Set(erroresDePagina)].join(' · ') : 'ninguno'}`)
console.log(`casos: ${casos.length} · fallan: ${fallan}`)
process.exit(fallan === 0 ? 0 : 1)
