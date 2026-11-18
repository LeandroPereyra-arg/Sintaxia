# 25. Defensa individual y demostracion

## 25.1 Demostracion completa (15 minutos)

Objetivo: mostrar que **varios celulares guardan resultados en la misma base** y que
**la pantalla se actualiza sola**.

### Que preparar

| Equipo | Que tiene abierto |
|---|---|
| Proyector o computadora | `https://<la app>/expo/<evento>/ranking`, pantalla completa, **sin sesion** |
| Celular A | APK instalado, con una **cuenta** ya creada |
| Celular B | APK instalado, sin sesion (va a entrar como **invitado** y despues crear cuenta) |
| Celular C (opcional) | APK con otra cuenta, para mostrar un empate o un desempate por tiempo |
| Notebook del docente | Panel `/admin` con una cuenta administradora; Supabase abierto en *Table Editor* |

Antes: evento **abierto**, wifi probado en los tres celulares, el correo de prueba a
mano para la recuperacion.

### Guion

| Min | Paso | Que decir / mostrar |
|---|---|---|
| 0–1 | Presentacion | El problema (abandono al aprender a programar) y la idea: lecciones cortas con correccion inmediata, y una competencia para la expo |
| 1–3 | **Celular B**: entrar como invitado, hacer una leccion de practica | Correccion al instante con explicacion; la corrige el **servidor** |
| 3–5 | **Celular A**: jugar un desafio | Cuenta regresiva del servidor, estado de cada envio, **Terminar** |
| 5–6 | **Pantalla** | El alias de A aparece solo, resaltado, sin recargar (Realtime) |
| 6–8 | **Celular B**: jugar el mismo desafio como invitado | Ve su puntaje, pero **no aparece** en el ranking (se anuncio asi) |
| 8–9 | **Celular B**: **Crear mi cuenta y conservar mi progreso** | Al confirmar, su partida pasa a contar y aparece en la pantalla |
| 9–10 | **Celular C** (o A otra vez) | Repetir con peor puntaje no cambia el puesto: cuenta la mejor, no la suma |
| 10–11 | **Supabase → Table Editor**: `partidas` y `resultados_publicos` | Las filas de los tres celulares en la **misma base**; la tabla publica no tiene correos |
| 11–12 | Cortar el wifi de la computadora de la pantalla | Aviso "Sin conexion" con la hora de los datos; al volver se pone al dia sola |
| 12–13 | **Celular A**: boton Atras, cerrar y reabrir la app | Vuelve atras; al reabrir sigue la sesion |
| 13–14 | **Panel `/admin`**: mostrar una solucion y **Cerrar** el evento | Las soluciones solo las ve el administrador; cerrado no se juega mas |
| 14–15 | Preguntas | — |

### Si algo falla en vivo

- **No hay red**: mostrar el video de respaldo de la demo (grabarlo en el ensayo) y
  explicar el aviso de conexion.
- **No llega el correo**: usar una cuenta ya confirmada; la conversion de invitado se
  muestra con el video.
- **La pantalla no se actualiza**: boton **Actualizar** (y explicar el respaldo cada 15 s).

## 25.2 Defensa individual del aporte

Cada integrante defiende **lo que hizo**, no todo el proyecto. Se arma una ficha
propia (fuera del repositorio) con esta estructura, en 5 minutos:

1. **Que hice**: etapas y partes concretas (pantallas, scripts SQL, pruebas,
   documentos). Conviene apoyarlo en los commits y PR de cada etapa.
2. **Una decision que tome y por que**: una alternativa que se descarto. Ejemplos del
   proyecto para orientarse:
   - Corregir en el servidor y no en el celular (etapas 3 y 5).
   - Tiempo medido por el reloj del servidor, con gracia de red (etapa 6).
   - Una tabla publica minima para el ranking en lugar de abrir `partidas` (etapa 7).
   - Desafios congelados y versiones en lugar de editar con partidas (etapa 7).
   - Capacitor directo sobre Vite en lugar de migrar a Quasar (etapa 8).
3. **Un problema que encontre y como lo resolvi**: cada registro de pruebas tiene una
   seccion "Problemas encontrados y corregidos" ([13.4](13-registro-de-pruebas-etapa4.md),
   [15.4](15-registro-de-pruebas-etapa5.md), [17.4](17-registro-de-pruebas-etapa6.md),
   [19.4](19-registro-de-pruebas-etapa7.md), [21.3](21-registro-de-pruebas-etapa8.md)).
4. **Como lo pruebo**: el caso automatico que lo cubre y que muestra cuando pasa.
5. **Que mejoraria**: una de las mejoras pendientes ([24.11](24-informe-final.md)).

### Preguntas probables

| Pregunta | Donde esta la respuesta |
|---|---|
| ¿Que impide que alguien se ponga 10 000 puntos? | [24.9](24-informe-final.md) y [16](16-competencia.md): el cliente no escribe puntajes; restriccion `puntaje = aciertos × puntos` |
| ¿Y si cambio la hora del celular? | [16.4](16-competencia.md): el tiempo lo mide el servidor (etapa 6, caso 8) |
| ¿Por que los invitados no aparecen en el ranking? | Se anuncio asi desde la etapa 4 y no tienen alias propio; ver [18.2](18-ranking-y-administracion.md) |
| ¿Por que no se suscriben a una vista en Realtime? | Realtime avisa cambios de tablas; la pantalla escucha `resultados_publicos` y vuelve a consultar ([18.1](18-ranking-y-administracion.md)) |
| ¿Donde esta la clave de firma? | Fuera del repositorio, con dos copias ([20.6](20-apk-android.md)) |
| ¿El APK necesita la computadora? | No: lleva la app adentro; solo necesita internet para Supabase ([20.5](20-apk-android.md), etapa 8 caso 7) |
