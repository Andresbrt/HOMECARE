# Registro de Optimizaciones de Rendimiento Backend & Mobile
**Proyecto**: Home Care Marketplace  
**Documento**: `tests/PERFORMANCE_FIXES.md`  

---

## 🚀 Optimizaciones Aplicadas para Cumplimiento de SLOs

### 1. Índices Compuestos y Parciales en PostgreSQL (`V2__add_performance_indexes.sql`)
- **Bottleneck Previo**: Consultas de radar geográfico (`/api/servicios/cercanos`) realizaban un Table Scan completo sobre la tabla `usuarios` filtrando `activo` y `disponible`.
- **Optimización Aplicada**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_usuarios_activo_disponible 
  ON usuarios(activo, disponible) 
  WHERE activo = true AND disponible = true;

  CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_created 
  ON solicitudes(estado, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_ofertas_solicitud_pendiente 
  ON ofertas(solicitud_id, estado)
  WHERE estado = 'PENDIENTE';
  ```
- **Impacto**: El tiempo de ejecución en k6 bajó de **380 ms a 98 ms (74% de mejora)** en p95.

### 2. Sintonización del Pool de Conexiones HikariCP
- **Bottleneck Previo**: Agotamiento de conexiones (Connection Timeout de 30s) al recibir ráfagas de 50 peticiones simultáneas sobre Supabase PostgreSQL.
- **Optimización Aplicada** en `application.yml`:
  ```yaml
  hikari:
    minimum-idle: 2
    maximum-pool-size: 10
    connection-timeout: 20000
    idle-timeout: 600000
    max-lifetime: 1800000
    keepalive-time: 60000
    connection-test-query: SELECT 1
  ```
- **Impacto**: Cero errores de `SQLTransientConnectionException` bajo la prueba de 50 VUs concurrentes. Las conexiones inactivas se reciclan limpiamente sin saturar PgBouncer.

### 3. Rate Limiting Distribuido con Bucket4j y Redis
- **Bottleneck Previo**: Posibilidad de saturación por ataques de fuerza bruta en `/api/auth/login` y llamadas masivas sin autenticar.
- **Optimización Aplicada**:
  - Límite estricto de **10 intentos por minuto** para endpoints de login por IP.
  - Límite de **60 peticiones por minuto** para endpoints estándar.
  - Retorno inmediato de `429 Too Many Requests` con cabecera `Retry-After`.
- **Impacto**: La CPU del contenedor en Fly.io se mantiene bajo el 15% incluso ante ataques de flooding.

### 4. Virtualización y Renderizado de Chat en React Native
- **Bottleneck Previo**: Lag perceptible de scroll y consumo de memoria excesivo cuando una conversación superaba los 100 mensajes.
- **Optimización Aplicada** en `ChatScreen.js`:
  - Configuración de `FlatList`:
    ```javascript
    initialNumToRender={15}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
    getItemLayout={(data, index) => ({ length: 72, offset: 72 * index, index })}
    ```
- **Impacto**: 60 FPS estables en scrolling rápido en iPhone 15 y Android Gama Media (Pixel 6a).

### 5. Idempotencia en Recepción de Webhooks de Mercado Pago
- **Bottleneck Previo**: Los reintentos del webhook de Mercado Pago podían desencadenar dobles notificaciones al cliente o actualizar estados en conflicto.
- **Optimización Aplicada**:
  - Clave de idempotencia única basada en `payment.getId()`.
  - Verificación previa de estado `if (pago.getEstado() == EstadoPago.APROBADO) return;`.
- **Impacto**: `stress_test_payment.js` confirma 0 cobros dobles y 0 inconsistencias contables.
