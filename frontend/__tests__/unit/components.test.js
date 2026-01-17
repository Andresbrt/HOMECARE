import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../src/context/AuthContext';
import ServiceDetailsScreen from '../../src/screens/client/ServiceDetailsScreen';
import PaymentScreen from '../../src/screens/client/PaymentScreen';
import { requestService } from '../../src/services/requestService';
import { offerService } from '../../src/services/offerService';

/**
 * TESTS UNITARIOS DE COMPONENTES
 * Pruebas aisladas de componentes individuales
 */

// Mock de servicios
jest.mock('../../src/services/requestService');
jest.mock('../../src/services/offerService');
jest.mock('../../src/services/paymentService');

// Mock de navegación
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
};

const mockRoute = {
  params: {
    requestId: 'test-request-123',
    amount: 75000,
    providerName: 'Test Provider'
  }
};

// Mock de contexto de autenticación
const mockAuthContext = {
  user: {
    id: 'test-user-123',
    email: 'test@homecare.com',
    role: 'CUSTOMER'
  },
  isAuthenticated: true,
  token: 'test-token-123'
};

const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    {children}
  </AuthContext.Provider>
);

describe('ServiceDetailsScreen', () => {
  
  const mockRequestData = {
    id: 'test-request-123',
    title: 'Test Cleaning Service',
    description: 'Test description',
    status: 'CON_OFERTAS',
    statusLabel: 'Con Ofertas',
    cleaningTypeLabel: 'Básica',
    address: 'Test Address 123',
    serviceDate: '2024-01-20',
    startTime: '10:00',
    duration: 3,
    maxPrice: 80000,
    contactPhone: '+57 300 123 4567'
  };

  const mockOffers = [
    {
      id: 'offer-1',
      providerName: 'Juan Pérez',
      providerRating: 4.8,
      price: 75000,
      serviceDate: '2024-01-20',
      startTime: '10:00',
      message: 'Tengo experiencia en limpieza',
      status: 'PENDIENTE',
      statusLabel: 'Pendiente'
    }
  ];

  beforeEach(() => {
    requestService.getRequestById.mockResolvedValue(mockRequestData);
    offerService.getOffersByRequest.mockResolvedValue({ offers: mockOffers });
    offerService.acceptOffer.mockResolvedValue({ success: true });
    offerService.rejectOffer.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render request details correctly', async () => {
    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Test Cleaning Service')).toBeTruthy();
      expect(getByText('Test description')).toBeTruthy();
      expect(getByText('Con Ofertas')).toBeTruthy();
      expect(getByText('Test Address 123')).toBeTruthy();
    });
  });

  it('should show offers received', async () => {
    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Juan Pérez')).toBeTruthy();
      expect(getByText('$75,000')).toBeTruthy();
      expect(getByText('Tengo experiencia en limpieza')).toBeTruthy();
    });
  });

  it('should handle offer acceptance', async () => {
    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      const acceptButton = getByText('Aceptar');
      fireEvent.press(acceptButton);
    });

    // Confirmar en el alert
    await waitFor(() => {
      const confirmButton = getByText('Aceptar');
      fireEvent.press(confirmButton);
    });

    expect(offerService.acceptOffer).toHaveBeenCalledWith('offer-1');
  });

  it('should handle offer rejection', async () => {
    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      const rejectButton = getByText('Rechazar');
      fireEvent.press(rejectButton);
    });

    // Confirmar en el alert
    await waitFor(() => {
      const confirmButton = getByText('Rechazar');
      fireEvent.press(confirmButton);
    });

    expect(offerService.rejectOffer).toHaveBeenCalledWith('offer-1');
  });

  it('should show empty state when no offers', async () => {
    offerService.getOffersByRequest.mockResolvedValue({ offers: [] });

    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Sin ofertas aún')).toBeTruthy();
      expect(getByText('Los proveedores podrán enviarte ofertas para tu solicitud')).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    requestService.getRequestById.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    expect(getByText('Cargando...')).toBeTruthy();
  });

  it('should handle error state', async () => {
    requestService.getRequestById.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});

describe('PaymentScreen', () => {
  
  const mockPaymentMethods = [
    {
      id: 'pm-1',
      type: 'card',
      lastFour: '4242',
      brand: 'visa',
      expiryMonth: '12',
      expiryYear: '2025'
    }
  ];

  beforeEach(() => {
    require('../../src/services/paymentService').paymentService.getPaymentMethods.mockResolvedValue(mockPaymentMethods);
    require('../../src/services/paymentService').paymentService.processPayment.mockResolvedValue({
      status: 'APPROVED',
      transactionId: 'txn-123'
    });
  });

  it('should render payment summary correctly', async () => {
    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Resumen del Pago')).toBeTruthy();
      expect(getByText('Test Provider')).toBeTruthy();
      expect(getByText('$75,000')).toBeTruthy();
    });
  });

  it('should show saved payment methods', async () => {
    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('**** **** **** 4242')).toBeTruthy();
      expect(getByText('visa • Vence 12/2025')).toBeTruthy();
    });
  });

  it('should handle payment processing', async () => {
    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      const payButton = getByText('Pagar $75,000');
      fireEvent.press(payButton);
    });

    // Confirmar pago
    await waitFor(() => {
      const confirmButton = getByText('Pagar');
      fireEvent.press(confirmButton);
    });

    expect(require('../../src/services/paymentService').paymentService.processPayment).toHaveBeenCalled();
  });

  it('should show add card modal', async () => {
    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      const addButton = getByText('Agregar');
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(getByText('Agregar Tarjeta')).toBeTruthy();
      expect(getByText('Número de tarjeta')).toBeTruthy();
    });
  });

  it('should validate card form inputs', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    // Abrir modal
    await waitFor(() => {
      const addButton = getByText('Agregar');
      fireEvent.press(addButton);
    });

    // Intentar guardar sin llenar campos
    await waitFor(() => {
      const saveButton = getByText('Guardar Tarjeta');
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(getByText('Por favor completa todos los campos')).toBeTruthy();
    });
  });

  it('should handle empty payment methods state', async () => {
    require('../../src/services/paymentService').paymentService.getPaymentMethods.mockResolvedValue([]);

    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Sin métodos de pago')).toBeTruthy();
      expect(getByText('Agrega una tarjeta para continuar con el pago')).toBeTruthy();
    });
  });

  it('should show payment processing state', async () => {
    require('../../src/services/paymentService').paymentService.processPayment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ status: 'APPROVED' }), 2000))
    );

    const { getByText } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      const payButton = getByText('Pagar $75,000');
      fireEvent.press(payButton);
    });

    await waitFor(() => {
      const confirmButton = getByText('Pagar');
      fireEvent.press(confirmButton);
    });

    await waitFor(() => {
      expect(getByText('Procesando tu pago...')).toBeTruthy();
      expect(getByText('Por favor no cierres la aplicación')).toBeTruthy();
    });
  });
});

describe('Component Accessibility', () => {
  
  it('should have proper accessibility labels', async () => {
    const { getByLabelText } = render(
      <AuthProvider>
        <ServiceDetailsScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      // Verificar que los elementos importantes tengan labels
      expect(getByLabelText('Aceptar oferta')).toBeTruthy();
      expect(getByLabelText('Rechazar oferta')).toBeTruthy();
    });
  });

  it('should be navigable with screen readers', async () => {
    const { getByA11yRole } = render(
      <AuthProvider>
        <PaymentScreen navigation={mockNavigation} route={mockRoute} />
      </AuthProvider>
    );

    await waitFor(() => {
      // Verificar roles de accesibilidad
      expect(getByA11yRole('button')).toBeTruthy();
    });
  });
});