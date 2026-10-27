-- ===========================================================================
--  Sintaxia - Perfiles de participantes
--  Etapa 4 - Invitados, registro e inicio de sesion (Supabase Auth)
-- ---------------------------------------------------------------------------
--  Supabase Auth guarda las identidades (correo, contrasena, sesiones) en su
--  propio esquema `auth`. Esta etapa agrega, en `public`, lo que es de la
--  aplicacion y no de la autenticacion:
--
--    perfiles          un perfil por participante, con el MISMO id que auth.users
--
--  (Hasta la etapa 4 este script tambien creaba intentos_leccion, el historial
--  donde el cliente informaba sus aciertos. Desde la etapa 5 el progreso vive en
--  intentos y respuestas: ver 08-intentos-y-respuestas.sql.)
--
--  Reglas que NO se negocian:
--    · Ninguna tabla propia guarda contrasenas ni correos: eso vive solo en `auth`.
--    · El perfil se crea solo, con un disparador, cuando Auth crea al usuario.
--      El cliente nunca inserta perfiles.
--
--  Este script NO borra datos: se puede volver a correr sin perder perfiles (a diferencia de 01-esquema.sql, que reconstruye el contenido).
--
--  Se ejecuta despues de los scripts 01 a 04. Las politicas de RLS y los permisos
--  de estas tablas estan en 06-politicas-rls-etapa4.sql.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Reglas del alias
--    Una sola funcion para que el disparador de alta, el de conversion y las
--    restricciones de la tabla usen exactamente la misma definicion.
--
--    Permitido: 3 a 20 caracteres; letras sin tilde, numeros y guion bajo; sin
--    guion bajo al principio ni al final. Se excluyen tildes y simbolos a
--    proposito: evitan nombres que se ven iguales pero son distintos
--    (por ejemplo una "a" comun y una "а" cirilica).
-- ---------------------------------------------------------------------------
create or replace function public.alias_permitido(p_alias text, p_invitado boolean)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    p_alias is not null
    and p_alias ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$'
    -- Nombres que se confundirian con la organizacion o con el sistema.
    and lower(p_alias) not in (
      'admin', 'administrador', 'root', 'sintaxia', 'soporte',
      'moderador', 'sistema', 'staff', 'anonimo'
    )
    -- "Invitado" es el alias de los invitados y de nadie mas.
    and (lower(p_alias) <> 'invitado' or p_invitado);
$$;

comment on function public.alias_permitido(text, boolean) is
  'Reglas del alias: 3 a 20 caracteres, letras sin tilde, numeros y guion bajo, nombres reservados excluidos.';

-- ---------------------------------------------------------------------------
-- 2. PERFILES
-- ---------------------------------------------------------------------------
create table if not exists public.perfiles (
  id                uuid        primary key references auth.users (id) on delete cascade,
  alias             text        not null,
  alias_normalizado text        generated always as (lower(alias)) stored,
  codigo            smallint    not null,
  es_invitado       boolean     not null default true,
  avatar            text        not null default 'buho',
  meta_diaria       smallint    not null default 50,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),

  constraint ck_perfiles_alias    check (public.alias_permitido(alias, es_invitado)),
  constraint ck_perfiles_codigo   check (codigo between 1 and 9999),
  constraint ck_perfiles_avatar   check (avatar in ('buho', 'robot', 'astronauta', 'cohete', 'gema', 'rayo', 'corona', 'diana')),
  constraint ck_perfiles_meta     check (meta_diaria in (20, 50, 100)),
  -- Un invitado no elige alias: se llama "Invitado" hasta que crea su cuenta.
  constraint ck_perfiles_invitado check (not es_invitado or alias_normalizado = 'invitado'),
  -- Dos participantes pueden llamarse igual, pero no tener el mismo alias Y codigo.
  constraint uq_perfiles_alias_codigo unique (alias_normalizado, codigo)
);

comment on table  public.perfiles is 'Perfil de cada participante. Mismo id que auth.users; no guarda contrasenas ni correos.';
comment on column public.perfiles.alias is 'Nombre visible. Reglas en public.alias_permitido().';
comment on column public.perfiles.codigo is 'Codigo de 4 cifras que distingue a participantes con el mismo alias: se muestra como Ana#0427.';
comment on column public.perfiles.es_invitado is 'Espejo de auth.users.is_anonymous. Lo mantiene un disparador; el cliente no lo puede cambiar.';

-- Seguro por defecto: con RLS encendida y sin politicas, nadie ve nada. Los permisos
-- y las politicas estan en 06-politicas-rls-etapa4.sql, que tambien cierra los
-- permisos amplios que Supabase da a las tablas nuevas de public.
--
-- (Este script no toca permisos a proposito: asi se puede volver a correr sin
-- deshacer lo que dejo configurado el 06.)
alter table public.perfiles enable row level security;

drop trigger if exists tg_perfiles_actualizacion on public.perfiles;
create trigger tg_perfiles_actualizacion
  before update on public.perfiles
  for each row execute function public.fn_marcar_actualizacion();

-- ---------------------------------------------------------------------------
-- 3. Codigo que distingue a participantes con el mismo alias
--    Se elige al azar entre los que estan libres para ese alias. Si por mala
--    suerte el azar falla muchas veces, se recorre el rango en orden.
--
--    SECURITY DEFINER es imprescindible: cuando alguien cambia su alias, el
--    disparador corre con SUS permisos, y con ellos solo veria su propio perfil
--    (RLS) y no podria leer la columna alias_normalizado. No podria saber que
--    codigos ya usan otras personas con ese alias.
-- ---------------------------------------------------------------------------
create or replace function public.fn_perfiles_asignar_codigo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo integer;
  v_intentos integer := 0;
begin
  -- Cambiar solo mayusculas y minusculas ("ana" -> "Ana") no cambia la identidad.
  if tg_op = 'UPDATE' and lower(new.alias) = lower(old.alias) then
    new.codigo := old.codigo;
    return new;
  end if;

  loop
    v_codigo := 1 + floor(random() * 9999)::integer;
    exit when not exists (
      select 1 from public.perfiles p
       where p.alias_normalizado = lower(new.alias)
         and p.codigo = v_codigo
         and p.id <> new.id
    );
    v_intentos := v_intentos + 1;
    if v_intentos >= 40 then
      select c into v_codigo
        from generate_series(1, 9999) c
       where not exists (
         select 1 from public.perfiles p
          where p.alias_normalizado = lower(new.alias)
            and p.codigo = c
            and p.id <> new.id
       )
       limit 1;
      if v_codigo is null then
        raise exception 'No quedan codigos libres para el alias "%".', new.alias
          using errcode = 'unique_violation';
      end if;
      exit;
    end if;
  end loop;

  new.codigo := v_codigo;
  return new;
end;
$$;

drop trigger if exists tg_perfiles_codigo on public.perfiles;
create trigger tg_perfiles_codigo
  before insert or update on public.perfiles
  for each row execute function public.fn_perfiles_asignar_codigo();

-- ---------------------------------------------------------------------------
-- 4. Alta automatica del perfil cuando Auth crea un usuario
--
--    · Invitado (sesion anonima)  -> alias "Invitado", sin importar lo que mande el cliente.
--    · Registro con correo        -> el alias viene en user_metadata.alias; si falta o
--                                    no cumple las reglas se usa "Jugador", para que un
--                                    alias malo nunca impida crear la cuenta.
--
--    SECURITY DEFINER: lo dispara Auth, que no tiene permisos sobre `public`.
-- ---------------------------------------------------------------------------
create or replace function public.fn_crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitado boolean := coalesce(new.is_anonymous, false);
  v_alias    text;
begin
  if v_invitado then
    v_alias := 'Invitado';
  else
    v_alias := nullif(btrim(new.raw_user_meta_data ->> 'alias'), '');
    if not public.alias_permitido(v_alias, false) then
      v_alias := 'Jugador';
    end if;
  end if;

  insert into public.perfiles (id, alias, codigo, es_invitado)
  values (new.id, v_alias, 1, v_invitado)   -- el codigo real lo asigna el disparador de perfiles
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists tg_auth_crear_perfil on auth.users;
create trigger tg_auth_crear_perfil
  after insert on auth.users
  for each row execute function public.fn_crear_perfil();

-- ---------------------------------------------------------------------------
-- 5. Conversion de invitado a cuenta permanente
--
--    Cuando un invitado agrega correo y contrasena, Auth conserva SU MISMO id y
--    recien al confirmar el correo pone is_anonymous = false. En ese momento
--    el perfil pasa a ser de una cuenta y toma el alias elegido, que viajo en
--    user_metadata.alias. Como el id no cambia, el historial sigue siendo suyo:
--    no se crea otra cuenta ni se copia nada desde el cliente.
-- ---------------------------------------------------------------------------
create or replace function public.fn_sincronizar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alias text;
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  v_alias := nullif(btrim(new.raw_user_meta_data ->> 'alias'), '');
  if not public.alias_permitido(v_alias, false) then
    v_alias := 'Jugador';
  end if;

  update public.perfiles
     set es_invitado = false,
         alias = v_alias
   where id = new.id;

  return new;
end;
$$;

drop trigger if exists tg_auth_sincronizar_perfil on auth.users;
create trigger tg_auth_sincronizar_perfil
  after update on auth.users
  for each row
  when (old.is_anonymous is distinct from new.is_anonymous)
  execute function public.fn_sincronizar_perfil();

-- Las funciones de disparador no tienen por que poder llamarse desde la API.
revoke all on function public.fn_perfiles_asignar_codigo() from public, anon, authenticated;
revoke all on function public.fn_crear_perfil()        from public, anon, authenticated;
revoke all on function public.fn_sincronizar_perfil()  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Perfiles de usuarios que ya existian antes de este script
-- ---------------------------------------------------------------------------
insert into public.perfiles (id, alias, codigo, es_invitado)
select u.id,
       case
         when coalesce(u.is_anonymous, false) then 'Invitado'
         when public.alias_permitido(nullif(btrim(u.raw_user_meta_data ->> 'alias'), ''), false)
           then btrim(u.raw_user_meta_data ->> 'alias')
         else 'Jugador'
       end,
       1,
       coalesce(u.is_anonymous, false)
  from auth.users u
 on conflict (id) do nothing;

commit;
