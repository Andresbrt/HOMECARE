/**
 * Tests for AuthContext — login, logout, register, token persistence.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────

const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../../src/services/apiClient', () => ({
  __esModule: true,
  default: {
    post: mockPost,
    get: mockGet,
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
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

    // Wait for loadUserFromStorage to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login stores tokens and user in SecureStore', async () => {
    const loginResponse = {
      data: {
        token: 'access-jwt',
        refreshToken: 'refresh-jwt',
        id: 1,
        email: 'test@hc.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'ROLE_CUSTOMER',
        fotoPerfil: null,
        expiresIn: 86400,
      },
    };
    mockPost.mockResolvedValueOnce(loginResponse);

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
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@hc.com',
      password: 'pass123',
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'access-jwt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'refresh-jwt');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('test@hc.com');
  });

  it('logout clears tokens and calls /auth/logout', async () => {
    // Simulate logged-in state: getItemAsync returns stored data
    SecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === 'token') return 'jwt';
      if (key === 'refreshToken') return 'ref';
      if (key === 'user') return JSON.stringify({ id: 1, email: 'test@hc.com', rol: 'ROLE_CUSTOMER' });
      return null;
    });
    // logout endpoint call (best-effort)
    mockPost.mockResolvedValueOnce({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load which should restore user
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('register calls /auth/registro with correct payload', async () => {
    const regResponse = {
      data: {
        token: 'new-access',
        refreshToken: 'new-refresh',
        id: 2,
        email: 'ana@hc.com',
        nombre: 'Ana',
        apellido: 'García',
        rol: 'ROLE_SERVICE_PROVIDER',
        fotoPerfil: null,
        expiresIn: 86400,
      },
    };
    mockPost.mockResolvedValueOnce(regResponse);

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
    expect(mockPost).toHaveBeenCalledWith('/auth/registro', userData);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'new-access');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login returns error object on API failure (does not throw)', async () => {
    mockPost.mockRejectedValueOnce({
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
