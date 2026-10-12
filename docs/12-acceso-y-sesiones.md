# 12. Invitados, registro e inicio de sesion (etapa 4)

Como entra la gente a Sintaxia, que datos se guardan, quien puede ver que, y que
hay que configurar en Supabase para que funcione. Todo se apoya en **Supabase
Auth**: ninguna contrasena pasa por una tabla propia.

- Diagrama entidad-relacion: [`der/sintaxia-der-etapa4.drawio`](der/sintaxia-der-etapa4.drawio)
  (vista previa en [`der/sintaxia-der-etapa4.png`](der/sintaxia-der-etapa4.png))
- Scripts nuevos: [`supabase/05-perfiles-y-progreso.sql`](../supabase/05-perfiles-y-progreso.sql),
  [`06-politicas-rls-etapa4.sql`](../supabase/06-politicas-rls-etapa4.sql) y
  [`07-limpieza-invitados.sql`](../supabase/07-limpieza-invitados.sql)
- Pruebas: [`13-registro-de-pruebas-etapa4.md`](13-registro-de-pruebas-etapa4.md)

---

## 12.1 Tres formas de estar en la app

| | Sin sesion | Invitado | Cuenta |
|---|---|---|---|
| Que es | Nadie ingreso | Sesion anonima de Supabase: un usuario propio, sin correo ni contrasena | Usuario con correo y contrasena |
| Ve el catalogo de cursos | si | si | si |
| Hace lecciones y guarda progreso | no (se le pide ingresar) | si | si |
| Tiene perfil | no | si, alias **Invitado#codigo** | si, con el alias que eligio |
| Puede elegir su alias | — | **no** | si |
| Su historial sobrevive a... | — | solo a esta sesion | cerrar sesion, borrar datos, otro dispositivo |
| Aparecera en el ranking (etapa futura) | no | **no** | si |

Cada invitado es **un usuario distinto** con su propio identificador: nunca se
usa una cuenta compartida. Hasta que alguien toca "Continuar como invitado" no se
crea nada (la app no crea sesiones por su cuenta).

## 12.2 Flujos

### Invitado
`Continuar como invitado` → Auth crea un usuario anonimo → un disparador de la
base le crea el perfil `Invitado#codigo` → entra. Si ya habia una sesion, **se
reutiliza**: reabrir o recargar la app no crea otro invitado.

### Registro con correo
`Crear cuenta` (alias, correo, contrasena) → con la **confirmacion de correo
activada** llega un enlace; al abrirlo se confirma la cuenta y se abre la sesion.
Con la confirmacion desactivada la sesion se abre al instante. La app funciona
con las dos configuraciones.

### Inicio y cierre de sesion
Ingresar con correo y contrasena. Cerrar sesion termina solo la sesion **de ese
dispositivo**. Una cuenta sale sin avisos (su historial queda guardado). Un
**invitado recibe una advertencia** antes de salir: perderia el historial para
siempre, y se le ofrece crear la cuenta.

### Recuperar el acceso
`Olvide mi contrasena` → correo → enlace → elegir contrasena nueva. La respuesta
es **la misma exista o no la cuenta** (no revela quien esta registrado).

### Convertir un invitado en cuenta
Es `updateUser`, **no** `signUp`: el usuario sigue siendo el mismo, con el mismo
identificador, por lo que su historial es suyo sin copiar nada desde el cliente y
sin crear otra cuenta.

1. El invitado completa alias, correo y contrasena.
2. Con confirmacion activada: Auth deja la contrasena guardada y manda el enlace.
   **Hasta abrirlo sigue siendo invitado** (la app se lo dice).
3. Al abrir el enlace, `is_anonymous` pasa a `false` y un disparador de la base
   actualiza el perfil: `es_invitado = false` y toma el alias elegido, que viajo en
   los metadatos del usuario (asi funciona aunque el enlace se abra en otro
   dispositivo).
4. Con confirmacion desactivada, la conversion es inmediata.

### Un invitado quiere entrar a una cuenta que ya existe
**En esta primera version los historiales no se fusionan.** La app lo advierte en
la pantalla de ingreso, y para entrar hay que marcar *"Entiendo que mi progreso de
invitado no se va a pasar a la cuenta a la que entro"*. El boton queda apagado
hasta marcarlo. Se le ofrece, ademas, el camino que si conserva el historial:
crear su cuenta desde el invitado. El historial del invitado queda en su usuario
anonimo (que la limpieza periodica borrara si nadie vuelve a usarlo).

## 12.3 Alias y datos

### Reglas del alias
De 3 a 20 caracteres; letras **sin tilde**, numeros y guion bajo; sin guion bajo
al principio ni al final. Quedan reservados `admin`, `administrador`, `root`,
`sintaxia`, `soporte`, `moderador`, `sistema`, `staff` y `anonimo`. `Invitado` es
el alias de los invitados y de nadie mas. Las mismas reglas estan en la base
(`public.alias_permitido`) y en el formulario (`src/utils/validaciones.js`); la
base es la que manda.

Se excluyen las tildes y los simbolos a proposito: evitan nombres que se ven
iguales pero son distintos (por ejemplo una `a` comun y una `а` cirilica).

### Distinguir a quienes se llaman parecido
Dos personas pueden elegir el mismo alias. Lo que no puede repetirse es el par
**alias + codigo**: cada perfil recibe un **codigo de 4 cifras** y se muestra como
`Ana#0427`. La comparacion ignora mayusculas (`Ana` y `ana` son el mismo alias, con
codigos distintos). Cambiar solo las mayusculas conserva el codigo; cambiar el alias
asigna uno nuevo. El codigo lo elige la base, el cliente no puede tocarlo.

### Que se guarda y que se muestra

| Dato | Donde vive | Quien lo ve |
|---|---|---|
| Correo | Supabase Auth (`auth.users`) | Solo su dueno |
| Contrasena | Supabase Auth, **cifrada** (nunca en tablas propias) | Nadie, ni nosotros |
| Alias, codigo, avatar, meta diaria | `perfiles` | Solo su dueno (hoy) |
| Historial de lecciones | `intentos_leccion` | Solo su dueno |
| Invitado | Un identificador anonimo, sin correo | Solo su dueno |

**Hoy no se muestra ningun dato a otras personas.** Cuando exista el ranking se
publicara unicamente **alias con codigo y XP de la semana**, solo de cuentas (no de
invitados), mediante una vista controlada. El correo y el historial nunca se
muestran. Esto se le explica a la persona en la pantalla de ingreso, en la de
registro y en el perfil (componente `AvisoDatos`).

## 12.4 Permisos (RLS)

Amplia [`03-politicas-rls.sql`](../supabase/03-politicas-rls.sql) de la etapa 3.

### El rol publico no es lo mismo que un invitado
En Supabase un invitado **no tiene el rol `anon`**: tiene el rol `authenticated`,
igual que una cuenta con correo. Una politica escrita `to authenticated` lo deja
pasar. Lo que lo distingue es el claim `is_anonymous` del token, que la base lee
con `public.es_invitado()`.

| Quien puede... | Publico (`anon`) | Invitado | Cuenta |
|---|---|---|---|
| Leer el contenido publicado | si | si | si |
| Comprobar una respuesta (`comprobar_respuesta`) | si | si | si |
| Ver **su** perfil | no | si | si |
| Ver el perfil de **otra** persona | no | no | no |
| Cambiar **su** avatar y meta | — | si | si |
| Cambiar **su** alias | — | **no** (restriccion de la tabla) | si |
| Cambiar `es_invitado`, `codigo`, `id` | — | no | no |
| Guardar intentos propios | no | si, **hasta 200** | si, sin tope |
| Ver / borrar intentos **ajenos** | no | no | no |
| Ejecutar la limpieza de invitados | no | no | no (solo `service_role`) |

### Como se logra
- **RLS + permisos por columna.** RLS filtra filas, los permisos por columna
  filtran columnas. Del perfil el cliente solo puede cambiar `alias`, `avatar` y
  `meta_diaria`; al insertar un intento solo manda `leccion_id`, `aciertos` y
  `total` (de quien es y cuando se hizo lo pone la base).
- **Una politica restrictiva** (`as restrictive`) le pone tope de 200 intentos a
  los invitados: crear sesiones anonimas es gratis y no pueden llenar la tabla sin
  limite. Cuenta los intentos con una funcion `SECURITY DEFINER`, porque una
  politica que consulta su propia tabla da *infinite recursion detected in policy*.
- **El perfil no se inserta ni se borra desde el cliente**: lo crea un disparador
  cuando Auth crea al usuario y lo borra `on delete cascade`.
- **Alias malo, cuenta igual.** El disparador de alta no puede bloquear un
  registro: si el alias falta o no cumple las reglas, el perfil se crea como
  `Jugador` y la persona lo cambia despues. A un invitado se le fuerza `Invitado`
  sin importar lo que mande el cliente.

### Los scripts se pueden volver a correr
`05` y `06` no borran datos ni dejan permisos abiertos al re-ejecutarse. `06` es el
unico que maneja permisos (cierra los que Supabase da por defecto y devuelve los
necesarios). `02-datos-iniciales.sql` pasa a ser un *upsert*: antes borraba el
contenido, y con historial de usuarios apuntando a las lecciones habria arrastrado
todo en cascada. `01-esquema.sql` **si** borra el contenido: solo se corre en un
proyecto nuevo.

## 12.5 Sesion, rutas protegidas y que se pierde

La sesion se guarda en el dispositivo y se renueva sola. Al abrir la app se
**restaura**, y el router espera ese paso antes de decidir si una ruta esta
protegida.

| Ruta | Sin sesion | Invitado | Cuenta |
|---|---|---|---|
| `/`, `/cursos`, `/cursos/:id`, `/ranking`, `/bienvenida` | si | si | si |
| `/ingresar`, `/registro`, `/recuperar` | si | si (con avisos) | redirige al perfil |
| `/unidades/:id`, `/lecciones/:id…`, `/perfil` | **a `/ingresar?volver=…`** | si | si |
| `/auth/callback`, `/auth/nueva-clave` | si (explican que paso) | segun el caso | si |

Despues de ingresar se vuelve a donde se queria ir. El parametro `volver` solo
acepta rutas internas: `//sitio-malo.com` o `https://…` se descartan (no es una
redireccion abierta).

**Un invitado puede perder el acceso a su historial si:**
1. **cierra sesion** (la app se lo advierte antes);
2. **borra los datos del navegador** (la sesion vive ahi);
3. **cambia de dispositivo** (la sesion no viaja);
4. queda **inactivo**: la limpieza periodica borra a los invitados sin actividad.

Crear la cuenta lo evita. El perfil de un invitado muestra este aviso siempre.

### Enlaces de los correos: PKCE
Los enlaces traen un codigo de un solo uso que **solo sirve en el dispositivo que
lo pidio** (flujo PKCE, el que Supabase recomienda para apps moviles; no deja
tokens a la vista en la direccion). Consecuencia, probada: abrir el enlace de
recuperacion en **otro dispositivo** no sirve, y la app lo explica y ofrece pedir
uno nuevo. Abrir el de confirmacion en otro dispositivo confirma el correo pero
no abre la sesion alli: se ingresa con la contrasena.

## 12.6 Que hay que configurar en el proyecto de Supabase

Lo hace una persona del equipo en el panel; no se puede hacer desde el codigo.

| Donde | Ajuste | Por que |
|---|---|---|
| Authentication → Sign In / Providers | **Allow anonymous sign-ins** activado | Sin esto "Continuar como invitado" falla |
| Authentication → Sign In / Providers → Email | **Confirm email** activado (recomendado) | La app funciona con las dos opciones |
| Authentication → URL Configuration | **Site URL** = direccion de la web | A donde vuelven los enlaces por defecto |
| Authentication → URL Configuration | **Redirect URLs**: la web (`https://…/**`) y, para la app movil, el esquema (`sintaxia://**`) | Si la direccion no esta en la lista, Supabase la ignora |
| Authentication → Password | Largo minimo **8** | La app exige 8; asi el servidor tambien |
| Authentication → Rate Limits | Revisar los valores del proyecto | Ver 12.8 |
| Authentication → SMTP | Un proveedor de correo propio | El correo incluido en Supabase tiene un cupo muy bajo; verificarlo en el panel |
| Authentication → Emails | Textos de confirmacion y recuperacion en castellano | Los enlaces vienen de ahi |
| SQL Editor | Correr los scripts `05`, `06` y `07` | El esquema de esta etapa |
| `.env` de la app | `VITE_URL_RETORNO_AUTH` (solo para la app movil) | Direccion de retorno de los enlaces |

## 12.7 App movil (APK)

La consigna pide probar registro, confirmacion y recuperacion **dentro del APK** y
revisar los enlaces de retorno. **Eso no se pudo hacer en esta etapa**: la
aplicacion todavia es web (no hay un APK que probar). El rediseño en Quasar es lo
que va a permitir generarlo. Lo que ya queda resuelto para ese momento:

- `urlDeRetorno()` (en `src/servicios/supabase.js`) arma la direccion de retorno de
  los enlaces: el propio sitio en la web, y el valor de `VITE_URL_RETORNO_AUTH`
  (por ejemplo `sintaxia://auth`) en la app movil.
- Esa misma direccion tiene que estar en *Redirect URLs* del panel.
- La app tiene que declarar el esquema `sintaxia://` para que el sistema abra la app
  desde el correo, y el codigo del enlace se canjea dentro de la app (por eso PKCE).

**Pendiente de probar en el APK:** que el enlace de cada correo abra la app y no el
navegador, que la sesion se abra, y el flujo de recuperacion completo.

## 12.8 Limites de altas anonimas

Crear un invitado es gratis, asi que es lo primero que se puede abusar. Lo que
protege hoy:

| Medida | Donde |
|---|---|
| Limite de Auth por IP | Supabase Auth (ver abajo) |
| La app no crea sesiones sola; reutiliza la existente | `useAuth`, caso 3 |
| Tope de 200 intentos por invitado | Politica restrictiva, caso 25 |
| Limpieza de invitados abandonados (30 dias) | `07-limpieza-invitados.sql`, caso 26 |
| Si Auth responde 429 la app lo explica y el catalogo sigue visible | Caso 27 |

Valores **por defecto del codigo de Auth** (en el panel se ven los del proyecto,
que pueden diferir):

| Limite | Por defecto |
|---|---|
| Altas anonimas | 30 por hora, por IP |
| Verificacion de enlaces y OTP | 30 cada 5 minutos, por IP |
| Renovacion de sesion | 150 cada 5 minutos, por IP |
| Correos enviados (todo el proyecto) | 30 por hora |

Un aula entera detras de **la misma IP** comparte esos cupos: 30 estudiantes
entrando como invitados a la vez pueden toparse con el limite de altas anonimas.
Si va a haber una demo en un aula, conviene subirlo en el panel antes.

**No esta implementado:** CAPTCHA (Turnstile / hCaptcha) en el alta anonima. Es la
defensa fuerte contra el abuso automatizado y Supabase lo soporta; necesita un
widget en la pantalla de ingreso y se deja para el rediseño.

La limpieza se programa con `pg_cron` (instrucciones en el propio script);
**no esta programada**: hay que activarla en el proyecto.

## 12.9 Decisiones y limites

- **Un invitado no elige alias.** Se llama `Invitado#codigo` hasta crear la cuenta.
  Evita moderar nombres de sesiones gratuitas; el alias se elige al crear la cuenta.
- **Registro: avisa si el correo ya existe.** Es mas claro para la persona, pero
  permite averiguar si un correo esta registrado. La recuperacion de contrasena,
  en cambio, responde siempre igual. Si mas adelante se prefiere no revelarlo, se
  cambia el mensaje del registro por uno neutro.
- **PKCE** (ver 12.5): mas seguro y apto para movil, a costa de que ciertos enlaces
  solo sirven en el dispositivo que los pidio.
- **XP, racha y calendario se calculan desde el historial**
  (`src/utils/estadisticas.js`) y no se guardan: se reconstruyen en cualquier
  dispositivo. Cambio respecto de la etapa anterior: repetir una leccion ya no da la
  mitad del XP; solo suma lo que mejora el mejor intento.
- **Las medallas se calculan en el cliente** (7 de las 14 anteriores). Las otras
  dependian del servidor Express.
- **El ranking quedo como "proximamente"**: necesita leer datos de otras personas,
  justo lo que estas politicas prohiben. Se hara con una vista publica controlada.
- **Ya no se usa** el servidor Express con MySQL, el inicio de sesion con Google y
  GitHub ni el modo de prueba de la etapa 2 (carpeta `server/`, que queda en el
  repositorio solo como referencia). Google y GitHub se pueden volver a sumar con
  `signInWithOAuth` cuando se configuren los proveedores en Supabase.
- **El perfil guarda menos** que antes (se fueron bio y pais): menos datos de
  personas que no los necesitan.
- **Modo practica:** los aciertos de un intento los informa el cliente. Los puntajes
  oficiales de la competencia se validaran en una etapa posterior.

## 12.10 Mapa de archivos

| Archivo | Que hace |
|---|---|
| `src/servicios/supabase.js` | Cliente unico, con sesion persistida y PKCE; `urlDeRetorno()` |
| `src/servicios/auth.js` | Unico lugar que llama a `supabase.auth`; traduce los errores |
| `src/servicios/perfiles.js`, `progreso.js` | Perfil propio e historial de intentos |
| `src/servicios/errores.js` | Errores compartidos; `reintentable` decide si hay boton de reintentar |
| `src/composables/useAuth.js` | Estado de la sesion para toda la app |
| `src/composables/useProgreso.js` | Progreso, derivado del historial |
| `src/utils/estadisticas.js`, `validaciones.js` | Calculos y reglas (funciones puras) |
| `src/router/index.js` | Rutas y guardas |
| `src/views/IngresarView`, `RegistroView`, `RecuperarView`, `NuevaClaveView`, `AuthCallbackView` | Pantallas de acceso |
| `src/components/CampoTexto`, `MensajeEstado`, `AvisoDatos`, `BotonCerrarSesion` | Piezas reutilizables |
