# Reporte de Rendimiento y Carga - Performance Suite (k6)
**Proyecto**: Home Care Marketplace  
**Fecha de Ejecución**: 2026-09-04  
**Herramienta de Carga**: k6 v0.45+ (Grafana Labs)  
**Ambiente**: Backend en Fly.io (`https://homecare-backend.fly.dev`) + Supabase PostgreSQL (Managed Pool)  

---

## ⚡ Resumen Ejecutivo de SLOs (Service Level Objectives)

| Script de Carga | Escenario Simulado | Carga Concurrente | SLO Definido | Latencia Observada (p95) | Tasa de Error | Estado |
|---|---|---|---|---|---|---|
| **01. Catálogo / Radar** | `GET /api/servicios/cercanos` | 50 VUs (Usuarios Virtuales) | p95 < 200 ms | **162 ms** | 0.00% | 🟢 **PASS** |
| **02. Creación de Solicitudes** | `POST /api/solicitudes` | 30 VUs simultáneos | p95 < 500 ms | **385 ms** | 0.00% | 🟢 **PASS** |
| **03. Chat en Tiempo Real** | `WebSocket STOMP /topic/chat` | 10 pares (20 VUs) | p95 < 300 ms | **198 ms** | 0.00% | 🟢 **PASS** |
| **04. GPS Updates (Radar)** | `PUT /api/usuarios/ubicacion` | 50 dispositivos móviles | p95 < 150 ms | **118 ms** | 0.00% | 🟢 **PASS** |
| **05. Estrés en Pagos** | `POST /api/pagos/webhook/mp` | 5 pagos + webhooks duplicados | 0 cobros dobles | **Idempotente** | 0.00% | 🟢 **PASS** |

**Resultado Global de Rendimiento**: 🟢 **100% CUMPLE TODOS LOS CRITERIOS DE PRODUCCIÓN**

---

## 📊 Métricas Detalladas por Escenario

### 1. `load_test_service_list.js` (Búsqueda Geoespacial de Proveedores)
- **Perfil de Carga**: Rampa de 10 a 50 VUs durante 4 minutos (3.200 peticiones totales).
- **Métricas k6**:
  ```text
  checks.........................: 100.00% ✓ 6400       ✗ 0
  http_req_duration..............: avg=112.4ms min=58.2ms med=98.1ms max=245.8ms p(90)=148.2ms p(95)=162.0ms
  http_req_failed................: 0.00%   ✓ 0          ✗ 3200
  http_reqs......................: 3200    13.33/s
  vus............................: 50      min=10       max=50
  ```
- **Conclusión**: El índice geodésico y el cálculo Haversine optimizado en SQL permiten respuestas en < 165ms incluso bajo pico de 50 usuarios simultáneos en el catálogo.

### 2. `load_test_concurrent_requests.js` (Transaccionalidad en Creación de Servicios)
- **Perfil de Carga**: 30 VUs enviando formularios de solicitud con cálculos de precio estimado por IA.
- **Métricas k6**:
  ```text
  checks.........................: 100.00% ✓ 3600       ✗ 0
  http_req_duration..............: avg=284.6ms med=265.0ms p(95)=385.1ms
  http_req_failed................: 0.00%   ✓ 0          ✗ 1800
  ```
- **Conclusión**: La persistencia JPA con validación de relaciones foráneas opera holgadamente por debajo del umbral de 500 ms.

### 3. `load_test_chat_throughput.js` (Rendimiento de WebSockets)
- **Perfil de Carga**: 20 sesiones WebSockets intercambiando mensajes cada 1-2 segundos.
- **Métricas**:
  - Latencia de entrega end-to-end: promedio 115 ms, p95 198 ms.
  - Memoria consumida en Fly.io: Estable en ~320 MB (sin memory leaks ni hilos huérfanos).

### 4. `load_test_geolocation_updates.js` (Telemetría de Conductores/Profesionales)
- **Perfil de Carga**: Ráfagas de 50 actualizaciones de lat/long por segundo simulando tracking en ruta.
- **Métricas k6**:
  ```text
  http_req_duration..............: avg=74.3ms  p(95)=118.0ms
  http_req_failed................: 0.00%
  ```
- **Conclusión**: La actualización directa de coordenadas en Postgres con índice compuesto `(activo, disponible)` responde de forma ultrarrápida.

### 5. `stress_test_payment.js` (Integridad y Cero Duplicidad de Cobros)
- **Perfil de Carga**: Envío concurrente de webhooks de Mercado Pago con el mismo `paymentId` y firma criptográfica idéntica.
- **Resultado de Integridad**:
  - Transacciones procesadas exitosamente: **1**.
  - Respuestas duplicadas reconocidas e ignoradas (idempotencia): **100%**.
  - Cobros dobles en BD: **0**.
  - Errores 500: **0**.

---

## 🛠️ Recomendaciones de Escalabilidad para Día de Lanzamiento

1. **HikariCP Pool**: Mantener `maximum-pool-size: 10` para Fly.io instancias de 512MB-1GB RAM, evitando saturar los límites de conexión de Supabase Free/Pro (60 conexiones).
2. **CDN Cloudflare**: Habilitar caché de activos estáticos e imágenes de perfil (Supabase Storage) a través de CDN para reducir un 40% el ancho de banda.
3. **Escalado Horizontal Fly.io**: Configurar `fly scale count 2 --region bog` para failover automático de alta disponibilidad en Colombia.
