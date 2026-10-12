/**
 * Acceso a los perfiles.
 *
 * Cada participante tiene UN perfil, con el mismo id que su usuario de Auth. Lo
 * crea la base sola cuando Auth crea al usuario: aca solo se lee el propio y se
 * editan los campos permitidos (alias, avatar y meta diaria). Las politicas de
 * RLS impiden ver o tocar el perfil de otra persona, y el permiso por columna
 * impide cambiar el id, el codigo o si es invitado.
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import { SinConfiguracion, traducirErrorDeDatos } from '@/servicios/errores.js'

const COLUMNAS = 'id, alias, codigo, es_invitado, avatar, meta_diaria, creado_en'

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

function aPerfil(fila) {
  if (!fila) return null
  return {
    id: fila.id,
    alias: fila.alias,
    codigo: fila.codigo,
    esInvitado: fila.es_invitado,
    avatar: fila.avatar,
    metaDiaria: fila.meta_diaria,
    creadoEn: fila.creado_en
  }
}

/** El perfil de la sesion actual, o null si todavia no existe. */
export async function obtenerMiPerfil(usuarioId) {
  const { data, error } = await cliente()
    .from('perfiles')
    .select(COLUMNAS)
    .eq('id', usuarioId)
    .maybeSingle()

  if (error) throw traducirErrorDeDatos(error, 'cargar tu perfil')
  return aPerfil(data)
}

/** Guarda cambios del perfil propio. `cambios` puede traer alias, avatar y metaDiaria. */
export async function guardarMiPerfil(usuarioId, cambios) {
  const fila = {}
  if (cambios.alias !== undefined) fila.alias = cambios.alias.trim()
  if (cambios.avatar !== undefined) fila.avatar = cambios.avatar
  if (cambios.metaDiaria !== undefined) fila.meta_diaria = cambios.metaDiaria

  const { data, error } = await cliente()
    .from('perfiles')
    .update(fila)
    .eq('id', usuarioId)
    .select(COLUMNAS)

  if (error) throw traducirErrorDeDatos(error, 'guardar tu perfil')

  // Sin error pero sin filas: RLS no dejo ver el renglon, o no existe.
  if (!data || data.length === 0) {
    throw traducirErrorDeDatos({ code: '42501', message: 'row-level security' }, 'guardar tu perfil')
  }
  return aPerfil(data[0])
}
