import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

// ─── URLs — resueltas desde app.json extra (dev/prod) ────────────────────────
// En producción Railway usa: https://homecare-backend.up.railway.app/api
// Para desarrollo local sobreescribe apiUrl en app.json extra.
const _cfg = Constants.expoConfig?.extra ?? {};

export const API_URL =
  _cfg.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://homecare-backend.up.railway.app/api';

export const WS_URL =
  _cfg.wsUrl ??
  process.env.EXPO_PUBLIC_WS_URL ??
  'wss://homecare-backend.up.railway.app/ws';

export const GOOGLE_CLIENT_ID = _cfg.googleClientId ?? '';
export const API_TIMEOUT = 30000;

// MercadoPago public key — usa MERCADOPAGO_PUBLIC_KEY de constants/payment.js
// No se duplica aquí: la key canónica está en src/constants/payment.js
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
    __DEV_LOG__(`❌ apiFetch ${endpoint}:`, error.message);
    return { ok: false, error: error.message };
  }
}