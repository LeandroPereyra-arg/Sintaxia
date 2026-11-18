# 21. Registro de pruebas de la etapa 8

Que se verifico del APK y que falta probar en celulares fisicos. Script automatico:
[`pruebas/etapa8.mjs`](../pruebas/etapa8.mjs). Procedimiento del APK:
[20. APK de Android](20-apk-android.md).

## 21.1 Contra que se prueba

| Pieza | Es... |
|---|---|
| Supabase Auth | El servidor real (GoTrue): correos, enlaces y codigos PKCE de verdad |
| La app | La misma de la web, compilada con `--mode android` (el `.env.android` del APK) y abierta en Chromium a 320–360 px |
| Android | **Simulado**: se reemplaza el puente nativo que usa Capacitor (`window.androidBridge` y el plugin App). Asi `@capacitor/core` cree que esta en Android, `src/servicios/nativo.js` registra sus oyentes y la prueba dispara el boton Atras y "Android abre la app con este enlace" |
| El APK | El archivo real que genera `./gradlew assembleDebug`, revisado con `aapt2`, `unzip` y `apksigner` |

Sin virtualizacion en la computadora donde se armo el APK no se pudo usar el emulador
de Android: **el comportamiento dentro de un celular real se prueba a mano** (21.4).

## 21.2 Resultados automaticos

Corrida completa desde una base nueva, seguida de las pruebas de todas las etapas
anteriores:

| Script | Casos | Fallan |
|---|---|---|
| `npm run pruebas:etapa8` | 8 | 0 |
| `npm run pruebas:etapa7` | 17 | 0 |
| `npm run pruebas:etapa6` | 16 | 0 |
| `npm run pruebas:etapa5` | 22 | 0 |
| `npm run pruebas:etapa4` | 35 | 0 |
| `npm run pruebas:etapa3` | 12 | 0 |
| `npm run pruebas:etapa2` | 11 | 0 |

Ninguna excepcion no atrapada en la pagina.

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | En el navegador la integracion nativa no hace nada | Sin el puente de Android, Capacitor dice "web", no se registra ningun oyente y la app anda como siempre | plataforma: web · sin oyentes nativos · /cursos carga normal ("Cursos") | PASA |
| 2 | Boton Atras de Android | Vuelve a la pantalla anterior; sin historial va al inicio; en el inicio (o en la bienvenida) minimiza la app en lugar de cerrarla | /ingresar -> /cursos -> / -> minimiza · abierta sin historial: Atras -> / · en la bienvenida: minimiza | PASA |
| 3 | Confirmar la cuenta desde el correo, con la app abierta | El correo pide volver a sintaxia://auth/auth/callback; Android abre la app con ese enlace y la app canjea el codigo (PKCE): la cuenta queda confirmada y con sesion | redirect_to = sintaxia://auth/auth/callback · Auth vuelve con ?code=... · la app lo abre y dice "tu cuenta esta confirmada" · una sola recarga | PASA |
| 4 | Recuperar la contraseña desde el correo, con la app cerrada | El enlace abre la app en "Nueva contraseña" (llega como direccion de inicio), se guarda la nueva, la vieja deja de servir y no hay recargas en bucle | redirect_to = sintaxia://auth/auth/nueva-clave · la app arranca con el enlace y muestra "Elegi tu contraseña nueva" · contraseña cambiada · vieja 400, nueva 200 · 2 cargas (sin bucle) | PASA |
| 5 | Enlaces vencidos y enlaces ajenos | Un enlace vencido muestra el motivo; direcciones que no son sintaxia://auth/(auth/callback/auth/nueva-clave) se ignoran | 4 enlaces ajenos: ignorados (sigue en /cursos) · enlace vencido: "El enlace vencio o ya se uso. Pedi uno nuevo." · rutaDesdeEnlace: 4 de 4 | PASA |
| 6 | Pantalla chica y teclado dentro del "APK" | A 320 px nada desborda; con el teclado (vista mas baja) el boton Entrar se puede alcanzar | sin desborde a 320 px en /, /cursos, /ingresar, /registro y /expo · con la vista a 300 px de alto el boton Entrar se alcanza | PASA |
| 7 | El APK debug lleva la app adentro y no depende de la computadora | Version = package.json; identificador com.sintaxia.app; trae index.html y los recursos compilados; capacitor.config.json sin server.url; enlace sintaxia://auth declarado; sin direcciones de la red local | com.sintaxia.app 1.0.0 · index.html y recursos adentro · sin server.url · sintaxia://auth declarado · allowBackup=false · sin direcciones locales · Supabase: SIN CONFIGURAR (falta .env al compilar) | PASA |
| 8 | La clave de firma no esta en el repositorio | Ningun .jks, .keystore ni firma*.properties versionado o sin ignorar; build.gradle sin contraseñas; si hay release firmada, apksigner la verifica con un certificado que no es el de depuracion | sin archivos de firma en el repo · .gitignore los cubre · build.gradle lee la firma de variables de entorno · release verificada por apksigner (CN=Sintaxia prueba, O=Sintaxia, C=AR) | PASA |

Ademas, desde la terminal:

| Verificacion | Resultado |
|---|---|
| `./gradlew assembleDebug` (Wrapper, Gradle 8.14.3, JDK 21, SDK 36) | `BUILD SUCCESSFUL`, `app-debug.apk` de unos 6 MB |
| `./gradlew assembleRelease` con una clave de prueba **fuera del repo** pasada por `SINTAXIA_FIRMA` | `app-release.apk` de unos 4,9 MB |
| `apksigner verify --print-certs app-release.apk` | `Verified using v2 scheme: true`, certificado propio (no el de depuracion) |
| `aapt2 dump badging app-debug.apk` | `com.sintaxia.app`, `versionName 1.0.0`, `versionCode 10000`, `targetSdk 36`, etiqueta "Sintaxia" |
| `git status` despues de firmar | ningun `.jks` ni `firma*.properties` dentro del repositorio |

## 21.3 Problemas encontrados y corregidos

### P1 · Sintax se salia de la pantalla a 320 px

**Caso 6.** En el inicio, la mascota de la tarjeta de muestra esta corrida 18 px a la
derecha a proposito; en un celular de 320 px quedaba 3 px fuera de la pantalla y
aparecia scroll horizontal. Las pruebas de pantallas chicas de la etapa 4 no miraban
el inicio. **Correccion:** en pantallas de hasta 420 px se corre solo 4 px.

### P2 · El boton Atras no hacia nada en la bienvenida

Visto al diseñar el caso 2: la primera vez, el inicio redirige a la bienvenida. Sin
historial, "volver al inicio" volvia a la misma pantalla y el boton quedaba sin efecto.
**Correccion:** si volver al inicio no cambia la pantalla, la app se minimiza.

### P3 · Recargas en bucle al abrir la app desde un enlace

Visto al diseñar el caso 4: con la app cerrada, Android la abre con el enlace como
direccion de inicio. Despues de pasar a la pantalla del enlace (recargando la vista),
`getLaunchUrl()` devuelve otra vez el mismo enlace. **Correccion:** se recuerda el
ultimo enlace abierto en la sesion de la vista; el caso 4 verifica que haya una sola
recarga.

### P4 · El titulo de la pestaña del ranking decia "Ranking semanal"

La pagina `/ranking` cambio en la etapa 7 (ahora lista los eventos) pero el titulo
seguia siendo el de la etapa 2. **Correccion:** "Ranking".

## 21.4 Pruebas en celulares fisicos (a completar)

Con el APK debug compilado **con el `.env` del proyecto real** (si no, la app avisa que
falta configurar Supabase) e instalado en **al menos dos celulares**. Marcar ✔ o
anotar que paso.

| Dato | Celular 1 | Celular 2 |
|---|---|---|
| Modelo | | |
| Version de Android | | |
| Tamaño de pantalla | | |
| Instalacion del APK (origen desconocido) | | |

| # | Prueba | Como | Celular 1 | Celular 2 |
|---|---|---|---|---|
| 1 | Acceso a Supabase | Abrir la app con datos moviles y con wifi: se ve el catalogo | | |
| 2 | Invitado | **Continuar como invitado** y hacer una leccion | | |
| 3 | Registro | Crear una cuenta; abrir el correo **en el celular**: se abre la app con la cuenta confirmada | | |
| 4 | Preguntas | Responder una leccion completa; la correccion aparece al instante | | |
| 5 | Progreso | Cerrar la app, reabrirla: el progreso sigue; en el otro celular, con la misma cuenta, tambien | | |
| 6 | Puntaje | Jugar un desafio y comparar el puntaje del celular con la pantalla del ranking | | |
| 7 | Ranking | Con la pantalla abierta en una computadora, terminar una partida en cada celular: aparecen solos | | |
| 8 | Boton Atras | Atras vuelve de pantalla; en el inicio minimiza la app | | |
| 9 | Teclado | En registro e ingreso, el teclado no tapa el campo ni el boton | | |
| 10 | Pantalla chica | En el celular mas chico nada se corta ni aparece scroll horizontal | | |
| 11 | Cierre y reapertura | Cerrar desde recientes en mitad de una partida; al volver, **Retomar partida** con el tiempo real | | |
| 12 | Sin conexion | Modo avion a mitad de partida: la respuesta queda pendiente y se manda al volver | | |
| 13 | Recuperacion | **Olvide mi contraseña**; el enlace abre la app en "Nueva contraseña" | | |
| 14 | Enlace en otro dispositivo | Abrir el enlace de confirmacion en la computadora: confirma, pero en el celular hay que ingresar con la contraseña (esperado por PKCE) | | |
| 15 | Release | Desinstalar el debug e instalar `app-release.apk`; abre y funciona igual | | |

Problemas encontrados en estas pruebas: anotarlos aca y, si quedan para la proxima
version, en [26.5](26-cierre-de-la-expo.md).

## 21.5 Lo que no se probo

- **El APK en un celular o emulador**: ver 21.4.
- **El proyecto real de Supabase**: las pruebas usan Auth real pero local; los
  enlaces del proyecto real dependen de que `sintaxia://auth/**` este en *Redirect URLs*.
- **La release con la clave definitiva**: se probo el procedimiento con una clave de
  prueba; la definitiva la crea y la guarda el equipo (20.6).
