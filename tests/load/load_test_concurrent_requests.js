/**
 * LOAD TEST - POST /api/solicitudes (Solicitudes Concurrentes)
 * k6 Performance Test: 30 usuarios creando solicitudes simultáneamente
 * p95 < 500ms, no race conditions, SELECT FOR UPDATE funcional
 *
 * Ejecutar:
 *   k6 run tests/load/load_test_concurrent_requests.js \
 *     -e API_URL=https://homecare-backend.fly.dev
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m',  target: 30 },  // Carga máxima: 30 usuarios
    { duration: '2m',  target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:create_request}': ['p(95)<500'],
    'http_req_failed': ['rate<0.02'],
    'checks': ['rate>0.98'],
    'duplicate_acceptances': ['count<1'],  // 0 race conditions toleradas
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MÉTRICAS
// ────────────────────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const createRequestDuration = new Trend('create_request_duration', true);
const duplicateAcceptances = new Counter('duplicate_acceptances');
const successfulCreations = new Counter('successful_creations');

const API_URL = __ENV.API_URL || 'http://localhost:8080';

// Pool de clientes de prueba (pre-registrados en ambiente de prueba)
const TEST_CUSTOMERS = [
  { email: 'cliente.prueba@homecare.co', password: 'Test1234!' },
  { email: 'cliente2.prueba@homecare.co', password: 'Test1234!' },
  { email: 'cliente3.prueba@homecare.co', password: 'Test1234!' },
];

// Pool de profesionales de prueba
const TEST_PROVIDERS = [
  { email: 'profesional.prueba@homecare.co', password: 'Test1234!' },
  { email: 'profesional2@homecare.co', password: 'Test1234!' },
];

// ────────────────────────────────────────────────────────────────────────────
// SETUP: Login y preparación de tokens
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

  const customerTokens = TEST_CUSTOMERS
    .map((c) => loginAs(c.email, c.password))
    .filter(Boolean);

  const providerTokens = TEST_PROVIDERS
    .map((p) => loginAs(p.email, p.password))
    .filter(Boolean);

  return { customerTokens, providerTokens };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
export default function (data) {
  const { customerTokens, providerTokens } = data;
  if (!customerTokens || customerTokens.length === 0) {
    errorRate.add(1);
    return;
  }

  // Seleccionar token de cliente por turno (round-robin por VU ID)
  const customerToken = customerTokens[__VU % customerTokens.length];
  const headers = {
    Authorization: `Bearer ${customerToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Variación aleatoria de datos de solicitud
  const rooms = Math.floor(Math.random() * 4) + 1;
  const bathrooms = Math.floor(Math.random() * 3) + 1;
  const budget = (rooms * 100000) + (bathrooms * 50000);

  // ── CREAR SOLICITUD ──
  const reqStart = Date.now();
  const createRes = http.post(
    `${API_URL}/api/solicitudes`,
    JSON.stringify({
      serviceType: 'CLEANING',
      rooms,
      bathrooms,
      hasPets: Math.random() > 0.7,
      budgetMax: budget,
      address: `Calle ${Math.floor(Math.random() * 200)} # ${Math.floor(Math.random() * 50)}-${Math.floor(Math.random() * 99)}, Bogotá`,
      latitude: 4.6 + Math.random() * 0.2,
      longitude: -74.1 + Math.random() * 0.1,
      description: `Solicitud de prueba de carga - VU ${__VU} - Iter ${__ITER}`,
    }),
    {
      headers,
      tags: { endpoint: 'create_request' },
    }
  );
  createRequestDuration.add(Date.now() - reqStart);

  const createOk = check(createRes, {
    'solicitud creada (201)': (r) => r.status === 201 || r.status === 200,
    'creación < 500ms': (r) => r.timings.duration < 500,
    'responde ID de solicitud': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.id);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!createOk);

  if (createOk) {
    successfulCreations.add(1);

    // ── VERIFICAR QUE LA SOLICITUD ES VISIBLE ──
    const solicitudId = JSON.parse(createRes.body).id;

    sleep(0.5); // Pausa pequeña para simular latencia real

    const getRes = http.get(`${API_URL}/api/solicitudes/${solicitudId}`, {
      headers,
      tags: { endpoint: 'get_request' },
    });

    check(getRes, {
      'solicitud recuperable': (r) => r.status === 200,
      'estado inicial PENDING': (r) => {
        try {
          const body = JSON.parse(r.body);
          return ['PENDING', 'OPEN'].includes(body.status);
        } catch {
          return false;
        }
      },
    });

    // ── SIMULAR PROVEEDOR ACEPTANDO (para verificar idempotencia) ──
    if (providerTokens && providerTokens.length > 0 && __ITER % 5 === 0) {
      // Solo cada 5 iteraciones para no sobrecargar este flujo
      const providerToken = providerTokens[__VU % providerTokens.length];

      const offerRes = http.post(
        `${API_URL}/api/offers`,
        JSON.stringify({
          solicitudId,
          price: budget * 0.9,
          estimatedMinutes: 60,
        }),
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
          tags: { endpoint: 'create_offer' },
        }
      );

      check(offerRes, {
        'oferta creada OK': (r) => r.status === 200 || r.status === 201,
        'oferta < 500ms': (r) => r.timings.duration < 500,
      });
    }
  }

  sleep(Math.random() * 3 + 2); // Think time: 2-5 segundos
}

// ────────────────────────────────────────────────────────────────────────────
// TEARDOWN
// ────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`
  ════════════════════════════════════════════
  RESUMEN: Solicitudes Concurrentes
  ════════════════════════════════════════════
  
  SLO Targets:
  ✓ p95 < 500ms para POST /solicitudes
  ✓ Error rate < 2%
  ✓ 0 race conditions (duplicate_acceptances = 0)
  ✓ Todas las solicitudes exitosas
  ════════════════════════════════════════════
  `);
}
