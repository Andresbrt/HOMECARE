import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || 'http://192.168.1.20:8083/api';

export const WS_URL = Constants.expoConfig?.extra?.wsUrl 
  || 'http://192.168.1.20:8083/ws';

export const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
export const API_TIMEOUT = 30000;
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