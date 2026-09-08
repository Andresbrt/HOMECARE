/**
 * SECURITY TEST SUITE 01 - RBAC Authorization
 * OWASP API Security: API1:2023 Broken Object Level Authorization
 *
 * Ejecutar: npx jest mobile/__tests__/security/01_rbac_authorization.test.js
 */

const { safeFetch: apiFetch, loginAs: helperLogin, API_BASE, skipIfOffline } = require('./_helpers');


let customerToken = null;
let customer2Token = null;
let providerToken = null;
let provider2Token = null;
let adminToken = null;
let expiredToken = null;
let customer1RequestId = null;
let customer2RequestId = null;

// JWT expirado (generado con secret incorrecto o fecha en el pasado)
const EXPIRED_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IlJPTEVfQ1VTVE9NRVIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.' +
  'INVALID_SIGNATURE';

// ────────────────────────────────────────────────────────────────────────────
// SETUP: Obtener tokens de prueba
// ────────────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  const loginAs = async (email, password) => {
    const res = await apiFetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || data.accessToken || null;
  };

  customerToken = await loginAs('cliente.prueba@homecare.co', 'Test1234!');
  customer2Token = await loginAs('cliente2.prueba@homecare.co', 'Test1234!');
  providerToken = await loginAs('profesional.prueba@homecare.co', 'Test1234!');
  provider2Token = await loginAs('profesional2@homecare.co', 'Test1234!');
  adminToken = await loginAs('admin@homecare.co', 'Admin1234!');

  // Crear una solicitud con cliente1 para probar BOLA
  if (customerToken) {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 2,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 300000,
        address: 'Test address RBAC',
        latitude: 4.71,
        longitude: -74.07,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      customer1RequestId = data.id;
    }
  }

  // Crear solicitud con cliente2
  if (customer2Token) {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer2Token}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 1,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 200000,
        address: 'Test address RBAC 2',
        latitude: 4.72,
        longitude: -74.06,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      customer2RequestId = data.id;
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 1: BOLA - Broken Object Level Authorization
// ────────────────────────────────────────────────────────────────────────────
describe('RBAC-01: BOLA - Cliente no puede ver datos de otro cliente', () => {
  test('cliente2 NO puede ver solicitud de cliente1 → 403 o 404', async () => {
    if (!customer2Token || !customer1RequestId) {
      return console.warn('Skipped: tokens no disponibles');
    }
    const res = await apiFetch(`${API_BASE}/api/solicitudes/${customer1RequestId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    expect([403, 404]).toContain(res.status);
  });

  test('cliente2 NO puede modificar solicitud de cliente1 → 403', async () => {
    if (!customer2Token || !customer1RequestId) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes/${customer1RequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer2Token}`,
      },
      body: JSON.stringify({ budgetMax: 99 }),
    });
    expect([403, 404]).toContain(res.status);
  });

  test('cliente2 NO puede cancelar solicitud de cliente1 → 403', async () => {
    if (!customer2Token || !customer1RequestId) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes/${customer1RequestId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    expect([403, 404]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 2: Profesional no puede ver finanzas de otro profesional
// ────────────────────────────────────────────────────────────────────────────
describe('RBAC-02: Profesional no puede ver finanzas de otro profesional', () => {
  let provider1FinanceId = null;

  test('profesional1 obtiene su propio resumen financiero → 200', async () => {
    if (!providerToken) return;
    const res = await apiFetch(`${API_BASE}/api/finanzas/resumen`, {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBeDefined();
  });

  test('profesional2 NO puede ver las finanzas de profesional1 con ID directo → 403', async () => {
    if (!providerToken || !provider2Token) return;

    // Obtener ID del profesional1
    const meRes = await apiFetch(`${API_BASE}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    if (!meRes.ok) return;
    const provider1Data = await meRes.json();
    const provider1Id = provider1Data.id;

    // Intentar acceder a las finanzas de profesional1 con token de profesional2
    const res = await apiFetch(`${API_BASE}/api/finanzas/usuario/${provider1Id}`, {
      headers: { Authorization: `Bearer ${provider2Token}` },
    });
    expect([403, 404]).toContain(res.status);
  });

  test('profesional2 NO puede ver el historial de pagos de profesional1', async () => {
    if (!providerToken || !provider2Token) return;

    const meRes = await apiFetch(`${API_BASE}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    if (!meRes.ok) return;
    const { id: provider1Id } = await meRes.json();

    const res = await apiFetch(`${API_BASE}/api/pagos/proveedor/${provider1Id}`, {
      headers: { Authorization: `Bearer ${provider2Token}` },
    });
    expect([403, 404]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 3: Endpoint de Admin requiere ROLE_ADMIN
// ────────────────────────────────────────────────────────────────────────────
describe('RBAC-03: Endpoints de administración requieren ROLE_ADMIN', () => {
  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/usuarios' },
    { method: 'GET', path: '/api/admin/solicitudes' },
    { method: 'GET', path: '/api/admin/metricas' },
    { method: 'GET', path: '/api/admin/finanzas/comisiones' },
  ];

  test.each(adminEndpoints)(
    'cliente NO puede acceder a $method $path → 403',
    async ({ method, path }) => {
      if (!customerToken) return;
      const res = await apiFetch(`${API_BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect([403, 401]).toContain(res.status);
    }
  );

  test.each(adminEndpoints)(
    'profesional NO puede acceder a $method $path → 403',
    async ({ method, path }) => {
      if (!providerToken) return;
      const res = await apiFetch(`${API_BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${providerToken}` },
      });
      expect([403, 401]).toContain(res.status);
    }
  );

  test('admin SÍ puede acceder a /api/admin/usuarios → 200', async () => {
    if (!adminToken) return console.warn('Skipped: adminToken no disponible');
    const res = await apiFetch(`${API_BASE}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 4: JWT expirado → 401 Unauthorized
// ────────────────────────────────────────────────────────────────────────────
describe('RBAC-04: JWT expirado o inválido → 401', () => {
  test('token expirado en /api/solicitudes → 401', async () => {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      headers: { Authorization: `Bearer ${EXPIRED_JWT}` },
    });
    expect(res.status).toBe(401);
  });

  test('token con firma incorrecta → 401', async () => {
    const tampered =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IlJPTEVfQURNSU4iLCJpYXQiOjk5OTk5OTk5OTl9.' +
      'HACKED_SIGNATURE';
    const res = await apiFetch(`${API_BASE}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${tampered}` },
    });
    expect(res.status).toBe(401);
  });

  test('sin token → 401 en endpoints protegidos', async () => {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`);
    expect(res.status).toBe(401);
  });

  test('token malformado (no es JWT) → 401', async () => {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      headers: { Authorization: 'Bearer not.a.valid.jwt' },
    });
    expect(res.status).toBe(401);
  });

  test('prefijo Bearer ausente → 401', async () => {
    if (!customerToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      headers: { Authorization: customerToken }, // sin "Bearer "
    });
    expect(res.status).toBe(401);
  });
});
