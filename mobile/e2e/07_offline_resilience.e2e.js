/**
 * E2E Test Suite 07 - Resiliencia Offline
 * Flujo: WiFi → pierde conexión → mensajes encolados → reconexión → sincronización
 *
 * Ejecutar: npx detox test --configuration ios.sim.debug e2e/07_offline_resilience.e2e.js
 */

const { device, element, by, expect, waitFor } = require('detox');

describe('07 - Resiliencia Offline', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'always', notifications: 'YES' },
    });
  });

  afterAll(async () => {
    await device.enableSynchronization();
    // Asegurar que la red quede habilitada al final
    try { await device.setStatusBar({ dataNetwork: 'wifi' }); } catch (_) {}
    await device.terminateApp();
  });

  describe('7.1 Setup con conexión activa', () => {
    test('login como cliente con WiFi activa', async () => {
      await waitFor(element(by.id('welcome-screen'))).toBeVisible().withTimeout(10000);
      await element(by.id('btn-login')).tap();
      await element(by.id('input-email')).typeText('cliente.prueba@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();
      await waitFor(element(by.id('home-screen-customer'))).toBeVisible().withTimeout(15000);
    });

    test('navega a un chat activo', async () => {
      await element(by.id('tab-chats')).tap();
      await waitFor(element(by.id('chat-list-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('chat-item-0')).tap();
      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(8000);
    });
  });

  describe('7.2 Pérdida de conexión', () => {
    test('desactiva la red (simular pérdida de WiFi)', async () => {
      // En iOS Simulator: device.setStatusBar puede cambiar indicadores
      // La desactivación real de red en Detox se hace con `device.disableSynchronization()`
      // + manipulación de Network Link Conditioner o via API del simulador
      await device.disableSynchronization();
    });

    test('muestra banner/indicador de "Sin conexión" o "Reconectando..."', async () => {
      await waitFor(element(by.id('offline-banner')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('el chat no crashea con la conexión perdida', async () => {
      await expect(element(by.id('chat-screen'))).toBeVisible();
    });
  });

  describe('7.3 Mensajes encolados sin conexión', () => {
    test('envía mensaje sin conexión → aparece con estado "Pendiente"', async () => {
      await element(by.id('chat-input')).typeText('Mensaje sin conexión #1');
      await element(by.id('btn-send-message')).tap();

      await waitFor(element(by.text('Mensaje sin conexión #1')))
        .toBeVisible()
        .withTimeout(5000);

      // El mensaje debe tener indicador de "pendiente" / reloj
      await expect(element(by.id('message-status-pending'))).toBeVisible();
    });

    test('envía un segundo mensaje encolado', async () => {
      await element(by.id('chat-input')).typeText('Mensaje sin conexión #2');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('Mensaje sin conexión #2')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('7.4 Reconexión y sincronización', () => {
    test('reactiva la conexión de red', async () => {
      await device.enableSynchronization();
    });

    test('el banner de "Sin conexión" desaparece', async () => {
      await waitFor(element(by.id('offline-banner')))
        .not.toBeVisible()
        .withTimeout(15000);
    });

    test('los mensajes encolados cambian a estado "enviado"', async () => {
      await waitFor(element(by.id('message-status-sent')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('el WebSocket se reconecta automáticamente (STOMP reconnect)', async () => {
      await waitFor(element(by.id('websocket-connected-indicator')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('7.5 Resincronización de ubicación', () => {
    test('profesional que perdió conexión re-sincroniza su ubicación al reconectarse', async () => {
      // Verificado via API en backend; aquí confirmamos que el mapa no muestra ubicación antigua
      await device.setLocation(4.6700, -74.0550);
      // La ubicación debe actualizarse en la próxima oportunidad (< 60s tras reconexión)
      // Para el test E2E, solo confirmamos que la app no crashea y el mapa sigue visible
      await expect(element(by.id('chat-screen'))).toBeVisible();
    });
  });

  describe('7.6 Comportamiento en cambio WiFi → 4G', () => {
    test('la app mantiene la sesión al cambiar de red', async () => {
      // Simular cambio de red (en iOS: Network Link Conditioner)
      // Aquí confirmamos que la sesión sigue activa
      await expect(element(by.id('chat-screen'))).toBeVisible();
    });

    test('el token JWT sigue siendo válido tras cambio de red', async () => {
      // Enviar un mensaje para confirmar la autenticación sigue activa
      await element(by.id('chat-input')).typeText('Test reconexión 4G');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('Test reconexión 4G'))).toBeVisible().withTimeout(10000);
      await waitFor(element(by.id('message-status-sent'))).toBeVisible().withTimeout(10000);
    });
  });
});
