/**
 * Acceso al historial de intentos de lecciones.
 *
 * Cada vez que alguien termina una leccion se agrega un renglon a
 * `intentos_leccion`. De ese historial se calculan el mejor resultado de cada
 * leccion, el XP, la racha y el calendario (ver utils/estadisticas.js).
 *
 * La base decide de quien es cada intento (usuario_id = auth.uid()) y cuando se
 * hizo: el cliente solo manda leccion, aciertos y total. Las politicas de RLS
 * dejan ver, crear y borrar unicamente los propios.
 *
 * Es modo practica: los aciertos los informa el cliente. La validacion de
 * partidas y los puntajes oficiales de la competencia son de una etapa posterior.
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import { SinConfiguracion, traducirErrorDeDatos } from '@/servicios/errores.js'

const COLUMNAS = 'id, leccion_id, aciertos, total, creado_en'

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

function aIntento(fila) {
  return {
    id: fila.id,
    leccionId: fila.leccion_id,
    aciertos: fila.aciertos,
    total: fila.total,
    creadoEn: fila.creado_en
  }
}

/** Todo el historial de la sesion actual, del mas viejo al mas nuevo. */
export async function listarMisIntentos() {
  const { data, error } = await cliente()
    .from('intentos_leccion')
    .select(COLUMNAS)
    .order('creado_en', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw traducirErrorDeDatos(error, 'cargar tu progreso')
  return (data ?? []).map(aIntento)
}

/** Agrega un intento al historial y devuelve el renglon guardado. */
export async function registrarIntento(leccionId, aciertos, total) {
  const { data, error } = await cliente()
    .from('intentos_leccion')
    .insert({ leccion_id: leccionId, aciertos, total })
    .select(COLUMNAS)

  if (error) throw traducirErrorDeDatos(error, 'guardar tu resultado')
  if (!data || data.length === 0) {
    throw traducirErrorDeDatos({ code: '42501', message: 'row-level security' }, 'guardar tu resultado')
  }
  return aIntento(data[0])
}

/** Borra TODO el historial propio (la opcion "reiniciar progreso"). */
export async function borrarMiHistorial(usuarioId) {
  const { error } = await cliente().from('intentos_leccion').delete().eq('usuario_id', usuarioId)
  if (error) throw traducirErrorDeDatos(error, 'borrar tu progreso')
}
