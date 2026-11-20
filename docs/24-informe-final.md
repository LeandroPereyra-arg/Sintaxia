# 24. Informe final

Reune lo entregado en las etapas 1 a 8. **No rehace las entregas aprobadas**: resume y
enlaza cada documento, y marca lo que cambio desde que se entrego.

| # | Seccion | Documento de detalle |
|---|---|---|
| 24.1 | Fundamentacion | [1. Descripcion del proyecto](01-descripcion-del-proyecto.md) |
| 24.2 | Alcance | este documento |
| 24.3 | Historias de usuario | este documento |
| 24.4 | Cronograma | este documento |
| 24.5 | Arquitectura | [2. Estructura](02-estructura-y-arquitectura.md), [10. Supabase](10-supabase-y-modelo-de-datos.md), [20. APK](20-apk-android.md) |
| 24.6 | DER | `docs/der/` (etapas 3 a 7) |
| 24.7 | Diccionario de datos | [10.3](10-supabase-y-modelo-de-datos.md#103-diccionario-de-datos) + 24.7 |
| 24.8 | Reglas | [6](06-reglas-de-avance.md), [14](14-intentos-y-progreso.md), [16](16-competencia.md), [18](18-ranking-y-administracion.md) |
| 24.9 | Seguridad | este documento |
| 24.10 | Pruebas | registros [7](07-registro-de-pruebas.md), [11](11-registro-de-pruebas-etapa3.md), [13](13-registro-de-pruebas-etapa4.md), [15](15-registro-de-pruebas-etapa5.md), [17](17-registro-de-pruebas-etapa6.md), [19](19-registro-de-pruebas-etapa7.md), [21](21-registro-de-pruebas-etapa8.md) |
| 24.11 | Mejoras pendientes | este documento y [26. Cierre de la expo](26-cierre-de-la-expo.md) |

Manuales: [22. Participantes](22-manual-participantes.md) ·
[23. Administradores](23-manual-administradores.md). Defensa y demostracion:
[25](25-defensa-y-demostracion.md).

---

## 24.1 Fundamentacion

Aprender a programar tiene una tasa de abandono muy alta: los recursos son largos, se
practica poco, no hay devolucion inmediata, no se ve el avance y no queda claro como
seguir. Sintaxia aplica a la programacion la mecanica que funciona con los idiomas:
**lecciones de cinco minutos, ejercicios con correccion inmediata y explicacion, un
camino que se desbloquea de a poco y recompensas** (XP, rachas, medallas). El publico
principal es el principiante hispanohablante con poco tiempo libre.

**Lo que se sumo despues:** la **competencia de la expo** (etapas 6 y 7) usa el mismo
contenido para un evento presencial: cada visitante juega desafios contra reloj desde
su celular y una pantalla grande muestra el ranking en vivo. Le da al proyecto una
demostracion publica y medible, y obligo a resolver problemas reales: puntajes que no
se pueden falsificar, tiempo medido por el servidor y muchos celulares escribiendo en
la misma base.

## 24.2 Alcance

| Incluido | Fuera de alcance (por ahora) |
|---|---|
| Seis cursos completos: 25 unidades, 52 lecciones y 208 actividades (JavaScript, Python, HTML y CSS, SQL, Java y C++) | Mas tipos de actividad (completar, ordenar) en la base |
| Actividades de opcion multiple corregidas por el servidor | Editor de codigo con ejecucion real |
| Invitados, cuentas con correo y contraseña, confirmacion y recuperacion | Inicio de sesion con Google o GitHub (fue de la etapa 1, con Express; no se paso a Supabase) |
| Intentos, historial, progreso, desbloqueo, XP, racha, medallas | Repaso espaciado de los errores |
| Competencia: eventos, desafios con banco propio, partidas con tiempo del servidor | Varios eventos abiertos a la vez en la misma pantalla |
| Ranking publico de la expo con Realtime | Ligas semanales entre estudiantes |
| Panel de administracion: contenido, soluciones, eventos y versiones | Roles intermedios (por ejemplo, solo editor de contenido) |
| Web y **APK de Android** (debug y release firmada) | Publicacion en Google Play, version para iOS |

## 24.3 Historias de usuario

Formato: *como* ... *quiero* ... *para* .... El criterio de aceptacion es el caso de
prueba automatico que lo verifica.

### Participante (alumno o visitante)

| # | Historia | Criterio de aceptacion | Etapa |
|---|---|---|---|
| HU1 | Como principiante quiero lecciones cortas con teoria y ejemplo para entender un tema en pocos minutos | Una leccion se completa en una sesion; la teoria se ve antes de las actividades | 1–2 |
| HU2 | Como alumno quiero saber al instante si respondi bien y por que, para no fijar errores | Cada respuesta muestra correcto o incorrecto y la explicacion, corregida por el servidor | 2–3, 5 |
| HU3 | Como alumno quiero que se desbloquee la siguiente leccion al aprobar para saber como seguir | Con 60 % se habilita la siguiente; la unidad siguiente espera a la anterior (etapa 5, caso 7) | 2, 5 |
| HU4 | Como visitante quiero probar sin registrarme, para no perder tiempo en la expo | **Continuar como invitado** crea un usuario anonimo y puede jugar (etapa 4) | 4 |
| HU5 | Como alumno quiero crear una cuenta y conservar mi progreso de invitado | Al convertirse, el mismo usuario pasa a ser cuenta y conserva el historial (etapa 4) | 4 |
| HU6 | Como alumno quiero recuperar mi contraseña desde el correo | El enlace abre la app en "Nueva contraseña" (etapa 4, caso 18; etapa 8, caso 4 en el APK) | 4, 8 |
| HU7 | Como alumno quiero ver mi historial y mi progreso en cualquier dispositivo | Perfil con lecciones, ultimo intento e historial; se recupera ingresando (etapa 5) | 5 |
| HU8 | Como visitante de la expo quiero jugar un desafio contra reloj y ver mi puntaje final | Partida con tiempo del servidor, resultado confirmado para invitado y cuenta (etapa 6) | 6 |
| HU9 | Como participante quiero aparecer en la pantalla del ranking con mi alias | La pantalla se actualiza sola al terminar; solo cuentas, alias con codigo (etapa 7, caso 1) | 7 |
| HU10 | Como participante quiero instalar la app en mi celular | APK instalable que no depende de la computadora (etapa 8) | 8 |
| HU10b | Como participante de la expo quiero un minijuego con Sintax que me sume puntos | *Sintax atrapa el código*: fichas validadas por el servidor, vidas, suma al puntaje total ([27](27-minijuego-y-puntaje-total.md); pruebas del juego, casos 3 a 7) | expo |

### Docente y organizador

| # | Historia | Criterio de aceptacion | Etapa |
|---|---|---|---|
| HU11 | Como docente quiero cargar y publicar contenido sin tocar la base | Panel `/admin`: crear, editar, publicar y despublicar; validaciones en el servidor (etapa 7, caso 12) | 7 |
| HU12 | Como docente quiero ver y cambiar las soluciones sin que los alumnos puedan leerlas | Soluciones solo por funciones de administrador (etapa 7, caso 13) | 7 |
| HU13 | Como organizador quiero preparar, abrir y cerrar el evento de la expo | Preparacion invisible, abierto se juega, cerrado vence las partidas en curso (etapa 7, caso 15) | 7 |
| HU14 | Como organizador quiero un ranking justo que no se pueda falsificar | Puntaje calculado por el servidor, mejor partida y no suma, empates por tiempo (etapas 6 y 7) | 6–7 |
| HU15 | Como organizador quiero una pantalla grande que se lea a distancia y aguante cortes de red | Letra grande, aviso de conexion, respaldo periodico y reconexion (etapa 7, casos 4, 5 y 10) | 7 |
| HU16 | Como responsable quiero respaldar y recuperar el contenido | Scripts de respaldo y recuperacion probados (seccion 18.5) | 7 |

## 24.4 Cronograma

Fechas reales de cada entrega (fecha de integracion en `main`).

| Etapa | Tema | Entregada |
|---|---|---|
| 1 | App en Vue 3, descripcion, estructura, wireframes, identidad visual; cuentas con Google y GitHub (Express + MySQL) | 14/09/2026 |
| 1 (ajustes) | Logo definitivo y las imagenes de la mascota Sintax | 16/09/2026 |
| 2 | Unidad completa, pantalla de teoria, reglas de avance y DER | 23/09/2026 |
| 3 | Contenido en Supabase (PostgreSQL + RLS) | 29/09/2026 |
| 4 | Invitados, registro e inicio de sesion con Supabase Auth | 12/10/2026 |
| 5 | Intentos, respuestas y progreso corregidos por el servidor | 27/10/2026 |
| 6 y 7 | Competencia de la expo; ranking publico con Realtime y panel de administracion | 10/11/2026 |
| 8 | APK con Capacitor y Gradle, manuales e informe final | 18/11/2026 (esta entrega) |
| Expo | Evento presencial | *a completar* |
| Cierre | Revision de datos y registro de mejoras ([26](26-cierre-de-la-expo.md)) | *despues de la expo* |

## 24.5 Arquitectura

```
 Celular (APK)         Navegador (web)        Computadora de la expo
 Capacitor + WebView   Vue 3 + Vite           /expo/<evento>/ranking (sin sesion)
        \                    |                      /
         \______  misma app de Vue (src/)  ________/
                            |
                 supabase-js (clave publicable)
                            |
   ------------------------ Supabase ------------------------
   Auth (GoTrue)      PostgreSQL + RLS       Realtime
   invitados,         tablas, restricciones,  avisos de
   cuentas, correos   funciones del servidor  resultados_publicos
                      (corrigen, puntuan,
                       miden el tiempo)
```

**Que cambio desde la etapa 1** ([2. Estructura](02-estructura-y-arquitectura.md) se
mantiene como estaba):

- El progreso ya no vive en `localStorage`: desde la etapa 5 esta en Supabase y lo
  calcula el servidor.
- La API de Express + MySQL de las etapas 1 y 2 (`server/`) **ya no se usa**; queda como
  referencia. Auth, datos y permisos son de Supabase.
- Toda la logica que no se puede confiar al cliente (corregir, puntuar, medir el
  tiempo, otorgar medallas, desbloquear) son funciones de PostgreSQL.
- Etapa 8: la misma app se empaqueta como APK con Capacitor
  ([20. APK](20-apk-android.md)); `src/servicios/nativo.js` agrega el boton Atras y los
  enlaces de los correos.

## 24.6 DER

| Etapa | Diagrama | Que agrega |
|---|---|---|
| 2 | [`sintaxia-der.png`](der/sintaxia-der.png) | Modelo inicial (MySQL) |
| 3 | [`sintaxia-der-etapa3.png`](der/sintaxia-der-etapa3.png) | Contenido en Supabase |
| 4 | [`sintaxia-der-etapa4.png`](der/sintaxia-der-etapa4.png) | Perfiles ligados a Auth |
| 5 | [`sintaxia-der-etapa5.png`](der/sintaxia-der-etapa5.png) | Intentos y respuestas |
| 6 | [`sintaxia-der-etapa6.png`](der/sintaxia-der-etapa6.png) | Eventos, desafios, partidas |
| 7 | [`sintaxia-der-etapa7.png`](der/sintaxia-der-etapa7.png) | Ranking publico y administradores |

La etapa 8 no cambia la base.

## 24.7 Diccionario de datos

El diccionario completo de las tablas de contenido esta en
[10.3](10-supabase-y-modelo-de-datos.md#103-diccionario-de-datos). Las tablas que se
sumaron despues:

| Tabla | Etapa | Para que | Quien escribe | Quien lee |
|---|---|---|---|---|
| `perfiles` | 4 | Alias, codigo, avatar, meta; `id_publico` (etapa 7) para el ranking | la persona (alias, avatar, meta) | la persona |
| `intentos` | 5 | Cada vez que se empieza una leccion: estado, aciertos, errores, aprobado | solo funciones del servidor | la persona |
| `respuestas` | 5 | Una por actividad e intento: opcion, si fue correcta | solo funciones del servidor | la persona |
| `eventos` | 6 | Exposiciones: estado preparacion / abierto / cerrado | administradores | todos (salvo en preparacion) |
| `desafios` | 6 | Reglas: duracion, puntos, intentos, gracia, version, congelado | administradores | todos (publicados) |
| `preguntas_desafio`, `opciones_desafio` | 6 | Banco propio de cada desafio, con la solucion | administradores | nadie desde el cliente |
| `partidas` | 6 | Una partida: reglas copiadas, tiempo y puntaje del servidor | solo funciones del servidor | la persona |
| `partida_preguntas`, `partida_respuestas` | 6 | Preguntas fijadas y una respuesta por pregunta | solo funciones del servidor | la persona |
| `resultados_publicos` | 7 | Mejor partida valida de cada cuenta: alias, puntaje, tiempo | solo disparadores | todos |
| `administradores` | 7 | Quien administra | solo `otorgar_administrador` (servidor) | nadie desde el cliente |

Columnas, tipos y restricciones de cada una: los scripts `supabase/05` a `16`, que
llevan un comentario por tabla y por columna, y los DER.

## 24.8 Reglas

| Tema | Regla | Detalle |
|---|---|---|
| Leccion | 3 vidas; se aprueba con 60 %; cada repeticion es un intento nuevo y cuenta el mejor | [6](06-reglas-de-avance.md), [14](14-intentos-y-progreso.md) |
| Desbloqueo | La leccion siguiente al aprobar; la unidad siguiente al completar la anterior | [6](06-reglas-de-avance.md) |
| Partida | Tiempo medido por el servidor con gracia de red; una respuesta por pregunta; puntaje = aciertos × puntos; la correccion se ve recien al terminar | [16](16-competencia.md), [27](27-minijuego-y-puntaje-total.md) |
| Minijuego | 60 s, 3 vidas, +20 por ficha valida; termina por tiempo o vidas y cuenta | [27](27-minijuego-y-puntaje-total.md) |
| Puntaje total | Suma de la mejor partida de cada desafio del evento | [27](27-minijuego-y-puntaje-total.md) |
| Ranking | Mejor partida valida por persona y desafio; mas puntaje, menos tiempo; empates comparten puesto; solo cuentas | [16.5](16-competencia.md), [18.2](18-ranking-y-administracion.md) |
| Contenido | Opciones distintas, exactamente una correcta; una leccion publicada necesita una actividad publicada | [18.4](18-ranking-y-administracion.md) |
| Desafio | Con partidas queda congelado: se cambia con una version nueva | [18.4](18-ranking-y-administracion.md) |
| Eliminar | Lo que tiene historial no se elimina: se despublica | [18.4](18-ranking-y-administracion.md) |

## 24.9 Seguridad

| Riesgo | Como se cubre |
|---|---|
| Leer las soluciones desde el cliente | Sin permiso de columna sobre `es_correcta` ni `explicacion`; el banco de los desafios no se lee; correccion solo en el servidor |
| Aprender las soluciones entre intentos | Mientras se juega un desafio, ni la pantalla ni el servidor dicen si cada respuesta fue correcta ni el puntaje |
| Trampa en el minijuego | El servidor arma las fichas, solo el sabe cuales son validas y acepta cada una mientras cae segun su reloj |
| Falsificar puntaje, tiempo o progreso | El cliente no escribe partidas, intentos ni puntajes; funciones `security definer` calculan todo; restricciones en la tabla (`puntaje = aciertos × puntos`) |
| Ver datos de otra persona | RLS: cada uno ve solo lo propio; el ranking publica una tabla minima sin correos ni ids de cuenta |
| Darse el rol de administrador | Tabla `administradores` sin permisos para el cliente; se otorga solo desde el servidor; cada funcion `admin_*` verifica `es_admin()` |
| Respuestas repetidas o simultaneas | Claves unicas e identificadores generados por el cliente: la segunda devuelve la primera |
| Claves en el codigo | Solo la clave publicable en la app (`VITE_`); `.env` fuera del repo; la clave secreta nunca en el front ni en los documentos |
| Enlaces de los correos | PKCE: el codigo sirve una vez y solo en el dispositivo que lo pidio; la app solo acepta `sintaxia://auth/auth/callback` y `/auth/nueva-clave` |
| Abuso de altas de invitados | Limite de altas anonimas por IP en Auth ([12.8](12-acceso-y-sesiones.md)) |
| APK | Firma release con clave fuera del repo (ignorada en `.gitignore`); `allowBackup="false"` para que la sesion no salga del celular; sin `server.url` ni contenido mixto |

## 24.10 Pruebas

Pruebas automaticas contra Auth real (GoTrue), PostgreSQL real con los scripts del
proyecto y Chromium; la capa HTTP de datos y Realtime son imitaciones locales.

| Etapa | Casos | Que cubre |
|---|---|---|
| 2 | 11 | Recorrido de actividades y resultados |
| 3 | 12 | Consultas, permisos, errores |
| 4 | 35 | Invitados, registro, sesion, recuperacion, RLS, pantallas chicas |
| 5 | 22 | Intentos, progreso, desconexion, duplicados |
| 6 | 16 | Partidas, tiempo del servidor, puntaje manipulado, dos jugadores |
| 7 | 17 | Ranking con Realtime, permisos, panel de administracion |
| 8 | 8 | Boton Atras, enlaces de correo en la app, APK, clave de firma |
| Juego de la expo | 8 | Desafios sin correccion a la vista, minijuego, puntaje total, ñ ([28](28-registro-de-pruebas-juego-expo.md)) |
| **Total** | **129** | Corrida completa desde una base nueva |

**No probado automaticamente:** el proyecto real de Supabase, PostgREST y Realtime
reales, carga con muchos participantes y los celulares fisicos (planilla en
[21.4](21-registro-de-pruebas-etapa8.md)).

## 24.11 Mejoras pendientes

| Mejora | Por que |
|---|---|
| Probar contra el proyecto real con varios celulares antes de la expo | Las pruebas automaticas usan imitaciones de PostgREST y Realtime |
| Proveedor de correo propio (SMTP) | El incluido en Supabase tiene un cupo bajo por hora |
| Cargar mas unidades y cursos | Hoy hay una unidad publicada |
| Editor de codigo con ejecucion | Practicar escribiendo, no solo eligiendo |
| Ranking de la expo con codigo QR en la pantalla | Hoy se muestra el enlace para jugar como texto |
| Publicar en Google Play | Instalar sin "origenes desconocidos" y con actualizaciones |
| Repaso espaciado y ligas semanales | Previstos desde la etapa 1 |
| Roles intermedios en el panel | Hoy hay un solo rol de administrador |
| Iniciar sesion con Google | Estaba en la etapa 1 con Express; falta pasarlo a Supabase Auth |

Lo que surja en la expo se agrega en [26.5](26-cierre-de-la-expo.md).
