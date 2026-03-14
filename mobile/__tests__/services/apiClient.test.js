/**
 * Tests for apiClient interceptors (request token attach, 401 refresh).
 *
 * Strategy: We mock expo-secure-store and test the interceptor behavior
 * via the exported axios instance.  The interceptors run automatically
 * on any request/response.
 */

import axios from 'axios';

// ── Mocks ─────────────────────────────────────────────

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiUrl: 'http://test-api:8080/api' } },
}));

// We need to mock axios.create AND also axios.post (used for refresh)
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };

  const mockCreate = jest.fn(() => mockAxiosInstance);

  return {
    __esModule: true,
    default: {
      create: mockCreate,
      post: jest.fn(),
    },
  };
});

const SecureStore = require('expo-secure-store');

describe('apiClient module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create axios instance with correct baseURL', () => {
    // Re-require to trigger module initialization
    jest.isolateModules(() => {
      require('../../src/services/apiClient');
    });

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://test-api:8080/api',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should register request and response interceptors', () => {
    let instance;
    jest.isolateModules(() => {
      instance = require('../../src/services/apiClient').default;
    });

    expect(instance.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(instance.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  describe('request interceptor', () => {
    let requestFulfilled;

    beforeEach(() => {
      jest.isolateModules(() => {
        require('../../src/services/apiClient');
      });
      // Grab the fulfilled callback passed to interceptors.request.use
      const instance = axios.create.mock.results[0].value;
      requestFulfilled = instance.interceptors.request.use.mock.calls[0][0];
    });

    it('attaches Bearer token when token exists', async () => {
      SecureStore.getItemAsync.mockResolvedValue('my-jwt-token');

      const config = { headers: {} };
      const result = await requestFulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does not attach Authorization header when no token', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const config = { headers: {} };
      const result = await requestFulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor (401 refresh)', () => {
    let responseRejected;

    beforeEach(() => {
      jest.isolateModules(() => {
        require('../../src/services/apiClient');
      });
      const instance = axios.create.mock.results[0].value;
      responseRejected = instance.interceptors.response.use.mock.calls[0][1];
    });

    it('rejects non-401 errors without refresh attempt', async () => {
      const error = {
        response: { status: 500 },
        config: { _retry: false, url: '/api/users' },
      };

      await expect(responseRejected(error)).rejects.toBe(error);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('rejects 401 on auth endpoints without refresh attempt', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false, url: '/auth/login' },
      };

      await expect(responseRejected(error)).rejects.toBe(error);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('clears tokens when refresh fails', async () => {
      SecureStore.getItemAsync.mockResolvedValue('old-refresh');
      axios.post.mockRejectedValue(new Error('refresh failed'));

      const error = {
        response: { status: 401 },
        config: { _retry: false, headers: {}, url: '/api/users' },
      };

      await expect(responseRejected(error)).rejects.toThrow('refresh failed');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
    });
  });
});
