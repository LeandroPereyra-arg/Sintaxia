# 11. Registro de pruebas de la etapa 3

Pruebas del pase del contenido a la base de datos relacional. Todas se corren
con un navegador real (Chromium) contra la base creada con los scripts de
[`supabase/`](../supabase/), ejecutando cada consulta con el rol `anon`: el mismo
rol y los mismos permisos que tiene el navegador contra Supabase. Por eso las
pruebas de seguridad valen: las responde PostgreSQL, no el codigo de la prueba.

Script: [`pruebas/etapa3.mjs`](../pruebas/etapa3.mjs) · se corre con `npm run pruebas:etapa3`.

## 11.1 Como reproducirlas

```bash
# 1. Base local con los mismos scripts que se ejecutan en Supabase
node pruebas/preparar-base-local.mjs

# 2. Puente que expone esa base como la API de Supabase
node pruebas/servidor-supabase-local.mjs

# 3. La aplicacion, apuntando ahi
VITE_SUPABASE_URL=http://localhost:5599 \
VITE_SUPABASE_PUBLISHABLE_KEY=clave-de-prueba-local \
npm run dev -- --port 5174

# 4. Las pruebas
npm run pruebas:etapa3
```

> Se usa una base local y no el proyecto real de Supabase porque las claves del
> proyecto no se suben al repositorio. El esquema, los datos, las politicas de
> RLS y la funcion de comprobacion son **exactamente los mismos scripts**.

## 11.2 Resultados

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | Consultar los contenidos desde dos navegadores distintos | Los dos ven la misma lista de 6 cursos traida de la base | escritorio: 6 cursos · celular: 6 cursos · iguales: true | PASA |
| 2 | Cambiar un titulo desde la base y volver a consultar | La pantalla muestra el titulo nuevo al recargar | antes: "Primeros pasos" · despues: "Primeros pasos (editado)" | PASA |
| 3 | Cada pantalla muestra solamente los contenidos relacionados | Curso -> solo sus unidades; unidad -> solo sus lecciones; leccion -> solo sus preguntas y opciones | unidades 6/6 · lecciones 3/3 · opciones 4/4 · ELEGI LA OPCION CORRECTA · EJERCICIO 1 DE 4 | PASA |
| 4 | Las unidades y las lecciones salen en orden | Unidades 1 a 6 y lecciones 1, 2 y 3, segun el campo orden | 6 unidades · 1. Que es JavaScript · 2. Variables y constantes · 3. Tipos de datos | PASA |
| 5 | Entrar a un identificador que no existe | Mensaje claro, sin boton de reintentar (reintentar no lo arregla) y con una salida | aviso: true · salidas: true · sin boton de reintentar: true | PASA |
| 6 | Consulta sin conexion y reintento | Se avisa que no se pudo cargar, se ofrece reintentar y al reintentar aparecen los cursos | aviso: true · boton: true · cursos tras reintentar: 6 | PASA |
| 7 | Si falla la comprobacion, la respuesta no se da por incorrecta | Se avisa, no se pierde una vida y al reintentar se corrige bien | vidas: 3 · sin devolucion mientras fallaba: true · tras reintentar: Muy bien! El navegador trae un motor de  | PASA |
| 8 | Un visitante no puede crear, modificar ni borrar contenidos | Las tres operaciones son rechazadas y el contenido queda igual | crear: 403 · modificar: 403 · borrar: 403 · curso sigue siendo "JavaScript" | PASA |
| 9 | Las soluciones no se pueden consultar desde el cliente | Pedir es_correcta, explicacion o select=* es rechazado por la base | es_correcta: 403 · explicacion: 403 · select=*: 400 · la pagina no trae la solucion: true | PASA |
| 10 | Completar una leccion y obtener el resultado | La pantalla de resultados muestra actividades, correctas, incorrectas y porcentaje | 4 Actividades 4 Correctas 0 Incorrectas 100 % Precision | PASA |
| 11 | Una unidad sin contenido publicado queda identificada como no disponible | La unidad se abre pero avisa que todavia no tiene lecciones | Muestra el aviso de unidad sin lecciones publicadas | PASA |
| 12 | Respuesta incorrecta: el servidor devuelve la correccion y la explicacion | Se ve el texto "Respuesta incorrecta", cual era la correcta y la explicacion | Respuesta incorrecta Respuesta correcta: En el navegador de quien visita la pagina El navegador trae un motor  | PASA |
**12 casos · 12 pasan · 0 fallan · errores de pagina: ninguno.**

Ademas se volvieron a correr las 11 pruebas de la etapa 2
(`npm run pruebas:etapa2`), que verifican el recorrido de actividades y la
pantalla de resultados: **11 de 11 pasan, sin errores de pagina**. Eso confirma
que cambiar la fuente de datos no rompio el comportamiento anterior.

## 11.3 Problemas encontrados y correcciones

### P1 · La portada se rompia al quedarse sin la lista de cursos

**Que pasaba.** Al entrar a la pagina de inicio, la consola mostraba
`Cannot read properties of undefined (reading 'length')` y la seccion de cifras
quedaba a medias.

**Causa.** `HomeView.vue` seguia usando la variable `cursos`, que antes venia
importada del archivo de datos de prueba. Al pasar a Supabase esa variable dejo
de existir, pero habia quedado un uso suelto en la plantilla
(`{{ cursos.length }} lenguajes en camino`). Vue no avisa de eso al compilar:
falla recien al dibujar.

**Correccion.** Se reemplazo por `catalogo.cursos.length`, que lee del catalogo
cargado. Se recorrieron todas las pantallas con el navegador verificando que no
quedaran errores de consola: ahora son cero.

### P2 · El aviso de "sin conexion" tardaba mucho en aparecer

**Que pasaba.** Con la red cortada, la pantalla se quedaba en "Cargando los
cursos..." unos ocho segundos antes de mostrar el error y el boton de reintentar.
La primera version de la prueba esperaba cinco segundos y daba el caso por
fallado.

**Causa.** No era un error de la aplicacion: el cliente de Supabase reintenta
solo la peticion varias veces antes de darse por vencido. El aviso aparece
cuando termina de reintentar.

**Correccion.** Se dejo el reintento automatico (es util: una caida de un segundo
se resuelve sin molestar a nadie) y se ajusto la espera de la prueba. Queda
anotado como comportamiento esperado, con el comentario correspondiente en el
codigo de la prueba.

### P3 · Las pruebas de la etapa 2 buscaban el aviso donde ya no estaba

**Que pasaba.** El caso 8 de la etapa 2 ("abrir una leccion con identificador
inexistente") empezo a fallar, aunque en el navegador el aviso se veia bien.

**Causa.** Los mensajes de error se centralizaron en el componente
`EstadoConsulta.vue`, asi que el titulo paso de `.vacio h1` a `.estado h2`. La
prueba seguia buscando el selector viejo.

**Correccion.** Se actualizo el selector de la prueba. No hubo cambios en la
aplicacion: el comportamiento era correcto.

### P4 · Las direcciones viejas dejaban de funcionar

**Que pasaba.** Al generalizar las rutas (de `/cursos/javascript/unidades/js-u1`
a `/unidades/js-u1`, para que el curso salga del identificador de la base y no
este escrito en la URL), cualquier enlace anterior daba "pagina no encontrada".

**Causa.** El cambio de rutas no contemplo las direcciones ya publicadas.

**Correccion.** Se agregaron redirecciones en el router para las cuatro formas
viejas de URL. El caso 8 de la etapa 2, que todavia usa las direcciones viejas,
pasa sin modificarlas.

## 11.4 Cobertura de lo pedido

| Prueba pedida | Caso |
|---|---|
| Consultar los contenidos desde dos dispositivos o navegadores | 1 |
| Modificar un titulo desde Supabase y comprobar el cambio al volver a consultar | 2 |
| Verificar que cada pantalla muestra solamente los contenidos relacionados | 3 |
| Comprobar el orden de unidades y lecciones | 4 |
| Intentar acceder a un identificador inexistente | 5 |
| Comprobar el comportamiento ante una consulta sin conexion | 6 y 7 |
| Verificar que un visitante no puede modificar contenidos | 8 |
| Comprobar que las soluciones no pueden consultarse directamente desde el cliente | 9 |
| Completar una leccion y obtener su resultado | 10 |

Los casos 11 y 12 se agregaron por cuenta propia: una unidad sin contenido
publicado tiene que quedar identificada como no disponible, y la devolucion de
una respuesta incorrecta tiene que traer la correccion y la explicacion desde el
servidor.
