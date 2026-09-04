import {
  createSubscriptionCheckout,
  getMySubscription,
  getSubscriptionPlans,
} from '../../src/services/paymentService';
import { apiFetch } from '../../src/config/api';

jest.mock('../../src/config/api', () => ({
  apiFetch: jest.fn(),
}));

describe('paymentService — Integración de Mercado Pago y Suscripciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscriptionCheckout', () => {
    it('debe enviar POST a /subscriptions/checkout con el plan solicitado', async () => {
      const mockResponse = {
        ok: true,
        data: {
          initPoint: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=123',
          preferenceId: '123456789-abcdef',
          plan: 'pro',
          monto: 30000,
          moneda: 'COP',
        },
      };
      apiFetch.mockResolvedValueOnce(mockResponse);

      const result = await createSubscriptionCheckout('pro');

      expect(apiFetch).toHaveBeenCalledWith('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro' }),
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.preferenceId).toBe('123456789-abcdef');
    });

    it('debe propagar errores si el backend rechaza la creación de preferencia', async () => {
      const mockError = { ok: false, error: 'Usuario no autenticado' };
      apiFetch.mockResolvedValueOnce(mockError);

      const result = await createSubscriptionCheckout('premium');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
    });
  });

  describe('getMySubscription', () => {
    it('debe consultar GET a /subscriptions/me', async () => {
      const mockSub = {
        ok: true,
        data: {
          plan: 'pro',
          estado: 'ACTIVE',
          fechaFin: '2026-10-01T00:00:00Z',
        },
      };
      apiFetch.mockResolvedValueOnce(mockSub);

      const result = await getMySubscription();

      expect(apiFetch).toHaveBeenCalledWith('/subscriptions/me');
      expect(result.ok).toBe(true);
      expect(result.data.plan).toBe('pro');
    });
  });

  describe('getSubscriptionPlans', () => {
    it('debe obtener la lista de planes oficiales disponibles', async () => {
      const mockPlans = {
        ok: true,
        data: [
          { plan: 'basic', precio: 0, features: ['Comisión 10%'] },
          { plan: 'pro', precio: 30000, features: ['Comisión 0%', 'Visibilidad +5%'] },
          { plan: 'elite', precio: 60000, features: ['Comisión 0%', 'Visibilidad +10%'] },
        ],
      };
      apiFetch.mockResolvedValueOnce(mockPlans);

      const result = await getSubscriptionPlans();

      expect(apiFetch).toHaveBeenCalledWith('/subscriptions/plans');
      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(3);
    });
  });
});
