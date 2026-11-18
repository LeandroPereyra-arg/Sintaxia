# 28. Registro de pruebas del juego de la expo

Pruebas de los cambios de [27. Minijuego, puntaje total y desafíos sin corrección](27-minijuego-y-puntaje-total.md)
y de las ñ. Script: [`pruebas/etapa9.mjs`](../pruebas/etapa9.mjs).

## 28.1 Contra qué se prueba

El mismo entorno que las etapas anteriores: Supabase Auth real (GoTrue), PostgreSQL 16
con los scripts `00` a `17`, Chromium con la app, y la API de datos y Realtime
imitados localmente. Para no esperar el minuto completo, las pruebas de la API
"corren" la partida en el tiempo moviendo `iniciada_en` en la base, igual que en la
etapa 6. El caso 7 juega el minijuego entero en el navegador: la prueba mueve a Sintax
con el mouse hacia la ficha más cercana.

```bash
npm run supabase:local && npm run pruebas:entorno   # en otra terminal
npm run pruebas:etapa9                              # SOLO=3,4 corre solo esos casos
```

## 28.2 Resultados

Corrida completa desde una base nueva, con todas las etapas:

| Script | Casos | Fallan |
|---|---|---|
| `npm run pruebas:etapa9` | 8 | 0 |
| `npm run pruebas:etapa8` | 8 | 0 |
| `npm run pruebas:etapa7` | 17 | 0 |
| `npm run pruebas:etapa6` | 16 | 0 |
| `npm run pruebas:etapa5` | 22 | 0 |
| `npm run pruebas:etapa4` | 35 | 0 |
| `npm run pruebas:etapa3` | 12 | 0 |
| `npm run pruebas:etapa2` | 11 | 0 |

Ninguna excepción no atrapada en la página.

| # | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| 1 | El desafio no muestra si cada respuesta estuvo bien | Despues de responder solo dice "Respuesta registrada" y "Siguiente": sin correcto/incorrecto, sin marcar la opcion correcta y sin puntaje en vivo; al final se ve el puntaje, igual al de la base | 5 respuestas: solo "Respuesta registrada" + Siguiente, sin correcto/incorrecto, sin marcar opciones y sin puntaje · al final: 300 pts = 300 en la base | PASA |
| 2 | El servidor tampoco cuenta la correccion mientras se juega | responder_partida no trae correcta ni puntos; la partida en curso trae aciertos, errores y puntaje en null; leer las tablas no muestra la partida en curso ni sus respuestas; al terminar se ve todo | en curso: responder sin correcta ni puntos · resumen con puntaje/aciertos/errores en null (1 respondida) · obtener_partida sin correccion · tablas: 0 filas · al terminar: 100 pts visibles en mis_partidas y en las tablas | PASA |
| 3 | Minijuego: el servidor arma las fichas y las valida | Empieza con 56 fichas y 3 consignas, sin decir cuales son validas; una valida suma 20; repetirla no suma; una que todavia no cae, una ajena o la partida de otro se rechazan; 3 errores terminan la partida | 56 fichas, 3 consignas, ninguna dice si es valida · temprana: ficha_fuera_de_tiempo · valida: +20 · repetida: no suma · ajena / de otro: rechazadas · 3 errores: vidas 2, 1, 0 y la partida termina (20 pts, cuenta) · despues: partida_cerrada | PASA |
| 4 | Minijuego: terminar el tiempo cuenta, y solo se puede atrapar mientras cae | Cerrar cuando se acabo el tiempo deja la partida finalizada con 60 s; una partida que nadie cerro tambien queda finalizada (no vencida); una ficha que ya paso se rechaza | ficha que ya paso: ficha_fuera_de_tiempo · cerrar al terminar el tiempo: finalizada, 60 s, 20 pts · sin cerrar: finalizada (no vencida) con 60 s | PASA |
| 5 | Minijuego: las soluciones y los puntajes no se tocan desde el cliente | Las tablas de fichas no se leen (ni sin sesion ni con sesion); no se puede cambiar el puntaje; el minijuego no se juega como desafio de preguntas ni al reves | fichas y banco: 401/403/403/401 · cambiar el puntaje: 403 (sigue en 20) · minijuego como preguntas: sin_preguntas · preguntas como minijuego: tipo_incorrecto | PASA |
| 6 | Puntaje total: suma la mejor partida de cada desafio | A = sprint 300 + minijuego 40 = 340; B = sprint 500; repetir peor no baja el total; un invitado no aparece; la pantalla muestra el total primero y se actualiza sola | A: 300 + 40 = 340 (2 desafios) · B: 500, primero · repetir peor no cambia · invitado: no figura · pantalla: "Puntaje total" primero; al mejorar A el minijuego (80) pasa a 380 sin recargar · el minijuego tiene su propio tablero | PASA |
| 7 | Jugar el minijuego en la pantalla | Desde el evento se ve como minijuego (3 vidas) y se abre; Sintax se mueve con el dedo y atrapa fichas; el puntaje y las vidas que se ven son los del servidor; al terminar muestra el puntaje final igual al de la base | tarjeta: Minijuego, 3 vidas · consigna "Atrapá operadores de comparación" · 8 atrapadas buenas y 3 malas · en juego se vio 160 pts · final 160 pts = 160 en la base | PASA |
| 8 | La app escribe con ñ | Ingresar, recuperar y la portada dicen contraseña y español con ñ; no queda "contrasena" | campo "Contraseña" · "Recuperar mi contraseña" · "en español" · sin "contrasena" ni "espanol" en inicio, ingresar, registro y recuperar | PASA |

Además: el respaldo y la recuperación del contenido (sección 18.5) incluyen ahora el
banco del minijuego; la ida y vuelta dejó las nueve tablas idénticas.

## 28.3 Problemas encontrados y corregidos

### P1 · Volver a correr los scripts de la etapa 6 deshacía el juego nuevo

**Regresión completa.** La primera versión ponía todo en el script 17, que reemplazaba
funciones del 12 (`responder_partida`, `resumen_partida`...) y políticas del 13. La
prueba de la etapa 6 vuelve a correr los scripts 11 a 14 (para verificar que se puedan
re-ejecutar) y con eso volvían las versiones viejas: la respuesta decía otra vez si
era correcta. En el proyecto real hubiera pasado lo mismo al re-ejecutar el 12.
**Corrección:** cada función quedó definida en un solo script. La corrección oculta
vive en 11 (columna `tipo`), 12 y 13; el 17 solo agrega lo nuevo del minijuego y el
total.

### P2 · Sintax no se veía en el área de juego

Visto en una captura. El componente de la mascota usa la clase `sintax` en su raíz, y
la pantalla del juego usaba el mismo nombre para posicionar a Sintax: el estilo se
aplicaba dos veces y la imagen quedaba fuera del área (y en la portada, abajo de todo).
**Corrección:** el contenedor del juego se llama `jugador`.

### P3 · El total llegaba como texto

`ranking_total` sumaba con `sum()` y `count()`, que devuelven `bigint`; la imitación de
la API lo mandaba como texto ("500"). **Corrección:** la función devuelve enteros.

## 28.4 Lo que no se probó

- **El minijuego en un celular real**: el tacto (arrastrar el dedo) se probó con el
  mouse del navegador; falta jugarlo en los dos celulares de la planilla
  [21.4](21-registro-de-pruebas-etapa8.md).
- **Con mala conexión**: si se corta la red a mitad del minijuego, las fichas atrapadas
  sin conexión no cuentan (se avisa en pantalla); no se probó con una red real lenta.
