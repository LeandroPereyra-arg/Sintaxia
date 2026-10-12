# 13. Registro de pruebas de la etapa 4

Pruebas de invitados, registro, inicio de sesion, recuperacion de acceso,
conversion de invitado a cuenta y permisos. Script:
[`pruebas/etapa4.mjs`](../pruebas/etapa4.mjs).

## 13.1 Contra que se prueba (y que es de verdad)

Es lo mas importante para saber cuanto valen estos resultados.

| Pieza | Es... |
|---|---|
| **Supabase Auth** (altas anonimas, registro, correos, recuperacion, conversion) | **El servidor real de Supabase (GoTrue)**, compilado desde su codigo fuente (version `v1.11.1-0.20260922104245-ce9a8eee0cc0`). Lo ejecuta el mismo codigo que corre en Supabase. |
| **PostgreSQL, RLS, permisos, disparadores, funciones** | **PostgreSQL 16 real**, con los mismos siete scripts de `supabase/`. Cada consulta corre con el rol y los claims del token que la hizo. |
| Correos | Un servidor SMTP de prueba recibe los que manda Auth (equivalente local de Mailpit). |
| La app | Chromium real con la aplicacion de Vue. |
| **API de datos (PostgREST)** | **Simulada.** El PostgREST real no se pudo bajar en este entorno. La imitacion valida el JWT con la misma clave y ejecuta con el rol del token, asi que quien aplica los permisos es PostgreSQL; pero la capa HTTP (formato de errores, codigos de estado) es una aproximacion. |

**No es el proyecto real de Supabase en la nube.** Las claves de ese proyecto no se
suben al repositorio y no hay acceso desde aca. Lo que depende de la nube esta en
13.4.

## 13.2 Como reproducirlas

```bash
npm run auth:compilar        # compila Supabase Auth (hace falta Go; una sola vez)
npm run supabase:local       # arma la base desde cero con los scripts de supabase/
npm run pruebas:entorno      # Auth + API de datos + correos + la app (queda corriendo)

# en otra terminal
npm run pruebas:etapa4       # esta etapa
npm run pruebas:etapa3       # regresion: contenido y permisos de la etapa 3
URL_APP=http://localhost:5174 npm run pruebas:etapa2   # regresion: lecciones y resultados
```

`SOLO=14,27 npm run pruebas:etapa4` corre unicamente esos casos.

## 13.3 Resultados

Los nueve puntos que pide la consigna estan cubiertos por estos casos:

| Prueba pedida | Casos |
|---|---|
| Dos invitados distintos | 1, 2, 3 |
| Registro | 5, 6, 10 |
| Correo ya utilizado | 7, 8, 16 |
| Contrasena invalida | 9 |
| Cierre y reapertura | 11, 12, 3 |
| Conversion a cuenta | 14, 15, 16, 17 |
| Acceso no autorizado a otro perfil | 21, 22, 24 |
| Limites de altas anonimas | 27, 25, 26, 3 |
| Recuperacion de acceso | 18, 19, 20, 35 |

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | Dos invitados distintos reciben usuarios y perfiles propios | Dos sesiones anonimas con ids distintos, cada una con su perfil "Invitado#codigo"; ninguna ve el perfil de la otra | ids distintos · perfiles Invitado#5630 y Invitado#7278 · cada uno ve solo el propio (1 fila) | PASA |
| 2 | El alias que manda el cliente a un invitado se ignora | Un invitado que intenta registrarse con alias "Hacker" queda como "Invitado" | metadatos {alias:"Hacker"} -> perfil "Invitado", es_invitado=true | PASA |
| 3 | Restaurar la sesion no crea otro invitado | Recargar y reabrir la app reutiliza la sesion guardada: la cantidad de invitados no aumenta | 3 recargas + pagina nueva: sigue siendo Invitado#1202 · invitados 56 -> 56 | PASA |
| 4 | Un invitado no conserva su sesion en otro dispositivo | En un navegador distinto no hay sesion: la ruta protegida manda a ingresar | en el otro dispositivo /perfil redirige a /ingresar?volver=/perfil | PASA |
| 5 | Registro con correo y confirmacion | Llega el correo, el enlace confirma la cuenta, se abre la sesion y el perfil tiene el alias elegido | correo "Confirm your email address" -> confirmada -> perfil Ana_Dev#7487 (insignia Cuenta) | PASA |
| 6 | Registro con la confirmacion de correo desactivada | La sesion se abre al instante, sin esperar ningun correo, y el perfil tiene el alias elegido | sin esperar correo: /perfil?cuenta=creada, Inmediata#9910 · correos enviados: 0 | PASA |
| 7 | Registro con un correo ya utilizado | Avisa que ese correo ya tiene cuenta, ofrece ingresar o recuperar, y no crea una cuenta duplicada | mensaje "ya tiene una cuenta" · enlaces a ingresar y recuperar · cuentas con ese correo: 1 | PASA |
| 8 | Correo ya utilizado con la confirmacion desactivada | El servidor responde con un error explicito (user_already_exists) y la app lo muestra; no se duplica la cuenta | mensaje "ya tiene una cuenta" · cuentas con ese correo: 1 | PASA |
| 9 | Contrasena invalida | La app rechaza una contrasena corta sin llamar al servidor, y traduce el rechazo del servidor (weak_password) | formulario: rechaza "abc" sin pedido al servidor · servidor: 422 weak_password · app: "demasiado debil" | PASA |
| 10 | Reglas del alias en el formulario | Un alias reservado, muy corto o con tilde se rechaza en pantalla, sin llamar al servidor | rechazados en pantalla: admin, ab, Martín, _sombra, Invitado · pedidos al servidor: 0 | PASA |
| 11 | Cierre y reapertura de sesion de una cuenta | Al reabrir la app la sesion se restaura; al cerrar sesion se pierde y las rutas protegidas piden ingresar | login -> Sesionista#5944 · reapertura restaura · cerrar sesion borra la sesion · /perfil -> /ingresar | PASA |
| 12 | Un invitado que cierra sesion recibe la advertencia | Se avisa que pierde el historial para siempre, se puede quedar, y solo sale si confirma | advertencia visible · "Quedarme" conserva la sesion · "Salir igual" la cierra | PASA |
| 13 | Rutas protegidas y redireccion segura | Sin sesion se manda a ingresar y se vuelve a la ruta pedida; una direccion externa en ?volver se descarta | protegida -> /ingresar?volver=... -> vuelve a la leccion · //sitio-malo.com -> /perfil · https://sitio-malo.com -> /perfil | PASA |
| 14 | Convertir un invitado en cuenta (confirmacion de correo activada) | Es el MISMO usuario: conserva su id y su historial, no se crea otra cuenta, y sigue siendo invitado hasta confirmar el correo | mismo id · invitado hasta confirmar · luego Convertida#2847 con 10 XP · usuarios 102->102 · intentos 1->1 | PASA |
| 15 | Convertir un invitado con la confirmacion desactivada | La conversion es inmediata: mismo usuario, historial intacto, y ya es cuenta sin esperar ningun correo | mismo id · ya es cuenta al instante (Instantanea#1563) · historial: 1 intento | PASA |
| 16 | Convertir un invitado con un correo que ya tiene cuenta | Se rechaza con un mensaje claro y la persona sigue siendo el mismo invitado, sin perder nada | mensaje "ya tiene una cuenta" · el invitado sigue siendo el mismo, sin correo | PASA |
| 17 | Un invitado entra a una cuenta que ya existe | La app advierte que los historiales no se fusionan, exige confirmarlo, y no copia nada de un lado al otro | advertencia + confirmacion obligatoria · ahora Destino#7740 · historial de la cuenta: 1 intento, del invitado: 1 (no se fusionaron) | PASA |
| 18 | Recuperar el acceso en el mismo dispositivo | Se pide el enlace, llega por correo, permite elegir una contrasena nueva y la vieja deja de servir | enlace "Reset your password" -> contrasena cambiada · la vieja: 400 invalid_credentials · la nueva: 200 | PASA |
| 19 | El enlace de recuperacion abierto en otro dispositivo | Explica por que no sirve y ofrece pedir uno nuevo, en lugar de dejar la pantalla rota | otro dispositivo -> "Este enlace no sirve" + explicacion + "Pedir un enlace nuevo" · no se abre sesion | PASA |
| 20 | Recuperacion con un correo que no tiene cuenta | Responde igual que si existiera (no revela quien esta registrado) y no manda ningun correo | mismo mensaje que con una cuenta real · correos enviados: 0 | PASA |
| 21 | Cada participante ve solo su perfil y su historial | Pidiendo todo, cada uno recibe unicamente lo propio; sin sesion no se ve nada | A ve 1 perfil y 1 intento · perfil de B por id: 0 filas · sin sesion: HTTP 401 y 401 | PASA |
| 22 | Nadie puede modificar datos ajenos ni los campos protegidos | Modificar o borrar lo de otro no hace nada; tocar es_invitado, codigo o usuario_id esta prohibido | sobre B: PATCH 0 filas, DELETE 0 filas · es_invitado/codigo/id: 403 · alias de invitado: 400 (ck_perfiles_invitado) · insertar a nombre de B, crear y borrar perfil: 403 · aciertos>total: 400 · leccion inexistente: 409 · B intacto | PASA |
| 23 | Reglas del alias y codigo que distingue nombres iguales | Se rechazan alias reservados, cortos, con tilde o con guion al borde; dos personas pueden llamarse igual con codigos distintos | rechazados (9): admin, Sintaxia, ab, Invitado, Martín, _ana, ana_, a*21, con espacio · "Ana_Dev" valido · 3 personas "Gemela" con codigos 2199, 1988, 9835 | PASA |
| 24 | Rol publico, invitado autenticado y cuenta: quien puede que | Los tres leen el contenido; solo invitado y cuenta tienen perfil e historial; la base distingue invitado de cuenta | publico: 6 cursos, perfil HTTP 401 · invitado (rol authenticated, is_anonymous=true): perfil 1, es_invitado()=true · cuenta (is_anonymous=false): perfil 1, es_invitado()=false | PASA |
| 25 | Tope de intentos para invitados (politica restrictiva) | Un invitado puede guardar hasta 200 intentos y el 201 se rechaza; una cuenta permanente no tiene ese tope | invitado: 200 intentos -> el 201 da HTTP 403 (tiene 200) · cuenta: el 201 da HTTP 201 | PASA |
| 26 | Limpieza de invitados abandonados | Solo service_role puede ejecutarla; borra al invitado inactivo (con su perfil e historial) y no toca cuentas ni invitados con actividad | invitado/publico/cuenta: HTTP 403/401/403 · service_role borro 1 · inactivo borrado con su perfil e historial · reciente, con actividad y cuenta vieja intactos | PASA |
| 27 | Limite de altas anonimas | Pasado el limite por conexion, Auth responde 429 y la app lo explica; el limite se levanta y vuelve a andar | 3 altas ok y 5 con HTTP 429 (200,200,200,429,429,429,429,429) · la app dice "demasiados intentos" y no crea sesion · el catalogo sigue visible · sin el limite, vuelve a funcionar | PASA |
| 28 | Ingresar sin conexion y reintentar | Avisa que no hay conexion (sin crear nada) y, al volver la red, el mismo boton funciona | sin red: "No hay conexion con el servidor" y sin sesion · con red: el mismo boton entra | PASA |
| 29 | Falla el guardado al terminar una leccion | El resultado no se pierde: se muestra con un aviso y, al volver la conexion, se guarda con "Reintentar guardado" | con la falla: resultado visible + aviso, guardados 0 · tras reintentar: guardados 1 | PASA |
| 30 | Calculo de XP, racha y calendario desde el historial | Repetir una leccion no suma XP de mas, un intento peor no resta, y la racha cuenta dias seguidos | repetir x3: 10 XP · mejorar 2/4 -> 4/4: +5 · intento peor: no resta · racha 3 dias / rota=1 / solo ayer=1 / hace 3 dias=0 / vacio=0 | PASA |
| 31 | Pantallas de acceso en el celular | Ninguna desborda a lo ancho a 412, 360 ni 320 px, ni siquiera con el alias y el codigo mas anchos posibles | 23 mediciones sin desborde, incluido /perfil con "WWWWWWWWWWWWWWWWWWWW#8888" a 360 y 320 px | PASA |
| 32 | La etapa 3 sigue andando sin sesion | Sin ingresar se ve el catalogo de cursos y las unidades del curso; la correccion de respuestas sigue disponible | 6 cursos y 6 unidades visibles sin sesion · comprobar_respuesta responde 200 | PASA |
| 33 | Se informa que datos se guardan y cuales son publicos | Al crear la cuenta se puede leer que se guarda (correo cifrado, alias, historial) y que hoy no se muestra nada a otras personas | visible junto al formulario: que se guarda, que es publico ("Hoy, nada."), y el riesgo de ser invitado | PASA |
| 34 | Volver a correr los scripts no deshace permisos ni datos | Re-ejecutar 02, 05, 06 y 07 deja igual el contenido, los perfiles, el historial y lo que cada persona puede hacer | scripts 02, 05, 06, 07 re-ejecutados · datos iguales (119 perfiles, 1227 intentos) · el invitado sigue viendo su perfil, sin sesion sigue 401, es_invitado sigue protegido (403) | PASA |
| 35 | El enlace de confirmacion abierto en otro dispositivo | El correo queda confirmado pero no se abre sesion alli; la pantalla lo explica y con la contrasena se ingresa | otro dispositivo: "Tu correo esta confirmado", sin sesion · correo confirmado en la base · luego ingresa con la contrasena como Dispositiva#5593 | PASA |

**35 casos · 35 pasan · 0 fallan · 0 excepciones no atrapadas en la pagina.**

Se probo con la confirmacion de correo **activada** (casos 5, 7, 14, 16–20, 35) y
**desactivada** (casos 6, 8, 15), porque Supabase permite las dos.

Regresion, con la misma base y el mismo entorno: **etapa 3, 12 de 12** y
**etapa 2, 11 de 11**. Las dos suites se adaptaron para entrar como invitado
(las lecciones ahora exigen sesion) y la de la etapa 3 para usar la clave real del
entorno (con la clave falsa de antes, las pruebas de "rechazado" habrian pasado por
el motivo equivocado: token invalido en lugar de RLS).

Tambien se comprobo que **se reproduce desde cero**: la base se destruyo y se
reconstruyo con `npm run supabase:local`, y la suite dio 34/34 sobre ese estado
limpio (el caso 35 se agrego despues, y la tabla de arriba es de la corrida final).

## 13.4 Problemas encontrados y correcciones

Los cuatro primeros son **defectos reales del proyecto** que aparecieron al correr las
pruebas, no al escribir el codigo. El quinto se detecto al disenar, antes de que
llegara a ocurrir.

### P1 · La politica del tope de invitados bloqueaba el guardado de todo el historial
**Que pasaba.** Nadie podia guardar una leccion (casos 14 y 17: el historial quedaba
en 0).
**Causa.** La politica restrictiva contaba los intentos con una subconsulta a su
propia tabla, y PostgreSQL responde `infinite recursion detected in policy`.
**Correccion.** El conteo paso a una funcion `SECURITY DEFINER`
(`cantidad_intentos_propios`), que no pasa por RLS y filtra por `auth.uid()`.

### P2 · Cambiar de alias no funcionaba
**Que pasaba.** El cambio de alias de una cuenta daba 403 (caso 23).
**Causa.** El disparador que asigna el codigo corria con los permisos de quien edita:
no podia leer la columna `alias_normalizado` (sin permiso para el cliente) y, por RLS,
solo veria su propia fila, asi que tampoco sabria que codigos usan otras personas.
**Correccion.** `fn_perfiles_asignar_codigo` es `SECURITY DEFINER`.

### P3 · Volver a correr el script 05 dejaba la base sin permisos
**Que pasaba.** Tras re-ejecutar `05-perfiles-y-progreso.sql`, 14 casos fallaban: los
perfiles dejaban de verse. (Las pruebas mostraban "ve perfiles ajenos", que en
realidad era un 403 mal interpretado.)
**Causa.** El `revoke all` de ese script borraba los permisos que habia dado el `06`.
El script decia poder re-ejecutarse, y no era cierto.
**Correccion.** Los permisos pasaron a manejarse **solo** en el `06`, que cierra y
reabre lo necesario. Se agrego el **caso 34**, que re-ejecuta los scripts y comprueba
que ni los datos ni los permisos cambian, para que no vuelva a pasar sin avisar.

### P4 · El perfil desbordaba a lo ancho en pantallas chicas
**Que pasaba.** A 360 px el perfil medía 374 px, **solo a veces** (caso 31).
**Causa.** El contenedor era una grilla de columna `auto`: crecia hasta el contenido
mas ancho (el alias con su codigo) y arrastraba a todas las tarjetas fuera de la
pantalla. Como el codigo es aleatorio, dependia de la suerte (`Invitado#8888` es mas
ancho que `Invitado#1111`), por eso no se reproducia a mano.
**Correccion.** Columna `minmax(0, 1fr)`, titulo que puede partirse, y cabecera en
una columna a 480 px o menos. El caso 31 ahora prueba el **peor caso a proposito**
(alias de 20 letras anchas con el codigo `8888`, a 360 y 320 px). Se comprobo que
**falla sin la correccion** (a 320 px medía 348) y pasa con ella.

### P5 · Re-ejecutar el contenido habria borrado el historial
**Que habria pasado** (no llego a ocurrir): `02-datos-iniciales.sql`
hacia `delete from cursos` y, con el historial de las personas apuntando a las
lecciones, el borrado en cascada se lo habria llevado puesto.
**Correccion.** El generador produce un *upsert* (`insert … on conflict do update`).
Consecuencia: ya no borra lo que se saque del contenido de origen.

### Problemas del entorno de pruebas (no del proyecto)
- **El limite de altas anonimas no se aplicaba** (caso 27). Supabase Auth solo limita
  por IP si sabe de que cabecera sacarla; se configuro (`GOTRUE_RATE_LIMIT_HEADER`),
  como hace Supabase detras de su proxy. Al activarlo, el resto de los limites (30
  ingresos o altas cada 5 minutos por IP) se agotaban con las decenas de altas de la
  suite, asi que se levantaron salvo el de altas anonimas. Sirve de aviso real: un aula
  detras de una misma IP comparte esos cupos (ver 12.8).
- **Los enlaces de los correos perdian `/auth/v1`**: Auth arma la ruta con
  `MAILER_URLPATHS_*`, que tiene que llevar la ruta completa.
- **Una corrida cortada a la mitad dejo apagado el disparador de codigos**, y despues
  todas las altas fallaban con 500. Ahora el paso que lo apaga usa `try/finally`, y la
  suite se autoverifica al arrancar y lo reactiva si lo encuentra apagado.
- Auth guarda los correos en **minusculas** (la prueba buscaba con mayusculas), y pedir
  `return=representation` sin `select` devuelve todas las columnas, algunas sin
  permiso para el cliente (la app siempre enumera las columnas).

## 13.5 Lo que NO se probo

- **El APK.** No existe todavia (la app es web; el APK llega con el rediseño en
  Quasar). Queda pendiente probar, dentro del APK, que cada enlace de correo abra la
  app, que la sesion se abra y el flujo de recuperacion. Ver 12.7.
- **El proyecto real de Supabase en la nube**: entrega real de correos con un
  proveedor SMTP, los limites configurados en el panel, y que los ajustes de 12.6
  esten cargados.
- **La capa HTTP de PostgREST real**: se uso una imitacion (13.1).
- **CAPTCHA** en el alta anonima: no esta implementado.
- **Expiracion del token**: la sesion dura una hora y no se espero a que se renovara
  sola; lo que se probo es que se restaura al reabrir.
- **Concurrencia en el codigo del alias**: dos personas eligiendo el mismo alias en el
  mismo instante podrian recibir el mismo codigo; la restriccion unica lo rechaza y
  la app pide volver a intentar. Probabilidad ínfima (1 en 9999) y no se simulo.
- **Clientes de correo reales** y su comportamiento al abrir enlaces.
- **Inicio de sesion con Google o GitHub**: no se migro (ver 12.9).
