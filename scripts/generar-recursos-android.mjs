/**
 * Genera los iconos de la app a partir de la mascota de Sintaxia (la cotorra
 * con la notebook, public/sintax/normal.webp):
 *
 *   node scripts/generar-recursos-android.mjs
 *
 * Android (android/app/src/main/res/):
 *   · mipmap-<densidad>/ic_launcher.png y ic_launcher_round.png   icono clasico (48 dp)
 *   · mipmap-<densidad>/ic_launcher_foreground.png                 capa de adelante del
 *                                                                  icono adaptable (108 dp)
 *   · values/ic_launcher_background.xml                            color de fondo del adaptable
 *   · drawable*\/splash.png                                        pantalla de inicio, al mismo
 *                                                                  tamano que la que genero Capacitor
 * Web (public/):
 *   · favicon.png (64 px) y apple-touch-icon.png (180 px)
 *
 * Usa el Chromium de Playwright (ya es dependencia de desarrollo) para dibujar.
 * CHROMIUM_PATH permite usar un Chromium ya instalado, igual que las pruebas.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const res = join(raiz, 'android', 'app', 'src', 'main', 'res')

const FONDO = '#E6F8EC' // verde suave de la identidad (--c-verde-suave)
const FONDO_SPLASH = '#F7F8FA'
const VIOLETA = '#5A26AE'

const cotorra = `data:image/webp;base64,${readFileSync(join(raiz, 'public', 'sintax', 'normal.webp')).toString('base64')}`
const imagen = (alto) => `<img src="${cotorra}" style="height:${alto};width:auto;display:block" alt="">`

const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }

function tamanoPng(ruta) {
  const b = readFileSync(ruta)
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) }
}

const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const pagina = await navegador.newPage()

/** Dibuja `html` centrado en un lienzo de ancho x alto y lo guarda como PNG. */
async function dibujar(html, ancho, alto, destino, { fondo = 'transparent', forma = '' } = {}) {
  await pagina.setViewportSize({ width: ancho, height: alto })
  await pagina.setContent(
    `<html><body style="margin:0;background:transparent">
       <div style="width:${ancho}px;height:${alto}px;display:flex;align-items:center;justify-content:center;
                   background:${fondo};overflow:hidden;${forma}">${html}</div>
     </body></html>`
  )
  await pagina.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
  writeFileSync(destino, await pagina.screenshot({ omitBackground: true, type: 'png' }))
}

// --- Android --------------------------------------------------------------------------
if (existsSync(res)) {
  for (const [densidad, f] of Object.entries(DENSIDADES)) {
    const carpeta = join(res, `mipmap-${densidad}`)
    const icono = Math.round(48 * f)
    const capa = Math.round(108 * f)
    await dibujar(imagen('84%'), icono, icono, join(carpeta, 'ic_launcher.png'), { fondo: FONDO, forma: `border-radius:${Math.round(icono * 0.22)}px` })
    await dibujar(imagen('76%'), icono, icono, join(carpeta, 'ic_launcher_round.png'), { fondo: FONDO, forma: 'border-radius:50%' })
    // Capa del icono adaptable: la cotorra dentro de la zona segura (66 de 108 dp).
    await dibujar(imagen('58%'), capa, capa, join(carpeta, 'ic_launcher_foreground.png'))
    console.log(`  mipmap-${densidad}: ${icono}px y ${capa}px`)
  }

  writeFileSync(
    join(res, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${FONDO}</color>\n</resources>\n`
  )

  for (const carpeta of readdirSync(res).filter((c) => c.startsWith('drawable'))) {
    const ruta = join(res, carpeta, 'splash.png')
    if (!existsSync(ruta)) continue
    const { ancho, alto } = tamanoPng(ruta)
    const lado = Math.round(Math.min(ancho, alto) * 0.34)
    await dibujar(
      `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(lado * 0.08)}px;font-family:system-ui,sans-serif">
         ${imagen(`${lado}px`)}
         <div style="font-size:${Math.round(lado * 0.24)}px;font-weight:800;color:${VIOLETA};letter-spacing:-0.02em">Sintaxia</div>
       </div>`,
      ancho,
      alto,
      ruta,
      { fondo: FONDO_SPLASH }
    )
    console.log(`  ${carpeta}/splash.png: ${ancho}x${alto}`)
  }
} else {
  console.log('  (no hay android/: se generan solo los iconos de la web)')
}

// --- Web -------------------------------------------------------------------------------
await dibujar(imagen('96%'), 64, 64, join(raiz, 'public', 'favicon.png'))
await dibujar(imagen('82%'), 180, 180, join(raiz, 'public', 'apple-touch-icon.png'), { fondo: FONDO })
console.log('  public/favicon.png y public/apple-touch-icon.png')

await navegador.close()
console.log('Listo: iconos de Sintaxia generados con la cotorra.')
