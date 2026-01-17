import { API_CONFIG } from '../config/apiConfig';
import { apiClient } from './apiClient';

/**
 * SERVICIO DE PAGOS INTEGRADO CON WOMPI
 * Maneja todo el flujo de pagos del marketplace
 */
class PaymentService {
  
  /**
   * Obtener métodos de pago del usuario
   */
  async getPaymentMethods() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PAYMENTS.GET_METHODS);
      
      return response.data.paymentMethods || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener métodos de pago');
    }
  }

  /**
   * Guardar nuevo método de pago (tarjeta)
   */
  async savePaymentMethod(methodData) {
    try {
      const payload = {
        type: methodData.type,
        cardData: methodData.type === 'card' ? {
          number: methodData.cardNumber,
          exp_month: methodData.expiryMonth,
          exp_year: methodData.expiryYear,
          cvc: methodData.cvc,
          card_holder: methodData.holderName,
        } : null,
      };

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.SAVE_METHOD, payload);
      
      return {
        id: response.data.id,
        type: response.data.type,
        lastFour: response.data.lastFour,
        brand: response.data.brand,
        expiryMonth: response.data.expiryMonth,
        expiryYear: response.data.expiryYear,
        isDefault: response.data.isDefault || false,
      };
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw new Error(error.response?.data?.message || 'Error al guardar método de pago');
    }
  }

  /**
   * Procesar pago principal
   */
  async processPayment(paymentData) {
    try {
      const payload = {
        amount_in_cents: paymentData.amount * 100, // Wompi requiere centavos
        currency: paymentData.currency || 'COP',
        customer_email: paymentData.customerEmail,
        payment_method_id: paymentData.paymentMethodId,
        reference: `REQ-${paymentData.requestId}-${Date.now()}`,
        description: paymentData.description,
        metadata: {
          request_id: paymentData.requestId,
          customer_id: paymentData.customerId,
          provider_id: paymentData.providerId,
        },
        // Datos para integración con Wompi
        redirect_url: API_CONFIG.PAYMENT_REDIRECT_URL,
        acceptance_token: await this.getAcceptanceToken(),
      };

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.PROCESS, payload);
      
      return {
        status: response.data.status,
        transactionId: response.data.id,
        reference: response.data.reference,
        paymentUrl: response.data.payment_link_url,
        message: this.getStatusMessage(response.data.status),
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(error.response?.data?.message || 'Error al procesar el pago');
    }
  }

  /**
   * Obtener token de aceptación de Wompi
   */
  async getAcceptanceToken() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PAYMENTS.ACCEPTANCE_TOKEN);
      return response.data.acceptance_token;
    } catch (error) {
      console.error('Error getting acceptance token:', error);
      // Retornar token por defecto si hay error
      return null;
    }
  }

  /**
   * Verificar estado de transacción
   */
  async getTransactionStatus(transactionId) {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PAYMENTS.TRANSACTION_STATUS}/${transactionId}`
      );
      
      return {
        status: response.data.status,
        statusMessage: this.getStatusMessage(response.data.status),
        amount: response.data.amount_in_cents / 100,
        currency: response.data.currency,
        createdAt: response.data.created_at,
        finishedAt: response.data.finished_at,
        reference: response.data.reference,
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw new Error('Error al verificar estado de transacción');
    }
  }

  /**
   * Obtener historial de pagos
   */
  async getPaymentHistory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PAYMENTS.HISTORY}?${params.toString()}`
      );
      
      return {
        payments: response.data.payments.map(this.transformPaymentData),
        pagination: {
          page: response.data.page,
          totalPages: response.data.totalPages,
          totalItems: response.data.totalItems,
        },
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error('Error al obtener historial de pagos');
    }
  }

  /**
   * Solicitar reembolso
   */
  async requestRefund(transactionId, reason, amount = null) {
    try {
      const payload = {
        transaction_id: transactionId,
        reason: reason,
        amount_in_cents: amount ? amount * 100 : null, // Reembolso parcial si se especifica
      };

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.REFUND, payload);
      
      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount_in_cents / 100,
        message: 'Solicitud de reembolso enviada exitosamente',
      };
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw new Error(error.response?.data?.message || 'Error al solicitar reembolso');
    }
  }

  /**
   * Eliminar método de pago
   */
  async removePaymentMethod(methodId) {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.PAYMENTS.REMOVE_METHOD}/${methodId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error('Error al eliminar método de pago');
    }
  }

  /**
   * Establecer método de pago por defecto
   */
  async setDefaultPaymentMethod(methodId) {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.PAYMENTS.SET_DEFAULT}/${methodId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Error al establecer método por defecto');
    }
  }

  /**
   * Obtener configuración de Wompi pública
   */
  async getWompiPublicConfig() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PAYMENTS.WOMPI_CONFIG);
      return {
        publicKey: response.data.publicKey,
        environment: response.data.environment, // 'production' o 'sandbox'
        currency: response.data.currency,
        country: response.data.country,
      };
    } catch (error) {
      console.error('Error getting Wompi config:', error);
      return {
        publicKey: 'pub_test_G4H60xjDNWj2kgCzUJviBNsj5FXTZ0Xy',
        environment: 'sandbox',
        currency: 'COP',
        country: 'CO',
      };
    }
  }

  /**
   * Transformar datos de pago para la UI
   */
  transformPaymentData = (payment) => {
    return {
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount_in_cents / 100,
      currency: payment.currency,
      status: payment.status,
      statusLabel: this.getStatusMessage(payment.status),
      description: payment.description,
      createdAt: payment.created_at,
      finishedAt: payment.finished_at,
      requestId: payment.metadata?.request_id,
      providerName: payment.metadata?.provider_name,
      serviceName: payment.metadata?.service_name,
    };
  };

  /**
   * Obtener mensaje de estado legible
   */
  getStatusMessage(status) {
    const statusMessages = {
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobado',
      'DECLINED': 'Rechazado',
      'VOIDED': 'Anulado',
      'ERROR': 'Error',
      'REFUNDED': 'Reembolsado',
      'PARTIALLY_REFUNDED': 'Reembolso parcial',
    };
    
    return statusMessages[status] || 'Desconocido';
  }

  /**
   * Validar tarjeta de crédito
   */
  validateCard(cardNumber, expiryDate, cvc) {
    const errors = {};

    // Validar número de tarjeta (algoritmo de Luhn)
    if (!this.isValidCardNumber(cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Número de tarjeta inválido';
    }

    // Validar fecha de vencimiento
    if (!this.isValidExpiryDate(expiryDate)) {
      errors.expiry = 'Fecha de vencimiento inválida';
    }

    // Validar CVC
    if (!this.isValidCVC(cvc)) {
      errors.cvc = 'CVC inválido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Algoritmo de Luhn para validar números de tarjeta
   */
  isValidCardNumber(cardNumber) {
    if (!/^\d{13,19}$/.test(cardNumber)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Validar fecha de vencimiento
   */
  isValidExpiryDate(expiry) {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [month, year] = expiry.split('/');
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expMonth < 1 || expMonth > 12) return false;

    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  }

  /**
   * Validar CVC
   */
  isValidCVC(cvc) {
    return /^\d{3,4}$/.test(cvc);
  }

  /**
   * Obtener tipo de tarjeta por el número
   */
  getCardType(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'american_express';
    if (/^6(?:011|5)/.test(number)) return 'discover';
    
    return 'unknown';
  }
}

export const paymentService = new PaymentService();