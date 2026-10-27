/**
 * Pruebas automaticas de la etapa 4: invitados, registro e inicio de sesion.
 *
 * Que se prueba y contra que:
 *   · Supabase Auth: el servidor REAL (GoTrue), compilado en local. Las altas
 *     anonimas, la confirmacion de correo, la recuperacion y la conversion de
 *     invitado a cuenta las ejecuta el mismo codigo que corre en Supabase.
 *   · Permisos y RLS: PostgreSQL real, ejecutando cada consulta con el rol y los
 *     claims del token que la hizo.
 *   · La app: un navegador real (Chromium) con la app de Vue.
 *   · Lo unico simulado es la capa HTTP de la API de datos (PostgREST).
 *
 * Preparacion (una vez, en este orden):
 *   sh pruebas/compilar-auth-local.sh          # compila Supabase Auth
 *   node pruebas/preparar-base-local.mjs       # base + esquema auth + scripts del proyecto
 *   node pruebas/servidor-supabase-local.mjs   # Auth + API de datos + correos de prueba
 *   VITE_SUPABASE_URL=http://localhost:5599 \
 *   VITE_SUPABASE_PUBLISHABLE_KEY=<clavePublicable de /__control/claves> \
 *   npm run dev -- --port 5174                 # la app
 * (o todo junto: npm run pruebas:entorno)
 *
 * Despues:  node pruebas/etapa4.mjs
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

import { calcularEstadisticas } from '../src/utils/estadisticas.js'
import {
  URL_APP,
  URL_SB,
  abrirBase,
  borrarCorreos,
  correoNuevo,
  correosPara,
  crearApi,
  decodificar,
  dormir,
  enlaceDeVerificacion,
  esperarCorreo,
  leerClaves,
  resolverPorApi,
  reiniciarAuth
} from './local/ayudas.mjs'

const claves = await leerClaves()
const api = crearApi(claves)
const bd = abrirBase()
await bd.connect()

const casos = []
const excepciones = []

// SOLO=14,27 corre unicamente esos casos (los datos de preparacion se crean igual).
const SOLO = process.env.SOLO ? process.env.SOLO.split(',').map(Number) : null

/** Registra un caso. `fn` devuelve el texto "obtenido"; si lanza, el caso falla. */
async function caso(numero, titulo, esperado, fn) {
  if (SOLO && !SOLO.includes(numero)) return
  let obtenido
  let pasa = false
  try {
    const resultado = await fn()
    obtenido = typeof resultado === 'string' ? resultado : resultado.obtenido
    pasa = typeof resultado === 'string' ? true : resultado.pasa
  } catch (error) {
    obtenido = `EXCEPCION: ${String(error.message).split('\n')[0].slice(0, 220)}`
  }
  casos.push({ numero, titulo, esperado, obtenido, pasa })
  console.log(`${pasa ? 'PASA ' : 'FALLA'} ${numero}. ${titulo}`)
  if (!pasa) console.log(`        esperado: ${esperado}\n        obtenido: ${obtenido}`)
}

/** Lanza si la condicion no se cumple; asi un caso puede encadenar varias verificaciones. */
function verificar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje)
}

const consulta = async (sql, params = []) => (await bd.query(sql, params)).rows

// Autoverificacion: una corrida anterior que se haya cortado a mitad de camino no debe
// dejar la base en un estado raro (por ejemplo, con el disparador de codigos apagado).
{
  const [t] = await consulta("select tgenabled from pg_trigger where tgname = 'tg_perfiles_codigo'")
  if (t?.tgenabled !== 'O') {
    console.warn('AVISO: el disparador tg_perfiles_codigo estaba desactivado; se reactiva.')
    await consulta('alter table perfiles enable trigger tg_perfiles_codigo')
  }
}

// ---------------------------------------------------------------------------
// Navegador
// ---------------------------------------------------------------------------
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

async function contexto(opciones = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 412, height: 900 }, ...opciones })
  // La pantalla de bienvenida no es lo que se prueba aca.
  await ctx.addInitScript(() => localStorage.setItem('sintaxia:bienvenida-vista', '1'))
  return ctx
}

async function pagina(ctx) {
  const p = await ctx.newPage()
  // Solo las excepciones NO atrapadas cuentan como error de pagina: los avisos de la
  // consola por respuestas 4xx son esperables en las pruebas de casos negativos.
  p.on('pageerror', (e) => excepciones.push(`${e.message}`))
  return p
}

const texto = async (p) => (await p.locator('body').innerText()).replace(/\s+/g, ' ')

async function leerSesion(p) {
  return p.evaluate(() => JSON.parse(localStorage.getItem('sintaxia:sesion') ?? 'null'))
}

/** Entra como invitado desde /ingresar y espera a estar dentro. */
async function entrarComoInvitado(p, destino = '/perfil') {
  await p.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(destino)}`, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Continuar como invitado|Seguir como invitado/ }).click()
  await p.waitForURL(`**${destino}`, { timeout: 15000 })
  await p.waitForFunction(() => document.querySelector('[data-prueba="alias"]') || true)
  await dormir(500)
}

/** Resuelve una leccion completa respondiendo todo bien. */
async function resolverLeccion(p, leccionId = 'js-u1-l1') {
  const filas = await consulta(
    `select o.texto from preguntas q join opciones o on o.pregunta_id = q.id
      where q.leccion_id = $1 and o.es_correcta order by q.orden`,
    [leccionId]
  )
  // ?nuevo=1: un intento desde cero aunque hubiera otro en curso (etapa 5).
  await p.goto(`${URL_APP}/lecciones/${leccionId}/actividades?nuevo=1`, { waitUntil: 'networkidle' })
  for (const fila of filas) {
    await p.waitForSelector('.opcion')
    await p.getByRole('button', { name: fila.texto, exact: true }).first().click()
    await p.getByRole('button', { name: /Comprobar/ }).click()
    await p.waitForSelector('.feedback')
    await p.locator('.feedback button').click()
    await dormir(120)
  }
  await p.waitForURL(/resultados/, { timeout: 8000 })
}

/** Que elementos se salen de la pantalla (ignora los que estan dentro de un contenedor con scroll). */
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
        salen.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}(der=${Math.round(caja.right)})`)
      }
    }
    return salen.slice(0, 6).join(', ') || 'ninguno visible'
  })

const etiquetaDePerfil = async (p) => (await p.locator('[data-prueba="alias"]').innerText()).trim()

// ===========================================================================
//  A. INVITADOS
// ===========================================================================

await caso(
  1,
  'Dos invitados distintos reciben usuarios y perfiles propios',
  'Dos sesiones anonimas con ids distintos, cada una con su perfil "Invitado#codigo"; ninguna ve el perfil de la otra',
  async () => {
    const [c1, c2] = [await contexto(), await contexto()]
    const [p1, p2] = [await pagina(c1), await pagina(c2)]
    await entrarComoInvitado(p1)
    await entrarComoInvitado(p2)

    const [s1, s2] = [await leerSesion(p1), await leerSesion(p2)]
    verificar(s1.user.is_anonymous && s2.user.is_anonymous, 'alguna sesion no es anonima')
    verificar(s1.user.id !== s2.user.id, 'los dos invitados comparten el mismo usuario')

    const filas = await consulta('select id, alias, es_invitado from perfiles where id = any($1)', [[s1.user.id, s2.user.id]])
    verificar(filas.length === 2, `perfiles creados: ${filas.length}`)
    verificar(filas.every((f) => f.alias === 'Invitado' && f.es_invitado), 'los perfiles no son de invitado')

    // Cada uno ve solo el suyo, aunque pida todos.
    const propios1 = await api.datos(s1.access_token, 'GET', 'perfiles?select=id')
    verificar(propios1.datos.length === 1 && propios1.datos[0].id === s1.user.id, 'el invitado 1 ve perfiles ajenos')

    const [e1, e2] = [await etiquetaDePerfil(p1), await etiquetaDePerfil(p2)]
    await Promise.all([c1.close(), c2.close()])
    return `ids distintos · perfiles ${e1} y ${e2} · cada uno ve solo el propio (${propios1.datos.length} fila)`
  }
)

await caso(
  2,
  'El alias que manda el cliente a un invitado se ignora',
  'Un invitado que intenta registrarse con alias "Hacker" queda como "Invitado"',
  async () => {
    const alta = await api.altaAnonima({ alias: 'Hacker', es_invitado: false })
    verificar(alta.estado === 200, `alta anonima: ${alta.estado}`)
    const [fila] = await consulta('select alias, es_invitado from perfiles where id = $1', [alta.id])
    verificar(fila.alias === 'Invitado' && fila.es_invitado === true, `perfil: ${JSON.stringify(fila)}`)
    return `metadatos {alias:"Hacker"} -> perfil "${fila.alias}", es_invitado=${fila.es_invitado}`
  }
)

await caso(
  3,
  'Restaurar la sesion no crea otro invitado',
  'Recargar y reabrir la app reutiliza la sesion guardada: la cantidad de invitados no aumenta',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const etiqueta = await etiquetaDePerfil(p)
    const [{ n: antes }] = await consulta('select count(*)::int as n from auth.users where is_anonymous')

    for (let i = 0; i < 3; i++) await p.reload({ waitUntil: 'networkidle' })
    const otra = await pagina(ctx) // "cerrar y volver a abrir": pagina nueva, mismo almacenamiento
    await otra.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(500)
    const etiquetaDespues = await etiquetaDePerfil(otra)

    const [{ n: despues }] = await consulta('select count(*)::int as n from auth.users where is_anonymous')
    verificar(despues === antes, `invitados: ${antes} -> ${despues}`)
    verificar(etiqueta === etiquetaDespues, `${etiqueta} -> ${etiquetaDespues}`)
    await ctx.close()
    return `3 recargas + pagina nueva: sigue siendo ${etiquetaDespues} · invitados ${antes} -> ${despues}`
  }
)

await caso(
  4,
  'Un invitado no conserva su sesion en otro dispositivo',
  'En un navegador distinto no hay sesion: la ruta protegida manda a ingresar',
  async () => {
    const original = await contexto()
    await entrarComoInvitado(await pagina(original))

    const otroDispositivo = await contexto() // almacenamiento nuevo = otro dispositivo
    const p = await pagina(otroDispositivo)
    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    const ruta = new URL(p.url())
    verificar(ruta.pathname === '/ingresar', `fue a ${ruta.pathname}`)
    await Promise.all([original.close(), otroDispositivo.close()])
    return `en el otro dispositivo /perfil redirige a ${ruta.pathname}${ruta.search}`
  }
)

// ===========================================================================
//  B. REGISTRO  (confirmacion de correo ACTIVADA, como en Supabase por defecto)
// ===========================================================================

await caso(
  5,
  'Registro con correo y confirmacion',
  'Llega el correo, el enlace confirma la cuenta, se abre la sesion y el perfil tiene el alias elegido',
  async () => {
    const correo = correoNuevo('registro')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Ana_Dev')
    await p.getByLabel('Correo', { exact: true }).fill(correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByRole('heading', { name: 'Revisa tu correo' }).waitFor({ timeout: 10000 })

    const [antes] = await consulta('select email_confirmed_at from auth.users where email = $1', [correo])
    verificar(antes && antes.email_confirmed_at === null, 'la cuenta ya figura confirmada antes de abrir el enlace')

    const mail = await esperarCorreo(correo)
    await p.goto(enlaceDeVerificacion(mail))
    await p.getByRole('heading', { name: /tu cuenta esta confirmada/ }).waitFor({ timeout: 10000 })

    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(500)
    const etiqueta = await etiquetaDePerfil(p)
    const [despues] = await consulta('select email_confirmed_at, is_anonymous from auth.users where email = $1', [correo])
    verificar(/^Ana_Dev#\d{4}$/.test(etiqueta), `etiqueta: ${etiqueta}`)
    verificar(despues.email_confirmed_at !== null && despues.is_anonymous === false, 'la cuenta no quedo confirmada')
    verificar((await texto(p)).includes('Cuenta'), 'no se ve la insignia de cuenta')
    await ctx.close()
    return `correo "${mail.asunto}" -> confirmada -> perfil ${etiqueta} (insignia Cuenta)`
  }
)

await caso(
  7,
  'Registro con un correo ya utilizado',
  'Avisa que ese correo ya tiene cuenta, ofrece ingresar o recuperar, y no crea una cuenta duplicada',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('repetido'), alias: 'Primera' })
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Segunda')
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('otra-clave-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByText(/ya tiene una cuenta/).first().waitFor({ timeout: 10000 })

    const hayIngresar = await p.getByRole('link', { name: 'Iniciar sesion' }).first().isVisible()
    const hayRecuperar = await p.getByRole('link', { name: 'Recuperar mi contrasena' }).isVisible()
    const [{ n }] = await consulta('select count(*)::int as n from auth.users where email = $1', [cuenta.correo])
    verificar(n === 1, `cuentas con ese correo: ${n}`)
    verificar(hayIngresar && hayRecuperar, 'faltan los accesos para ingresar o recuperar')
    await ctx.close()
    return `mensaje "ya tiene una cuenta" · enlaces a ingresar y recuperar · cuentas con ese correo: ${n}`
  }
)

await caso(
  9,
  'Contrasena invalida',
  'La app rechaza una contrasena corta sin llamar al servidor, y traduce el rechazo del servidor (weak_password)',
  async () => {
    // a) El formulario la rechaza antes de pedirla.
    const ctx = await contexto()
    const p = await pagina(ctx)
    const pedidosAlta = []
    p.on('request', (r) => {
      if (r.url().includes('/auth/v1/signup')) pedidosAlta.push(r.url())
    })
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Clave_Corta')
    await p.getByLabel('Correo', { exact: true }).fill(correoNuevo('corta'))
    await p.getByLabel('Contrasena', { exact: true }).fill('abc')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByText(/al menos 8 caracteres/).first().waitFor({ timeout: 5000 })
    verificar(pedidosAlta.length === 0, 'la contrasena corta llego al servidor')

    // b) El servidor tambien la rechaza (si alguien se salta el formulario).
    const directo = await api.auth('/signup', { email: correoNuevo('directo'), password: 'abc' })
    verificar(directo.estado === 422 && directo.datos.error_code === 'weak_password', `servidor: ${directo.estado} ${directo.datos?.error_code}`)

    // c) La app muestra ese rechazo en castellano.
    await p.route('**/auth/v1/signup*', (ruta) =>
      ruta.fulfill({
        status: 422,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ code: 422, error_code: 'weak_password', msg: 'Password should be at least 8 characters.' })
      })
    )
    await p.getByLabel('Contrasena', { exact: true }).fill('abcdefgh')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByText(/demasiado debil/).waitFor({ timeout: 5000 })
    await ctx.close()
    return `formulario: rechaza "abc" sin pedido al servidor · servidor: 422 weak_password · app: "demasiado debil"`
  }
)

await caso(
  10,
  'Reglas del alias en el formulario',
  'Un alias reservado, muy corto o con tilde se rechaza en pantalla, sin llamar al servidor',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    const pedidos = []
    p.on('request', (r) => {
      if (r.url().includes('/auth/v1/signup')) pedidos.push(r.url())
    })
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Correo', { exact: true }).fill(correoNuevo('alias'))
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')

    const resultados = []
    for (const [alias, patron] of [
      ['admin', /reservado/],
      ['ab', /al menos 3/],
      ['Martín', /sin tilde/],
      ['_sombra', /guion bajo/],
      ['Invitado', /nombre de los invitados/]
    ]) {
      await p.getByLabel('Alias', { exact: true }).fill(alias)
      await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
      await p.getByText(patron).first().waitFor({ timeout: 4000 })
      resultados.push(alias)
    }
    verificar(pedidos.length === 0, 'un alias invalido llego al servidor')
    await ctx.close()
    return `rechazados en pantalla: ${resultados.join(', ')} · pedidos al servidor: ${pedidos.length}`
  }
)

// ===========================================================================
//  C. SESION: cierre, reapertura y rutas protegidas
// ===========================================================================

await caso(
  11,
  'Cierre y reapertura de sesion de una cuenta',
  'Al reabrir la app la sesion se restaura; al cerrar sesion se pierde y las rutas protegidas piden ingresar',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('sesion'), alias: 'Sesionista' })
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByLabel('Contrasena', { exact: true }).fill(cuenta.clave)
    await p.getByRole('button', { name: 'Entrar', exact: true }).click()
    await p.waitForURL('**/perfil', { timeout: 15000 })
    await dormir(500)
    const etiqueta = await etiquetaDePerfil(p)
    verificar(/^Sesionista#\d{4}$/.test(etiqueta), `etiqueta: ${etiqueta}`)

    // Reapertura: pagina nueva con el mismo almacenamiento.
    const otra = await pagina(ctx)
    await otra.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(500)
    verificar(new URL(otra.url()).pathname === '/perfil', 'la reapertura no restauro la sesion')
    verificar((await etiquetaDePerfil(otra)) === etiqueta, 'la reapertura mostro otro perfil')

    // Cierre: una cuenta sale sin advertencia (su historial queda guardado).
    await p.getByRole('button', { name: 'Cerrar sesion' }).click()
    await p.waitForURL(`${URL_APP}/`, { timeout: 10000 })
    verificar((await leerSesion(p)) === null, 'la sesion sigue guardada en el dispositivo')
    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    const destino = new URL(p.url())
    verificar(destino.pathname === '/ingresar', `tras cerrar, /perfil fue a ${destino.pathname}`)
    await ctx.close()
    return `login -> ${etiqueta} · reapertura restaura · cerrar sesion borra la sesion · /perfil -> ${destino.pathname}`
  }
)

await caso(
  12,
  'Un invitado que cierra sesion recibe la advertencia',
  'Se avisa que pierde el historial para siempre, se puede quedar, y solo sale si confirma',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)

    await p.getByRole('button', { name: 'Cerrar sesion' }).click()
    await p.getByText(/perdes tu historial para siempre/).waitFor({ timeout: 4000 })
    verificar((await leerSesion(p)) !== null, 'cerro la sesion sin confirmar')

    await p.getByRole('button', { name: 'Quedarme' }).click()
    verificar((await leerSesion(p)) !== null, 'cerro la sesion al elegir quedarse')
    verificar((await p.getByText(/perdes tu historial para siempre/).count()) === 0, 'la advertencia no se cerro')

    await p.getByRole('button', { name: 'Cerrar sesion' }).click()
    await p.getByRole('button', { name: 'Salir igual' }).click()
    await p.waitForURL(`${URL_APP}/`, { timeout: 10000 })
    verificar((await leerSesion(p)) === null, 'la sesion sigue guardada tras confirmar')
    await ctx.close()
    return 'advertencia visible · "Quedarme" conserva la sesion · "Salir igual" la cierra'
  }
)

await caso(
  13,
  'Rutas protegidas y redireccion segura',
  'Sin sesion se manda a ingresar y se vuelve a la ruta pedida; una direccion externa en ?volver se descarta',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/lecciones/js-u1-l1`, { waitUntil: 'networkidle' })
    const primera = new URL(p.url())
    verificar(primera.pathname === '/ingresar' && primera.searchParams.get('volver') === '/lecciones/js-u1-l1', `fue a ${primera.pathname}${primera.search}`)
    await p.getByRole('button', { name: /Continuar como invitado/ }).click()
    await p.waitForURL('**/lecciones/js-u1-l1', { timeout: 15000 })
    await ctx.close()

    // Redireccion abierta: ?volver=//sitio-malo.com y ?volver=https://sitio-malo.com
    const resultados = []
    for (const malo of ['//sitio-malo.com', 'https://sitio-malo.com']) {
      const c = await contexto()
      const q = await pagina(c)
      await q.goto(`${URL_APP}/ingresar?volver=${encodeURIComponent(malo)}`, { waitUntil: 'networkidle' })
      await q.getByRole('button', { name: /Continuar como invitado/ }).click()
      await q.waitForURL(`${URL_APP}/perfil`, { timeout: 15000 })
      resultados.push(`${malo} -> ${new URL(q.url()).pathname}`)
      await c.close()
    }
    return `protegida -> ${primera.pathname}?volver=... -> vuelve a la leccion · ${resultados.join(' · ')}`
  }
)

// ===========================================================================
//  D. CONVERSION DE INVITADO A CUENTA
// ===========================================================================

await caso(
  14,
  'Convertir un invitado en cuenta (confirmacion de correo activada)',
  'Es el MISMO usuario: conserva su id y su historial, no se crea otra cuenta, y sigue siendo invitado hasta confirmar el correo',
  async () => {
    const correo = correoNuevo('conversion')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    await resolverLeccion(p) // arma historial como invitado
    await dormir(800)

    const idAntes = (await leerSesion(p)).user.id
    const [{ n: usuariosAntes }] = await consulta('select count(*)::int as n from auth.users')
    const [{ n: intentosAntes }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [idAntes])
    verificar(intentosAntes === 1, `el invitado deberia tener 1 intento, tiene ${intentosAntes}`)

    // Convierte desde el formulario de registro.
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByText(/Tu progreso se conserva/).waitFor({ timeout: 5000 })
    await p.getByLabel('Alias', { exact: true }).fill('Convertida')
    await p.getByLabel('Correo', { exact: true }).fill(correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByRole('heading', { name: 'Revisa tu correo' }).waitFor({ timeout: 10000 })
    await p.getByText(/Seguis como invitado hasta que confirmes/).waitFor({ timeout: 4000 })

    // Antes de confirmar: mismo usuario, todavia invitado.
    const [pendiente] = await consulta('select is_anonymous from auth.users where id = $1', [idAntes])
    const [perfilPendiente] = await consulta('select es_invitado, alias from perfiles where id = $1', [idAntes])
    verificar(pendiente.is_anonymous === true && perfilPendiente.es_invitado === true, 'dejo de ser invitado antes de confirmar')

    // Confirma con el enlace del correo.
    const mail = await esperarCorreo(correo)
    await p.goto(enlaceDeVerificacion(mail))
    await p.getByRole('heading', { name: /tu cuenta esta confirmada/ }).waitFor({ timeout: 10000 })

    const idDespues = (await leerSesion(p)).user.id
    const [convertido] = await consulta('select is_anonymous, email from auth.users where id = $1', [idDespues])
    const [perfil] = await consulta('select es_invitado, alias from perfiles where id = $1', [idDespues])
    const [{ n: usuariosDespues }] = await consulta('select count(*)::int as n from auth.users')
    const [{ n: intentosDespues }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [idDespues])

    verificar(idDespues === idAntes, `el id cambio: ${idAntes} -> ${idDespues}`)
    verificar(convertido.is_anonymous === false && convertido.email === correo, 'no quedo como cuenta')
    verificar(perfil.es_invitado === false && perfil.alias === 'Convertida', `perfil: ${JSON.stringify(perfil)}`)
    verificar(usuariosDespues === usuariosAntes, `se creo otra cuenta: ${usuariosAntes} -> ${usuariosDespues}`)
    verificar(intentosDespues === intentosAntes, `historial: ${intentosAntes} -> ${intentosDespues}`)

    // Y la app lo muestra: mismo historial (XP) con el alias nuevo.
    await p.goto(`${URL_APP}/perfil`, { waitUntil: 'networkidle' })
    await dormir(600)
    const etiqueta = await etiquetaDePerfil(p)
    const xp = Number((await p.locator('.estadisticas li').first().innerText()).match(/\d+/)[0])
    verificar(/^Convertida#\d{4}$/.test(etiqueta) && xp > 0, `perfil: ${etiqueta}, XP ${xp}`)
    await ctx.close()
    return `mismo id · invitado hasta confirmar · luego ${etiqueta} con ${xp} XP · usuarios ${usuariosAntes}->${usuariosDespues} · intentos ${intentosAntes}->${intentosDespues}`
  }
)

await caso(
  16,
  'Convertir un invitado con un correo que ya tiene cuenta',
  'Se rechaza con un mensaje claro y la persona sigue siendo el mismo invitado, sin perder nada',
  async () => {
    const existente = await api.cuentaConfirmada({ correo: correoNuevo('ocupado'), alias: 'Dueno' })
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const idAntes = (await leerSesion(p)).user.id

    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Intruso')
    await p.getByLabel('Correo', { exact: true }).fill(existente.correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByText(/ya tiene una cuenta/).first().waitFor({ timeout: 10000 })

    const [u] = await consulta('select is_anonymous, email from auth.users where id = $1', [idAntes])
    verificar(u.is_anonymous === true && u.email === null, `el invitado cambio: ${JSON.stringify(u)}`)
    verificar((await leerSesion(p)).user.id === idAntes, 'cambio la sesion')
    await ctx.close()
    return 'mensaje "ya tiene una cuenta" · el invitado sigue siendo el mismo, sin correo'
  }
)

await caso(
  17,
  'Un invitado entra a una cuenta que ya existe',
  'La app advierte que los historiales no se fusionan, exige confirmarlo, y no copia nada de un lado al otro',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('destino'), alias: 'Destino' })
    // La cuenta ya tiene 1 intento propio.
    await resolverPorApi(api, bd, cuenta.token, 'js-u1-l1')

    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const idInvitado = (await leerSesion(p)).user.id
    await resolverPorApi(api, bd, (await leerSesion(p)).access_token, 'js-u1-l1', { aciertos: 3 })

    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.getByText(/no se va a pasar/).first().waitFor({ timeout: 5000 })
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByLabel('Contrasena', { exact: true }).fill(cuenta.clave)
    const entrar = p.getByRole('button', { name: 'Entrar', exact: true })
    verificar(await entrar.isDisabled(), 'el boton Entrar estaba habilitado sin confirmar la advertencia')

    await p.getByLabel(/Entiendo que mi progreso de invitado/).check()
    verificar(await entrar.isEnabled(), 'el boton Entrar sigue deshabilitado tras confirmar')
    await entrar.click()
    await p.waitForURL('**/perfil', { timeout: 15000 })
    await dormir(800)

    const etiqueta = await etiquetaDePerfil(p)
    const idAhora = (await leerSesion(p)).user.id
    const [{ n: deLaCuenta }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [cuenta.id])
    const [{ n: delInvitado }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [idInvitado])
    verificar(idAhora === cuenta.id && /^Destino#/.test(etiqueta), `sesion: ${etiqueta}`)
    verificar(deLaCuenta === 1, `la cuenta recibio historial ajeno: ${deLaCuenta} intentos`)
    verificar(delInvitado === 1, `el historial del invitado se movio: ${delInvitado}`)
    await ctx.close()
    return `advertencia + confirmacion obligatoria · ahora ${etiqueta} · historial de la cuenta: ${deLaCuenta} intento, del invitado: ${delInvitado} (no se fusionaron)`
  }
)

// ===========================================================================
//  E. RECUPERACION DE ACCESO
// ===========================================================================

await caso(
  18,
  'Recuperar el acceso en el mismo dispositivo',
  'Se pide el enlace, llega por correo, permite elegir una contrasena nueva y la vieja deja de servir',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('olvido'), clave: 'clave-vieja-123', alias: 'Olvidadiza' })
    const ctx = await contexto()
    const p = await pagina(ctx)

    await p.goto(`${URL_APP}/recuperar`, { waitUntil: 'networkidle' })
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByRole('button', { name: 'Mandar el enlace' }).click()
    await p.getByText(/te mandamos un enlace para elegir una/).waitFor({ timeout: 10000 })

    const mail = await esperarCorreo(cuenta.correo, { cantidad: 2 }) // el 1ro fue el de confirmacion
    await p.goto(enlaceDeVerificacion(mail))
    await p.getByRole('heading', { name: 'Elegi tu contrasena nueva' }).waitFor({ timeout: 10000 })

    await p.getByLabel('Contrasena nueva', { exact: true }).fill('clave-nueva-456')
    await p.getByLabel('Repetila', { exact: true }).fill('clave-nueva-456')
    await p.getByRole('button', { name: 'Guardar contrasena' }).click()
    await p.getByRole('heading', { name: 'Contrasena cambiada' }).waitFor({ timeout: 10000 })

    const vieja = await api.iniciarSesion(cuenta.correo, 'clave-vieja-123')
    const nueva = await api.iniciarSesion(cuenta.correo, 'clave-nueva-456')
    verificar(vieja.estado === 400 && vieja.datos.error_code === 'invalid_credentials', `la vieja respondio ${vieja.estado}`)
    verificar(nueva.estado === 200 && nueva.token, `la nueva respondio ${nueva.estado}`)
    await ctx.close()
    return `enlace "${mail.asunto}" -> contrasena cambiada · la vieja: ${vieja.estado} invalid_credentials · la nueva: ${nueva.estado}`
  }
)

await caso(
  19,
  'El enlace de recuperacion abierto en otro dispositivo',
  'Explica por que no sirve y ofrece pedir uno nuevo, en lugar de dejar la pantalla rota',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('otrodisp'), alias: 'Viajera' })
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/recuperar`, { waitUntil: 'networkidle' })
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByRole('button', { name: 'Mandar el enlace' }).click()
    await p.getByText(/te mandamos un enlace para elegir una/).waitFor({ timeout: 10000 })
    const mail = await esperarCorreo(cuenta.correo, { cantidad: 2 })
    await ctx.close()

    const otroDispositivo = await contexto()
    const q = await pagina(otroDispositivo)
    await q.goto(enlaceDeVerificacion(mail))
    await q.getByRole('heading', { name: 'Este enlace no sirve' }).waitFor({ timeout: 10000 })
    const pedirOtro = await q.getByRole('link', { name: 'Pedir un enlace nuevo' }).isVisible()
    const dice = await q.getByText(/mismo dispositivo y navegador/).first().isVisible()
    verificar(pedirOtro && dice, 'falta la explicacion o el acceso a pedir otro enlace')
    verificar((await leerSesion(q)) === null, 'se abrio una sesion en el otro dispositivo')
    await otroDispositivo.close()
    return 'otro dispositivo -> "Este enlace no sirve" + explicacion + "Pedir un enlace nuevo" · no se abre sesion'
  }
)

await caso(
  20,
  'Recuperacion con un correo que no tiene cuenta',
  'Responde igual que si existiera (no revela quien esta registrado) y no manda ningun correo',
  async () => {
    const inexistente = correoNuevo('nadie')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/recuperar`, { waitUntil: 'networkidle' })
    await p.getByLabel('Correo', { exact: true }).fill(inexistente)
    await p.getByRole('button', { name: 'Mandar el enlace' }).click()
    await p.getByText(/te mandamos un enlace para elegir una/).waitFor({ timeout: 10000 })
    await dormir(2000)
    const enviados = await correosPara(inexistente)
    verificar(enviados.length === 0, `se mandaron ${enviados.length} correos a una direccion sin cuenta`)
    await ctx.close()
    return 'mismo mensaje que con una cuenta real · correos enviados: 0'
  }
)

// ===========================================================================
//  F. PERMISOS (RLS): cada participante, solo lo propio
// ===========================================================================

// Tres personas para los casos de seguridad.
const invitadoA = await api.altaAnonima()
const invitadoB = await api.altaAnonima()
const cuentaC = await api.cuentaConfirmada({ correo: correoNuevo('segC'), alias: 'Cecilia' })
await resolverPorApi(api, bd, invitadoA.token, 'js-u1-l1', { aciertos: 2 })
await resolverPorApi(api, bd, invitadoB.token, 'js-u1-l1', { aciertos: 3 })

await caso(
  21,
  'Cada participante ve solo su perfil y su historial',
  'Pidiendo todo, cada uno recibe unicamente lo propio; sin sesion no se ve nada',
  async () => {
    const perfilesA = await api.datos(invitadoA.token, 'GET', 'perfiles?select=id')
    const ajeno = await api.datos(invitadoA.token, 'GET', `perfiles?select=id&id=eq.${invitadoB.id}`)
    const intentosA = await api.datos(invitadoA.token, 'GET', 'intentos?select=usuario_id')
    const intentosB = await api.datos(invitadoB.token, 'GET', 'intentos?select=usuario_id')
    const sinSesionPerfiles = await api.datos(null, 'GET', 'perfiles?select=id')
    const sinSesionIntentos = await api.datos(null, 'GET', 'intentos?select=id')

    verificar(perfilesA.datos.length === 1 && perfilesA.datos[0].id === invitadoA.id, 'A ve perfiles ajenos')
    verificar(ajeno.datos.length === 0, 'A pudo leer el perfil de B por id')
    verificar(intentosA.datos.every((f) => f.usuario_id === invitadoA.id) && intentosA.datos.length === 1, 'A ve historial ajeno')
    verificar(intentosB.datos.every((f) => f.usuario_id === invitadoB.id) && intentosB.datos.length === 1, 'B ve historial ajeno')
    verificar(sinSesionPerfiles.estado === 401 && sinSesionIntentos.estado === 401, `sin sesion: ${sinSesionPerfiles.estado}/${sinSesionIntentos.estado}`)
    return `A ve ${perfilesA.datos.length} perfil y ${intentosA.datos.length} intento · perfil de B por id: ${ajeno.datos.length} filas · sin sesion: HTTP ${sinSesionPerfiles.estado} y ${sinSesionIntentos.estado}`
  }
)

await caso(
  22,
  'Nadie puede modificar datos ajenos ni los campos protegidos',
  'Modificar o borrar lo de otro no hace nada; tocar es_invitado, codigo o escribir intentos directamente esta prohibido',
  async () => {
    const antesB = (await consulta('select alias, codigo, es_invitado from perfiles where id = $1', [invitadoB.id]))[0]
    const intentosBAntes = (await consulta('select count(*)::int as n from intentos where usuario_id = $1', [invitadoB.id]))[0].n

    // Sobre datos de OTRO: la politica no deja ver el renglon, asi que no se modifica nada.
    const cambiarAjeno = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoB.id}&select=id`, { avatar: 'robot' }, 'return=representation')
    const borrarAjeno = await api.datos(invitadoA.token, 'DELETE', `intentos?usuario_id=eq.${invitadoB.id}&select=id`, undefined, 'return=representation')
    verificar(cambiarAjeno.datos.length === 0 && borrarAjeno.datos.length === 0, 'se modifico algo ajeno')

    // Campos protegidos del PROPIO perfil.
    const hacerseCuenta = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoA.id}`, { es_invitado: false })
    const cambiarCodigo = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoA.id}`, { codigo: 1 })
    const darseId = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoA.id}`, { id: invitadoB.id })
    verificar([hacerseCuenta, cambiarCodigo, darseId].every((r) => r.estado === 403), `protegidos: ${[hacerseCuenta, cambiarCodigo, darseId].map((r) => r.estado)}`)

    // Un invitado no elige alias: aunque el alias sea valido, la restriccion de la tabla lo rechaza.
    const aliasInvitado = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoA.id}`, { alias: 'Hacker' })
    verificar(aliasInvitado.estado === 400 && String(aliasInvitado.datos?.message).includes('ck_perfiles_invitado'), `alias de invitado: ${aliasInvitado.estado}`)
    const sigueInvitado = (await consulta('select alias from perfiles where id = $1', [invitadoA.id]))[0].alias
    verificar(sigueInvitado === 'Invitado', `el alias del invitado quedo en ${sigueInvitado}`)

    // Insertar a nombre de otro, crear o borrar perfiles.
    const aNombreDeB = await api.datos(invitadoA.token, 'POST', 'intentos', { usuario_id: invitadoB.id, leccion_id: 'js-u1-l1', numero: 9, total_actividades: 4, aciertos: 4 })
    const crearPerfil = await api.datos(invitadoA.token, 'POST', 'perfiles', { id: invitadoA.id, alias: 'Otro', codigo: 5 })
    const borrarPerfil = await api.datos(invitadoA.token, 'DELETE', `perfiles?id=eq.${invitadoA.id}`)
    verificar([aNombreDeB, crearPerfil, borrarPerfil].every((r) => r.estado === 403), `escrituras: ${[aNombreDeB, crearPerfil, borrarPerfil].map((r) => r.estado)}`)

    // Desde la etapa 5 el historial propio tampoco se escribe a mano: solo por las funciones del servidor.
    const inflarPropio = await api.datos(invitadoA.token, 'POST', 'intentos', { leccion_id: 'js-u1-l1', numero: 9, total_actividades: 4, aciertos: 4 })
    const leccionFalsa = await api.rpc(invitadoA.token, 'iniciar_intento', { p_intento_id: crypto.randomUUID(), p_leccion_id: 'no-existe' })
    verificar(inflarPropio.estado === 403 && leccionFalsa.estado === 400 && leccionFalsa.datos?.hint === 'leccion_bloqueada', `invalidos: ${inflarPropio.estado}/${leccionFalsa.estado}`)

    const despuesB = (await consulta('select alias, codigo, es_invitado from perfiles where id = $1', [invitadoB.id]))[0]
    const intentosBDespues = (await consulta('select count(*)::int as n from intentos where usuario_id = $1', [invitadoB.id]))[0].n
    verificar(JSON.stringify(antesB) === JSON.stringify(despuesB) && intentosBAntes === intentosBDespues, 'los datos de B cambiaron')
    return 'sobre B: PATCH 0 filas, DELETE 0 filas · es_invitado/codigo/id: 403 · alias de invitado: 400 (ck_perfiles_invitado) · insertar a nombre de B, crear y borrar perfil: 403 · escribir un intento propio a mano: 403 · leccion inexistente: rechazada · B intacto'
  }
)

await caso(
  23,
  'Reglas del alias y codigo que distingue nombres iguales',
  'Se rechazan alias reservados, cortos, con tilde o con guion al borde; dos personas pueden llamarse igual con codigos distintos',
  async () => {
    const rechazados = []
    for (const [alias, motivo] of [
      ['admin', 'reservado'], ['Sintaxia', 'reservado'], ['ab', 'corto'], ['Invitado', 'solo invitados'],
      ['Martín', 'tilde'], ['_ana', 'guion al inicio'], ['ana_', 'guion al final'], ['a'.repeat(21), 'largo'], ['con espacio', 'espacio']
    ]) {
      const r = await api.datos(cuentaC.token, 'PATCH', `perfiles?id=eq.${cuentaC.id}`, { alias })
      verificar(r.estado === 400 && String(r.datos?.message).includes('ck_perfiles_alias'), `"${alias}" (${motivo}) respondio ${r.estado}`)
      rechazados.push(alias === 'a'.repeat(21) ? 'a*21' : alias)
    }
    const valido = await api.datos(cuentaC.token, 'PATCH', `perfiles?id=eq.${cuentaC.id}&select=alias,codigo`, { alias: 'Ana_Dev' }, 'return=representation')
    verificar(valido.estado === 200 && valido.datos[0].alias === 'Ana_Dev', 'no acepto un alias valido')
    const primerCodigo = valido.datos[0].codigo

    // Cambiar solo mayusculas no cambia la identidad: conserva el codigo.
    const mayus = await api.datos(cuentaC.token, 'PATCH', `perfiles?id=eq.${cuentaC.id}&select=alias,codigo`, { alias: 'ANA_DEV' }, 'return=representation')
    verificar(mayus.datos[0].codigo === primerCodigo, 'cambiar mayusculas cambio el codigo')

    // Tres personas con el mismo alias (una con otra capitalizacion).
    const gemelas = []
    for (const alias of ['Gemela', 'Gemela', 'gemela']) {
      const c = await api.cuentaConfirmada({ correo: correoNuevo('gemela'), alias })
      gemelas.push(c.id)
    }
    const filas = await consulta('select codigo from perfiles where id = any($1) and alias_normalizado = $2', [gemelas, 'gemela'])
    const codigos = new Set(filas.map((f) => f.codigo))
    verificar(filas.length === 3 && codigos.size === 3, `3 personas "Gemela", codigos distintos: ${codigos.size}`)
    return `rechazados (${rechazados.length}): ${rechazados.join(', ')} · "Ana_Dev" valido · 3 personas "Gemela" con codigos ${[...codigos].map((c) => String(c).padStart(4, '0')).join(', ')}`
  }
)

await caso(
  24,
  'Rol publico, invitado autenticado y cuenta: quien puede que',
  'Los tres leen el contenido; solo invitado y cuenta tienen perfil e historial; la base distingue invitado de cuenta',
  async () => {
    const quienes = { publico: null, invitado: invitadoA.token, cuenta: cuentaC.token }
    const filas = []
    for (const [nombre, token] of Object.entries(quienes)) {
      const cursos = await api.datos(token, 'GET', 'cursos?select=id')
      const perfil = await api.datos(token, 'GET', 'perfiles?select=id')
      const rpc = await api.datos(token, 'POST', 'rpc/comprobar_respuesta', { p_pregunta_id: 'js-u1-l1-a1', p_opcion_id: 'js-u1-l1-a1-a' })
      const esInv = await api.datos(token, 'POST', 'rpc/es_invitado', {})
      filas.push({ nombre, cursos: cursos.datos.length, perfil: perfil.estado === 200 ? perfil.datos.length : `HTTP ${perfil.estado}`, comprobar: rpc.estado, esInvitado: esInv.datos })
    }
    const [pub, inv, cta] = filas
    verificar(filas.every((f) => f.cursos === 6 && f.comprobar === 200), 'alguien no pudo leer el contenido o comprobar')
    verificar(pub.perfil === 'HTTP 401' && inv.perfil === 1 && cta.perfil === 1, 'permisos de perfil distintos de lo esperado')
    verificar(pub.esInvitado === false && inv.esInvitado === true && cta.esInvitado === false, 'es_invitado() no distingue')

    const claimInvitado = decodificar(invitadoA.token)
    const claimCuenta = decodificar(cuentaC.token)
    verificar(claimInvitado.role === 'authenticated' && claimInvitado.is_anonymous === true, 'claims del invitado')
    verificar(claimCuenta.role === 'authenticated' && claimCuenta.is_anonymous === false, 'claims de la cuenta')
    return `publico: ${pub.cursos} cursos, perfil ${pub.perfil} · invitado (rol ${claimInvitado.role}, is_anonymous=${claimInvitado.is_anonymous}): perfil ${inv.perfil}, es_invitado()=${inv.esInvitado} · cuenta (is_anonymous=${claimCuenta.is_anonymous}): perfil ${cta.perfil}, es_invitado()=${cta.esInvitado}`
  }
)

await caso(
  25,
  'Tope de intentos para invitados',
  'Un invitado puede tener hasta 200 intentos y el 201 se rechaza; una cuenta permanente no tiene ese tope',
  async () => {
    const invitado = await api.altaAnonima()
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('tope'), alias: 'SinTope' })

    // 200 intentos viejos cargados directamente (como superusuario) para no hacer 200 peticiones.
    const resultados = []
    for (const [nombre, persona] of [['invitado', invitado], ['cuenta', cuenta]]) {
      await consulta(
        `insert into intentos (usuario_id, leccion_id, numero, estado, total_actividades, finalizado_en)
         select $1, 'js-u1-l1', n, 'abandonado', 4, now() from generate_series(1, 200) n`,
        [persona.id]
      )
      const siguiente = await api.rpc(persona.token, 'iniciar_intento', { p_intento_id: crypto.randomUUID(), p_leccion_id: 'js-u1-l1' })
      resultados.push({ nombre, estado: siguiente.estado, hint: siguiente.datos?.hint ?? null })
    }
    const [i, c] = resultados
    verificar(i.estado === 400 && i.hint === 'tope_invitado', `invitado: ${i.estado} ${i.hint}`)
    verificar(c.estado === 200, `cuenta: ${c.estado}`)

    const [{ n: delInvitado }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [invitado.id])
    verificar(delInvitado === 200, `el invitado termino con ${delInvitado} intentos`)
    return `invitado: con 200 intentos el 201 se rechaza (HTTP ${i.estado}, ${i.hint}) · cuenta: el 201 se crea (HTTP ${c.estado})`
  }
)

await caso(
  26,
  'Limpieza de invitados abandonados',
  'Solo service_role puede ejecutarla; borra al invitado inactivo (con su perfil e historial) y no toca cuentas ni invitados con actividad',
  async () => {
    const inactivo = await api.altaAnonima()
    const reciente = await api.altaAnonima()
    const conActividad = await api.altaAnonima()
    const cuentaVieja = await api.cuentaConfirmada({ correo: correoNuevo('vieja'), alias: 'Antigua' })
    await resolverPorApi(api, bd, inactivo.token, 'js-u1-l1', { aciertos: 1 })
    await resolverPorApi(api, bd, conActividad.token, 'js-u1-l1', { aciertos: 1 })

    // Se envejecen: el inactivo y la cuenta vieja no tuvieron nada en 60 dias; el "con actividad"
    // se creo hace 60 dias pero tiene un intento de hoy.
    const viejos = [inactivo.id, conActividad.id, cuentaVieja.id]
    await consulta("update auth.users set created_at = now() - interval '60 days' where id = any($1)", [viejos])
    await consulta("update auth.sessions set created_at = now() - interval '60 days', updated_at = now() - interval '60 days' where user_id = any($1)", [viejos])
    await consulta(
      "update intentos set iniciado_en = now() - interval '60 days', finalizado_en = now() - interval '60 days', actualizado_en = now() - interval '60 days' where usuario_id = $1",
      [inactivo.id]
    )
    // El disparador de actualizacion pisa actualizado_en con now(): se corrige sin disparadores.
    await consulta('alter table intentos disable trigger tg_intentos_actualizacion')
    try {
      await consulta("update intentos set actualizado_en = now() - interval '60 days' where usuario_id = $1", [inactivo.id])
    } finally {
      await consulta('alter table intentos enable trigger tg_intentos_actualizacion')
    }

    const comoInvitado = await api.datos(invitadoA.token, 'POST', 'rpc/limpiar_invitados_inactivos', { p_dias: 30 })
    const comoPublico = await api.datos(null, 'POST', 'rpc/limpiar_invitados_inactivos', { p_dias: 30 })
    const comoCuenta = await api.datos(cuentaC.token, 'POST', 'rpc/limpiar_invitados_inactivos', { p_dias: 30 })
    verificar([comoInvitado, comoPublico, comoCuenta].every((r) => r.estado === 401 || r.estado === 403), `sin permiso: ${[comoInvitado, comoPublico, comoCuenta].map((r) => r.estado)}`)

    const comoServicio = await api.datos(claves.claveDeServicio, 'POST', 'rpc/limpiar_invitados_inactivos', { p_dias: 30 })
    verificar(comoServicio.estado === 200 && comoServicio.datos >= 1, `service_role: ${comoServicio.estado} ${comoServicio.datos}`)

    const existe = async (id) => (await consulta('select count(*)::int as n from auth.users where id = $1', [id]))[0].n === 1
    verificar(!(await existe(inactivo.id)), 'no borro al invitado inactivo')
    const perfilHuerfano = (await consulta('select count(*)::int as n from perfiles where id = $1', [inactivo.id]))[0].n
    const historialHuerfano = (await consulta('select count(*)::int as n from intentos where usuario_id = $1', [inactivo.id]))[0].n
    verificar(perfilHuerfano === 0 && historialHuerfano === 0, 'quedaron perfil o historial del borrado')
    verificar(await existe(reciente.id), 'borro a un invitado reciente')
    verificar(await existe(conActividad.id), 'borro a un invitado con actividad reciente')
    verificar(await existe(cuentaVieja.id), 'borro una cuenta permanente')
    return `invitado/publico/cuenta: HTTP ${comoInvitado.estado}/${comoPublico.estado}/${comoCuenta.estado} · service_role borro ${comoServicio.datos} · inactivo borrado con su perfil e historial · reciente, con actividad y cuenta vieja intactos`
  }
)

await caso(
  34,
  'Volver a correr los scripts no deshace permisos ni datos',
  'Re-ejecutar 02 y 05 a 10 deja igual el contenido, los perfiles, el historial y lo que cada persona puede hacer',
  async () => {
    const contar = async () =>
      (
        await consulta(
          `select (select count(*) from opciones)::int as opciones,
                  (select count(*) from perfiles)::int as perfiles,
                  (select count(*) from intentos)::int as intentos,
                  (select count(*) from respuestas)::int as respuestas`
        )
      )[0]
    const antes = await contar()
    const antesA = await api.datos(invitadoA.token, 'GET', 'perfiles?select=id')
    verificar(antesA.estado === 200 && antesA.datos.length === 1, 'el invitado no veia su perfil antes de empezar')

    const ejecutados = []
    for (const archivo of [
      '02-datos-iniciales',
      '05-perfiles-y-progreso',
      '06-politicas-rls-etapa4',
      '07-limpieza-invitados',
      '08-intentos-y-respuestas',
      '09-funciones-intentos',
      '10-politicas-rls-etapa5'
    ]) {
      await bd.query(readFileSync(new URL(`../supabase/${archivo}.sql`, import.meta.url), 'utf8'))
      ejecutados.push(archivo.slice(0, 2))
    }

    const despues = await contar()
    verificar(JSON.stringify(antes) === JSON.stringify(despues), `datos: ${JSON.stringify(antes)} -> ${JSON.stringify(despues)}`)

    const despuesA = await api.datos(invitadoA.token, 'GET', 'perfiles?select=id')
    const intentosA = await api.datos(invitadoA.token, 'GET', 'intentos?select=id')
    const sinSesion = await api.datos(null, 'GET', 'perfiles?select=id')
    const protegido = await api.datos(invitadoA.token, 'PATCH', `perfiles?id=eq.${invitadoA.id}`, { es_invitado: false })
    verificar(despuesA.estado === 200 && despuesA.datos.length === 1, `tras re-ejecutar, el invitado ve: ${despuesA.estado}`)
    verificar(intentosA.estado === 200, `historial: ${intentosA.estado}`)
    verificar(sinSesion.estado === 401, `sin sesion: ${sinSesion.estado}`)
    verificar(protegido.estado === 403, `campo protegido: ${protegido.estado}`)
    return `scripts ${ejecutados.join(', ')} re-ejecutados · datos iguales (${despues.perfiles} perfiles, ${despues.intentos} intentos) · el invitado sigue viendo su perfil, sin sesion sigue 401, es_invitado sigue protegido (403)`
  }
)

await caso(
  35,
  'El enlace de confirmacion abierto en otro dispositivo',
  'El correo queda confirmado pero no se abre sesion alli; la pantalla lo explica y con la contrasena se ingresa',
  async () => {
    const correo = correoNuevo('otrodisp2')
    const ctx1 = await contexto()
    const p1 = await pagina(ctx1)
    await p1.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p1.getByLabel('Alias', { exact: true }).fill('Dispositiva')
    await p1.getByLabel('Correo', { exact: true }).fill(correo)
    await p1.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p1.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p1.getByRole('heading', { name: 'Revisa tu correo' }).waitFor({ timeout: 10000 })
    const mail = await esperarCorreo(correo)
    await ctx1.close()

    const otro = await contexto()
    const p2 = await pagina(otro)
    await p2.goto(enlaceDeVerificacion(mail))
    await p2.getByRole('heading', { name: 'Tu correo esta confirmado' }).waitFor({ timeout: 10000 })
    verificar((await leerSesion(p2)) === null, 'se abrio una sesion en el otro dispositivo')
    const [u] = await consulta('select email_confirmed_at from auth.users where email = $1', [correo])
    verificar(u.email_confirmed_at !== null, 'el correo no quedo confirmado')

    await p2.getByRole('link', { name: 'Ingresar' }).click()
    await p2.getByLabel('Correo', { exact: true }).fill(correo)
    await p2.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p2.getByRole('button', { name: 'Entrar', exact: true }).click()
    await p2.waitForURL('**/perfil', { timeout: 15000 })
    await dormir(500)
    const etiqueta = await etiquetaDePerfil(p2)
    verificar(/^Dispositiva#\d{4}$/.test(etiqueta), `etiqueta: ${etiqueta}`)
    await otro.close()
    return `otro dispositivo: "Tu correo esta confirmado", sin sesion · correo confirmado en la base · luego ingresa con la contrasena como ${etiqueta}`
  }
)

// ===========================================================================
//  G. CONFIRMACION DE CORREO DESACTIVADA (Supabase permite configurarlo asi)
// ===========================================================================
await reiniciarAuth({ confirmarCorreo: false })

await caso(
  6,
  'Registro con la confirmacion de correo desactivada',
  'La sesion se abre al instante, sin esperar ningun correo, y el perfil tiene el alias elegido',
  async () => {
    const correo = correoNuevo('directo')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Inmediata')
    await p.getByLabel('Correo', { exact: true }).fill(correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.waitForURL('**/perfil?cuenta=creada', { timeout: 15000 })
    await p.getByText(/Tu cuenta esta lista/).waitFor({ timeout: 5000 })
    await dormir(500)
    const etiqueta = await etiquetaDePerfil(p)
    verificar(/^Inmediata#\d{4}$/.test(etiqueta), `etiqueta: ${etiqueta}`)
    const enviados = await correosPara(correo)
    verificar(enviados.length === 0, `se mando ${enviados.length} correo con la confirmacion apagada`)
    await ctx.close()
    return `sin esperar correo: /perfil?cuenta=creada, ${etiqueta} · correos enviados: ${enviados.length}`
  }
)

await caso(
  8,
  'Correo ya utilizado con la confirmacion desactivada',
  'El servidor responde con un error explicito (user_already_exists) y la app lo muestra; no se duplica la cuenta',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('repetido2'), alias: 'Primera' })
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Segunda')
    await p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('otra-clave-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByText(/ya tiene una cuenta/).first().waitFor({ timeout: 10000 })
    const [{ n }] = await consulta('select count(*)::int as n from auth.users where email = $1', [cuenta.correo])
    verificar(n === 1, `cuentas con ese correo: ${n}`)
    await ctx.close()
    return `mensaje "ya tiene una cuenta" · cuentas con ese correo: ${n}`
  }
)

await caso(
  15,
  'Convertir un invitado con la confirmacion desactivada',
  'La conversion es inmediata: mismo usuario, historial intacto, y ya es cuenta sin esperar ningun correo',
  async () => {
    const correo = correoNuevo('inmediata')
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    await resolverLeccion(p)
    await dormir(800)
    const idAntes = (await leerSesion(p)).user.id

    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Instantanea')
    await p.getByLabel('Correo', { exact: true }).fill(correo)
    await p.getByLabel('Contrasena', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.waitForURL('**/perfil?cuenta=creada', { timeout: 15000 })
    await dormir(800)

    const [u] = await consulta('select is_anonymous, email from auth.users where id = $1', [idAntes])
    const [perfil] = await consulta('select es_invitado, alias from perfiles where id = $1', [idAntes])
    const [{ n: intentos }] = await consulta('select count(*)::int as n from intentos where usuario_id = $1', [idAntes])
    verificar(u.is_anonymous === false && u.email === correo, `usuario: ${JSON.stringify(u)}`)
    verificar(perfil.es_invitado === false && perfil.alias === 'Instantanea', `perfil: ${JSON.stringify(perfil)}`)
    verificar(intentos === 1, `historial: ${intentos}`)
    verificar((await leerSesion(p)).user.id === idAntes, 'cambio el id de la sesion')
    const etiqueta = await etiquetaDePerfil(p)
    await ctx.close()
    return `mismo id · ya es cuenta al instante (${etiqueta}) · historial: ${intentos} intento`
  }
)

await reiniciarAuth({ confirmarCorreo: true })

// ===========================================================================
//  H. LIMITE DE ALTAS ANONIMAS
// ===========================================================================
await caso(
  27,
  'Limite de altas anonimas',
  'Pasado el limite por conexion, Auth responde 429 y la app lo explica; el limite se levanta y vuelve a andar',
  async () => {
    await reiniciarAuth({ limiteAnonimos: 3 })
    const estados = []
    for (let i = 0; i < 8; i++) estados.push((await api.altaAnonima()).estado)
    const exitosas = estados.filter((e) => e === 200).length
    const limitadas = estados.filter((e) => e === 429).length
    verificar(exitosas >= 1 && limitadas >= 1, `respuestas: ${estados.join(',')}`)

    // La app, ya limitada.
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.getByRole('button', { name: /Continuar como invitado/ }).click()
    await p.getByText(/demasiados intentos/).waitFor({ timeout: 10000 })
    verificar((await leerSesion(p)) === null, 'se creo una sesion pese al limite')
    verificar(new URL(p.url()).pathname === '/ingresar', 'salio de /ingresar')
    const catalogoSigue = await api.datos(null, 'GET', 'cursos?select=id')
    verificar(catalogoSigue.datos.length === 6, 'el catalogo dejo de verse')

    // Se levanta el limite.
    await reiniciarAuth({ limiteAnonimos: 1000 })
    await p.getByRole('button', { name: /Continuar como invitado/ }).click()
    await p.waitForURL('**/perfil', { timeout: 15000 })
    await ctx.close()
    return `${exitosas} altas ok y ${limitadas} con HTTP 429 (${estados.join(',')}) · la app dice "demasiados intentos" y no crea sesion · el catalogo sigue visible · sin el limite, vuelve a funcionar`
  }
)

// ===========================================================================
//  I. RESILIENCIA
// ===========================================================================
await caso(
  28,
  'Ingresar sin conexion y reintentar',
  'Avisa que no hay conexion (sin crear nada) y, al volver la red, el mismo boton funciona',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
    await p.route('**/auth/v1/**', (ruta) => ruta.abort())
    await p.getByRole('button', { name: /Continuar como invitado/ }).click()
    await p.getByText(/No hay conexion con el servidor/).waitFor({ timeout: 10000 })
    verificar((await leerSesion(p)) === null, 'creo sesion sin conexion')

    await p.unroute('**/auth/v1/**')
    await p.getByRole('button', { name: /Continuar como invitado/ }).click()
    await p.waitForURL('**/perfil', { timeout: 15000 })
    await ctx.close()
    return 'sin red: "No hay conexion con el servidor" y sin sesion · con red: el mismo boton entra'
  }
)

await caso(
  29,
  'Falla el guardado de una respuesta',
  'La respuesta no se da por incorrecta ni por guardada: queda "pendiente" y, al volver la conexion, se guarda una sola vez',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await entrarComoInvitado(p)
    const id = (await leerSesion(p)).user.id
    const [primera] = await consulta(
      `select o.texto from preguntas q join opciones o on o.pregunta_id = q.id
        where q.leccion_id = 'js-u1-l1' and o.es_correcta order by q.orden limit 1`
    )

    await p.goto(`${URL_APP}/lecciones/js-u1-l1/actividades`, { waitUntil: 'networkidle' })
    await p.waitForSelector('.opcion')
    await p.route('**/rest/v1/rpc/responder_actividad', (ruta) => ruta.abort())
    await p.getByRole('button', { name: primera.texto, exact: true }).first().click()
    await p.getByRole('button', { name: /Comprobar/ }).click()
    await p.locator('[data-prueba="estado-guardado"][data-estado="pendiente"]').waitFor({ timeout: 8000 })
    const aviso = await texto(p)
    verificar(/todavia NO se guardo/.test(aviso), 'no avisa que la respuesta no se guardo')
    verificar((await p.locator('.feedback').count()) === 0, 'mostro la correccion sin confirmacion del servidor')
    const [{ n: antes }] = await consulta('select count(*)::int as n from respuestas r join intentos i on i.id = r.intento_id where i.usuario_id = $1', [id])
    verificar(antes === 0, `se guardo pese a la falla: ${antes}`)

    await p.unroute('**/rest/v1/rpc/responder_actividad')
    await p.getByRole('button', { name: 'Reintentar' }).click()
    await p.locator('[data-prueba="estado-guardado"][data-estado="guardado"]').waitFor({ timeout: 8000 })
    const [{ n: despues }] = await consulta('select count(*)::int as n from respuestas r join intentos i on i.id = r.intento_id where i.usuario_id = $1', [id])
    verificar(despues === 1, `tras reintentar: ${despues}`)
    await ctx.close()
    return `con la falla: "pendiente", sin correccion, respuestas guardadas ${antes} · tras reintentar: "guardada", respuestas ${despues}`
  }
)

// ===========================================================================
//  J. CALCULOS, PANTALLAS Y COMPATIBILIDAD
// ===========================================================================
await caso(
  30,
  'Calculo de XP, racha y calendario desde el historial',
  'Repetir una leccion no suma XP de mas, un intento peor no resta, y la racha cuenta dias seguidos',
  async () => {
    const hoy = new Date(2026, 9, 12, 12, 0, 0)
    const dia = (atras) => new Date(2026, 9, 12 - atras, 12, 0, 0).toISOString()
    const xp = { a: 10, b: 20 }
    const t = (leccionId, aciertos, atras = 0) => ({ leccionId, aciertos, total: 4, creadoEn: dia(atras) })

    const repetido = calcularEstadisticas([t('a', 4), t('a', 4), t('a', 4)], xp, hoy)
    verificar(repetido.xp === 10, `repetir 3 veces dio ${repetido.xp} XP`)

    const mejora = calcularEstadisticas([t('a', 2, 1), t('a', 4, 0)], xp, hoy)
    verificar(mejora.xp === 10 && mejora.xpDeHoy === 5, `mejora: ${mejora.xp} total, ${mejora.xpDeHoy} hoy`)

    const peor = calcularEstadisticas([t('a', 4, 1), t('a', 1, 0)], xp, hoy)
    verificar(peor.xp === 10 && peor.lecciones.a.aciertos === 4, `intento peor: ${peor.xp} XP, mejor ${peor.lecciones.a.aciertos}`)

    const racha3 = calcularEstadisticas([t('a', 4, 2), t('b', 4, 1), t('a', 4, 0)], xp, hoy)
    verificar(racha3.racha === 3, `racha: ${racha3.racha}`)

    const rota = calcularEstadisticas([t('a', 4, 3), t('b', 4, 0)], xp, hoy)
    verificar(rota.racha === 1 && rota.rachaMaxima === 1, `racha rota: ${rota.racha}/${rota.rachaMaxima}`)

    const viva = calcularEstadisticas([t('a', 4, 1)], xp, hoy)
    verificar(viva.racha === 1, `solo ayer: ${viva.racha}`)

    const muerta = calcularEstadisticas([t('a', 4, 3)], xp, hoy)
    verificar(muerta.racha === 0, `hace 3 dias: ${muerta.racha}`)

    const vacio = calcularEstadisticas([], xp, hoy)
    verificar(vacio.xp === 0 && vacio.racha === 0 && vacio.actividad.length === 0, 'historial vacio')
    return 'repetir x3: 10 XP · mejorar 2/4 -> 4/4: +5 · intento peor: no resta · racha 3 dias / rota=1 / solo ayer=1 / hace 3 dias=0 / vacio=0'
  }
)

await caso(
  31,
  'Pantallas de acceso en el celular',
  'Ninguna desborda a lo ancho a 412, 360 ni 320 px, ni siquiera con el alias y el codigo mas anchos posibles',
  async () => {
    const mediciones = []
    const medir = async (p, ruta, ancho) => {
      await dormir(400)
      const [scroll, ventana] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
      verificar(scroll <= ventana, `${ruta} a ${ancho}px mide ${scroll}: ${await quienDesborda(p)}`)
      mediciones.push(`${ruta}@${ancho}`)
    }

    // 1) Pantallas de acceso, a tres anchos.
    for (const ancho of [412, 360, 320]) {
      const ctx = await contexto({ viewport: { width: ancho, height: 800 } })
      const p = await pagina(ctx)
      for (const ruta of ['/ingresar', '/registro', '/recuperar', '/auth/nueva-clave', '/auth/callback', '/ranking']) {
        await p.goto(`${URL_APP}${ruta}`, { waitUntil: 'networkidle' })
        await medir(p, ruta, ancho)
      }
      await entrarComoInvitado(p, '/perfil')
      await medir(p, '/perfil(invitado)', ancho)
      await ctx.close()
    }

    // 2) Peor caso del perfil: alias de 20 letras anchas y el codigo mas ancho.
    // Residuos de corridas anteriores con el mismo alias: se borran para poder fijar el codigo.
    await consulta(
      "delete from auth.users where id in (select id from perfiles where alias_normalizado = $1)",
      ['w'.repeat(20)]
    )
    const ancha = await api.cuentaConfirmada({ correo: correoNuevo('ancha'), alias: 'W'.repeat(20) })
    // El codigo no se puede cambiar desde la app (el disparador lo conserva): para armar el
    // peor caso se desactiva ese disparador un instante, como administrador. El finally lo
    // reactiva pase lo que pase: dejarlo apagado rompe el alta de todos los perfiles.
    await consulta('alter table perfiles disable trigger tg_perfiles_codigo')
    try {
      await consulta('update perfiles set codigo = 8888 where id = $1', [ancha.id])
    } finally {
      await consulta('alter table perfiles enable trigger tg_perfiles_codigo')
    }
    for (const ancho of [360, 320]) {
      const ctx = await contexto({ viewport: { width: ancho, height: 800 } })
      const p = await pagina(ctx)
      await p.goto(`${URL_APP}/ingresar`, { waitUntil: 'networkidle' })
      await p.getByLabel('Correo', { exact: true }).fill(ancha.correo)
      await p.getByLabel('Contrasena', { exact: true }).fill(ancha.clave)
      await p.getByRole('button', { name: 'Entrar', exact: true }).click()
      await p.waitForURL('**/perfil', { timeout: 15000 })
      await p.waitForFunction(() => /WWWW#8888/.test(document.body.innerText), null, { timeout: 8000 })
      await medir(p, '/perfil(WWWWWWWWWWWWWWWWWWWW#8888)', ancho)
      await ctx.close()
    }
    return `${mediciones.length} mediciones sin desborde, incluido /perfil con "${'W'.repeat(20)}#8888" a 360 y 320 px`
  }
)

await caso(
  32,
  'La etapa 3 sigue andando sin sesion',
  'Sin ingresar se ve el catalogo de cursos y las unidades del curso; la correccion de respuestas sigue disponible',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/cursos`, { waitUntil: 'networkidle' })
    const cursos = await p.locator('article.curso h3').count()
    await p.goto(`${URL_APP}/cursos/javascript`, { waitUntil: 'networkidle' })
    await dormir(500)
    const unidades = await p.locator('.camino__lista > li').count()
    const rpc = await api.datos(null, 'POST', 'rpc/comprobar_respuesta', { p_pregunta_id: 'js-u1-l1-a1', p_opcion_id: 'js-u1-l1-a1-b' })
    verificar(cursos === 6 && unidades === 6, `cursos ${cursos}, unidades ${unidades}`)
    verificar(rpc.estado === 200 && rpc.datos.correcta === false, `rpc: ${rpc.estado}`)
    await ctx.close()
    return `${cursos} cursos y ${unidades} unidades visibles sin sesion · comprobar_respuesta responde ${rpc.estado}`
  }
)

await caso(
  33,
  'Se informa que datos se guardan y cuales son publicos',
  'Al crear la cuenta se puede leer que se guarda (correo cifrado, alias, historial) y que hoy no se muestra nada a otras personas',
  async () => {
    const ctx = await contexto()
    const p = await pagina(ctx)
    await p.goto(`${URL_APP}/registro`, { waitUntil: 'networkidle' })
    await p.getByText('Que datos guardamos y cuales se ven').click()
    const cuerpo = await texto(p)
    for (const frase of [
      'la contrasena queda cifrada',
      'Hoy, nada.',
      'Los invitados no aparecen',
      'perdes el acceso a tu historial de invitado'
    ]) {
      verificar(cuerpo.includes(frase), `falta la frase: "${frase}"`)
    }
    await ctx.close()
    return 'visible junto al formulario: que se guarda, que es publico ("Hoy, nada."), y el riesgo de ser invitado'
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
