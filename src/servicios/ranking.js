/**
 * Ranking publico de un evento (etapa 7).
 *
 * Carga: la funcion ranking_evento (supabase/15-ranking-publico.sql), que aplica
 * las reglas de la etapa 6 y lee SOLO la tabla resultados_publicos (alias,
 * codigo, puntaje, tiempo). Funciona sin sesion.
 *
 * Avisos: Supabase Realtime, Postgres Changes sobre la tabla
 * resultados_publicos filtrada por evento. El aviso no se usa como dato: solo
 * dispara una nueva consulta a ranking_evento, que es la que ordena y desempata.
 * (No se puede escuchar una vista SQL como si fuera una tabla, por eso se
 * escucha la tabla.)
 */
import { supabase, hayConfiguracion } from '@/servicios/supabase.js'
import { SinConfiguracion, traducirErrorDeDatos } from '@/servicios/errores.js'

function cliente() {
  if (!hayConfiguracion || !supabase) throw new SinConfiguracion()
  return supabase
}

/**
 * Ranking del evento agrupado por desafio, en el orden de los desafios.
 * Devuelve [{ desafioId, desafio, filas: [{ posicion, alias, codigo, puntaje, duracionMs, logradoEn, participante }] }].
 */
export async function obtenerRanking(eventoId, limite = 10) {
  const { data, error } = await cliente().rpc('ranking_evento', { p_evento_id: eventoId, p_limite: limite })
  if (error) throw traducirErrorDeDatos(error, 'cargar el ranking')
  const grupos = new Map()
  for (const f of data ?? []) {
    if (!grupos.has(f.desafio_id)) grupos.set(f.desafio_id, { desafioId: f.desafio_id, desafio: f.desafio, filas: [] })
    grupos.get(f.desafio_id).filas.push({
      posicion: f.posicion,
      alias: f.alias,
      codigo: f.codigo,
      puntaje: f.puntaje,
      duracionMs: f.duracion_ms,
      logradoEn: f.logrado_en,
      participante: f.participante
    })
  }
  return [...grupos.values()]
}

/** Posicion propia en un desafio: { participante, invitado, posicion, mejorPuntaje, participantes }. */
export async function miPosicion(desafioId) {
  const { data, error } = await cliente().rpc('mi_posicion', { p_desafio_id: desafioId })
  if (error) throw traducirErrorDeDatos(error, 'buscar tu posicion')
  return {
    participante: data?.participante ?? null,
    invitado: Boolean(data?.invitado),
    posicion: data?.posicion ?? null,
    mejorPuntaje: data?.mejor_puntaje ?? null,
    participantes: data?.participantes ?? 0
  }
}

/**
 * Escucha los cambios de resultados del evento. `alCambiar()` se llama en cada
 * aviso; `alEstado(estado)` con 'conectado', 'reconectando' o 'error'.
 * Devuelve una funcion para dejar de escuchar.
 */
export function escucharResultados(eventoId, { alCambiar, alEstado }) {
  const canal = cliente()
    .channel(`ranking-${eventoId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'resultados_publicos', filter: `evento_id=eq.${eventoId}` },
      () => alCambiar()
    )
    .on('system', {}, (aviso) => {
      if (aviso?.status === 'error') alEstado('error')
    })
    .subscribe((estado) => {
      if (estado === 'SUBSCRIBED') alEstado('conectado')
      else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') alEstado('reconectando')
      else if (estado === 'CLOSED') alEstado('reconectando')
    })

  return () => {
    cliente().removeChannel(canal)
  }
}
