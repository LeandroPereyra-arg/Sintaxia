/**
 * Pruebas del juego de la expo (supabase/17-juego-de-la-expo.sql):
 *   · los desafios de preguntas no muestran la correccion mientras se juega
 *     (ni en la pantalla ni en lo que manda el servidor);
 *   · el minijuego "Sintax atrapa el codigo": fichas armadas y validadas por el
 *     servidor, vidas, fin por tiempo, y su puntaje;
 *   · el puntaje total del ranking (suma de la mejor partida de cada desafio);
 *   · las ñ en la app.
 *
 * Antes:   npm run supabase:local && npm run pruebas:entorno   (en otra terminal)
 * Despues: npm run pruebas:etapa9        (SOLO=3,4 corre solo esos casos)
 */
import { chromium } from 'playwright'

import { URL_APP, abrirBase, correoNuevo, crearApi, dormir, leerClaves, jugarPorApi, opcionesDeDesafio } from './local/ayudas.mjs'

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
const MINI = 'expo-2026-minijuego'
const cuentaCon = (alias) => api.cuentaConfirmada({ correo: correoNuevo(alias.toLowerCase()), alias })
const normalizar = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()

async function esperarA(condicion, { ms = 15000, cada = 250, que = 'la condicion' } = {}) {
  const limite = Date.now() + ms
  while (Date.now() < limite) {
    if (await condicion()) return
    await dormir(cada)
  }
  throw new Error(`No se cumplio ${que} en ${ms} ms`)
}

/** Corre la partida en el tiempo: hace que hayan pasado `ms` desde que empezo (reloj del servidor). */
async function moverPartida(id, ms) {
  await consulta(
    `update partidas set iniciada_en = now() - make_interval(secs => $2::double precision / 1000),
                         vence_en = now() - make_interval(secs => $2::double precision / 1000) + make_interval(secs => duracion_segundos)
      where id = $1`,
    [id, ms]
  )
}

const fichasDe = (partidaId) =>
  consulta('select n, valida, aparece_ms, caida_ms from partida_fichas where partida_id = $1 order by n', [partidaId])

/** Atrapa una ficha en su momento (mueve el reloj de la partida hasta que esta cayendo). */
async function atraparEnSuMomento(token, partidaId, ficha) {
  await moverPartida(partidaId, ficha.aparece_ms + 300)
  return api.rpc(token, 'atrapar_ficha', { p_partida_id: partidaId, p_n: ficha.n })
}

/** Juega el minijuego por la API: atrapa `buenas` fichas validas y `malas` invalidas y deja terminar el tiempo. */
async function minijuegoPorApi(token, { buenas = 0, malas = 0 } = {}) {
  const id = nuevoId()
  const inicio = await api.rpc(token, 'iniciar_minijuego', { p_partida_id: id, p_desafio_id: MINI })
  verificar(inicio.estado === 200, `iniciar_minijuego: ${inicio.estado} ${JSON.stringify(inicio.datos).slice(0, 120)}`)
  const fichas = await fichasDe(id)
  const validas = fichas.filter((f) => f.valida).slice(0, buenas)
  const invalidas = fichas.filter((f) => !f.valida).slice(0, malas)
  for (const f of [...validas, ...invalidas].sort((a, b) => a.aparece_ms - b.aparece_ms)) {
    const r = await atraparEnSuMomento(token, id, f)
    verificar(r.estado === 200, `atrapar ${f.n}: ${r.estado} ${JSON.stringify(r.datos).slice(0, 120)}`)
  }
  const [p] = await consulta('select estado from partidas where id = $1', [id])
  if (p.estado === 'en_curso') {
    await moverPartida(id, 180500)
    await api.rpc(token, 'finalizar_partida', { p_partida_id: id })
  }
  const [final] = await consulta('select estado, aciertos, errores, puntaje, duracion_ms from partidas where id = $1', [id])
  return { id, ...final }
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

async function entrarConCuenta(p, cuenta, volver) {
  await p.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(volver)}`, { waitUntil: 'networkidle' })
  await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
  await p.getByLabel('Contraseña', { exact: true }).fill(cuenta.clave)
  await p.getByRole('button', { name: 'Entrar', exact: true }).click()
  await p.waitForURL(`**${volver}`, { timeout: 15000 })
  await dormir(400)
}

async function filasEnPantalla(p, tablero) {
  return p.locator(`[data-desafio="${tablero}"] .fila`).evaluateAll((els) =>
    els.map((e) => ({
      alias: e.querySelector('.fila__alias').innerText.replace(/\s+/g, ''),
      posicion: Number(e.dataset.posicion),
      puntaje: Number(e.querySelector('.fila__puntaje').innerText),
      participante: e.dataset.participante
    })))
}

const aliasCompleto = async (usuarioId) => {
  const [p] = await consulta('select alias, codigo, id_publico from perfiles where id = $1', [usuarioId])
  return { texto: `${p.alias}#${String(p.codigo).padStart(4, '0')}`, participante: p.id_publico }
}

// Evento limpio: sin partidas ni resultados de corridas anteriores, y los desafios sin congelar.
await consulta('delete from resultados_publicos where evento_id = $1', [EVENTO])
await consulta('delete from partidas where evento_id = $1', [EVENTO])
await bd.query('begin')
await bd.query('set local session_replication_role = replica')
await bd.query('update desafios set congelado_en = null where evento_id = $1', [EVENTO])
await bd.query('commit')
await consulta("update eventos set estado = 'abierto' where id = $1", [EVENTO])

// ===========================================================================
//  A. DESAFIOS SIN CORRECCION A LA VISTA
// ===========================================================================

await caso(
  1,
  'El desafio no muestra si cada respuesta estuvo bien',
  'Tocar una opcion la manda y pasa sola a la siguiente; solo dice "Respuesta registrada": sin correcto/incorrecto, sin marcar la opcion correcta y sin puntaje en vivo; al final se ve el puntaje, igual al de la base',
  async () => {
    const cuenta = await cuentaCon('Ciega')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarConCuenta(p, cuenta, `/expo/${EVENTO}`)
    const soluciones = await consulta(
      `select q.enunciado, coalesce(q.codigo, '') as codigo,
              max(o.texto) filter (where o.es_correcta) as bien, min(o.texto) filter (where not o.es_correcta) as mal
         from preguntas_desafio q join opciones_desafio o on o.pregunta_id = q.id
        where q.desafio_id = $1 group by q.id`, [SPRINT])
    const porClave = new Map(soluciones.map((f) => [normalizar(f.enunciado) + '|' + normalizar(f.codigo), f]))
    await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${SPRINT}`, { waitUntil: 'networkidle' })
    const vistos = []
    for (let i = 0; i < 5; i++) {
      await p.waitForSelector('.opcion')
      const enunciado = normalizar(await p.locator('.partida__consigna').innerText())
      const codigo = (await p.locator('.partida .bloque-codigo').count()) ? normalizar(await p.locator('.partida .bloque-codigo').innerText()) : ''
      const s = porClave.get(enunciado + '|' + codigo)
      // Un solo toque: elegir la opcion ya la manda (no hay boton Responder).
      await p.getByRole('button', { name: i < 3 ? s.bien : s.mal, exact: true }).first().click()
      await p.locator('[data-prueba="registrada"]').waitFor({ timeout: 10000 })
      const pantalla = normalizar(await p.locator('.partida').innerText())
      vistos.push({
        correccion: /correct|incorrect|\+\s?\d+ ?puntos|no suma/i.test(pantalla),
        puntaje: /\d+\s*pts/.test(pantalla),
        marcada: await p.locator('.opcion--correcta, .opcion--incorrecta, .feedback').count()
      })
      // Pasa sola a la siguiente pregunta, sin tocar Siguiente.
      await p.locator('[data-prueba="registrada"]').waitFor({ state: 'detached', timeout: 10000 })
      await dormir(100)
    }
    await p.locator('[data-prueba="puntaje-final"]').waitFor({ timeout: 10000 })
    const final = Number((await p.locator('[data-prueba="puntaje-final"]').innerText()).match(/\d+/)[0])
    const [enBase] = await consulta('select puntaje from partidas where usuario_id = $1 and desafio_id = $2', [cuenta.id, SPRINT])
    await ctx.close()
    verificar(vistos.every((v) => !v.correccion && !v.puntaje && v.marcada === 0), `durante la partida: ${JSON.stringify(vistos)}`)
    verificar(final === 300 && enBase.puntaje === 300, `final ${final}, base ${enBase.puntaje}`)
    return '5 respuestas de un toque, cada una pasa sola a la siguiente: solo "Respuesta registrada", sin correcto/incorrecto, sin marcar opciones y sin puntaje · al final: 300 pts = 300 en la base'
  }
)

await caso(
  2,
  'El servidor tampoco cuenta la correccion mientras se juega',
  'responder_partida no trae correcta ni puntos; la partida en curso trae aciertos, errores y puntaje en null; leer las tablas no muestra la partida en curso ni sus respuestas; al terminar se ve todo',
  async () => {
    const yo = await api.altaAnonima()
    const id = nuevoId()
    const inicio = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: id, p_desafio_id: SPRINT })
    const s = await opcionesDeDesafio(bd, SPRINT)
    const q = inicio.datos.preguntas[0]
    const r = await api.rpc(yo.token, 'responder_partida', { p_partida_id: id, p_pregunta_id: q.id, p_opcion_id: s.get(q.id).correcta })
    const obtenida = await api.rpc(yo.token, 'obtener_partida', { p_partida_id: id })
    const mias = await api.rpc(yo.token, 'mis_partidas', { p_evento_id: EVENTO })
    const tabla = await api.datos(yo.token, 'GET', `partidas?id=eq.${id}&select=id,puntaje,aciertos`)
    const respuestas = await api.datos(yo.token, 'GET', `partida_respuestas?partida_id=eq.${id}&select=es_correcta,puntos`)

    verificar(r.estado === 200 && !('correcta' in r.datos) && !('puntos' in r.datos), `responder: ${JSON.stringify(r.datos).slice(0, 160)}`)
    verificar(r.datos.partida.puntaje === null && r.datos.partida.aciertos === null && r.datos.partida.respondidas === 1, `resumen: ${JSON.stringify(r.datos.partida).slice(0, 160)}`)
    const resp = obtenida.datos.preguntas.find((x) => x.id === q.id).respuesta
    verificar(resp && !('correcta' in resp) && !('puntos' in resp) && obtenida.datos.puntaje === null, `obtener: ${JSON.stringify(resp)}`)
    verificar(mias.datos.length === 1 && mias.datos[0].puntaje === null, `mis_partidas: ${JSON.stringify(mias.datos).slice(0, 120)}`)
    verificar(tabla.estado === 200 && tabla.datos.length === 0 && respuestas.datos.length === 0, `tablas: ${tabla.datos?.length}/${respuestas.datos?.length}`)

    await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })
    const despues = await api.rpc(yo.token, 'mis_partidas', { p_evento_id: EVENTO })
    const tablaDespues = await api.datos(yo.token, 'GET', `partidas?id=eq.${id}&select=id,puntaje`)
    const respDespues = await api.datos(yo.token, 'GET', `partida_respuestas?partida_id=eq.${id}&select=es_correcta`)
    verificar(despues.datos[0].puntaje === 100 && tablaDespues.datos[0]?.puntaje === 100 && respDespues.datos.length === 1, `al terminar: ${JSON.stringify(despues.datos[0]).slice(0, 100)}`)
    return 'en curso: responder sin correcta ni puntos · resumen con puntaje/aciertos/errores en null (1 respondida) · obtener_partida sin correccion · tablas: 0 filas · al terminar: 100 pts visibles en mis_partidas y en las tablas'
  }
)

// ===========================================================================
//  B. MINIJUEGO
// ===========================================================================

await caso(
  3,
  'Minijuego: el servidor arma las fichas y las valida',
  'Empieza con 225 fichas y 9 consignas (una cada 20 s, sin repetir dos seguidas) que caen cada vez más rápido, sin decir cuales son validas; una valida suma 20; repetirla no suma; una que todavia no cae, una ajena o la partida de otro se rechazan; 3 errores terminan la partida',
  async () => {
    const yo = await api.altaAnonima()
    const otro = await api.altaAnonima()
    const id = nuevoId()
    const inicio = await api.rpc(yo.token, 'iniciar_minijuego', { p_partida_id: id, p_desafio_id: MINI })
    verificar(inicio.estado === 200, `iniciar: ${inicio.estado} ${JSON.stringify(inicio.datos).slice(0, 120)}`)
    const d = inicio.datos
    verificar(d.fichas.length === 225 && d.rondas.length === 9 && d.rondas.every((r) => r.consigna.startsWith('Atrapá')), `fichas ${d.fichas.length}, rondas ${JSON.stringify(d.rondas)}`)
    verificar(d.rondas.every((r, i) => i === 0 || r.consigna !== d.rondas[i - 1].consigna), `consignas repetidas seguidas: ${d.rondas.map((r) => r.consigna)}`)
    const primeraF = d.fichas[0]
    const ultimaF = d.fichas[d.fichas.length - 1]
    verificar(ultimaF.caida_ms < primeraF.caida_ms && ultimaF.aparece_ms + ultimaF.caida_ms <= 180000, `caida ${primeraF.caida_ms} -> ${ultimaF.caida_ms}, la ultima termina en ${ultimaF.aparece_ms + ultimaF.caida_ms}`)
    verificar(d.fichas.every((f) => f.valida === null), 'el inicio dice cuales fichas son validas')
    const fichas = await fichasDe(id)
    const validas = fichas.filter((f) => f.valida)
    const invalidas = fichas.filter((f) => !f.valida && f.aparece_ms > validas[0].aparece_ms)

    const temprana = await api.rpc(yo.token, 'atrapar_ficha', { p_partida_id: id, p_n: 50 })
    const buena = await atraparEnSuMomento(yo.token, id, validas[0])
    const repetida = await api.rpc(yo.token, 'atrapar_ficha', { p_partida_id: id, p_n: validas[0].n })
    const ajena = await api.rpc(yo.token, 'atrapar_ficha', { p_partida_id: id, p_n: 999 })
    const deOtro = await api.rpc(otro.token, 'atrapar_ficha', { p_partida_id: id, p_n: validas[0].n })
    verificar(temprana.datos?.hint === 'ficha_fuera_de_tiempo', `temprana: ${JSON.stringify(temprana.datos)}`)
    verificar(buena.datos.valida === true && buena.datos.partida.puntaje === 20 && buena.datos.partida.vidas === 3, `buena: ${JSON.stringify(buena.datos).slice(0, 160)}`)
    verificar(repetida.datos.repetida === true && repetida.datos.partida.puntaje === 20, 'la repetida sumo')
    verificar(ajena.datos?.hint === 'ficha_ajena' && deOtro.datos?.hint === 'partida_no_encontrada', `ajena ${ajena.datos?.hint}, de otro ${deOtro.datos?.hint}`)

    const vidas = []
    let ultima
    for (const f of invalidas.slice(0, 3)) {
      ultima = await atraparEnSuMomento(yo.token, id, f)
      vidas.push(ultima.datos.partida.vidas)
    }
    const cerrada = await atraparEnSuMomento(yo.token, id, validas[validas.length - 1])
    const [p] = await consulta('select estado, aciertos, errores, puntaje from partidas where id = $1', [id])
    verificar(vidas.join() === '2,1,0' && ultima.datos.valida === false && ultima.datos.partida.estado === 'finalizada', `vidas ${vidas}, estado ${ultima.datos.partida.estado}`)
    verificar(cerrada.datos?.hint === 'partida_cerrada', `despues de perder: ${JSON.stringify(cerrada.datos)}`)
    verificar(p.estado === 'finalizada' && p.aciertos === 1 && p.errores === 3 && p.puntaje === 20, `partida: ${JSON.stringify(p)}`)
    return '225 fichas, 9 consignas sin repetir seguidas, caen cada vez más rápido y todas antes de los 3 min, ninguna dice si es valida · temprana: ficha_fuera_de_tiempo · valida: +20 · repetida: no suma · ajena / de otro: rechazadas · 3 errores: vidas 2, 1, 0 y la partida termina (20 pts, cuenta) · despues: partida_cerrada'
  }
)

await caso(
  4,
  'Minijuego: terminar el tiempo cuenta, y solo se puede atrapar mientras cae',
  'Cerrar cuando se acabo el tiempo deja la partida finalizada con 180 s; una partida que nadie cerro tambien queda finalizada (no vencida); una ficha que ya paso se rechaza',
  async () => {
    const yo = await api.altaAnonima()
    const id = nuevoId()
    await api.rpc(yo.token, 'iniciar_minijuego', { p_partida_id: id, p_desafio_id: MINI })
    const fichas = await fichasDe(id)
    const primera = fichas.find((f) => f.valida)
    await atraparEnSuMomento(yo.token, id, primera)
    // Una ficha que ya termino de caer hace rato.
    await moverPartida(id, fichas[0].aparece_ms + fichas[0].caida_ms + 8000)
    const pasada = await api.rpc(yo.token, 'atrapar_ficha', { p_partida_id: id, p_n: fichas[0].n === primera.n ? fichas[1].n : fichas[0].n })
    await moverPartida(id, 181000)
    const cierre = await api.rpc(yo.token, 'finalizar_partida', { p_partida_id: id })

    const id2 = nuevoId()
    await api.rpc(yo.token, 'iniciar_minijuego', { p_partida_id: id2, p_desafio_id: MINI })
    await moverPartida(id2, 195000)
    await api.rpc(yo.token, 'mis_partidas', { p_evento_id: EVENTO })
    const [sola] = await consulta('select estado, duracion_ms from partidas where id = $1', [id2])
    verificar(pasada.datos?.hint === 'ficha_fuera_de_tiempo', `ficha pasada: ${JSON.stringify(pasada.datos)}`)
    verificar(cierre.datos.estado === 'finalizada' && cierre.datos.duracion_ms === 180000 && cierre.datos.puntaje === 20, `cierre: ${JSON.stringify(cierre.datos).slice(0, 140)}`)
    verificar(sola.estado === 'finalizada' && sola.duracion_ms === 180000, `sin cerrar: ${JSON.stringify(sola)}`)
    return 'ficha que ya paso: ficha_fuera_de_tiempo · cerrar al terminar el tiempo: finalizada, 180 s, 20 pts · sin cerrar: finalizada (no vencida) con 180 s'
  }
)

await caso(
  5,
  'Minijuego: las soluciones y los puntajes no se tocan desde el cliente',
  'Las tablas de fichas no se leen (ni sin sesion ni con sesion); no se puede cambiar el puntaje; el minijuego no se juega como desafio de preguntas ni al reves',
  async () => {
    const yo = await api.altaAnonima()
    const lecturas = {
      bancoPublico: await api.datos(null, 'GET', 'minijuego_fichas?select=texto,valida'),
      banco: await api.datos(yo.token, 'GET', 'minijuego_fichas?select=texto,valida'),
      fichas: await api.datos(yo.token, 'GET', 'partida_fichas?select=valida'),
      atraparSinSesion: await api.rpc(null, 'atrapar_ficha', { p_partida_id: nuevoId(), p_n: 1 })
    }
    for (const [k, v] of Object.entries(lecturas)) verificar(v.estado === 401 || v.estado === 403, `${k}: ${v.estado}`)
    const { id } = await minijuegoPorApi(yo.token, { buenas: 1 })
    const cambiar = await api.datos(yo.token, 'PATCH', `partidas?id=eq.${id}`, { puntaje: 9999, aciertos: 500 })
    const [p] = await consulta('select puntaje from partidas where id = $1', [id])
    const alReves1 = await api.rpc(yo.token, 'iniciar_minijuego', { p_partida_id: nuevoId(), p_desafio_id: SPRINT })
    const alReves2 = await api.rpc(yo.token, 'iniciar_partida', { p_partida_id: nuevoId(), p_desafio_id: MINI })
    verificar((cambiar.estado === 401 || cambiar.estado === 403) && p.puntaje === 20, `cambiar: ${cambiar.estado}, puntaje ${p.puntaje}`)
    verificar(alReves1.datos?.hint === 'tipo_incorrecto' && alReves2.datos?.hint === 'sin_preguntas', `al reves: ${alReves1.datos?.hint} / ${alReves2.datos?.hint}`)
    return `fichas y banco: ${Object.values(lecturas).map((v) => v.estado).join('/')} · cambiar el puntaje: ${cambiar.estado} (sigue en 20) · minijuego como preguntas: sin_preguntas · preguntas como minijuego: tipo_incorrecto`
  }
)

// ===========================================================================
//  C. PUNTAJE TOTAL
// ===========================================================================

await caso(
  6,
  'Puntaje total: suma la mejor partida de cada desafio',
  'A = sprint 300 + minijuego 40 = 340; B = sprint 500; repetir peor no baja el total; un invitado no aparece; la pantalla muestra el total primero y se actualiza sola',
  async () => {
    const a = await cuentaCon('Total_A')
    const b = await cuentaCon('Total_B')
    const invitado = await api.altaAnonima()
    await jugarPorApi(api, bd, a.token, SPRINT, { aciertos: 3 })
    await minijuegoPorApi(a.token, { buenas: 2 })
    await jugarPorApi(api, bd, b.token, SPRINT, { aciertos: 5 })
    await minijuegoPorApi(invitado.token, { buenas: 5 })
    await minijuegoPorApi(a.token, { buenas: 1 }) // peor: no cambia

    const { datos: total } = await api.rpc(null, 'ranking_total', { p_evento_id: EVENTO, p_limite: 10 })
    const quienA = await aliasCompleto(a.id)
    const quienB = await aliasCompleto(b.id)
    const filaA = total.find((f) => f.participante === quienA.participante)
    const filaB = total.find((f) => f.participante === quienB.participante)
    verificar(filaA?.puntaje === 340 && filaA.desafios === 2 && filaB?.puntaje === 500 && filaB.posicion < filaA.posicion, `total: ${JSON.stringify(total)}`)
    verificar(!JSON.stringify(total).includes(invitado.id), 'el invitado aparece')

    const ctx = await contexto({ viewport: { width: 1600, height: 900 } })
    const pantalla = await pagina(ctx)
    await pantalla.goto(`${URL_APP}/expo/${EVENTO}/ranking`, { waitUntil: 'networkidle' })
    await pantalla.locator('[data-prueba="estado-conexion"][data-estado="en-vivo"]').waitFor({ timeout: 15000 })
    const primero = await pantalla.locator('.tablero').first().getAttribute('data-desafio')
    const enPantalla = await filasEnPantalla(pantalla, 'total')
    verificar(primero === 'total' && enPantalla.find((f) => f.alias === quienA.texto)?.puntaje === 340, `pantalla: ${primero} ${JSON.stringify(enPantalla)}`)
    await minijuegoPorApi(a.token, { buenas: 4 }) // mejor: 80 -> total 380
    await esperarA(async () => (await filasEnPantalla(pantalla, 'total')).find((f) => f.alias === quienA.texto)?.puntaje === 380, { ms: 20000, que: 'el total nuevo en la pantalla' })
    const tableroMini = await pantalla.locator(`[data-desafio="${MINI}"]`).count()
    await ctx.close()
    verificar(tableroMini === 1, 'el minijuego no tiene su tablero')
    return `A: 300 + 40 = 340 (2 desafios) · B: 500, primero · repetir peor no cambia · invitado: no figura · pantalla: "Puntaje total" primero; al mejorar A el minijuego (80) pasa a 380 sin recargar · el minijuego tiene su propio tablero`
  }
)

// ===========================================================================
//  D. EL MINIJUEGO EN LA PANTALLA
// ===========================================================================

await caso(
  7,
  'Jugar el minijuego en la pantalla',
  'Desde el evento se ve como minijuego (3 vidas) y se abre; Sintax se mueve con el dedo y atrapa fichas; el puntaje y las vidas que se ven son los del servidor; al terminar muestra el puntaje final igual al de la base',
  async () => {
    const cuenta = await cuentaCon('Jugadora')
    const ctx = await contexto({ viewport: { width: 412, height: 860 }, hasTouch: false })
    const p = await pagina(ctx)
    await entrarConCuenta(p, cuenta, `/expo/${EVENTO}`)
    const tarjeta = normalizar(await p.locator(`[data-desafio="${MINI}"]`).innerText())
    verificar(/minijuego/i.test(tarjeta) && /3 vidas/i.test(tarjeta), `tarjeta: ${tarjeta}`)
    await p.locator(`[data-desafio="${MINI}"]`).getByRole('link', { name: 'Jugar' }).click()
    await p.waitForURL(`**/minijuego/${MINI}`)
    await p.locator('[data-prueba="empezar"]').click()
    await p.locator('[data-prueba="area-juego"]').waitFor({ timeout: 10000 })
    // Cuenta regresiva: el servidor empieza la partida 3 s despues; mientras tanto no caen fichas.
    const regresiva = normalizar(await p.locator('[data-prueba="cuenta-regresiva"]').innerText({ timeout: 3000 }))
    const fichasEnLaCuenta = await p.locator('[data-prueba="ficha"]').count()
    verificar(/^[123]$/.test(regresiva) && fichasEnLaCuenta === 0, `cuenta regresiva: "${regresiva}", fichas ${fichasEnLaCuenta}`)
    const consigna = normalizar(await p.locator('[data-prueba="consigna"]').innerText())

    const caja = await p.locator('[data-prueba="area-juego"]').boundingBox()
    const puntajesVistos = []
    const fin = Date.now() + 200000
    while (Date.now() < fin && !p.url().includes('/partidas/')) {
      const fichas = await p.locator('[data-prueba="ficha"]').evaluateAll((els) =>
        els.map((e) => ({ x: Number(e.dataset.x), progreso: Number(e.dataset.progreso), clase: e.className })))
        .catch(() => [])
      const objetivo = fichas.filter((f) => f.progreso < 0.8 && !/ficha--/.test(f.clase)).sort((x, y) => y.progreso - x.progreso)[0]
      if (objetivo) await p.mouse.move(caja.x + objetivo.x * caja.width, caja.y + caja.height * 0.85).catch(() => {})
      const visto = await p.locator('[data-prueba="puntaje-juego"]').innerText().catch(() => null)
      if (visto) puntajesVistos.push(Number(visto.match(/\d+/)?.[0] ?? 0))
      await dormir(120)
    }
    await p.locator('[data-prueba="puntaje-final"]').waitFor({ timeout: 15000 })
    const final = Number((await p.locator('[data-prueba="puntaje-final"]').innerText()).match(/\d+/)[0])
    const detalle = normalizar(await p.locator('[data-prueba="detalle-final"]').innerText())
    const [enBase] = await consulta(
      `select estado, aciertos, errores, puntaje from partidas where usuario_id = $1 and desafio_id = $2`, [cuenta.id, MINI])
    await ctx.close()
    verificar(enBase.estado === 'finalizada' && enBase.aciertos + enBase.errores > 0, `en la base: ${JSON.stringify(enBase)}`)
    verificar(final === enBase.puntaje && Math.max(...puntajesVistos) === enBase.puntaje, `final ${final}, visto ${Math.max(...puntajesVistos)}, base ${enBase.puntaje}`)
    verificar(detalle.includes(`${enBase.aciertos} ficha`), `detalle: ${detalle}`)
    return `tarjeta: Minijuego, 3 vidas · cuenta regresiva (${regresiva}...) sin fichas · consigna "${consigna}" · ${enBase.aciertos} atrapadas buenas y ${enBase.errores} malas · en juego se vio ${Math.max(...puntajesVistos)} pts · final ${final} pts = ${enBase.puntaje} en la base`
  }
)

// ===========================================================================
//  E. LAS Ñ
// ===========================================================================

await caso(
  8,
  'La app escribe con ñ',
  'Ingresar, recuperar y la portada dicen contraseña y español con ñ; no queda "contrasena"',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    const textos = {}
    for (const r of ['/', '/ingresar', '/registro', '/recuperar']) {
      await p.goto(`${URL_APP}${r}`, { waitUntil: 'networkidle' })
      textos[r] = normalizar(await p.locator('body').innerText())
    }
    const etiqueta = await (async () => {
      await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
      return p.getByLabel('Contraseña', { exact: true }).count()
    })()
    await ctx.close()
    const todo = Object.values(textos).join(' ')
    verificar(etiqueta === 1 && /español/.test(textos['/']) && /Recuperar mi contraseña/.test(textos['/recuperar']), 'faltan las ñ')
    verificar(!/contrasena|espanol/i.test(todo), `quedo sin ñ: ${todo.match(/.{20}(contrasena|espanol).{20}/i)?.[0]}`)
    return 'campo "Contraseña" · "Recuperar mi contraseña" · "en español" · sin "contrasena" ni "espanol" en inicio, ingresar, registro y recuperar'
  }
)

// ===========================================================================
//  F. JUGAR SOLO CON UN ALIAS
// ===========================================================================

await caso(
  9,
  'Jugar la competencia sin iniciar sesion, solo con un alias',
  'Sin sesion el evento pide un alias (rechaza uno invalido); con el alias se juega y la partida aparece en el ranking con ese alias; abrir un desafio sin sesion lleva al evento',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/expo/${EVENTO}/desafios/${SPRINT}`, { waitUntil: 'networkidle' })
    await p.waitForURL(`**/expo/${EVENTO}`)
    await p.locator('[data-prueba="alias-expo"]').waitFor({ timeout: 10000 })
    const jugarAntes = await p.locator(`[data-desafio="${SPRINT}"]`).getByRole('link', { name: 'Jugar' }).count()
    await p.getByLabel('Tu alias').fill('a')
    await p.getByRole('button', { name: 'Jugar con este alias' }).click()
    const invalido = normalizar(await p.locator('.alias-expo__error').innerText())
    await p.getByLabel('Tu alias').fill('Juan_Expo')
    await p.getByRole('button', { name: 'Jugar con este alias' }).click()
    await p.locator('[data-prueba="alias-actual"]').waitFor({ timeout: 15000 })
    const actual = normalizar(await p.locator('[data-prueba="alias-actual"]').innerText())
    await p.locator(`[data-desafio="${SPRINT}"]`).getByRole('link', { name: 'Jugar' }).waitFor({ timeout: 10000 })
    const token = await p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion'))?.access_token)
    await ctx.close()

    const { datos: yo } = await api.auth('/user', undefined, { token, metodo: 'GET' })
    verificar(yo?.is_anonymous === true, 'no es una sesion de invitado')
    const { partida } = await jugarPorApi(api, bd, token, SPRINT, { aciertos: 2 })
    verificar(partida?.estado === 'finalizada', `partida: ${partida?.estado}`)
    const { datos: ranking } = await api.rpc(null, 'ranking_evento', { p_evento_id: EVENTO, p_limite: 100 })
    const fila = ranking.find((f) => f.alias === 'Juan_Expo' && f.desafio_id === SPRINT)
    verificar(jugarAntes === 0 && /alias/i.test(invalido), `antes: jugar ${jugarAntes}, error "${invalido}"`)
    verificar(/Juan_Expo#\d{4}/.test(actual), `alias actual: ${actual}`)
    verificar(fila?.puntaje === 200, `en el ranking: ${JSON.stringify(fila)}`)
    return `desafio sin sesion -> el evento pide alias · "a": "${invalido.slice(0, 40)}..." · con Juan_Expo: sesion de invitado, "${actual}" · juega y aparece en el ranking como Juan_Expo (200 pts)`
  }
)

// ===========================================================================
//  G. COMPU COMPARTIDA: SALIR Y CAMBIAR DE JUGADOR
// ===========================================================================

await caso(
  10,
  'Un invitado cierra sesion desde el menu de arriba',
  'Cerrar sesion muestra el aviso (no se cierra el menu); "Salir igual" borra la sesion del navegador y lleva fuera de las pantallas que la necesitan',
  async () => {
    const ctx = await contexto({ viewport: { width: 1280, height: 800 } })
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /invitado/i }).first().click()
    await p.waitForFunction(() => Boolean(localStorage.getItem('sintaxia:sesion')), null, { timeout: 10000 })
    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: 'Abrir menu de la cuenta' }).click()
    await p.getByRole('banner').getByRole('button', { name: /Cerrar sesion/ }).click()
    await dormir(300)
    const aviso = await p.getByRole('banner').getByRole('button', { name: 'Salir igual' }).count()
    verificar(aviso === 1, 'el menu se cerro y el aviso no se vio')
    await p.getByRole('banner').getByRole('button', { name: 'Salir igual' }).click()
    await p.waitForFunction(() => !localStorage.getItem('sintaxia:sesion'), null, { timeout: 10000 })
    await p.waitForURL((u) => !u.pathname.startsWith('/perfil'), { timeout: 10000 })
    const destino = new URL(p.url()).pathname
    await ctx.close()
    return `aviso "Salir igual" visible en el menu · sesion borrada · de /perfil a ${destino}`
  }
)

await caso(
  11,
  'Compu compartida: cambiar de jugador en la competencia',
  'Con un alias elegido aparece "Cambiar de jugador"; al usarlo se cierra esa sesion de invitado, vuelve el formulario vacio y el siguiente juega con otro alias y otro usuario; el primero sigue en el ranking',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    p.on('dialog', (d) => d.accept())
    await p.goto(`${URL_APP}/expo/${EVENTO}`, { waitUntil: 'networkidle' })
    const vistos = []
    for (const alias of ['Primero_A', 'Segundo_B']) {
      await p.getByLabel('Tu alias').fill(alias)
      await p.getByRole('button', { name: 'Jugar con este alias' }).click()
      await p.locator('[data-prueba="alias-actual"]').waitFor({ timeout: 10000 })
      const texto = normalizar(await p.locator('[data-prueba="alias-actual"]').innerText())
      const id = await p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion')).user.id)
      if (alias === 'Primero_A') await jugarPorApi(api, bd, await p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion')).access_token), SPRINT, { aciertos: 1 })
      vistos.push({ alias, texto, id })
      await p.locator('[data-prueba="cambiar-jugador"]').click()
      await p.locator('[data-prueba="alias-expo"]').waitFor({ timeout: 10000 })
    }
    const vacio = (await p.getByLabel('Tu alias').inputValue()) === ''
    const sinSesion = await p.evaluate(() => !localStorage.getItem('sintaxia:sesion'))
    const [primero] = await consulta(
      `select r.puntaje from resultados_publicos r join perfiles pf on pf.id_publico = r.participante where pf.id = $1`, [vistos[0].id])
    await ctx.close()
    verificar(vistos.every((v) => v.texto.includes(v.alias)) && vistos[0].id !== vistos[1].id, `jugadores: ${JSON.stringify(vistos)}`)
    verificar(vacio && sinSesion, `despues de cambiar: vacio ${vacio}, sin sesion ${sinSesion}`)
    verificar(primero, 'el primero no quedo en el ranking')
    return `${vistos.map((v) => `${v.alias} (usuario ${v.id.slice(0, 8)})`).join(' -> ')} · despues: formulario vacio y sin sesion · Primero_A sigue en el ranking (${primero.puntaje} pts)`
  }
)

// ===========================================================================
//  H. LOS DEMAS CURSOS
// ===========================================================================

await caso(
  12,
  'Python, HTML y CSS, SQL, Java y C++ tienen contenido y se juegan',
  'Los 6 cursos aparecen disponibles; cada curso nuevo tiene 2 unidades publicadas con 2 lecciones de 4 actividades; la correcta esta repartida entre las posiciones; una leccion de Python se juega entera y queda guardada',
  async () => {
    const [conteo] = await consulta(`
      select count(*) filter (where c.estado = 'disponible')::int as disponibles,
             (select json_object_agg(curso_id, n) from (
                select u.curso_id, count(q.*)::int as n from unidades u join lecciones l on l.unidad_id = u.id
                  join preguntas q on q.leccion_id = l.id
                 where u.estado = 'publicada' and q.estado = 'publicada' group by u.curso_id) x) as preguntas,
             (select json_object_agg(orden, n) from (
                select o.orden, count(*)::int as n from opciones o join preguntas q on q.id = o.pregunta_id
                  join lecciones l on l.id = q.leccion_id join unidades u on u.id = l.unidad_id
                 where o.es_correcta and u.curso_id <> 'javascript' group by o.orden) y) as posiciones
        from cursos c`)
    verificar(conteo.disponibles === 6, `cursos disponibles: ${conteo.disponibles}`)
    for (const curso of ['python', 'html-css', 'sql', 'java', 'cpp']) {
      verificar(conteo.preguntas[curso] === 16, `${curso}: ${conteo.preguntas[curso]} preguntas`)
    }
    verificar(Object.values(conteo.posiciones).every((n) => n >= 15), `posiciones de la correcta: ${JSON.stringify(conteo.posiciones)}`)

    const solucion = new Map((await consulta(
      `select q.enunciado, o.texto from preguntas q join opciones o on o.pregunta_id = q.id and o.es_correcta
        where q.leccion_id = 'py-u1-l1'`)).map((f) => [normalizar(f.enunciado), f.texto]))
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/cursos`, { waitUntil: 'networkidle' })
    const tarjetas = normalizar(await p.locator('main').innerText())
    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /Continuar como invitado|Seguir como invitado/ }).click()
    await p.waitForFunction(() => Boolean(localStorage.getItem('sintaxia:sesion')), null, { timeout: 10000 })
    await p.goto(`${URL_APP}/lecciones/py-u1-l1`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /Comenzar actividades/i }).or(p.getByRole('link', { name: /Comenzar actividades/i })).first().click()
    for (let i = 0; i < 4; i++) {
      await p.waitForSelector('.opcion')
      const texto = normalizar(await p.locator('main').innerText())
      const [, correcta] = [...solucion.entries()].find(([e]) => texto.includes(e)) ?? []
      verificar(correcta, `no reconozco la pregunta: ${texto.slice(0, 120)}`)
      await p.getByRole('button', { name: correcta, exact: true }).first().click()
      await p.getByRole('button', { name: /Comprobar/ }).click()
      await p.waitForSelector('.feedback')
      await p.locator('.feedback button').click()
      await dormir(200)
    }
    await p.waitForURL(/\/resultados/, { timeout: 10000 })
    const id = await p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion')).user.id)
    const [intento] = await consulta(`select estado, aciertos as correctas from intentos where usuario_id = $1 and leccion_id = 'py-u1-l1'`, [id])
    await ctx.close()
    verificar(['Python', 'HTML y CSS', 'SQL', 'Java', 'C++'].every((c) => tarjetas.includes(c)), `cursos en pantalla: ${tarjetas.slice(0, 200)}`)
    verificar(intento && intento.correctas === 4, `intento: ${JSON.stringify(intento)}`)
    return `6 cursos disponibles · 16 preguntas publicadas en cada curso nuevo · correcta en a/b/c/d: ${Object.values(conteo.posiciones).join('/')} · leccion py-u1-l1 jugada: ${intento.estado}, ${intento.correctas}/4`
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
