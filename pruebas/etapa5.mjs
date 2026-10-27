/**
 * Pruebas automaticas de la etapa 5: intentos, respuestas y progreso.
 *
 * Que se prueba y contra que (igual que la etapa 4):
 *   · Supabase Auth real (GoTrue) para invitados y cuentas.
 *   · PostgreSQL real, ejecutando cada consulta con el rol y los claims del token.
 *     Las funciones iniciar_intento, responder_actividad y abandonar_intento
 *     corren ahi, tal cual estan en supabase/09-funciones-intentos.sql.
 *   · La app: un navegador real (Chromium) con la app de Vue.
 *   · Lo unico simulado es la capa HTTP de la API de datos (PostgREST).
 *
 * Preparacion: la misma de la etapa 4 (npm run supabase:local y
 * npm run pruebas:entorno). Despues:  npm run pruebas:etapa5
 *
 * SOLO=3,14 corre unicamente esos casos.
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
  opcionesDeLeccion,
  resolverPorApi
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
const L1 = 'js-u1-l1'
const L2 = 'js-u1-l2'
const L3 = 'js-u1-l3'

/** Foto de todo el progreso de una persona, para comparar antes y despues. */
async function fotoDe(usuarioId) {
  const intentos = await consulta(
    `select id, leccion_id, numero, estado, aciertos, errores, aprobado, finalizado_en
       from intentos where usuario_id = $1 order by leccion_id, numero`,
    [usuarioId]
  )
  const respuestas = await consulta(
    `select r.intento_id, r.pregunta_id, r.opcion_id, r.es_correcta, r.orden
       from respuestas r join intentos i on i.id = r.intento_id
      where i.usuario_id = $1 order by r.intento_id, r.orden`,
    [usuarioId]
  )
  return JSON.stringify({ intentos, respuestas })
}

const contarRespuestas = async (usuarioId) =>
  (
    await consulta(
      'select count(*)::int as n from respuestas r join intentos i on i.id = r.intento_id where i.usuario_id = $1',
      [usuarioId]
    )
  )[0].n

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

async function contexto(opciones = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 900 }, ...opciones })
  // En about:blank (se usa para "cerrar la app") no hay localStorage: se ignora.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('sintaxia:bienvenida-vista', '1')
    } catch {
      // nada
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

async function entrarComoInvitado(p) {
  await p.goto(`${URL_APP}/ingresar?volver=%2Fperfil`, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Continuar como invitado|Seguir como invitado/ }).click()
  await p.waitForURL('**/perfil', { timeout: 15000 })
  await dormir(400)
}

async function entrarConCuenta(p, cuenta) {
  await p.goto(`${URL_APP}/ingresar?volver=%2Fperfil`, { waitUntil: 'networkidle' })
  await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
  await p.getByLabel('Contrasena', { exact: true }).fill(cuenta.clave)
  await p.getByRole('button', { name: 'Entrar', exact: true }).click()
  await p.waitForURL('**/perfil', { timeout: 15000 })
  await dormir(400)
}

/** Texto de la opcion correcta (o incorrecta) de cada actividad, en orden. */
async function textosDe(leccionId, correctas = true) {
  const filas = await consulta(
    `select o.texto from preguntas q join opciones o on o.pregunta_id = q.id
      where q.leccion_id = $1 and o.es_correcta = $2 and q.estado = 'publicada'
      order by q.orden, o.orden`,
    [leccionId, correctas]
  )
  if (correctas) return filas.map((f) => f.texto)
  // Una incorrecta por actividad.
  const porPregunta = await consulta(
    `select distinct on (q.orden) o.texto from preguntas q join opciones o on o.pregunta_id = q.id
      where q.leccion_id = $1 and not o.es_correcta order by q.orden, o.orden`,
    [leccionId]
  )
  return porPregunta.map((f) => f.texto)
}

/** Responde en la pantalla la actividad que se esta viendo y espera la confirmacion del servidor. */
async function responderEnPantalla(p, textoOpcion, { continuar = true } = {}) {
  await p.waitForSelector('.opcion')
  await p.getByRole('button', { name: textoOpcion, exact: true }).first().click()
  await p.getByRole('button', { name: /Comprobar/ }).click()
  await p.waitForSelector('.feedback')
  if (continuar) {
    await p.locator('.feedback button').click()
    await dormir(150)
  }
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
//  A. EL SERVIDOR CALCULA Y GUARDA CADA INTENTO
// ===========================================================================

await caso(
  1,
  'Un intento se corrige y se guarda en el servidor',
  'Quedan la fecha, cada actividad con la opcion elegida y si fue correcta, los aciertos, los errores, el porcentaje, el estado y si aprobo',
  async () => {
    const yo = await api.altaAnonima()
    const { intento } = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 3 })
    verificar(intento.estado === 'completado', `estado ${intento.estado}`)
    verificar(intento.aciertos === 3 && intento.errores === 1 && intento.porcentaje === 75 && intento.aprobado === true,
      `resumen: ${JSON.stringify(intento)}`)

    const [fila] = await consulta(
      'select numero, total_actividades, iniciado_en, finalizado_en, origen from intentos where id = $1', [intento.id])
    const respuestas = await consulta(
      'select pregunta_id, opcion_id, es_correcta, orden, respondida_en from respuestas where intento_id = $1 order by orden', [intento.id])
    verificar(fila.numero === 1 && fila.total_actividades === 4 && fila.iniciado_en && fila.finalizado_en && fila.origen === 'servidor',
      `fila: ${JSON.stringify(fila)}`)
    verificar(respuestas.length === 4 && respuestas.filter((r) => r.es_correcta).length === 3 && respuestas.every((r) => r.respondida_en),
      `respuestas: ${respuestas.length}`)
    return `intento 1 · completado · 3 aciertos, 1 error, 75 % · aprobado · 4 respuestas con opcion, correccion, orden y hora · iniciado y finalizado con fecha`
  }
)

await caso(
  2,
  'El celular no puede mandar aciertos ni porcentaje',
  'Escribir intentos o respuestas directamente se rechaza, y las funciones no aceptan un parametro de aciertos',
  async () => {
    const yo = await api.altaAnonima()
    const { intento } = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 1 })
    const antes = await fotoDe(yo.id)

    const crear = await api.datos(yo.token, 'POST', 'intentos', {
      leccion_id: L1, numero: 7, estado: 'completado', total_actividades: 4, aciertos: 4, aprobado: true })
    const inflar = await api.datos(yo.token, 'PATCH', `intentos?id=eq.${intento.id}`, { aciertos: 4, aprobado: true })
    const respuestaFalsa = await api.datos(yo.token, 'POST', 'respuestas', {
      intento_id: intento.id, pregunta_id: 'js-u1-l1-a2', opcion_id: 'js-u1-l1-a2-b', es_correcta: true, orden: 9 })
    const conAciertos = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L1, p_aciertos: 4 })
    const conPorcentaje = await api.rpc(yo.token, 'responder_actividad', {
      p_intento_id: intento.id, p_pregunta_id: 'js-u1-l1-a1', p_opcion_id: 'js-u1-l1-a1-a', p_porcentaje: 100 })

    const estados = [crear, inflar, respuestaFalsa, conAciertos, conPorcentaje].map((r) => r.estado)
    verificar(estados.every((e) => e >= 400), `estados: ${estados}`)
    verificar((await fotoDe(yo.id)) === antes, 'el progreso cambio')
    return `insert intentos ${crear.estado} · update aciertos ${inflar.estado} · insert respuestas ${respuestaFalsa.estado} · rpc con p_aciertos ${conAciertos.estado} · rpc con p_porcentaje ${conPorcentaje.estado} · el intento sigue en 1/4`
  }
)

await caso(
  3,
  'Peticion repetida al empezar un intento',
  'Repetir iniciar_intento con el mismo id (una vez o cinco a la vez) devuelve el mismo intento y no crea otro',
  async () => {
    const yo = await api.altaAnonima()
    const id = nuevoId()
    const primera = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: id, p_leccion_id: L1 })
    const segunda = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: id, p_leccion_id: L1 })
    const rafaga = await Promise.all(
      Array.from({ length: 5 }, () => api.rpc(yo.token, 'iniciar_intento', { p_intento_id: id, p_leccion_id: L1 })))
    const [{ n }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [yo.id])
    verificar(primera.estado === 200 && primera.datos.repetida === false, `primera: ${primera.estado}`)
    verificar(segunda.datos.repetida === true && segunda.datos.id === id && segunda.datos.numero === 1, 'la segunda no fue la misma')
    verificar(rafaga.every((r) => r.estado === 200 && r.datos.id === id), `rafaga: ${rafaga.map((r) => r.estado)}`)
    verificar(n === 1, `intentos guardados: ${n}`)

    // El mismo id para otra leccion se rechaza (no se reutiliza un intento).
    const otra = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: id, p_leccion_id: L2 })
    verificar(otra.estado >= 400 && otra.datos.hint === 'intento_de_otra_leccion', `otra leccion: ${otra.estado}`)
    return `1ra: creado · 2da: repetida=true, mismo id · 5 simultaneas: mismo intento · guardados: ${n} · mismo id en otra leccion: rechazado`
  }
)

await caso(
  4,
  'Peticion repetida al responder: una sola respuesta por actividad e intento',
  'La misma respuesta repetida (o cinco a la vez) cuenta una vez; una opcion distinta despues no reemplaza la primera',
  async () => {
    const yo = await api.altaAnonima()
    const id = nuevoId()
    await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: id, p_leccion_id: L1 })
    const [a1, a2] = await opcionesDeLeccion(bd, L1)

    const pedido = { p_intento_id: id, p_pregunta_id: a1.pregunta, p_opcion_id: a1.correcta }
    const primera = await api.rpc(yo.token, 'responder_actividad', pedido)
    const repetida = await api.rpc(yo.token, 'responder_actividad', pedido)
    const otraOpcion = await api.rpc(yo.token, 'responder_actividad', { ...pedido, p_opcion_id: a1.incorrecta })

    // Cinco a la vez sobre la actividad 2 (dos pestanas, reintentos automaticos...).
    const rafaga = await Promise.all(Array.from({ length: 5 }, () =>
      api.rpc(yo.token, 'responder_actividad', { p_intento_id: id, p_pregunta_id: a2.pregunta, p_opcion_id: a2.incorrecta })))

    const [fila] = await consulta('select aciertos, errores from intentos where id = $1', [id])
    const [{ n }] = await consulta('select count(*)::int as n from respuestas where intento_id = $1', [id])
    verificar(primera.datos.repetida === false && repetida.datos.repetida === true, 'no marco la repeticion')
    verificar(otraOpcion.datos.repetida === true && otraOpcion.datos.opcion_id === a1.correcta && otraOpcion.datos.correcta === true,
      'una opcion distinta reemplazo a la guardada')
    verificar(rafaga.every((r) => r.estado === 200) && rafaga.filter((r) => !r.datos.repetida).length === 1,
      `rafaga: ${rafaga.map((r) => `${r.estado}/${r.datos?.repetida}`)}`)
    verificar(n === 2 && fila.aciertos === 1 && fila.errores === 1, `respuestas ${n}, ${fila.aciertos}/${fila.errores}`)

    // La restriccion esta en la tabla, no solo en la funcion.
    let rechazo = ''
    try {
      await consulta(
        "insert into respuestas (intento_id, pregunta_id, opcion_id, es_correcta, orden) values ($1, $2, $3, true, 3)",
        [id, a1.pregunta, a1.correcta])
    } catch (e) {
      rechazo = e.constraint ?? e.code
    }
    verificar(rechazo === 'pk_respuestas', `insert duplicado directo: ${rechazo || 'entro'}`)
    return `repetida: 1 sola fila · otra opcion despues: vale la primera · 5 simultaneas: 1 guardada y 4 "repetida" · total 2 respuestas, 1 acierto y 1 error · duplicado directo en la tabla: rechazado por ${rechazo}`
  }
)

// ===========================================================================
//  B. REGLAS DE LA ETAPA 2 APLICADAS POR EL SERVIDOR
// ===========================================================================

await caso(
  5,
  'Repetir una leccion conserva los intentos anteriores',
  'Cada repeticion es un intento nuevo (2, 3...); los anteriores quedan con sus respuestas, y un intento peor no quita la aprobacion',
  async () => {
    const yo = await api.altaAnonima()
    const uno = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 4 })
    const dos = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 1 })
    const tres = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 2 })
    const filas = await consulta(
      `select numero, estado, aciertos, aprobado, (select count(*)::int from respuestas r where r.intento_id = i.id) as respuestas
         from intentos i where usuario_id = $1 and leccion_id = $2 order by numero`, [yo.id, L1])
    verificar(filas.length === 3 && filas.map((f) => f.numero).join() === '1,2,3', `numeros: ${filas.map((f) => f.numero)}`)
    verificar(filas.every((f) => f.estado === 'completado' && f.respuestas === 4), 'algun intento perdio respuestas')
    verificar(filas[0].aprobado && !filas[1].aprobado && !filas[2].aprobado, 'aprobado mal calculado')
    // La aprobacion del 1 sigue valiendo: la leccion 2 esta habilitada.
    const l2 = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L2 })
    verificar(l2.estado === 200, `leccion 2: ${l2.estado} ${l2.datos?.hint}`)
    const ids = new Set([uno, dos, tres].map((r) => r.intento.id))
    verificar(ids.size === 3, 'se reutilizo un intento')
    return `intentos 1, 2 y 3 guardados con 4 respuestas cada uno (4/4 aprobado, 1/4, 2/4) · la leccion 2 sigue habilitada por el intento 1`
  }
)

await caso(
  6,
  'Tres errores antes de la ultima actividad cortan el intento',
  'El intento queda "sin vidas", no completado ni aprobado, y no acepta mas respuestas; el tercer error en la ultima si completa',
  async () => {
    const yo = await api.altaAnonima()
    const corto = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 0 })
    verificar(corto.intento.estado === 'sin_vidas' && corto.intento.respondidas === 3 && corto.intento.vidas === 0 && !corto.intento.aprobado,
      `sin vidas: ${JSON.stringify(corto.intento)}`)
    const [, , , a4] = await opcionesDeLeccion(bd, L1)
    const despues = await api.rpc(yo.token, 'responder_actividad', {
      p_intento_id: corto.intento.id, p_pregunta_id: a4.pregunta, p_opcion_id: a4.correcta })
    verificar(despues.estado >= 400 && despues.datos.hint === 'intento_cerrado', `respuesta tras cortar: ${despues.estado}`)

    const alFinal = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 1 }) // bien, mal, mal, mal
    verificar(alFinal.intento.estado === 'completado' && alFinal.intento.errores === 3 && !alFinal.intento.aprobado,
      `tercer error en la ultima: ${alFinal.intento.estado}`)
    const l2 = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L2 })
    verificar(l2.estado >= 400 && l2.datos.hint === 'leccion_bloqueada', 'completar sin aprobar habilito la siguiente')
    return `0 aciertos: sin_vidas tras 3 respuestas, 0 vidas · responder despues: ${despues.datos.hint} · 1/4 con el 3er error en la ultima: completado sin aprobar · la leccion 2 sigue bloqueada`
  }
)

await caso(
  7,
  'El servidor aplica el desbloqueo acordado en la etapa 2',
  'No se puede empezar una leccion bloqueada aunque se arme la peticion; aprobar (60 %) la anterior la habilita, y la unidad 2 espera a la 1',
  async () => {
    const yo = await api.altaAnonima()
    const intentar = (leccion) => api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: leccion })
    const pasos = []
    pasos.push(['L2 sin nada', (await intentar(L2)).datos.hint ?? 'ok'])
    await resolverPorApi(api, bd, yo.token, L1, { aciertos: 2 })
    pasos.push(['L2 con L1 en 50 %', (await intentar(L2)).datos.hint ?? 'ok'])
    await resolverPorApi(api, bd, yo.token, L1, { aciertos: 3 })
    pasos.push(['L2 con L1 en 75 %', (await intentar(L2)).datos.hint ?? 'ok'])
    pasos.push(['L3 sin L2', (await intentar(L3)).datos.hint ?? 'ok'])

    // Unidad 2: se publica una leccion de prueba y se quita al final.
    await consulta("update unidades set estado = 'publicada' where id = 'js-u2'")
    await consulta(`insert into lecciones (id, unidad_id, orden, titulo, descripcion, icono, explicacion, estado)
      values ('prueba-u2-l1', 'js-u2', 1, 'Leccion de prueba', 'Solo para la prueba automatica.', 'pieza',
              'Texto de teoria para la prueba automatica.', 'publicada')`)
    await consulta(`insert into preguntas (id, leccion_id, orden, enunciado, explicacion, estado)
      values ('prueba-u2-l1-a1', 'prueba-u2-l1', 1, 'Pregunta de prueba', 'Explicacion de prueba.', 'borrador')`)
    await consulta(`insert into opciones (id, pregunta_id, orden, texto, es_correcta) values
      ('prueba-u2-l1-a1-a', 'prueba-u2-l1-a1', 1, 'Si', true), ('prueba-u2-l1-a1-b', 'prueba-u2-l1-a1', 2, 'No', false)`)
    await consulta("update preguntas set estado = 'publicada' where id = 'prueba-u2-l1-a1'")
    try {
      pasos.push(['U2 con U1 incompleta', (await intentar('prueba-u2-l1')).datos.hint ?? 'ok'])
      await resolverPorApi(api, bd, yo.token, L2, { aciertos: 4 })
      await resolverPorApi(api, bd, yo.token, L3, { aciertos: 4 })
      pasos.push(['U2 con U1 aprobada', (await intentar('prueba-u2-l1')).datos.hint ?? 'ok'])
    } finally {
      await consulta("delete from intentos where leccion_id = 'prueba-u2-l1'")
      await consulta("delete from lecciones where id = 'prueba-u2-l1'")
      await consulta("update unidades set estado = 'proximamente' where id = 'js-u2'")
    }
    const esperado = ['leccion_bloqueada', 'leccion_bloqueada', 'ok', 'leccion_bloqueada', 'leccion_bloqueada', 'ok']
    const obtenido = pasos.map(([, r]) => r)
    verificar(JSON.stringify(obtenido) === JSON.stringify(esperado), pasos.map((p) => p.join(': ')).join(' · '))
    return pasos.map((p) => p.join(': ')).join(' · ')
  }
)

await caso(
  8,
  'Empezar de nuevo con un intento a medias',
  'El intento anterior queda "abandonado" con sus respuestas (no se borra) y hay un solo intento en curso por leccion',
  async () => {
    const yo = await api.altaAnonima()
    const primero = nuevoId()
    await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: primero, p_leccion_id: L1 })
    const [a1] = await opcionesDeLeccion(bd, L1)
    await api.rpc(yo.token, 'responder_actividad', { p_intento_id: primero, p_pregunta_id: a1.pregunta, p_opcion_id: a1.correcta })
    const segundo = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L1 })

    const filas = await consulta(
      `select numero, estado, finalizado_en is not null as cerrado,
              (select count(*)::int from respuestas r where r.intento_id = i.id) as respuestas
         from intentos i where usuario_id = $1 order by numero`, [yo.id])
    verificar(segundo.datos.numero === 2, `numero ${segundo.datos.numero}`)
    verificar(filas[0].estado === 'abandonado' && filas[0].cerrado && filas[0].respuestas === 1, `anterior: ${JSON.stringify(filas[0])}`)
    verificar(filas.filter((f) => f.estado === 'en_curso').length === 1, 'quedaron dos en curso')

    let rechazo = ''
    try {
      await consulta("update intentos set estado = 'en_curso', finalizado_en = null where usuario_id = $1 and numero = 1", [yo.id])
    } catch (e) {
      rechazo = e.constraint ?? e.code
    }
    verificar(rechazo === 'uq_intentos_en_curso', `dos en curso a la fuerza: ${rechazo || 'entro'}`)
    return `intento 1: abandonado, cerrado, conserva 1 respuesta · intento 2: en curso · forzar dos en curso en la tabla: rechazado por ${rechazo}`
  }
)

await caso(
  9,
  'Un participante no cambia el progreso de otro',
  'Responder, abandonar, reusar el id, leer o borrar intentos ajenos no tiene efecto; el progreso de B queda identico',
  async () => {
    const a = await api.altaAnonima()
    const b = await api.altaAnonima()
    const deB = nuevoId()
    await api.rpc(b.token, 'iniciar_intento', { p_intento_id: deB, p_leccion_id: L1 })
    const [a1, a2] = await opcionesDeLeccion(bd, L1)
    await api.rpc(b.token, 'responder_actividad', { p_intento_id: deB, p_pregunta_id: a1.pregunta, p_opcion_id: a1.incorrecta })
    const terminadoDeB = await resolverPorApi(api, bd, b.token, L1, { aciertos: 4 }) // abandona deB y completa otro
    const antes = await fotoDe(b.id)

    const r = {
      responder: await api.rpc(a.token, 'responder_actividad', { p_intento_id: terminadoDeB.intento.id, p_pregunta_id: a2.pregunta, p_opcion_id: a2.correcta }),
      abandonar: await api.rpc(a.token, 'abandonar_intento', { p_intento_id: terminadoDeB.intento.id }),
      reusarId: await api.rpc(a.token, 'iniciar_intento', { p_intento_id: deB, p_leccion_id: L1 }),
      leerIntentos: await api.datos(a.token, 'GET', `intentos?select=id&usuario_id=eq.${b.id}`),
      leerRespuestas: await api.datos(a.token, 'GET', `respuestas?select=intento_id&intento_id=eq.${deB}`),
      borrar: await api.datos(a.token, 'DELETE', `intentos?usuario_id=eq.${b.id}&select=id`, undefined, 'return=representation'),
      cambiar: await api.datos(a.token, 'PATCH', `intentos?usuario_id=eq.${b.id}`, { aciertos: 0 })
    }
    verificar(r.responder.estado >= 400 && r.responder.datos.hint === 'intento_no_encontrado', `responder: ${r.responder.estado}`)
    verificar(r.abandonar.estado >= 400 && r.abandonar.datos.hint === 'intento_no_encontrado', `abandonar: ${r.abandonar.estado}`)
    verificar(r.reusarId.estado >= 400, `reusar id: ${r.reusarId.estado}`)
    verificar(r.leerIntentos.datos.length === 0 && r.leerRespuestas.datos.length === 0, 'A leyo datos de B')
    verificar(r.borrar.datos.length === 0 && r.cambiar.estado === 403, `borrar ${r.borrar.datos.length} filas, cambiar ${r.cambiar.estado}`)
    verificar((await fotoDe(b.id)) === antes, 'el progreso de B cambio')

    const sinSesion = await api.rpc(null, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L1 })
    verificar(sinSesion.estado === 401, `sin sesion: ${sinSesion.estado}`)
    return `responder/abandonar el de B: ${r.responder.datos.hint} · reusar su id: ${r.reusarId.estado} · leer: 0 filas · borrar: 0 filas · modificar: ${r.cambiar.estado} · progreso de B identico · sin sesion (anon): ${sinSesion.estado}`
  }
)

await caso(
  10,
  'Cambiar el contenido publicado no altera el historial',
  'Corregir la opcion correcta o despublicar una leccion no cambia los intentos ya guardados; borrar contenido con intentos se rechaza',
  async () => {
    const yo = await api.altaAnonima()
    const { intento } = await resolverPorApi(api, bd, yo.token, L1, { aciertos: 4 })
    const antes = await fotoDe(yo.id)

    // Se "corrige" la pregunta 1: la opcion correcta pasa a ser otra.
    const [a1] = await opcionesDeLeccion(bd, L1)
    await bd.query('begin')
    await bd.query('update opciones set es_correcta = false where id = $1', [a1.correcta])
    await bd.query('update opciones set es_correcta = true where id = $1', [a1.incorrecta])
    await bd.query('commit')
    const trasCorregir = await fotoDe(yo.id)

    await consulta("update lecciones set estado = 'borrador' where id = $1", [L1])
    const visible = await api.datos(yo.token, 'GET', `intentos?select=id,aciertos&leccion_id=eq.${L1}`)
    await consulta("update lecciones set estado = 'publicada' where id = $1", [L1])

    let borrar = ''
    try {
      await consulta('delete from lecciones where id = $1', [L1])
    } catch (e) {
      borrar = e.constraint ?? e.code
    }

    await bd.query('begin')
    await bd.query('update opciones set es_correcta = false where id = $1', [a1.incorrecta])
    await bd.query('update opciones set es_correcta = true where id = $1', [a1.correcta])
    await bd.query('commit')

    verificar(trasCorregir === antes, 'el historial cambio al corregir el contenido')
    verificar(visible.datos.length === 1 && visible.datos[0].aciertos === 4, 'despublicar oculto el historial')
    // Lo frena la clave del intento o la de sus respuestas (on delete restrict), segun cual se revise primero.
    verificar(['fk_intentos_leccion', 'fk_respuestas_pregunta', 'fk_respuestas_opcion'].includes(borrar), `borrar leccion con intentos: ${borrar || 'se borro'}`)
    return `tras corregir la opcion correcta: intento ${intento.numero} sigue 4/4 y sus respuestas igual · leccion despublicada: el intento se sigue viendo · borrar la leccion: rechazado (${borrar})`
  }
)

await caso(
  11,
  'El historial de la etapa 4 se conserva al migrar',
  'Los renglones de intentos_leccion pasan a intentos "etapa4" completados, numerados despues de los existentes, y siguen habilitando lecciones',
  async () => {
    const yo = await api.altaAnonima()
    await resolverPorApi(api, bd, yo.token, L1, { aciertos: 1 }) // intento 1, sin aprobar
    await consulta(`create table public.intentos_leccion (
      id bigint generated always as identity primary key, usuario_id uuid, leccion_id text,
      aciertos smallint, total smallint, creado_en timestamptz default now())`)
    await consulta(`insert into intentos_leccion (usuario_id, leccion_id, aciertos, total, creado_en) values
      ($1, $2, 4, 4, now() - interval '3 days'), ($1, $2, 2, 4, now() - interval '2 days')`, [yo.id, L1])
    await bd.query(readFileSync(new URL('../supabase/08-intentos-y-respuestas.sql', import.meta.url), 'utf8'))

    const filas = await consulta(
      'select numero, estado, origen, aciertos, aprobado from intentos where usuario_id = $1 order by numero', [yo.id])
    const [{ existe }] = await consulta("select to_regclass('public.intentos_leccion') is not null as existe")
    verificar(!existe, 'la tabla vieja sigue existiendo')
    verificar(filas.length === 3 && filas[1].origen === 'etapa4' && filas[1].numero === 2 && filas[2].numero === 3,
      `filas: ${JSON.stringify(filas)}`)
    verificar(filas[1].aprobado === true && filas[2].aprobado === false && filas.every((f) => f.estado === 'completado'), 'aprobado mal migrado')
    const l2 = await api.rpc(yo.token, 'iniciar_intento', { p_intento_id: nuevoId(), p_leccion_id: L2 })
    verificar(l2.estado === 200, `leccion 2 tras migrar: ${l2.estado}`)
    // Y la vista del propio historial los incluye.
    const propios = await api.datos(yo.token, 'GET', 'intentos?select=origen')
    verificar(propios.datos.filter((f) => f.origen === 'etapa4').length === 2, 'no se ven los migrados')
    return `2 renglones viejos -> intentos 2 y 3 (origen etapa4, completados; 4/4 aprobado, 2/4 no) · tabla vieja eliminada · la leccion 2 queda habilitada`
  }
)

// ===========================================================================
//  C. LA APP: CIERRE, REAPERTURA, OTRO DISPOSITIVO, DESCONEXION
// ===========================================================================

await caso(
  12,
  'Cerrar la app a mitad de una leccion y volver a abrirla',
  'Al volver, la leccion ofrece seguir el intento: retoma en la actividad 3 con las vidas que tenia, y al terminar el resultado se confirma',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const bien = await textosDe(L1, true)
    const mal = await textosDe(L1, false)
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await responderEnPantalla(p, bien[0])
    await responderEnPantalla(p, mal[1], { continuar: false })
    await p.close() // se cierra la pestana sin tocar "Continuar"

    const p2 = await pagina(ctx)
    await p2.goto(`${URL_APP}/lecciones/${L1}`, { waitUntil: 'networkidle' })
    const aviso = p2.locator('[data-prueba="intento-en-curso"]')
    await aviso.waitFor({ timeout: 8000 })
    const textoAviso = (await aviso.innerText()).replace(/\s+/g, ' ')
    verificar(/2 de 4 respondidas, 2 vidas/.test(textoAviso), `aviso: ${textoAviso}`)
    await p2.getByRole('button', { name: 'Continuar el intento' }).click()
    await p2.waitForSelector('.opcion')
    const encabezado = await p2.locator('.leccion__tipo').innerText()
    const vidas = (await p2.locator('[data-prueba="vidas"]').innerText()).trim()
    verificar(/EJERCICIO 3 DE 4/i.test(encabezado) && vidas === '2', `retomo en: ${encabezado}, vidas ${vidas}`)

    await responderEnPantalla(p2, bien[2])
    await responderEnPantalla(p2, bien[3])
    await p2.waitForURL(/resultados\?intento=/, { timeout: 8000 })
    await p2.locator('[data-prueba="estado-resultado"][data-estado="confirmado"]').waitFor({ timeout: 8000 })
    await dormir(900)
    const t = await texto(p2)
    verificar(t.includes('Resultado guardado') && t.includes('3 Correctas') && t.includes('1 Incorrectas'), `resultados: ${t.slice(0, 200)}`)
    // El XP y el progreso de la unidad salen del catalogo: tienen que estar aunque se llegue directo.
    const xp = Number(t.match(/\+(\d+) XP/)?.[1] ?? 0)
    verificar(xp > 0 && !/Primeros pasos 0 %/.test(t), `XP ${xp} · ${t.match(/Unidad 1[^%]*%/)?.[0]}`)
    const id = (await leerSesion(p2)).user.id
    const [{ n }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [id])
    verificar(n === 1, `intentos: ${n}`)
    await ctx.close()
    return `al volver: "${textoAviso.slice(0, 60)}..." · retoma en ejercicio 3 de 4 con ${vidas} vidas · resultado confirmado 3/4, +${xp} XP · 1 solo intento en la base`
  }
)

await caso(
  13,
  'Consultar el progreso desde otro dispositivo con una cuenta',
  'Lo hecho en el dispositivo 1 aparece en el 2 (lecciones, ultimo intento, historial) y un intento a medias se retoma alla',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('dispositivos'), alias: 'Viajera' })
    const bien = await textosDe(L1, true)
    const bienL2 = await textosDe(L2, true)

    const celular = await contexto()
    const p1 = await pagina(celular)
    await entrarConCuenta(p1, cuenta)
    await p1.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    for (const t of bien) await responderEnPantalla(p1, t)
    await p1.waitForURL(/resultados/)
    // Empieza la leccion 2 y la deja en la actividad 2.
    await p1.goto(`${URL_APP}/lecciones/${L2}/actividades`, { waitUntil: 'networkidle' })
    await responderEnPantalla(p1, bienL2[0])

    const compu = await contexto({ viewport: { width: 1280, height: 900 } })
    const p2 = await pagina(compu)
    await entrarConCuenta(p2, cuenta)
    await p2.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(800)
    const l1 = p2.locator(`[data-prueba="mis-lecciones"] [data-leccion="${L1}"]`)
    const l2 = p2.locator(`[data-prueba="mis-lecciones"] [data-leccion="${L2}"]`)
    const situacionL1 = await l1.getAttribute('data-situacion')
    const situacionL2 = await l2.getAttribute('data-situacion')
    const historial = await p2.locator('[data-prueba="historial"] [data-intento]').count()
    verificar(situacionL1 === 'aprobada' && situacionL2 === 'en_curso' && historial === 2,
      `en el dispositivo 2: L1 ${situacionL1}, L2 ${situacionL2}, historial ${historial}`)

    await p2.goto(`${URL_APP}/lecciones/${L2}/actividades`, { waitUntil: 'networkidle' })
    await p2.waitForSelector('.opcion')
    const encabezado = await p2.locator('.leccion__tipo').innerText()
    verificar(/EJERCICIO 2 DE 4/i.test(encabezado), `retomo en: ${encabezado}`)
    await celular.close()
    await compu.close()
    return `dispositivo 2: L1 aprobada, L2 en curso, ${historial} intentos en el historial · abre L2 en el ejercicio 2 de 4, donde quedo en el dispositivo 1`
  }
)

await caso(
  14,
  'Perder la conexion al responder y cerrar la app',
  'Sin conexion la respuesta queda "pendiente" (no se corrige ni se da por guardada); al volver a abrir con conexion se manda sola, una vez',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const bien = await textosDe(L1, true)
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')

    await ctx.setOffline(true)
    await p.getByRole('button', { name: bien[0], exact: true }).first().click()
    await p.getByRole('button', { name: /Comprobar/ }).click()
    try {
      await p.locator('[data-prueba="estado-guardado"][data-estado="pendiente"]').waitFor({ timeout: 10000 })
    } catch (e) {
      throw new Error(`no quedo pendiente; estado: ${await p.locator('[data-prueba="estado-guardado"]').getAttribute('data-estado').catch(() => 'ninguno')} · ${(await texto(p)).slice(0, 300)}`)
    }
    const mientras = await texto(p)
    const sinCorreccion = (await p.locator('.feedback').count()) === 0
    const guardadasSinRed = await contarRespuestas(id)
    verificar(mientras.includes('Pendiente: sin conexion') && mientras.includes('todavia NO se guardo'), 'no aviso que esta pendiente')
    verificar(sinCorreccion && guardadasSinRed === 0, `correccion: ${!sinCorreccion}, guardadas: ${guardadasSinRed}`)
    // Se cierra la app: primero se descarga (si no, la pestana que se esta cerrando
    // todavia escucha el evento "online" y reenvia ella misma la respuesta).
    await p.goto('about:blank')
    await p.close()

    await ctx.setOffline(false)
    const p2 = await pagina(ctx)
    await p2.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    try {
      await p2.locator('[data-prueba="estado-guardado"][data-estado="guardado"]').waitFor({ timeout: 10000 })
    } catch (e) {
      const pendiente = await p2.evaluate(() => localStorage.getItem('sintaxia:respuesta-pendiente'))
      throw new Error(`no se reenvio; estado: ${await p2.locator('[data-prueba="estado-guardado"]').getAttribute('data-estado', { timeout: 500 }).catch(() => 'ninguno')} · pendiente: ${pendiente} · url ${p2.url()} · ${(await texto(p2)).slice(0, 200)}`)
    }
    await p2.waitForSelector('.feedback')
    const guardadas = await contarRespuestas(id)
    verificar(guardadas === 1, `respuestas guardadas: ${guardadas}`)
    await ctx.close()
    return `sin red: "Pendiente: sin conexion", sin correccion, 0 guardadas · al reabrir con red: se mando sola, "Respuesta guardada", 1 guardada`
  }
)

await caso(
  15,
  'Se pierde la respuesta del servidor y se repite la peticion',
  'La respuesta llego pero la confirmacion no: la app la muestra pendiente; al reintentar el servidor devuelve la guardada sin sumar otra',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const bien = await textosDe(L1, true)
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')

    // La peticion llega al servidor y se guarda; la respuesta se "pierde" en el camino.
    await p.route('**/rest/v1/rpc/responder_actividad', async (ruta) => {
      await ruta.fetch()
      await ruta.abort('connectionreset')
    })
    await p.getByRole('button', { name: bien[0], exact: true }).first().click()
    await p.getByRole('button', { name: /Comprobar/ }).click()
    await p.locator('[data-prueba="estado-guardado"][data-estado="pendiente"]').waitFor({ timeout: 10000 })
    const enLaBase = await contarRespuestas(id)

    await p.unroute('**/rest/v1/rpc/responder_actividad')
    await p.getByRole('button', { name: 'Reintentar' }).click()
    await p.locator('[data-prueba="estado-guardado"][data-estado="guardado"]').waitFor({ timeout: 10000 })
    const titulo = await p.locator('.feedback__titulo').innerText()
    const [fila] = await consulta('select aciertos, errores from intentos where usuario_id = $1', [id])
    const despues = await contarRespuestas(id)
    verificar(enLaBase === 1 && despues === 1, `respuestas: ${enLaBase} -> ${despues}`)
    verificar(fila.aciertos === 1 && fila.errores === 0 && titulo === 'Muy bien!', `intento ${fila.aciertos}/${fila.errores}, ${titulo}`)
    await ctx.close()
    return `sin confirmacion: la app dice "pendiente" aunque la base ya tenia ${enLaBase} · reintento: "${titulo}" y "Respuesta guardada" · respuestas: ${despues}, aciertos: ${fila.aciertos}`
  }
)

await caso(
  16,
  'La pantalla de resultados no afirma lo que no confirmo',
  'Sin conexion dice que no pudo confirmar (no "guardado"); con conexion muestra lo del servidor aunque la direccion traiga otros numeros',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const sesion = await leerSesion(p)
    const { intento } = await resolverPorApi(api, bd, sesion.access_token, L1, { aciertos: 2 })
    const url = `${URL_APP}/lecciones/${L1}/resultados?intento=${intento.id}&aciertos=4&total=4&guardado=1`

    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await p.route('**/rest/v1/intentos*', (ruta) => ruta.abort())
    await p.goto(url, { waitUntil: 'domcontentloaded' })
    await p.locator('[data-prueba="estado-resultado"][data-estado="error"]').waitFor({ timeout: 10000 })
    const sinRed = await texto(p)
    verificar(!sinRed.includes('Resultado guardado') && sinRed.includes('No pudimos confirmar tu resultado'), 'afirmo guardado sin confirmar')
    verificar(!sinRed.includes('4 Correctas'), 'mostro los numeros de la direccion')

    await p.unroute('**/rest/v1/intentos*')
    await p.getByRole('button', { name: 'Reintentar' }).click()
    await p.locator('[data-prueba="estado-resultado"][data-estado="confirmado"]').waitFor({ timeout: 10000 })
    await dormir(900)
    const conRed = await texto(p)
    verificar(conRed.includes('Resultado guardado') && conRed.includes('2 Correctas') && conRed.includes('Leccion no aprobada'),
      `con red: ${conRed.slice(0, 160)}`)
    // Se abrio la pantalla directo (sin pasar por el curso): el XP igual tiene que salir.
    const xp = Number(conRed.match(/\+(\d+) XP/)?.[1] ?? 0)
    verificar(xp > 0, `XP mostrado: ${xp}`)

    // El intento de otra persona no se puede mirar.
    const otro = await api.altaAnonima()
    const ajeno = await resolverPorApi(api, bd, otro.token, L1, { aciertos: 4 })
    await p.goto(`${URL_APP}/lecciones/${L1}/resultados?intento=${ajeno.intento.id}`, { waitUntil: 'networkidle' })
    await p.locator('[data-prueba="estado-resultado"][data-estado="no-encontrado"]').waitFor({ timeout: 8000 })
    await ctx.close()
    return `sin red: "No pudimos confirmar tu resultado" y ningun numero · con red: "Resultado guardado" con 2 correctas (la direccion decia 4) y +${xp} XP · intento ajeno: "No encontramos ese intento"`
  }
)

await caso(
  17,
  'Salir de la leccion y empezar de nuevo',
  'Salir deja el intento en curso (no se pierde nada); "Empezar de nuevo" crea el intento 2 y el 1 queda abandonado en el historial',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const bien = await textosDe(L1, true)
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await responderEnPantalla(p, bien[0])
    await p.getByRole('button', { name: 'Salir', exact: true }).click()
    await p.waitForURL(`**/lecciones/${L1}`)
    const [enCurso] = await consulta('select estado from intentos where usuario_id = $1', [id])
    verificar(enCurso.estado === 'en_curso', `tras salir: ${enCurso.estado}`)

    await p.locator('[data-prueba="intento-en-curso"]').waitFor({ timeout: 8000 })
    await p.getByRole('button', { name: 'Empezar de nuevo' }).click()
    await p.waitForSelector('.opcion')
    const encabezado = await p.locator('.leccion__tipo').innerText()
    const filas = await consulta('select numero, estado from intentos where usuario_id = $1 order by numero', [id])
    verificar(/EJERCICIO 1 DE 4/i.test(encabezado) && /intento 2/i.test(encabezado), `encabezado: ${encabezado}`)
    verificar(filas.map((f) => `${f.numero}:${f.estado}`).join() === '1:abandonado,2:en_curso', `filas: ${JSON.stringify(filas)}`)

    // Recargar la pagina no crea un tercero (el ?nuevo=1 ya se consumio).
    await p.reload({ waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')
    const [{ n }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [id])
    verificar(n === 2, `tras recargar: ${n} intentos`)
    await ctx.close()
    return `salir: intento 1 sigue en curso · "Empezar de nuevo": ejercicio 1 de 4 del intento 2, el 1 abandonado · recargar no crea otro (${n} intentos)`
  }
)

await caso(
  18,
  'El perfil separa lecciones, ultimo intento e historial',
  'Muestra completadas y pendientes; el mejor resultado y el ultimo intento por separado; y el historial con todos los intentos',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const token = (await leerSesion(p)).access_token
    await resolverPorApi(api, bd, token, L1, { aciertos: 4 })
    await resolverPorApi(api, bd, token, L1, { aciertos: 1 })
    await resolverPorApi(api, bd, token, L2, { aciertos: 0 })
    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(800)

    const fila = (l) => p.locator(`[data-prueba="mis-lecciones"] [data-leccion="${l}"]`)
    const situaciones = [await fila(L1).getAttribute('data-situacion'), await fila(L2).getAttribute('data-situacion'), await fila(L3).getAttribute('data-situacion')]
    const datosL1 = (await fila(L1).innerText()).replace(/\s+/g, ' ')
    const cabecera = (await p.locator('[data-prueba="mis-lecciones"] .tarjeta__dato').innerText()).replace(/\s+/g, ' ')
    const historial = await p.locator('[data-prueba="historial"] [data-intento]').evaluateAll((els) => els.map((e) => e.dataset.estado))
    verificar(situaciones.join() === 'aprobada,pendiente,bloqueada', `situaciones: ${situaciones}`)
    verificar(/Mejor: 100 %/.test(datosL1) && /Ultimo: 1\/4 \(completado\)/.test(datosL1) && /2 intentos/.test(datosL1), `L1: ${datosL1}`)
    verificar(/1 completadas · 2 pendientes/.test(cabecera), `cabecera: ${cabecera}`)
    verificar(historial.join() === 'sin_vidas,completado,completado', `historial: ${historial}`)

    const desbordes = []
    for (const ancho of [360, 320]) {
      await p.setViewportSize({ width: ancho, height: 800 })
      await dormir(200)
      const salen = await quienDesborda(p)
      if (salen.length) desbordes.push(`${ancho}: ${salen.join(' ')}`)
    }
    verificar(desbordes.length === 0, `desborda: ${desbordes.join(' | ')}`)
    await ctx.close()
    return `L1 aprobada (mejor 100 %, ultimo 1/4), L2 pendiente (su intento quedo sin vidas), L3 bloqueada · "${cabecera}" · historial: ${historial.join(', ')} · sin desbordes a 360 y 320 px`
  }
)

await caso(
  19,
  'Una leccion bloqueada no se puede abrir desde la direccion',
  'Ir directo a las actividades de la leccion 2 muestra "Esta leccion esta bloqueada" y no crea ningun intento',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    await p.goto(`${URL_APP}/lecciones/${L2}/actividades`, { waitUntil: 'networkidle' })
    await p.getByRole('heading', { name: 'Esta leccion esta bloqueada' }).waitFor({ timeout: 8000 })
    const [{ n }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [id])
    verificar(n === 0, `intentos creados: ${n}`)
    await ctx.close()
    return `"Esta leccion esta bloqueada" · intentos creados: ${n}`
  }
)

await caso(
  20,
  'Volver a correr los scripts 08 a 10 no pierde progreso ni permisos',
  'Los intentos y respuestas quedan iguales y cada persona sigue viendo solo lo suyo',
  async () => {
    const yo = await api.altaAnonima()
    await resolverPorApi(api, bd, yo.token, L1, { aciertos: 3 })
    const contar = async () =>
      (await consulta('select (select count(*) from intentos)::int as i, (select count(*) from respuestas)::int as r'))[0]
    const antes = await contar()
    const fotoAntes = await fotoDe(yo.id)
    for (const archivo of ['08-intentos-y-respuestas', '09-funciones-intentos', '10-politicas-rls-etapa5']) {
      await bd.query(readFileSync(new URL(`../supabase/${archivo}.sql`, import.meta.url), 'utf8'))
    }
    const despues = await contar()
    const propios = await api.datos(yo.token, 'GET', 'intentos?select=usuario_id')
    const escribir = await api.datos(yo.token, 'POST', 'intentos', { leccion_id: L1, numero: 5, total_actividades: 4 })
    verificar(JSON.stringify(antes) === JSON.stringify(despues), `conteos: ${JSON.stringify(antes)} -> ${JSON.stringify(despues)}`)
    verificar((await fotoDe(yo.id)) === fotoAntes, 'cambio el progreso al re-ejecutar')
    verificar(propios.datos.every((f) => f.usuario_id === yo.id), 've intentos ajenos')
    const seguir = await resolverPorApi(api, bd, yo.token, L2, { aciertos: 4 })
    verificar(escribir.estado === 403 && seguir.intento?.estado === 'completado', `escribir ${escribir.estado}, seguir ${seguir.intento?.estado}`)
    return `intentos ${antes.i} y respuestas ${antes.r} antes y despues · solo ve lo propio · escribir directo: ${escribir.estado} · las funciones siguen andando`
  }
)

await caso(
  21,
  'Se pierde la respuesta al empezar el intento y se reintenta',
  'El servidor ya lo habia creado: al reintentar la app manda el mismo id y queda un solo intento',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    await p.route('**/rest/v1/rpc/iniciar_intento', async (ruta) => {
      await ruta.fetch()
      await ruta.abort('connectionreset')
    })
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /Reintentar/ }).waitFor({ timeout: 10000 })
    const [{ n: creados }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [id])

    await p.unroute('**/rest/v1/rpc/iniciar_intento')
    await p.getByRole('button', { name: /Reintentar/ }).click()
    await p.waitForSelector('.opcion')
    const [{ n }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [id])
    verificar(creados === 1 && n === 1, `intentos: ${creados} -> ${n}`)
    await ctx.close()
    return `la primera peticion creo ${creados} intento y su respuesta se perdio · "Reintentar" repite el mismo id · intentos: ${n}`
  }
)

await caso(
  22,
  'Vuelve la conexion con la leccion abierta',
  'La respuesta pendiente se manda sola al reconectarse, sin tocar nada, y se guarda una vez',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const bien = await textosDe(L1, true)
    await p.goto(`${URL_APP}/lecciones/${L1}/actividades`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')
    await ctx.setOffline(true)
    await p.getByRole('button', { name: bien[0], exact: true }).first().click()
    await p.getByRole('button', { name: /Comprobar/ }).click()
    await p.locator('[data-prueba="estado-guardado"][data-estado="pendiente"]').waitFor({ timeout: 10000 })
    const antes = await contarRespuestas(id)
    await ctx.setOffline(false)
    await p.locator('[data-prueba="estado-guardado"][data-estado="guardado"]').waitFor({ timeout: 10000 })
    const despues = await contarRespuestas(id)
    verificar(antes === 0 && despues === 1, `respuestas: ${antes} -> ${despues}`)
    await ctx.close()
    return `sin red: pendiente, ${antes} guardadas · al reconectar: "Respuesta guardada" sola, ${despues} guardada`
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
