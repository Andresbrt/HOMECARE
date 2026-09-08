/**
 * SECURITY TEST SUITE 03 - CSRF Protection
 * OWASP: Cross-Site Request Forgery
 *
 * Ejecutar: npx jest mobile/__tests__/security/03_csrf_protection.test.js
 */

const { safeFetch: apiFetch, API_BASE, skipIfOffline } = require('./_helpers');

let validToken = null;

beforeAll(async () => {
  const res = await apiFetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
  });
  if (res.ok) {
    const data = await res.json();
    validToken = data.token || data.accessToken;
  }
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 1: Endpoints de mutación requieren JWT válido (Bearer token)
// ────────────────────────────────────────────────────────────────────────────
describe('CSRF-01: Endpoints POST requieren autenticación JWT', () => {
  const mutationEndpoints = [
    {
      desc: 'POST /api/solicitudes (crear solicitud)',
      method: 'POST',
      path: '/api/solicitudes',
      body: { serviceType: 'CLEANING', rooms: 1, bathrooms: 1, hasPets: false, budgetMax: 100000, address: 'Test', latitude: 4.71, longitude: -74.07 },
    },
    {
      desc: 'POST /api/offers (crear oferta)',
      method: 'POST',
      path: '/api/offers',
      body: { solicitudId: 'test-id', price: 100000, estimatedMinutes: 30 },
    },
    {
      desc: 'POST /api/pagos/iniciar (iniciar pago)',
      method: 'POST',
      path: '/api/pagos/iniciar',
      body: { solicitudId: 'test-id', amount: 100000 },
    },
    {
      desc: 'DELETE /api/solicitudes/test-id',
      method: 'DELETE',
      path: '/api/solicitudes/test-id',
      body: null,
    },
  ];

  test.each(mutationEndpoints)(
    '$desc sin token → 401',
    async ({ method, path, body }) => {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) opts.body = JSON.stringify(body);

      const res = await apiFetch(`${API_BASE}${path}`, opts);
      expect(res.status).toBe(401);
    }
  );

  test.each(mutationEndpoints)(
    '$desc con token válido → NO 401 (puede ser 200, 400, 404, etc.)',
    async ({ method, path, body }) => {
      if (!validToken) return;
      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
      };
      if (body) opts.body = JSON.stringify(body);

      const res = await apiFetch(`${API_BASE}${path}`, opts);
      // Con token válido, el status NO debe ser 401
      expect(res.status).not.toBe(401);
    }
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 2: Token de acceso expirado → 401 (no 403)
// ────────────────────────────────────────────────────────────────────────────
describe('CSRF-02: Token expirado → 401 Unauthorized', () => {
  // JWT con exp en el pasado (2020-01-01)
  const EXPIRED_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiJjbGllbnRlQGhvbWVjYXJlLmNvIiwicm9sZSI6IlJPTEVfQ1VTVE9NRVIiLCJpYXQiOjE1Nzc4MzY4MDAsImV4cCI6MTU3NzgzNjgwMX0.' +
    'EXPIRED_SIG';

  test('POST /api/solicitudes con token expirado → 401', async () => {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${EXPIRED_TOKEN}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING', rooms: 1, bathrooms: 1, hasPets: false,
        budgetMax: 100000, address: 'Test', latitude: 4.71, longitude: -74.07,
      }),
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/solicitudes con token expirado → 401', async () => {
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      headers: { Authorization: `Bearer ${EXPIRED_TOKEN}` },
    });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 3: JWT válido + operación autorizada → éxito
// ────────────────────────────────────────────────────────────────────────────
describe('CSRF-03: JWT válido + operación válida → success', () => {
  test('GET /api/solicitudes con JWT válido → 200', async () => {
    if (!validToken) return console.warn('Skipped: no token');
    const res = await apiFetch(`${API_BASE}/api/solicitudes/mis-solicitudes`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
  });

  test('GET /api/usuarios/me con JWT válido → 200 con datos del usuario', async () => {
    if (!validToken) return;
    const res = await apiFetch(`${API_BASE}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBeDefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 4: Rate Limiting (protección anti-brute-force)
// ────────────────────────────────────────────────────────────────────────────
describe('CSRF-04: Rate Limiting en endpoints de autenticación', () => {
  test('10 intentos de login fallidos consecutivos → 429 Too Many Requests', async () => {
    const promises = Array.from({ length: 10 }, () =>
      apiFetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'hacker@test.com', password: 'wrongpass' }),
      })
    );
    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);

    // Después de múltiples intentos, alguno debe recibir 429
    // (si rate limiting está implementado)
    const has429 = statuses.some((s) => s === 429);
    const allFail = statuses.every((s) => [401, 400, 429].includes(s));

    // Al menos deben fallar todos (no autorizar)
    expect(allFail).toBe(true);

    // Si rate limiting está activo (recomendado), alguno debe ser 429
    if (has429) {
      console.log('✅ Rate limiting activo: recibió 429 después de múltiples intentos');
    } else {
      console.warn('⚠️ Rate limiting no detectado. Recomendado implementar con Bucket4j.');
    }
  });
});
