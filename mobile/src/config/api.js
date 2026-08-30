import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

// ─── URLs — resueltas desde app.json extra (dev/prod) ────────────────────────
// En producción Railway usa: https://homecare-backend.up.railway.app/api
// En desarrollo local, Expo Go no puede usar localhost del teléfono; se deriva la IP
// de la máquina desde el host del bundle y se usa el puerto del backend local.
const _cfg = Constants.expoConfig?.extra ?? {};

export function resolveDevUrlsFromHost(hostUri) {
  if (!hostUri) return null;

  const normalizedHost = hostUri
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0];

  if (!normalizedHost || ['localhost', '127.0.0.1', '0.0.0.0'].includes(normalizedHost)) {
    return null;
  }

  return {
    apiUrl: `http://${normalizedHost}:8090/api`,
    wsUrl: `ws://${normalizedHost}:8090/ws`,
  };
}

const devUrls = resolveDevUrlsFromHost(Constants.expoConfig?.hostUri ?? Constants.expoConfig?.debuggerHost);

export const API_URL =
  _cfg.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  devUrls?.apiUrl ??
  'https://homecare-backend.fly.dev/api';

export const WS_URL =
  _cfg.wsUrl ??
  process.env.EXPO_PUBLIC_WS_URL ??
  devUrls?.wsUrl ??
  'wss://homecare-backend.fly.dev/ws';

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