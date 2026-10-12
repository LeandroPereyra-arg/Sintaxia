/**
 * Reglas de los datos que el participante escribe en los formularios.
 *
 * El alias repite EXACTAMENTE las reglas de la base (supabase/05-perfiles-y-progreso.sql,
 * funcion public.alias_permitido): validar aca sirve para avisar mientras se
 * escribe, pero la base es la que manda y rechaza lo que no cumpla.
 */

export const ALIAS_MINIMO = 3
export const ALIAS_MAXIMO = 20
export const CLAVE_MINIMA = 8

const FORMATO_ALIAS = /^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$/

/** Nombres que se confundirian con la organizacion o con el sistema. */
export const ALIAS_RESERVADOS = [
  'admin', 'administrador', 'root', 'sintaxia', 'soporte', 'moderador', 'sistema', 'staff', 'anonimo'
]

/** Devuelve '' si el alias es valido, o el motivo en texto. */
export function motivoAliasInvalido(alias, { invitado = false } = {}) {
  const texto = String(alias ?? '').trim()
  if (texto.length < ALIAS_MINIMO) return `El alias necesita al menos ${ALIAS_MINIMO} caracteres.`
  if (texto.length > ALIAS_MAXIMO) return `El alias puede tener hasta ${ALIAS_MAXIMO} caracteres.`
  if (!FORMATO_ALIAS.test(texto)) {
    return 'Usa solo letras sin tilde, numeros y guion bajo, y que no empiece ni termine con guion bajo.'
  }
  const normalizado = texto.toLowerCase()
  if (ALIAS_RESERVADOS.includes(normalizado)) return 'Ese alias esta reservado. Elegi otro.'
  if (normalizado === 'invitado' && !invitado) return '"Invitado" es el nombre de los invitados. Elegi otro.'
  return ''
}

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function motivoCorreoInvalido(correo) {
  const texto = String(correo ?? '').trim()
  if (!texto) return 'Escribi tu correo.'
  if (!FORMATO_CORREO.test(texto)) return 'El correo no parece valido. Revisa que tenga la forma nombre@dominio.com.'
  return ''
}

export function motivoClaveInvalida(clave) {
  const texto = String(clave ?? '')
  if (texto.length < CLAVE_MINIMA) return `La contrasena necesita al menos ${CLAVE_MINIMA} caracteres.`
  return ''
}

/** "Ana" + 427 -> "Ana#0427": el codigo distingue a quienes tienen el mismo alias. */
export function etiquetaDe(alias, codigo) {
  if (!alias) return ''
  return codigo ? `${alias}#${String(codigo).padStart(4, '0')}` : alias
}

/** Acepta solo rutas internas ("/perfil"), para que ?volver= no sea una redireccion abierta. */
export function rutaSegura(valor, porDefecto = '/perfil') {
  if (typeof valor !== 'string') return porDefecto
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return porDefecto
  return valor
}
