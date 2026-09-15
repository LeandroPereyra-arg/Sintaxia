# Imagenes de la marca

## El logo

`sintaxia.png` es el logo completo: el buho con la notebook y la palabra "Sintaxia".
Lo usa `src/components/LogoSintaxia.vue` en la cabecera, el pie, la portada y el 404,
y tambien es el favicon.

En la cabecera se muestra recortado, solo el buho. El recorte esta calculado midiendo
el PNG (el buho va de y=167 a y=673 y la palabra arranca en y=674) y se ajusta con dos
variables CSS dentro del componente: `--logo-zoom: 275%` y `--logo-foco-y: 30%`.

## Los estados de Sintax

Las imagenes de la mascota van en esta misma carpeta, en PNG con fondo transparente.
El componente `src/components/SintaxMascota.vue` las toma por el nombre del archivo.

| Archivo | Cuando se usa |
|---|---|
| `normal.png` | Normal o feliz. Es el que se usa por defecto y el que reemplaza a cualquiera que falte. |
| `saludando.png` | Portada y pantalla de ingreso. |
| `pensando.png` | Mientras se corrige una respuesta y en las pantallas vacias. |
| `celebrando.png` | Leccion perfecta y medalla desbloqueada. |
| `sorprendido.png` | Al desbloquear una unidad nueva. |
| `confundido.png` | Respuesta incorrecta y pagina 404. |
| `enojado.png` | Cuando se pierden las tres vidas. |
| `dormido.png` | Cuando hace dias que no se practica. |

Mientras falte alguna, se muestra `normal.png`; si tampoco esta, se usa el logo.
La aplicacion nunca queda con una imagen rota.

Recomendado: PNG transparente, entre 400 y 600 px de alto, con el mismo encuadre
en todas para que al cambiar de estado el personaje no salte de lugar.
