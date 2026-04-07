/**
 * levelUtils — Sistema de niveles Homecare 2026
 * Extraído como utilidad compartida para evitar duplicación.
 *
 * Niveles:
 *   Bronce   → 0–4 servicios
 *   Plata    → 5–19 servicios
 *   Oro      → 20–49 servicios
 *   Platino  → 50+ servicios
 */

/**
 * Calcula el nivel actual basado en la cantidad de servicios completados.
 * @param {number} n — Total de servicios completados
 * @returns {{ label: string, color: string, icon: string, progress: number, next: number|null }}
 */
export function computeLevel(n = 0) {
  if (n >= 50)
    return { label: 'Platino', color: '#E5E4E2', icon: 'diamond',  progress: 1,       next: null };
  if (n >= 20)
    return { label: 'Oro',     color: '#FFD700', icon: 'trophy',   progress: n / 50,   next: 50   };
  if (n >= 5)
    return { label: 'Plata',   color: '#C0C0C0', icon: 'medal',    progress: n / 20,   next: 20   };
  return           { label: 'Bronce',  color: '#CD7F32', icon: 'ribbon',   progress: n / 5,    next: 5    };
}

/**
 * Retorna el nombre del siguiente nivel (para textos UI).
 * @param {string} currentLabel — Label del nivel actual
 * @returns {string}
 */
export function nextLevelName(currentLabel) {
  const map = { Bronce: 'Plata', Plata: 'Oro', Oro: 'Platino' };
  return map[currentLabel] ?? null;
}
