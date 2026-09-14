import { consultar, consultarUna, enTransaccion } from '../db/pool.js'

/** Deja un nombre de usuario valido: minusculas, sin acentos ni simbolos raros. */
function limpiarUsuario(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'estudiante'
}

/** Busca un nombre de usuario libre agregando un numero si hace falta. */
async function usuarioDisponible(base) {
  const limpio = limpiarUsuario(base)
  for (let intento = 0; intento < 50; intento++) {
    const candidato = intento === 0 ? limpio : `${limpio}${intento + 1}`
    const existe = await consultarUna('SELECT id FROM usuarios WHERE usuario = ?', [candidato])
    if (!existe) return candidato
  }
  return `${limpio}${Date.now().toString(36)}`.slice(0, 30)
}

export async function obtenerUsuarioPorId(id) {
  return consultarUna(
    `SELECT id, usuario, nombre, email, avatar_url, avatar_emoji, bio, pais,
            xp_total, racha_actual, racha_maxima, meta_diaria, ultima_actividad, creado_en
       FROM usuarios WHERE id = ?`,
    [id]
  )
}

/**
 * Busca o crea el usuario a partir de una identidad de OAuth.
 *
 * - Si ya existe esa identidad (mismo proveedor + id), devuelve su usuario.
 * - Si no existe pero el email verificado ya esta registrado, vincula la nueva
 *   identidad a esa cuenta (asi Google y GitHub del mismo mail son una sola).
 * - Si no, crea un usuario nuevo.
 */
export async function buscarOCrearPorIdentidad(proveedor, perfil) {
  return enTransaccion(async (conexion) => {
    const [existentes] = await conexion.execute(
      'SELECT usuario_id FROM identidades WHERE proveedor = ? AND proveedor_id = ?',
      [proveedor, perfil.proveedorId]
    )

    if (existentes.length > 0) {
      const usuarioId = existentes[0].usuario_id
      await conexion.execute(
        'UPDATE identidades SET ultimo_acceso = NOW() WHERE proveedor = ? AND proveedor_id = ?',
        [proveedor, perfil.proveedorId]
      )
      // Refrescamos el avatar por si lo cambio en el proveedor.
      if (perfil.avatarUrl) {
        await conexion.execute('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [
          perfil.avatarUrl,
          usuarioId
        ])
      }
      return { usuarioId, nuevo: false }
    }

    // Vincular con una cuenta existente solo si el email esta verificado.
    let usuarioId = null
    if (perfil.email && perfil.emailVerificado) {
      const [porEmail] = await conexion.execute('SELECT id FROM usuarios WHERE email = ?', [
        perfil.email
      ])
      if (porEmail.length > 0) usuarioId = porEmail[0].id
    }

    if (usuarioId === null) {
      const usuario = await usuarioDisponible(perfil.usuarioSugerido)
      // Si el proveedor no da email, guardamos uno interno para respetar el UNIQUE.
      const email = perfil.email ?? `${proveedor}_${perfil.proveedorId}@sintaxia.local`
      const [resultado] = await conexion.execute(
        `INSERT INTO usuarios (usuario, nombre, email, avatar_url, ultima_actividad)
         VALUES (?, ?, ?, ?, NULL)`,
        [usuario, perfil.nombre.slice(0, 80), email, perfil.avatarUrl]
      )
      usuarioId = resultado.insertId
    }

    await conexion.execute(
      `INSERT INTO identidades (usuario_id, proveedor, proveedor_id, email, ultimo_acceso)
       VALUES (?, ?, ?, ?, NOW())`,
      [usuarioId, proveedor, perfil.proveedorId, perfil.email]
    )

    return { usuarioId, nuevo: true }
  })
}

/** Identidades vinculadas, para mostrarlas en el perfil. */
export async function identidadesDe(usuarioId) {
  return consultar(
    'SELECT proveedor, email, creado_en FROM identidades WHERE usuario_id = ? ORDER BY creado_en',
    [usuarioId]
  )
}

const PAISES_VALIDOS = /^[A-Z]{2}$/

/** Actualiza los campos editables del perfil. Devuelve el usuario ya actualizado. */
export async function actualizarPerfil(usuarioId, cambios) {
  const campos = []
  const valores = []

  if (cambios.nombre !== undefined) {
    const nombre = String(cambios.nombre).trim().slice(0, 80)
    if (nombre.length < 2) throw Object.assign(new Error('El nombre es muy corto.'), { estado: 400 })
    campos.push('nombre = ?')
    valores.push(nombre)
  }

  if (cambios.usuario !== undefined) {
    const usuario = limpiarUsuario(cambios.usuario)
    if (usuario.length < 3) {
      throw Object.assign(new Error('El nombre de usuario necesita al menos 3 caracteres.'), { estado: 400 })
    }
    const ocupado = await consultarUna('SELECT id FROM usuarios WHERE usuario = ? AND id <> ?', [
      usuario,
      usuarioId
    ])
    if (ocupado) throw Object.assign(new Error('Ese nombre de usuario ya esta ocupado.'), { estado: 409 })
    campos.push('usuario = ?')
    valores.push(usuario)
  }

  if (cambios.bio !== undefined) {
    campos.push('bio = ?')
    valores.push(String(cambios.bio).trim().slice(0, 160) || null)
  }

  if (cambios.pais !== undefined) {
    const pais = String(cambios.pais).trim().toUpperCase()
    if (pais && !PAISES_VALIDOS.test(pais)) {
      throw Object.assign(new Error('El pais tiene que ser un codigo de dos letras, como AR.'), { estado: 400 })
    }
    campos.push('pais = ?')
    valores.push(pais || null)
  }

  if (cambios.avatarEmoji !== undefined) {
    campos.push('avatar_emoji = ?')
    valores.push(String(cambios.avatarEmoji).slice(0, 16) || null)
  }

  if (cambios.metaDiaria !== undefined) {
    const meta = Number(cambios.metaDiaria)
    if (![20, 50, 100].includes(meta)) {
      throw Object.assign(new Error('La meta diaria tiene que ser 20, 50 o 100 XP.'), { estado: 400 })
    }
    campos.push('meta_diaria = ?')
    valores.push(meta)
  }

  if (campos.length > 0) {
    valores.push(usuarioId)
    await consultar(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores)
  }

  return obtenerUsuarioPorId(usuarioId)
}
