/**
 * levelUtils — Sistema de niveles Homecare 2026 (reset trimestral)
 *
 * Rangos basados en servicios completados en el trimestre actual:
 *   Básico  →  0–15 servicios  · Visibilidad base (100%)
 *   Pro     → 16–35 servicios  · +5% de visibilidad extra
 *   Elite   → 36–70 servicios  · +10% de visibilidad extra (máximo prestigio)
 *
 * El conteo se reinicia cada 3 meses:
 *   Q1 → 1 ene – 31 mar
 *   Q2 → 1 abr – 30 jun
 *   Q3 → 1 jul – 30 sep
 *   Q4 → 1 oct – 31 dic
 *
 * La bonificación de visibilidad se aplica en el algoritmo de asignación de
 * solicitudes: un profesional Elite tiene +10% de probabilidad de ver y recibir
 * solicitudes cercanas frente a uno Básico.
 */

// ─── Texto motivacional global ────────────────────────────────────────────────
export const MOTIVATIONAL_TEXT =
  '¡Con $30.000 puedes ganar entre $160.000 y $200.000 al día realizando servicios con nosotros!';

// ─── Colores canónicos por nivel ──────────────────────────────────────────────
export const LEVEL_COLORS = {
  'Básico': '#9E9E9E',
  'Pro':    '#FFD700',
  'Elite':  '#49C0BC',
};

// ─── Bonificaciones de visibilidad por nivel ──────────────────────────────────
export const VISIBILITY_BONUS = {
  'Básico': 0,
  'Pro':    5,
  'Elite':  10,
};

// ─── Helpers de trimestre ─────────────────────────────────────────────────────

/**
 * Retorna la fecha de inicio del trimestre al que pertenece `date`.
 * @param {Date} date
 * @returns {Date}
 */
export function getQuarterStart(date = new Date()) {
  const m = date.getMonth();          // 0-based
  const quarterMonth = m - (m % 3);  // 0, 3, 6 o 9
  return new Date(date.getFullYear(), quarterMonth, 1);
}

/**
 * Retorna la fecha del último día del trimestre al que pertenece `date`.
 * @param {Date} date
 * @returns {Date}
 */
export function getQuarterEnd(date = new Date()) {
  const start = getQuarterStart(date);
  // Primer día del siguiente trimestre - 1 ms
  return new Date(start.getFullYear(), start.getMonth() + 3, 0);
}

/**
 * Retorna el rango legible del trimestre actual.
 * Ejemplo: "Abril - Junio 2026"
 * @param {Date} date
 * @returns {string}
 */
export function getQuarterLabel(date = new Date()) {
  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const start = getQuarterStart(date);
  const end   = getQuarterEnd(date);
  return `${MESES[start.getMonth()]} - ${MESES[end.getMonth()]} ${start.getFullYear()}`;
}

/**
 * Retorna el número del trimestre (1-4) de `date`.
 * @param {Date} date
 * @returns {number}
 */
export function getQuarterNumber(date = new Date()) {
  return Math.floor(date.getMonth() / 3) + 1;
}

// ─── Cálculo de nivel ─────────────────────────────────────────────────────────

/**
 * Calcula el nivel del profesional basado en servicios del trimestre actual.
 *
 * @param {number} serviciosTrimestre — Servicios completados este trimestre
 * @returns {{
 *   label:           string,        // 'Básico' | 'Pro' | 'Elite'
 *   color:           string,        // color hex canónico del nivel
 *   gradColors:      string[],      // degradado para LinearGradient
 *   icon:            string,        // nombre de Ionicons
 *   progress:        number,        // 0.0–1.0 (dentro del rango del nivel actual)
 *   next:            number|null,   // umbral absoluto del siguiente nivel
 *   nextLabel:       string|null,   // nombre del siguiente nivel
 *   remaining:       number,        // servicios que faltan para el siguiente nivel
 *   visibilityBonus: number,        // % de visibilidad extra (0, 5 o 10)
 *   motivo:          string,        // texto motivacional personalizado
 * }}
 */
export function computeLevel(serviciosTrimestre = 0) {
  const n = Math.max(0, Number(serviciosTrimestre) || 0);

  // ── Elite: 36–70 servicios ──────────────────────────────────────────────────
  if (n >= 36) {
    // Progreso dentro del rango Elite: 0 en 36, 1 en 70
    const progress = Math.min((n - 36) / 34, 1);
    return {
      label:           'Elite',
      color:           '#49C0BC',
      gradColors:      ['#49C0BC', '#2a9d99'],
      icon:            'diamond',
      progress,
      next:            null,
      nextLabel:       null,
      remaining:       0,
      visibilityBonus: 10,
      motivo:          '¡Eres Elite! Tienes +10% de visibilidad ante nuevas solicitudes. Mantén el ritmo.',
    };
  }

  // ── Pro: 16–35 servicios ────────────────────────────────────────────────────
  if (n >= 16) {
    const remaining = 36 - n;
    // Progreso dentro del rango Pro: 0 en 16, 1 en 36
    const progress  = (n - 16) / 20;
    return {
      label:           'Pro',
      color:           '#FFD700',
      gradColors:      ['#FFD700', '#F5A623'],
      icon:            'trophy',
      progress,
      next:            36,
      nextLabel:       'Elite',
      remaining,
      visibilityBonus: 5,
      motivo:          `¡Estás en Pro (+5% visibilidad)! ${remaining} servicio${remaining !== 1 ? 's' : ''} más para Elite y +10%.`,
    };
  }

  // ── Básico: 0–15 servicios ──────────────────────────────────────────────────
  const remaining = 16 - n;
  return {
    label:           'Básico',
    color:           '#9E9E9E',
    gradColors:      ['#9E9E9E', '#757575'],
    icon:            'ribbon',
    // Progreso dentro del rango Básico: 0 en 0, ~0.94 en 15
    progress:        n / 16,
    next:            16,
    nextLabel:       'Pro',
    remaining,
    visibilityBonus: 0,
    motivo:          `Completa ${remaining} servicio${remaining !== 1 ? 's' : ''} más para alcanzar Pro y obtener +5% de visibilidad.`,
  };
}

/**
 * Retorna solo el nombre del siguiente nivel.
 * @param {string} currentLabel
 * @returns {string|null}
 */
export function nextLevelName(currentLabel) {
  const map = { 'Básico': 'Pro', Pro: 'Elite' };
  return map[currentLabel] ?? null;
}
