-- ============================================================
-- SCHEMA HOMECARE - Compatible con Spring Boot / JPA (Long id)
-- ============================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN PARA ACTUALIZAR FECHAS AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RESET: Eliminar tablas en orden inverso de dependencias
-- ============================================================
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS mensajes CASCADE;
DROP TABLE IF EXISTS servicios_aceptados CASCADE;
DROP TABLE IF EXISTS ofertas CASCADE;
DROP TABLE IF EXISTS solicitudes CASCADE;
DROP TABLE IF EXISTS usuario_roles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================================
-- 3. TABLA: usuarios
-- id BIGSERIAL (Long en Java) — NO vinculado a auth.users
-- password almacenado en backend (JWT propio)
-- supabase_uid opcional para integraciones futuras
-- ============================================================
CREATE TABLE usuarios (
    id                              BIGSERIAL PRIMARY KEY,
    email                           VARCHAR(255) UNIQUE NOT NULL,
    password                        VARCHAR(255) NOT NULL,
    nombre                          VARCHAR(100) NOT NULL,
    apellido                        VARCHAR(100) NOT NULL,
    telefono                        VARCHAR(20),
    foto_perfil                     VARCHAR(500),
    documento_identidad             VARCHAR(50),
    descripcion                     TEXT,
    experiencia_anos                INTEGER DEFAULT 0,
    servicios_completados           INTEGER DEFAULT 0,
    calificacion_promedio           DECIMAL(3,2) DEFAULT 0.00,
    latitud                         DECIMAL(10,8),
    longitud                        DECIMAL(11,8),
    direccion                       TEXT,
    ultima_ubicacion                TIMESTAMP WITH TIME ZONE,
    loyalty_points                  INTEGER DEFAULT 0,
    ultimo_acceso                   TIMESTAMP WITH TIME ZONE,
    supabase_uid                    VARCHAR(36) UNIQUE,
    activo                          BOOLEAN DEFAULT TRUE,
    verificado                      BOOLEAN DEFAULT FALSE,
    disponible                      BOOLEAN DEFAULT TRUE,
    foto_selfie_verificacion        VARCHAR(500),
    foto_cedula_frontal             VARCHAR(500),
    foto_cedula_posterior           VARCHAR(500),
    archivo_antecedentes            VARCHAR(500),
    verificacion_ia_score           DOUBLE PRECISION,
    comentarios_verificacion        TEXT,
    fecha_verificacion              TIMESTAMP WITH TIME ZONE,
    intento_verificacion_concluido  BOOLEAN DEFAULT FALSE,
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_calificacion CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5)
);

-- 4. TABLA: roles
CREATE TABLE IF NOT EXISTS roles (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: usuario_roles (BIGINT — no UUID)
CREATE TABLE usuario_roles (
    usuario_id  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id      BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- 6. TABLA: solicitudes (cliente_id BIGINT)
CREATE TABLE solicitudes (
    id                      BIGSERIAL PRIMARY KEY,
    cliente_id              BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo                  VARCHAR(200) NOT NULL,
    descripcion             TEXT NOT NULL,
    tipo_limpieza           VARCHAR(50) NOT NULL,
    direccion               TEXT NOT NULL,
    latitud                 DECIMAL(10,8) NOT NULL,
    longitud                DECIMAL(11,8) NOT NULL,
    referencia_direccion    TEXT,
    metros_cuadrados        DECIMAL(8,2),
    cantidad_habitaciones   INTEGER,
    cantidad_banos          INTEGER,
    tiene_mascotas          BOOLEAN DEFAULT FALSE,
    precio_maximo           DECIMAL(10,2),
    fecha_servicio          DATE NOT NULL,
    hora_inicio             TIME NOT NULL,
    duracion_estimada       INTEGER,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'ABIERTA',
    cantidad_ofertas        INTEGER DEFAULT 0,
    oferta_aceptada_id      BIGINT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expira_en               TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_precio_maximo CHECK (precio_maximo IS NULL OR precio_maximo > 0)
);

-- 7. TABLA: ofertas (proveedor_id BIGINT)
CREATE TABLE ofertas (
    id                      BIGSERIAL PRIMARY KEY,
    solicitud_id            BIGINT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    proveedor_id            BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    precio_ofrecido         DECIMAL(10,2) NOT NULL,
    mensaje_oferta          TEXT,
    tiempo_llegada_minutos  INTEGER,
    materiales_incluidos    BOOLEAN DEFAULT FALSE,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    vista_por_cliente       BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_oferta_proveedor UNIQUE (solicitud_id, proveedor_id)
);

-- 8. SERVICIOS ACEPTADOS (todos BIGINT)
CREATE TABLE servicios_aceptados (
    id                  BIGSERIAL PRIMARY KEY,
    solicitud_id        BIGINT NOT NULL UNIQUE REFERENCES solicitudes(id) ON DELETE CASCADE,
    oferta_id           BIGINT NOT NULL UNIQUE REFERENCES ofertas(id) ON DELETE CASCADE,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    proveedor_id        BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    precio_acordado     DECIMAL(10,2) NOT NULL,
    estado              VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO',
    confirmado_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    en_camino_at        TIMESTAMP WITH TIME ZONE,
    llegue_at           TIMESTAMP WITH TIME ZONE,
    iniciado_at         TIMESTAMP WITH TIME ZONE,
    completado_at       TIMESTAMP WITH TIME ZONE,
    cancelado_at        TIMESTAMP WITH TIME ZONE,
    motivo_cancelacion  TEXT,
    fotos_antes         TEXT[],
    fotos_despues       TEXT[],
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MENSAJERÍA (remitente/destinatario BIGINT)
CREATE TABLE mensajes (
    id              BIGSERIAL PRIMARY KEY,
    solicitud_id    BIGINT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    remitente_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    destinatario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido       TEXT NOT NULL,
    leido           BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. PAGOS (cliente_id/proveedor_id BIGINT)
CREATE TABLE pagos (
    id                  BIGSERIAL PRIMARY KEY,
    servicio_id         BIGINT NOT NULL REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    proveedor_id        BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    monto_total         DECIMAL(10,2) NOT NULL,
    comision_plataforma DECIMAL(10,2) NOT NULL,
    monto_proveedor     DECIMAL(10,2) NOT NULL,
    estado              VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    metodo_pago         VARCHAR(50),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TRIGGERS DE ACTUALIZACIÓN DE FECHA
DROP TRIGGER IF EXISTS tr_update_usuarios ON usuarios;
CREATE TRIGGER tr_update_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
DROP TRIGGER IF EXISTS tr_update_solicitudes ON solicitudes;
CREATE TRIGGER tr_update_solicitudes BEFORE UPDATE ON solicitudes FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
DROP TRIGGER IF EXISTS tr_update_ofertas ON ofertas;
CREATE TRIGGER tr_update_ofertas BEFORE UPDATE ON ofertas FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
DROP TRIGGER IF EXISTS tr_update_servicios ON servicios_aceptados;
CREATE TRIGGER tr_update_servicios BEFORE UPDATE ON servicios_aceptados FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 12. SEED: Roles base (con prefijo ROLE_ que espera Spring Security)
INSERT INTO public.roles (nombre, descripcion) VALUES
  ('ROLE_CUSTOMER', 'Cliente que solicita servicios'),
  ('ROLE_SERVICE_PROVIDER', 'Profesional que ofrece servicios'),
  ('ROLE_ADMIN', 'Administrador del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- 13. DESACTIVAR RLS para permitir inserts desde el backend
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_aceptados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos DISABLE ROW LEVEL SECURITY;