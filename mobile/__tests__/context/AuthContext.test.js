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

jest.mock('../../src/services/authService', () => ({
  authService: {
    login: (...args) => mockLogin(...args),
    register: (...args) => mockRegister(...args),
    logout: (...args) => mockLogout(...args),
    sendOTP: (...args) => mockSendOTP(...args),
  },
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
  });

  it('starts with user=null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login stores tokens and updates user state', async () => {
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

  it('logout clears tokens and user state', async () => {
    SecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === 'token') return 'jwt';
      if (key === 'refreshToken') return 'ref';
      if (key === 'user') return JSON.stringify({ id: 1, email: 'test@hc.com', rol: 'ROLE_CUSTOMER' });
      return null;
    });
    mockLogout.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper });

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

  it('register calls authService.register and sendOTP with correct payload', async () => {
    mockRegister.mockResolvedValueOnce({ id: 2, email: 'ana@hc.com' });
    mockSendOTP.mockResolvedValueOnce({ success: true });

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
    expect(registerResult.requiresOTP).toBe(true);
    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ana@hc.com',
      nombre: 'Ana',
    }));
    expect(mockSendOTP).toHaveBeenCalledWith('ana@hc.com');
  });

  it('login returns error object on API failure (does not throw)', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));

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
