/**
 * Carga el catalogo de medallas en la base.
 *   npm run db:sembrar
 *
 * Usa INSERT ... ON DUPLICATE KEY UPDATE, asi que se puede volver a correr
 * despues de editar el catalogo y las medallas quedan actualizadas sin perder
 * las que los usuarios ya ganaron.
 */
import { pool } from './pool.js'
import { catalogoMedallas } from './medallas.js'

async function sembrar() {
  for (const medalla of catalogoMedallas) {
    await pool.execute(
      `INSERT INTO medallas
         (codigo, nombre, descripcion, icono, categoria, nivel, requisito_tipo, requisito_valor, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre),
         descripcion = VALUES(descripcion),
         icono = VALUES(icono),
         categoria = VALUES(categoria),
         nivel = VALUES(nivel),
         requisito_tipo = VALUES(requisito_tipo),
         requisito_valor = VALUES(requisito_valor),
         orden = VALUES(orden)`,
      [
        medalla.codigo,
        medalla.nombre,
        medalla.descripcion,
        medalla.icono,
        medalla.categoria,
        medalla.nivel,
        medalla.requisito_tipo,
        medalla.requisito_valor,
        medalla.orden
      ]
    )
  }

  const [[fila]] = await pool.query('SELECT COUNT(*) AS total FROM medallas')
  console.log(`✔ ${fila.total} medallas en el catalogo`)
  await pool.end()
}

sembrar().catch((error) => {
  console.error('✖ No se pudo sembrar el catalogo:', error.message)
  process.exit(1)
})
