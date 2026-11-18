/**
 * Genera el icono y la pantalla de inicio (splash) de la app Android a partir del
 * logo de Sintaxia (el mismo "< >" blanco sobre verde de public/favicon.svg).
 *
 *   node scripts/generar-recursos-android.mjs
 *
 * Escribe en android/app/src/main/res/:
 *   · mipmap-<densidad>/ic_launcher.png y ic_launcher_round.png   icono clasico (48 dp)
 *   · mipmap-<densidad>/ic_launcher_foreground.png                 capa de adelante del
 *                                                                  icono adaptable (108 dp)
 *   · values/ic_launcher_background.xml                            color de fondo del adaptable
 *   · drawable*\/splash.png                                        splash, al mismo tamano que
 *                                                                  el que genero Capacitor
 *
 * Usa el Chromium de Playwright (ya es dependencia de desarrollo) para dibujar el SVG.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const res = join(raiz, 'android', 'app', 'src', 'main', 'res')
if (!existsSync(res)) {
  console.error('No existe android/. Primero: npx cap add android')
  process.exit(1)
}

const VERDE = '#2FBF56'
const FONDO_SPLASH = '#F7F8FA'

// Los dos chevrones del logo, en un lienzo de 64 x 64.
const chevrones = (trazo = 6) => `
  <path d="M24 21 13 32l11 11" fill="none" stroke="#fff" stroke-width="${trazo}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M40 21l11 11-11 11" fill="none" stroke="#fff" stroke-width="${trazo}" stroke-linecap="round" stroke-linejoin="round"/>`

const svg = {
  // Icono clasico: cuadrado redondeado verde con los chevrones.
  cuadrado: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${VERDE}"/>${chevrones()}</svg>`,
  redondo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${VERDE}"/>${chevrones()}</svg>`,
  // Capa de adelante del adaptable: 108 dp, el dibujo dentro de la zona segura (66 dp).
  adelante: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 92 92">${chevrones(5.5)}</svg>`
}

const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }

function tamanoPng(ruta) {
  const b = readFileSync(ruta)
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) }
}

// Igual que las pruebas: CHROMIUM_PATH permite usar un Chromium ya instalado.
const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const pagina = await navegador.newPage()

async function dibujar(html, ancho, alto, destino, transparente = true) {
  await pagina.setViewportSize({ width: ancho, height: alto })
  await pagina.setContent(
    `<html><body style="margin:0;width:${ancho}px;height:${alto}px;overflow:hidden;background:transparent">${html}</body></html>`
  )
  writeFileSync(destino, await pagina.screenshot({ omitBackground: transparente, type: 'png' }))
}

const lleno = (s) => s.replace('<svg ', '<svg style="display:block;width:100%;height:100%" ')

for (const [densidad, f] of Object.entries(DENSIDADES)) {
  const carpeta = join(res, `mipmap-${densidad}`)
  const icono = Math.round(48 * f)
  const capa = Math.round(108 * f)
  await dibujar(lleno(svg.cuadrado), icono, icono, join(carpeta, 'ic_launcher.png'))
  await dibujar(lleno(svg.redondo), icono, icono, join(carpeta, 'ic_launcher_round.png'))
  await dibujar(lleno(svg.adelante), capa, capa, join(carpeta, 'ic_launcher_foreground.png'))
  console.log(`  mipmap-${densidad}: ${icono}px y ${capa}px`)
}

writeFileSync(
  join(res, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${VERDE}</color>\n</resources>\n`
)

for (const carpeta of readdirSync(res).filter((c) => c.startsWith('drawable'))) {
  const ruta = join(res, carpeta, 'splash.png')
  if (!existsSync(ruta)) continue
  const { ancho, alto } = tamanoPng(ruta)
  const lado = Math.round(Math.min(ancho, alto) * 0.28)
  const texto = Math.round(lado * 0.32)
  await dibujar(
    `<div style="width:100%;height:100%;background:${FONDO_SPLASH};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(lado * 0.18)}px;font-family:system-ui,sans-serif">
       <div style="width:${lado}px;height:${lado}px">${lleno(svg.cuadrado)}</div>
       <div style="font-size:${texto}px;font-weight:800;color:#5A26AE;letter-spacing:-0.02em">Sintaxia</div>
     </div>`,
    ancho,
    alto,
    ruta,
    false
  )
  console.log(`  ${carpeta}/splash.png: ${ancho}x${alto}`)
}

await navegador.close()
console.log('Listo: iconos y splash de Android generados.')
