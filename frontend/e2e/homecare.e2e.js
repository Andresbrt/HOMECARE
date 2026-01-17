import { test, expect, beforeAll, afterAll } from '@jest/globals';
import { by, device, element, waitFor } from 'detox';

/**
 * TESTS END-TO-END HOMECARE APP
 * Pruebas de integración completa usando Detox
 */

describe('HomeCare App E2E Tests', () => {
  
  beforeAll(async () => {
    await device.launchApp();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Authentication Flow', () => {
    
    it('should show login screen on first launch', async () => {
      await expect(element(by.text('Iniciar Sesión'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
    });

    it('should login successfully with valid credentials', async () => {
      await element(by.id('email-input')).typeText('cliente@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.text('Inicio')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show error with invalid credentials', async () => {
      // Volver a login si es necesario
      await device.launchApp({ delete: true });
      
      await element(by.id('email-input')).typeText('invalid@test.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.text('Credenciales inválidas')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Client Service Request Flow', () => {
    
    beforeAll(async () => {
      // Login como cliente
      await device.launchApp({ delete: true });
      await element(by.id('email-input')).typeText('cliente@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Inicio'))).toBeVisible().withTimeout(5000);
    });

    it('should navigate to request service screen', async () => {
      await element(by.text('Solicitar')).tap();
      await expect(element(by.text('Solicitar Servicio'))).toBeVisible();
    });

    it('should create a new service request', async () => {
      // Llenar formulario de solicitud
      await element(by.id('service-title-input')).typeText('Limpieza General Casa');
      await element(by.id('service-description-input')).typeText('Limpieza completa de apartamento de 2 habitaciones');
      
      // Seleccionar tipo de limpieza
      await element(by.id('cleaning-type-select')).tap();
      await element(by.text('Básica')).tap();
      
      // Establecer precio máximo
      await element(by.id('max-price-input')).typeText('80000');
      
      // Seleccionar fecha
      await element(by.id('service-date-picker')).tap();
      await element(by.text('Mañana')).tap();
      
      // Seleccionar hora
      await element(by.id('time-picker')).tap();
      await element(by.text('10:00 AM')).tap();
      
      // Establecer dirección
      await element(by.id('address-input')).typeText('Calle 123 #45-67, Bogotá');
      
      // Enviar solicitud
      await element(by.id('submit-request-button')).tap();
      
      await waitFor(element(by.text('Solicitud enviada exitosamente')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show created request in my services', async () => {
      await element(by.text('Mis Servicios')).tap();
      await expect(element(by.text('Limpieza General Casa'))).toBeVisible();
    });

    it('should view request details', async () => {
      await element(by.text('Limpieza General Casa')).tap();
      await expect(element(by.text('Detalles de Solicitud'))).toBeVisible();
      await expect(element(by.text('Limpieza completa de apartamento'))).toBeVisible();
    });
  });

  describe('Provider Response Flow', () => {
    
    beforeAll(async () => {
      // Login como proveedor
      await device.launchApp({ delete: true });
      await element(by.id('email-input')).typeText('proveedor@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Inicio'))).toBeVisible().withTimeout(5000);
    });

    it('should show available requests', async () => {
      await element(by.text('Solicitudes')).tap();
      await expect(element(by.text('Solicitudes Disponibles'))).toBeVisible();
    });

    it('should create an offer for a request', async () => {
      // Seleccionar primera solicitud disponible
      await element(by.id('request-item-0')).tap();
      
      // Crear oferta
      await element(by.id('create-offer-button')).tap();
      
      // Llenar datos de la oferta
      await element(by.id('offer-price-input')).typeText('75000');
      await element(by.id('offer-message-input')).typeText('Tengo 5 años de experiencia en limpieza doméstica');
      
      // Enviar oferta
      await element(by.id('submit-offer-button')).tap();
      
      await waitFor(element(by.text('Oferta enviada exitosamente')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show created offer in my offers', async () => {
      await element(by.text('Inicio')).tap();
      await element(by.id('my-offers-card')).tap();
      await expect(element(by.text('$75,000'))).toBeVisible();
    });
  });

  describe('Service Execution Flow', () => {
    
    beforeAll(async () => {
      // Simular que el cliente acepta la oferta
      // Login como cliente
      await device.launchApp({ delete: true });
      await element(by.id('email-input')).typeText('cliente@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Inicio'))).toBeVisible().withTimeout(5000);
    });

    it('should accept provider offer', async () => {
      await element(by.text('Mis Servicios')).tap();
      await element(by.text('Limpieza General Casa')).tap();
      
      // Aceptar primera oferta
      await element(by.id('accept-offer-0')).tap();
      await element(by.text('Aceptar')).tap();
      
      await waitFor(element(by.text('Oferta Aceptada')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show real-time tracking', async () => {
      await element(by.id('tracking-button')).tap();
      await expect(element(by.text('Seguimiento en Tiempo Real'))).toBeVisible();
      await expect(element(by.id('map-view'))).toBeVisible();
    });

    it('should show provider location on map', async () => {
      await waitFor(element(by.id('provider-marker')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.id('client-marker'))).toBeVisible();
    });
  });

  describe('Payment Flow', () => {
    
    it('should proceed to payment after service completion', async () => {
      // Simular finalización del servicio
      await element(by.id('complete-service-button')).tap();
      
      await waitFor(element(by.text('Realizar Pago')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should add payment method', async () => {
      await element(by.text('Agregar')).tap();
      
      // Llenar datos de tarjeta
      await element(by.id('card-number-input')).typeText('4242424242424242');
      await element(by.id('expiry-input')).typeText('12/25');
      await element(by.id('cvc-input')).typeText('123');
      await element(by.id('holder-name-input')).typeText('Juan Test');
      
      await element(by.text('Guardar Tarjeta')).tap();
      
      await waitFor(element(by.text('Tarjeta agregada exitosamente')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should process payment successfully', async () => {
      await element(by.id('payment-button')).tap();
      await element(by.text('Pagar')).tap();
      
      await waitFor(element(by.text('Pago procesado exitosamente')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Rating and Review Flow', () => {
    
    it('should show rating screen after payment', async () => {
      await waitFor(element(by.text('Calificar Servicio')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should submit rating and review', async () => {
      // Seleccionar 5 estrellas
      await element(by.id('star-5')).tap();
      
      // Escribir comentario
      await element(by.id('review-input')).typeText('Excelente servicio, muy profesional y puntual');
      
      // Enviar calificación
      await element(by.id('submit-rating-button')).tap();
      
      await waitFor(element(by.text('Calificación enviada')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Provider Dashboard Flow', () => {
    
    beforeAll(async () => {
      // Login como proveedor
      await device.launchApp({ delete: true });
      await element(by.id('email-input')).typeText('proveedor@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Inicio'))).toBeVisible().withTimeout(5000);
    });

    it('should show earnings dashboard', async () => {
      await element(by.text('Ganancias')).tap();
      await expect(element(by.text('Ganancias'))).toBeVisible();
      await expect(element(by.id('earnings-chart'))).toBeVisible();
    });

    it('should show service history', async () => {
      await element(by.text('Inicio')).tap();
      await element(by.id('service-history-card')).tap();
      await expect(element(by.text('Limpieza General Casa'))).toBeVisible();
    });

    it('should update availability schedule', async () => {
      await element(by.text('Horario')).tap();
      
      // Modificar disponibilidad del lunes
      await element(by.id('monday-toggle')).tap();
      await element(by.id('monday-start-time')).tap();
      await element(by.text('8:00 AM')).tap();
      
      await element(by.id('save-schedule-button')).tap();
      
      await waitFor(element(by.text('Horario actualizado')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Admin Dashboard Flow', () => {
    
    beforeAll(async () => {
      // Login como admin
      await device.launchApp({ delete: true });
      await element(by.id('email-input')).typeText('admin@test.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
    });

    it('should show admin dashboard with metrics', async () => {
      await expect(element(by.text('Dashboard'))).toBeVisible();
      await expect(element(by.id('total-users-metric'))).toBeVisible();
      await expect(element(by.id('total-services-metric'))).toBeVisible();
    });

    it('should show users management', async () => {
      await element(by.text('Usuarios')).tap();
      await expect(element(by.text('Gestión de Usuarios'))).toBeVisible();
      await expect(element(by.id('users-list'))).toBeVisible();
    });

    it('should show reports section', async () => {
      await element(by.text('Reportes')).tap();
      await expect(element(by.text('Reportes del Sistema'))).toBeVisible();
      await expect(element(by.id('reports-chart'))).toBeVisible();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    it('should handle network errors gracefully', async () => {
      // Simular pérdida de conexión
      await device.shake(); // Trigger offline mode if configured
      
      await element(by.id('refresh-button')).tap();
      
      await waitFor(element(by.text('Sin conexión')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should retry failed requests', async () => {
      await element(by.id('retry-button')).tap();
      
      await waitFor(element(by.text('Reconectando...')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate form inputs', async () => {
      await element(by.text('Solicitar')).tap();
      await element(by.id('submit-request-button')).tap();
      
      await expect(element(by.text('Este campo es requerido'))).toBeVisible();
    });

    it('should handle empty states', async () => {
      await element(by.text('Mis Servicios')).tap();
      // Si no hay servicios
      await expect(element(by.text('No tienes servicios aún'))).toBeVisible();
    });
  });

  describe('Performance and Loading States', () => {
    
    it('should show loading indicators', async () => {
      await element(by.text('Inicio')).tap();
      await expect(element(by.id('loading-indicator'))).toBeVisible();
      
      await waitFor(element(by.id('loading-indicator')))
        .not.toBeVisible()
        .withTimeout(5000);
    });

    it('should load data efficiently', async () => {
      const startTime = Date.now();
      
      await element(by.text('Mis Servicios')).tap();
      await waitFor(element(by.id('services-list')))
        .toBeVisible()
        .withTimeout(3000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Menos de 3 segundos
    });
  });
});