import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// DEV: apunta al backend local (puerto 8090)
// PROD: cambia a https://api.homecare.works/api
export const API_URL = 'http://192.168.1.17:8090/api';

export const WS_URL = 'ws://192.168.1.17:8090/ws';
export const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
export const API_TIMEOUT = 30000;

// MercadoPago — public key is safe to expose in the frontend
// Switch to production key (APP_PUBLIC_KEY) before going live
export const MP_PUBLIC_KEY =
  Constants.expoConfig?.extra?.mercadopagoPublicKey ||
  'TEST-2fc07872-5703-43d1-bf4d-485d988c3323';
export const PAGE_SIZE = 20;
export const SEARCH_RADIUS_KM = 10;

export async function apiFetch(endpoint, options = {}) {
  try {
    const token = await SecureStore.getItemAsync('token');

    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
    return { ok: true, data };

  } catch (error) {
    console.error(`❌ apiFetch ${endpoint}:`, error.message);
    return { ok: false, error: error.message };
  }
}