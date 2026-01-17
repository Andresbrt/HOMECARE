import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * CONFIGURACIÓN API HOMECARE BACKEND
 * Conecta con Spring Boot Backend con autenticación JWT
 */

// Configuración base de la API
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:8080/api'  // Android emulator
    : 'https://api.homecare.com/api',  // Production
  
  TIMEOUT: 30000, // 30 segundos
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints principales
  ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/registro',
      REFRESH: '/auth/refresh',
      CHANGE_PASSWORD: '/auth/change-password',
      RESET_PASSWORD: '/auth/reset-password',
      LOGOUT: '/auth/logout',
    },
    
    // Usuarios
    USERS: {
      ME: '/usuarios/me',
      UPDATE_PROFILE: '/usuarios/me',
      UPDATE_LOCATION: '/usuarios/ubicacion',
      AVAILABILITY: '/usuarios/disponibilidad',
      STATISTICS: '/usuarios/estadisticas',
      PUBLIC_PROFILE: (userId) => `/usuarios/${userId}`,
    },
    
    // Solicitudes (modelo inDriver)
    REQUESTS: {
      CREATE: '/solicitudes',
      UPDATE: (requestId) => `/solicitudes/${requestId}`,
      DELETE: (requestId) => `/solicitudes/${requestId}`,
      GET: (requestId) => `/solicitudes/${requestId}`,
      MY_REQUESTS: '/solicitudes/mis-solicitudes',
      NEARBY: '/solicitudes/cercanas',
      SEARCH: '/solicitudes/buscar',
      ACTIVE: '/solicitudes/activas',
    },
    
    // Ofertas (proveedores responden a solicitudes)
    OFFERS: {
      CREATE: '/ofertas',
      GET: (offerId) => `/ofertas/${offerId}`,
      MY_OFFERS: '/ofertas/mis-ofertas',
      ACCEPT: (offerId) => `/ofertas/${offerId}/aceptar`,
      REJECT: (offerId) => `/ofertas/${offerId}/rechazar`,
      BY_REQUEST: (requestId) => `/ofertas/solicitud/${requestId}`,
    },
    
    // Servicios activos
    SERVICES: {
      ACTIVE: '/servicios/activos',
      START: (serviceId) => `/servicios/${serviceId}/iniciar`,
      COMPLETE: (serviceId) => `/servicios/${serviceId}/completar`,
      CANCEL: (serviceId) => `/servicios/${serviceId}/cancelar`,
      GET: (serviceId) => `/servicios/${serviceId}`,
      HISTORY: '/servicios/historial',
      PROVIDER_ACTIVE: '/servicios/proveedor/activos',
    },
    
    // Calificaciones
    RATINGS: {
      CREATE: '/calificaciones',
      GET: (ratingId) => `/calificaciones/${ratingId}`,
      BY_USER: (userId) => `/calificaciones/usuario/${userId}`,
      BY_SERVICE: (serviceId) => `/calificaciones/servicio/${serviceId}`,
    },
    
    // Mensajes/Chat
    MESSAGES: {
      SEND: '/mensajes',
      GET_CONVERSATION: (serviceId) => `/mensajes/conversacion/${serviceId}`,
      GET_CONVERSATIONS: '/mensajes/conversaciones',
      MARK_READ: (messageId) => `/mensajes/${messageId}/leer`,
    },
    
    // Tracking/Ubicación
    TRACKING: {
      UPDATE_LOCATION: '/tracking/ubicacion',
      GET_LOCATION: (serviceId) => `/tracking/servicio/${serviceId}`,
      START_TRACKING: (serviceId) => `/tracking/${serviceId}/iniciar`,
      STOP_TRACKING: (serviceId) => `/tracking/${serviceId}/detener`,
      CONFIG: '/tracking/config',
    },
    
    // Pagos
    PAYMENTS: {
      PROCESS: '/payments/process',
      HISTORY: '/payments/history',
      GET_METHODS: '/payments/methods',
      SAVE_METHOD: '/payments/methods',
      REMOVE_METHOD: '/payments/methods',
      SET_DEFAULT: '/payments/methods/default',
      ACCEPTANCE_TOKEN: '/payments/acceptance-token',
      TRANSACTION_STATUS: '/payments/transactions',
      REFUND: '/payments/refund',
      WOMPI_CONFIG: '/payments/wompi/config',
      WOMPI_WEBHOOK: '/payments/wompi/webhook',
    },
    
    // Notificaciones
    NOTIFICATIONS: {
      GET_ALL: '/notifications',
      MARK_READ: (notificationId) => `/notifications/${notificationId}/read`,
      MARK_ALL_READ: '/notifications/mark-all-read',
      REGISTER_FCM: '/notifications/fcm/register',
      UNREGISTER_FCM: '/notifications/fcm/unregister',
    },
    
    // Archivos
    FILES: {
      UPLOAD: '/files/upload',
      GET: (fileId) => `/files/${fileId}`,
      DELETE: (fileId) => `/files/${fileId}`,
    },
    
    // Promociones y cupones
    PROMOTIONS: {
      GET_AVAILABLE: '/promotions/available',
      GET: (promotionId) => `/promotions/${promotionId}`,
      VALIDATE_COUPON: '/promotions/validate-coupon',
    },
    
    // Analytics y reportes
    ANALYTICS: {
      DASHBOARD: '/analytics/dashboard',
      EARNINGS: '/analytics/earnings',
      PERFORMANCE: '/analytics/performance',
    },
    
    // Salud del sistema
    HEALTH: {
      CHECK: '/health',
      DATABASE: '/health/database',
      EXTERNAL: '/health/external',
    },
    
    // Administración
    ADMIN: {
      // Gestión de usuarios
      USERS: {
        GET_ALL: '/admin/users',
        GET: (userId) => `/admin/users/${userId}`,
        SUSPEND: (userId) => `/admin/users/${userId}/suspend`,
        ACTIVATE: (userId) => `/admin/users/${userId}/activate`,
        DELETE: (userId) => `/admin/users/${userId}`,
        UPDATE_PROFILE: (userId) => `/admin/users/${userId}/profile`,
        STATISTICS: '/admin/users/statistics',
      },
      
      // Reportes y analíticas
      REPORTS: {
        DASHBOARD: '/admin/reports/dashboard',
        USERS: '/admin/reports/users',
        SERVICES: '/admin/reports/services',
        PAYMENTS: '/admin/reports/payments',
        PERFORMANCE: '/admin/reports/performance',
        EXPORT: '/admin/reports/export',
      },
      
      // Configuraciones del sistema
      SETTINGS: {
        GET: '/admin/settings',
        UPDATE: '/admin/settings',
        RESET: '/admin/settings/reset',
        BACKUP: '/admin/settings/backup',
        RESTORE: '/admin/settings/restore',
      },
    },
  },
};

/**
 * Manejo de tokens JWT
 */
export class TokenManager {
  static ACCESS_TOKEN_KEY = '@homecare_access_token';
  static REFRESH_TOKEN_KEY = '@homecare_refresh_token';
  static USER_DATA_KEY = '@homecare_user_data';

  static async getAccessToken() {
    try {
      return await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static async setTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  }

  static async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        this.ACCESS_TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_DATA_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async setUserData(userData) {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }
}

/**
 * Tipos de usuario según el backend
 */
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  ADMIN: 'ADMIN',
};

/**
 * Estados de solicitud según el backend
 */
export const REQUEST_STATES = {
  ABIERTA: 'ABIERTA',
  CON_OFERTAS: 'CON_OFERTAS', 
  OFERTA_ACEPTADA: 'OFERTA_ACEPTADA',
  EN_PROGRESO: 'EN_PROGRESO',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  EXPIRADA: 'EXPIRADA',
};

/**
 * Tipos de limpieza según el backend
 */
export const CLEANING_TYPES = {
  BASICA: 'BASICA',
  PROFUNDA: 'PROFUNDA',
  OFICINA: 'OFICINA',
  POST_CONSTRUCCION: 'POST_CONSTRUCCION',
  MANTENIMIENTO: 'MANTENIMIENTO',
  ESPECIALIZADA: 'ESPECIALIZADA',
};

/**
 * Estados de ofertas
 */
export const OFFER_STATES = {
  ENVIADA: 'ENVIADA',
  VISTA: 'VISTA',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  EXPIRADA: 'EXPIRADA',
};

/**
 * Estados de servicio activo
 */
export const SERVICE_STATES = {
  PROGRAMADO: 'PROGRAMADO',
  EN_CAMINO: 'EN_CAMINO',
  EN_PROGRESO: 'EN_PROGRESO',
  PAUSADO: 'PAUSADO',
  COMPLETADO: 'COMPLETADO',
  CANCELADO: 'CANCELADO',
};

/**
 * Configuración de WebSocket para tracking en tiempo real
 */
export const WEBSOCKET_CONFIG = {
  URL: __DEV__ 
    ? 'ws://10.0.2.2:8080/ws'
    : 'wss://api.homecare.com/ws',
  
  TOPICS: {
    LOCATION_UPDATE: '/topic/location/',
    SERVICE_UPDATE: '/topic/service/',
    NOTIFICATION: '/topic/notification/',
    CHAT: '/topic/chat/',
  },
  
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 10,
};

/**
 * Configuración de pagos
 */
export const PAYMENT_CONFIG = {
  CURRENCY: 'COP',
  COUNTRY: 'CO',
  REDIRECT_URL: 'com.homecare://payment/callback',
  WOMPI: {
    SANDBOX_PUBLIC_KEY: 'pub_test_G4H60xjDNWj2kgCzUJviBNsj5FXTZ0Xy',
    PRODUCTION_PUBLIC_KEY: '', // Completar con la llave real de producción
    ENVIRONMENT: __DEV__ ? 'sandbox' : 'production',
  }
};

// URLs de redirección para pagos
API_CONFIG.PAYMENT_REDIRECT_URL = PAYMENT_CONFIG.REDIRECT_URL;

export default API_CONFIG;