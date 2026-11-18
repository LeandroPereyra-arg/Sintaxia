# 23. Manual para administradores

Para docentes y organizadores de la expo. El detalle tecnico esta en
[18. Ranking publico y administracion](18-ranking-y-administracion.md).

## 1. Tener el rol de administrador

1. Crea una **cuenta** en la app (no sirve un invitado) y confirma el correo.
2. Quien tiene acceso al panel de Supabase corre, en **SQL Editor**:
   ```sql
   select public.otorgar_administrador('tu-correo@escuela.edu.ar');
   ```
3. Cerra sesion y volve a entrar: en el menu aparece **Administracion** (`/admin`).

Para quitarlo: `select public.quitar_administrador('correo');`. Nadie puede darse el
rol desde la app.

## 2. Antes de la expo

### Cargar o revisar el contenido (pestana **Contenido**)

- Elegi curso, unidad y leccion con los filtros de arriba. Se recuerdan al recargar.
- **+ Nuevo** crea un curso, unidad o leccion; **Editar** los cambia.
- **+ Nueva** pregunta: enunciado, codigo (opcional), opciones y la **explicacion**
  de la solucion. Marca **una sola** opcion correcta. El editor avisa antes de guardar
  si hay opciones vacias o repetidas.
- **Publicar** hace visible algo para los alumnos. Una leccion necesita al menos una
  actividad publicada para poder publicarse.

### Preparar el evento (pestana **Eventos de expo**)

1. Crea el evento: queda **en preparacion** (nadie lo ve).
2. Crea sus desafios con las reglas: duracion, puntos por acierto, intentos y gracia.
3. Carga el banco de preguntas de cada desafio (es aparte del de practica).
4. Para probar las preguntas jugando, usa un **evento de ensayo** aparte: un evento
   en preparacion no se puede jugar, y las partidas de prueba no tienen que quedar en
   el ranking real.

### Ensayo general (un dia antes)

- [ ] El APK instalado en los celulares de prueba (ver [20. APK](20-apk-android.md)).
- [ ] La computadora de la pantalla abre `https://<la app>/expo/<evento>/ranking`.
- [ ] En Supabase, *Redirect URLs* tiene `sintaxia://auth/**`.
- [ ] Respaldo del contenido hecho (seccion 18.5).

## 3. Durante la expo

| Accion | Donde |
|---|---|
| **Abrir el evento** | Eventos de expo → **Abrir**. Desde ahi se ve y se juega. |
| Pantalla grande | En la computadora de la expo, sin iniciar sesion: `/expo/<evento>/ranking`, pantalla completa (F11). |
| Si la pantalla dice "Sin conexion" | Revisar la red de esa computadora. Al volver se actualiza sola; tambien esta el boton **Actualizar**. |
| Cambiar una pregunta de un desafio ya jugado | No se puede (el desafio quedo **congelado** para que todos jueguen con las mismas reglas). Usar **Nueva version**: copia el desafio en borrador, se corrige y se publica. Cada version tiene su ranking. |
| Ocultar algo que salio mal | **Despublicar**. No borra el historial de nadie. |

## 4. Recuperacion de cuentas

- Un participante que olvido la contrasena la recupera solo desde la app: **Olvide mi
  contrasena** (ver el manual de participantes, seccion 5).
- Si el correo no llega: revisar spam; el proveedor de correo de Supabase tiene un
  cupo bajo por hora (ver [12. Acceso](12-acceso-y-sesiones.md), seccion 12.6).
- Un invitado que perdio el celular o cerro sesion **no se puede recuperar**: no tiene
  correo ni contrasena. Por eso conviene que quien quiera figurar en el ranking cree
  una cuenta.

## 5. Cerrar el evento

1. Eventos de expo → **Cerrar** (pide confirmacion). Las partidas que seguian en curso
   quedan **vencidas** y no se juega mas. El ranking queda visible.
2. Segui el procedimiento de [26. Cierre de la expo](26-cierre-de-la-expo.md):
   exportar resultados, respaldo, revision de datos y registro de problemas.

## 6. Lo que no hay que hacer

- No compartir la clave **secreta** (`service_role` / `sb_secret_...`) de Supabase ni
  ponerla en la app. La app solo usa la clave publicable.
- No **Eliminar** contenido con historial: la app no lo deja; se despublica.
- No editar puntajes a mano en la base: los calcula el servidor y las restricciones
  lo rechazan.
