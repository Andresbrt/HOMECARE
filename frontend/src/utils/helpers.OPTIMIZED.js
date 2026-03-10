/**
 * 🔐 SEGURIDAD - TokenManager con Keychain
 * Almacenamiento seguro de tokens usando react-native-keychain
 */

import * as Keychain from 'react-native-keychain';

export class TokenManager {
  static ACCESS_TOKEN_SERVICE = 'homecare_access_token';
  static REFRESH_TOKEN_SERVICE = 'homecare_refresh_token';
  static USER_DATA_KEY = '@homecare_user_data';

  /**
   * Guardar access token de forma segura
   */
  static async setAccessToken(token) {
    try {
      await Keychain.setGenericPassword('access_token', token, {
        service: this.ACCESS_TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      });
      return true;
    } catch (error) {
      console.error('Error saving access token:', error);
      return false;
    }
  }

  /**
   * Obtener access token
   */
  static async getAccessToken() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: this.ACCESS_TOKEN_SERVICE,
      });
      
      if (credentials) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Guardar refresh token de forma segura
   */
  static async setRefreshToken(token) {
    try {
      await Keychain.setGenericPassword('refresh_token', token, {
        service: this.REFRESH_TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      });
      return true;
    } catch (error) {
      console.error('Error saving refresh token:', error);
      return false;
    }
  }

  /**
   * Obtener refresh token
   */
  static async getRefreshToken() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: this.REFRESH_TOKEN_SERVICE,
      });
      
      if (credentials) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Limpiar todos los tokens
   */
  static async clearTokens() {
    try {
      await Keychain.resetGenericPassword({
        service: this.ACCESS_TOKEN_SERVICE,
      });
      await Keychain.resetGenericPassword({
        service: this.REFRESH_TOKEN_SERVICE,
      });
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }

  /**
   * Verificar si hay tokens guardados
   */
  static async hasTokens() {
    try {
      const accessToken = await this.getAccessToken();
      return !!accessToken;
    } catch (error) {
      console.error('Error checking tokens:', error);
      return false;
    }
  }

  /**
   * Guardar ambos tokens de forma segura
   */
  static async setTokens(accessToken, refreshToken) {
    const accessSaved = await this.setAccessToken(accessToken);
    const refreshSaved = await this.setRefreshToken(refreshToken);
    return accessSaved && refreshSaved;
  }
}

/**
 * 🌐 NETWORK DETECTION - Context para estado de conexión
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
});

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [hasShownOfflineAlert, setHasShownOfflineAlert] = useState(false);

  useEffect(() => {
    // Listener para cambios de conexión
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state);
      
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setConnectionType(state.type);

      // Mostrar alerta cuando se pierde la conexión
      if (!state.isConnected && !hasShownOfflineAlert) {
        Alert.alert(
          '📡 Sin conexión',
          'Verifica tu conexión a internet para continuar',
          [{ text: 'OK', onPress: () => setHasShownOfflineAlert(true) }]
        );
      }

      // Resetear flag cuando se recupera la conexión
      if (state.isConnected) {
        setHasShownOfflineAlert(false);
      }
    });

    return () => unsubscribe();
  }, [hasShownOfflineAlert]);

  // Función para verificar conexión manualmente
  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  };

  const value = {
    isConnected,
    isInternetReachable,
    connectionType,
    checkConnection,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

/**
 * 🎨 DARK MODE - Hook y theme provider
 */

import { useColorScheme, Appearance } from 'react-native';
import { COLORS as BASE_COLORS } from '../theme';

export const LIGHT_THEME = {
  ...BASE_COLORS,
  BACKGROUND: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F5F5F5',
  TEXT_PRIMARY: '#001B38',
  TEXT_SECONDARY: '#757575',
  CARD_BACKGROUND: '#FFFFFF',
  INPUT_BACKGROUND: '#FFFFFF',
  BORDER: '#E0E0E0',
};

export const DARK_THEME = {
  PRIMARY: '#49C0BC',
  SECONDARY: '#1E5F7D',
  DARK: '#FFFFFF', // Invertido para textos
  WHITE: '#001B38', // Invertido para fondos
  
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  BACKGROUND: '#121212',
  BACKGROUND_SECONDARY: '#1E1E1E',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#B0B0B0',
  CARD_BACKGROUND: '#1E1E1E',
  INPUT_BACKGROUND: '#2C2C2C',
  BORDER: '#3A3A3A',
  
  GRAY_LIGHT: '#2C2C2C',
  GRAY_MEDIUM: '#3A3A3A',
  GRAY_DARK: '#B0B0B0',
  
  OVERLAY: 'rgba(255, 255, 255, 0.1)',
  SHADOW: 'rgba(0, 0, 0, 0.5)',
};

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
};

// Theme Context
const ThemeContext = createContext({
  theme: LIGHT_THEME,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Actualizar cuando cambie el sistema
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * 🛡️ ERROR HANDLING - Error boundaries y manejo de errores
 */

// Error personalizado para la app
export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Códigos de error
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// Handler centralizado de errores
export const handleApiError = (error) => {
  // Sin respuesta = Error de red
  if (!error.response) {
    return new AppError(
      'Sin conexión a internet',
      ERROR_CODES.NETWORK_ERROR,
      { originalError: error.message }
    );
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return new AppError(
        data.message || 'Datos inválidos',
        ERROR_CODES.VALIDATION_ERROR,
        data
      );
    case 401:
      return new AppError(
        'Sesión expirada. Inicia sesión nuevamente',
        ERROR_CODES.AUTH_ERROR
      );
    case 403:
      return new AppError(
        'No tienes permiso para realizar esta acción',
        ERROR_CODES.FORBIDDEN
      );
    case 404:
      return new AppError(
        'Recurso no encontrado',
        ERROR_CODES.NOT_FOUND
      );
    case 500:
      return new AppError(
        'Error del servidor. Intenta de nuevo más tarde',
        ERROR_CODES.SERVER_ERROR
      );
    default:
      return new AppError(
        'Error desconocido',
        ERROR_CODES.UNKNOWN_ERROR,
        { status, data }
      );
  }
};

// Error Boundary Component
import React, { Component } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Aquí puedes enviar el error a un servicio de logging
    // Ej: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Error desconocido'}
          </Text>
          <Button title="Reintentar" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001B38',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default ErrorBoundary;

/**
 * 📝 LOGGING SERVICE - Servicio centralizado de logs
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class LoggerService {
  constructor() {
    this.enabled = __DEV__; // Solo en desarrollo por defecto
  }

  log(level, message, data = {}) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    console.log(`[${level}] ${timestamp}:`, message, data);

    // En producción, enviar a servicio externo
    // this.sendToRemote(logEntry);
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, error, data = {}) {
    this.log(LOG_LEVELS.ERROR, message, {
      ...data,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new LoggerService();
