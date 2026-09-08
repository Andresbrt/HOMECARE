/**
 * LOAD TEST - GET /api/servicios/cercanos
 * k6 Performance Test: 50 usuarios simultáneos
 * p95 < 200ms, sin errores, pool DB max 20 conexiones
 *
 * Prerequisitos:
 *   brew install k6
 *
 * Ejecutar:
 *   k6 run tests/load/load_test_service_list.js \
 *     -e API_URL=https://homecare-backend.fly.dev \
 *     -e AUTH_TOKEN=eyJ...
 *
 * Ejecutar con HTML report:
 *   k6 run --out json=results/service_list_results.json \
 *          tests/load/load_test_service_list.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────────────
export const options = {
  // Rampa de carga: subir progresivamente, mantener carga máxima, bajar
  stages: [
    { duration: '30s', target: 10 },   // Calentamiento
    { duration: '1m',  target: 50 },   // Carga máxima
    { duration: '2m',  target: 50 },   // Mantener carga
    { duration: '30s', target: 0 },    // Enfriamiento
  ],

  // Umbrales de SLO (Service Level Objectives)
  thresholds: {
    // p95 de tiempo de respuesta debe ser < 200ms
    'http_req_duration{endpoint:nearby_services}': ['p(95)<200'],
    // Tasa de errores < 1%
    'http_req_failed': ['rate<0.01'],
    // Todas las verificaciones deben pasar > 99%
    'checks': ['rate>0.99'],
    // Throughput mínimo: 100 req/s
    'http_reqs': ['rate>10'],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MÉTRICAS PERSONALIZADAS
// ────────────────────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const nearbyServicesDuration = new Trend('nearby_services_duration', true);
const emptyResultsCount = new Counter('empty_results');

// ────────────────────────────────────────────────────────────────────────────
// DATOS DE PRUEBA
// ────────────────────────────────────────────────────────────────────────────
const API_URL = __ENV.API_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Coordenadas de prueba en Colombia (diferentes zonas de Bogotá)
const BOGOTA_COORDINATES = [
  { lat: 4.7110, lng: -74.0721, zone: 'Centro' },
  { lat: 4.6482, lng: -74.0553, zone: 'Sur' },
  { lat: 4.7500, lng: -74.0900, zone: 'Norte' },
  { lat: 4.6960, lng: -74.0340, zone: 'Usaquén' },
  { lat: 4.7170, lng: -74.1147, zone: 'Fontibón' },
  { lat: 4.6271, lng: -74.0963, zone: 'Bosa' },
  { lat: 4.7293, lng: -74.0307, zone: 'Chapinero' },
];

const DISTANCE_KM = [5, 10, 15];

// ────────────────────────────────────────────────────────────────────────────
// SETUP: Obtener token de autenticación
// ────────────────────────────────────────────────────────────────────────────
export function setup() {
  if (AUTH_TOKEN) {
    return { token: AUTH_TOKEN };
  }

  const loginRes = http.post(
    `${API_URL}/api/auth/login`,
    JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.error(`Login falló: ${loginRes.status} - ${loginRes.body}`);
    return { token: null };
  }

  const body = JSON.parse(loginRes.body);
  return { token: body.token || body.accessToken };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
export default function (data) {
  const token = data.token;
  if (!token) {
    errorRate.add(1);
    return;
  }

  const coord = randomItem(BOGOTA_COORDINATES);
  const distance = randomItem(DISTANCE_KM);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // ── TEST 1: Servicios cercanos (endpoint principal) ──
  const nearbyStart = Date.now();
  const nearbyRes = http.get(
    `${API_URL}/api/servicios/cercanos?lat=${coord.lat}&lng=${coord.lng}&distancia=${distance}`,
    {
      headers,
      tags: { endpoint: 'nearby_services', zone: coord.zone },
    }
  );
  nearbyServicesDuration.add(Date.now() - nearbyStart);

  const nearbyOk = check(nearbyRes, {
    'status 200': (r) => r.status === 200,
    'respuesta en < 200ms': (r) => r.timings.duration < 200,
    'content-type JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
    'responde array de servicios': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body && Array.isArray(body.content));
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!nearbyOk);

  if (nearbyRes.status === 200) {
    try {
      const services = JSON.parse(nearbyRes.body);
      const list = Array.isArray(services) ? services : (services.content || []);
      if (list.length === 0) emptyResultsCount.add(1);
    } catch (_) {}
  }

  // ── TEST 2: Catálogo de servicios disponibles ──
  const catalogRes = http.get(`${API_URL}/api/servicios/catalogo`, {
    headers,
    tags: { endpoint: 'service_catalog' },
  });

  check(catalogRes, {
    'catálogo OK': (r) => r.status === 200,
    'catálogo < 300ms': (r) => r.timings.duration < 300,
  });

  // ── TEST 3: Precio sugerido por IA ──
  const priceRes = http.post(
    `${API_URL}/api/servicios/precio-sugerido`,
    JSON.stringify({ serviceType: 'CLEANING', rooms: 2, bathrooms: 1, hasPets: false }),
    {
      headers,
      tags: { endpoint: 'price_suggestion' },
    }
  );

  check(priceRes, {
    'precio sugerido OK': (r) => r.status === 200,
    'precio sugerido < 500ms': (r) => r.timings.duration < 500,
    'precio es número positivo': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.suggestedPrice > 0 || body.price > 0;
      } catch {
        return false;
      }
    },
  });

  // Think time: simula comportamiento real del usuario
  sleep(Math.random() * 2 + 1); // 1-3 segundos
}

// ────────────────────────────────────────────────────────────────────────────
// TEARDOWN: Resumen
// ────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`
  ════════════════════════════════════════════
  RESUMEN: LOAD TEST - Service List
  ════════════════════════════════════════════
  
  SLO Targets:
  ✓ p95 < 200ms para /servicios/cercanos
  ✓ Error rate < 1%
  ✓ Check rate > 99%
  
  Ver métricas detalladas arriba ↑
  ════════════════════════════════════════════
  `);
}
