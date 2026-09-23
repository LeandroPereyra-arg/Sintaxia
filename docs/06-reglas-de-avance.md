# 6. Reglas de avance y finalizacion

Este documento define, para la segunda etapa, cuando una leccion se considera
**completada**, cuando **aprobada**, y que hace falta para que se habilite la
siguiente. Son las reglas que implementa `src/composables/useProgreso.js`.

---

## 6.1 Los dos estados de una leccion

La consigna pide distinguir "completada" de "aprobada". La diferencia es esta:

| Estado | Condicion | Que significa |
|---|---|---|
| **Sin empezar** | No hay ningun intento registrado | El estudiante todavia no la resolvio |
| **Completada** | Respondio **todas** las actividades de la leccion | Llego hasta el final, sin importar cuanto acerto |
| **Aprobada** | Ademas de completarla, acerto **60 % o mas** | Demostro que entendio el tema |

```
                  responde todas          acierta 60 % o mas
  sin empezar  ────────────────────►  completada  ──────────────────►  aprobada
                                          │
                                          └── menos de 60 %: sigue completada
                                              pero no aprobada
```

El umbral esta en una sola constante, `UMBRAL_APROBACION = 0.6`, para poder
cambiarlo sin tocar el resto del codigo.

### Por que 60 %

Las lecciones de la unidad desarrollada tienen 4 actividades. Con el 60 %:

| Aciertos | Porcentaje | Resultado |
|---|---|---|
| 4 de 4 | 100 % | Aprobada |
| 3 de 4 | 75 % | Aprobada |
| 2 de 4 | 50 % | Completada, no aprobada |
| 1 de 4 | 25 % | Completada, no aprobada |

Aprobar exige acertar la mayoria, pero un error no bloquea a nadie. Un umbral
mas alto (por ejemplo 75 %) obligaria a hacer todo perfecto en lecciones de tres
actividades, y eso frustra mas de lo que ensenia.

### Un caso aparte: quedarse sin vidas

Cada intento arranca con **3 vidas** y se pierde una por cada error. Si se
terminan antes de la ultima actividad, el intento se corta y la leccion
**no queda completada**, porque no llego a responder todas. Esto tambien evita
que un intento de 1 de 4 quede registrado como "completada".

---

## 6.2 Habilitar la leccion siguiente

> Una leccion se habilita cuando la **anterior de su unidad esta aprobada**.

En detalle, una leccion se puede abrir si se cumplen las tres:

1. Su unidad no esta bloqueada.
2. Es la primera de la unidad, **o** la anterior esta aprobada.
3. Excepcion: una leccion ya completada siempre se puede volver a abrir, aunque
   no este aprobada, para poder reintentarla.

Cuando una leccion esta bloqueada, la aplicacion **dice por que**
("Primero tenes que aprobar la leccion Que es JavaScript"), en vez de mostrar un
candado sin explicacion.

## 6.3 Completar una unidad y habilitar la siguiente

> Una unidad esta completa cuando **todas** sus lecciones estan **aprobadas**.

No alcanza con haberlas terminado: si la ultima quedo en 50 %, la unidad sigue
incompleta. Completar una unidad habilita la siguiente.

La barra de progreso de la unidad muestra **lecciones aprobadas sobre el total**,
asi que refleja lo mismo que la regla de desbloqueo.

## 6.4 Terminar el curso

El curso esta terminado cuando todas las unidades estan completas, es decir,
cuando las 14 lecciones estan aprobadas.

---

## 6.5 Reglas de un intento

| Regla | Como funciona |
|---|---|
| **Una respuesta por actividad** | Al confirmar, las opciones quedan bloqueadas y el boton de confirmar desaparece. Volver a apretar no suma de nuevo. |
| **No se puede confirmar sin elegir** | El boton queda deshabilitado hasta que hay una opcion seleccionada. |
| **No se puede volver atras** | Una vez confirmada una actividad, se avanza a la siguiente; no se puede corregir la anterior. |
| **Reintentar arranca de cero** | Las respuestas y el puntaje del intento anterior se descartan: vuelve a la actividad 1 con las 3 vidas. |
| **Se guarda el mejor intento** | Si el segundo intento sale peor que el primero, se conserva el mejor resultado. Reintentar nunca perjudica. |
| **XP** | La primera vez que se aprueba se gana el XP completo, proporcional a los aciertos. Al repetirla, la mitad, para que repasar sirva sin permitir inflar el puntaje. |

## 6.6 Donde vive el progreso

En esta etapa el progreso se mantiene **en memoria durante el uso** de la
aplicacion, como pide la consigna.

El proyecto ademas ya lo conserva entre sesiones (en el navegador cuando se usa
como invitado, y en la base cuando hay cuenta), porque eso venia de la etapa
anterior. Las reglas de este documento son las mismas en los dos casos: lo unico
que cambia es donde se guarda el resultado, no como se decide si algo esta
aprobado.

---

## 6.7 Donde esta implementado

| Regla | Archivo |
|---|---|
| Umbral, completada, aprobada, desbloqueo | `src/composables/useProgreso.js` |
| Bloqueo y motivo en pantalla | `src/views/UnidadView.vue`, `src/views/LeccionIntroView.vue` |
| Un intento, una respuesta por actividad | `src/views/LeccionView.vue` |
| Reinicio del intento | `src/views/LeccionView.vue` (funcion `reiniciar`) |
| Resultados del intento | `src/views/ResultadosView.vue` |
