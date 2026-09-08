-- ============================================================================
-- HOMECARE DATABASE INITIAL SCHEMA (Flyway Migration V1)
-- PostgreSQL DDL Baseline
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255)
);

-- 2. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    ciudad VARCHAR(100) DEFAULT 'Bogotá',
    foto_perfil VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    disponible BOOLEAN DEFAULT FALSE,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    ultima_ubicacion_actualizada TIMESTAMP,
    calificacion_promedio NUMERIC(3,2) DEFAULT 5.0,
    total_servicios INTEGER DEFAULT 0,
    cuenta_verificada BOOLEAN DEFAULT FALSE,
    fcm_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USUARIO_ROLES (Junction)
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- 4. SOLICITUDES
CREATE TABLE IF NOT EXISTS solicitudes (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_limpieza VARCHAR(50) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) DEFAULT 'Bogotá',
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    num_habitaciones INTEGER NOT NULL DEFAULT 1,
    num_banos INTEGER NOT NULL DEFAULT 1,
    tiene_mascotas BOOLEAN DEFAULT FALSE,
    incluye_cocina BOOLEAN DEFAULT TRUE,
    incluye_sala BOOLEAN DEFAULT TRUE,
    incluye_balcon BOOLEAN DEFAULT FALSE,
    presupuesto_maximo NUMERIC(12,2),
    precio_estimado NUMERIC(12,2),
    fecha_servicio TIMESTAMP NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    profesional_asignado_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. OFERTAS
CREATE TABLE IF NOT EXISTS ofertas (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    proveedor_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    precio_propuesto NUMERIC(12,2) NOT NULL,
    duracion_estimada_minutos INTEGER NOT NULL DEFAULT 120,
    mensaje TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SERVICIOS ACEPTADOS
CREATE TABLE IF NOT EXISTS servicios_aceptados (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    oferta_id BIGINT REFERENCES ofertas(id) ON DELETE SET NULL,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    proveedor_id BIGINT NOT NULL REFERENCES usuarios(id),
    precio_acordado NUMERIC(12,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    pin_seguridad VARCHAR(6),
    codigo_qr VARCHAR(100),
    fecha_inicio_real TIMESTAMP,
    fecha_fin_real TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAGOS
CREATE TABLE IF NOT EXISTS pagos (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT REFERENCES solicitudes(id) ON DELETE SET NULL,
    servicio_id BIGINT REFERENCES servicios_aceptados(id) ON DELETE SET NULL,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    proveedor_id BIGINT NOT NULL REFERENCES usuarios(id),
    monto_total NUMERIC(12,2) NOT NULL,
    monto_comision NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_proveedor NUMERIC(12,2) NOT NULL,
    porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    estado_retencion VARCHAR(50) NOT NULL DEFAULT 'RETENIDO',
    metodo_pago VARCHAR(50) DEFAULT 'MERCADO_PAGO',
    transaccion_externa_id VARCHAR(100),
    preferencia_id VARCHAR(100),
    payment_link VARCHAR(500),
    referencia VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aprobado_at TIMESTAMP,
    fecha_liberacion TIMESTAMP
);

-- 8. CONFIGURACION COMISIONES
CREATE TABLE IF NOT EXISTS configuraciones_comision (
    id BIGSERIAL PRIMARY KEY,
    nivel_proveedor VARCHAR(50) NOT NULL DEFAULT 'BRONCE',
    porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    servicios_minimos INTEGER NOT NULL DEFAULT 0,
    calificacion_minima NUMERIC(3,2) NOT NULL DEFAULT 0.0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. USER TOKENS (Refresh & Verification)
CREATE TABLE IF NOT EXISTS user_tokens (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    revocado BOOLEAN DEFAULT FALSE,
    expira_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. EVIDENCIAS DE SERVICIO
CREATE TABLE IF NOT EXISTS evidencias_servicio (
    id BIGSERIAL PRIMARY KEY,
    servicio_id BIGINT NOT NULL REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    proveedor_id BIGINT NOT NULL REFERENCES usuarios(id),
    tipo_evidencia VARCHAR(50) NOT NULL, -- 'CHECK_IN', 'FOTO_ANTES', 'FOTO_DESPUES', 'CHECK_OUT'
    url_foto VARCHAR(500) NOT NULL,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. CONFORMIDAD Y CALIFICACIÓN
CREATE TABLE IF NOT EXISTS conformidades_servicio (
    id BIGSERIAL PRIMARY KEY,
    servicio_id BIGINT NOT NULL REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    cliente_id BIGINT NOT NULL REFERENCES usuarios(id),
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    conforme BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. DISPUTAS
CREATE TABLE IF NOT EXISTS disputas (
    id BIGSERIAL PRIMARY KEY,
    servicio_id BIGINT NOT NULL REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    iniciado_por_id BIGINT NOT NULL REFERENCES usuarios(id),
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'ABIERTA',
    resolucion TEXT,
    resuelto_por_id BIGINT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resuelto_at TIMESTAMP
);

-- ROLES INICIALES
INSERT INTO roles (nombre, descripcion) VALUES
    ('ROLE_CUSTOMER', 'Cliente de la plataforma')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
    ('ROLE_SERVICE_PROVIDER', 'Proveedor de servicios profesionales')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
    ('ROLE_ADMIN', 'Administrador del sistema')
ON CONFLICT (nombre) DO NOTHING;
