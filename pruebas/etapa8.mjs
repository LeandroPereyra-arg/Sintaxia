/**
 * Pruebas de la etapa 8: lo que cambia cuando la app corre como APK.
 *
 *   Antes:   npm run supabase:local && npm run pruebas:entorno   (en otra terminal)
 *            npm run android:debug                                (para los casos 7 y 8)
 *   Despues: npm run pruebas:etapa8        (SOLO=2,3 corre solo esos casos)
 *
 * Como se prueba sin un celular:
 *   · La app se sirve con Vite en modo "android" (el mismo .env.android del APK), asi
 *     los correos piden volver a sintaxia://auth/...
 *   · En Chromium se simula el puente nativo de Android que usa Capacitor
 *     (window.androidBridge + las funciones nativas del plugin App). Con eso
 *     @capacitor/core cree que esta en Android y src/servicios/nativo.js registra el
 *     boton Atras y los enlaces. La prueba dispara esos eventos como lo haria Android.
 *   · Auth es el servidor real (GoTrue): los correos, los enlaces y los codigos PKCE
 *     son de verdad. Solo se reemplaza "Android abre la app con este enlace".
 *   · Los casos 7 y 8 revisan el APK ya compilado y la custodia de la clave de firma.
 *
 * Lo que esto NO reemplaza: instalar el APK en celulares fisicos
 * (docs/21-registro-de-pruebas-etapa8.md).
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  leerClaves,
  crearApi,
  esperarCorreo,
  enlaceDeVerificacion,
  correoNuevo,
  dormir
} from './local/ayudas.mjs'
import { rutaDesdeEnlace } from '../src/servicios/nativo.js'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUERTO = Number(process.env.PUERTO_APK ?? 5176)
const URL_APK = `http://localhost:${PUERTO}`
const ANDROID_HOME = process.env.ANDROID_HOME ?? join(process.env.HOME ?? '', 'Android', 'Sdk')

const claves = await leerClaves()
const api = crearApi(claves)

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

// ---------------------------------------------------------------------------
// La app en modo "android", servida por Vite en otro puerto
// ---------------------------------------------------------------------------
const vite = spawn('npx', ['vite', '--mode', 'android', '--port', String(PUERTO), '--strictPort'], {
  cwd: raiz,
  env: { ...process.env, VITE_SUPABASE_URL: claves.url, VITE_SUPABASE_PUBLISHABLE_KEY: claves.clavePublicable },
  stdio: 'ignore'
})
for (let i = 0; ; i++) {
  try {
    if ((await fetch(URL_APK)).ok) break
  } catch {
    /* todavia no escucha */
  }
  if (i > 60) throw new Error('Vite en modo android no arranco')
  await dormir(500)
}

const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})

/**
 * Simula lo que Android le da a la pagina: el puente (androidBridge) y el plugin App
 * (addListener, getLaunchUrl, minimizeApp). `lanzamiento` es la direccion con la que
 * Android abrio la app (un enlace de correo), o null.
 */
function puenteAndroid(lanzamiento) {
  window.__nativo = { oyentes: {}, minimizada: 0, cargas: (window.__nativo?.cargas ?? 0) + 1 }
  window.androidBridge = { postMessage() {} }
  window.Capacitor = {
    PluginHeaders: [
      {
        name: 'App',
        methods: [
          { name: 'addListener', rtype: 'callback' },
          { name: 'removeListener', rtype: 'promise' },
          { name: 'getLaunchUrl', rtype: 'promise' },
          { name: 'minimizeApp', rtype: 'promise' },
          { name: 'exitApp', rtype: 'promise' }
        ]
      }
    ],
    nativeCallback(plugin, metodo, opciones, retorno) {
      if (metodo === 'addListener') window.__nativo.oyentes[opciones.eventName] = retorno
      return String(Math.random())
    },
    nativePromise(plugin, metodo) {
      if (metodo === 'getLaunchUrl') return Promise.resolve(lanzamiento ? { url: lanzamiento } : {})
      if (metodo === 'minimizeApp') window.__nativo.minimizada++
      return Promise.resolve({})
    }
  }
  // Cuenta cuantas veces se cargo la pagina en esta pestana (para detectar recargas en bucle).
  const cargas = Number(sessionStorage.getItem('prueba:cargas') ?? 0) + 1
  sessionStorage.setItem('prueba:cargas', String(cargas))
}

async function apk({ lanzamiento = null, bienvenidaVista = true } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })
  if (bienvenidaVista) await ctx.addInitScript(() => localStorage.setItem('sintaxia:bienvenida-vista', '1'))
  await ctx.addInitScript(puenteAndroid, lanzamiento)
  const p = await ctx.newPage()
  p.on('pageerror', (e) => excepciones.push(e.message))
  return { ctx, p }
}

/** Dispara un evento de Android (backButton, appUrlOpen) sobre la app. */
async function android(p, evento, datos = {}) {
  await p.waitForFunction((e) => typeof window.__nativo?.oyentes?.[e] === 'function', evento, { timeout: 10000 })
  await p.evaluate(([e, d]) => window.__nativo.oyentes[e](d), [evento, datos])
}

const ruta = (p) => new URL(p.url()).pathname
async function esperarRuta(p, esperada) {
  await p.waitForFunction((r) => location.pathname === r, esperada, { timeout: 10000 })
}

/** Sigue el enlace del correo hasta donde Auth manda de vuelta (sin abrirlo en el navegador). */
async function retornoDelCorreo(enlace) {
  const r = await fetch(enlace, { redirect: 'manual' })
  const destino = r.headers.get('location') ?? ''
  verificar(r.status >= 300 && r.status < 400, `el enlace respondio ${r.status} en vez de redirigir`)
  return destino
}

// ===========================================================================
//  Casos
// ===========================================================================

await caso(
  1,
  'En el navegador la integracion nativa no hace nada',
  'Sin el puente de Android, Capacitor dice "web", no se registra ningun oyente y la app anda como siempre',
  async () => {
    const ctx = await navegador.newContext({ viewport: { width: 360, height: 740 } })
    await ctx.addInitScript(() => localStorage.setItem('sintaxia:bienvenida-vista', '1'))
    const p = await ctx.newPage()
    p.on('pageerror', (e) => excepciones.push(e.message))
    await p.goto(`${URL_APK}/cursos`, { waitUntil: 'networkidle' })
    const plataforma = await p.evaluate(() => window.Capacitor?.getPlatform?.())
    const oyentes = await p.evaluate(() => Boolean(window.__nativo))
    const titulo = await p.locator('h1').first().innerText()
    await ctx.close()
    verificar(plataforma === 'web' && !oyentes, `plataforma ${plataforma}`)
    return `plataforma: web · sin oyentes nativos · /cursos carga normal ("${titulo.trim()}")`
  }
)

await caso(
  2,
  'Boton Atras de Android',
  'Vuelve a la pantalla anterior; sin historial va al inicio; en el inicio (o en la bienvenida) minimiza la app en lugar de cerrarla',
  async () => {
    const { ctx, p } = await apk()
    await p.goto(`${URL_APK}/`, { waitUntil: 'networkidle' })
    await p.locator('a[href="/cursos"]:visible').first().click()
    await esperarRuta(p, '/cursos')
    await p.locator('a[href^="/ingresar"]:visible').first().click()
    await esperarRuta(p, '/ingresar')

    const pasos = []
    await android(p, 'backButton')
    await esperarRuta(p, '/cursos')
    pasos.push(ruta(p))
    await android(p, 'backButton')
    await esperarRuta(p, '/')
    pasos.push(ruta(p))
    await android(p, 'backButton')
    await dormir(400)
    const minimizada = await p.evaluate(() => window.__nativo.minimizada)
    verificar(ruta(p) === '/' && minimizada === 1, `en el inicio: ruta ${ruta(p)}, minimizada ${minimizada}`)

    // Abierta directo en una pantalla interna (sin historial): Atras lleva al inicio.
    await p.goto(`${URL_APK}/cursos`, { waitUntil: 'networkidle' })
    await android(p, 'backButton')
    await esperarRuta(p, '/')
    await ctx.close()

    // Primera vez: el inicio redirige a la bienvenida; Atras ahi minimiza.
    const otra = await apk({ bienvenidaVista: false })
    await otra.p.goto(`${URL_APK}/`, { waitUntil: 'networkidle' })
    await esperarRuta(otra.p, '/bienvenida')
    await android(otra.p, 'backButton')
    await dormir(400)
    const enBienvenida = await otra.p.evaluate(() => window.__nativo.minimizada)
    verificar(enBienvenida === 1 && ruta(otra.p) === '/bienvenida', `bienvenida: minimizada ${enBienvenida}, ruta ${ruta(otra.p)}`)
    await otra.ctx.close()
    return `/ingresar -> ${pasos.join(' -> ')} -> minimiza · abierta sin historial: Atras -> / · en la bienvenida: minimiza`
  }
)

await caso(
  3,
  'Confirmar la cuenta desde el correo, con la app abierta',
  'El correo pide volver a sintaxia://auth/auth/callback; Android abre la app con ese enlace y la app canjea el codigo (PKCE): la cuenta queda confirmada y con sesion',
  async () => {
    const correo = correoNuevo('apk-registro')
    const { ctx, p } = await apk()
    await p.goto(`${URL_APK}/registro`, { waitUntil: 'networkidle' })
    await p.getByLabel('Alias', { exact: true }).fill('Celu_Uno')
    await p.getByLabel('Correo', { exact: true }).fill(correo)
    await p.getByLabel('Contraseña', { exact: true }).fill('clave-segura-123')
    await p.getByRole('button', { name: /^Crear (mi )?cuenta$/ }).click()
    await p.getByRole('heading', { name: 'Revisa tu correo' }).waitFor({ timeout: 10000 })

    const enlace = enlaceDeVerificacion(await esperarCorreo(correo))
    const pedido = new URL(enlace).searchParams.get('redirect_to')
    verificar(pedido === 'sintaxia://auth/auth/callback', `el correo pide volver a ${pedido}`)
    const destino = await retornoDelCorreo(enlace)
    verificar(/^sintaxia:\/\/auth\/auth\/callback\?code=/.test(destino), `Auth devolvio ${destino}`)

    await android(p, 'appUrlOpen', { url: destino })
    await p.getByRole('heading', { name: /tu cuenta esta confirmada/ }).waitFor({ timeout: 10000 })
    const cargas = await p.evaluate(() => Number(sessionStorage.getItem('prueba:cargas')))
    await ctx.close()
    verificar(cargas === 2, `la app se cargo ${cargas} veces`)
    return `redirect_to = sintaxia://auth/auth/callback · Auth vuelve con ?code=... · la app lo abre y dice "tu cuenta esta confirmada" · una sola recarga`
  }
)

await caso(
  4,
  'Recuperar la contraseña desde el correo, con la app cerrada',
  'El enlace abre la app en "Nueva contraseña" (llega como direccion de inicio), se guarda la nueva, la vieja deja de servir y no hay recargas en bucle',
  async () => {
    const cuenta = await api.cuentaConfirmada({ correo: correoNuevo('apk-olvido'), clave: 'clave-vieja-123', alias: 'Celu_Dos' })
    const primera = await apk()
    await primera.p.goto(`${URL_APK}/recuperar`, { waitUntil: 'networkidle' })
    await primera.p.getByLabel('Correo', { exact: true }).fill(cuenta.correo)
    await primera.p.getByRole('button', { name: 'Mandar el enlace' }).click()
    await primera.p.getByText(/te mandamos un enlace para elegir una/).waitFor({ timeout: 10000 })
    // El verificador PKCE queda guardado en el "celular": se pasa al arranque siguiente.
    const almacen = await primera.p.evaluate(() => JSON.stringify({ ...localStorage }))
    await primera.ctx.close()

    const enlace = enlaceDeVerificacion(await esperarCorreo(cuenta.correo, { cantidad: 2 }))
    verificar(new URL(enlace).searchParams.get('redirect_to') === 'sintaxia://auth/auth/nueva-clave', 'el correo no vuelve a la app')
    const destino = await retornoDelCorreo(enlace)

    // La app estaba cerrada: Android la abre con el enlace como direccion de inicio.
    const { ctx, p } = await apk({ lanzamiento: destino })
    await ctx.addInitScript((datos) => {
      if (!sessionStorage.getItem('prueba:almacen')) {
        for (const [k, v] of Object.entries(JSON.parse(datos))) localStorage.setItem(k, v)
        sessionStorage.setItem('prueba:almacen', '1')
      }
    }, almacen)
    await p.goto(`${URL_APK}/`)
    await p.getByRole('heading', { name: 'Elegi tu contraseña nueva' }).waitFor({ timeout: 15000 })
    await p.getByLabel('Contraseña nueva', { exact: true }).fill('clave-nueva-456')
    await p.getByLabel('Repetila', { exact: true }).fill('clave-nueva-456')
    await p.getByRole('button', { name: 'Guardar contraseña' }).click()
    await p.getByRole('heading', { name: 'Contraseña cambiada' }).waitFor({ timeout: 10000 })
    await dormir(800)
    const cargas = await p.evaluate(() => Number(sessionStorage.getItem('prueba:cargas')))
    await ctx.close()

    const vieja = await api.iniciarSesion(cuenta.correo, 'clave-vieja-123')
    const nueva = await api.iniciarSesion(cuenta.correo, 'clave-nueva-456')
    verificar(vieja.estado === 400 && nueva.estado === 200, `vieja ${vieja.estado}, nueva ${nueva.estado}`)
    verificar(cargas === 2, `la app se cargo ${cargas} veces (bucle de recargas)`)
    return `redirect_to = sintaxia://auth/auth/nueva-clave · la app arranca con el enlace y muestra "Elegi tu contraseña nueva" · contraseña cambiada · vieja 400, nueva 200 · 2 cargas (sin bucle)`
  }
)

await caso(
  5,
  'Enlaces vencidos y enlaces ajenos',
  'Un enlace vencido muestra el motivo; direcciones que no son sintaxia://auth/(auth/callback|auth/nueva-clave) se ignoran',
  async () => {
    const { ctx, p } = await apk()
    await p.goto(`${URL_APK}/cursos`, { waitUntil: 'networkidle' })
    for (const ajeno of ['sintaxia://auth/perfil', 'https://otro.sitio/auth/callback?code=x', 'sintaxia://otro/auth/callback?code=x', 'basura']) {
      await android(p, 'appUrlOpen', { url: ajeno })
    }
    await dormir(600)
    verificar(ruta(p) === '/cursos', `un enlace ajeno movio la app a ${ruta(p)}`)

    await android(p, 'appUrlOpen', { url: 'sintaxia://auth/auth/callback#error=access_denied&error_code=otp_expired' })
    await p.getByText('El enlace vencio o ya se uso. Pedi uno nuevo.').waitFor({ timeout: 10000 })
    await ctx.close()

    const unidad = [
      ['sintaxia://auth/auth/callback?code=abc', '/auth/callback?code=abc'],
      ['sintaxia://auth/auth/nueva-clave?code=x', '/auth/nueva-clave?code=x'],
      ['sintaxia://auth/perfil', null],
      ['https://otro.sitio/auth/callback', null]
    ]
    for (const [entrada, salida] of unidad) verificar(rutaDesdeEnlace(entrada) === salida, `${entrada} -> ${rutaDesdeEnlace(entrada)}`)
    return '4 enlaces ajenos: ignorados (sigue en /cursos) · enlace vencido: "El enlace vencio o ya se uso. Pedi uno nuevo." · rutaDesdeEnlace: 4 de 4'
  }
)

await caso(
  6,
  'Pantalla chica y teclado dentro del "APK"',
  'A 320 px nada desborda; con el teclado (vista mas baja) el boton Entrar se puede alcanzar',
  async () => {
    const { ctx, p } = await apk()
    const desbordes = []
    for (const r of ['/', '/cursos', '/ingresar', '/registro', '/expo']) {
      await p.setViewportSize({ width: 320, height: 640 })
      await p.goto(`${URL_APK}${r}`, { waitUntil: 'networkidle' })
      const ancho = await p.evaluate(() => document.documentElement.scrollWidth)
      if (ancho > 320) desbordes.push(`${r}: ${ancho}px`)
    }
    verificar(desbordes.length === 0, `desbordan: ${desbordes.join(', ')}`)

    // Teclado abierto: Capacitor achica la vista; se simula con una vista de 320 x 300.
    await p.goto(`${URL_APK}/ingresar`, { waitUntil: 'networkidle' })
    await p.setViewportSize({ width: 320, height: 300 })
    await p.getByLabel('Correo', { exact: true }).focus()
    const boton = p.getByRole('button', { name: /^entrar$/i })
    await boton.scrollIntoViewIfNeeded()
    const visible = await boton.isVisible()
    verificar(visible, 'el boton Entrar no se alcanza con el teclado abierto')
    await ctx.close()
    // La perdida de conexion ya se prueba con la misma app en las etapas 4 (caso 28),
    // 5, 6 (caso 9) y 7 (casos 4 y 5).
    return 'sin desborde a 320 px en /, /cursos, /ingresar, /registro y /expo · con la vista a 300 px de alto el boton Entrar se alcanza'
  }
)

await caso(
  7,
  'El APK debug lleva la app adentro y no depende de la computadora',
  'Version = package.json; identificador com.sintaxia.app; trae index.html y los recursos compilados; capacitor.config.json sin server.url; enlace sintaxia://auth declarado; sin direcciones de la red local',
  async () => {
    const apkDebug = join(raiz, 'android/app/build/outputs/apk/debug/app-debug.apk')
    verificar(existsSync(apkDebug), 'no hay APK: correr npm run android:debug')
    const aapt = join(ANDROID_HOME, 'build-tools/35.0.0/aapt2')
    const datos = execFileSync(aapt, ['dump', 'badging', apkDebug], { encoding: 'utf8' })
    const version = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).version
    verificar(datos.includes("name='com.sintaxia.app'") && datos.includes(`versionName='${version}'`), 'identificador o version distintos')
    const manifiesto = execFileSync(aapt, ['dump', 'xmltree', '--file', 'AndroidManifest.xml', apkDebug], { encoding: 'utf8' })
    verificar(/scheme.*"sintaxia"/.test(manifiesto) && /host.*"auth"/.test(manifiesto), 'falta el intent-filter de sintaxia://auth')
    verificar(/allowBackup.*=false/.test(manifiesto), 'allowBackup no esta en false')

    const lista = execFileSync('unzip', ['-l', apkDebug], { encoding: 'utf8' })
    verificar(lista.includes('assets/public/index.html'), 'el APK no trae index.html')
    const config = JSON.parse(execFileSync('unzip', ['-p', apkDebug, 'assets/capacitor.config.json'], { encoding: 'utf8' }))
    verificar(!config.server?.url, `capacitor.config.json apunta a ${config.server?.url}`)
    const js = execFileSync('sh', ['-c', `unzip -p '${apkDebug}' 'assets/public/assets/*.js'`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    // Servidor de desarrollo (517x), pasarela de pruebas (5599) o una IP de la red local.
    // (supabase-js trae "http://localhost:9999" como valor por defecto interno: no se usa.)
    const locales = js.match(/https?:\/\/((localhost|127\.0\.0\.1):(517\d|5599|3000)|(192\.168|10)\.[0-9.]+)/g) ?? []
    verificar(locales.length === 0, `el JS apunta a ${[...new Set(locales)].join(', ')}`)
    verificar(js.includes('sintaxia://auth'), 'el APK no se compilo en modo android (falta sintaxia://auth)')
    const supabase = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0]
    return `com.sintaxia.app ${version} · index.html y recursos adentro · sin server.url · sintaxia://auth declarado · allowBackup=false · sin direcciones locales · Supabase: ${supabase ? 'configurado' : 'SIN CONFIGURAR (falta .env al compilar)'}`
  }
)

await caso(
  8,
  'La clave de firma no esta en el repositorio',
  'Ningun .jks, .keystore ni firma*.properties versionado o sin ignorar; build.gradle sin contraseñas; si hay release firmada, apksigner la verifica con un certificado que no es el de depuracion',
  async () => {
    const versionados = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n')
    const sinIgnorar = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: raiz, encoding: 'utf8' }).split('\n')
    const claveVisible = [...versionados, ...sinIgnorar].filter((f) => /\.(jks|keystore)$|firma.*\.properties$/.test(f))
    verificar(claveVisible.length === 0, `archivos de firma en el repo: ${claveVisible.join(', ')}`)
    const gradle = readFileSync(join(raiz, 'android/app/build.gradle'), 'utf8')
    verificar(!/storePassword\s+["']/.test(gradle) && !/keyPassword\s+["']/.test(gradle), 'build.gradle tiene una contraseña escrita')
    const prueba = execFileSync('git', ['check-ignore', 'x.jks', 'x.keystore', 'firma.properties'], { cwd: raiz, encoding: 'utf8' })
    verificar(prueba.split('\n').filter(Boolean).length === 3, 'el .gitignore no cubre los archivos de firma')

    const release = join(raiz, 'android/app/build/outputs/apk/release/app-release.apk')
    if (!existsSync(release)) return 'sin archivos de firma en el repo · .gitignore los cubre · build.gradle lee la firma de variables de entorno · (no hay release compilada para verificar)'
    const salida = execFileSync(join(ANDROID_HOME, 'build-tools/35.0.0/apksigner'), ['verify', '--print-certs', release], { encoding: 'utf8' })
    const dn = salida.match(/certificate DN: (.*)/)?.[1] ?? ''
    verificar(!/Android Debug/.test(dn), `la release esta firmada con la clave de depuracion (${dn})`)
    return `sin archivos de firma en el repo · .gitignore los cubre · build.gradle lee la firma de variables de entorno · release verificada por apksigner (${dn})`
  }
)

// ===========================================================================
//  Resumen
// ===========================================================================
await navegador.close()
vite.kill('SIGTERM')

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
