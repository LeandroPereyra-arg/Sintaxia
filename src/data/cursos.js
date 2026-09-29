/**
 * Catalogo de cursos de Sintaxia.
 *
 * ATENCION: desde la etapa 3 la aplicacion NO lee este archivo. El contenido
 * sale de Supabase a traves de `src/servicios/contenido.js`.
 *
 * Este archivo se conserva por dos motivos:
 *   1. es la fuente con la que se genera supabase/02-datos-iniciales.sql
 *      (ver supabase/generar-datos-iniciales.mjs);
 *   2. la API de cuentas de la etapa 2 lo usa para validar el XP.
 */

// Los estados viven en un solo lugar, compartido con la base de datos.
export { ESTADO_CURSO, ETIQUETA_ESTADO_CURSO } from '../constantes/estados.js'
import { ESTADO_CURSO } from '../constantes/estados.js'

export const cursos = [
  {
    id: 'javascript',
    nombre: 'JavaScript',
    slug: 'javascript',
    descripcion:
      'El lenguaje de la web. Aprende variables, condicionales, bucles, funciones y como darle vida a una pagina.',
    estado: ESTADO_CURSO.DISPONIBLE,
    nivel: 'Principiante',
    icono: 'JS',
    color: '#f7df1e',
    colorTexto: '#1f2933',
    totalUnidades: 6,
    totalLecciones: 14,
    horasEstimadas: 12,
    etiquetas: ['Web', 'Front-end', 'Back-end']
  },
  {
    id: 'python',
    nombre: 'Python',
    slug: 'python',
    descripcion:
      'Sintaxis simple y legible. Ideal para dar tus primeros pasos, automatizar tareas y entrar al mundo de los datos.',
    estado: ESTADO_CURSO.PROXIMAMENTE,
    nivel: 'Principiante',
    icono: 'Py',
    color: '#3776ab',
    colorTexto: '#ffffff',
    totalUnidades: 6,
    totalLecciones: 15,
    horasEstimadas: 13,
    etiquetas: ['Datos', 'Automatizacion']
  },
  {
    id: 'html-css',
    nombre: 'HTML y CSS',
    slug: 'html-css',
    descripcion:
      'La estructura y el diseno de cualquier sitio web. Etiquetas, selectores, cajas, flexbox y diseno responsivo.',
    estado: ESTADO_CURSO.PROXIMAMENTE,
    nivel: 'Principiante',
    icono: '</>',
    color: '#e34f26',
    colorTexto: '#ffffff',
    totalUnidades: 5,
    totalLecciones: 12,
    horasEstimadas: 9,
    etiquetas: ['Web', 'Diseno']
  },
  {
    id: 'sql',
    nombre: 'SQL',
    slug: 'sql',
    descripcion:
      'Consulta y modifica bases de datos relacionales. SELECT, filtros, ordenamientos, joins y agrupaciones.',
    estado: ESTADO_CURSO.PROXIMAMENTE,
    nivel: 'Intermedio',
    icono: 'DB',
    color: '#00758f',
    colorTexto: '#ffffff',
    totalUnidades: 5,
    totalLecciones: 11,
    horasEstimadas: 8,
    etiquetas: ['Datos', 'Back-end']
  },
  {
    id: 'java',
    nombre: 'Java',
    slug: 'java',
    descripcion:
      'Programacion orientada a objetos con tipado estatico. Clases, objetos, herencia y colecciones.',
    estado: ESTADO_CURSO.BLOQUEADO,
    nivel: 'Intermedio',
    icono: 'Ja',
    color: '#f89820',
    colorTexto: '#1f2933',
    totalUnidades: 7,
    totalLecciones: 18,
    horasEstimadas: 16,
    etiquetas: ['POO', 'Back-end'],
    requisito: 'Completa el curso de JavaScript para desbloquearlo'
  },
  {
    id: 'cpp',
    nombre: 'C++',
    slug: 'cpp',
    descripcion:
      'Rendimiento y control de la memoria. Punteros, referencias, structs y el manejo manual de recursos.',
    estado: ESTADO_CURSO.BLOQUEADO,
    nivel: 'Avanzado',
    icono: 'C++',
    color: '#00599c',
    colorTexto: '#ffffff',
    totalUnidades: 7,
    totalLecciones: 19,
    horasEstimadas: 20,
    etiquetas: ['Sistemas', 'Videojuegos'],
    requisito: 'Necesitas un curso intermedio completado'
  }
]

/** Busca un curso por su id. */
export function obtenerCurso(id) {
  return cursos.find((curso) => curso.id === id) ?? null
}
