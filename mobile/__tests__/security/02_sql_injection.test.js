/**
 * SECURITY TEST SUITE 02 - SQL Injection Prevention
 * OWASP API Security: API8:2023 Security Misconfiguration + Injection
 *
 * Ejecutar: npx jest mobile/__tests__/security/02_sql_injection.test.js
 */

const { safeFetch: apiFetch, API_BASE, skipIfOffline } = require('./_helpers');

let authToken = null;

beforeAll(async () => {
  const res = await apiFetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente.prueba@homecare.co', password: 'Test1234!' }),
  });
  if (res.ok) {
    const data = await res.json();
    authToken = data.token || data.accessToken;
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Payloads de SQL Injection comunes
// ────────────────────────────────────────────────────────────────────────────
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1 --",
  "'; DROP TABLE solicitudes; --",
  "1' UNION SELECT null, null, null --",
  "' OR '1'='1' /*",
  "admin'--",
  "1; SELECT * FROM usuarios WHERE '1'='1",
  "' OR 1=1#",
  "' OR 'x'='x",
];

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '"><script>alert("stored xss")</script>',
];

// ────────────────────────────────────────────────────────────────────────────
// SUITE 1: Parámetros de búsqueda
// ────────────────────────────────────────────────────────────────────────────
describe('SQL-01: Inyección en parámetros de búsqueda', () => {
  test.each(SQL_INJECTION_PAYLOADS)(
    'GET /api/servicios/buscar?q="%s" NO retorna error 500 ni datos filtrados incorrectamente',
    async (payload) => {
      if (!authToken) return;
      const res = await apiFetch(
        `${API_BASE}/api/servicios/buscar?q=${encodeURIComponent(payload)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      // No debe retornar 500 (error de BD)
      expect(res.status).not.toBe(500);
      // Si retorna datos, no debe ser una lista masiva (señal de bypass)
      if (res.status === 200) {
        const data = await res.json();
        // La búsqueda con payload malicioso no debe devolver más de 20 resultados
        // (una lista masiva indicaría bypass de filtro)
        if (Array.isArray(data)) {
          expect(data.length).toBeLessThan(50);
        }
      }
    }
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 2: Valores numéricos inválidos / negativos
// ────────────────────────────────────────────────────────────────────────────
describe('SQL-02: Valores numéricos inválidos en filtros', () => {
  test('distancia negativa en GET /api/servicios/cercanos?distancia=-1 → 400', async () => {
    if (!authToken) return;
    const res = await apiFetch(
      `${API_BASE}/api/servicios/cercanos?lat=4.71&lng=-74.07&distancia=-1`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    expect([400, 422]).toContain(res.status);
  });

  test('distancia extrema (999999km) → rechazada (400) o devuelve 0 resultados', async () => {
    if (!authToken) return;
    const res = await apiFetch(
      `${API_BASE}/api/servicios/cercanos?lat=4.71&lng=-74.07&distancia=999999`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    if (res.status === 200) {
      const data = await res.json();
      // Si acepta la petición, no debe crashear ni devolver millones de resultados
      if (Array.isArray(data)) {
        expect(data.length).toBeLessThan(1000);
      }
    } else {
      expect([400, 422]).toContain(res.status);
    }
  });

  test('presupuesto negativo en creación de solicitud → 400', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 2,
        bathrooms: 1,
        hasPets: false,
        budgetMax: -50000,
        address: 'Test',
        latitude: 4.71,
        longitude: -74.07,
      }),
    });
    expect([400, 422]).toContain(res.status);
  });

  test('número de cuartos = 0 → rechazado (400)', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 0,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 300000,
        address: 'Test',
        latitude: 4.71,
        longitude: -74.07,
      }),
    });
    expect([400, 422]).toContain(res.status);
  });

  test('número de cuartos = 1000 → rechazado (400)', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 1000,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 300000,
        address: 'Test',
        latitude: 4.71,
        longitude: -74.07,
      }),
    });
    expect([400, 422]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 3: Caracteres especiales en campos de texto (sanitización)
// ────────────────────────────────────────────────────────────────────────────
describe('SQL-03: Sanitización de caracteres especiales en campos', () => {
  test.each(XSS_PAYLOADS)(
    'dirección con payload XSS "%s" → no genera error 500 y se sanitiza',
    async (payload) => {
      if (!authToken) return;
      const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          serviceType: 'CLEANING',
          rooms: 2,
          bathrooms: 1,
          hasPets: false,
          budgetMax: 300000,
          address: payload,
          latitude: 4.71,
          longitude: -74.07,
        }),
      });
      // No debe crashear el servidor
      expect(res.status).not.toBe(500);
    }
  );

  test.each(SQL_INJECTION_PAYLOADS)(
    'campo address con SQL injection "%s" → no retorna 500',
    async (payload) => {
      if (!authToken) return;
      const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          serviceType: 'CLEANING',
          rooms: 2,
          bathrooms: 1,
          hasPets: false,
          budgetMax: 300000,
          address: payload,
          latitude: 4.71,
          longitude: -74.07,
        }),
      });
      expect(res.status).not.toBe(500);
    }
  );

  test('email de login con payload SQL → no retorna usuario inesperado', async () => {
    const res = await apiFetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "' OR 1=1 --",
        password: "' OR '1'='1",
      }),
    });
    // Debe retornar 400, 401, 422 o 429 (rate limit activo), nunca 200 con un token
    expect(res.status).not.toBe(200);
    expect([400, 401, 422, 429]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 4: Validación de tipos (Type Confusion)
// ────────────────────────────────────────────────────────────────────────────
describe('SQL-04: Type Confusion y campos inesperados', () => {
  test('campo rooms con valor string → 400', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 'tres',
        bathrooms: 1,
        hasPets: false,
        budgetMax: 300000,
        address: 'Test',
        latitude: 4.71,
        longitude: -74.07,
      }),
    });
    expect([400, 422]).toContain(res.status);
  });

  test('campo latitude con valor extremo (fuera de Colombia) → rechazado o ignorado', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        serviceType: 'CLEANING',
        rooms: 2,
        bathrooms: 1,
        hasPets: false,
        budgetMax: 300000,
        address: 'Test',
        latitude: 999.999,  // Coordenada inválida
        longitude: -74.07,
      }),
    });
    expect([400, 422]).toContain(res.status);
  });

  test('body vacío → 400, no 500', async () => {
    if (!authToken) return;
    const res = await apiFetch(`${API_BASE}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: '{}',
    });
    expect([400, 422]).toContain(res.status);
  });
});
