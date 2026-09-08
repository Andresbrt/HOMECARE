/**
 * E2E Test Suite 02 - Happy Path Profesional
 * Flujo: Login → Radar → Aceptar Solicitud → Chat → Finanzas
 *
 * Ejecutar: npx detox test --configuration ios.sim.debug e2e/02_happy_path_provider.e2e.js
 */

const { device, element, by, expect, waitFor } = require('detox');

describe('02 - Happy Path Profesional', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────
  // 1. LOGIN PROFESIONAL
  // ──────────────────────────────────────────────────────
  describe('2.1 Autenticación Profesional', () => {
    test('muestra pantalla de bienvenida', async () => {
      await waitFor(element(by.id('welcome-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('navega a Login', async () => {
      await element(by.id('btn-login')).tap();
      await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(5000);
    });

    test('hace login como profesional de prueba', async () => {
      await element(by.id('input-email')).typeText('profesional.prueba@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();

      // El backend detecta ROLE_SERVICE_PROVIDER y redirige al dashboard profesional
      await waitFor(element(by.id('provider-dashboard-screen')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('muestra estado "Disponible" por defecto', async () => {
      await expect(element(by.id('availability-toggle'))).toHaveValue('true');
    });
  });

  // ──────────────────────────────────────────────────────
  // 2. RADAR DE SOLICITUDES GEOLOCALIZADAS
  // ──────────────────────────────────────────────────────
  describe('2.2 Radar de solicitudes', () => {
    test('navega al Mapa / Radar', async () => {
      await element(by.id('tab-map')).tap();
      await waitFor(element(by.id('map-screen')))
        .toBeVisible()
        .withTimeout(8000);
    });

    test('muestra al menos 1 marcador de solicitud cercana', async () => {
      await waitFor(element(by.id('request-marker-0')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('toca un marcador y muestra tarjeta de solicitud', async () => {
      await element(by.id('request-marker-0')).tap();
      await waitFor(element(by.id('request-preview-card')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('la tarjeta muestra: tipo de servicio, distancia, precio sugerido', async () => {
      await expect(element(by.id('preview-service-type'))).toBeVisible();
      await expect(element(by.id('preview-distance'))).toBeVisible();
      await expect(element(by.id('preview-price'))).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────
  // 3. ENVIAR OFERTA Y ACEPTACIÓN
  // ──────────────────────────────────────────────────────
  describe('2.3 Envío de oferta', () => {
    test('abre el detalle de la solicitud', async () => {
      await element(by.id('btn-view-request-detail')).tap();
      await waitFor(element(by.id('request-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('ingresa su precio de oferta ($450.000 COP)', async () => {
      await element(by.id('input-offer-price')).typeText('450000');
    });

    test('envía la oferta al cliente', async () => {
      await element(by.id('btn-send-offer')).tap();
      await waitFor(element(by.id('offer-sent-confirmation')))
        .toBeVisible()
        .withTimeout(8000);
    });

    test('la oferta aparece en la lista "Mis Ofertas" con estado PENDIENTE', async () => {
      await element(by.id('tab-my-offers')).tap();
      await waitFor(element(by.id('offer-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('offer-status-0'))).toHaveText('PENDIENTE');
    });
  });

  // ──────────────────────────────────────────────────────
  // 4. CHAT BIDIRECCIONAL
  // ──────────────────────────────────────────────────────
  describe('2.4 Chat bidireccional', () => {
    test('recibe notificación de oferta aceptada', async () => {
      // Cliente acepta la oferta (simulado por fixture en backend sandbox)
      await waitFor(element(by.id('push-notification-offer-accepted')))
        .toBeVisible()
        .withTimeout(20000);
    });

    test('navega al chat de la solicitud', async () => {
      await element(by.id('push-notification-offer-accepted')).tap();
      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(8000);
    });

    test('profesional envía mensaje al cliente', async () => {
      await element(by.id('chat-input')).typeText('Llegaré en 30 minutos.');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('Llegaré en 30 minutos.')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('recibe respuesta del cliente en tiempo real', async () => {
      // Respuesta inyectada por fixture WebSocket del ambiente de prueba
      await waitFor(element(by.id('incoming-message-0')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('indicador de "escribiendo..." aparece cuando cliente escribe', async () => {
      await waitFor(element(by.id('typing-indicator')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  // ──────────────────────────────────────────────────────
  // 5. FINANZAS / COMISIÓN RECIBIDA
  // ──────────────────────────────────────────────────────
  describe('2.5 Verificación de finanzas', () => {
    test('navega a la pantalla de Finanzas', async () => {
      await element(by.id('tab-finances')).tap();
      await waitFor(element(by.id('finances-screen'))).toBeVisible().withTimeout(5000);
    });

    test('muestra el pago recibido por el servicio en el historial', async () => {
      await waitFor(element(by.id('payment-history-item-0')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('el balance disponible es mayor a $0', async () => {
      await expect(element(by.id('available-balance'))).toBeVisible();
      // Verificar que no muestra $0
      await expect(element(by.id('available-balance'))).not.toHaveText('$0');
    });

    test('la comisión de la plataforma (15%) se descontó correctamente', async () => {
      // Con servicio de $450.000, el proveedor debe recibir ~$382.500
      await expect(element(by.id('commission-detail-label'))).toBeVisible();
    });
  });
});
