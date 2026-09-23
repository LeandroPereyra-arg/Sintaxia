# 7. Registro de pruebas

Pruebas de la segunda etapa sobre el recorrido principal: curso, unidad,
leccion, actividades y resultados.

- **Como se corrieron:** de forma automatizada con Playwright sobre Chromium,
  contra la aplicacion levantada con `npm run dev:todo`.
- **Script:** las pruebas son reproducibles; el guion esta descrito al final.
- **Ultima corrida:** 11 casos, **11 pasan, 0 fallan**, sin errores de consola.
- **Unidad usada:** Unidad 1 - Primeros pasos, leccion `js-u1-l1` (4 actividades).

---

## 7.1 Casos pedidos por la consigna

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | Confirmar sin seleccionar una opcion | El boton Comprobar esta deshabilitado y no pasa nada | Boton deshabilitado; no avanza | PASA |
| 2 | Responder correctamente | Dice "Muy bien!" con texto, no solo color, y muestra la explicacion | "Muy bien!" con explicacion visible | PASA |
| 3 | Responder incorrectamente | Dice "Respuesta incorrecta", muestra cual era la correcta y por que | "Respuesta incorrecta" con la opcion correcta y la explicacion | PASA |
| 4 | Presionar varias veces el boton de confirmacion | La respuesta se cuenta una sola vez y no se puede cambiar | El boton Comprobar desaparece al confirmar y las 4 opciones quedan bloqueadas | PASA |
| 5 | Completar la ultima actividad | La ultima actividad lleva a la pantalla de resultados | Contador "ejercicio 4 de 4" y redireccion a `/resultados` | PASA |
| 6 | Repetir una leccion | El intento arranca de cero | Vuelve a "ejercicio 1 de 4" con las 3 vidas | PASA |
| 7 | Volver a la unidad | Vuelve a la pantalla de la unidad | Llega a `/cursos/javascript/unidades/js-u1` | PASA |
| 8 | Abrir una direccion con un identificador de leccion inexistente | Avisa que no existe y ofrece una salida, sin pantalla rota | "No encontramos esa leccion" con 2 accesos de salida | PASA |
| 9 | Usar la aplicacion en una pantalla de tamanio movil (412 px) | Ninguna pantalla desborda a lo ancho | Anchos 412 en las 5 pantallas del recorrido; el ejemplo de codigo se desplaza dentro de su caja | PASA |

## 7.2 Casos agregados

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 10 | La pantalla de resultados muestra los cuatro datos pedidos | Actividades, correctas, incorrectas y porcentaje | "4 Actividades / 4 Correctas / 0 Incorrectas / 100 % Precision" | PASA |
| 11 | Aprobar la leccion 1 habilita la leccion 2 | La leccion 2 deja de estar bloqueada | Leccion 2 habilitada despues de aprobar la 1 | PASA |

---

## 7.3 Problemas encontrados y corregidos

Durante estas pruebas aparecieron dos problemas. Los dos se corrigieron y se
volvieron a probar.

### P1 - La pantalla de teoria desbordaba a lo ancho en el celular

- **Como se detecto:** caso 9. En un viewport de 412 px, la pagina medía
  **527 px** de ancho, asi que la pantalla se movia en horizontal.
- **Causa:** el ejemplo de codigo va dentro de un `<pre>` con `white-space: pre`,
  y los hijos de una grilla CSS tienen `min-width: auto`. La columna crecia hasta
  el ancho de la linea de codigo mas larga y estiraba toda la tarjeta.
- **Correccion:** `min-width: 0` en los hijos de la tarjeta y en el bloque de
  codigo, para que el desplazamiento quede **dentro** de la caja del ejemplo y no
  empuje la pagina.
- **Archivos:** `src/views/LeccionIntroView.vue`, `src/components/BloqueCodigo.vue`
- **Resultado:** las 5 pantallas del recorrido miden 412 px. Caso 9 pasa.

### P2 - Los contadores de resultados se leian a mitad de la animacion

- **Como se detecto:** caso 10 devolvia "1 Correctas / 0 Incorrectas / 37 %"
  cuando el intento habia sido 4 de 4.
- **Causa:** no era un error de la aplicacion. Los numeros de la pantalla de
  resultados suben animados (`useContador`), y la prueba los leia antes de que
  terminara la animacion.
- **Correccion:** se corrigio **la prueba**, esperando a que los contadores
  lleguen a su valor final antes de leerlos.
- **Resultado:** "4 Actividades / 4 Correctas / 0 Incorrectas / 100 %". Caso 10 pasa.

---

## 7.4 Verificaciones adicionales

Ademas de los casos anteriores, se comprobo que:

- Las pantallas de inicio, cursos, curso, unidad, teoria y actividades cargan y
  se navega entre ellas sin errores de consola.
- Abrir una **unidad** inexistente tambien muestra el aviso y una salida.
- Las lecciones 2 y 3 arrancan bloqueadas, con el motivo escrito en pantalla.
- El recorrido completo del curso (14 lecciones, 44 actividades) sigue andando
  despues de los cambios de esta etapa.

---

## 7.5 Como repetir las pruebas

```bash
# 1. Levantar la aplicacion
npm run dev:todo

# 2. Correr el guion de pruebas (necesita Playwright)
node pruebas/etapa2.mjs
```

El guion recorre los 11 casos, imprime la tabla de arriba y termina con un
resumen de cuantos fallan. No depende de datos previos: limpia el progreso del
navegador antes de cada caso.
