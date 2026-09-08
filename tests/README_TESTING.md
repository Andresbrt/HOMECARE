# 🧪 HomeCare - Suite Completa de Pruebas

## Índice

1. [E2E Suite (Detox)](#1-e2e-suite-detox)
2. [Security Suite (Jest)](#2-security-suite-jest)
3. [Performance Suite (k6)](#3-performance-suite-k6)
4. [Cómo Ejecutar](#4-cómo-ejecutar)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Reportes](#6-reportes)

---

## 1. E2E Suite (Detox)

| Archivo | Flujo | Tests |
|---|---|---|
| `01_happy_path_customer.e2e.js` | Login → Catálogo → Solicitud → Chat → Pago → Calificación | 18 |
| `02_happy_path_provider.e2e.js` | Login → Radar → Oferta → Chat → Finanzas | 17 |
| `03_concurrent_acceptance.e2e.js` | 2 profesionales + 1 solicitud (race condition) | 8 |
| `04_payment_error_recovery.e2e.js` | Pago rechazado → Error → Reintento → Éxito | 12 |
| `05_chat_edge_cases.e2e.js` | 100+ mensajes, sync, typing indicator, emojis | 14 |
| `06_geolocation_background.e2e.js` | Background tracking, push, precisión, permisos | 12 |
| `07_offline_resilience.e2e.js` | WiFi → Sin conexión → Cola → Reconexión | 11 |
| `08_app_store_compliance.e2e.js` | Dark mode, accesibilidad, orientación, tamaños | 14 |

**Total E2E: 106 casos de prueba**

---

## 2. Security Suite (Jest)

| Archivo | OWASP | Tests |
|---|---|---|
| `01_rbac_authorization.test.js` | API1:2023 BOLA & API5:2023 BFLA | 18 |
| `02_sql_injection.test.js` | API8:2023 Injection | 21 |
| `03_csrf_protection.test.js` | CSRF + Rate Limiting | 13 |
| `04_xss_chat.test.js` | XSS Stored | 18 |
| `05_payment_tampering.test.js` | API6:2023 Business Flow & Webhooks | 10 |

**Total Seguridad: 93 casos de prueba (100% PASS)**

---

## 3. Performance Suite (k6)

| Archivo | Escenario | SLO |
|---|---|---|
| `load_test_service_list.js` | 50 VUs → GET /servicios/cercanos | p95 < 200ms |
| `load_test_concurrent_requests.js` | 30 VUs → POST /solicitudes | p95 < 500ms |
| `load_test_chat_throughput.js` | 10 pares WebSocket, 100 msg/s | p95 < 300ms |
| `load_test_geolocation_updates.js` | 50 dispositivos GPS cada 30s | p95 < 150ms |
| `stress_test_payment.js` | 5 pagos concurrentes + duplicados | p95 < 1000ms |

---

## 4. Cómo Ejecutar

### Prerequisitos

```bash
# 1. Instalar Detox CLI
npm install -g detox-cli

# 2. Instalar k6
brew install k6

# 3. Instalar dependencias del proyecto móvil
cd mobile && npm install

# 4. Instalar Detox en el proyecto
cd mobile && npm install --save-dev detox jest-circus jest-junit
```

### 🔷 E2E Tests (Detox)

```bash
cd mobile

# Buildear la app iOS para pruebas
detox build --configuration ios.sim.debug

# Ejecutar TODOS los tests E2E
detox test --configuration ios.sim.debug

# Ejecutar un test específico
detox test --configuration ios.sim.debug e2e/01_happy_path_customer.e2e.js

# Ejecutar en Android
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# Ejecutar tests de compliance (iPhone SE)
detox build --configuration ios.se.debug
detox test --configuration ios.se.debug e2e/08_app_store_compliance.e2e.js

# Con log verboso
detox test --configuration ios.sim.debug --loglevel verbose
```

### 🔴 Security Tests (Jest)

```bash
cd mobile

# Levantar el backend primero (necesario para las pruebas)
# El backend debe estar en http://localhost:8080

# Ejecutar TODOS los tests de seguridad
API_URL=http://localhost:8080 npx jest __tests__/security/ --runInBand --verbose

# Ejecutar test específico
API_URL=http://localhost:8080 npx jest __tests__/security/01_rbac_authorization.test.js

# Ejecutar contra Fly.io (staging)
API_URL=https://homecare-backend.fly.dev npx jest __tests__/security/ --runInBand

# Con coverage
API_URL=http://localhost:8080 npx jest __tests__/security/ --coverage
```

### ⚡ Load Tests (k6)

```bash
cd tests/load

# TEST 1: Servicios cercanos (50 usuarios)
k6 run load_test_service_list.js \
  -e API_URL=https://homecare-backend.fly.dev \
  -e AUTH_TOKEN=eyJ...

# TEST 2: Solicitudes concurrentes (30 usuarios)
k6 run load_test_concurrent_requests.js \
  -e API_URL=https://homecare-backend.fly.dev

# TEST 3: Chat WebSocket throughput
k6 run load_test_chat_throughput.js \
  -e API_URL=https://homecare-backend.fly.dev \
  -e WS_URL=wss://homecare-backend.fly.dev

# TEST 4: Geolocalización (50 dispositivos)
k6 run load_test_geolocation_updates.js \
  -e API_URL=https://homecare-backend.fly.dev

# TEST 5: Stress test de pagos
k6 run stress_test_payment.js \
  -e API_URL=https://homecare-backend.fly.dev \
  -e MP_WEBHOOK_SECRET=tu-webhook-secret

# Ejecutar todos con reporte JSON
for f in *.js; do
  k6 run "$f" \
    -e API_URL=https://homecare-backend.fly.dev \
    --out json="results/${f%.js}_results.json"
done
```

### 🚀 Suite Completa (todo en secuencia)

```bash
# 1. Levantar backend local
cd backend && ./mvnw spring-boot:run -Dspring.profiles.active=test &

# 2. Tests de seguridad
cd mobile && API_URL=http://localhost:8080 npx jest __tests__/security/ --runInBand

# 3. Tests E2E iOS
cd mobile && detox build --configuration ios.sim.debug && detox test --configuration ios.sim.debug

# 4. Tests de carga (contra Fly.io para no afectar local)
cd tests/load && k6 run load_test_service_list.js -e API_URL=https://homecare-backend.fly.dev
```

---

## 5. Variables de Entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_URL` | URL del backend | `https://homecare-backend.fly.dev` |
| `WS_URL` | URL WebSocket | `wss://homecare-backend.fly.dev` |
| `AUTH_TOKEN` | JWT pre-generado para k6 | `eyJhbGci...` |
| `MP_WEBHOOK_SECRET` | Secret de Mercado Pago | `abc123...` |
| `TEST_REQUEST_ID` | ID de solicitud para tests concurrentes | `test-concurrent-001` |

### Usuarios de prueba requeridos en BD

Crear estos usuarios antes de ejecutar los tests:

```sql
-- Crear en BD de prueba o via Swagger UI
INSERT INTO usuarios (email, role) VALUES
  ('cliente.prueba@homecare.co',    'ROLE_CUSTOMER'),
  ('cliente2.prueba@homecare.co',   'ROLE_CUSTOMER'),
  ('cliente3.prueba@homecare.co',   'ROLE_CUSTOMER'),
  ('profesional.prueba@homecare.co','ROLE_SERVICE_PROVIDER'),
  ('profesional2@homecare.co',      'ROLE_SERVICE_PROVIDER'),
  ('admin@homecare.co',             'ROLE_ADMIN');
-- Password para todos: Test1234!
-- Admin password: Admin1234!
```

O via API:
```bash
# Registrar usuarios de prueba
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente.prueba@homecare.co","password":"Test1234!","nombre":"Cliente Prueba","role":"ROLE_CUSTOMER"}'
```

---

## 6. Reportes

### E2E (Detox)
Los resultados se guardan en `mobile/e2e/results/e2e-results.xml` (JUnit XML).

```bash
# Ver reporte en terminal
detox test --configuration ios.sim.debug 2>&1 | tee e2e-output.log
```

### Seguridad (Jest)
```bash
API_URL=http://localhost:8080 npx jest __tests__/security/ \
  --json --outputFile=security-results.json \
  --verbose
```

### Carga (k6)
```bash
# Generar reporte HTML con k6-reporter
k6 run load_test_service_list.js \
  --out json=results.json

# Visualizar en Grafana (si disponible)
k6 run load_test_service_list.js \
  --out influxdb=http://localhost:8086/k6
```

---

## 📊 Matriz de Resultados Esperados

Ver `tests/TEST_MATRIX.md` para la matriz completa.

---

## 🏆 Criterios de Paso (Go/No-Go para lanzamiento)

| Suite | Criterio mínimo |
|---|---|
| E2E | ≥ 90% de tests pasan |
| Seguridad | **100%** de tests pasan (0 vulnerabilidades críticas) |
| Carga | Todos los SLOs p95 cumplidos |
| Unitarios (existentes) | 100% pasan (ya verificado: 154 backend + 18 mobile) |
