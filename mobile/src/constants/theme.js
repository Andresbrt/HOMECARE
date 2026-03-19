/**
 * HOMECARE Colorimetría — Design System 2026
 * Paleta de marca oficial. NO modificar colores base.
 */

// ─── TEMA CLIENTE (fondo claro) ──────────────────────────────────────────────
export const COLORS = {
  primary: '#001B38',
  secondary: '#0E4D68',
  accent: '#49C0BC',
  white: '#FFFFFF',
  textPrimary: '#001B38',
  textSecondary: '#0E4D68',
  textDisabled: '#888888',
  border: '#E0E0E0',
  success: '#49C0BC',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#0E4D68',
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  card: '#FFFFFF',
  overlay: 'rgba(0, 27, 56, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// ─── TEMA PROFESIONAL (fondo oscuro premium) ─────────────────────────────────
export const PROF = {
  // Fondos
  bg: '#001B38',
  bgCard: 'rgba(14, 77, 104, 0.35)',
  bgElevated: 'rgba(14, 77, 104, 0.55)',
  bgDeep: '#000F22',

  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.35)',

  // Marca
  accent: '#49C0BC',
  accentDim: 'rgba(73,192,188,0.18)',
  accentGlow: 'rgba(73,192,188,0.45)',
  primary: '#001B38',
  secondary: '#0E4D68',

  // Glass
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.13)',
  glassDark: 'rgba(0,15,34,0.55)',

  // Gradientes (arrays para LinearGradient)
  gradMain: ['#001B38', '#0E4D68'],
  gradCard: ['rgba(14,77,104,0.55)', 'rgba(0,27,56,0.9)'],
  gradAccent: ['#49C0BC', '#2a9d99'],
  gradOverlay: ['rgba(0,27,56,0)', 'rgba(0,27,56,0.95)'],

  // Estados
  available: '#49C0BC',
  busy: '#F5A623',
  offline: 'rgba(255,255,255,0.28)',

  // Semánticos
  success: '#49C0BC',
  warning: '#F5A623',
  error: '#FF5B5B',
  border: 'rgba(255,255,255,0.10)',
};

export const TYPOGRAPHY = {
  // Fuentes Inter (cargadas via expo-font)
  fontRegular: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontSemibold: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  // Fallback sistema
  fontSystem: undefined, // usa default del SO

  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 42,

  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDER_RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const SHADOWS = {
  // Sombras para tema claro (cliente)
  sm: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  // Sombras para tema profesional (glow turquesa)
  glow: {
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 18,
  },
  glowStrong: {
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 28,
    elevation: 28,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};

export default { COLORS, PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS };
