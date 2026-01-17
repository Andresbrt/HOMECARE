import { API_CONFIG, TokenManager } from '../config/apiConfig';

/**
 * CLIENTE HTTP PRINCIPAL
 * Maneja todas las comunicaciones con el backend Spring Boot
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Headers con autenticación JWT
   */
  async getHeaders(includeAuth = true) {
    const headers = { ...API_CONFIG.DEFAULT_HEADERS };
    
    if (includeAuth) {
      const token = await TokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Método base para requests HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(options.includeAuth !== false);
    
    const config = {
      method: 'GET',
      headers,
      timeout: this.timeout,
      ...options,
    };

    // Serializar body si es objeto
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`API Request: ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      
      // Manejar tokens expirados
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Reintentar request con nuevo token
          const newHeaders = await this.getHeaders(options.includeAuth !== false);
          return await fetch(url, { ...config, headers: newHeaders });
        } else {
          // Redirigir a login
          await TokenManager.clearTokens();
          throw new Error('TOKEN_EXPIRED');
        }
      }

      // Parsear respuesta
      let data;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || data || 'Request failed',
          data
        );
      }

      return data;
      
    } catch (error) {
      console.error(`API Error: ${config.method} ${url}`, error);
      
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(0, error.message || 'Network error', error);
    }
  }

  /**
   * Métodos HTTP específicos
   */
  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload de archivos
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    
    // Agregar archivo
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });

    // Agregar datos adicionales
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = await this.getHeaders();
    delete headers['Content-Type']; // Dejar que fetch maneje el Content-Type para FormData

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }

  /**
   * Refresh token automático
   */
  async refreshToken() {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await TokenManager.setTokens(data.accessToken, data.refreshToken);
        return true;
      }

      return false;
      
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * WebSocket connection helper
   */
  createWebSocket(topic, onMessage, onError = null) {
    const wsUrl = `${API_CONFIG.WEBSOCKET_CONFIG.URL}${topic}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return ws;
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      if (onError) onError(error);
      return null;
    }
  }
}

/**
 * Error personalizado para API
 */
export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.status === 400;
  }
}

/**
 * Instancia singleton del cliente API
 */
export const apiClient = new ApiClient();
export default apiClient;