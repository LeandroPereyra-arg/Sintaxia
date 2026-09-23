# 9. Aporte de cada integrante

> **Para completar por el equipo.** Este documento es lo unico de la entrega que
> no se puede generar desde el codigo: hay que poner los nombres y repartir el
> trabajo. Abajo esta el detalle de todo lo que incluye la segunda etapa, para
> que solo haya que asignar cada bloque y ajustar lo que haga falta.

## 9.1 Integrantes

| Integrante | Rol principal |
|---|---|
| *(nombre)* | *(por ejemplo: contenido de la unidad y actividades)* |
| *(nombre)* | *(por ejemplo: pantallas de leccion y actividades)* |
| *(nombre)* | *(por ejemplo: modelo de datos y DER)* |
| *(nombre)* | *(por ejemplo: pruebas y documentacion)* |

## 9.2 Trabajo de la segunda etapa, por bloque

| # | Bloque | Que incluye | Archivos principales | Integrante |
|---|---|---|---|---|
| 1 | **Contenido de la unidad** | Teoria y ejemplo de codigo de cada leccion; las 12 actividades de opcion multiple de la Unidad 1, con sus opciones, la respuesta correcta y la explicacion | `src/data/lecciones/unidad1.js` | |
| 2 | **Teoria del resto de las unidades** | Explicacion y ejemplo de las 11 lecciones restantes | `src/data/lecciones/unidad2-6.js` | |
| 3 | **Modulo de acceso a datos** | Centralizar la obtencion de cursos, unidades, lecciones y actividades para poder cambiar despues los archivos por la base | `src/servicios/contenido.js` | |
| 4 | **Pantalla de teoria** | Titulo, explicacion, ejemplo de codigo y boton para empezar; manejo de leccion inexistente | `src/views/LeccionIntroView.vue` | |
| 5 | **Bloque de codigo reutilizable** | Mostrar los ejemplos conservando el formato y que se lean en el celular | `src/components/BloqueCodigo.vue` | |
| 6 | **Reglas de avance** | Completada contra aprobada, umbral del 60 %, desbloqueo de la leccion siguiente y de la unidad | `src/composables/useProgreso.js` | |
| 7 | **Pantalla de actividades** | Seleccion, confirmacion, devolucion con texto, contador y bloqueo de la respuesta ya confirmada | `src/views/LeccionView.vue` | |
| 8 | **Pantalla de resultados** | Actividades, correctas, incorrectas, porcentaje, volver a la unidad e intentar de nuevo | `src/views/ResultadosView.vue` | |
| 9 | **Unidad con estado por leccion** | Lista de lecciones con su estado y el motivo del bloqueo | `src/views/UnidadView.vue` | |
| 10 | **Modelo de datos y DER** | Tablas, tipos, claves, restricciones y el diagrama en draw.io | `docs/08-modelo-de-datos.md`, `docs/der/` | |
| 11 | **Pruebas** | Los 11 casos automatizados y el registro con los problemas encontrados | `pruebas/etapa2.mjs`, `docs/07-registro-de-pruebas.md` | |
| 12 | **Documentacion** | Reglas de avance y actualizacion del README | `docs/06-reglas-de-avance.md`, `README.md` | |

## 9.3 Para la defensa

Se evalua que **cada integrante pueda explicar su parte**. Estas son las
preguntas que conviene tener preparadas segun el bloque:

| Bloque | Preguntas probables |
|---|---|
| Contenido | Por que estas actividades y no otras? Que evalua cada una de la teoria que se explico antes? |
| Modulo de datos | Por que las funciones son asincronas si hoy los datos estan en un archivo? Que habria que cambiar para leer de la base? |
| Reglas de avance | Cual es la diferencia entre completada y aprobada? Por que el umbral es 60 %? Que pasa si alguien se queda sin vidas? |
| Actividades | Como se evita que una respuesta se cuente dos veces? Por que el boton arranca deshabilitado? |
| Resultados | De donde salen los numeros? Que pasa al reintentar? |
| Modelo de datos | Como se garantiza que haya una sola respuesta correcta? Por que el estado de publicacion no alcanza para saber si un alumno aprobo? |
| Pruebas | Que problema encontraron y como lo corrigieron? |

## 9.4 Demostracion del recorrido completo

Guion sugerido para mostrar la aplicacion de punta a punta:

1. **Inicio** → "Ver cursos".
2. **Cursos** → tarjeta de JavaScript.
3. **Curso** → la Unidad 1 esta disponible y el resto bloqueado.
4. **Unidad 1** → las lecciones 2 y 3 aparecen bloqueadas, con el motivo escrito.
5. **Leccion 1** → teoria y ejemplo de codigo; "Comenzar actividades".
6. **Actividades** → mostrar los cuatro casos: confirmar sin elegir (el boton
   esta apagado), una correcta, una incorrecta con su explicacion, y que despues
   de confirmar no se puede cambiar la respuesta.
7. **Resultados** → actividades, correctas, incorrectas y porcentaje.
8. **Volver a la unidad** → la leccion 2 quedo habilitada.
9. **Reintentar** la leccion 1 → arranca de cero.
10. **En el celular** → abrir el mismo recorrido en una pantalla angosta y
    mostrar el ejemplo de codigo, que se desplaza dentro de su caja.
11. **Direccion invalida** → abrir una leccion que no existe y mostrar el aviso.
