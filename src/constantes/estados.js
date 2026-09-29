/**
 * Vocabulario de estados que comparten la base de datos y la interfaz.
 *
 * Son constantes, no contenido: no se leen de Supabase. La base guarda
 * exactamente estas cadenas (ver los CHECK de supabase/01-esquema.sql), asi que
 * este archivo es el punto donde los dos lados se ponen de acuerdo.
 *
 * Hay dos familias de estados y conviene no mezclarlas:
 *
 *   · PUBLICACION -> lo decide el equipo que carga el contenido. Vive en la
 *     base, en la columna `estado` de cursos, unidades, lecciones y preguntas.
 *
 *   · PROGRESO -> lo decide lo que hizo cada estudiante. No vive en estas
 *     tablas: lo calcula `useProgreso` (y en una etapa posterior tendra sus
 *     propias tablas).
 */

// ---------------------------------------------------------------------------
// Publicacion
// ---------------------------------------------------------------------------

/** Estado de publicacion de un curso (columna cursos.estado). */
export const ESTADO_CURSO = {
  DISPONIBLE: 'disponible',
  PROXIMAMENTE: 'proximamente',
  BLOQUEADO: 'bloqueado',
  BORRADOR: 'borrador'
}

export const ETIQUETA_ESTADO_CURSO = {
  [ESTADO_CURSO.DISPONIBLE]: 'Disponible',
  [ESTADO_CURSO.PROXIMAMENTE]: 'Proximamente',
  [ESTADO_CURSO.BLOQUEADO]: 'Bloqueado',
  [ESTADO_CURSO.BORRADOR]: 'Borrador'
}

/** Estado de publicacion de una unidad (columna unidades.estado). */
export const PUBLICACION_UNIDAD = {
  PUBLICADA: 'publicada',
  PROXIMAMENTE: 'proximamente',
  BORRADOR: 'borrador'
}

/** Estado de publicacion de una leccion o una pregunta. */
export const PUBLICACION = {
  PUBLICADA: 'publicada',
  BORRADOR: 'borrador'
}

// ---------------------------------------------------------------------------
// Progreso
// ---------------------------------------------------------------------------

/** Como ve el estudiante una unidad, segun lo que ya resolvio. */
export const ESTADO_UNIDAD = {
  COMPLETADA: 'completada',
  DISPONIBLE: 'disponible',
  BLOQUEADA: 'bloqueada',
  /** La unidad existe pero todavia no tiene lecciones publicadas. */
  SIN_CONTENIDO: 'sin-contenido'
}

export const ETIQUETA_ESTADO_UNIDAD = {
  [ESTADO_UNIDAD.COMPLETADA]: 'Completada',
  [ESTADO_UNIDAD.DISPONIBLE]: 'Disponible',
  [ESTADO_UNIDAD.BLOQUEADA]: 'Bloqueada',
  [ESTADO_UNIDAD.SIN_CONTENIDO]: 'Proximamente'
}
