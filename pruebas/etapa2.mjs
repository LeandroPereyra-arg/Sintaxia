import { chromium, devices } from 'playwright'
const base = 'http://localhost:5173'
const LECCION = 'js-u1-l1'
const ACT = `${base}/cursos/javascript/lecciones/${LECCION}/actividades`
const resultados = []
const registrar = (n, caso, esperado, obtenido, ok) =>
  resultados.push({ n, caso, esperado, obtenido, estado: ok ? 'PASA' : 'FALLA' })

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()
const errores = []
p.on('pageerror', e => errores.push(e.message))

async function limpio(url = ACT) {
  await p.goto(base + '/', { waitUntil: 'domcontentloaded' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('sintaxia:bienvenida-vista','1') })
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
}
const comprobar = () => p.locator('.leccion__pie button:has-text("Comprobar")')

// --- 1. Confirmar sin seleccionar ---
await limpio()
{
  const off = await comprobar().isDisabled()
  registrar(1, 'Confirmar sin seleccionar una opcion',
    'El boton Comprobar esta deshabilitado y no pasa nada',
    off ? 'Boton deshabilitado; no avanza' : 'El boton estaba habilitado',
    off)
}

// --- 2. Responder correctamente ---
{
  await p.locator('button.opcion', { hasText: 'En el navegador de quien visita la pagina' }).click()
  await comprobar().click(); await p.waitForTimeout(300)
  const titulo = await p.locator('.feedback__titulo').innerText()
  const hayExplicacion = await p.locator('.feedback__explicacion').count() > 0
  registrar(2, 'Responder correctamente',
    'Dice "Muy bien!" con texto, no solo color, y muestra la explicacion',
    `${titulo} · explicacion visible: ${hayExplicacion}`,
    titulo === 'Muy bien!' && hayExplicacion)
}

// --- 4. Presionar varias veces Comprobar ---
{
  const antes = await p.locator('.leccion__tipo').innerText()
  // El pie ya cambio a la barra de feedback: Comprobar ya no existe
  const quedaComprobar = await comprobar().count()
  // y las opciones quedan bloqueadas
  const bloqueadas = await p.locator('button.opcion[disabled]').count()
  const total = await p.locator('button.opcion').count()
  registrar(4, 'Presionar varias veces el boton de confirmacion',
    'La respuesta se cuenta una sola vez y no se puede cambiar',
    `Comprobar desaparece (quedan ${quedaComprobar}); ${bloqueadas}/${total} opciones bloqueadas`,
    quedaComprobar === 0 && bloqueadas === total)
  void antes
}

// --- 3. Responder incorrectamente ---
{
  await p.locator('.feedback button').click(); await p.waitForTimeout(400)
  await p.locator('button.opcion').first().click()
  // elegimos una incorrecta a proposito
  const textos = await p.locator('button.opcion').allInnerTexts()
  const idx = textos.findIndex(t => !t.includes('<script>'))
  await p.locator('button.opcion').nth(idx).click()
  await comprobar().click(); await p.waitForTimeout(300)
  const titulo = await p.locator('.feedback__titulo').innerText()
  const correcta = await p.locator('.feedback__correcta').count() > 0
  registrar(3, 'Responder incorrectamente',
    'Dice "Respuesta incorrecta", muestra cual era la correcta y por que',
    `${titulo} · respuesta correcta visible: ${correcta}`,
    titulo === 'Respuesta incorrecta' && correcta)
}

// --- 5. Completar la ultima actividad ---
await limpio()
{
  const correctas = { 'js-u1-l1-a1': 'En el navegador de quien visita la pagina',
    'js-u1-l1-a2': '<script>', 'js-u1-l1-a3': 'console.log("Hola")',
    'js-u1-l1-a4': 'No, son lenguajes distintos que solo comparten parte del nombre' }
  let contador = ''
  for (let i = 0; i < 4; i++) {
    contador = await p.locator('.leccion__tipo').innerText()
    const opciones = await p.locator('button.opcion').allInnerTexts()
    const objetivo = Object.values(correctas).find(t => opciones.some(o => o.trim() === t))
    const k = opciones.findIndex(o => o.trim() === objetivo)
    await p.locator('button.opcion').nth(k).click()
    await comprobar().click(); await p.waitForTimeout(250)
    await p.locator('.feedback button').click(); await p.waitForTimeout(400)
  }
  const enResultados = p.url().includes('/resultados')
  registrar(5, 'Completar la ultima actividad',
    'La ultima actividad lleva a la pantalla de resultados',
    `Contador final: "${contador.replace(/\s+/g,' ')}" · url: ${enResultados ? 'resultados' : p.url()}`,
    enResultados)

  // datos de la pantalla de resultados (se espera a que terminen los contadores)
  await p.waitForTimeout(1400)
  const marc = await p.locator('.marcador').evaluateAll(els => els.map(e => e.innerText.replace(/\n/g,' ')))
  registrar(10, 'Resultados muestran actividades, correctas, incorrectas y porcentaje',
    'Los cuatro datos visibles',
    marc.join(' | '),
    marc.length === 4)
}

// --- 7. Volver a la unidad ---
{
  await p.locator('.acciones a:has-text("Volver a la unidad"), .acciones button:has-text("Volver a la unidad")').first().click()
  await p.waitForTimeout(700)
  const enUnidad = p.url().includes('/unidades/js-u1')
  registrar(7, 'Volver a la unidad desde resultados',
    'Vuelve a la pantalla de la unidad',
    enUnidad ? 'Llego a /unidades/js-u1' : 'Quedo en ' + p.url(),
    enUnidad)
  const estado2 = await p.locator('li.leccion').nth(1).locator('.boton').isDisabled().catch(()=>null)
  registrar(11, 'Aprobar la leccion 1 habilita la leccion 2',
    'La leccion 2 deja de estar bloqueada',
    estado2 === false ? 'Leccion 2 habilitada' : 'Leccion 2 sigue bloqueada',
    estado2 === false)
}

// --- 6. Repetir una leccion ---
{
  await p.goto(ACT, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
  const contador = await p.locator('.leccion__tipo').innerText()
  const vidas = await p.locator('.vidas').innerText()
  const arrancaDeCero = contador.toLowerCase().includes('1 de 4') && vidas.includes('3')
  registrar(6, 'Repetir una leccion',
    'El intento arranca de cero: actividad 1 de 4 y las 3 vidas',
    `${contador.replace(/\s+/g,' ')} · vidas ${vidas.replace(/\s+/g,' ')}`,
    arrancaDeCero)
}

// --- 8. Leccion inexistente ---
{
  await p.goto(base + '/cursos/javascript/lecciones/no-existe', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const aviso = await p.locator('.vacio h1').innerText().catch(() => '')
  const haySalida = await p.locator('.vacio__acciones a').count()
  registrar(8, 'Abrir una leccion con identificador inexistente',
    'Avisa que no existe y ofrece una salida, sin pantalla rota',
    `"${aviso}" con ${haySalida} accesos de salida`,
    aviso.includes('No encontramos') && haySalida > 0)
}
await ctx.close()

// --- 9. Pantalla movil ---
{
  const m = await b.newContext({ ...devices['Pixel 7'] })
  const pm = await m.newPage()
  await pm.goto(base + '/', { waitUntil: 'domcontentloaded' })
  await pm.evaluate(() => localStorage.setItem('sintaxia:bienvenida-vista','1'))
  const anchos = []
  for (const r of ['/cursos', '/cursos/javascript', '/cursos/javascript/unidades/js-u1',
                   `/cursos/javascript/lecciones/${LECCION}`, ACT.replace(base,'')]) {
    await pm.goto(base + r, { waitUntil: 'networkidle' }); await pm.waitForTimeout(500)
    anchos.push(await pm.evaluate(() => document.documentElement.scrollWidth))
  }
  // el ejemplo de codigo no debe desbordar la pagina
  await pm.goto(base + `/cursos/javascript/lecciones/${LECCION}`, { waitUntil: 'networkidle' })
  await pm.waitForTimeout(500)
  const codigoDesborda = await pm.evaluate(() => {
    const pre = document.querySelector('.bloque__codigo')
    return pre ? pre.scrollWidth > pre.clientWidth : false
  })
  const sinDesborde = anchos.every(a => a <= 412)
  registrar(9, 'Usar la aplicacion en pantalla de tamanio movil (412 px)',
    'Ninguna pantalla desborda a lo ancho y el codigo se desplaza dentro de su caja',
    `Anchos: ${anchos.join(', ')} · el ejemplo de codigo ${codigoDesborda ? 'se desplaza dentro de su caja' : 'entra completo'}`,
    sinDesborde)
  await m.close()
}

await b.close()

console.log('\n| # | Caso | Resultado esperado | Resultado obtenido | Estado |')
console.log('|---|---|---|---|---|')
resultados.sort((a,z) => a.n - z.n).forEach(r =>
  console.log(`| ${r.n} | ${r.caso} | ${r.esperado} | ${r.obtenido} | ${r.estado} |`))
console.log('\nerrores de pagina:', errores.length ? errores : 'ninguno')
console.log('fallan:', resultados.filter(r => r.estado === 'FALLA').length)
