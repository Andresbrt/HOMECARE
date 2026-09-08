/**
 * E2E Test Suite 01 - Happy Path Cliente
 * Flujo: Login → Catálogo → Crear Solicitud → Chat → Pago → Confirmación
 *
 * Ejecutar: npx detox test --configuration ios.sim.debug e2e/01_happy_path_customer.e2e.js
 */

const { device, element, by, expect, waitFor } = require('detox');

describe('01 - Happy Path Cliente', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────
  // 1. LOGIN CON CUENTA DE PRUEBA
  // ──────────────────────────────────────────────────────
  describe('1.1 Autenticación', () => {
    test('muestra la pantalla de bienvenida al abrir la app', async () => {
      await waitFor(element(by.id('welcome-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('navega a Login al tocar "Iniciar Sesión"', async () => {
      await element(by.id('btn-login')).tap();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('ingresa credenciales de cliente de prueba y hace login', async () => {
      await element(by.id('input-email')).typeText('cliente.prueba@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();

      await waitFor(element(by.id('home-screen-customer')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('muestra nombre del usuario en el header tras login', async () => {
      await expect(element(by.id('header-user-name'))).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────
  // 2. CATÁLOGO DE SERVICIOS
  // ──────────────────────────────────────────────────────
  describe('1.2 Exploración del catálogo', () => {
    test('muestra al menos 3 categorías de servicio', async () => {
      await waitFor(element(by.id('service-catalog')))
        .toBeVisible()
        .withTimeout(8000);
      await expect(element(by.id('category-card-0'))).toBeVisible();
      await expect(element(by.id('category-card-1'))).toBeVisible();
      await expect(element(by.id('category-card-2'))).toBeVisible();
    });

    test('selecciona categoría "Limpieza del Hogar"', async () => {
      await element(by.id('category-card-0')).tap();
      await waitFor(element(by.id('service-detail-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  // ──────────────────────────────────────────────────────
  // 3. CREAR SOLICITUD (3 cuartos, $500.000 COP)
  // ──────────────────────────────────────────────────────
  describe('1.3 Creación de solicitud', () => {
    test('navega al formulario de solicitud', async () => {
      await element(by.id('btn-create-request')).tap();
      await waitFor(element(by.id('request-form-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('completa el formulario: 3 cuartos, 2 baños, sin mascotas, presupuesto $500.000', async () => {
      // Cuartos
      await element(by.id('stepper-rooms-plus')).tap();
      await element(by.id('stepper-rooms-plus')).tap();
      await element(by.id('stepper-rooms-plus')).tap();
      await expect(element(by.id('stepper-rooms-value'))).toHaveText('3');

      // Baños
      await element(by.id('stepper-bathrooms-plus')).tap();
      await element(by.id('stepper-bathrooms-plus')).tap();
      await expect(element(by.id('stepper-bathrooms-value'))).toHaveText('2');

      // Sin mascotas
      await expect(element(by.id('toggle-pets'))).toHaveValue('false');

      // Presupuesto
      await element(by.id('input-budget')).clearText();
      await element(by.id('input-budget')).typeText('500000');

      // Dirección
      await element(by.id('input-address')).typeText('Calle 100 # 15-32, Bogotá');
    });

    test('muestra precio estimado por IA antes de enviar', async () => {
      await waitFor(element(by.id('price-suggestion-banner')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('envía la solicitud y muestra pantalla de espera', async () => {
      await element(by.id('btn-submit-request')).tap();
      await waitFor(element(by.id('waiting-for-providers-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  // ──────────────────────────────────────────────────────
  // 4. CHAT EN TIEMPO REAL
  // ──────────────────────────────────────────────────────
  describe('1.4 Chat con profesional', () => {
    test('recibe oferta de profesional (simulada)', async () => {
      // Espera oferta llegue por WebSocket (máx 20s en sandbox)
      await waitFor(element(by.id('offer-received-card')))
        .toBeVisible()
        .withTimeout(20000);
    });

    test('acepta la oferta del profesional', async () => {
      await element(by.id('btn-accept-offer')).tap();
      await waitFor(element(by.id('chat-screen')))
        .toBeVisible()
        .withTimeout(8000);
    });

    test('envía un mensaje de texto en el chat', async () => {
      await element(by.id('chat-input')).typeText('Hola, ¿a qué hora llegas?');
      await element(by.id('btn-send-message')).tap();

      await waitFor(element(by.text('Hola, ¿a qué hora llegas?')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('mensaje aparece con indicador "enviado"', async () => {
      await expect(element(by.id('message-status-sent'))).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────
  // 5. PAGO CON MERCADO PAGO (sandbox)
  // ──────────────────────────────────────────────────────
  describe('1.5 Flujo de pago', () => {
    test('navega a pantalla de pago', async () => {
      await element(by.id('btn-proceed-to-payment')).tap();
      await waitFor(element(by.id('payment-screen')))
        .toBeVisible()
        .withTimeout(8000);
    });

    test('carga el WebView de Mercado Pago Bricks', async () => {
      await waitFor(element(by.id('mp-bricks-webview')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('completa el pago con tarjeta de prueba aprobada', async () => {
      // Interacción dentro del WebView via JS (inyección)
      await element(by.id('mp-bricks-webview')).tap();
      // El formulario de Bricks se maneja internamente;
      // verificamos redirección al callback de éxito
      await waitFor(element(by.id('payment-success-screen')))
        .toBeVisible()
        .withTimeout(30000);
    });

    test('muestra confirmación con número de transacción', async () => {
      await expect(element(by.id('transaction-id-label'))).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────
  // 6. CONFIRMACIÓN DEL SERVICIO
  // ──────────────────────────────────────────────────────
  describe('1.6 Confirmación y calificación', () => {
    test('muestra pantalla de confirmación de servicio completado', async () => {
      await waitFor(element(by.id('service-completed-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('cliente califica al profesional con 5 estrellas', async () => {
      await element(by.id('star-5')).tap();
      await element(by.id('btn-submit-rating')).tap();

      await waitFor(element(by.id('rating-success-toast')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('regresa al home después de calificar', async () => {
      await waitFor(element(by.id('home-screen-customer')))
        .toBeVisible()
        .withTimeout(8000);
    });
  });
});
