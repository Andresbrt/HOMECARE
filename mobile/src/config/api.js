/**
 * API Configuration
 */

import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080/api';
export const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'http://localhost:8080/ws';
export const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';

// Timeout de requests
export const API_TIMEOUT = 30000;

// Configuración de paginación
export const PAGE_SIZE = 20;

// Radio de búsqueda en km
export const SEARCH_RADIUS_KM = 10;

export default {
  API_URL,
  WS_URL,
  GOOGLE_CLIENT_ID,
  API_TIMEOUT,
  PAGE_SIZE,
  SEARCH_RADIUS_KM,
};
