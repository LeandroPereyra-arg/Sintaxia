# 1. Descripcion del proyecto

## Nombre

**Sintaxia** — *Aprende a programar jugando*.

El nombre viene de "sintaxis", que es justamente lo primero que frena a quien empieza a
programar, y suena parecido a un lugar ("Sintaxia" como un pais al que se viaja para aprender
el idioma). La bajada usa el mismo tono cercano que Duolingo.

## Que problema busca resolver

Aprender a programar tiene una tasa de abandono altisima. Los motivos que se repiten son
siempre los mismos:

1. **Los recursos son demasiado largos.** Un curso en video de 40 horas o un libro de 500
   paginas exige una constancia que la mayoria no sostiene.
2. **Se lee mucho y se practica poco.** El alumno mira a otro programar, entiende todo
   mientras mira y despues no sabe por donde empezar solo.
3. **No hay devolucion inmediata.** Cuando algo sale mal no se sabe por que, y sin correccion
   al instante el error se fija.
4. **No hay sensacion de avance.** Sin metas cortas ni recompensas, no se ve el progreso y se
   pierde la motivacion.
5. **No se sabe por donde seguir.** Frente a decenas de lenguajes y miles de tutoriales, no
   queda claro cual es el proximo paso.

Sintaxia ataca esos cinco puntos con la misma mecanica que Duolingo usa para los idiomas:
**lecciones muy cortas, ejercicios interactivos, correccion inmediata con explicacion, un
camino lineal que se desbloquea de a poco, y recompensas (XP, rachas y logros) que dan ganas
de volver al dia siguiente.**

La apuesta central del proyecto es esta: si aprender ingles con sesiones de cinco minutos por
dia funciona, aprender JavaScript de la misma forma tambien deberia funcionar.

## A quien esta dirigida

| Perfil | Situacion | Que espera de Sintaxia |
|---|---|---|
| **Principiante absoluto** (14-25 anios) | Nunca programo. Quiere probar si le gusta antes de anotarse en algo largo. | Empezar sin instalar nada y entender los conceptos basicos sin frustrarse. |
| **Estudiante de secundaria o terciario** | Cursa programacion y necesita practicar lo que ve en clase. | Ejercitacion guiada y repaso de temas puntuales (bucles, funciones, arrays). |
| **Persona en reconversion laboral** (25-40 anios) | Trabaja de otra cosa y estudia en los ratos libres. | Sesiones cortas que entren en el colectivo o en la pausa del almuerzo. |
| **Programador de un solo lenguaje** | Ya sabe programar y quiere sumar otro lenguaje. | Comparar sintaxis rapido, sin volver a explicaciones de "que es una variable". |

Perfil principal: **principiante hispanohablante, sin conocimientos previos y con poco tiempo
libre**. Toda la interfaz esta en espanol y no requiere instalar ningun programa.

## Funcionalidades principales

### Implementadas en esta entrega

| # | Funcionalidad | Donde se ve |
|---|---|---|
| 1 | Pagina de presentacion que explica el proposito y deja empezar en un clic | `HomeView` |
| 2 | Catalogo de cursos con tarjetas reutilizables, buscador y filtro por estado | `CursosView` + `CursoCard` |
| 3 | Curso de JavaScript con 6 unidades y su camino de aprendizaje | `CursoJavaScriptView` + `UnidadCard` |
| 4 | Detalle de unidad con el listado de lecciones y su estado | `UnidadView` |
| 5 | Pantalla de ejercicios con 4 tipos de actividad distintos | `LeccionView` + `components/ejercicios/` |
| 6 | Correccion inmediata con explicacion del por que | `BarraFeedback` |
| 7 | Sistema de vidas: 3 errores y hay que rehacer la leccion | `LeccionView` |
| 8 | Pantalla de resultados con XP, precision y que sigue | `ResultadosView` |
| 9 | Desbloqueo progresivo: cada unidad se abre al terminar la anterior | `useProgreso` |
| 10 | Perfil con XP, racha, meta diaria, avance por unidad y logros | `PerfilView` |
| 11 | Progreso persistente en el navegador (`localStorage`) | `useProgreso` |

### Previstas para proximas etapas

- Cursos de Python, HTML/CSS, SQL, Java y C++ (ya figuran en el catalogo como *proximamente*).
- Editor de codigo real con ejecucion en el navegador y validacion de la salida.
- Tabla de posiciones semanal entre estudiantes (ligas).
- Repaso espaciado de los ejercicios fallados.
- Cuentas de usuario con backend, para sincronizar el progreso entre dispositivos.

## Como se mide que funciona

- Que el estudiante vuelva al dia siguiente (racha promedio).
- Cuantos terminan la unidad 1 completa.
- Precision promedio por unidad: si una unidad tiene precision muy baja, el contenido esta
  mal explicado o los ejercicios estan mal redactados.
