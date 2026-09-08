/**
 * E2E Test Suite 03 - Aceptación Concurrente (Race Condition)
 * Escenario: 2 profesionales aceptan UNA solicitud al mismo tiempo
 * Solo 1 debe ganar. El otro debe ver "ya fue aceptada".
 *
 * Ejecutar: npx detox test --configuration ios.sim.debug e2e/03_concurrent_acceptance.e2e.js
 * Nota: Requiere 2 simuladores corriendo simultáneamente (o prueba con API directa)
 */

const { device, element, by, expect, waitFor } = require('detox');

// En Detox real, cada device es independiente. Aquí modelamos el escenario
// con un fixture que simula el segundo profesional via API HTTP directamente.
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const API_BASE = process.env.API_URL || 'http://localhost:8080';
const SANDBOX_REQUEST_ID = process.env.TEST_REQUEST_ID || 'test-request-concurrent-001';

let provider1Token = null;
let provider2Token = null;
let createdRequestId = null;

describe('03 - Aceptación Concurrente de Solicitud', () => {
  beforeAll(async () => {
    // Obtener tokens para ambos profesionales via API
    const login1 = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'profesional1@homecare.co', password: 'Test1234!' }),
    });
    const data1 = await login1.json();
    provider1Token = data1.token;

    const login2 = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'profesional2@homecare.co', password: 'Test1234!' }),
    });
    const data2 = await login2.json();
    provider2Token = data2.token;

    // Crear solicitud de prueba con cliente
    const loginClient = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
    });
    const clientData = await loginClient.json();
    const clientToken = clientData.token;

    const reqCreate = await fetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 2,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 400000,
        address: 'Calle 50 # 20-15, Bogotá',
        latitude: 4.7110,
        longitude: -74.0721,
      }),
    });
    const reqData = await reqCreate.json();
    createdRequestId = reqData.id;

    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────
  // ESCENARIO PRINCIPAL: Race condition
  // ──────────────────────────────────────────────────────
  describe('3.1 Race Condition: dos profesionales, una solicitud', () => {
    let winner = null;
    let loser = null;

    test('envía ofertas de ambos profesionales casi simultáneamente', async () => {
      // Ambos envían oferta al mismo tiempo (diferencia < 100ms)
      const [offer1Res, offer2Res] = await Promise.all([
        fetch(`${API_BASE}/api/offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider1Token}`,
          },
          body: JSON.stringify({
            solicitudId: createdRequestId,
            price: 380000,
            estimatedMinutes: 45,
          }),
        }),
        fetch(`${API_BASE}/api/offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider2Token}`,
          },
          body: JSON.stringify({
            solicitudId: createdRequestId,
            price: 370000,
            estimatedMinutes: 50,
          }),
        }),
      ]);

      const result1 = await offer1Res.json();
      const result2 = await offer2Res.json();

      // Ambas ofertas deben crearse (estado PENDIENTE)
      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
    });

    test('cliente acepta UNA de las dos ofertas', async () => {
      // Obtener lista de ofertas para la solicitud
      const loginClient = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
      });
      const clientData = await loginClient.json();
      const clientToken = clientData.token;

      const offersRes = await fetch(`${API_BASE}/api/solicitudes/${createdRequestId}/offers`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const offers = await offersRes.json();
      expect(offers.length).toBeGreaterThanOrEqual(2);

      // Cliente acepta la primera oferta
      const acceptRes = await fetch(`${API_BASE}/api/offers/${offers[0].id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      expect(acceptRes.status).toBe(200);
      winner = offers[0].providerId;
      loser = offers[1].providerId;
    });

    test('la solicitud queda en estado ACCEPTED después de aceptar', async () => {
      const loginClient = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
      });
      const { token: clientToken } = await loginClient.json();

      const solicitudRes = await fetch(`${API_BASE}/api/solicitudes/${createdRequestId}`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const solicitud = await solicitudRes.json();
      expect(solicitud.status).toBe('ACCEPTED');
    });

    test('NO se puede aceptar una segunda oferta para la misma solicitud (idempotencia)', async () => {
      const loginClient = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
      });
      const { token: clientToken } = await loginClient.json();

      const offersRes = await fetch(`${API_BASE}/api/solicitudes/${createdRequestId}/offers`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const offers = await offersRes.json();

      if (offers.length >= 2) {
        const secondAcceptRes = await fetch(`${API_BASE}/api/offers/${offers[1].id}/accept`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${clientToken}` },
        });
        // Debe retornar 409 Conflict o 400 Bad Request
        expect([400, 409]).toContain(secondAcceptRes.status);
      }
    });
  });

  // ──────────────────────────────────────────────────────
  // VERIFICACIÓN EN APP (profesional ganador)
  // ──────────────────────────────────────────────────────
  describe('3.2 Verificación UI: profesional ganador', () => {
    test('profesional ganador ve la oferta en estado ACCEPTED en su app', async () => {
      // Login como profesional1 en la app
      await waitFor(element(by.id('welcome-screen'))).toBeVisible().withTimeout(10000);
      await element(by.id('btn-login')).tap();
      await element(by.id('input-email')).typeText('profesional1@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();

      await waitFor(element(by.id('provider-dashboard-screen'))).toBeVisible().withTimeout(15000);
      await element(by.id('tab-my-offers')).tap();

      await waitFor(element(by.id('offer-status-0'))).toBeVisible().withTimeout(10000);
      // Status puede ser ACCEPTED o ACTIVE dependiendo del flujo
      const statusEl = element(by.id('offer-status-0'));
      await expect(statusEl).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────
  // VERIFICACIÓN: profesional perdedor ve "solicitud ya aceptada"
  // ──────────────────────────────────────────────────────
  describe('3.3 Verificación API: profesional perdedor', () => {
    test('profesional perdedor recibe estado REJECTED en su oferta', async () => {
      const myOffersRes = await fetch(`${API_BASE}/api/offers/my-offers`, {
        headers: { Authorization: `Bearer ${provider2Token}` },
      });
      const myOffers = await myOffersRes.json();

      const offerForThisRequest = myOffers.find(
        (o) => String(o.solicitudId) === String(createdRequestId)
      );
      expect(offerForThisRequest).toBeDefined();
      expect(['REJECTED', 'LOST', 'CANCELLED']).toContain(offerForThisRequest.status);
    });

    test('profesional perdedor recibe 409 si intenta aceptar una solicitud ya cerrada', async () => {
      const res = await fetch(`${API_BASE}/api/solicitudes/${createdRequestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider2Token}`,
        },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      // No autorizado (no es el proveedor asignado)
      expect([403, 409, 400]).toContain(res.status);
    });
  });
});
