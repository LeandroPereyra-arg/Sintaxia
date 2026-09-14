import { ligaDe, proximaLiga } from '../servicios/ranking.js'

/**
 * Convierte una fila de `usuarios` en el objeto que consume el front.
 * Nunca se devuelven columnas internas de mas: lo que no esta aca, no sale.
 */
export function presentarUsuario(fila, identidades = []) {
  const xpTotal = Number(fila.xp_total)
  return {
    id: fila.id,
    usuario: fila.usuario,
    nombre: fila.nombre,
    email: fila.email,
    avatarUrl: fila.avatar_url,
    avatarIcono: fila.avatar_icono,
    bio: fila.bio,
    pais: fila.pais,
    xp: xpTotal,
    racha: Number(fila.racha_actual),
    rachaMaxima: Number(fila.racha_maxima),
    metaDiaria: Number(fila.meta_diaria),
    ultimaActividad: fila.ultima_actividad,
    creadoEn: fila.creado_en,
    liga: ligaDe(xpTotal),
    siguienteLiga: proximaLiga(xpTotal),
    proveedores: identidades.map((i) => i.proveedor)
  }
}
