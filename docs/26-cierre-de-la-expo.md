# 26. Cierre de la expo: datos, registros y mejoras

Que hacer cuando termina la exposicion. Lo hace un administrador (ver
[23. Manual para administradores](23-manual-administradores.md)).

## 26.1 Cerrar

1. Panel `/admin` → **Eventos de expo** → **Cerrar** el evento. Las partidas que
   seguian abiertas quedan **vencidas** (no entran al ranking) y no se juega mas.
2. Dejar la pantalla del ranking abierta hasta la entrega de premios: sigue
   mostrando el resultado final.

## 26.2 Revisar los datos

En **SQL Editor** de Supabase (reemplazar `expo-2026` por el id del evento). Son
solo consultas: no cambian nada.

```sql
-- Resumen del evento: partidas por estado
select estado, count(*) from public.partidas
 where evento_id = 'expo-2026' group by estado order by estado;
-- Esperado despues de cerrar: ninguna 'en_curso'.

-- Participantes: cuantas personas jugaron, cuantas con cuenta y cuantas como invitado
select count(distinct p.usuario_id) as personas,
       count(distinct p.usuario_id) filter (where not f.es_invitado) as con_cuenta,
       count(distinct p.usuario_id) filter (where f.es_invitado) as invitados
  from public.partidas p join public.perfiles f on f.id = p.usuario_id
 where p.evento_id = 'expo-2026';

-- El ranking publicado coincide con la mejor partida de cada uno
-- (tiene que devolver 0 filas)
select r.desafio_id, r.alias, r.codigo, r.puntaje, m.puntaje as mejor
  from public.resultados_publicos r
  join public.perfiles f on f.id_publico = r.participante
  cross join lateral (
    select puntaje, duracion_ms from public.partidas
     where usuario_id = f.id and desafio_id = r.desafio_id and estado = 'finalizada'
     order by puntaje desc, duracion_ms asc, finalizada_en asc limit 1) m
 where r.evento_id = 'expo-2026'
   and (r.puntaje, r.duracion_ms) is distinct from (m.puntaje, m.duracion_ms);

-- Ningun puntaje fuera de las reglas (tiene que devolver 0 filas)
select id from public.partidas
 where evento_id = 'expo-2026' and puntaje <> aciertos * puntos_por_acierto;
```

Si algo no da lo esperado, anotarlo en el registro de problemas (26.5) antes de tocar
nada: las partidas son el historial de la expo.

## 26.3 Conservar los registros

| Que | Como | Donde guardarlo |
|---|---|---|
| **Ranking final** | Table Editor → `resultados_publicos` → filtrar por `evento_id` → *Export to CSV*. O una captura de la pantalla del ranking. | Carpeta del proyecto (es publico: alias, puntaje y tiempo) |
| **Contenido y desafios** | `sh supabase/respaldo/respaldar-contenido.sh` (seccion 18.5) | Fuera del repositorio: tiene las soluciones |
| **Base completa** (cuentas, partidas) | Respaldo de Supabase (Database → Backups) o `supabase db dump` | Privado: tiene correos. Solo lo necesario y con acceso restringido |
| **Numeros del resumen** | Resultado de las consultas de 26.2 | Informe final |

No hace falta guardar las partidas una por una fuera de Supabase: quedan en la base
y el evento cerrado no se puede volver a jugar.

## 26.4 Limpiar

- **Invitados abandonados**: despues de la expo quedan muchos invitados que no van a
  volver. `select public.limpiar_invitados_inactivos(30);` borra los que no tuvieron
  actividad en 30 dias (nunca toca cuentas). Correrla **despues** de exportar lo que
  se quiera conservar: al borrar un invitado se borran sus partidas.
- **Celulares prestados**: desinstalar la app o, en la app, **Cerrar sesion**.
- **Clave de firma**: confirmar que el `.jks` y sus contraseñas estan en los dos
  lugares acordados (ver [20. APK](20-apk-android.md), seccion 20.6) y en ninguna
  computadora compartida.

## 26.5 Registro de problemas y mejoras para la siguiente version

Completar durante y despues de la expo. Cada fila: que paso, a cuantas personas
afecto, como se resolvio en el momento y que cambiar.

| # | Que paso | Gravedad (alta / media / baja) | Como se resolvio en el momento | Mejora para la proxima version |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Preguntas para completar el registro:

- ¿Hubo celulares donde no se pudo instalar o abrir la app? (modelo y version de Android)
- ¿Llegaron los correos de confirmacion? ¿Cuanto tardaron?
- ¿Se corto la red del lugar? ¿La pantalla lo aviso y se recupero sola?
- ¿Alguna pregunta resulto ambigua o tenia un error? (se corrige con una version nueva
  del desafio)
- ¿Cuanta gente jugo como invitado y se quedo sin aparecer en el ranking?
- ¿El tiempo y la cantidad de intentos de cada desafio fueron razonables?

Las mejoras ya conocidas antes de la expo estan en el
[informe final](24-informe-final.md), seccion 24.11.
