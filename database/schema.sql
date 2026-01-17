-- ============================================
-- HOMECARE DATABASE SCHEMA
-- Modelo inDriver: Sistema de Ofertas Competitivas
-- PostgreSQL
-- ============================================

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    foto_perfil VARCHAR(500),
    
    -- Proveedor específico
    documento_identidad VARCHAR(50),
    descripcion TEXT,
    experiencia_anos INTEGER,
    servicios_completados INTEGER DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    
    -- Geolocalización
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    direccion TEXT,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    disponible BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_calificacion CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_latitud_longitud ON usuarios(latitud, longitud);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (nombre, descripcion) VALUES 
    ('CUSTOMER', 'Cliente que solicita servicios'),
    ('SERVICE_PROVIDER', 'Proveedor de servicios de limpieza'),
    ('ADMIN', 'Administrador del sistema');

-- ============================================
-- TABLA: usuario_roles (Many-to-Many)
-- ============================================
CREATE TABLE usuario_roles (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX idx_usuario_roles_usuario ON usuario_roles(usuario_id);
CREATE INDEX idx_usuario_roles_rol ON usuario_roles(rol_id);

-- ============================================
-- TABLA: solicitudes
-- Publicadas por CLIENTES
-- ============================================
CREATE TABLE solicitudes (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    
    -- Detalles del servicio
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_limpieza VARCHAR(50) NOT NULL, -- BASICA, PROFUNDA, OFICINA, POST_CONSTRUCCION
    
    -- Ubicación
    direccion TEXT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    referencia_direccion TEXT,
    
    -- Detalles del lugar
    metros_cuadrados DECIMAL(8,2),
    cantidad_habitaciones INTEGER,
    cantidad_banos INTEGER,
    tiene_mascotas BOOLEAN DEFAULT FALSE,
    
    -- Precio y timing
    precio_maximo DECIMAL(10,2), -- Opcional: precio máximo que el cliente está dispuesto a pagar
    fecha_servicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracion_estimada INTEGER, -- minutos
    
    -- Estado del sistema inDriver
    estado VARCHAR(30) NOT NULL DEFAULT 'ABIERTA', -- ABIERTA, EN_NEGOCIACION, ACEPTADA, EN_PROGRESO, COMPLETADA, CANCELADA
    
    -- Tracking
    cantidad_ofertas INTEGER DEFAULT 0,
    oferta_aceptada_id BIGINT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP, -- Fecha límite para recibir ofertas
    
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_precio_maximo CHECK (precio_maximo IS NULL OR precio_maximo > 0),
    CONSTRAINT chk_metros CHECK (metros_cuadrados IS NULL OR metros_cuadrados > 0)
);

CREATE INDEX idx_solicitudes_cliente ON solicitudes(cliente_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes(fecha_servicio);
CREATE INDEX idx_solicitudes_latitud_longitud ON solicitudes(latitud, longitud);
CREATE INDEX idx_solicitudes_created ON solicitudes(created_at DESC);

-- ============================================
-- TABLA: ofertas
-- Enviadas por PROVEEDORES a una solicitud específica
-- MODELO inDriver: cada proveedor propone SU precio
-- ============================================
CREATE TABLE ofertas (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL,
    proveedor_id BIGINT NOT NULL,
    
    -- Oferta del proveedor (CRÍTICO: el proveedor define el precio)
    precio_ofrecido DECIMAL(10,2) NOT NULL,
    mensaje_oferta TEXT,
    
    -- Detalles adicionales
    tiempo_llegada_minutos INTEGER, -- Cuánto tarda en llegar
    materiales_incluidos BOOLEAN DEFAULT FALSE,
    
    -- Estado
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ACEPTADA, RECHAZADA, RETIRADA
    
    -- Tracking
    vista_por_cliente BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_precio_ofrecido CHECK (precio_ofrecido > 0),
    CONSTRAINT chk_tiempo_llegada CHECK (tiempo_llegada_minutos IS NULL OR tiempo_llegada_minutos >= 0),
    CONSTRAINT unique_oferta_proveedor UNIQUE (solicitud_id, proveedor_id) -- Un proveedor, una oferta por solicitud
);

CREATE INDEX idx_ofertas_solicitud ON ofertas(solicitud_id);
CREATE INDEX idx_ofertas_proveedor ON ofertas(proveedor_id);
CREATE INDEX idx_ofertas_estado ON ofertas(estado);
CREATE INDEX idx_ofertas_created ON ofertas(created_at DESC);

-- ============================================
-- TABLA: servicios_aceptados
-- Cuando un cliente acepta una oferta
-- ============================================
CREATE TABLE servicios_aceptados (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL UNIQUE,
    oferta_id BIGINT NOT NULL UNIQUE,
    cliente_id BIGINT NOT NULL,
    proveedor_id BIGINT NOT NULL,
    
    -- Detalles finales del servicio
    precio_acordado DECIMAL(10,2) NOT NULL,
    
    -- Estados del servicio (tracking real)
    estado VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO', -- CONFIRMADO, EN_CAMINO, LLEGUE, EN_PROGRESO, COMPLETADO, CANCELADO
    
    -- Timestamps de estados
    confirmado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    en_camino_at TIMESTAMP,
    llegue_at TIMESTAMP,
    iniciado_at TIMESTAMP,
    completado_at TIMESTAMP,
    cancelado_at TIMESTAMP,
    motivo_cancelacion TEXT,
    
    -- Evidencias
    fotos_antes TEXT[], -- Array de URLs
    fotos_despues TEXT[], -- Array de URLs
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_precio_acordado CHECK (precio_acordado > 0)
);

CREATE INDEX idx_servicios_cliente ON servicios_aceptados(cliente_id);
CREATE INDEX idx_servicios_proveedor ON servicios_aceptados(proveedor_id);
CREATE INDEX idx_servicios_estado ON servicios_aceptados(estado);
CREATE INDEX idx_servicios_created ON servicios_aceptados(created_at DESC);

-- ============================================
-- TABLA: mensajes (Chat en tiempo real)
-- Negociación entre cliente y proveedor
-- ============================================
CREATE TABLE mensajes (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL,
    remitente_id BIGINT NOT NULL,
    destinatario_id BIGINT NOT NULL,
    
    -- Contenido
    contenido TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'TEXTO', -- TEXTO, IMAGEN, ARCHIVO
    archivo_url VARCHAR(500),
    
    -- Estado
    leido BOOLEAN DEFAULT FALSE,
    leido_at TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_mensajes_solicitud ON mensajes(solicitud_id);
CREATE INDEX idx_mensajes_remitente ON mensajes(remitente_id);
CREATE INDEX idx_mensajes_destinatario ON mensajes(destinatario_id);
CREATE INDEX idx_mensajes_created ON mensajes(created_at DESC);

-- ============================================
-- TABLA: calificaciones
-- Calificación mutua: cliente califica proveedor y viceversa
-- ============================================
CREATE TABLE calificaciones (
    id BIGSERIAL PRIMARY KEY,
    servicio_id BIGINT NOT NULL,
    calificador_id BIGINT NOT NULL,
    calificado_id BIGINT NOT NULL,
    
    -- Calificación
    puntuacion INTEGER NOT NULL,
    comentario TEXT,
    
    -- Tipo
    tipo VARCHAR(20) NOT NULL, -- CLIENTE_A_PROVEEDOR, PROVEEDOR_A_CLIENTE
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (servicio_id) REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    FOREIGN KEY (calificador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (calificado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_puntuacion CHECK (puntuacion >= 1 AND puntuacion <= 5),
    CONSTRAINT unique_calificacion UNIQUE (servicio_id, calificador_id)
);

CREATE INDEX idx_calificaciones_servicio ON calificaciones(servicio_id);
CREATE INDEX idx_calificaciones_calificado ON calificaciones(calificado_id);

-- ============================================
-- TABLA: pagos
-- Integración con Wompi
-- ============================================
CREATE TABLE pagos (
    id BIGSERIAL PRIMARY KEY,
    servicio_id BIGINT NOT NULL,
    cliente_id BIGINT NOT NULL,
    proveedor_id BIGINT NOT NULL,
    
    -- Montos
    monto_total DECIMAL(10,2) NOT NULL,
    comision_plataforma DECIMAL(10,2) NOT NULL,
    monto_proveedor DECIMAL(10,2) NOT NULL,
    
    -- Wompi
    transaccion_id VARCHAR(255) UNIQUE,
    referencia VARCHAR(255) UNIQUE,
    
    -- Estado
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO, REEMBOLSADO
    metodo_pago VARCHAR(50), -- PSE, TARJETA_CREDITO, TARJETA_DEBITO, NEQUI
    
    -- Detalles
    aprobado_at TIMESTAMP,
    rechazado_at TIMESTAMP,
    motivo_rechazo TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (servicio_id) REFERENCES servicios_aceptados(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_monto_total CHECK (monto_total > 0)
);

CREATE INDEX idx_pagos_servicio ON pagos(servicio_id);
CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_proveedor ON pagos(proveedor_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_transaccion ON pagos(transaccion_id);

-- ============================================
-- TABLA: notificaciones
-- Push notifications y correos
-- ============================================
CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    
    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- NUEVA_SOLICITUD, NUEVA_OFERTA, OFERTA_ACEPTADA, MENSAJE_NUEVO, SERVICIO_INICIADO, etc.
    
    -- Referencia
    solicitud_id BIGINT,
    oferta_id BIGINT,
    servicio_id BIGINT,
    
    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    leida_at TIMESTAMP,
    enviada BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE SET NULL,
    FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE SET NULL,
    FOREIGN KEY (servicio_id) REFERENCES servicios_aceptados(id) ON DELETE SET NULL
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created ON notificaciones(created_at DESC);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Solicitudes con cantidad de ofertas y mejor oferta
CREATE VIEW v_solicitudes_con_ofertas AS
SELECT 
    s.*,
    COUNT(o.id) as total_ofertas,
    MIN(o.precio_ofrecido) as precio_minimo_oferta,
    MAX(o.precio_ofrecido) as precio_maximo_oferta,
    AVG(o.precio_ofrecido) as precio_promedio_ofertas
FROM solicitudes s
LEFT JOIN ofertas o ON s.id = o.solicitud_id AND o.estado = 'PENDIENTE'
GROUP BY s.id;

-- Vista: Estadísticas del proveedor
CREATE VIEW v_estadisticas_proveedor AS
SELECT 
    u.id as proveedor_id,
    u.nombre,
    u.apellido,
    u.calificacion_promedio,
    COUNT(DISTINCT sa.id) as servicios_completados,
    AVG(p.monto_proveedor) as ganancia_promedio,
    SUM(p.monto_proveedor) as ganancia_total
FROM usuarios u
LEFT JOIN servicios_aceptados sa ON u.id = sa.proveedor_id AND sa.estado = 'COMPLETADO'
LEFT JOIN pagos p ON sa.id = p.servicio_id AND p.estado = 'APROBADO'
GROUP BY u.id;

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función: Actualizar calificación promedio del usuario
CREATE OR REPLACE FUNCTION actualizar_calificacion_usuario()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE usuarios
    SET calificacion_promedio = (
        SELECT COALESCE(AVG(puntuacion), 0)
        FROM calificaciones
        WHERE calificado_id = NEW.calificado_id
    ),
    servicios_completados = (
        SELECT COUNT(*)
        FROM servicios_aceptados
        WHERE proveedor_id = NEW.calificado_id AND estado = 'COMPLETADO'
    )
    WHERE id = NEW.calificado_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion
AFTER INSERT ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_calificacion_usuario();

-- Función: Actualizar contador de ofertas en solicitud
CREATE OR REPLACE FUNCTION actualizar_contador_ofertas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE solicitudes
        SET cantidad_ofertas = cantidad_ofertas + 1
        WHERE id = NEW.solicitud_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE solicitudes
        SET cantidad_ofertas = GREATEST(cantidad_ofertas - 1, 0)
        WHERE id = OLD.solicitud_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ofertas
AFTER INSERT OR DELETE ON ofertas
FOR EACH ROW
EXECUTE FUNCTION actualizar_contador_ofertas();

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_solicitudes_updated_at
BEFORE UPDATE ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_ofertas_updated_at
BEFORE UPDATE ON ofertas
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_servicios_updated_at
BEFORE UPDATE ON servicios_aceptados
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Usuario Admin
INSERT INTO usuarios (email, password, nombre, apellido, telefono, activo, verificado)
VALUES ('admin@homecare.com', '$2a$10$HASH', 'Admin', 'HOMECARE', '3001234567', true, true);

INSERT INTO usuario_roles (usuario_id, rol_id)
VALUES (1, 3);

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
