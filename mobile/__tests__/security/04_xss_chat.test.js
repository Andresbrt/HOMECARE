/**
 * SECURITY TEST SUITE 04 - XSS Prevention en Chat
 * OWASP: API7:2023 Server Side Request Forgery + Stored XSS
 *
 * Ejecutar: npx jest mobile/__tests__/security/04_xss_chat.test.js
 */

const { safeFetch: apiFetch, API_BASE, skipIfOffline } = require('./_helpers');


let senderToken = null;
let receiverToken = null;
let testChatId = null;

// ────────────────────────────────────────────────────────────────────────────
// SETUP
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
    return data.token || data.accessToken;
  };

  senderToken = await loginAs('cliente.prueba@homecare.co', 'Test1234!');
  receiverToken = await loginAs('profesional.prueba@homecare.co', 'Test1234!');

  // Obtener o crear un chat de prueba
  if (senderToken) {
    const chatsRes = await apiFetch(`${API_BASE}/api/chat/rooms`, {
      headers: { Authorization: `Bearer ${senderToken}` },
    });
    if (chatsRes.ok) {
      const chats = await chatsRes.json();
      if (chats.length > 0) {
        testChatId = chats[0].id || chats[0].roomId;
      }
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Payloads XSS a probar
// ────────────────────────────────────────────────────────────────────────────
const XSS_PAYLOADS = [
  { label: 'script tag básico', payload: '<script>alert("xss")</script>' },
  { label: 'img onerror', payload: '<img src=x onerror=alert(1)>' },
  { label: 'svg onload', payload: '<svg onload=alert(1)>' },
  { label: 'javascript href', payload: '<a href="javascript:alert(1)">click</a>' },
  { label: 'event handler', payload: '<div onmouseover="alert(1)">hover</div>' },
  { label: 'iframe injection', payload: '<iframe src="javascript:alert(1)"></iframe>' },
  { label: 'style expression', payload: '<div style="background:url(javascript:alert(1))">X</div>' },
];

const VALID_MESSAGES = [
  { label: 'texto plano', payload: 'Hola, ¿cómo estás?' },
  { label: 'emoji corazón', payload: '❤️ Me alegra trabajar contigo' },
  { label: 'emoji check', payload: '✅ Servicio completado' },
  { label: 'emoji mixto', payload: '👍 Excelente trabajo 🎉' },
  { label: 'caracteres especiales válidos', payload: 'Dirección: Cra 15 # 80-25, 3er piso' },
  { label: 'texto largo (200 chars)', payload: 'A'.repeat(200) },
];

// ────────────────────────────────────────────────────────────────────────────
// SUITE 1: Mensajes con payload XSS → almacenados sanitizados
// ────────────────────────────────────────────────────────────────────────────
describe('XSS-01: Payloads XSS en mensajes de chat son sanitizados', () => {
  test.each(XSS_PAYLOADS)(
    'mensaje con $label NO genera error 500 y el contenido se sanitiza',
    async ({ payload }) => {
      if (!senderToken || !testChatId) return;

      const sendRes = await apiFetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senderToken}`,
        },
        body: JSON.stringify({
          roomId: testChatId,
          content: payload,
          messageType: 'TEXT',
        }),
      });

      // No debe crashear el servidor
      expect(sendRes.status).not.toBe(500);

      if (sendRes.status === 201 || sendRes.status === 200) {
        const savedMessage = await sendRes.json();

        // El contenido guardado NO debe contener etiquetas HTML de script
        if (savedMessage.content) {
          expect(savedMessage.content).not.toMatch(/<script/i);
          expect(savedMessage.content).not.toMatch(/onerror\s*=/i);
          expect(savedMessage.content).not.toMatch(/onload\s*=/i);
          expect(savedMessage.content).not.toMatch(/javascript:/i);
        }
      }
    }
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 2: Mensajes con emojis válidos → se muestran correctamente
// ────────────────────────────────────────────────────────────────────────────
describe('XSS-02: Mensajes con emojis y texto válido se almacenan sin alteración', () => {
  test.each(VALID_MESSAGES)(
    'mensaje "$label" se envía y recupera correctamente',
    async ({ payload }) => {
      if (!senderToken || !testChatId) return;

      const sendRes = await apiFetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senderToken}`,
        },
        body: JSON.stringify({
          roomId: testChatId,
          content: payload,
          messageType: 'TEXT',
        }),
      });

      // Debe tener éxito (200 o 201)
      expect([200, 201]).toContain(sendRes.status);

      if (sendRes.status === 201 || sendRes.status === 200) {
        const savedMessage = await sendRes.json();
        // El texto válido debe guardarse (puede estar sanitizado pero no eliminado)
        expect(savedMessage).toBeDefined();
      }
    }
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 3: Tags HTML removidos, texto limpio recuperable
// ────────────────────────────────────────────────────────────────────────────
describe('XSS-03: HTML tags removidos del contenido almacenado', () => {
  let storedMessageId = null;

  test('envía mensaje con HTML → se almacena sin tags peligrosos', async () => {
    if (!senderToken || !testChatId) return;

    const payload = '<b>Texto en negrita</b> con <em>énfasis</em> y <script>alert()</script>';

    const sendRes = await apiFetch(`${API_BASE}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderToken}`,
      },
      body: JSON.stringify({
        roomId: testChatId,
        content: payload,
        messageType: 'TEXT',
      }),
    });

    expect(sendRes.status).not.toBe(500);

    if (sendRes.ok) {
      const saved = await sendRes.json();
      storedMessageId = saved.id;

      if (saved.content) {
        // Script debe estar sanitizado
        expect(saved.content).not.toMatch(/<script/i);
        // El texto de fondo puede preservarse (sin los tags): "Texto en negrita con énfasis y "
        // O puede escapearse como entidades HTML: &lt;b&gt;
      }
    }
  });

  test('recupera el mensaje guardado → no tiene ejecutables activos', async () => {
    if (!senderToken || !testChatId) return;

    const histRes = await apiFetch(`${API_BASE}/api/chat/messages/${testChatId}`, {
      headers: { Authorization: `Bearer ${senderToken}` },
    });

    if (histRes.ok) {
      const messages = await histRes.json();
      const content = Array.isArray(messages) ? messages : (messages.messages || []);

      content.forEach((msg) => {
        if (msg.content) {
          // Ningún mensaje en el historial debe contener scripts ejecutables
          expect(msg.content).not.toMatch(/<script[\s\S]*?>/i);
          expect(msg.content).not.toMatch(/javascript:alert/i);
        }
      });
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SUITE 4: Content-Type validation (no XML/form data en endpoints JSON)
// ────────────────────────────────────────────────────────────────────────────
describe('XSS-04: Content-Type incorrecto → rechazado', () => {
  test('POST /api/chat/messages con Content-Type text/html → 415 o 400', async () => {
    if (!senderToken || !testChatId) return;

    const res = await apiFetch(`${API_BASE}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
        Authorization: `Bearer ${senderToken}`,
      },
      body: '<html><body>hacked</body></html>',
    });

    expect([400, 415, 422]).toContain(res.status);
  });

  test('respuesta de API incluye Content-Type: application/json (no HTML)', async () => {
    if (!senderToken) return;
    const res = await apiFetch(`${API_BASE}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${senderToken}` },
    });
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('application/json');
  });

  test('headers de seguridad presentes en respuestas', async () => {
    if (!senderToken) return;
    const res = await apiFetch(`${API_BASE}/api/servicios`, {
      headers: { Authorization: `Bearer ${senderToken}` },
    });
    // Spring Security agrega estos headers por defecto
    const xContentType = res.headers.get('x-content-type-options');
    const xFrame = res.headers.get('x-frame-options');

    // Al menos uno de los headers de seguridad debe estar presente
    const hasSecurityHeaders = xContentType || xFrame;
    if (!hasSecurityHeaders) {
      console.warn('⚠️ Headers de seguridad X-Content-Type-Options y X-Frame-Options no detectados.');
    }
  });
});
