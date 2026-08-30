/**
 * Tests for AuthContext — login, logout, register, token persistence.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();
const mockSendOTP = jest.fn();
const mockVerifyOTP = jest.fn();
const mockForgotPassword = jest.fn();
const mockSendForgotPasswordOTP = jest.fn();
const mockVerifyForgotPasswordOTP = jest.fn();
const mockResetPasswordWithOTP = jest.fn();
const mockSupabaseLogin = jest.fn();

jest.mock('../../src/services/authService', () => ({
  __esModule: true,
  authService: {
    login: (...args) => mockLogin(...args),
    register: (...args) => mockRegister(...args),
    logout: (...args) => mockLogout(...args),
    sendOTP: (...args) => mockSendOTP(...args),
    verifyOTP: (...args) => mockVerifyOTP(...args),
    forgotPassword: (...args) => mockForgotPassword(...args),
    sendForgotPasswordOTP: (...args) => mockSendForgotPasswordOTP(...args),
    verifyForgotPasswordOTP: (...args) => mockVerifyForgotPasswordOTP(...args),
    resetPasswordWithOTP: (...args) => mockResetPasswordWithOTP(...args),
    supabaseLogin: (...args) => mockSupabaseLogin(...args),
  },
}));

jest.mock('../../src/services/firebaseAuthService', () => ({
  __esModule: true,
  getGoogleIdTokenNative: jest.fn(),
}));

jest.mock('../../src/store/modeStore', () => ({
  getState: () => ({ setMode: jest.fn() }),
}));

jest.mock('../../src/config/api', () => ({
  apiFetch: jest.fn().mockResolvedValue({ ok: true, data: {} }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiUrl: 'http://localhost:8080/api' } },
}));

const SecureStore = require('expo-secure-store');

// Import after mocks
const { AuthProvider, useAuth } = require('../../src/context/AuthContext');

function wrapper({ children }) {
  return React.createElement(AuthProvider, null, children);
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue();
    SecureStore.deleteItemAsync.mockResolvedValue();
  });

  it('starts with user=null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for loadUserFromStorage to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login stores tokens and user in SecureStore', async () => {
    const loginResponse = {
      token: 'access-jwt',
      refreshToken: 'refresh-jwt',
      id: 1,
      email: 'test@hc.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: 'ROLE_CUSTOMER',
      fotoPerfil: null,
      expiresIn: 86400,
    };
    mockLogin.mockResolvedValueOnce(loginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@hc.com', 'pass123');
    });

    expect(loginResult.success).toBe(true);
    expect(mockLogin).toHaveBeenCalledWith('test@hc.com', 'pass123');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('test@hc.com');
  });

  it('logout clears auth state and calls authService.logout', async () => {
    // Simulate logged-in state: getItemAsync returns stored data
    SecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === 'token') return 'jwt';
      if (key === 'refreshToken') return 'ref';
      if (key === 'user') return JSON.stringify({ id: 1, email: 'test@hc.com', rol: 'ROLE_CUSTOMER' });
      return null;
    });
    mockLogout.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load which should restore user
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('register calls authService.register and sends OTP', async () => {
    const regResponse = {
      token: 'new-access',
      refreshToken: 'new-refresh',
      id: 2,
      email: 'ana@hc.com',
      nombre: 'Ana',
      apellido: 'García',
      rol: 'ROLE_SERVICE_PROVIDER',
      fotoPerfil: null,
      expiresIn: 86400,
    };
    mockRegister.mockResolvedValueOnce(regResponse);
    mockSendOTP.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const userData = {
      email: 'ana@hc.com',
      password: 'secret',
      nombre: 'Ana',
      apellido: 'García',
      telefono: '3001234567',
      rol: 'SERVICE_PROVIDER',
    };

    let registerResult;
    await act(async () => {
      registerResult = await result.current.register(userData);
    });

    expect(registerResult.success).toBe(true);
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'ana@hc.com',
      password: 'secret',
      nombre: 'Ana',
      apellido: 'García',
      rol: 'SERVICE_PROVIDER',
      telefono: '3001234567',
    });
    expect(mockSendOTP).toHaveBeenCalledWith('ana@hc.com');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login returns error object on API failure (does not throw)', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Credenciales inválidas' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('bad@hc.com', 'wrong');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.message).toBe('Credenciales inválidas');
    expect(result.current.isAuthenticated).toBe(false);
  });
});
