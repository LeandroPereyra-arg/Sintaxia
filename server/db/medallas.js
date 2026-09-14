/**
 * Catalogo de medallas de Sintaxia.
 *
 * Vive en el codigo (y no cargado a mano en la base) para que se pueda
 * versionar junto al resto del proyecto. `npm run db:sembrar` lo vuelca a la
 * tabla `medallas`, y el evaluador de `servicios/medallas.js` las otorga
 * automaticamente cuando el estudiante cumple el requisito.
 *
 * requisito_tipo:
 *   lecciones           -> lecciones distintas completadas
 *   lecciones_perfectas -> lecciones completadas sin ningun error
 *   racha               -> dias seguidos de practica
 *   xp                  -> XP total acumulado
 *   xp_dia              -> XP ganado en un mismo dia
 *   unidades            -> unidades completadas al 100 %
 *   curso               -> cursos terminados enteros
 */
export const catalogoMedallas = [
  // --- Progreso -------------------------------------------------------
  { codigo: 'primer_paso',      nombre: 'Primer paso',      descripcion: 'Completa tu primera leccion.',           icono: '🥚',  categoria: 'progreso',   nivel: 'bronce',   requisito_tipo: 'lecciones',           requisito_valor: 1,   orden: 10 },
  { codigo: 'aprendiz',         nombre: 'Aprendiz',         descripcion: 'Completa 5 lecciones.',                  icono: '📘',  categoria: 'progreso',   nivel: 'plata',    requisito_tipo: 'lecciones',           requisito_valor: 5,   orden: 20 },
  { codigo: 'estudioso',        nombre: 'Estudioso',        descripcion: 'Completa 10 lecciones.',                 icono: '🎓',  categoria: 'progreso',   nivel: 'oro',      requisito_tipo: 'lecciones',           requisito_valor: 10,  orden: 30 },
  { codigo: 'unidad_completa',  nombre: 'Unidad completa',  descripcion: 'Termina una unidad entera.',             icono: '🎖️', categoria: 'progreso',   nivel: 'plata',    requisito_tipo: 'unidades',            requisito_valor: 1,   orden: 40 },
  { codigo: 'medio_camino',     nombre: 'Medio camino',     descripcion: 'Termina 3 unidades del curso.',          icono: '🗺️', categoria: 'progreso',   nivel: 'oro',      requisito_tipo: 'unidades',            requisito_valor: 3,   orden: 50 },
  { codigo: 'javascript_listo', nombre: 'JavaScript listo', descripcion: 'Completa el curso de JavaScript entero.', icono: '👑', categoria: 'progreso',   nivel: 'diamante', requisito_tipo: 'curso',               requisito_valor: 1,   orden: 60 },

  // --- Constancia -----------------------------------------------------
  { codigo: 'racha_3',          nombre: 'Constante',        descripcion: 'Manten una racha de 3 dias.',            icono: '🔥',  categoria: 'constancia', nivel: 'bronce',   requisito_tipo: 'racha',               requisito_valor: 3,   orden: 70 },
  { codigo: 'racha_7',          nombre: 'Semana perfecta',  descripcion: 'Practica 7 dias seguidos.',              icono: '📅',  categoria: 'constancia', nivel: 'plata',    requisito_tipo: 'racha',               requisito_valor: 7,   orden: 80 },
  { codigo: 'racha_30',         nombre: 'Imparable',        descripcion: 'Practica 30 dias seguidos.',             icono: '⚡',  categoria: 'constancia', nivel: 'diamante', requisito_tipo: 'racha',               requisito_valor: 30,  orden: 90 },

  // --- Volumen --------------------------------------------------------
  { codigo: 'xp_100',           nombre: 'Cien puntos',      descripcion: 'Acumula 100 XP.',                        icono: '💯',  categoria: 'volumen',    nivel: 'bronce',   requisito_tipo: 'xp',                  requisito_valor: 100, orden: 100 },
  { codigo: 'xp_500',           nombre: 'Maratonista',      descripcion: 'Acumula 500 XP.',                        icono: '🚀',  categoria: 'volumen',    nivel: 'oro',      requisito_tipo: 'xp',                  requisito_valor: 500, orden: 110 },
  { codigo: 'sesion_larga',     nombre: 'Sesion larga',     descripcion: 'Gana 100 XP en un mismo dia.',           icono: '🏃',  categoria: 'volumen',    nivel: 'plata',    requisito_tipo: 'xp_dia',              requisito_valor: 100, orden: 120 },

  // --- Precision ------------------------------------------------------
  { codigo: 'sin_errores',      nombre: 'Sin errores',      descripcion: 'Termina una leccion sin equivocarte.',   icono: '🎯',  categoria: 'precision',  nivel: 'plata',    requisito_tipo: 'lecciones_perfectas', requisito_valor: 1,   orden: 130 },
  { codigo: 'francotirador',    nombre: 'Francotirador',    descripcion: 'Completa 5 lecciones perfectas.',        icono: '🏹',  categoria: 'precision',  nivel: 'oro',      requisito_tipo: 'lecciones_perfectas', requisito_valor: 5,   orden: 140 }
]

/** Color de cada nivel de medalla. El front lo usa para el anillo y el degrade. */
export const nivelesMedalla = {
  bronce: '#c8834a',
  plata: '#9aa7b4',
  oro: '#e8b923',
  diamante: '#4fc3e8'
}
