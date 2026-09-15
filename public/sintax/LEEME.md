# Imagenes de la marca

## El logo

`sintaxia.png` es el logo completo: el pajaro con la notebook y la palabra "Sintaxia".
Lo usa `src/components/LogoSintaxia.vue` en la cabecera, el pie y el 404, y tambien
es el favicon.

En la cabecera se muestra recortado, solo el personaje. El recorte esta calculado
midiendo el PNG (el pajaro va de y=167 a y=673 y la palabra arranca en y=674) y se
ajusta con dos variables CSS dentro del componente: `--logo-zoom: 275%` y
`--logo-foco-y: 30%`.

## Los estados de Sintax

Ocho imagenes, una por estado de animo. Las usa `src/components/SintaxMascota.vue`.

| Archivo | Que muestra | Donde aparece |
|---|---|---|
| `normal.webp` | Con la notebook, contento | Por defecto, y reemplaza a cualquiera que falte |
| `saludando.webp` | Alas arriba, ojos cerrados | Portada, ingreso, bienvenida e invitacion a crear cuenta |
| `confundido.webp` | Ala en el pico y un "?" | Pagina 404 y resultados flojos |
| `pensando.webp` | La lamparita de la idea | Pantallas vacias y el paso 2 de la bienvenida |
| `enojado.webp` | Notebook con la X roja | Cuando se pierden las tres vidas |
| `dormido.webp` | Acostado, con Zzz | Cuando todavia no empezaste |
| `celebrando.webp` | Anteojos de sol y destello | Leccion perfecta y racha de 3 dias o mas |
| `sorprendido.webp` | Ojos grandes, ala levantada | Al desbloquear algo nuevo |

### Formato

Estan en **WebP** porque pesa unas cinco veces menos que el PNG con la misma calidad
(44 KB contra 218 KB cada una). En el celular con datos moviles la diferencia se nota.

Igual el componente acepta los dos formatos: busca primero `<estado>.webp` y, si no
esta, prueba `<estado>.png`. Asi que alcanza con dejar el archivo en la carpeta.

### Si se reemplaza alguna

Van todas con **fondo transparente** y **el mismo encuadre**: mismo tamanio de lienzo y
el personaje apoyado sobre la misma linea de piso. Eso es lo que hace que al cambiar de
estado el personaje no salte de lugar ni cambie de tamanio.

Las actuales miden 391 x 447 px.

### Orden de respaldo

Si falta algo, se va probando hasta encontrar algo que mostrar, asi que nunca queda una
imagen rota:

```
<estado>.webp  ->  <estado>.png  ->  normal.webp  ->  normal.png  ->  el logo
```
