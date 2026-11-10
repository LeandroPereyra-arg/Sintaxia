-- ===========================================================================
--  Sintaxia - Evento de expo de ejemplo (etapa 6)
-- ---------------------------------------------------------------------------
--  Un evento con dos desafios y su banco de preguntas. Las preguntas son
--  PROPIAS de la competencia: no estan en el banco de practica, asi que no se
--  pueden "estudiar" con la correccion de las lecciones.
--
--    expo-2026            Expo Sintaxia 2026 (abierto)
--      expo-2026-sprint   Sprint de JavaScript  · facil · 5 preguntas x 100 pts · 90 s · 3 intentos
--      expo-2026-codigo   Lee el codigo         · media · 5 preguntas x 150 pts · 120 s · 2 intentos
--
--  Se puede volver a correr: no pisa nada que ya exista. Las preguntas y
--  opciones se insertan solo si todavia no estan (con "where not exists" y no
--  con "on conflict", porque el disparador de congelamiento revisa cada insert
--  antes de que PostgreSQL detecte el conflicto). Para que el evento no se vea hasta el dia de la expo, cambiar su
--  estado a 'preparacion'; para abrirlo, a 'abierto'; al terminar, a 'cerrado':
--
--    update public.eventos set estado = 'abierto' where id = 'expo-2026';
-- ===========================================================================

begin;

insert into public.eventos (id, nombre, descripcion, lugar, estado) values
  ('expo-2026', 'Expo Sintaxia 2026',
   'Desafios de programacion en vivo. Jugas desde tu celular y el ranking se ve en la pantalla grande.',
   'Salon de actos', 'abierto')
on conflict (id) do nothing;

insert into public.desafios
  (id, evento_id, orden, nombre, descripcion, dificultad, duracion_segundos, puntos_por_acierto, intentos_permitidos, gracia_segundos, estado)
values
  ('expo-2026-sprint', 'expo-2026', 1, 'Sprint de JavaScript',
   'Cinco preguntas rapidas sobre lo basico del lenguaje.', 'facil', 90, 100, 3, 5, 'publicado'),
  ('expo-2026-codigo', 'expo-2026', 2, 'Lee el codigo',
   'Cinco fragmentos de codigo: adivina que muestran.', 'media', 120, 150, 2, 5, 'publicado')
on conflict (id) do nothing;

-- --- Sprint de JavaScript ---------------------------------------------------
insert into public.preguntas_desafio (id, desafio_id, orden, enunciado, codigo, explicacion)
select * from (values
  ('sprint-p1', 'expo-2026-sprint', 1, 'Que muestra este codigo?', 'console.log(typeof 42)',
   'typeof devuelve el tipo como texto, y 42 es de tipo number.'),
  ('sprint-p2', 'expo-2026-sprint', 2, 'Con que palabra se declara una variable que no se puede reasignar?', null,
   'const crea una variable que no se puede volver a asignar.'),
  ('sprint-p3', 'expo-2026-sprint', 3, 'Que devuelve esta expresion?', '"Hola".length',
   'length cuenta los caracteres del texto: H, o, l, a.'),
  ('sprint-p4', 'expo-2026-sprint', 4, 'Que operador compara el valor y tambien el tipo?', null,
   'El triple igual no convierte tipos antes de comparar.'),
  ('sprint-p5', 'expo-2026-sprint', 5, 'Como se escribe un comentario de una linea en JavaScript?', null,
   'Las dos barras comentan hasta el final de la linea.')
) as v (id, desafio_id, orden, enunciado, codigo, explicacion)
where not exists (select 1 from public.preguntas_desafio t where t.id = v.id);

insert into public.opciones_desafio (id, pregunta_id, orden, texto, es_correcta)
select * from (values
  ('sprint-p1-a', 'sprint-p1', 1, '"number"', true),
  ('sprint-p1-b', 'sprint-p1', 2, '"string"', false),
  ('sprint-p1-c', 'sprint-p1', 3, '"integer"', false),
  ('sprint-p1-d', 'sprint-p1', 4, '42', false),
  ('sprint-p2-a', 'sprint-p2', 1, 'let', false),
  ('sprint-p2-b', 'sprint-p2', 2, 'const', true),
  ('sprint-p2-c', 'sprint-p2', 3, 'var', false),
  ('sprint-p2-d', 'sprint-p2', 4, 'static', false),
  ('sprint-p3-a', 'sprint-p3', 1, '5', false),
  ('sprint-p3-b', 'sprint-p3', 2, '3', false),
  ('sprint-p3-c', 'sprint-p3', 3, '4', true),
  ('sprint-p3-d', 'sprint-p3', 4, 'undefined', false),
  ('sprint-p4-a', 'sprint-p4', 1, '==', false),
  ('sprint-p4-b', 'sprint-p4', 2, '=', false),
  ('sprint-p4-c', 'sprint-p4', 3, '!=', false),
  ('sprint-p4-d', 'sprint-p4', 4, '===', true),
  ('sprint-p5-a', 'sprint-p5', 1, '// comentario', true),
  ('sprint-p5-b', 'sprint-p5', 2, '<!-- comentario -->', false),
  ('sprint-p5-c', 'sprint-p5', 3, '# comentario', false),
  ('sprint-p5-d', 'sprint-p5', 4, '** comentario', false)
) as v (id, pregunta_id, orden, texto, es_correcta)
where not exists (select 1 from public.opciones_desafio t where t.id = v.id);

-- --- Lee el codigo ------------------------------------------------------------
insert into public.preguntas_desafio (id, desafio_id, orden, enunciado, codigo, explicacion)
select * from (values
  ('codigo-p1', 'expo-2026-codigo', 1, 'Que muestra este codigo?', E'let x = 5\nx += 3\nconsole.log(x)',
   'x += 3 suma 3 al valor que tenia: 5 + 3 = 8.'),
  ('codigo-p2', 'expo-2026-codigo', 2, 'Que muestra este codigo?', 'console.log("5" + 2)',
   'Si uno de los dos es texto, + une los textos: "5" y "2" dan "52".'),
  ('codigo-p3', 'expo-2026-codigo', 3, 'Que muestra este codigo?', E'const lista = [1, 2, 3]\nconsole.log(lista[3])',
   'Las posiciones empiezan en 0: la ultima es lista[2]. lista[3] no existe y da undefined.'),
  ('codigo-p4', 'expo-2026-codigo', 4, 'Que muestra este codigo?', 'console.log(10 % 4)',
   'El operador % da el resto de la division: 10 / 4 = 2 y sobran 2.'),
  ('codigo-p5', 'expo-2026-codigo', 5, 'Que muestra este codigo?', E'if (0) {\n  console.log("si")\n} else {\n  console.log("no")\n}',
   'El 0 se considera falso en una condicion, asi que se ejecuta el else.')
) as v (id, desafio_id, orden, enunciado, codigo, explicacion)
where not exists (select 1 from public.preguntas_desafio t where t.id = v.id);

insert into public.opciones_desafio (id, pregunta_id, orden, texto, es_correcta)
select * from (values
  ('codigo-p1-a', 'codigo-p1', 1, '53', false),
  ('codigo-p1-b', 'codigo-p1', 2, '8', true),
  ('codigo-p1-c', 'codigo-p1', 3, '5', false),
  ('codigo-p1-d', 'codigo-p1', 4, '3', false),
  ('codigo-p2-a', 'codigo-p2', 1, '7', false),
  ('codigo-p2-b', 'codigo-p2', 2, '"7"', false),
  ('codigo-p2-c', 'codigo-p2', 3, '"52"', true),
  ('codigo-p2-d', 'codigo-p2', 4, 'Un error', false),
  ('codigo-p3-a', 'codigo-p3', 1, 'undefined', true),
  ('codigo-p3-b', 'codigo-p3', 2, '3', false),
  ('codigo-p3-c', 'codigo-p3', 3, 'null', false),
  ('codigo-p3-d', 'codigo-p3', 4, 'Un error', false),
  ('codigo-p4-a', 'codigo-p4', 1, '2.5', false),
  ('codigo-p4-b', 'codigo-p4', 2, '2', true),
  ('codigo-p4-c', 'codigo-p4', 3, '4', false),
  ('codigo-p4-d', 'codigo-p4', 4, '0', false),
  ('codigo-p5-a', 'codigo-p5', 1, 'si', false),
  ('codigo-p5-b', 'codigo-p5', 2, 'no', true),
  ('codigo-p5-c', 'codigo-p5', 3, 'No muestra nada', false),
  ('codigo-p5-d', 'codigo-p5', 4, 'Un error', false)
) as v (id, pregunta_id, orden, texto, es_correcta)
where not exists (select 1 from public.opciones_desafio t where t.id = v.id);

commit;
