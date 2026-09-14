/**
 * Set de iconos de Sintaxia.
 *
 * Son SVG dibujados a mano dentro del proyecto: no dependen de ninguna
 * libreria ni CDN, pesan unos pocos KB y heredan el color del texto
 * (`currentColor`), asi que cambian solos segun donde se usen.
 *
 * Convencion: lienzo de 24x24, trazo de 2, puntas y uniones redondeadas.
 * El contenido es estatico y esta escrito en el repositorio (nunca viene del
 * usuario), por eso se puede insertar con v-html sin riesgo.
 */
export const iconos = {
  // ---------- Unidades del curso ----------
  cohete:
    '<path d="M4.5 14.5c-1 2.5-1 5 -1 5s2.5 0 5-1"/><path d="M9 15l-3-3c1-5 4.5-8.5 9-9.5 1 4.5-2 8.5-6 12.5z"/><path d="M15 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M6.5 12L4 11.5 8 7l2.5.2"/><path d="M12 17.5l.5 2.5 4.5-4-.2-2.5"/>',
  bifurcacion:
    '<path d="M3 6h4l3 6 3 6h5"/><path d="M3 18h4l2-4"/><path d="M15 3l3 3-3 3"/><path d="M15 15l3 3-3 3"/>',
  repetir:
    '<path d="M4 10a7 7 0 0 1 12-4.5l3 3"/><path d="M20 14a7 7 0 0 1-12 4.5l-3-3"/><path d="M19 2v6.5h-6"/><path d="M5 22v-6.5h6"/>',
  pieza:
    '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H9a2 2 0 1 1 4 0h2.5A2.5 2.5 0 0 1 18 7.5V10a2 2 0 1 1 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5H13a2 2 0 1 0-4 0H6.5A2.5 2.5 0 0 1 4 16.5V14a2 2 0 1 0 0-4z"/>',
  caja:
    '<path d="M12 2.8l8 4.2v10L12 21.2 4 17V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10.2"/>',
  globo:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>',

  // ---------- Lecciones ----------
  estrella:
    '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  variable:
    '<path d="M12 3v10"/><path d="M8 9.5l4 4 4-4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  texto:
    '<path d="M4 20l6-15 6 15"/><path d="M6.5 14h7"/><path d="M17 20h3"/>',
  division:
    '<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.4"/><circle cx="12" cy="17.5" r="1.4"/>',
  balanza:
    '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M4 8h16"/><path d="M4 8l-2.5 5.5a3 3 0 0 0 5 0z"/><path d="M20 8l2.5 5.5a3 3 0 0 1-5 0z"/>',
  saltar:
    '<path d="M5 5l8 7-8 7z"/><path d="M18 5v14"/>',
  carpetas:
    '<path d="M3 8.5V18a2 2 0 0 0 2 2h12"/><path d="M7 4h3.5l1.5 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
  puntero:
    '<path d="M5 3l14 8-6 1.6L10.5 19z"/>',

  // ---------- Medallas ----------
  huevo:
    '<path d="M12 3c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.5 8.5 3 12 3z"/>',
  libro:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  birrete:
    '<path d="M12 4l10 4.5-10 4.5-10-4.5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M21 9v5"/>',
  medalla:
    '<circle cx="12" cy="15" r="6"/><path d="M9 9.5L6 2h4l2.5 5"/><path d="M15 9.5L18 2h-4l-1 2"/><path d="M12 12.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
  mapa:
    '<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>',
  corona:
    '<path d="M3 7l3.5 4L12 4l5.5 7L21 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 14h18"/>',
  llama:
    '<path d="M12 2.5s5 4 5 8.5a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5s.5 1.5 1.5 2c0-3 2.5-5.5 2.5-7z"/><path d="M12 21a3 3 0 0 0 3-3c0-2-3-3.5-3-3.5S9 16 9 18a3 3 0 0 0 3 3z"/>',
  calendario:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M8 14h2"/><path d="M14 14h2"/><path d="M8 18h2"/>',
  rayo:
    '<path d="M13.5 2L4 13.5h6.5L10 22l9.5-11.5H13z"/>',
  gema:
    '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="M9.5 3L8 9l4 12 4-12-1.5-6"/>',
  corredor:
    '<circle cx="15" cy="4.5" r="1.8"/><path d="M9 21l2.5-5.5-2.5-3 1-4.5 3.5-1.5 3 3 3 1"/><path d="M13.5 12.5l2.5 3 .5 5.5"/><path d="M8 9.5L4.5 11"/>',
  diana:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  flechaDiana:
    '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="3.5"/><path d="M11 13l9-9"/><path d="M16 4h4v4"/>',
  trofeo:
    '<path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4"/><path d="M17 6h2.5a2.5 2.5 0 0 1-2.5 4"/><path d="M12 15v3"/><path d="M8.5 21h7l-1-3h-5z"/>',

  // ---------- Estado y progreso ----------
  corazon:
    '<path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 6.1-8.5 11.6-8.5 11.6z"/>',
  corazonRoto:
    '<path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9c0 6.1-8.5 11.6-8.5 11.6z"/><path d="M13 7l-3 3.5 3.5 2.5-3 4"/>',
  check:
    '<path d="M4.5 12.5l5 5 10-11"/>',
  checkCirculo:
    '<circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.7 2.8L16 9.5"/>',
  equis: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  equisCirculo:
    '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
  candado:
    '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/>',
  bombita:
    '<path d="M9 17.5a6 6 0 1 1 6 0v1.5H9z"/><path d="M9.5 22h5"/><path d="M12 13.5v-3"/>',
  chispas:
    '<path d="M12 2.5l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.8z"/><path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/><path d="M5 15.5l.6 1.5 1.5.6-1.5.6L5 19.7l-.6-1.5L2.9 17.6l1.5-.6z"/>',
  pesa:
    '<path d="M3 9v6"/><path d="M6 6.5v11"/><path d="M18 6.5v11"/><path d="M21 9v6"/><path d="M6 12h12"/>',
  reloj:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.3 2"/>',
  fuegoRacha:
    '<path d="M12 2.5s5 4 5 8.5a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5s.5 1.5 1.5 2c0-3 2.5-5.5 2.5-7z"/>',

  // ---------- Interfaz ----------
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M16.2 16.2L21 21"/>',
  ubicacion:
    '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.7"/>',
  cerebro:
    '<path d="M12 5a3 3 0 0 0-5.8-1A3 3 0 0 0 4 8.5 3 3 0 0 0 5 14a3 3 0 0 0 3.5 4.5A3 3 0 0 0 12 20z"/><path d="M12 5a3 3 0 0 1 5.8-1A3 3 0 0 1 20 8.5 3 3 0 0 1 19 14a3 3 0 0 1-3.5 4.5A3 3 0 0 1 12 20z"/><path d="M12 5v15"/>',
  joystick:
    '<path d="M7 7h10a5 5 0 0 1 5 5v2a4 4 0 0 1-7 2.7H9A4 4 0 0 1 2 14v-2a5 5 0 0 1 5-5z"/><path d="M6 12h3"/><path d="M7.5 10.5v3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="13.5" r="1"/>',
  libros:
    '<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M16.2 5.2l3.6 1-4 14.3-3.6-1z"/>',
  flechaDerecha: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  flechaIzquierda: '<path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  cerrar: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  usuario:
    '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  salir:
    '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>',
  ranking:
    '<path d="M4 20V11h5v9"/><path d="M9.5 20V4h5v16"/><path d="M15 20v-6h5v6"/>',
  probeta:
    '<path d="M9 3v7L4.5 18a2.5 2.5 0 0 0 2.2 3.7h10.6A2.5 2.5 0 0 0 19.5 18L15 10V3"/><path d="M8 3h8"/><path d="M7 15h10"/>',
  escudo:
    '<path d="M12 2.5l8 3v6c0 5-3.4 9.2-8 10.5C7.4 20.7 4 16.5 4 11.5v-6z"/>',

  // ---------- Avatares ----------
  buho:
    '<path d="M6.2 4.8l2.6 2.9"/><path d="M17.8 4.8l-2.6 2.9"/><path d="M12 21c-4.1 0-7.4-3.4-7.4-7.7C4.6 9 7.9 5.4 12 5.4s7.4 3.6 7.4 7.9C19.4 17.6 16.1 21 12 21z"/><circle cx="9.4" cy="11.3" r="2.2"/><circle cx="14.6" cy="11.3" r="2.2"/><circle cx="9.4" cy="11.3" r="0.75" fill="currentColor"/><circle cx="14.6" cy="11.3" r="0.75" fill="currentColor"/><path d="M12 14.3l-1 1.5h2z"/><path d="M9.5 18.6h5"/>',
  robot:
    '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4"/><circle cx="12" cy="3" r="1.4"/><circle cx="9" cy="13" r="1.3"/><circle cx="15" cy="13" r="1.3"/><path d="M9.5 17h5"/><path d="M2 12v3M22 12v3"/>',
  astronauta:
    '<circle cx="12" cy="10" r="7"/><path d="M8.2 9.6a3.8 3.8 0 0 1 7.6 0v1.6a1.8 1.8 0 0 1-1.8 1.8H10a1.8 1.8 0 0 1-1.8-1.8z"/><path d="M19 8.6h1.6v2.8H19"/><path d="M5.2 19.6A7.5 7.5 0 0 1 12 15.6a7.5 7.5 0 0 1 6.8 4"/>',

  // ---------- Marcas de los proveedores ----------
  google:
    '<path d="M21 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.05a4.3 4.3 0 0 1-1.87 2.82v2.34h3.03C19.98 17.6 21 15.15 21 12.2z" fill="currentColor" stroke="none"/><path d="M12 21.5c2.53 0 4.65-.84 6.2-2.27l-3.02-2.34c-.84.56-1.9.9-3.18.9-2.45 0-4.52-1.65-5.26-3.87H3.63v2.42A9.5 9.5 0 0 0 12 21.5z" fill="currentColor" stroke="none"/><path d="M6.74 13.92a5.7 5.7 0 0 1 0-3.63V7.87H3.63a9.5 9.5 0 0 0 0 8.47z" fill="currentColor" stroke="none"/><path d="M12 6.4c1.38 0 2.62.48 3.6 1.4l2.68-2.68C16.64 3.6 14.52 2.7 12 2.7a9.5 9.5 0 0 0-8.37 5.17l3.11 2.42C7.48 8.06 9.55 6.4 12 6.4z" fill="currentColor" stroke="none"/>',
  github:
    '<path d="M12 2.2c-5.5 0-10 4.5-10 10 0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48l-.01-1.86c-2.51.55-3.04-1.21-3.04-1.21-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.91.06 1.38.93 1.38.93.81 1.38 2.12 .98 2.64.75.08-.59.32-.98.57-1.2-2-.23-4.1-1-4.1-4.45 0-.98.35-1.79.92-2.42-.09-.23-.4-1.15.09-2.4 0 0 .76-.24 2.5.92a8.6 8.6 0 0 1 4.55 0c1.73-1.16 2.49-.92 2.49-.92.5 1.25.19 2.17.1 2.4.57.63.92 1.44.92 2.42 0 3.46-2.11 4.22-4.12 4.44.33.28.61.83.61 1.67l-.01 2.48c0 .26.18.58.69.48A10 10 0 0 0 12 2.2z" fill="currentColor" stroke="none"/>'
}

/** Nombres validos, para poder avisar en desarrollo si se pide uno que no existe. */
export const nombresIconos = Object.keys(iconos)
