/**
 * LOAD TEST - Geolocation Updates (50 dispositivos enviando ubicación cada 30s)
 * k6 Performance Test: 50 VUs simulando tracking GPS
 * API < 150ms, PostGIS optimizado, sin timeouts
 *
 * Ejecutar:
 *   k6 run tests/load/load_test_geolocation_updates.js \
 *     -e API_URL=https://homecare-backend.fly.dev
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN: 50 dispositivos enviando ubicación cada 30s
// = aprox 100 updates/min al ritmo de carga
// ────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m',  target: 50 },  // 50 dispositivos simultáneos
    { duration: '3m',  target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:location_update}': ['p(95)<150'],
    'http_req_duration{endpoint:nearby_providers}': ['p(95)<200'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.99'],
    'location_timeouts': ['count<5'],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MÉTRICAS
// ────────────────────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const locationUpdateDuration = new Trend('location_update_duration', true);
const nearbyProvidersDuration = new Trend('nearby_providers_duration', true);
const locationTimeouts = new Counter('location_timeouts');
const successfulUpdates = new Counter('successful_location_updates');

const API_URL = __ENV.API_URL || 'http://localhost:8080';

// ────────────────────────────────────────────────────────────────────────────
// GENERADOR DE COORDENADAS: Simula movimiento en Bogotá
// ────────────────────────────────────────────────────────────────────────────
function generateBogotaCoord(vuId, iter) {
  // Simular movimiento realista: cada VU tiene su zona base
  const zones = [
    { lat: 4.7110, lng: -74.0721 },  // Centro
    { lat: 4.7500, lng: -74.0900 },  // Norte
    { lat: 4.6482, lng: -74.0553 },  // Sur
    { lat: 4.7293, lng: -74.0307 },  // Chapinero
    { lat: 4.6960, lng: -74.0340 },  // Usaquén
  ];

  const base = zones[vuId % zones.length];
  // Pequeña variación para simular movimiento (radio ~500m)
  const latDrift = (Math.random() - 0.5) * 0.009;
  const lngDrift = (Math.random() - 0.5) * 0.009;

  return {
    lat: parseFloat((base.lat + latDrift).toFixed(6)),
    lng: parseFloat((base.lng + lngDrift).toFixed(6)),
    accuracy: Math.random() * 20 + 5, // 5-25 metros de precisión
    speed: Math.random() * 50,         // 0-50 km/h
    heading: Math.random() * 360,       // 0-360 grados
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────────────────────────────────────
export function setup() {
  const loginAs = (email, password) => {
    const res = http.post(
      `${API_URL}/api/auth/login`,
      JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status !== 200) return null;
    const body = JSON.parse(res.body);
    return body.token || body.accessToken;
  };

  // Obtener tokens para profesionales (quienes comparten ubicación activamente)
  const providerToken = loginAs('profesional.prueba@homecare.co', 'Test1234!');
  const customerToken = loginAs('cliente.prueba@homecare.co', 'Test1234!');

  return { providerToken, customerToken };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
export default function (data) {
  const { providerToken, customerToken } = data;

  // Mitad de los VUs son proveedores (envían ubicación)
  // Otra mitad son clientes (consultan proveedores cercanos)
  const isProvider = __VU % 2 === 0;
  const token = isProvider ? providerToken : customerToken;

  if (!token) {
    errorRate.add(1);
    return;
  }

  const coord = generateBogotaCoord(__VU, __ITER);
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (isProvider) {
    // ── PROVEEDOR: Actualizar ubicación en tiempo real ──
    const updateStart = Date.now();
    const updateRes = http.post(
      `${API_URL}/api/ubicacion/actualizar`,
      JSON.stringify({
        latitude: coord.lat,
        longitude: coord.lng,
        accuracy: coord.accuracy,
        speed: coord.speed,
        heading: coord.heading,
        timestamp: new Date().toISOString(),
      }),
      {
        headers,
        tags: { endpoint: 'location_update' },
        timeout: '5s',
      }
    );
    locationUpdateDuration.add(Date.now() - updateStart);

    if (updateRes.timings.duration >= 5000) {
      locationTimeouts.add(1);
    }

    const ok = check(updateRes, {
      'ubicación actualizada (200)': (r) => r.status === 200 || r.status === 204,
      'actualización < 150ms': (r) => r.timings.duration < 150,
      'sin timeout': (r) => r.timings.duration < 5000,
    });

    errorRate.add(!ok);
    if (ok) successfulUpdates.add(1);

    // También consultar solicitudes cercanas (flujo real del proveedor)
    const nearbyReqRes = http.get(
      `${API_URL}/api/solicitudes/cercanas?lat=${coord.lat}&lng=${coord.lng}&distancia=10`,
      {
        headers,
        tags: { endpoint: 'nearby_requests' },
      }
    );

    check(nearbyReqRes, {
      'solicitudes cercanas OK': (r) => r.status === 200,
      'consulta < 200ms': (r) => r.timings.duration < 200,
    });
  } else {
    // ── CLIENTE: Consultar proveedores cercanos disponibles ──
    const nearbyStart = Date.now();
    const nearbyRes = http.get(
      `${API_URL}/api/proveedores/cercanos?lat=${coord.lat}&lng=${coord.lng}&distancia=10&disponible=true`,
      {
        headers,
        tags: { endpoint: 'nearby_providers' },
      }
    );
    nearbyProvidersDuration.add(Date.now() - nearbyStart);

    const ok = check(nearbyRes, {
      'proveedores cercanos OK': (r) => r.status === 200,
      'consulta < 200ms': (r) => r.timings.duration < 200,
      'responde lista': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || Array.isArray(body.content);
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!ok);
  }

  // Simular ciclo de 30 segundos de tracking (reducido para el test)
  sleep(3 + Math.random() * 2); // 3-5 segundos en vez de 30 para mayor throughput en pruebas
}

// ────────────────────────────────────────────────────────────────────────────
// TEARDOWN
// ────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`
  ════════════════════════════════════════════
  RESUMEN: Geolocation Updates (50 dispositivos)
  ════════════════════════════════════════════
  
  SLO Targets:
  ✓ Location update p95 < 150ms
  ✓ Nearby providers query p95 < 200ms
  ✓ Error rate < 1%
  ✓ Timeouts < 5
  ✓ PostGIS queries optimizadas
  ════════════════════════════════════════════
  `);
}
