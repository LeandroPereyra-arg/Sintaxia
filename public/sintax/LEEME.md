# Imagenes de Sintax

Aca van las imagenes de la mascota, en PNG con fondo transparente.
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
