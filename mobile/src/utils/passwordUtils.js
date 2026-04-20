/**
 * passwordUtils — Utilidades compartidas para validación de contraseñas
 */
import { PROF } from '../constants/theme';

/**
 * Calcula la fortaleza de una contraseña.
 * @param {string} password
 * @returns {{ level: number, label: string, color: string }}
 */
export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  if (password.length >= 12)          score++;

  if (score <= 1) return { level: 0, label: 'Muy débil',  color: PROF.error };
  if (score === 2) return { level: 1, label: 'Débil',      color: '#FF8C00' };
  if (score === 3) return { level: 2, label: 'Regular',    color: PROF.warning };
  if (score === 4) return { level: 3, label: 'Fuerte',     color: '#7ED321' };
  return             { level: 4, label: 'Muy fuerte', color: PROF.accent };
}
