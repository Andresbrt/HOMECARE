/**
 * DESIGN SYSTEM HOMECARE
 * Basado en el Manual de Marca Oficial
 * 
 * REGLA: Respetar 100% la identidad visual
 * NO inventar colores, tipografías ni estilos
 */

// 🎨 PALETA DE COLORES OFICIAL (del manual de marca)
export const COLORS = {
  // Colores principales
  PRIMARY: '#49C0BC',        // Turquesa Fresco - Botones y acciones principales
  SECONDARY: '#0E4D68',      // Azul Petróleo - Fondos secundarios
  DARK: '#001B38',          // Azul Marino Profundo - Textos principales
  WHITE: '#FFFFFF',         // Blanco - Fondos y contenido
  
  // Estados y feedback
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // Grises para texto y bordes
  GRAY_LIGHT: '#F5F5F5',
  GRAY_MEDIUM: '#E0E0E0',
  GRAY_DARK: '#757575',
  
  // Transparencias
  OVERLAY: 'rgba(0, 27, 56, 0.7)',
  SHADOW: 'rgba(0, 0, 0, 0.1)',
};

// 📝 TIPOGRAFÍA (basada en manual de marca)
export const TYPOGRAPHY = {
  FONT_FAMILY: {
    REGULAR: 'System', // Ajustar según manual
    MEDIUM: 'System-Medium',
    BOLD: 'System-Bold',
  },
  
  FONT_SIZE: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    TITLE: 28,
    HERO: 32,
  },
  
  LINE_HEIGHT: {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 28,
  },
};

// 📏 ESPACIADO CONSISTENTE
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// 🔘 BORDER RADIUS
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 50,
};

// 🌟 SOMBRAS
export const SHADOWS = {
  LIGHT: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  STRONG: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// 📱 DIMENSIONES
export const DIMENSIONS = {
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  HEADER_HEIGHT: 60,
  TAB_HEIGHT: 60,
  CARD_MIN_HEIGHT: 120,
};

// 🎭 ANIMACIONES
export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_OUT: 'ease-out',
    EASE_IN: 'ease-in',
    EASE_IN_OUT: 'ease-in-out',
  },
};

// 🚦 ESTADOS GLOBALES
export const STATES = {
  SOLICITUD: {
    PENDIENTE: 'PENDIENTE',
    EN_PROCESO: 'EN_PROCESO', 
    COMPLETADA: 'COMPLETADA',
    CANCELADA: 'CANCELADA',
  },
  SERVICIO: {
    CONFIRMADO: 'CONFIRMADO',
    EN_CAMINO: 'EN_CAMINO',
    LLEGUE: 'LLEGUE',
    INICIADO: 'INICIADO',
    COMPLETADO: 'COMPLETADO',
  },
  PAGO: {
    PENDIENTE: 'PENDIENTE',
    APROBADO: 'APROBADO',
    RECHAZADO: 'RECHAZADO',
  },
};

// 👥 ROLES DE USUARIO
export const USER_ROLES = {
  CLIENT: 'CLIENT',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  ADMIN: 'ADMIN',
};

// 📊 Z-INDEX LAYERS
export const Z_INDEX = {
  BACKGROUND: 1,
  CONTENT: 10,
  OVERLAY: 100,
  MODAL: 1000,
  TOAST: 9999,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  DIMENSIONS,
  ANIMATIONS,
  STATES,
  USER_ROLES,
  Z_INDEX,
};