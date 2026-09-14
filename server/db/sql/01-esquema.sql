-- =====================================================================
-- Sintaxia · Esquema de la base de datos (MySQL 8 / MariaDB 10.6+)
--
-- Se ejecuta con:  npm run db:migrar
-- Todas las tablas usan InnoDB y utf8mb4 (para que los emojis de las
-- medallas y los nombres con acentos se guarden bien).
-- =====================================================================

-- ---------------------------------------------------------------------
-- usuarios: una fila por persona registrada.
-- El progreso agregado (xp, racha) se guarda desnormalizado aca para no
-- tener que recalcularlo en cada pantalla.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario         VARCHAR(30)     NOT NULL,               -- nombre unico, para el ranking
  nombre          VARCHAR(80)     NOT NULL,
  email           VARCHAR(190)    NOT NULL,
  avatar_url      VARCHAR(500)        NULL,               -- foto que devuelve Google/GitHub
  avatar_icono    VARCHAR(40)         NULL,               -- icono elegido dentro de la app
  bio             VARCHAR(160)        NULL,
  pais            CHAR(2)             NULL,               -- codigo ISO, ej: AR
  xp_total        INT UNSIGNED    NOT NULL DEFAULT 0,
  racha_actual    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  racha_maxima    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  meta_diaria     SMALLINT UNSIGNED NOT NULL DEFAULT 50,
  ultima_actividad DATE               NULL,
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_xp (xp_total DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- identidades: como inicio sesion cada usuario.
-- Una misma persona puede tener Google y GitHub apuntando a la misma
-- cuenta (se vinculan por email verificado).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identidades (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id    BIGINT UNSIGNED NOT NULL,
  proveedor     ENUM('google','github','demo') NOT NULL,
  proveedor_id  VARCHAR(190)    NOT NULL,                 -- "sub" de Google / "id" de GitHub
  email         VARCHAR(190)        NULL,
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP           NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_identidad (proveedor, proveedor_id),
  KEY idx_identidades_usuario (usuario_id),
  CONSTRAINT fk_identidades_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- progreso_lecciones: una fila por (usuario, leccion).
-- Guarda el mejor resultado y cuantas veces la repitio.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progreso_lecciones (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id     BIGINT UNSIGNED NOT NULL,
  curso_id       VARCHAR(40)     NOT NULL,
  unidad_id      VARCHAR(40)     NOT NULL,
  leccion_id     VARCHAR(40)     NOT NULL,
  aciertos       TINYINT UNSIGNED NOT NULL,
  total          TINYINT UNSIGNED NOT NULL,
  mejor_aciertos TINYINT UNSIGNED NOT NULL,
  intentos       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  xp_ganado      SMALLINT UNSIGNED NOT NULL DEFAULT 0,    -- xp acumulado en esta leccion
  completada_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_progreso (usuario_id, leccion_id),
  KEY idx_progreso_unidad (usuario_id, unidad_id),
  CONSTRAINT fk_progreso_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- actividad_diaria: XP por dia. Alimenta el calendario del perfil y el
-- ranking semanal.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividad_diaria (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  fecha      DATE            NOT NULL,
  xp         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  lecciones  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_actividad (usuario_id, fecha),
  KEY idx_actividad_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- medallas: catalogo fijo de logros. Se carga con npm run db:sembrar.
-- requisito_tipo + requisito_valor permiten evaluarlas automaticamente.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medallas (
  id              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(40)  NOT NULL,
  nombre          VARCHAR(60)  NOT NULL,
  descripcion     VARCHAR(160) NOT NULL,
  icono           VARCHAR(16)  NOT NULL,
  categoria       ENUM('constancia','volumen','precision','progreso','especial') NOT NULL,
  nivel           ENUM('bronce','plata','oro','diamante') NOT NULL,
  requisito_tipo  ENUM('lecciones','lecciones_perfectas','racha','xp','xp_dia','unidades','curso') NOT NULL,
  requisito_valor INT UNSIGNED NOT NULL,
  orden           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medalla_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- usuario_medallas: que medallas gano cada usuario y cuando.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_medallas (
  usuario_id  BIGINT UNSIGNED   NOT NULL,
  medalla_id  SMALLINT UNSIGNED NOT NULL,
  obtenida_en TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, medalla_id),
  KEY idx_um_medalla (medalla_id),
  CONSTRAINT fk_um_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_um_medalla FOREIGN KEY (medalla_id)
    REFERENCES medallas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
