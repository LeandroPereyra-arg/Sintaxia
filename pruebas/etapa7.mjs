/**
 * Pruebas automaticas de la etapa 7: ranking publico con Realtime y panel de
 * administracion.
 *
 * Contra que se prueba: Supabase Auth real, PostgreSQL real con los scripts 00
 * a 16, la app en Chromium. Simulados: la capa HTTP de la API de datos
 * (PostgREST) y Supabase Realtime (pruebas/local/realtime.mjs: mismo protocolo
 * que usa @supabase/realtime-js, avisos solo de tablas publicadas y con control
 * de RLS).
 *
 * Preparacion: npm run supabase:local y npm run pruebas:entorno.
 * Despues:     npm run pruebas:etapa7        (SOLO=2,5 corre solo esos casos)
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

import {
  URL_APP,
  URL_SB,
  abrirBase,
  correoNuevo,
  crearApi,
  dormir,
  leerClaves,
  jugarPorApi,
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
const EVENTO = 'expo-2026'
const SPRINT = 'expo-2026-sprint'
const CODIGO = 'expo-2026-codigo'

/** Espera hasta que `condicion()` sea verdadera (o vence). */
async function esperarA(condicion, { ms = 15000, cada = 250, que = 'la condicion' } = {}) {
  const limite = Date.now() + ms
  while (Date.now() < limite) {
    if (await condicion()) return
    await dormir(cada)
  }
  throw new Error(`No se cumplio ${que} en ${ms} ms`)
}

/** Una cuenta confirmada con alias propio. */
const cuentaCon = (alias) => api.cuentaConfirmada({ correo: correoNuevo(alias.toLowerCase()), alias })

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
      // about:blank
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
const normalizar = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()

async function entrarConCuenta(p, cuenta, volver) {
  await p.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(volver)}`, { waitUntil: 'networkidle' })
  await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
  await p.getByLabel('Contrasena', { exact: true }).fill(cuenta.clave)
  await p.getByRole('button', { name: 'Entrar', exact: true }).click()
  await p.waitForURL(`**${volver}`, { timeout: 15000 })
  await dormir(400)
}

async function solucionesEnPantalla(desafioId) {
  const filas = await consulta(
    `select q.enunciado, coalesce(q.codigo, '') as codigo,
            max(o.texto) filter (where o.es_correcta) as bien,
            min(o.texto) filter (where not o.es_correcta) as mal
       from preguntas_desafio q join opciones_desafio o on o.pregunta_id = q.id
      where q.desafio_id = $1 group by q.id`, [desafioId])
  return new Map(filas.map((f) => [normalizar(f.enunciado) + '|' + normalizar(f.codigo), f]))
}

async function jugarEnPantalla(p, desafioId, aciertos) {
  const soluciones = await solucionesEnPantalla(desafioId)
  await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${desafioId}`, { waitUntil: 'networkidle' })
  for (let i = 0; i < 5; i++) {
    await p.waitForSelector('.opcion')
    const enunciado = normalizar(await p.locator('.partida__consigna').innerText())
    const codigo = (await p.locator('.partida .bloque-codigo').count()) ? normalizar(await p.locator('.partida .bloque-codigo').innerText()) : ''
    const s = soluciones.get(enunciado + '|' + codigo)
    await p.getByRole('button', { name: i < aciertos ? s.bien : s.mal, exact: true }).first().click()
    await p.getByRole('button', { name: /^(Responder|Reintentar)$/ }).click()
    await p.waitForSelector('.feedback', { timeout: 10000 })
    await p.locator('.feedback button').click()
    await dormir(120)
  }
  await p.locator('[data-prueba="puntaje-final"]').waitFor({ timeout: 10000 })
  return Number((await p.locator('[data-prueba="puntaje-final"]').innerText()).match(/\d+/)[0])
}

/** Filas del ranking que muestra la pantalla para un desafio: [{ alias, posicion, puntaje, participante, reciente }]. */
async function filasEnPantalla(p, desafioId) {
  return p.locator(`[data-desafio="${desafioId}"] .fila`).evaluateAll((els) =>
    els.map((e) => ({
      alias: e.querySelector('.fila__alias').innerText.replace(/\s+/g, ''),
      posicion: Number(e.dataset.posicion),
      puntaje: Number(e.querySelector('.fila__puntaje').innerText),
      participante: e.dataset.participante,
      reciente: e.dataset.reciente === 'si'
    })))
}

const aliasCompleto = async (usuarioId) => {
  const [p] = await consulta('select alias, codigo, id_publico from perfiles where id = $1', [usuarioId])
  return { texto: `${p.alias}#${String(p.codigo).padStart(4, '0')}`, participante: p.id_publico }
}

/** Abre la pantalla del ranking en una computadora (sin sesion) y espera la carga inicial "en vivo". */
async function abrirPantalla(ctx) {
  const p = await pagina(ctx)
  await p.goto(`${URL_APP}/expo/${EVENTO}/ranking`, { waitUntil: 'networkidle' })
  await p.locator('[data-prueba="estado-conexion"][data-estado="en-vivo"]').waitFor({ timeout: 15000 })
  return p
}

// Evento limpio para estas pruebas: se borran los resultados y partidas de corridas anteriores.
await consulta("delete from resultados_publicos where evento_id = $1", [EVENTO])
await consulta("delete from partidas where evento_id = $1", [EVENTO])
await consulta("update desafios set congelado_en = null where evento_id = $1", [EVENTO]).catch(() => {})
await consulta("update eventos set estado = 'abierto' where id = $1", [EVENTO])

// ===========================================================================
//  A. RANKING PUBLICO
// ===========================================================================

await caso(
  1,
  'Tres participantes en tres dispositivos y la pantalla en un cuarto navegador',
  'La pantalla (sin sesion) se actualiza sola cuando cada uno termina; los puntajes coinciden con los celulares y con la base; la partida recien terminada se resalta',
  async () => {
    const pantallaCtx = await contexto({ viewport: { width: 1600, height: 900 } })
    const pantalla = await abrirPantalla(pantallaCtx)

    const personas = [
      { alias: 'Abril', aciertos: 5, viewport: { width: 412, height: 900 } },
      { alias: 'Bauti', aciertos: 3, viewport: { width: 390, height: 844 } },
      { alias: 'Cami', aciertos: 4, viewport: { width: 768, height: 1024 } }
    ]
    const resultados = []
    for (const persona of personas) {
      const cuenta = await cuentaCon(persona.alias)
      const ctx = await contexto({ viewport: persona.viewport })
      const p = await pagina(ctx)
      await entrarConCuenta(p, cuenta, `/expo/${EVENTO}`)
      const visto = await jugarEnPantalla(p, SPRINT, persona.aciertos)
      const quien = await aliasCompleto(cuenta.id)
      // La pantalla grande se actualiza sola (sin recargar).
      await esperarA(async () => (await filasEnPantalla(pantalla, SPRINT)).some((f) => f.alias === quien.texto),
        { que: `que ${quien.texto} aparezca en la pantalla` })
      const fila = (await filasEnPantalla(pantalla, SPRINT)).find((f) => f.alias === quien.texto)
      const [enBase] = await consulta('select puntaje from resultados_publicos where participante = $1 and desafio_id = $2', [quien.participante, SPRINT])
      resultados.push({ alias: quien.texto, visto, pantalla: fila.puntaje, base: enBase.puntaje, reciente: fila.reciente })
      await ctx.close()
    }
    for (const r of resultados) {
      verificar(r.visto === r.pantalla && r.pantalla === r.base, `${r.alias}: celular ${r.visto}, pantalla ${r.pantalla}, base ${r.base}`)
    }
    verificar(resultados.every((r) => r.reciente), 'alguna partida recien terminada no se resalto')
    const filas = await filasEnPantalla(pantalla, SPRINT)
    verificar(filas.map((f) => f.puntaje).join() === '500,400,300', `orden en pantalla: ${filas.map((f) => f.puntaje)}`)
    const recargas = await pantalla.evaluate(() => performance.getEntriesByType('navigation').length)
    verificar(recargas === 1, 'la pantalla se recargo')
    await pantallaCtx.close()
    return resultados.map((r) => `${r.alias}: ${r.visto} en el celular = ${r.pantalla} en la pantalla = ${r.base} en la base`).join(' · ') + ' · sin recargar la pantalla · cada una resaltada al llegar'
  }
)

await caso(
  2,
  'Empates y mejor partida',
  'A igual puntaje gana el menor tiempo; con igual puntaje y tiempo comparten el puesto (1, 1, 3); repetir con un resultado peor no cambia la fila y con uno mejor la actualiza, sin duplicarla',
  async () => {
    const desafio = CODIGO
    await consulta('delete from resultados_publicos where desafio_id = $1', [desafio])
    const [a, b, c] = [await cuentaCon('Empate1'), await cuentaCon('Empate2'), await cuentaCon('Tercero')]
    const pa = await jugarPorApi(api, bd, a.token, desafio, { aciertos: 4 })
    const pb = await jugarPorApi(api, bd, b.token, desafio, { aciertos: 4 })
    const pc = await jugarPorApi(api, bd, c.token, desafio, { aciertos: 4 })
    // Mismo puntaje; se fijan los tiempos (medidos por el servidor) para ver el desempate.
    await consulta('update partidas set duracion_ms = 40000 where id = any($1)', [[pa.id, pb.id]])
    await consulta('update partidas set duracion_ms = 55000 where id = $1', [pc.id])
    for (const [u, d] of [[a.id, desafio], [b.id, desafio], [c.id, desafio]]) {
      await consulta('select actualizar_resultado_publico($1, $2)', [u, d])
    }
    const { datos: ranking } = await api.rpc(null, 'ranking_evento', { p_evento_id: EVENTO, p_limite: 10 })
    const delDesafio = ranking.filter((f) => f.desafio_id === desafio)
    verificar(delDesafio.map((f) => f.posicion).join() === '1,1,3', `posiciones: ${delDesafio.map((f) => `${f.alias}=${f.posicion}`)}`)

    // Repetir: peor no cambia, mejor actualiza (siempre una sola fila).
    await jugarPorApi(api, bd, c.token, desafio, { aciertos: 2 })
    const [trasPeor] = await consulta('select puntaje, count(*) over ()::int as filas from resultados_publicos r join perfiles p on p.id_publico = r.participante where p.id = $1 and desafio_id = $2', [c.id, desafio])
    verificar(trasPeor.puntaje === 600 && trasPeor.filas === 1, `tras uno peor: ${JSON.stringify(trasPeor)}`)
    const [{ n: intentosC }] = await consulta('select count(*)::int as n from partidas where usuario_id = $1 and desafio_id = $2', [c.id, desafio])
    verificar(intentosC === 2, `intentos: ${intentosC}`)
    return `600/40 s, 600/40 s y 600/55 s -> puestos ${delDesafio.map((f) => f.posicion).join(', ')} · repetir con 300 pts: la fila sigue en 600 (una sola fila) · cuenta la mejor, no la suma`
  }
)

await caso(
  3,
  'Recarga, boton Actualizar y ultima actualizacion',
  'Recargar muestra lo mismo; "Actualizar" vuelve a consultar y cambia la hora de la ultima actualizacion',
  async () => {
    const ctx = await contexto({ viewport: { width: 1600, height: 900 } })
    const p = await abrirPantalla(ctx)
    const antes = await filasEnPantalla(p, SPRINT)
    const hora1 = await p.locator('[data-prueba="ultima-actualizacion"]').innerText()
    await p.reload({ waitUntil: 'networkidle' })
    await p.locator('[data-prueba="estado-conexion"][data-estado="en-vivo"]').waitFor({ timeout: 15000 })
    const despues = await filasEnPantalla(p, SPRINT)
    await dormir(1100)
    await p.getByRole('button', { name: /Actualizar/ }).click()
    await esperarA(async () => (await p.locator('[data-prueba="ultima-actualizacion"]').innerText()) !== hora1, { que: 'que cambie la hora' })
    const hora2 = await p.locator('[data-prueba="ultima-actualizacion"]').innerText()
    verificar(JSON.stringify(antes.map((f) => [f.alias, f.posicion, f.puntaje])) === JSON.stringify(despues.map((f) => [f.alias, f.posicion, f.puntaje])), 'la recarga cambio el ranking')
    await ctx.close()
    return `antes y despues de recargar: ${despues.length} filas iguales · ultima actualizacion ${hora1} -> ${hora2} al tocar "Actualizar"`
  }
)

await caso(
  4,
  'La pantalla pierde la conexion y la recupera',
  'Sin conexion lo avisa y muestra la hora de los datos; lo que pasa mientras tanto aparece al volver, sin recargar',
  async () => {
    const ctx = await contexto({ viewport: { width: 1600, height: 900 } })
    const p = await abrirPantalla(ctx)
    await ctx.setOffline(true)
    await p.locator('[data-prueba="estado-conexion"][data-estado="sin-conexion"]').waitFor({ timeout: 10000 })
    const aviso = await p.locator('[data-prueba="aviso-sin-conexion"]').innerText()

    const cuenta = await cuentaCon('Offline')
    await jugarPorApi(api, bd, cuenta.token, SPRINT, { aciertos: 5 })
    const quien = await aliasCompleto(cuenta.id)
    await dormir(1500)
    const mientras = (await filasEnPantalla(p, SPRINT)).some((f) => f.alias === quien.texto)

    await ctx.setOffline(false)
    await esperarA(async () => (await filasEnPantalla(p, SPRINT)).some((f) => f.alias === quien.texto), { ms: 30000, que: 'que aparezca el resultado al volver' })
    await p.locator('[data-prueba="estado-conexion"][data-estado="en-vivo"]').waitFor({ timeout: 30000 })
    verificar(!mientras, 'aparecio sin conexion')
    verificar(/Se perdio la conexion/.test(aviso), `aviso: ${aviso}`)
    await ctx.close()
    return `sin red: "${normalizar(aviso).slice(0, 70)}..." · el resultado jugado mientras tanto aparecio al volver la red, sin recargar · estado de nuevo "En vivo"`
  }
)

await caso(
  5,
  'Se cae Realtime: respaldo y reconexion',
  'Con Realtime caido la pantalla pasa a consulta periodica; al volver Realtime se resuscribe y consulta de nuevo, y aparece lo que paso en el medio',
  async () => {
    const ctx = await contexto({ viewport: { width: 1600, height: 900 } })
    const p = await abrirPantalla(ctx)
    await fetch(`${URL_SB}/__control/realtime-cortar?ms=4000`)
    await p.locator('[data-prueba="estado-conexion"][data-estado="respaldo"]').waitFor({ timeout: 15000 })
    const cuenta = await cuentaCon('Respaldo')
    await jugarPorApi(api, bd, cuenta.token, SPRINT, { aciertos: 4 })
    const quien = await aliasCompleto(cuenta.id)
    await esperarA(async () => (await filasEnPantalla(p, SPRINT)).some((f) => f.alias === quien.texto), { ms: 40000, que: 'que aparezca despues de la caida' })
    await p.locator('[data-prueba="estado-conexion"][data-estado="en-vivo"]').waitFor({ timeout: 40000 })
    await ctx.close()
    return 'Realtime cortado 4 s: la pantalla muestra "Actualizando cada 15 s" · al reconectarse vuelve a "En vivo" y muestra el resultado jugado durante la caida'
  }
)

await caso(
  6,
  'Permisos de lectura de la pantalla',
  'Sin sesion se leen solo posicion, alias, codigo, puntaje, tiempo y desafio; no partidas, perfiles, respuestas, correos ni ids de cuenta; nadie escribe resultados',
  async () => {
    const { datos: ranking } = await api.rpc(null, 'ranking_evento', { p_evento_id: EVENTO, p_limite: 10 })
    const claves = new Set(ranking.flatMap((f) => Object.keys(f)))
    const esperadas = ['desafio_id', 'desafio', 'orden', 'posicion', 'alias', 'codigo', 'puntaje', 'duracion_ms', 'logrado_en', 'participante']
    verificar([...claves].every((k) => esperadas.includes(k)), `columnas: ${[...claves]}`)
    const crudo = JSON.stringify(ranking)
    const ids = (await consulta('select id::text from perfiles')).map((r) => r.id)
    verificar(!/@/.test(crudo) && !ids.some((id) => crudo.includes(id)), 'el ranking trae correos o ids de cuenta')

    const cuenta = await cuentaCon('Lectora')
    const r = {
      partidas: await api.datos(null, 'GET', 'partidas?select=id'),
      perfiles: await api.datos(null, 'GET', 'perfiles?select=id,alias'),
      respuestas: await api.datos(null, 'GET', 'partida_respuestas?select=*'),
      escribirAnon: await api.datos(null, 'POST', 'resultados_publicos', { evento_id: EVENTO, desafio_id: SPRINT, participante: nuevoId(), alias: 'X', codigo: 1, puntaje: 9999, duracion_ms: 1, logrado_en: new Date().toISOString() }),
      cambiarCuenta: await api.datos(cuenta.token, 'PATCH', 'resultados_publicos?desafio_id=eq.expo-2026-sprint', { puntaje: 9999 }),
      posicionAnon: await api.rpc(null, 'mi_posicion', { p_desafio_id: SPRINT })
    }
    for (const [k, v] of Object.entries(r)) verificar(v.estado === 401 || v.estado === 403, `${k}: ${v.estado}`)
    const tabla = await api.datos(null, 'GET', 'resultados_publicos?select=*&limit=1')
    verificar(tabla.estado === 200 && !Object.keys(tabla.datos[0] ?? {}).some((k) => /usuario|email|correo/.test(k)), `tabla: ${Object.keys(tabla.datos[0] ?? {})}`)
    return `ranking: solo ${esperadas.join(', ')} · sin correos ni ids de cuenta · partidas/perfiles/respuestas sin sesion: ${r.partidas.estado}/${r.perfiles.estado}/${r.respuestas.estado} · escribir resultados: ${r.escribirAnon.estado} (publico) y ${r.cambiarCuenta.estado} (cuenta)`
  }
)

await caso(
  7,
  'Realtime respeta la publicacion y los permisos',
  'Suscribirse a una tabla privada (partidas) da error; un evento en preparacion no manda avisos al publico; los invitados no generan avisos',
  async () => {
    const sb = createClient(URL_SB, claves.clavePublicable, { auth: { persistSession: false } })
    // Realtime acepta unirse al canal y despues avisa el error con un mensaje 'system'.
    const estados = []
    const privados = []
    sb.channel('privada').on('postgres_changes', { event: '*', schema: 'public', table: 'partidas' }, (a) => privados.push(a))
      .on('system', {}, (m) => { if (m?.status === 'error') estados.push('CHANNEL_ERROR') })
      .subscribe((s) => estados.push(s))
    const avisos = []
    sb.channel('resultados').on('postgres_changes', { event: '*', schema: 'public', table: 'resultados_publicos' }, (a) => avisos.push(a))
      .subscribe()
    await esperarA(() => estados.includes('CHANNEL_ERROR'), { ms: 8000, que: 'el error de la tabla privada' })
    await dormir(800)

    const invitado = await api.altaAnonima()
    await jugarPorApi(api, bd, invitado.token, SPRINT)
    await dormir(1200)
    const trasInvitado = avisos.length

    await consulta("update eventos set estado = 'preparacion' where id = $1", [EVENTO])
    try {
      const cuenta = await cuentaCon('Oculta')
      await jugarPorApi(api, bd, cuenta.token, CODIGO, { aciertos: 5 })
      await dormir(1500)
    } finally {
      await consulta("update eventos set estado = 'abierto' where id = $1", [EVENTO])
    }
    const trasPreparacion = avisos.length
    const cuenta = await cuentaCon('Visible')
    await jugarPorApi(api, bd, cuenta.token, SPRINT, { aciertos: 1 })
    await esperarA(() => avisos.length > trasPreparacion, { que: 'el aviso de un evento abierto' })
    await sb.removeAllChannels()
    verificar(trasInvitado === 0 && trasPreparacion === 0 && privados.length === 0, `avisos: invitado ${trasInvitado}, preparacion ${trasPreparacion}, partidas ${privados.length}`)
    return `partidas (no publicada): error del canal y 0 avisos · partida de invitado: 0 avisos · evento en preparacion: 0 avisos al publico · evento abierto: el aviso llega`
  }
)

await caso(
  8,
  'Lo publico coincide con lo anunciado',
  'El aviso de datos y la pagina de ranking dicen alias con codigo, puntaje y tiempo, solo cuentas; eso es lo que muestra la pantalla; un cambio de alias se refleja; un invitado que crea su cuenta aparece',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByText('Que datos guardamos y cuales se ven').click()
    const aviso = normalizar(await p.locator('[data-prueba="lo-publico"]').innerText())
    await p.goto(`${URL_APP}/ranking`, { waitUntil: 'networkidle' })
    const reglas = normalizar(await p.locator('[data-prueba="reglas-ranking"]').innerText())
    for (const frase of ['alias con su codigo', 'puntaje', 'tiempo', 'Los invitados no aparecen']) {
      verificar(aviso.includes(frase), `el aviso no dice "${frase}": ${aviso}`)
    }
    verificar(/alias con su codigo/.test(reglas) && /invitados/.test(reglas), `reglas: ${reglas}`)

    const pantallaCtx = await contexto({ viewport: { width: 1600, height: 900 } })
    const pantalla = await abrirPantalla(pantallaCtx)
    const cuenta = await cuentaCon('Antes')
    await jugarPorApi(api, bd, cuenta.token, SPRINT, { aciertos: 2 })
    await esperarA(async () => (await filasEnPantalla(pantalla, SPRINT)).some((f) => f.alias.startsWith('Antes#')), { que: 'el alias original' })
    const cambio = await api.datos(cuenta.token, 'PATCH', `perfiles?id=eq.${cuenta.id}`, { alias: 'Despues' })
    verificar(cambio.estado < 300, `cambio de alias: ${cambio.estado}`)
    await esperarA(async () => (await filasEnPantalla(pantalla, SPRINT)).some((f) => f.alias.startsWith('Despues#')), { que: 'el alias nuevo' })
    const viejo = (await filasEnPantalla(pantalla, SPRINT)).some((f) => f.alias.startsWith('Antes#'))
    verificar(!viejo, 'quedo el alias viejo')

    // Invitado que crea su cuenta: mismo id, sus partidas pasan a contar (lo que hace Auth al confirmar).
    const invitado = await api.altaAnonima()
    await jugarPorApi(api, bd, invitado.token, CODIGO, { aciertos: 3 })
    const [{ n: antes }] = await consulta('select count(*)::int as n from resultados_publicos r join perfiles p on p.id_publico = r.participante where p.id = $1', [invitado.id])
    await consulta(`update auth.users set is_anonymous = false, email = $2, raw_user_meta_data = '{"alias":"Convertida"}' where id = $1`, [invitado.id, correoNuevo('convertida')])
    await esperarA(async () => (await filasEnPantalla(pantalla, CODIGO)).some((f) => f.alias.startsWith('Convertida#')), { que: 'la cuenta convertida' })
    await ctx.close()
    await pantallaCtx.close()
    verificar(antes === 0, 'el invitado figuraba antes de crear su cuenta')
    return 'aviso de datos y pagina de ranking: alias con codigo, puntaje y tiempo, sin invitados · la pantalla muestra eso · Antes -> Despues en vivo · un invitado no figura y al crear su cuenta aparece como Convertida'
  }
)

await caso(
  9,
  'Resultados separados por exposicion',
  'Una partida de otro evento no aparece en el ranking de expo-2026, y viceversa',
  async () => {
    await consulta(`insert into eventos (id, nombre, estado) values ('expo-otra', 'Otra expo', 'abierto') on conflict (id) do update set estado = 'abierto'`)
    await consulta(`insert into desafios (id, evento_id, orden, nombre, estado) values ('otra-d1', 'expo-otra', 1, 'Desafio de otra expo', 'borrador') on conflict (id) do nothing`)
    await consulta(`insert into preguntas_desafio (id, desafio_id, orden, enunciado, explicacion, estado)
                    select 'otra-p1', 'otra-d1', 1, 'Pregunta de la otra expo', 'Explicacion de prueba.', 'borrador'
                    where not exists (select 1 from preguntas_desafio where id = 'otra-p1')`)
    await consulta(`insert into opciones_desafio (id, pregunta_id, orden, texto, es_correcta)
                    select * from (values ('otra-p1-a', 'otra-p1', 1, 'Si', true), ('otra-p1-b', 'otra-p1', 2, 'No', false)) v (id, pregunta_id, orden, texto, es_correcta)
                    where not exists (select 1 from opciones_desafio where id = v.id)`)
    await consulta("update preguntas_desafio set estado = 'publicada' where id = 'otra-p1' and estado <> 'publicada'").catch(() => {})
    await consulta("update desafios set estado = 'publicado' where id = 'otra-d1'")
    const cuenta = await cuentaCon('Viajero')
    await jugarPorApi(api, bd, cuenta.token, 'otra-d1')
    const { datos: deExpo } = await api.rpc(null, 'ranking_evento', { p_evento_id: EVENTO, p_limite: 100 })
    const { datos: deOtra } = await api.rpc(null, 'ranking_evento', { p_evento_id: 'expo-otra', p_limite: 100 })
    const quien = await aliasCompleto(cuenta.id)
    verificar(!deExpo.some((f) => f.participante === quien.participante), 'aparecio en expo-2026')
    verificar(deOtra.length >= 1 && deOtra.every((f) => f.desafio_id === 'otra-d1'), `otra expo: ${deOtra.length}`)
    return `la partida de "Otra expo" esta solo en su ranking (${deOtra.length} fila) y no en el de expo-2026 (${deExpo.length} filas)`
  }
)

await caso(
  10,
  'La pantalla se lee a distancia y en distintas pantallas',
  'Nombre del evento y filas legibles (letra grande), sin desbordes en 1920, 1280 y 412 px; el buscador resalta el resultado propio',
  async () => {
    const ctx = await contexto({ viewport: { width: 1920, height: 1080 } })
    const p = await abrirPantalla(ctx)
    const tamanoNombre = await p.locator('[data-prueba="nombre-evento"]').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    const tamanoFila = await p.locator('.fila').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    const desbordes = []
    for (const [ancho, alto] of [[1920, 1080], [1280, 720], [412, 900]]) {
      await p.setViewportSize({ width: ancho, height: alto })
      await dormir(200)
      const sale = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
      if (sale) desbordes.push(ancho)
    }
    const primera = (await filasEnPantalla(p, SPRINT))[0]
    await p.getByLabel('Busca tu resultado').fill(primera.alias)
    const resaltada = await p.locator(`[data-participante="${primera.participante}"].fila--mia`).count()
    verificar(tamanoNombre >= 48 && tamanoFila >= 24, `letra: titulo ${tamanoNombre}px, filas ${tamanoFila}px`)
    verificar(desbordes.length === 0, `desborda en: ${desbordes}`)
    verificar(resaltada >= 1, 'el buscador no resalto la fila')
    await ctx.close()
    return `a 1920 px: titulo ${tamanoNombre}px y filas ${tamanoFila}px · sin desborde a 1920, 1280 ni 412 px · buscar "${primera.alias}" resalta su fila`
  }
)

// ===========================================================================
//  B. ADMINISTRACION
// ===========================================================================

const comun = await cuentaCon('Comun')
const profe = await cuentaCon('Profe')
const otorgado = await api.rpc(claves.claveDeServicio, 'otorgar_administrador', { p_correo: profe.correo })
if (otorgado.estado !== 200) console.log('AVISO: no se pudo otorgar el rol de prueba', otorgado)

await caso(
  11,
  'Una cuenta comun no puede administrar ni darse el rol',
  'El panel le dice que no tiene permiso; todas las funciones admin y las escrituras directas se rechazan; no puede otorgarse el rol ni con la funcion ni escribiendo la tabla',
  async () => {
    const llamadas = {
      curso: await api.rpc(comun.token, 'admin_guardar_curso', { p: { id: 'hack', nombre: 'Hack', descripcion: 'Curso falso', orden: 99 } }),
      solucion: await api.rpc(comun.token, 'admin_obtener_pregunta', { p_id: 'js-u1-l1-a1' }),
      banco: await api.rpc(comun.token, 'admin_listar_banco', { p_desafio_id: SPRINT }),
      evento: await api.rpc(comun.token, 'admin_cambiar_estado_evento', { p_id: EVENTO, p_estado: 'cerrado' }),
      eliminar: await api.rpc(comun.token, 'admin_eliminar', { p_tipo: 'curso', p_id: 'python', p_confirmacion: 'python' })
    }
    for (const [k, v] of Object.entries(llamadas)) verificar(v.datos?.hint === 'sin_permiso_admin', `${k}: ${v.estado} ${v.datos?.hint}`)
    const directas = {
      insertarCurso: await api.datos(comun.token, 'POST', 'cursos', { id: 'hack', nombre: 'Hack' }),
      cambiarPregunta: await api.datos(comun.token, 'PATCH', 'preguntas?id=eq.js-u1-l1-a1', { estado: 'borrador' }),
      cambiarOpcion: await api.datos(comun.token, 'PATCH', 'opciones?id=eq.js-u1-l1-a1-a', { es_correcta: false }),
      cerrarEvento: await api.datos(comun.token, 'PATCH', `eventos?id=eq.${EVENTO}`, { estado: 'cerrado' }),
      darseRol: await api.datos(comun.token, 'POST', 'administradores', { usuario_id: comun.id }),
      otorgarse: await api.rpc(comun.token, 'otorgar_administrador', { p_correo: comun.correo }),
      perfil: await api.datos(comun.token, 'PATCH', `perfiles?id=eq.${comun.id}`, { es_admin: true })
    }
    for (const [k, v] of Object.entries(directas)) verificar(v.estado >= 400, `${k}: ${v.estado}`)
    const esAdmin = await api.rpc(comun.token, 'es_admin', {})
    const ctx = await contexto({ viewport: { width: 1280, height: 900 } })
    const p = await pagina(ctx)
    await entrarConCuenta(p, comun, '/admin')
    await p.locator('[data-prueba="sin-permiso"]').waitFor({ timeout: 10000 })
    const enlace = await p.locator('[data-prueba="enlace-admin"]').count()
    verificar(esAdmin.datos === false && enlace === 0, `es_admin ${esAdmin.datos}, enlace ${enlace}`)
    await ctx.close()
    return `funciones admin: sin_permiso_admin · escrituras directas y "darse el rol": ${Object.values(directas).map((v) => v.estado).join('/')} · es_admin = false · el panel dice "No tenes permiso"`
  }
)

await caso(
  12,
  'Una cuenta autorizada crea y publica contenido desde el panel',
  'Crea curso, unidad, leccion y pregunta con opciones; no puede publicar la leccion vacia; al publicar, el publico la ve; las opciones repetidas o con dos correctas se rechazan',
  async () => {
    const sufijo = Date.now().toString(36)
    const curso = `curso-${sufijo}`
    const ctx = await contexto({ viewport: { width: 1280, height: 900 } })
    const p = await pagina(ctx)
    await entrarConCuenta(p, profe, '/admin')
    await p.locator('[data-lista="curso"]').waitFor({ timeout: 10000 })
    const llenar = async (campos) => {
      for (const [n, v] of Object.entries(campos)) await p.locator(`[data-prueba="formulario"] [name="${n}"]`).fill(String(v))
      await p.locator('[data-prueba="formulario"]').getByRole('button', { name: 'Guardar' }).click()
      await p.locator('[data-prueba="formulario"]').waitFor({ state: 'detached', timeout: 10000 })
    }
    await p.locator('[data-lista="curso"]').getByRole('button', { name: '+ Nuevo' }).click()
    await llenar({ id: curso, nombre: 'Curso de prueba', descripcion: 'Creado desde el panel.', orden: 50 })
    await p.locator('select[name="filtro-curso"]').selectOption(curso)
    await p.locator('[data-lista="unidad"]').getByRole('button', { name: '+ Nuevo' }).click()
    await llenar({ id: `${curso}-u1`, titulo: 'Unidad de prueba', descripcion: 'Una unidad del panel.' })
    await p.locator('[data-lista="leccion"]').getByRole('button', { name: '+ Nuevo' }).click()
    await llenar({ id: `${curso}-l1`, titulo: 'Leccion de prueba', descripcion: 'Una leccion del panel.', explicacion: 'Teoria de la leccion creada desde el panel.' })
    await p.locator(`[data-lista="leccion"] [data-id="${curso}-l1"]`).waitFor({ timeout: 10000 })

    // Publicar la leccion sin actividades: el servidor lo rechaza.
    await p.locator(`[data-lista="leccion"] [data-id="${curso}-l1"]`).getByRole('button', { name: 'Publicar' }).click()
    await p.locator('[data-prueba="error-admin"]').waitFor({ timeout: 10000 })
    const errorVacia = await p.locator('[data-prueba="error-admin"]').innerText()

    // Pregunta con opciones: el editor avisa las repetidas antes de mandar.
    await p.locator('[data-lista="pregunta"]').getByRole('button', { name: '+ Nueva' }).click()
    const ed = p.locator('[data-prueba="editor-pregunta"]')
    await ed.locator('[name="enunciado"]').fill('Que muestra console.log(1 + 1)?')
    await ed.locator('[name="opcion-0"]').fill('2')
    await ed.locator('[name="opcion-1"]').fill('2')
    const problemas = await ed.locator('[data-prueba="problemas"]').innerText()
    await ed.locator('[name="opcion-1"]').fill('11')
    await ed.locator('[name="explicacion"]').fill('Suma los dos numeros: 1 + 1 = 2.')
    await ed.locator('[name="estado"]').selectOption('publicada')
    await ed.getByRole('button', { name: 'Guardar pregunta' }).click()
    await ed.waitFor({ state: 'detached', timeout: 10000 })

    await p.locator(`[data-lista="leccion"] [data-id="${curso}-l1"]`).getByRole('button', { name: 'Publicar' }).click()
    await p.locator(`[data-lista="leccion"] [data-id="${curso}-l1"][data-estado="publicada"]`).waitFor({ timeout: 10000 })
    for (const [tipo, id, estado] of [['unidad', `${curso}-u1`, 'publicada'], ['curso', curso, 'disponible']]) {
      await p.locator(`[data-lista="${tipo}"] [data-id="${id}"]`).getByRole('button', { name: 'Publicar' }).click()
      await p.locator(`[data-lista="${tipo}"] [data-id="${id}"][data-estado="${estado}"]`).waitFor({ timeout: 10000 })
    }
    const publico = await api.datos(null, 'GET', `lecciones?select=id&id=eq.${curso}-l1`)
    const opciones = await api.datos(null, 'GET', `opciones?select=id,texto&pregunta_id=eq.${curso}-l1-a1`)

    // Por la API, lo mismo que el editor evita.
    const base = { id: `${curso}-l1-a2`, leccion_id: `${curso}-l1`, orden: 2, enunciado: 'Otra pregunta de prueba', explicacion: 'Explicacion de prueba.', estado: 'publicada' }
    const repetidas = await api.rpc(profe.token, 'admin_guardar_pregunta', { p: { ...base, opciones: [{ texto: 'A', es_correcta: true }, { texto: ' a ', es_correcta: false }] } })
    const dosCorrectas = await api.rpc(profe.token, 'admin_guardar_pregunta', { p: { ...base, opciones: [{ texto: 'A', es_correcta: true }, { texto: 'B', es_correcta: true }] } })
    const unaSola = await api.rpc(profe.token, 'admin_guardar_pregunta', { p: { ...base, opciones: [{ texto: 'A', es_correcta: true }] } })
    await ctx.close()
    verificar(/al menos una actividad publicada/.test(errorVacia), `leccion vacia: ${errorVacia}`)
    verificar(/repetidas/.test(problemas), `editor: ${problemas}`)
    verificar(publico.datos.length === 1 && opciones.datos.length === 2, 'el publico no ve lo publicado')
    verificar(repetidas.datos?.hint === 'opciones_repetidas' && dosCorrectas.datos?.hint === 'una_correcta' && unaSola.datos?.hint === 'pocas_opciones',
      `api: ${repetidas.datos?.hint}/${dosCorrectas.datos?.hint}/${unaSola.datos?.hint}`)
    return `curso -> unidad -> leccion -> pregunta desde el panel · publicar la leccion vacia: "${normalizar(errorVacia).slice(0, 60)}" · opciones repetidas: el editor avisa · publicado: el publico ve la leccion y sus 2 opciones · por la API: opciones_repetidas, una_correcta, pocas_opciones`
  }
)

await caso(
  13,
  'Soluciones solo por la operacion de administrador',
  'El administrador ve y cambia la solucion con admin_obtener_pregunta; con un select comun sigue sin poder leer es_correcta ni la explicacion (no se relajo la lectura)',
  async () => {
    const conFuncion = await api.rpc(profe.token, 'admin_obtener_pregunta', { p_id: 'js-u1-l1-a1' })
    const selectAdmin = await api.datos(profe.token, 'GET', 'opciones?select=id,es_correcta&pregunta_id=eq.js-u1-l1-a1')
    const explicacionAdmin = await api.datos(profe.token, 'GET', 'preguntas?select=explicacion&id=eq.js-u1-l1-a1')
    const selectComun = await api.datos(comun.token, 'GET', 'opciones?select=id,es_correcta')
    const correcta = conFuncion.datos?.opciones?.find((o) => o.es_correcta)
    verificar(conFuncion.estado === 200 && correcta && conFuncion.datos.explicacion, 'la funcion no devolvio la solucion')
    verificar(selectAdmin.estado === 403 && explicacionAdmin.estado === 403 && selectComun.estado === 403,
      `selects: ${selectAdmin.estado}/${explicacionAdmin.estado}/${selectComun.estado}`)
    return `admin_obtener_pregunta: devuelve la correcta ("${correcta.texto.slice(0, 30)}...") y la explicacion · select de es_correcta o explicacion, aun como administrador: ${selectAdmin.estado}`
  }
)

await caso(
  14,
  'Despublicar antes que eliminar',
  'Eliminar pide escribir el id; lo que tiene historial no se puede eliminar (se despublica); despublicar lo oculta al publico sin perder el historial',
  async () => {
    const alumno = await api.altaAnonima()
    await resolverPorApi(api, bd, alumno.token, 'js-u1-l1', { aciertos: 4 })
    const sinConfirmar = await api.rpc(profe.token, 'admin_eliminar', { p_tipo: 'leccion', p_id: 'js-u1-l1', p_confirmacion: 'si' })
    const conHistorial = await api.rpc(profe.token, 'admin_eliminar', { p_tipo: 'leccion', p_id: 'js-u1-l1', p_confirmacion: 'js-u1-l1' })
    const [{ n: sigue }] = await consulta("select count(*)::int as n from lecciones where id = 'js-u1-l1'")
    const despublicar = await api.rpc(profe.token, 'admin_cambiar_estado', { p_tipo: 'leccion', p_id: 'js-u1-l1', p_estado: 'borrador' })
    const publico = await api.datos(null, 'GET', 'lecciones?select=id&id=eq.js-u1-l1')
    const historial = await api.datos(alumno.token, 'GET', 'intentos?select=id&leccion_id=eq.js-u1-l1')
    await api.rpc(profe.token, 'admin_cambiar_estado', { p_tipo: 'leccion', p_id: 'js-u1-l1', p_estado: 'publicada' })
    verificar(sinConfirmar.datos?.hint === 'falta_confirmacion' && conHistorial.datos?.hint === 'tiene_historial' && sigue === 1,
      `eliminar: ${sinConfirmar.datos?.hint}/${conHistorial.datos?.hint}, sigue ${sigue}`)
    verificar(despublicar.estado === 200 && publico.datos.length === 0 && historial.datos.length === 1, 'despublicar no funciono como se espera')
    return 'eliminar sin escribir el id: falta_confirmacion · con historial: tiene_historial (la leccion sigue) · despublicada: el publico no la ve y el alumno conserva su intento · se vuelve a publicar'
  }
)

await caso(
  15,
  'Eventos: preparar, abrir, congelar, nueva version y cerrar',
  'Un evento en preparacion no se ve; al abrirlo se juega; con partidas el desafio no deja cambiar reglas ni preguntas (se crea otra version); al cerrarlo las partidas en curso quedan vencidas y no se juega mas',
  async () => {
    const ev = `evento-${Date.now().toString(36)}`
    const d = `${ev}-d1`
    const pasos = []
    const ok = (r, que) => {
      if (r.estado !== 200) throw new Error(`${que}: ${r.estado} ${JSON.stringify(r.datos).slice(0, 120)}`)
      return r.datos
    }
    ok(await api.rpc(profe.token, 'admin_guardar_evento', { p: { id: ev, nombre: 'Evento del panel' } }), 'evento')
    ok(await api.rpc(profe.token, 'admin_guardar_desafio', { p: { id: d, evento_id: ev, orden: 1, nombre: 'Desafio del panel', duracion_segundos: 60, puntos_por_acierto: 10, intentos_permitidos: 2, gracia_segundos: 5, estado: 'publicado' } }), 'desafio')
    for (const i of [1, 2]) {
      ok(await api.rpc(profe.token, 'admin_guardar_pregunta_desafio', { p: { id: `${d}-p${i}`, desafio_id: d, orden: i, enunciado: `Pregunta ${i} del panel`, explicacion: 'Explicacion del panel.', opciones: [{ texto: 'Bien', es_correcta: true }, { texto: 'Mal', es_correcta: false }] } }), 'pregunta')
    }
    const oculto = await api.datos(null, 'GET', `eventos?select=id&id=eq.${ev}`)
    pasos.push(`en preparacion: ${oculto.datos.length} visibles`)
    const jugador = await api.altaAnonima()
    const antesDeAbrir = await api.rpc(jugador.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: d })
    ok(await api.rpc(profe.token, 'admin_cambiar_estado_evento', { p_id: ev, p_estado: 'abierto' }), 'abrir')
    const enCurso = await api.rpc(jugador.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: d })
    const congelado = await api.rpc(profe.token, 'admin_guardar_desafio', { p: { id: d, evento_id: ev, orden: 1, nombre: 'Desafio del panel', duracion_segundos: 999, puntos_por_acierto: 10, intentos_permitidos: 2, gracia_segundos: 5, estado: 'publicado' } })
    const bancoCongelado = await api.rpc(profe.token, 'admin_guardar_pregunta_desafio', { p: { id: `${d}-p3`, desafio_id: d, orden: 3, enunciado: 'Pregunta nueva', explicacion: 'Explicacion nueva.', opciones: [{ texto: 'Si', es_correcta: true }, { texto: 'No', es_correcta: false }] } })
    const version = ok(await api.rpc(profe.token, 'admin_nueva_version_desafio', { p_id: d, p_nuevo_id: `${d}-v2` }), 'nueva version')
    const cerrar = ok(await api.rpc(profe.token, 'admin_cambiar_estado_evento', { p_id: ev, p_estado: 'cerrado' }), 'cerrar')
    const [partida] = await consulta('select estado from partidas where id = $1', [enCurso.datos.id])
    const despues = await api.rpc(jugador.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: d })
    verificar(oculto.datos.length === 0 && antesDeAbrir.datos?.hint === 'evento_cerrado', 'el evento en preparacion se veia o se jugaba')
    verificar(enCurso.estado === 200, `jugar abierto: ${enCurso.estado}`)
    verificar(congelado.datos?.hint === 'desafio_congelado' && bancoCongelado.datos?.hint === 'desafio_congelado', `congelado: ${congelado.datos?.hint}/${bancoCongelado.datos?.hint}`)
    verificar(version.version === 2 && version.estado === 'borrador', `version: ${JSON.stringify(version).slice(0, 80)}`)
    verificar(cerrar.partidas_cerradas === 1 && partida.estado === 'vencida' && despues.datos?.hint === 'evento_cerrado', `cierre: ${JSON.stringify(cerrar)} ${partida.estado}`)
    const [{ n: copiadas }] = await consulta('select count(*)::int as n from preguntas_desafio where desafio_id = $1', [`${d}-v2`])
    return `preparacion: invisible y no se juega · abierto: se juega · con partidas: cambiar duracion o agregar pregunta -> desafio_congelado · nueva version v2 en borrador con ${copiadas} preguntas copiadas · cerrar: 1 partida en curso -> vencida, ya no se juega`
  }
)

await caso(
  16,
  'El panel mantiene filtros y orden',
  'Los contenidos se listan por su orden; el curso, la unidad y el filtro de estado elegidos se mantienen al recargar',
  async () => {
    const ctx = await contexto({ viewport: { width: 1280, height: 900 } })
    const p = await pagina(ctx)
    await entrarConCuenta(p, profe, '/admin')
    await p.locator('[data-lista="curso"]').waitFor({ timeout: 10000 })
    await p.locator('select[name="filtro-curso"]').selectOption('javascript')
    await p.locator('[data-lista="leccion"] [data-id="js-u1-l1"]').waitFor({ timeout: 10000 })
    await p.locator('select[name="filtro-estado"]').selectOption('publicado')
    const ordenLecciones = await p.locator('[data-lista="leccion"] .item').evaluateAll((els) => els.map((e) => e.dataset.id))
    await p.reload({ waitUntil: 'networkidle' })
    await p.locator('[data-lista="leccion"] [data-id="js-u1-l1"]').waitFor({ timeout: 10000 })
    const curso = await p.locator('select[name="filtro-curso"]').inputValue()
    const estado = await p.locator('select[name="filtro-estado"]').inputValue()
    await ctx.close()
    verificar(ordenLecciones.join() === 'js-u1-l1,js-u1-l2,js-u1-l3', `orden: ${ordenLecciones}`)
    verificar(curso === 'javascript' && estado === 'publicado', `tras recargar: ${curso}/${estado}`)
    return `lecciones en orden: ${ordenLecciones.join(', ')} · tras recargar siguen elegidos el curso "${curso}" y el filtro "${estado}"`
  }
)

await caso(
  17,
  'Volver a correr los scripts 15 y 16 no pierde resultados, roles ni permisos',
  'Resultados publicos, administradores y permisos quedan iguales',
  async () => {
    const contar = async () => (await consulta(
      `select (select count(*) from resultados_publicos)::int as r, (select count(*) from administradores)::int as a`))[0]
    const antes = await contar()
    for (const archivo of ['15-ranking-publico', '16-administracion']) {
      try {
        await bd.query(readFileSync(new URL(`../supabase/${archivo}.sql`, import.meta.url), 'utf8'))
      } catch (e) {
        await bd.query('rollback')
        throw new Error(`${archivo}: ${e.message}`)
      }
    }
    const despues = await contar()
    const comunSigue = await api.rpc(comun.token, 'admin_obtener_pregunta', { p_id: 'js-u1-l1-a1' })
    const profeSigue = await api.rpc(profe.token, 'es_admin', {})
    const lectura = await api.rpc(null, 'ranking_evento', { p_evento_id: EVENTO, p_limite: 3 })
    verificar(JSON.stringify(antes) === JSON.stringify(despues), `conteos: ${JSON.stringify(antes)} -> ${JSON.stringify(despues)}`)
    verificar(comunSigue.datos?.hint === 'sin_permiso_admin' && profeSigue.datos === true && lectura.estado === 200, 'cambiaron los permisos')
    return `resultados ${antes.r} y administradores ${antes.a}: iguales · la cuenta comun sigue sin permiso, el administrador lo conserva, el ranking se sigue leyendo`
  }
)

// ===========================================================================
//  Limpieza: se quita el contenido y los eventos que crearon estas pruebas,
//  asi las pruebas de etapas anteriores vuelven a encontrar el contenido inicial.
// ===========================================================================
try {
  await consulta("delete from partidas where evento_id = 'expo-otra' or evento_id like 'evento-%'")
  await consulta("delete from desafios where evento_id = 'expo-otra' or evento_id like 'evento-%'")
  await consulta("delete from eventos where id = 'expo-otra' or id like 'evento-%'")
  await consulta(`delete from intentos where leccion_id in (
    select l.id from lecciones l join unidades u on u.id = l.unidad_id where u.curso_id like 'curso-%')`)
  await consulta("delete from cursos where id like 'curso-%'")
} catch (e) {
  console.log(`(no se pudo limpiar lo creado por las pruebas: ${e.message})`)
}

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
