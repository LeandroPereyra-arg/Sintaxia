/**
 * JWT HS256 minimo, sin dependencias.
 *
 * Supabase firma con una clave compartida (el "JWT secret" del proyecto) el
 * token de acceso que entrega Auth y tambien las claves publicable y de servicio.
 * La API de datos verifica esa firma y usa el claim `role` para decidir con que
 * rol de PostgreSQL ejecuta la consulta. Esto replica ese mecanismo para las
 * pruebas locales.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const b64u = (buffer) => Buffer.from(buffer).toString('base64url')

export function firmar(payload, secreto) {
  const cabecera = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const cuerpo = b64u(JSON.stringify(payload))
  const firma = createHmac('sha256', secreto).update(`${cabecera}.${cuerpo}`).digest('base64url')
  return `${cabecera}.${cuerpo}.${firma}`
}

export class JwtInvalido extends Error {
  constructor(mensaje, expirado = false) {
    super(mensaje)
    this.expirado = expirado
  }
}

/** Devuelve el payload si la firma es valida y no vencio; si no, lanza JwtInvalido. */
export function verificar(token, secreto) {
  const partes = String(token ?? '').split('.')
  if (partes.length !== 3) throw new JwtInvalido('JWT malformado')

  const esperada = createHmac('sha256', secreto).update(`${partes[0]}.${partes[1]}`).digest()
  const recibida = Buffer.from(partes[2], 'base64url')
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    throw new JwtInvalido('Firma invalida')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'))
  } catch {
    throw new JwtInvalido('JWT malformado')
  }

  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new JwtInvalido('JWT expired', true)
  }
  return payload
}

/** Claves de la API, con fechas fijas para que sean siempre el mismo texto. */
export function clavePublicable(secreto) {
  return firmar({ role: 'anon', iss: 'sintaxia-local', iat: 1700000000, exp: 4102444800 }, secreto)
}

export function claveDeServicio(secreto) {
  return firmar({ role: 'service_role', iss: 'sintaxia-local', iat: 1700000000, exp: 4102444800 }, secreto)
}
