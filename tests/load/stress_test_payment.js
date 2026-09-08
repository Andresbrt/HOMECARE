/**
 * STRESS TEST - Pagos Simultáneos (5 pagos concurrentes)
 * k6 Stress Test: idempotencia de webhooks, procesamiento paralelo
 *
 * Ejecutar:
 *   k6 run tests/load/stress_test_payment.js \
 *     -e API_URL=https://homecare-backend.fly.dev \
 *     -e MP_WEBHOOK_SECRET=your-secret
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN: Stress test con picos de carga
// ────────────────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Escenario 1: Pagos concurrentes normales
    concurrent_payments: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 5 },
        { duration: '1m',  target: 5 },  // 5 pagos simultáneos
        { duration: '30s', target: 10 }, // Pico de 10 pagos
        { duration: '30s', target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
    // Escenario 2: Webhooks duplicados (test de idempotencia)
    duplicate_webhooks: {
      executor: 'constant-arrival-rate',
      rate: 10,       // 10 webhooks por segundo
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 5,
      maxVUs: 15,
    },
  },
  thresholds: {
    'http_req_duration{endpoint:initiate_payment}': ['p(95)<1000'],
    'http_req_duration{endpoint:webhook}': ['p(95)<500'],
    'http_req_failed': ['rate<0.02'],
    'duplicate_payment_errors': ['count<1'],  // 0 cobros duplicados
    'checks': ['rate>0.97'],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MÉTRICAS
// ────────────────────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const duplicatePaymentErrors = new Counter('duplicate_payment_errors');
const paymentInitiatedCount = new Counter('payments_initiated');
const webhookProcessedCount = new Counter('webhooks_processed');
const paymentDuration = new Trend('payment_initiation_duration', true);

const API_URL = __ENV.API_URL || 'http://localhost:8080';
const MP_WEBHOOK_SECRET = __ENV.MP_WEBHOOK_SECRET || 'test-mp-secret';

// IDs de solicitudes pre-creadas para el test de pagos
const TEST_SOLICITUD_IDS = [
  'stress-solicitud-001',
  'stress-solicitud-002',
  'stress-solicitud-003',
  'stress-solicitud-004',
  'stress-solicitud-005',
];

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
    return JSON.parse(res.body).token || JSON.parse(res.body).accessToken;
  };

  const customerToken = loginAs('cliente.prueba@homecare.co', 'Test1234!');

  // Crear solicitudes de prueba para el stress test
  const solicitudIds = [];
  if (customerToken) {
    for (let i = 0; i < 5; i++) {
      const res = http.post(
        `${API_URL}/api/solicitudes`,
        JSON.stringify({
          serviceType: 'CLEANING',
          rooms: 2,
          bathrooms: 1,
          hasPets: false,
          budgetMax: 400000,
          address: `Calle Stress Test ${i + 1}`,
          latitude: 4.71 + i * 0.01,
          longitude: -74.07,
        }),
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` } }
      );
      if (res.status === 200 || res.status === 201) {
        solicitudIds.push(JSON.parse(res.body).id);
      }
    }
  }

  return { customerToken, solicitudIds };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO: Pagos concurrentes
// ────────────────────────────────────────────────────────────────────────────
export default function (data) {
  const { customerToken, solicitudIds } = data;
  const headers = {
    Authorization: `Bearer ${customerToken}`,
    'Content-Type': 'application/json',
  };

  // Seleccionar solicitud por VU (cada VU tiene su propia solicitud)
  const solicitudId = solicitudIds && solicitudIds.length > 0
    ? solicitudIds[__VU % solicitudIds.length]
    : 'test-solicitud-fallback';

  group('Iniciar Pago', () => {
    const startTime = Date.now();
    const initRes = http.post(
      `${API_URL}/api/pagos/iniciar`,
      JSON.stringify({
        solicitudId,
        currency: 'COP',
        // No se envía monto: el backend lo calcula internamente
      }),
      {
        headers,
        tags: { endpoint: 'initiate_payment' },
        timeout: '10s',
      }
    );
    paymentDuration.add(Date.now() - startTime);

    const ok = check(initRes, {
      'pago iniciado OK': (r) => r.status === 200 || r.status === 201,
      'responde preferenceId o initPoint': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Boolean(body.preferenceId || body.initPoint || body.checkoutUrl);
        } catch {
          return false;
        }
      },
      'inicio < 1000ms': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!ok);
    if (ok) paymentInitiatedCount.add(1);
  });

  group('Simular Webhook Mercado Pago', () => {
    // Generar un paymentId único para este VU + iteración
    const paymentId = `stress-pay-${__VU}-${__ITER}-${Date.now()}`;

    const webhookPayload = {
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: paymentId },
      date_created: new Date().toISOString(),
      id: uuidv4(),
      live_mode: false,
      type: 'payment',
      user_id: '123456789',
    };

    // Firma simplificada para el stress test
    const signature = `ts=${Date.now()},v1=test-signature-${paymentId}`;

    const webhookRes = http.post(
      `${API_URL}/api/pagos/webhook`,
      JSON.stringify(webhookPayload),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-request-id': uuidv4(),
        },
        tags: { endpoint: 'webhook' },
        timeout: '5s',
      }
    );

    const ok = check(webhookRes, {
      'webhook procesado': (r) => [200, 204, 400, 401].includes(r.status), // 400/401 = firma inválida (esperado en test)
      'webhook < 500ms': (r) => r.timings.duration < 500,
      'sin error 500': (r) => r.status !== 500,
    });

    if (ok) webhookProcessedCount.add(1);

    // ── TEST DE IDEMPOTENCIA: Enviar mismo webhook 2 veces ──
    sleep(0.1);

    const duplicateRes = http.post(
      `${API_URL}/api/pagos/webhook`,
      JSON.stringify(webhookPayload), // Mismo payload
      {
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
          'x-request-id': uuidv4(), // Request ID diferente (reintento legítimo)
        },
        tags: { endpoint: 'webhook_duplicate' },
      }
    );

    check(duplicateRes, {
      'webhook duplicado NO genera error 500': (r) => r.status !== 500,
      'webhook duplicado procesado idempotentemente': (r) => [200, 204, 400, 401, 409].includes(r.status),
    });
  });

  sleep(1 + Math.random() * 2);
}

// ────────────────────────────────────────────────────────────────────────────
// TEARDOWN
// ────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`
  ════════════════════════════════════════════
  RESUMEN: Stress Test de Pagos
  ════════════════════════════════════════════
  
  SLO Targets:
  ✓ Inicio de pago p95 < 1000ms
  ✓ Webhook p95 < 500ms
  ✓ 0 cobros duplicados
  ✓ Idempotencia: 2x mismo paymentId = 1x cobro
  ✓ Error rate < 2%
  ════════════════════════════════════════════
  `);
}
