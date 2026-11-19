// Sale con 1 si falta instalar alguna dependencia de package.json (o si
// node_modules quedo de una version vieja del proyecto). Lo usan los arrancadores.
const fs = require('node:fs')
const path = require('node:path')
const raiz = path.join(__dirname, '..')
const pkg = require(path.join(raiz, 'package.json'))
const nombres = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
const faltan = nombres.filter((n) => !fs.existsSync(path.join(raiz, 'node_modules', n, 'package.json')))
if (faltan.length) {
  console.log(`  Faltan dependencias: ${faltan.join(', ')}`)
  process.exit(1)
}
