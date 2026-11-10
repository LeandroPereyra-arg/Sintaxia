/**
 * Pruebas automaticas de la etapa 6: competencia (eventos, desafios y partidas).
 *
 * Contra que se prueba: lo mismo que las etapas 4 y 5 (Supabase Auth real,
 * PostgreSQL real con los scripts 00 a 14, la app en Chromium). Lo unico
 * simulado es la capa HTTP de la API de datos (PostgREST).
 *
 * Preparacion: npm run supabase:local y npm run pruebas:entorno.
 * Despues:     npm run pruebas:etapa6        (SOLO=3,7 corre solo esos casos)
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

import {
  URL_APP,
  abrirBase,
  correoNuevo,
  crearApi,
  dormir,
  leerClaves,
  jugarPorApi,
  opcionesDeDesafio
} from './local/ayudas.mjs'

const claves = await leerClaves()
const api = crearApi(claves)
const bd = abrirBase()
await bd.connect()

const casos = []
const excepciones = []
const SOLO = process.env.SOLO ? process.env.SOLO.split(',').map(Number) : null

async function caso(numero, titulo, esperado, fn) {
  if (SOLO && !SOLO.includes(numero)) return
  let obtenido
  let pasa = false
  try {
    obtenido = await fn()
    pasa = true
  } catch (error) {
    obtenido = `EXCEPCION: ${String(error.message).split('\n')[0].slice(0, 260)}`
  }
  casos.push({ numero, titulo, esperado, obtenido, pasa })
  console.log(`${pasa ? 'PASA ' : 'FALLA'} ${numero}. ${titulo}`)
  if (!pasa) console.log(`        esperado: ${esperado}\n        obtenido: ${obtenido}`)
}

function verificar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje)
}

const consulta = async (sql, params = []) => (await bd.query(sql, params)).rows
const nuevoId = () => crypto.randomUUID()
const EVENTO = 'expo-2026'
const SPRINT = 'expo-2026-sprint'
const CODIGO = 'expo-2026-codigo'

/** Foto de las partidas y respuestas de una persona. */
async function fotoDe(usuarioId) {
  const partidas = await consulta(
    `select id, desafio_id, numero, estado, aciertos, errores, puntaje, duracion_ms, finalizada_en
       from partidas where usuario_id = $1 order by desafio_id, numero`, [usuarioId])
  const respuestas = await consulta(
    `select r.partida_id, r.pregunta_id, r.opcion_id, r.es_correcta, r.puntos
       from partida_respuestas r join partidas p on p.id = r.partida_id
      where p.usuario_id = $1 order by r.partida_id, r.pregunta_id`, [usuarioId])
  return JSON.stringify({ partidas, respuestas })
}

/** Lleva una partida al pasado, como si hubieran pasado `segundos` desde que empezo. */
async function envejecer(partidaId, segundos) {
  await consulta(
    `update partidas set iniciada_en = iniciada_en - make_interval(secs => $2),
                         vence_en    = vence_en    - make_interval(secs => $2)
      where id = $1`, [partidaId, segundos])
}

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

async function contexto(opciones = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 900 }, ...opciones })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('sintaxia:bienvenida-vista', '1')
    } catch {
      // about:blank no tiene localStorage
    }
  })
  return ctx
}

async function pagina(ctx) {
  const p = await ctx.newPage()
  p.on('pageerror', (e) => excepciones.push(`${e.message}`))
  return p
}

const texto = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ')
const leerSesion = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion') ?? 'null'))
const normalizar = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()

async function entrarComoInvitado(p, volver = `/expo/${EVENTO}`) {
  await p.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(volver)}`, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Continuar como invitado|Seguir como invitado/ }).click()
  await p.waitForURL(`**${volver}`, { timeout: 15000 })
  await dormir(400)
}

async function entrarConCuenta(p, cuenta, volver = `/expo/${EVENTO}`) {
  await p.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(volver)}`, { waitUntil: 'networkidle' })
  await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
  await p.getByLabel('Contrasena', { exact: true }).fill(cuenta.clave)
  await p.getByRole('button', { name: 'Entrar', exact: true }).click()
  await p.waitForURL(`**${volver}`, { timeout: 15000 })
  await dormir(400)
}

/** Texto de la opcion correcta e incorrecta de cada pregunta, por enunciado + codigo. */
async function solucionesEnPantalla(desafioId) {
  const filas = await consulta(
    `select q.enunciado, coalesce(q.codigo, '') as codigo,
            max(o.texto) filter (where o.es_correcta) as bien,
            min(o.texto) filter (where not o.es_correcta) as mal
       from preguntas_desafio q join opciones_desafio o on o.pregunta_id = q.id
      where q.desafio_id = $1 group by q.id`, [desafioId])
  return new Map(filas.map((f) => [normalizar(f.enunciado) + '|' + normalizar(f.codigo), f]))
}

/** Responde en la pantalla la pregunta que se esta viendo. */
async function responderEnPantalla(p, soluciones, { bien = true, continuar = true } = {}) {
  await p.waitForSelector('.opcion')
  const enunciado = normalizar(await p.locator('.partida__consigna').innerText())
  const codigo = (await p.locator('.partida .bloque-codigo').count())
    ? normalizar(await p.locator('.partida .bloque-codigo').innerText())
    : ''
  const s = soluciones.get(enunciado + '|' + codigo)
  if (!s) throw new Error(`No reconozco la pregunta: ${enunciado} ${codigo}`)
  await p.getByRole('button', { name: bien ? s.bien : s.mal, exact: true }).first().click()
  await p.getByRole('button', { name: /^(Responder|Reintentar)$/ }).click()
  await p.waitForSelector('.feedback', { timeout: 10000 })
  if (continuar) {
    await p.locator('.feedback button').click()
    await dormir(150)
  }
}

/** Juega un desafio entero en la pantalla: las primeras `aciertos` bien. */
async function jugarEnPantalla(p, desafioId, aciertos = 5) {
  const soluciones = await solucionesEnPantalla(desafioId)
  await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${desafioId}`, { waitUntil: 'networkidle' })
  for (let i = 0; i < 5; i++) await responderEnPantalla(p, soluciones, { bien: i < aciertos })
  await p.waitForURL(/\/partidas\//, { timeout: 10000 })
  await p.locator('[data-prueba="puntaje-final"]').waitFor({ timeout: 10000 })
}

const quienDesborda = (p) =>
  p.evaluate(() => {
    const ancho = innerWidth
    const salen = []
    for (const el of document.querySelectorAll('body *')) {
      const caja = el.getBoundingClientRect()
      let enScroll = false
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX
        if (o === 'auto' || o === 'scroll' || o === 'hidden') {
          enScroll = true
          break
        }
      }
      if (!enScroll && caja.width > 0 && caja.right > ancho + 0.5) {
        salen.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}`)
      }
    }
    return salen.slice(0, 6)
  })

// ===========================================================================
//  A. PRACTICA Y COMPETENCIA SEPARADAS
// ===========================================================================

await caso(
  1,
  'La correccion de practica no da las soluciones del desafio',
  'El banco del desafio no se puede leer; comprobar_respuesta y responder_actividad no conocen sus preguntas; la partida llega sin soluciones',
  async () => {
    const yo = await api.altaAnonima()
    const lecturas = {
      bancoPublico: await api.datos(null, 'GET', 'preguntas_desafio?select=id'),
      opcionesPublico: await api.datos(null, 'GET', 'opciones_desafio?select=id,es_correcta'),
      banco: await api.datos(yo.token, 'GET', 'preguntas_desafio?select=id,explicacion'),
      opciones: await api.datos(yo.token, 'GET', 'opciones_desafio?select=id,es_correcta'),
      asignadas: await api.datos(yo.token, 'GET', 'partida_preguntas?select=pregunta_id')
    }
    for (const [nombre, r] of Object.entries(lecturas)) {
      verificar(r.estado === 401 || r.estado === 403, `${nombre}: ${r.estado}`)
    }
    const practica = await api.rpc(null, 'comprobar_respuesta', { p_pregunta_id: 'sprint-p1', p_opcion_id: 'sprint-p1-a' })
    verificar(practica.estado >= 400, `comprobar_respuesta con una pregunta del desafio: ${practica.estado}`)

    const inicio = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: SPRINT })
    const crudo = JSON.stringify(inicio.datos)
    verificar(inicio.estado === 200 && !/es_correcta|explicacion|marca_correcta/.test(crudo), 'la partida trae datos de la solucion')
    const r = await api.rpc(yo.token, 'responder_partida', {
      p_partida_id: inicio.datos.id, p_pregunta_id: inicio.datos.preguntas[0].id,
      p_opcion_id: inicio.datos.preguntas[0].opciones[0].id })
    verificar(r.estado === 200 && !('opcion_correcta_id' in r.datos) && !('explicacion' in r.datos), 'la respuesta revela la correcta')
    return `banco y opciones: ${lecturas.bancoPublico.estado}/${lecturas.banco.estado} · comprobar_respuesta: ${practica.estado} (no la conoce) · la partida y la respuesta no traen es_correcta, explicacion ni la opcion correcta`
  }
)

await caso(
  2,
  'El servidor crea la partida, registra el dueno y fija preguntas y reglas',
  'La partida queda a nombre de quien la pidio, con las 5 preguntas en un orden fijo y una copia de las reglas; el tiempo lo pone el servidor',
  async () => {
    const yo = await api.altaAnonima()
    const id = nuevoId()
    const inicio = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: id, p_desafio_id: SPRINT })
    const [p] = await consulta(
      `select p.usuario_id, p.version_desafio, p.puntos_por_acierto, p.duracion_segundos, p.gracia_segundos,
              p.total_preguntas, extract(epoch from (p.vence_en - p.iniciada_en))::int as segundos,
              abs(extract(epoch from (p.iniciada_en - now()))) < 10 as reciente
         from partidas p where p.id = $1`, [id])
    const [d] = await consulta('select version, puntos_por_acierto, duracion_segundos, gracia_segundos from desafios where id = $1', [SPRINT])
    const asignadas = await consulta('select pregunta_id, orden from partida_preguntas where partida_id = $1 order by orden', [id])
    const otraVez = await api.rpc(yo.token, 'obtener_partida', { p_partida_id: id })
    verificar(p.usuario_id === yo.id && p.reciente, 'dueno o fecha incorrectos')
    verificar(p.version_desafio === d.version && p.puntos_por_acierto === d.puntos_por_acierto &&
      p.duracion_segundos === d.duracion_segundos && p.segundos === d.duracion_segundos, 'reglas no copiadas')
    verificar(asignadas.length === 5 && p.total_preguntas === 5, `asignadas: ${asignadas.length}`)
    verificar(otraVez.datos.preguntas.map((q) => q.id).join() === asignadas.map((a) => a.pregunta_id).join() &&
      inicio.datos.preguntas.map((q) => q.id).join() === asignadas.map((a) => a.pregunta_id).join(), 'el orden cambio entre consultas')
    return `dueno: quien la pidio · reglas copiadas (v${p.version_desafio}, ${p.puntos_por_acierto} pts, ${p.duracion_segundos} s, gracia ${p.gracia_segundos} s) · vence a los ${p.segundos} s por reloj del servidor · 5 preguntas en orden fijo`
  }
)

// ===========================================================================
//  B. ENVIOS: DE OTRA PARTIDA, DOBLES, CIERRE REPETIDO
// ===========================================================================

await caso(
  3,
  'Respuesta de otra partida o de otra pregunta',
  'Responder en la partida de otra persona, una pregunta que no es de la partida o una opcion de otra pregunta se rechaza sin cambiar nada',
  async () => {
    const a = await api.altaAnonima()
    const b = await api.altaAnonima()
    const deB = await jugarPorApi(api, bd, b.token, SPRINT, { responder: 1 })
    const deA = await jugarPorApi(api, bd, a.token, SPRINT, { responder: 0 })
    const antesB = await fotoDe(b.id)
    const pregB = deB.preguntas[1]
    const solB = (await opcionesDeDesafio(bd, SPRINT)).get(pregB.id)
    const r = {
      enLaDeB: await api.rpc(a.token, 'responder_partida', { p_partida_id: deB.id, p_pregunta_id: pregB.id, p_opcion_id: solB.correcta }),
      verLaDeB: await api.rpc(a.token, 'obtener_partida', { p_partida_id: deB.id }),
      cerrarLaDeB: await api.rpc(a.token, 'finalizar_partida', { p_partida_id: deB.id }),
      otraPregunta: await api.rpc(a.token, 'responder_partida', { p_partida_id: deA.id, p_pregunta_id: 'codigo-p1', p_opcion_id: 'codigo-p1-b' }),
      otraOpcion: await api.rpc(a.token, 'responder_partida', { p_partida_id: deA.id, p_pregunta_id: deA.preguntas[0].id, p_opcion_id: 'codigo-p1-b' }),
      leerLaDeB: await api.datos(a.token, 'GET', `partidas?select=id&id=eq.${deB.id}`)
    }
    verificar(r.enLaDeB.datos?.hint === 'partida_no_encontrada' && r.verLaDeB.datos?.hint === 'partida_no_encontrada' &&
      r.cerrarLaDeB.datos?.hint === 'partida_no_encontrada', 'pudo tocar la partida de B')
    verificar(r.otraPregunta.datos?.hint === 'pregunta_ajena', `otra pregunta: ${r.otraPregunta.datos?.hint}`)
    verificar(r.otraOpcion.datos?.hint === 'opcion_no_encontrada', `otra opcion: ${r.otraOpcion.datos?.hint}`)
    verificar(r.leerLaDeB.datos.length === 0, 'A leyo la partida de B')
    verificar((await fotoDe(b.id)) === antesB, 'la partida de B cambio')
    const [{ n }] = await consulta('select count(*)::int as n from partida_respuestas where partida_id = $1', [deA.id])
    verificar(n === 0, `se guardaron respuestas en la de A: ${n}`)
    return 'responder/ver/cerrar la de B: partida_no_encontrada · pregunta de otro desafio: pregunta_ajena · opcion de otra pregunta: opcion_no_encontrada · B intacta · A sin respuestas'
  }
)

await caso(
  4,
  'Doble envio y envios simultaneos',
  'La misma respuesta repetida (o cinco a la vez) suma una sola vez; una opcion distinta despues devuelve la primera',
  async () => {
    const yo = await api.altaAnonima()
    const { id, preguntas } = await jugarPorApi(api, bd, yo.token, SPRINT, { responder: 0 })
    const s = await opcionesDeDesafio(bd, SPRINT)
    const q1 = preguntas[0]
    const q2 = preguntas[1]
    const pedido = { p_partida_id: id, p_pregunta_id: q1.id, p_opcion_id: s.get(q1.id).correcta }
    const primera = await api.rpc(yo.token, 'responder_partida', pedido)
    const repetida = await api.rpc(yo.token, 'responder_partida', pedido)
    const otra = await api.rpc(yo.token, 'responder_partida', { ...pedido, p_opcion_id: s.get(q1.id).incorrecta })
    const rafaga = await Promise.all(Array.from({ length: 5 }, () =>
      api.rpc(yo.token, 'responder_partida', { p_partida_id: id, p_pregunta_id: q2.id, p_opcion_id: s.get(q2.id).correcta })))
    const [p] = await consulta('select aciertos, puntaje from partidas where id = $1', [id])
    const [{ n }] = await consulta('select count(*)::int as n from partida_respuestas where partida_id = $1', [id])
    verificar(primera.datos.repetida === false && repetida.datos.repetida === true && repetida.datos.puntos === 100, 'no marco la repeticion')
    verificar(otra.datos.repetida === true && otra.datos.correcta === true && otra.datos.opcion_id === s.get(q1.id).correcta, 'la segunda opcion reemplazo a la primera')
    verificar(rafaga.every((r) => r.estado === 200) && rafaga.filter((r) => !r.datos.repetida).length === 1, `rafaga: ${rafaga.map((r) => r.estado)}`)
    verificar(n === 2 && p.aciertos === 2 && p.puntaje === 200, `respuestas ${n}, puntaje ${p.puntaje}`)
    let rechazo = ''
    try {
      await consulta(`insert into partida_respuestas (partida_id, pregunta_id, opcion_id, es_correcta, puntos)
                      values ($1, $2, $3, true, 100)`, [id, q1.id, s.get(q1.id).correcta])
    } catch (e) {
      rechazo = e.constraint ?? e.code
    }
    verificar(rechazo === 'pk_partida_respuestas', `duplicado directo: ${rechazo || 'entro'}`)
    return `repetida: no suma · otra opcion despues: vale la primera · 5 simultaneas: 1 registrada y 4 "repetida" · 2 respuestas, 200 pts · duplicado directo en la tabla: rechazado por ${rechazo}`
  }
)

await caso(
  5,
  'Cierre repetido',
  'Cerrar dos veces (o cinco a la vez) devuelve el mismo resultado sin cambiarlo; despues de cerrar no se aceptan respuestas',
  async () => {
    const yo = await api.altaAnonima()
    const { id, preguntas } = await jugarPorApi(api, bd, yo.token, SPRINT, { responder: 3, aciertos: 2 })
    const primero = await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })
    const segundo = await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })
    const rafaga = await Promise.all(Array.from({ length: 5 }, () => api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })))
    const s = await opcionesDeDesafio(bd, SPRINT)
    const tarde = await api.rpc(yo.token, 'responder_partida', { p_partida_id: id, p_pregunta_id: preguntas[4].id, p_opcion_id: s.get(preguntas[4].id).correcta })
    const [p] = await consulta('select estado, puntaje, finalizada_en, duracion_ms from partidas where id = $1', [id])
    verificar(primero.datos.estado === 'finalizada' && primero.datos.repetida === false && primero.datos.puntaje === 200, `primero: ${JSON.stringify(primero.datos).slice(0, 80)}`)
    verificar(segundo.datos.repetida === true && rafaga.every((r) => r.datos.repetida === true && r.datos.finalizada_en === primero.datos.finalizada_en), 'el cierre repetido cambio algo')
    verificar(tarde.datos?.hint === 'partida_cerrada', `responder tras cerrar: ${tarde.datos?.hint}`)
    verificar(p.estado === 'finalizada' && p.puntaje === 200, 'la partida cambio')
    return `1er cierre: finalizada con 200 pts (2 de 5) · 2do y 5 simultaneos: "repetida", misma hora de cierre · responder despues: partida_cerrada`
  }
)

// ===========================================================================
//  C. TIEMPO, PARTIDAS VENCIDAS E INCOMPLETAS
// ===========================================================================

await caso(
  6,
  'Partida vencida',
  'Pasado el tiempo (mas la gracia) no se aceptan respuestas; la partida queda vencida con lo respondido, no es valida y no cuenta como mejor partida',
  async () => {
    const yo = await api.altaAnonima()
    const { id, preguntas } = await jugarPorApi(api, bd, yo.token, SPRINT, { responder: 2 })
    await envejecer(id, 90 + 6) // 90 s de partida + 6 s: ya paso la gracia de 5 s
    const s = await opcionesDeDesafio(bd, SPRINT)
    const tarde = await api.rpc(yo.token, 'responder_partida', { p_partida_id: id, p_pregunta_id: preguntas[2].id, p_opcion_id: s.get(preguntas[2].id).correcta })
    const cierre = await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })
    const [p] = await consulta('select estado, puntaje, duracion_ms, finalizada_en = vence_en as al_vencer from partidas where id = $1', [id])
    const [mejor] = await consulta('select (mejor_partida($1, $2)).id', [yo.id, SPRINT])
    verificar(tarde.datos?.hint === 'partida_vencida', `respuesta tardia: ${tarde.datos?.hint}`)
    verificar(cierre.datos.estado === 'vencida' && cierre.datos.valida === false, `cierre: ${cierre.datos.estado}`)
    verificar(p.puntaje === 200 && p.duracion_ms === 90000 && p.al_vencer, `partida: ${JSON.stringify(p)}`)
    verificar(mejor.id === null, 'una partida vencida conto como mejor partida')

    // Una vencida que nadie cerro tambien se cierra sola al pedir otra partida, y consume el intento.
    const otra = await jugarPorApi(api, bd, yo.token, SPRINT, { responder: 1 })
    await envejecer(otra.id, 200)
    const nueva = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: SPRINT })
    const [vieja] = await consulta('select estado from partidas where id = $1', [otra.id])
    verificar(vieja.estado === 'vencida' && nueva.datos.numero === 3, `vieja ${vieja.estado}, nueva numero ${nueva.datos?.numero}`)
    return `respuesta despues de tiempo + gracia: partida_vencida · cierre: vencida (no valida) con los 200 pts respondidos y 90 s · no cuenta como mejor partida · una vencida sin cerrar se cierra sola y consume el intento`
  }
)

await caso(
  7,
  'Gracia de red y tiempo medido por el servidor',
  'Una respuesta que llega 2 s despues del cierre (dentro de la gracia de 5 s) se acepta; el tiempo guardado sale del reloj del servidor y no supera la duracion',
  async () => {
    const yo = await api.altaAnonima()
    const { id, preguntas } = await jugarPorApi(api, bd, yo.token, SPRINT, { responder: 4 })
    await envejecer(id, 92) // vencio hace 2 s
    const s = await opcionesDeDesafio(bd, SPRINT)
    const ultima = await api.rpc(yo.token, 'responder_partida', { p_partida_id: id, p_pregunta_id: preguntas[4].id, p_opcion_id: s.get(preguntas[4].id).correcta })
    const [p] = await consulta(
      `select estado, duracion_ms,
              abs(duracion_ms - least(90000, extract(epoch from (finalizada_en - iniciada_en)) * 1000)) < 2 as coincide
         from partidas where id = $1`, [id])
    verificar(ultima.estado === 200 && ultima.datos.partida.estado === 'finalizada', `ultima: ${ultima.estado} ${ultima.datos?.hint}`)
    verificar(p.duracion_ms === 90000 && p.coincide, `duracion: ${p.duracion_ms}`)

    const rapida = await jugarPorApi(api, bd, yo.token, SPRINT)
    const [r] = await consulta(
      `select duracion_ms, abs(duracion_ms - extract(epoch from (finalizada_en - iniciada_en)) * 1000) < 2 as coincide
         from partidas where id = $1`, [rapida.id])
    verificar(r.coincide && r.duracion_ms < 10000, `rapida: ${r.duracion_ms}`)
    return `respuesta 2 s tarde: aceptada (gracia) y la partida queda finalizada con 90 000 ms (tope) · partida rapida: ${r.duracion_ms} ms = cierre - inicio del servidor`
  }
)

await caso(
  8,
  'El reloj del celular no cambia el tiempo',
  'Con el reloj del navegador adelantado una hora, la cuenta regresiva muestra lo que dice el servidor y la partida no vence antes de tiempo',
  async () => {
    const ctx = await contexto()
    await ctx.addInitScript(() => {
      const desfase = 3600 * 1000
      const DateReal = Date
      // Date adelantado una hora: lo que pasaria con un celular mal configurado.
      globalThis.Date = class extends DateReal {
        constructor(...a) {
          super(...(a.length ? a : [DateReal.now() + desfase]))
        }
        static now() {
          return DateReal.now() + desfase
        }
      }
    })
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const soluciones = await solucionesEnPantalla(SPRINT)
    await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${SPRINT}`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')
    await dormir(1500)
    const tiempo = (await p.locator('[data-prueba="tiempo"]').innerText()).trim()
    const [m, s] = tiempo.split(':').map(Number)
    const segundos = m * 60 + s
    verificar(segundos >= 84 && segundos <= 90, `cuenta regresiva: ${tiempo}`)
    await responderEnPantalla(p, soluciones)
    const sigue = await p.locator('[data-prueba="tiempo"]').count()
    verificar(sigue === 1, 'la partida se corto')
    await ctx.close()
    return `reloj del navegador +1 h · la cuenta regresiva arranca en ${tiempo} (lo que dice el servidor) · la partida sigue abierta y acepta respuestas`
  }
)

await caso(
  9,
  'Reconexion: cerrar, volver y perder la conexion a mitad de partida',
  'Al volver se retoma la misma partida con el tiempo que de verdad queda; sin conexion la respuesta queda pendiente y se manda sola al reconectarse',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const soluciones = await solucionesEnPantalla(SPRINT)
    await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${SPRINT}`, { waitUntil: 'networkidle' })
    await responderEnPantalla(p, soluciones)
    await responderEnPantalla(p, soluciones)
    await p.goto('about:blank')
    await p.close()
    await dormir(3000)

    const p2 = await pagina(ctx)
    await p2.goto(`${URL_APP}/expo/${EVENTO}`, { waitUntil: 'networkidle' })
    await p2.locator(`[data-desafio="${SPRINT}"]`).getByRole('link', { name: 'Retomar partida' }).click()
    await p2.waitForSelector('.opcion')
    const encabezado = await p2.locator('.partida__tipo').innerText()
    const tiempo = (await p2.locator('[data-prueba="tiempo"]').innerText()).trim()
    const [m, s] = tiempo.split(':').map(Number)
    verificar(/PREGUNTA 3 DE 5/i.test(encabezado), `retomo en: ${encabezado}`)
    verificar(m * 60 + s <= 87, `el reloj se detuvo mientras no estaba: ${tiempo}`)

    await ctx.setOffline(true)
    const enunciado = normalizar(await p2.locator('.partida__consigna').innerText())
    const codigo = (await p2.locator('.partida .bloque-codigo').count()) ? normalizar(await p2.locator('.partida .bloque-codigo').innerText()) : ''
    await p2.getByRole('button', { name: soluciones.get(enunciado + '|' + codigo).bien, exact: true }).first().click()
    await p2.getByRole('button', { name: 'Responder' }).click()
    await p2.locator('[data-prueba="estado-envio"][data-estado="pendiente"]').waitFor({ timeout: 10000 })
    const [{ n: sinRed }] = await consulta(
      'select count(*)::int as n from partida_respuestas r join partidas p on p.id = r.partida_id where p.usuario_id = $1', [id])
    await ctx.setOffline(false)
    await p2.locator('[data-prueba="estado-envio"][data-estado="guardado"]').waitFor({ timeout: 10000 })
    const [{ n: conRed }] = await consulta(
      'select count(*)::int as n from partida_respuestas r join partidas p on p.id = r.partida_id where p.usuario_id = $1', [id])
    const [{ n: partidas }] = await consulta('select count(*)::int as n from partidas where usuario_id = $1', [id])
    verificar(sinRed === 2 && conRed === 3 && partidas === 1, `respuestas ${sinRed} -> ${conRed}, partidas ${partidas}`)
    await ctx.close()
    return `al volver: "${encabezado.trim()}", reloj en ${tiempo} (siguio corriendo) · sin red: pendiente, ${sinRed} registradas · al reconectar: se mando sola, ${conRed} · 1 sola partida`
  }
)

// ===========================================================================
//  D. PUNTAJE, INTENTOS Y MEJOR PARTIDA
// ===========================================================================

await caso(
  10,
  'Puntaje manipulado',
  'El cliente no puede crear ni modificar partidas, respuestas ni puntajes, ni mandar un puntaje a las funciones; la base rechaza un puntaje que no sea aciertos x puntos',
  async () => {
    const yo = await api.altaAnonima()
    const { id, preguntas } = await jugarPorApi(api, bd, yo.token, SPRINT, { aciertos: 1 })
    const antes = await fotoDe(yo.id)
    const r = {
      crear: await api.datos(yo.token, 'POST', 'partidas', { id: nuevoId(), desafio_id: SPRINT, evento_id: EVENTO, numero: 9, puntaje: 99999 }),
      inflar: await api.datos(yo.token, 'PATCH', `partidas?id=eq.${id}`, { puntaje: 500, aciertos: 5 }),
      respuesta: await api.datos(yo.token, 'POST', 'partida_respuestas', { partida_id: id, pregunta_id: preguntas[0].id, opcion_id: 'x', es_correcta: true, puntos: 9999 }),
      cambiarRespuesta: await api.datos(yo.token, 'PATCH', `partida_respuestas?partida_id=eq.${id}`, { es_correcta: true, puntos: 9999 }),
      borrar: await api.datos(yo.token, 'DELETE', `partidas?id=eq.${id}`),
      rpcPuntaje: await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id, p_puntaje: 500 })
    }
    const estados = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.estado]))
    verificar(Object.values(estados).every((e) => e >= 400), `estados: ${JSON.stringify(estados)}`)
    verificar((await fotoDe(yo.id)) === antes, 'la partida cambio')
    let rechazo = ''
    try {
      await consulta('update partidas set puntaje = 9999 where id = $1', [id])
    } catch (e) {
      rechazo = e.constraint ?? e.code
    }
    verificar(rechazo === 'ck_partidas_puntaje', `puntaje inconsistente como superusuario: ${rechazo || 'entro'}`)
    return `crear ${estados.crear} · modificar puntaje ${estados.inflar} · insertar/modificar respuestas ${estados.respuesta}/${estados.cambiarRespuesta} · borrar ${estados.borrar} · rpc con p_puntaje ${estados.rpcPuntaje} · partida intacta (100 pts) · aun como dueno de la base, un puntaje que no sea aciertos x puntos: ${rechazo}`
  }
)

await caso(
  11,
  'Intentos permitidos y mejor partida valida',
  'Con 3 intentos, el cuarto se rechaza; cuenta la mejor partida (no la suma); a igual puntaje gana la mas rapida',
  async () => {
    const yo = await api.altaAnonima()
    const uno = await jugarPorApi(api, bd, yo.token, SPRINT, { aciertos: 2 })
    const dos = await jugarPorApi(api, bd, yo.token, SPRINT, { aciertos: 4 })
    const tres = await jugarPorApi(api, bd, yo.token, SPRINT, { aciertos: 4 })
    const cuarto = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: SPRINT })
    verificar(cuarto.datos?.hint === 'sin_intentos', `cuarto intento: ${cuarto.datos?.hint}`)
    // Dos partidas con 400 pts: se fija el tiempo para ver el desempate.
    await consulta('update partidas set duracion_ms = 30000 where id = $1', [dos.id])
    await consulta('update partidas set duracion_ms = 20000 where id = $1', [tres.id])
    const [mejor] = await consulta('select (mejor_partida($1, $2)).id, (mejor_partida($1, $2)).puntaje', [yo.id, SPRINT])
    const [{ suma }] = await consulta('select sum(puntaje)::int as suma from partidas where usuario_id = $1', [yo.id])
    verificar(mejor.id === tres.id && mejor.puntaje === 400, `mejor: ${mejor.id === dos.id ? 'la lenta' : mejor.id}`)
    return `intentos: 200, 400 (30 s), 400 (20 s) · el 4to: sin_intentos · cuenta la mejor: 400 pts en 20 s (no la suma, que daria ${suma}) · ${uno.partida.puntaje} pts del primero no se acumulan`
  }
)

await caso(
  12,
  'Dos jugadores al mismo tiempo',
  'Dos personas juegan a la vez desde dos navegadores: cada una tiene su partida, sus preguntas y su puntaje, y la base coincide con lo que ve cada una',
  async () => {
    const ctxA = await contexto()
    const ctxB = await contexto({ viewport: { width: 1280, height: 900 } })
    const pa = await pagina(ctxA)
    const pb = await pagina(ctxB)
    await Promise.all([entrarComoInvitado(pa), entrarComoInvitado(pb)])
    const idA = (await leerSesion(pa)).user.id
    const idB = (await leerSesion(pb)).user.id
    await Promise.all([jugarEnPantalla(pa, SPRINT, 5), jugarEnPantalla(pb, SPRINT, 3)])
    const vistoA = Number(await pa.locator('[data-prueba="puntaje-final"]').innerText().then((t) => t.match(/\d+/)[0]))
    const vistoB = Number(await pb.locator('[data-prueba="puntaje-final"]').innerText().then((t) => t.match(/\d+/)[0]))
    const filas = await consulta(
      `select usuario_id, puntaje, (select count(*)::int from partida_respuestas r where r.partida_id = p.id) as respuestas
         from partidas p where usuario_id = any($1)`, [[idA, idB]])
    const deA = filas.find((f) => f.usuario_id === idA)
    const deB = filas.find((f) => f.usuario_id === idB)
    verificar(filas.length === 2 && deA.respuestas === 5 && deB.respuestas === 5, `filas: ${JSON.stringify(filas)}`)
    verificar(vistoA === 500 && deA.puntaje === 500 && vistoB === 300 && deB.puntaje === 300, `A ${vistoA}/${deA.puntaje}, B ${vistoB}/${deB.puntaje}`)
    await ctxA.close()
    await ctxB.close()
    return `A (celular): ve ${vistoA} pts, la base guarda ${deA.puntaje} · B (compu): ve ${vistoB} pts, la base guarda ${deB.puntaje} · una partida y 5 respuestas cada una`
  }
)

await caso(
  13,
  'Puntaje final para el invitado y para la cuenta',
  'Los dos ven su puntaje confirmado por el servidor; al invitado se le avisa que no entra al ranking y a la cuenta no',
  async () => {
    const ctxI = await contexto()
    const pi = await pagina(ctxI)
    await entrarComoInvitado(pi)
    await jugarEnPantalla(pi, CODIGO, 4)
    const tInvitado = await texto(pi)

    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('expo'), alias: 'Jugadora' })
    const ctxC = await contexto()
    const pc = await pagina(ctxC)
    await entrarConCuenta(pc, cuenta)
    await jugarEnPantalla(pc, CODIGO, 5)
    const tCuenta = await texto(pc)
    const avisoCuenta = await pc.locator('[data-prueba="aviso-invitado-resultado"]').count()

    verificar(/Puntaje guardado/.test(tInvitado) && /600 pts/.test(tInvitado) && /no aparece en el ranking/.test(tInvitado), `invitado: ${tInvitado.slice(0, 200)}`)
    verificar(/Puntaje guardado/.test(tCuenta) && /750 pts/.test(tCuenta) && avisoCuenta === 0, `cuenta: ${tCuenta.slice(0, 200)}`)
    await ctxI.close()
    await ctxC.close()
    return 'invitado: "Puntaje guardado", 600 pts (4 de 5 x 150) y el aviso de que no entra al ranking · cuenta: "Puntaje guardado", 750 pts, sin aviso'
  }
)

// ===========================================================================
//  E. EVENTO, CONGELAMIENTO Y SCRIPTS
// ===========================================================================

await caso(
  14,
  'Evento cerrado, desafio en borrador y desafio congelado',
  'Con el evento cerrado no se puede empezar; un desafio en borrador no se ve; con partidas jugadas, las reglas y el banco no se pueden cambiar',
  async () => {
    const yo = await api.altaAnonima()
    try {
      await consulta("update eventos set estado = 'cerrado' where id = $1", [EVENTO])
      const cerrado = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: SPRINT })
      verificar(cerrado.datos?.hint === 'evento_cerrado', `evento cerrado: ${cerrado.datos?.hint}`)
    } finally {
      await consulta("update eventos set estado = 'abierto' where id = $1", [EVENTO])
    }

    await consulta(`insert into desafios (id, evento_id, orden, nombre, estado) values ('prueba-borrador', $1, 99, 'Borrador de prueba', 'borrador')
                    on conflict (id) do nothing`, [EVENTO])
    const visible = await api.datos(null, 'GET', 'desafios?select=id&id=eq.prueba-borrador')
    const jugar = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: 'prueba-borrador' })
    await consulta("delete from desafios where id = 'prueba-borrador'")
    verificar(visible.datos.length === 0 && jugar.datos?.hint === 'desafio_no_disponible', 'el borrador se ve o se puede jugar')

    const rechazos = []
    for (const sql of [
      "update desafios set puntos_por_acierto = 999 where id = 'expo-2026-sprint'",
      "update desafios set duracion_segundos = 999 where id = 'expo-2026-sprint'",
      "update opciones_desafio set es_correcta = (id = 'sprint-p1-b') where pregunta_id = 'sprint-p1'",
      "insert into preguntas_desafio (id, desafio_id, orden, enunciado, explicacion, estado) values ('sprint-extra', 'expo-2026-sprint', 9, 'Pregunta nueva', 'Explicacion nueva.', 'borrador')"
    ]) {
      try {
        await consulta(sql)
        rechazos.push('ENTRO')
      } catch (e) {
        rechazos.push(e.hint ?? e.code)
      }
    }
    verificar(rechazos.every((r) => r === 'desafio_congelado'), `congelado: ${rechazos}`)
    await consulta("update desafios set estado = 'publicado' where id = 'expo-2026-sprint'") // el estado si se puede cambiar
    return `evento cerrado: evento_cerrado · desafio en borrador: no se ve y no se juega · con partidas: cambiar puntos, duracion, la solucion o agregar preguntas -> desafio_congelado`
  }
)

await caso(
  15,
  'Volver a correr los scripts 11 a 14 no pierde partidas ni permisos',
  'Partidas, respuestas y desafios quedan iguales y los permisos siguen cerrados',
  async () => {
    const contar = async () => (await consulta(
      `select (select count(*) from partidas)::int as p, (select count(*) from partida_respuestas)::int as r,
              (select count(*) from preguntas_desafio)::int as q`))[0]
    const antes = await contar()
    for (const archivo of ['11-competencia', '12-funciones-competencia', '13-politicas-rls-etapa6', '14-evento-expo']) {
      try {
        await bd.query(readFileSync(new URL(`../supabase/${archivo}.sql`, import.meta.url), 'utf8'))
      } catch (e) {
        await bd.query('rollback') // que la conexion no quede en una transaccion abortada
        throw new Error(`${archivo}: ${e.message}`)
      }
    }
    const despues = await contar()
    const yo = await api.altaAnonima()
    const banco = await api.datos(yo.token, 'GET', 'opciones_desafio?select=id')
    const jugar = await jugarPorApi(api, bd, yo.token, CODIGO)
    verificar(JSON.stringify(antes) === JSON.stringify(despues), `conteos: ${JSON.stringify(antes)} -> ${JSON.stringify(despues)}`)
    verificar(banco.estado === 403 && jugar.partida?.estado === 'finalizada', `banco ${banco.estado}, jugar ${jugar.partida?.estado}`)
    return `partidas ${antes.p}, respuestas ${antes.r}, preguntas ${antes.q}: iguales · el banco sigue cerrado (${banco.estado}) · se sigue jugando`
  }
)

await caso(
  16,
  'Pantallas de la competencia en el celular',
  'Evento, partida y puntaje no desbordan a lo ancho a 360 ni 320 px',
  async () => {
    const ctx = await contexto({ viewport: { width: 360, height: 800 } })
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const desbordes = []
    const revisar = async (nombre) => {
      for (const ancho of [360, 320]) {
        await p.setViewportSize({ width: ancho, height: 800 })
        await dormir(200)
        const salen = await quienDesborda(p)
        if (salen.length) desbordes.push(`${nombre} ${ancho}: ${salen.join(' ')}`)
      }
    }
    await revisar('evento')
    const soluciones = await solucionesEnPantalla(CODIGO)
    await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${CODIGO}`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')
    await revisar('partida')
    for (let i = 0; i < 5; i++) await responderEnPantalla(p, soluciones)
    await p.locator('[data-prueba="puntaje-final"]').waitFor({ timeout: 10000 })
    await revisar('puntaje')
    verificar(desbordes.length === 0, desbordes.join(' | '))
    await ctx.close()
    return 'evento, partida (con codigo) y puntaje: sin desbordes a 360 y 320 px'
  }
)

// ===========================================================================
//  Resumen
// ===========================================================================
await navegador.close()
await bd.end()

casos.sort((a, b) => a.numero - b.numero)
console.log('\n| # | Caso | Resultado esperado | Resultado obtenido | Estado |')
console.log('|---|---|---|---|---|')
for (const c of casos) {
  const celda = (t) => String(t).replace(/\|/g, '/')
  console.log(`| ${c.numero} | ${celda(c.titulo)} | ${celda(c.esperado)} | ${celda(c.obtenido)} | ${c.pasa ? 'PASA' : 'FALLA'} |`)
}
const fallan = casos.filter((c) => !c.pasa).length
const unicas = [...new Set(excepciones)]
console.log(`\nexcepciones no atrapadas en la pagina: ${unicas.length ? unicas.join(' · ') : 'ninguna'}`)
console.log(`casos: ${casos.length} · fallan: ${fallan}`)
process.exit(fallan === 0 && unicas.length === 0 ? 0 : 1)
