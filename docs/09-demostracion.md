# 9. Demostracion del recorrido completo

Guion para mostrar la aplicacion de punta a punta, en el orden en que conviene
recorrerla durante la entrega.

1. **Bienvenida** → recorrer los pasos y elegir **"Continuar como invitado"**
   (o crear una cuenta). Mirar el catalogo no pide sesion; hacer una leccion si.
2. **Cursos** → tarjeta de JavaScript.
3. **Curso** → la Unidad 1 esta disponible y el resto bloqueado.
4. **Unidad 1** → las lecciones 2 y 3 aparecen bloqueadas, con el motivo escrito.
5. **Leccion 1** → teoria y ejemplo de codigo; "Comenzar actividades".
6. **Actividades** → mostrar los cuatro casos: confirmar sin elegir (el boton
   esta apagado), una correcta, una incorrecta con su explicacion, y que despues
   de confirmar no se puede cambiar la respuesta.
7. **Resultados** → actividades, correctas, incorrectas y porcentaje.
8. **Volver a la unidad** → la leccion 2 quedo habilitada.
9. **Reintentar** la leccion 1 → arranca de cero.
10. **En el celular** → abrir el mismo recorrido en una pantalla angosta y
    mostrar el ejemplo de codigo, que se desplaza dentro de su caja.
11. **Direccion invalida** → abrir una leccion que no existe y mostrar el aviso.
12. **Perfil** → mostrar el alias con codigo y el aviso de invitado; **"Crear mi
    cuenta"** y comprobar que el historial se conserva (el XP sigue ahi).
13. **Cerrar sesion como invitado** → mostrar la advertencia antes de salir.

El recorrido automatizado de `npm run pruebas:etapa2` cubre los mismos pasos, asi que
sirve como ensayo previo a la demostracion.

## Agregado de la etapa 5: intentos y progreso

1. **Empezar la leccion 1 y responder dos actividades** → arriba de cada una aparece
   "Respuesta guardada": la confirmo el servidor.
2. **Cerrar la pestana y volver a abrir la leccion** → "Tenes un intento sin terminar:
   2 de 4 respondidas". "Continuar el intento" retoma en la actividad 3 con las mismas vidas.
3. **Cortar el wifi y comprobar una respuesta** → "Pendiente: sin conexion": no se corrige
   ni se cuenta. Al volver el wifi se manda sola y pasa a "Respuesta guardada".
4. **Terminar** → la pantalla de resultados dice "Resultado guardado · intento 1" recien
   cuando el servidor lo confirma.
5. **Intentar de nuevo** con un resultado peor → en el perfil, "Tus lecciones" muestra el
   mejor (100 %) y el ultimo (por ejemplo 1/4) por separado, y el historial lista los dos
   intentos.
6. **Con una cuenta, abrir el perfil en otro dispositivo** → el mismo historial, y una
   leccion a medias se retoma alla.

`npm run pruebas:etapa5` automatiza estos pasos y los casos de permisos y peticiones
repetidas (ver [15. Registro de pruebas de la etapa 5](15-registro-de-pruebas-etapa5.md)).
