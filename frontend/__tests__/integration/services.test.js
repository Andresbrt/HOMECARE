import { test, expect } from '@jest/globals';
import { requestService } from '../src/services/requestService';
import { offerService } from '../src/services/offerService';
import { authService } from '../src/services/authService';
import { paymentService } from '../src/services/paymentService';

/**
 * TESTS DE INTEGRACIÓN DE SERVICIOS
 * Pruebas de los servicios API con el backend real
 */

// Mock de AsyncStorage para tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('API Services Integration Tests', () => {
  
  let testUser = null;
  let testToken = null;
  let testRequestId = null;
  let testOfferId = null;

  beforeAll(async () => {
    // Setup: Login con usuario de test
    try {
      const loginResponse = await authService.login({
        email: 'test.cliente@homecare.com',
        password: 'TestPassword123!'
      });
      
      testUser = loginResponse.user;
      testToken = loginResponse.accessToken;
    } catch (error) {
      console.warn('Test user not available, skipping integration tests');
    }
  });

  describe('Authentication Service', () => {
    
    it('should login successfully with valid credentials', async () => {
      const response = await authService.login({
        email: 'test.cliente@homecare.com',
        password: 'TestPassword123!'
      });

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response.user).toHaveProperty('email');
      expect(response.user.email).toBe('test.cliente@homecare.com');
    });

    it('should reject invalid credentials', async () => {
      await expect(authService.login({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })).rejects.toThrow();
    });

    it('should refresh token successfully', async () => {
      const response = await authService.refreshToken();
      expect(response).toHaveProperty('accessToken');
    });
  });

  describe('Request Service', () => {
    
    it('should create a service request', async () => {
      const requestData = {
        title: 'Test Cleaning Service',
        description: 'Integration test cleaning request',
        cleaningType: 'BASICA',
        serviceDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        startTime: '10:00',
        duration: 3,
        maxPrice: 80000,
        address: 'Test Address 123, Bogotá',
        latitude: 4.7110,
        longitude: -74.0721,
        urgentService: false,
        provideSupplies: true,
        petFriendly: false,
        needKeys: false
      };

      const response = await requestService.createRequest(requestData);
      
      expect(response).toHaveProperty('id');
      expect(response.title).toBe(requestData.title);
      expect(response.status).toBe('ABIERTA');
      
      testRequestId = response.id;
    });

    it('should get request by ID', async () => {
      if (!testRequestId) return;
      
      const response = await requestService.getRequestById(testRequestId);
      
      expect(response.id).toBe(testRequestId);
      expect(response.title).toBe('Test Cleaning Service');
    });

    it('should get user requests', async () => {
      const response = await requestService.getMyRequests();
      
      expect(Array.isArray(response.requests)).toBe(true);
      expect(response).toHaveProperty('pagination');
    });

    it('should update request', async () => {
      if (!testRequestId) return;
      
      const updateData = {
        description: 'Updated integration test description'
      };

      const response = await requestService.updateRequest(testRequestId, updateData);
      
      expect(response.description).toBe(updateData.description);
    });
  });

  describe('Offer Service', () => {
    
    beforeAll(async () => {
      // Login como proveedor para crear ofertas
      try {
        await authService.login({
          email: 'test.proveedor@homecare.com',
          password: 'TestPassword123!'
        });
      } catch (error) {
        console.warn('Test provider not available');
      }
    });

    it('should create an offer', async () => {
      if (!testRequestId) return;
      
      const offerData = {
        requestId: testRequestId,
        price: 75000,
        message: 'Test offer from integration tests',
        serviceDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '10:00'
      };

      const response = await offerService.createOffer(offerData);
      
      expect(response).toHaveProperty('id');
      expect(response.price).toBe(offerData.price);
      expect(response.status).toBe('ENVIADA');
      
      testOfferId = response.id;
    });

    it('should get offers for request', async () => {
      if (!testRequestId) return;
      
      const response = await offerService.getOffersByRequest(testRequestId);
      
      expect(Array.isArray(response.offers)).toBe(true);
      if (response.offers.length > 0) {
        expect(response.offers[0]).toHaveProperty('id');
        expect(response.offers[0]).toHaveProperty('price');
      }
    });

    it('should get provider offers', async () => {
      const response = await offerService.getMyOffers();
      
      expect(Array.isArray(response.offers)).toBe(true);
      expect(response).toHaveProperty('pagination');
    });
  });

  describe('Payment Service', () => {
    
    beforeAll(async () => {
      // Volver a login como cliente
      try {
        await authService.login({
          email: 'test.cliente@homecare.com',
          password: 'TestPassword123!'
        });
      } catch (error) {
        console.warn('Test client not available');
      }
    });

    it('should get payment methods', async () => {
      const response = await paymentService.getPaymentMethods();
      
      expect(Array.isArray(response)).toBe(true);
    });

    it('should get Wompi configuration', async () => {
      const response = await paymentService.getWompiPublicConfig();
      
      expect(response).toHaveProperty('publicKey');
      expect(response).toHaveProperty('environment');
      expect(response).toHaveProperty('currency');
    });

    it('should validate card information', async () => {
      const validation = paymentService.validateCard(
        '4242424242424242',
        '12/25',
        '123'
      );
      
      expect(validation.isValid).toBe(true);
      expect(Object.keys(validation.errors)).toHaveLength(0);
    });

    it('should reject invalid card information', async () => {
      const validation = paymentService.validateCard(
        '1234567890123456',
        '01/20',
        '12'
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveProperty('cardNumber');
      expect(validation.errors).toHaveProperty('expiry');
      expect(validation.errors).toHaveProperty('cvc');
    });

    it('should get payment history', async () => {
      const response = await paymentService.getPaymentHistory();
      
      expect(response).toHaveProperty('payments');
      expect(response).toHaveProperty('pagination');
      expect(Array.isArray(response.payments)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    
    it('should handle network errors gracefully', async () => {
      // Simular error de red usando URL inválida
      const originalUrl = requestService.apiClient.defaults.baseURL;
      requestService.apiClient.defaults.baseURL = 'http://invalid-url:9999';
      
      await expect(requestService.getMyRequests()).rejects.toThrow();
      
      // Restaurar URL original
      requestService.apiClient.defaults.baseURL = originalUrl;
    });

    it('should handle 401 unauthorized errors', async () => {
      // Limpiar token para simular usuario no autorizado
      await authService.logout();
      
      await expect(requestService.createRequest({})).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      // Login nuevamente
      await authService.login({
        email: 'test.cliente@homecare.com',
        password: 'TestPassword123!'
      });
      
      // Intentar crear solicitud con datos inválidos
      await expect(requestService.createRequest({
        title: '',
        description: '',
        maxPrice: -100
      })).rejects.toThrow();
    });
  });

  describe('Cleanup', () => {
    
    it('should clean up test data', async () => {
      // Limpiar ofertas de test
      if (testOfferId) {
        try {
          await offerService.deleteOffer(testOfferId);
        } catch (error) {
          console.warn('Could not delete test offer:', error.message);
        }
      }
      
      // Limpiar solicitudes de test
      if (testRequestId) {
        try {
          await requestService.cancelRequest(testRequestId);
        } catch (error) {
          console.warn('Could not cancel test request:', error.message);
        }
      }
    });
  });
});