-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- HomeCare API - Migration V2
-- ============================================

-- Índice para búsqueda de usuarios por email (login)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Índice para búsqueda por teléfono
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);

-- Índice para usuarios activos
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Índice compuesto para proveedores disponibles
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_disponible 
ON usuarios(activo, disponible) 
WHERE activo = true AND disponible = true;

-- Índice para rol (para queries filtradas por rol)
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ============================================
-- ÍNDICES PARA SOLICITUDES
-- ============================================

-- Índice para solicitudes por cliente
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente_id ON solicitudes(cliente_id);

-- Índice para solicitudes por estado
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);

-- Índice compuesto para solicitudes pendientes con fecha
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_fecha 
ON solicitudes(estado, fecha_creacion DESC);

-- Índice espacial para búsqueda geográfica (PostGIS)
-- Asumiendo que las columnas se llaman latitud y longitud
CREATE INDEX IF NOT EXISTS idx_solicitudes_ubicacion 
ON solicitudes USING GIST(
    ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
);

-- Índice para búsqueda por categoría de servicio
CREATE INDEX IF NOT EXISTS idx_solicitudes_categoria ON solicitudes(categoria_servicio);

-- ============================================
-- ÍNDICES PARA OFERTAS
-- ============================================

-- Índice para ofertas por solicitud
CREATE INDEX IF NOT EXISTS idx_ofertas_solicitud_id ON ofertas(solicitud_id);

-- Índice para ofertas por proveedor
CREATE INDEX IF NOT EXISTS idx_ofertas_proveedor_id ON ofertas(proveedor_id);

-- Índice para ofertas por estado
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON ofertas(estado);

-- Índice compuesto para ofertas pendientes con fecha
CREATE INDEX IF NOT EXISTS idx_ofertas_estado_fecha 
ON ofertas(estado, fecha_creacion DESC);

-- Índice compuesto para encontrar ofertas pendientes de una solicitud
CREATE INDEX IF NOT EXISTS idx_ofertas_solicitud_estado 
ON ofertas(solicitud_id, estado)
WHERE estado = 'PENDIENTE';

-- ============================================
-- ÍNDICES PARA SERVICIOS ACEPTADOS
-- ============================================

-- Índice para servicios por cliente
CREATE INDEX IF NOT EXISTS idx_servicios_cliente_id ON servicios_aceptados(cliente_id);

-- Índice para servicios por proveedor
CREATE INDEX IF NOT EXISTS idx_servicios_proveedor_id ON servicios_aceptados(proveedor_id);

-- Índice para servicios por estado
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios_aceptados(estado);

-- Índice compuesto para servicios activos
CREATE INDEX IF NOT EXISTS idx_servicios_estado_proveedor 
ON servicios_aceptados(proveedor_id, estado)
WHERE estado IN ('EN_PROGRESO', 'EN_CAMINO');

-- Índice para fecha de inicio (para reportes)
CREATE INDEX IF NOT EXISTS idx_servicios_fecha_inicio 
ON servicios_aceptados(fecha_inicio DESC);

-- ============================================
-- ÍNDICES PARA PAGOS
-- ============================================

-- Índice para pagos por servicio
CREATE INDEX IF NOT EXISTS idx_pagos_servicio_id ON pagos(servicio_id);

-- Índice para pagos por estado
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);

-- Índice para referencia de pago (único para webhooks de Wompi)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_referencia ON pagos(referencia);

-- Índice para pagos por cliente (para historial)
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON pagos(cliente_id);

-- Índice para fecha de pago (reportes)
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago DESC);

-- Índice compuesto para pagos aprobados
CREATE INDEX IF NOT EXISTS idx_pagos_estado_fecha 
ON pagos(estado, fecha_pago DESC)
WHERE estado = 'APROBADO';

-- ============================================
-- ÍNDICES PARA MENSAJES (CHAT)
-- ============================================

-- Índice para mensajes por servicio
CREATE INDEX IF NOT EXISTS idx_mensajes_servicio_id ON mensajes(servicio_id);

-- Índice para mensajes por remitente
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente_id ON mensajes(remitente_id);

-- Índice para mensajes por fecha (orden cronológico)
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha ON mensajes(fecha_envio DESC);

-- Índice compuesto para obtener mensajes de un servicio ordenados
CREATE INDEX IF NOT EXISTS idx_mensajes_servicio_fecha 
ON mensajes(servicio_id, fecha_envio ASC);

-- ============================================
-- ÍNDICES PARA NOTIFICACIONES
-- ============================================

-- Índice para notificaciones por usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);

-- Índice para notificaciones no leídas (común query)
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida 
ON notificaciones(usuario_id, leida, fecha_envio DESC) 
WHERE leida = false;

-- Índice para fecha de envío
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones(fecha_envio DESC);

-- ============================================
-- ÍNDICES PARA CALIFICACIONES
-- ============================================

-- Índice para calificaciones por servicio
CREATE INDEX IF NOT EXISTS idx_calificaciones_servicio_id ON calificaciones(servicio_id);

-- Índice para calificaciones por proveedor (calcular promedio)
CREATE INDEX IF NOT EXISTS idx_calificaciones_proveedor_id ON calificaciones(proveedor_id);

-- Índice para calificaciones por cliente
CREATE INDEX IF NOT EXISTS idx_calificaciones_cliente_id ON calificaciones(cliente_id);

-- Índice para fecha de calificación
CREATE INDEX IF NOT EXISTS idx_calificaciones_fecha ON calificaciones(fecha_calificacion DESC);

-- ============================================
-- ÍNDICES PARA UBICACIONES DE PROVEEDORES (TRACKING)
-- ============================================

-- Índice spatial para ubicaciones
CREATE INDEX IF NOT EXISTS idx_ubicaciones_proveedor_ubicacion 
ON ubicaciones_proveedor USING GIST(
    ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
);

-- Índice para ubicación actual de proveedor
CREATE INDEX IF NOT EXISTS idx_ubicaciones_proveedor_activo 
ON ubicaciones_proveedor(proveedor_id, activo, fecha_actualizacion DESC) 
WHERE activo = true;

-- Índice para tracking por servicio
CREATE INDEX IF NOT EXISTS idx_ubicaciones_servicio_id 
ON ubicaciones_proveedor(servicio_id, fecha_actualizacion DESC)
WHERE servicio_id IS NOT NULL;

-- ============================================
-- ÍNDICES PARA PROMOCIONES
-- ============================================

-- Índice para promociones activas
CREATE INDEX IF NOT EXISTS idx_promociones_activa 
ON promociones(activa, fecha_inicio, fecha_fin)
WHERE activa = true;

-- Índice para código promocional (búsqueda rápida)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promociones_codigo ON promociones(codigo);

-- ============================================
-- ÍNDICES PARA SUSCRIPCIONES
-- ============================================

-- Índice para suscripciones por usuario
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario_id ON suscripciones(usuario_id);

-- Índice para suscripciones activas
CREATE INDEX IF NOT EXISTS idx_suscripciones_activa 
ON suscripciones(usuario_id, activa, fecha_fin DESC)
WHERE activa = true;

-- Índice para fecha de renovación (para proceso batch)
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin 
ON suscripciones(fecha_fin ASC)
WHERE activa = true;

-- ============================================
-- ÍNDICES PARA HISTORIAL DE UBICACIONES
-- ============================================

-- Índice para historial por proveedor
CREATE INDEX IF NOT EXISTS idx_historial_ubicaciones_proveedor 
ON historial_ubicaciones(proveedor_id, fecha_registro DESC);

-- Índice spatial para análisis de zonas
CREATE INDEX IF NOT EXISTS idx_historial_ubicaciones_geo 
ON historial_ubicaciones USING GIST(
    ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)
);

-- ============================================
-- ANALYZE TABLES
-- Actualizar estadísticas para el query planner
-- ============================================

ANALYZE usuarios;
ANALYZE solicitudes;
ANALYZE ofertas;
ANALYZE servicios_aceptados;
ANALYZE pagos;
ANALYZE mensajes;
ANALYZE notificaciones;
ANALYZE calificaciones;
ANALYZE ubicaciones_proveedor;
ANALYZE promociones;
ANALYZE suscripciones;

-- ============================================
-- COMENTARIOS INFORMATIVOS
-- ============================================

COMMENT ON INDEX idx_usuarios_email IS 'Optimiza login y búsqueda por email';
COMMENT ON INDEX idx_solicitudes_ubicacion IS 'Índice espacial para búsquedas geográficas de solicitudes';
COMMENT ON INDEX idx_ofertas_solicitud_estado IS 'Optimiza búsqueda de ofertas pendientes por solicitud';
COMMENT ON INDEX idx_pagos_referencia IS 'Índice único para prevenir duplicados en webhooks';
COMMENT ON INDEX idx_notificaciones_leida IS 'Optimiza contador de notificaciones no leídas';
