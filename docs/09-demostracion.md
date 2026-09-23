# 9. Demostracion del recorrido completo

Guion para mostrar la aplicacion de punta a punta, en el orden en que conviene
recorrerla durante la entrega.

1. **Inicio** → "Ver cursos".
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

El recorrido automatizado de `npm run pruebas` cubre los mismos pasos, asi que
sirve como ensayo previo a la demostracion.
