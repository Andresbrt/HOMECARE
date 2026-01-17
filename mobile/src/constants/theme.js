/**
 * HOMECARE - Constantes de Colores (Manual de Marca)
 * Diseño Minimalista Profesional
 */

export const COLORS = {
  // Paleta Oficial
  primary: '#001B38',          // Azul Marino Profundo - Textos, Headers
  secondary: '#0E4D68',        // Azul Petróleo - Fondos secundarios, Cards
  accent: '#49C0BC',           // Turquesa Fresco - Botones, CTAs, Estados activos
  white: '#FFFFFF',            // Blanco Puro - Fondo principal
  
  // Grises para texto y bordes
  textPrimary: '#001B38',
  textSecondary: '#0E4D68',
  textDisabled: '#888888',
  border: '#E0E0E0',
  
  // Estados
  success: '#49C0BC',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#0E4D68',
  
  // Fondos
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  card: '#FFFFFF',
  
  // Overlays
  overlay: 'rgba(0, 27, 56, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const TYPOGRAPHY = {
  // Font Family
  fontRegular: 'Arial',
  fontNarrow: 'Arial Narrow',
  fontBrand: 'Monigue DEMO', // Solo para logo
  
  // Font Sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Font Weights
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
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
};
