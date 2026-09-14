# 5. Backend, autenticacion y base de datos

Hasta la entrega anterior Sintaxia era solo front: el progreso vivia en el
`localStorage` del navegador. Esta etapa agrega un backend propio con **Node.js +
Express**, una base **MySQL** y inicio de sesion con **Google** y **GitHub**.

---

## 5.1 Como levantar todo

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    Completa SECRETO_SESION con:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Base de datos (crea la base, las tablas y carga las medallas)
npm run db:migrar
npm run db:sembrar

# 4. Front y API juntos
npm run dev:todo      # front en :5173 · API en :3000
```

| Script | Que hace |
|---|---|
| `npm run dev` | Solo el front (Vite) |
| `npm run dev:api` | Solo la API, recargando al guardar |
| `npm run dev:todo` | Los dos a la vez |
| `npm run db:migrar` | Crea la base y las tablas (se puede repetir) |
| `npm run db:sembrar` | Carga o actualiza el catalogo de medallas |
| `npm run db:reiniciar` | Migrar + sembrar |
| `npm run api` | API en modo produccion |

Vite reenvia todo lo que empieza con `/api` al puerto 3000, asi que el navegador
ve un solo origen y la cookie de sesion viaja sin configurar CORS.

> **Sin base de datos la aplicacion igual funciona.** Si la API no responde, el
> front entra en modo invitado y guarda el progreso en el navegador, como antes.

---

## 5.2 Modelo de datos

```
┌──────────────────────┐         ┌────────────────────────┐
│      usuarios        │ 1     N │      identidades       │
│──────────────────────│◄────────│────────────────────────│
│ id (PK)              │         │ id (PK)                │
│ usuario (UNIQUE)     │         │ usuario_id (FK)        │
│ nombre               │         │ proveedor  ┐ UNIQUE    │
│ email (UNIQUE)       │         │ proveedor_id ┘         │
│ avatar_url           │         │ email                  │
│ avatar_emoji         │         │ ultimo_acceso          │
│ bio · pais           │         └────────────────────────┘
│ xp_total             │
│ racha_actual         │         ┌────────────────────────┐
│ racha_maxima         │ 1     N │  progreso_lecciones    │
│ meta_diaria          │◄────────│────────────────────────│
│ ultima_actividad     │         │ usuario_id ┐ UNIQUE    │
│ creado_en            │         │ leccion_id ┘           │
└──────────────────────┘         │ aciertos · total       │
   │              │              │ mejor_aciertos         │
   │              │              │ intentos · xp_ganado   │
   │              │              └────────────────────────┘
   │              │
   │ 1          N │              ┌────────────────────────┐
   │              └─────────────►│   actividad_diaria     │
   │                             │────────────────────────│
   │                             │ usuario_id ┐ UNIQUE    │
   │                             │ fecha      ┘           │
   │                             │ xp · lecciones         │
   │                             └────────────────────────┘
   │ N                       N
   └────────► usuario_medallas ◄────────┐
              │ usuario_id (PK,FK)      │
              │ medalla_id (PK,FK)      │
              │ obtenida_en             │
              └─────────────────────────┘
                                        │
                             ┌──────────────────────┐
                             │      medallas        │
                             │──────────────────────│
                             │ id (PK)              │
                             │ codigo (UNIQUE)      │
                             │ nombre · descripcion │
                             │ icono · categoria    │
                             │ nivel                │
                             │ requisito_tipo       │
                             │ requisito_valor      │
                             └──────────────────────┘
```

Decisiones que vale la pena explicar:

- **`usuarios` e `identidades` estan separadas.** Una persona puede entrar con
  Google y con GitHub y seguir siendo la misma cuenta. Si el email viene
  verificado, la segunda identidad se vincula a la cuenta que ya existia en vez
  de crear un usuario duplicado.
- **`xp_total` y `racha_actual` estan desnormalizados** en `usuarios`. Se
  podrian recalcular sumando `actividad_diaria`, pero se leen en casi todas las
  pantallas y asi se evita una suma en cada consulta.
- **`progreso_lecciones` tiene UNIQUE (usuario_id, leccion_id)** y guarda el
  *mejor* resultado con `GREATEST`, no el ultimo: repetir una leccion nunca
  empeora tu registro.
- **`actividad_diaria` es la que sostiene dos cosas a la vez**: el calendario
  del perfil y el ranking semanal.
- **El catalogo de medallas vive en el codigo** (`server/db/medallas.js`) y se
  vuelca a la tabla con `db:sembrar`. Asi queda versionado en git y a la vez
  se puede consultar con un JOIN.

---

## 5.3 Inicio de sesion con Google y GitHub

Se implemento **OAuth 2.0 Authorization Code** a mano (sin Passport) para que se
entienda cada paso.

```
Navegador            API (Express)                    Google / GitHub
    │                      │                                 │
    │ 1. clic en "Entrar"  │                                 │
    ├─────────────────────►│                                 │
    │                      │ guarda un `state` aleatorio     │
    │                      │ en una cookie de 10 minutos     │
    │ 2. redireccion  ◄────┤                                 │
    ├────────────────────────────────────────────────────────►│
    │                      │            3. el usuario acepta │
    │ 4. vuelve con ?code=...&state=...                      │
    ├─────────────────────►│                                 │
    │                      │ 5. compara el state (anti-CSRF) │
    │                      │ 6. cambia el code por un token  │
    │                      ├────────────────────────────────►│
    │                      │ 7. pide el perfil con el token  │
    │                      ├────────────────────────────────►│
    │                      │ 8. busca o crea el usuario      │
    │                      │ 9. cookie de sesion (JWT)       │
    │ 10. vuelta al front ◄┤                                 │
```

### Por que asi

| Decision | Motivo |
|---|---|
| Cookie `httpOnly` con JWT | Como JavaScript no puede leerla, un XSS no se puede robar la sesion. Guardar el token en `localStorage` si seria vulnerable. |
| `SameSite=Lax` | Corta los CSRF basicos y a la vez permite que la cookie viaje cuando el proveedor nos devuelve por redireccion. |
| `Secure` solo en produccion | En `localhost` no hay HTTPS; en produccion la cookie no viaja en claro. |
| Parametro `state` | Es lo que evita que alguien fuerce un callback falso. Se guarda en cookie y se compara al volver. |
| Vinculacion por email **verificado** | Si aceptaramos cualquier email, alguien podria crear una cuenta de GitHub con tu correo y quedarse con tu progreso. |
| Redireccion solo a rutas internas | El parametro `destino` se valida (`empieza con /`) para que la app no se pueda usar como puente hacia otro sitio. |

### Configurar las credenciales

**Google** — [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
1. Crear "ID de cliente de OAuth" → tipo *Aplicacion web*.
2. URI de redireccion autorizado: `http://localhost:3000/api/auth/google/callback`
3. Copiar el ID y el secreto a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**GitHub** — [github.com/settings/developers](https://github.com/settings/developers)
1. *New OAuth App*.
2. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
3. Copiar el ID y el secreto a `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`.

Los botones aparecen **solo si las credenciales estan cargadas**: la API expone
en `/api/auth/proveedores` cuales estan configurados y el front arma la pantalla
con esa lista.

### Login de prueba

Con `PERMITIR_LOGIN_DEMO=true` en el `.env` aparece un recuadro para entrar
escribiendo un nombre, sin configurar nada. Sirve para desarrollar y para
mostrar la aplicacion. **Se ignora automaticamente si `NODE_ENV=produccion`**,
asi que no puede quedar abierto por error.

> Sign in with Apple no se incluyo: requiere una cuenta de Apple Developer paga
> (99 USD al anio) para poder emitir el client secret.

---

## 5.4 Endpoints de la API

| Metodo | Ruta | Sesion | Que hace |
|---|---|---|---|
| GET | `/api/salud` | no | Estado del servidor y de la base |
| GET | `/api/auth/proveedores` | no | Proveedores de login configurados |
| GET | `/api/auth/me` | no | Usuario actual (o `null`) |
| GET | `/api/auth/google` | no | Manda a la pantalla de permisos de Google |
| GET | `/api/auth/google/callback` | no | Vuelta de Google: crea la sesion |
| GET | `/api/auth/github` · `/callback` | no | Idem con GitHub |
| POST | `/api/auth/demo` | no | Login de prueba (solo si esta habilitado) |
| POST | `/api/auth/logout` | no | Borra la cookie de sesion |
| GET | `/api/perfil` | si | Usuario + medallas + actividad + ranking, en una llamada |
| PUT | `/api/perfil` | si | Edita nombre, usuario, bio, pais, avatar y meta diaria |
| GET | `/api/perfil/medallas` | si | Catalogo con el estado de cada medalla |
| GET | `/api/perfil/actividad` | si | XP por dia (calendario) |
| GET | `/api/progreso` | si | Lecciones completadas y XP de hoy |
| POST | `/api/progreso/lecciones` | si | Registra una leccion terminada |
| POST | `/api/progreso/sincronizar` | si | Sube el progreso hecho como invitado |
| GET | `/api/ranking` | no | Tabla semanal y ligas |

### El cliente no puede regalarse XP

El front manda **cuantos ejercicios acerto**, nunca el XP. El servidor:

1. Busca la leccion en el mismo catalogo que usa el front (`src/data/`), que
   importa directamente. Hay una sola fuente de verdad.
2. Verifica que la cantidad de ejercicios coincida con la real y que
   `aciertos <= total`.
3. Calcula el XP con su propia formula.
4. Evalua las medallas contra las estadisticas guardadas en la base.

```bash
# intento de trampa
curl -X POST localhost:3000/api/progreso/lecciones \
  -H 'Content-Type: application/json' -b cookies.txt \
  -d '{"leccionId":"js-u1-l1","aciertos":999,"total":999}'
# → {"error":"La leccion tiene 4 ejercicios."}
```

---

## 5.5 Medallas

14 medallas repartidas en cuatro categorias (progreso, constancia, volumen y
precision) y cuatro niveles (bronce, plata, oro y diamante).

| Medalla | Nivel | Requisito |
|---|---|---|
| 🥚 Primer paso | Bronce | 1 leccion |
| 📘 Aprendiz | Plata | 5 lecciones |
| 🎓 Estudioso | Oro | 10 lecciones |
| 🎖️ Unidad completa | Plata | 1 unidad entera |
| 🗺️ Medio camino | Oro | 3 unidades |
| 👑 JavaScript listo | Diamante | Curso completo |
| 🔥 Constante | Bronce | Racha de 3 dias |
| 📅 Semana perfecta | Plata | Racha de 7 dias |
| ⚡ Imparable | Diamante | Racha de 30 dias |
| 💯 Cien puntos | Bronce | 100 XP |
| 🚀 Maratonista | Oro | 500 XP |
| 🏃 Sesion larga | Plata | 100 XP en un dia |
| 🎯 Sin errores | Plata | 1 leccion perfecta |
| 🏹 Francotirador | Oro | 5 lecciones perfectas |

Cada medalla declara `requisito_tipo` + `requisito_valor`, asi que **agregar una
medalla nueva es agregar una fila al catalogo**: no hay que tocar el evaluador.

Las que faltan se muestran igual, en gris y con la barra de "cuanto te falta":
saber que estas 2 de 5 motiva mas que no ver nada.

---

## 5.6 Ranking y ligas

- **Ranking semanal**: suma el XP de `actividad_diaria` desde el lunes de la
  semana en curso (`WEEKDAY()` de MySQL). Todos arrancan de cero cada lunes, asi
  que un usuario nuevo puede competir con uno que lleva meses.
- **Ligas**: se derivan del XP total acumulado (Bronce 0, Plata 250, Oro 750,
  Diamante 1500). Se calculan al vuelo, sin ningun proceso programado.
- El puesto propio se devuelve aparte, asi se ve aunque no entres en el top 50.

---

## 5.7 Modo invitado y sincronizacion

```
Sin cuenta                    Al iniciar sesion
─────────────                 ──────────────────────────────────────
localStorage      ──POST /api/progreso/sincronizar──►  MySQL
                                    │
                                    ├─ ignora las lecciones que ya tenias
                                    ├─ ignora ids que no existen
                                    ├─ paga el XP de las nuevas
                                    ├─ evalua las medallas
                                    └─ borra la copia del navegador
```

El progreso de invitado nunca pisa lo que ya tenias en la cuenta: si una leccion
ya estaba completada, se descarta y no se paga XP dos veces.

---

## 5.8 Seguridad: resumen

| Riesgo | Como se cubre |
|---|---|
| Robo de sesion por XSS | Cookie `httpOnly`: el JavaScript de la pagina no la puede leer |
| CSRF en el login | Parametro `state` aleatorio guardado en cookie y verificado al volver |
| CSRF en la API | Cookie `SameSite=Lax` + la API solo acepta JSON |
| Inyeccion SQL | Todas las consultas son preparadas con parametros (`?`). El unico valor interpolado es el `LIMIT`, forzado a entero entre 5 y 100 |
| Trampa con el XP | El XP y las medallas los calcula el servidor contra su propio catalogo |
| Redireccion abierta | El parametro `destino` solo acepta rutas internas |
| Filtracion de datos internos | Las respuestas pasan por `presentarUsuario()`: sale solo lo que esta en esa lista |
| Errores que revelan de mas | El manejador central devuelve un mensaje generico para los 5xx |
| Secretos en el repo | `.env` esta en `.gitignore`; se versiona solo `.env.example` |
| Login de prueba abierto | Se desactiva solo si `NODE_ENV=produccion` |

---

## 5.9 Pendiente para mas adelante

- Refrescar la sesion sin obligar a entrar de nuevo a los 30 dias.
- Limitar la cantidad de peticiones por IP (rate limiting) en los endpoints de login.
- Poder desvincular una identidad y borrar la cuenta desde el perfil.
- Cerrar la semana del ranking y guardar un historial de ligas.
