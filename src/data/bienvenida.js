/**
 * Pasos de la pantalla de bienvenida.
 *
 * Es el recorrido que ve alguien que abre Sintaxia por primera vez: cuenta que
 * es la aplicacion y para que sirve, y termina ofreciendo entrar o seguir como
 * invitado. Como todo el contenido, vive fuera de la plantilla.
 */
export const pasosBienvenida = [
  {
    id: 'que-es',
    sintax: 'saludando',
    icono: 'cohete',
    titulo: 'Hola, soy Sintax',
    texto:
      'Te voy a acompaniar a aprender a programar de verdad, con lecciones de cinco minutos que podes hacer en el colectivo.',
    color: 'var(--c-verde)'
  },
  {
    id: 'ejercicios',
    sintax: 'pensando',
    icono: 'pieza',
    titulo: 'Aprendes haciendo',
    texto:
      'Nada de videos de cuarenta horas. Elegis, completas codigo y ordenas bloques, y te digo al instante si esta bien y por que.',
    color: 'var(--c-violeta)'
  },
  {
    id: 'rachas',
    sintax: 'celebrando',
    icono: 'llama',
    titulo: 'Volve todos los dias',
    texto:
      'Cada leccion suma XP y mantiene viva tu racha. Hay 14 medallas esperandote: las vas desbloqueando sin darte cuenta.',
    color: 'var(--c-amarillo)'
  },
  {
    id: 'ranking',
    sintax: 'sorprendido',
    icono: 'ranking',
    titulo: 'Competi con otros',
    texto:
      'Todos los lunes el ranking arranca de cero, asi que siempre podes pelear el primer puesto aunque recien empieces.',
    color: 'var(--c-azul)'
  }
]
