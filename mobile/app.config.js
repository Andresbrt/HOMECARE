/**
 * app.config.js — Configuración dinámica de Expo
 *
 * Permite sobrescribir valores de app.json en tiempo de build
 * mediante variables de entorno (CI/CD o .env.local).
 *
 * Vars soportadas:
 *   EXPO_PUBLIC_API_URL       → URL del backend
 *   EXPO_PUBLIC_WS_URL        → URL WebSocket
 *   EXPO_PUBLIC_MP_SANDBOX    → "true" | "false"
 *   EXPO_PUBLIC_MP_KEY_PROD   → Clave MercadoPago producción (APP_USR-...)
 */

export default ({ config }) => {
  const mpSandboxEnv = process.env.EXPO_PUBLIC_MP_SANDBOX;
  const isSandbox =
    mpSandboxEnv !== undefined
      ? mpSandboxEnv === 'true'
      : config.extra?.mpSandbox ?? false;

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        config.extra?.apiUrl ||
        'https://homecare-backend.up.railway.app/api',
      wsUrl:
        process.env.EXPO_PUBLIC_WS_URL ||
        config.extra?.wsUrl ||
        'wss://homecare-backend.up.railway.app/ws',
      mpSandbox: isSandbox,
      mpKeyProd: process.env.EXPO_PUBLIC_MP_KEY_PROD || null,
      eas: {
        projectId: 'homecare-1582c',
      },
    },
  };
};
