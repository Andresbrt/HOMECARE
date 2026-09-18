import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let isSentryInitialized = false;

/**
 * Inicializa Sentry para monitoreo de crashes y excepciones en producción y staging.
 * Si no se encuentra configurado un DSN, opera en modo silencioso sin interrumpir la app.
 */
export function initSentry() {
  if (isSentryInitialized) return;

  const dsn =
    Constants.expoConfig?.extra?.sentryDsn ||
    process.env.EXPO_PUBLIC_SENTRY_DSN ||
    '';

  if (!dsn || dsn.trim() === '') {
    if (__DEV__) {
      console.log('ℹ️ [Sentry] EXPO_PUBLIC_SENTRY_DSN no configurado. Monitoreo remoto en modo mock.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: dsn.trim(),
      debug: false,
      enableInExpoDevelopment: false, // Evita saturar el dashboard en desarrollo local
      tracesSampleRate: 0.2, // Tasa de muestreo de performance (20%)
      environment: __DEV__ ? 'development' : 'production',
      attachStacktrace: true,
      autoSessionTracking: true,
    });

    isSentryInitialized = true;
    console.log('✅ [Sentry] Monitoreo de errores inicializado exitosamente.');
  } catch (err) {
    console.warn('⚠️ [Sentry] Error al inicializar Sentry:', err.message);
  }
}

/**
 * Captura una excepción con contexto adicional.
 */
export function captureException(error, context = {}) {
  if (__DEV__) {
    console.warn('[Sentry captureException]:', error, context);
  }
  if (isSentryInitialized) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Captura un mensaje de evento en Sentry.
 */
export function captureMessage(message, level = 'info') {
  if (__DEV__) {
    console.log(`[Sentry captureMessage (${level})]:`, message);
  }
  if (isSentryInitialized) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Asocia el usuario autenticado al reporte de errores de Sentry.
 */
export function setSentryUser(user) {
  if (!isSentryInitialized || !user) return;

  Sentry.setUser({
    id: String(user.id || user.uid || ''),
    email: user.email || '',
    username: `${user.nombre || ''} ${user.apellido || ''}`.trim() || undefined,
    role: user.rol || user.role || 'USER',
  });
}

/**
 * Limpia el contexto de usuario al cerrar sesión.
 */
export function clearSentryUser() {
  if (!isSentryInitialized) return;
  Sentry.setUser(null);
}

export { Sentry };
export default Sentry;
