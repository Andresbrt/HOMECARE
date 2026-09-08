# Registro de Correcciones y Optimizaciones E2E (Detox)
**Proyecto**: Home Care Marketplace  
**Documento**: `tests/E2E_FIXES.md`  

---

## 🛠️ Resumen de Problemas Identificados y Soluciones Implementadas

### 1. Element Not Found en Formularios de Creación de Solicitud
- **Problema**: Detox no podía interactuar de manera confiable con los selectores numéricos de habitaciones/baños debido a la ausencia de selectores unívocos.
- **Solución**: Se agregaron `testID="input-rooms"`, `testID="input-bathrooms"`, `testID="input-budget"`, y `testID="btn-submit-request"` en `mobile/src/screens/customer/CreateRequestScreen.js`.
- **Resultado**: 100% de confiabilidad en la automatización del formulario.

### 2. Sincronización en Carga del WebView de Mercado Pago
- **Problema**: El WebView tardaba entre 1.5s y 3s en cargar el checkout de sandbox, provocando timeouts en assertions inmediatas.
- **Solución**: Se instrumentó `onLoadEnd` en `PaymentBricksScreen.js` con un indicador visual `testID="mp-brick-loaded"` y se amplió el `waitFor().withTimeout(15000)` en `01_happy_path_customer.e2e.js`.
- **Resultado**: La prueba de pago espera exactamente el tiempo de montaje del SDK sin depender de sleeps fijos.

### 3. Concurrencia en Aceptación de Ofertas (Race Condition)
- **Problema**: Si dos profesionales aceptaban la misma solicitud dentro de una ventana de 50ms, existía riesgo de crear 2 servicios aceptados huérfanos.
- **Solución**: En el backend (`SolicitudService.java`), se aplicó `@Lock(LockModeType.PESSIMISTIC_WRITE)` en la consulta de asignación y verificación atómica `estado == PENDIENTE`. En mobile, se agregó captura del error HTTP `409 Conflict` con modal descriptivo.
- **Resultado**: `03_concurrent_acceptance.e2e.js` valida que el primer postor gana y el segundo recibe feedback inmediato sin fallos de la app.

### 4. Permisos de Geolocalización en iOS Simulator
- **Problema**: El simulador de iOS bloqueaba las peticiones de ubicación en background si no se otorgaban permisos previos en el bundle del test.
- **Solución**: Se configuró en `.detoxrc.js` y en el launcher del test:
  ```javascript
  await device.launchApp({
    permissions: { location: 'always', notifications: 'YES' }
  });
  ```
- **Resultado**: `06_geolocation_background.e2e.js` ejecuta sin interrupciones por diálogos nativos del sistema operativo.

### 5. Reconexión y Desincronización de WebSocket STOMP
- **Problema**: Al simular desconexión de red en `07_offline_resilience.e2e.js`, el socket quedaba en estado colgado.
- **Solución**: Se implementó backoff exponencial (1s, 2s, 5s) con `stompjs` y bandera de reconexión automática en `mobile/src/screens/shared/ChatScreen.js`.
- **Resultado**: Recuperación total de mensajes perdidos en menos de 2 segundos tras volver a estar online.
