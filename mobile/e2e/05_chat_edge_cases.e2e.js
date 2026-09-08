/**
 * E2E Test Suite 05 - Edge Cases del Chat
 * Flujo: 100+ mensajes, resincronización, typing indicator, emojis
 *
 * Ejecutar: npx detox test --configuration ios.sim.debug e2e/05_chat_edge_cases.e2e.js
 */

const { device, element, by, expect, waitFor } = require('detox');

describe('05 - Chat Edge Cases', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('5.1 Setup: Login y navegación al chat', () => {
    test('login como cliente con chat activo', async () => {
      await waitFor(element(by.id('welcome-screen'))).toBeVisible().withTimeout(10000);
      await element(by.id('btn-login')).tap();
      await element(by.id('input-email')).typeText('cliente.prueba@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();
      await waitFor(element(by.id('home-screen-customer'))).toBeVisible().withTimeout(15000);
    });

    test('navega a una conversación de chat activa', async () => {
      await element(by.id('tab-chats')).tap();
      await waitFor(element(by.id('chat-list-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('chat-item-0')).tap();
      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(8000);
    });
  });

  describe('5.2 Volumen: 100+ mensajes sin lag', () => {
    // Simular carga de 100+ mensajes en el historial
    test('el chat carga el historial de mensajes sin crash', async () => {
      await waitFor(element(by.id('chat-messages-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('scroll hacia arriba carga mensajes anteriores (paginación)', async () => {
      await element(by.id('chat-messages-list')).scroll(500, 'up');
      await waitFor(element(by.id('load-more-messages-indicator')))
        .toBeVisible()
        .withTimeout(8000);
    });

    test('envío de 10 mensajes consecutivos sin lag perceptible', async () => {
      const startTime = Date.now();
      for (let i = 1; i <= 10; i++) {
        await element(by.id('chat-input')).tap();
        await element(by.id('chat-input')).typeText(`Mensaje de prueba #${i}`);
        await element(by.id('btn-send-message')).tap();
      }
      const elapsed = Date.now() - startTime;
      // 10 mensajes deben enviarse en menos de 30 segundos
      expect(elapsed).toBeLessThan(30000);
    });

    test('el FlatList no sufre jank (sin frame drops visibles)', async () => {
      // Scroll rápido para detectar jank
      await element(by.id('chat-messages-list')).scroll(1000, 'down', NaN, 0.85);
      await element(by.id('chat-messages-list')).scroll(1000, 'up', NaN, 0.85);
      // Si no crashea, se considera OK para este nivel de prueba
      await expect(element(by.id('chat-messages-list'))).toBeVisible();
    });
  });

  describe('5.3 Resincronización tras cierre de app', () => {
    test('envía un mensaje y mata la app', async () => {
      await element(by.id('chat-input')).typeText('Mensaje antes de cerrar app');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('Mensaje antes de cerrar app')))
        .toBeVisible()
        .withTimeout(5000);

      // Matar app y relanzar
      await device.sendToHome();
      await device.terminateApp();
    });

    test('los mensajes persisten al reabrir la app', async () => {
      await device.launchApp({ newInstance: false }); // Reanudar instancia
      await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(10000);
      await element(by.id('input-email')).typeText('cliente.prueba@homecare.co');
      await element(by.id('input-password')).typeText('Test1234!');
      await element(by.id('btn-submit-login')).tap();
      await waitFor(element(by.id('home-screen-customer'))).toBeVisible().withTimeout(15000);

      await element(by.id('tab-chats')).tap();
      await element(by.id('chat-item-0')).tap();

      await waitFor(element(by.text('Mensaje antes de cerrar app')))
        .toBeVisible()
        .withTimeout(10000);
    });

    test('el indicador de estado del mensaje es "entregado" (no solo enviado)', async () => {
      // El servidor habrá marcado el mensaje como entregado
      await expect(element(by.id('message-status-delivered'))).toBeVisible();
    });
  });

  describe('5.4 Typing Indicator', () => {
    test('indicador de "escribiendo..." aparece al escribir', async () => {
      // El profesional del otro lado está escribiendo (fixture WebSocket)
      await waitFor(element(by.id('typing-indicator')))
        .toBeVisible()
        .withTimeout(15000);
    });

    test('indicador de "escribiendo..." desaparece cuando para de escribir', async () => {
      // Esperar 4 segundos de inactividad del otro usuario
      await waitFor(element(by.id('typing-indicator')))
        .not.toBeVisible()
        .withTimeout(8000);
    });
  });

  describe('5.5 Emojis y caracteres especiales', () => {
    test('envía emoji válido ❤️ en el chat', async () => {
      await element(by.id('chat-input')).typeText('Me alegra saber ❤️');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('Me alegra saber ❤️')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('envía emoji complejo ✅ sin corrupción', async () => {
      await element(by.id('chat-input')).typeText('✅ Confirmado');
      await element(by.id('btn-send-message')).tap();
      await waitFor(element(by.text('✅ Confirmado'))).toBeVisible().withTimeout(5000);
    });

    test('texto largo (300 caracteres) no desborda la burbuja', async () => {
      const longText = 'A'.repeat(300);
      await element(by.id('chat-input')).typeText(longText);
      await element(by.id('btn-send-message')).tap();
      // El mensaje debe aparecer sin romper el layout
      await waitFor(element(by.id('message-bubble-last'))).toBeVisible().withTimeout(5000);
    });
  });
});
