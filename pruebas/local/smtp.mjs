/**
 * Servidor SMTP de mentira: recibe los correos que manda Auth (confirmacion,
 * recuperacion, cambio de correo) y los guarda en memoria para que las pruebas
 * puedan abrir los enlaces. Es el equivalente local de Inbucket / Mailpit.
 *
 * Solo habla lo justo del protocolo: EHLO, MAIL, RCPT, DATA, RSET, NOOP, QUIT.
 * No ofrece STARTTLS ni AUTH.
 */
import net from 'node:net'

/** Los correos recibidos, del mas viejo al mas nuevo. */
export const correos = []

function decodificarQuotedPrintable(texto) {
  return texto
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function decodificarCuerpo(cuerpo, codificacion) {
  const tipo = (codificacion ?? '').toLowerCase().trim()
  if (tipo === 'base64') return Buffer.from(cuerpo.replace(/\s+/g, ''), 'base64').toString('utf8')
  if (tipo === 'quoted-printable') {
    // Los bytes de caracteres multibyte vienen como =C3=A1: se decodifica por bytes.
    const bytes = Buffer.from(
      cuerpo.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))),
      'latin1'
    )
    return bytes.toString('utf8')
  }
  return cuerpo
}

function separar(mensaje) {
  const corte = mensaje.search(/\r?\n\r?\n/)
  if (corte === -1) return { cabeceras: mensaje, cuerpo: '' }
  const resto = mensaje.slice(corte).replace(/^\r?\n\r?\n/, '')
  return { cabeceras: mensaje.slice(0, corte), cuerpo: resto }
}

function leerCabecera(cabeceras, nombre) {
  // Las cabeceras largas se continuan en la linea siguiente con un espacio.
  const plano = cabeceras.replace(/\r?\n[ \t]+/g, ' ')
  const hallada = plano.match(new RegExp(`^${nombre}:\\s*(.*)$`, 'im'))
  return hallada ? hallada[1].trim() : ''
}

function decodificarAsunto(asunto) {
  return asunto.replace(/=\?UTF-8\?([QB])\?([^?]*)\?=/gi, (_, modo, dato) =>
    modo.toUpperCase() === 'B'
      ? Buffer.from(dato, 'base64').toString('utf8')
      : decodificarQuotedPrintable(dato.replace(/_/g, ' '))
  )
}

/** Junta el texto de todas las partes (texto plano y HTML) ya decodificado. */
function extraerTexto(mensaje) {
  const { cabeceras, cuerpo } = separar(mensaje)
  const tipo = leerCabecera(cabeceras, 'Content-Type')
  const limite = tipo.match(/boundary="?([^";]+)"?/i)?.[1]

  if (limite) {
    return cuerpo
      .split(`--${limite}`)
      .slice(1)
      .filter((parte) => !parte.startsWith('--'))
      .map((parte) => extraerTexto(parte.replace(/^\r?\n/, '')))
      .join('\n')
  }
  return decodificarCuerpo(cuerpo, leerCabecera(cabeceras, 'Content-Transfer-Encoding'))
}

function procesar(mensajeCrudo, remitente, destinatarios) {
  const { cabeceras } = separar(mensajeCrudo)
  const texto = extraerTexto(mensajeCrudo)
  const enlaces = [...new Set(texto.match(/https?:\/\/[^\s"'<>)]+/g) ?? [])].map((e) =>
    e.replace(/&amp;/g, '&')
  )
  return {
    recibidoEn: Date.now(),
    de: remitente,
    para: destinatarios,
    asunto: decodificarAsunto(leerCabecera(cabeceras, 'Subject')),
    texto,
    enlaces
  }
}

export function iniciarSmtp(puerto, host = '127.0.0.1') {
  const servidor = net.createServer((socket) => {
    let modo = 'comandos'
    let buffer = ''
    let remitente = ''
    let destinatarios = []
    let datos = ''

    const responder = (linea) => socket.write(`${linea}\r\n`)
    responder('220 sintaxia-local ESMTP listo')

    socket.on('data', (trozo) => {
      buffer += trozo.toString('latin1')

      for (;;) {
        if (modo === 'datos') {
          const fin = buffer.indexOf('\r\n.\r\n')
          if (fin === -1) return
          datos = buffer.slice(0, fin)
          buffer = buffer.slice(fin + 5)
          // Quita el "dot-stuffing": una linea que empezaba con punto lleva otro.
          correos.push(procesar(datos.replace(/\r\n\.\./g, '\r\n.'), remitente, destinatarios))
          responder('250 2.0.0 Mensaje encolado')
          modo = 'comandos'
          continue
        }

        const salto = buffer.indexOf('\r\n')
        if (salto === -1) return
        const linea = buffer.slice(0, salto)
        buffer = buffer.slice(salto + 2)
        const comando = linea.slice(0, 4).toUpperCase()

        if (comando === 'EHLO') {
          socket.write('250-sintaxia-local\r\n250 8BITMIME\r\n')
        } else if (comando === 'HELO') {
          responder('250 sintaxia-local')
        } else if (comando === 'MAIL') {
          remitente = linea.match(/<([^>]*)>/)?.[1] ?? ''
          destinatarios = []
          responder('250 2.1.0 Remitente aceptado')
        } else if (comando === 'RCPT') {
          destinatarios.push(linea.match(/<([^>]*)>/)?.[1] ?? '')
          responder('250 2.1.5 Destinatario aceptado')
        } else if (comando === 'DATA') {
          modo = 'datos'
          responder('354 Termina con <CRLF>.<CRLF>')
        } else if (comando === 'RSET' || comando === 'NOOP') {
          responder('250 2.0.0 Listo')
        } else if (comando === 'QUIT') {
          responder('221 2.0.0 Chau')
          socket.end()
          return
        } else {
          responder('502 5.5.2 Comando no soportado')
        }
      }
    })

    socket.on('error', () => {})
  })

  return new Promise((resolver, rechazar) => {
    servidor.once('error', rechazar)
    servidor.listen(puerto, host, () => resolver(servidor))
  })
}
