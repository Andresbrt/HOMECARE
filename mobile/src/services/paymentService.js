import { apiFetch } from '../config/api';

/**
 * Crea una preferencia de pago Checkout Pro en Mercado Pago para una suscripción.
 *
 * @param {string} plan - ID del plan: 'premium' | 'pro'
 * @returns {Promise<{ ok: boolean, data?: { initPoint: string, preferenceId: string, plan: string, monto: number, moneda: string }, error?: string }>}
 */
export async function createSubscriptionCheckout(plan) {
  return apiFetch('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

/**
 * Obtiene la suscripción activa del usuario autenticado desde el backend.
 * Usar después de un pago aprobado para confirmar que el webhook activó el plan.
 *
 * @returns {Promise<{ ok: boolean, data?: { plan: string, estado: string, fechaFin: string }, error?: string }>}
 */
export async function getMySubscription() {
  return apiFetch('/subscriptions/me');
}

/**
 * Obtiene los planes disponibles desde el backend (con precios oficiales).
 *
 * @returns {Promise<{ ok: boolean, data?: Array<{ plan: string, precio: number, features: string[] }>, error?: string }>}
 */
export async function getSubscriptionPlans() {
  return apiFetch('/subscriptions/plans');
}
