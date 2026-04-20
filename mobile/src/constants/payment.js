/**
 * Mercado Pago — Credenciales de pago
 *
 * SEGURIDAD:
 *  - La PUBLIC KEY es segura en el cliente (frontend/mobile).
 *  - El ACCESS TOKEN NUNCA va en código móvil — solo en variables de
 *    entorno del backend (MP_ACCESS_TOKEN en Railway/.env).
 *  - Para producción, actualiza mpSandbox=false en app.json extra y
 *    reemplaza MP_PUBLIC_KEY con la clave real de producción.
 *    Credenciales en: https://www.mercadopago.com.co/developers/panel
 */
import Constants from 'expo-constants';

const _cfg = Constants.expoConfig?.extra ?? {};

// true  = Sandbox / testing  |  false = Producción real
export const MP_SANDBOX =
  _cfg.mpSandbox !== undefined
    ? Boolean(_cfg.mpSandbox)
    : process.env.EXPO_PUBLIC_MP_SANDBOX === 'true';

// Public Key — sandbox si MP_SANDBOX, producción si no
export const MERCADOPAGO_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_MP_PUBLIC_KEY ??
  (MP_SANDBOX
    ? 'TEST-2fc07872-5703-43d1-bf4d-485d988c3323'
    : 'APP_USR-REEMPLAZAR_CON_CLAVE_PRODUCCION');

// Moneda Colombia: Pesos Colombianos (COP)
export const MP_CURRENCY = 'COP';

// Slugs de URL de retorno (deben coincidir con los del backend)
// El backend expone: GET /api/payments/subscription/{success|failure|pending}
// El WebView intercepta estos paths antes de cargarlos.
export const MP_CALLBACK_SLUGS = {
  success: '/payments/subscription/success',
  failure: '/payments/subscription/failure',
  pending: '/payments/subscription/pending',
};

// ── Precio en COP + IVA 19% - Colombia ──────────────────────────────────────
// Plan único: Suscripción Premium
// Base: $30.000 COP + IVA 19% ($5.700) = $35.700 COP/mes
export const PLAN_PRECIO_BASE_COP  = 30000;  // Precio antes de IVA
export const IVA_RATE              = 0.19;   // IVA colombiano vigente
export const PLAN_IVA_COP          = 5700;   // 30000 * 0.19
export const PLAN_PRECIO_TOTAL_COP = 35700;  // Precio final que paga el usuario

// Único plan disponible (frontend -> backend PlanType)
export const PLAN_TO_BACKEND = {
  premium: 'PREMIUM',
};

// Precio de referencia para UI (el backend calcula el precio real con IVA)
export const PLAN_PRICES = {
  premium: PLAN_PRECIO_TOTAL_COP,
};

/**
 * TARJETAS DE PRUEBA (SANDBOX)
 * Usar estas tarjetas al probar el checkout en el WebView.
 * NO son válidas en producción.
 *
 * Más info: https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/test/test-cards
 */
export const MP_TEST_CARDS = {
  // Aprobado (cualquier titular ficticio, CVV 3 dígitos, vencimiento futuro)
  approved: {
    number: '4509 9535 6623 3704',  // Visa - APROBADO
    cvv:    '123',
    expiry: '11/25',
    holder: 'APRO',
  },
  // Rechazado por fondos insuficientes
  rejected_funds: {
    number: '5031 7557 3453 0604',  // Mastercard - RECHAZADO
    cvv:    '123',
    expiry: '11/25',
    holder: 'FUND',
  },
  // Pago pendiente / en revisión
  pending: {
    number: '4000 0000 0000 0002',  // Visa - PENDIENTE
    cvv:    '123',
    expiry: '11/25',
    holder: 'CONT',
  },
};