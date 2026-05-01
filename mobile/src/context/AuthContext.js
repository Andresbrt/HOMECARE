import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import useModeStore from '../store/modeStore';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('token');
        const savedUser = await SecureStore.getItemAsync('user');
        
        if (savedToken && savedUser) {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Detectar modo según rol
          const roleMode = userData.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
          useModeStore.getState().setMode(roleMode);
        }
      } catch (error) {
        __DEV_LOG__('Error cargando sesión:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      setToken(response.token);
      setUser(response);
      setIsAuthenticated(true);
      
      // Detectar modo según rol
      const roleMode = response.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
      useModeStore.getState().setMode(roleMode);
      
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en login:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // ─── REGISTRO ─────────────────────────────────────────────────────────────
  const register = async (formData) => {
    try {
      const { email, password, nombre, apellido, rol, telefono } = formData;
      // Registrar usuario en el backend
      await authService.register({ email, password, nombre, apellido, rol: rol || 'CUSTOMER', telefono });
      
      // Enviar código OTP de 4 dígitos al email
      await authService.sendOTP(email);
      
      return {
        success: true,
        message: 'Registro exitoso. Revisa tu email para el código de verificación.',
        requiresOTP: true,
        email,
      };
    } catch (error) {
      __DEV_LOG__('Error en registro:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authService.logout();
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en logout:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // ─── RECUPERACIÓN DE CONTRASEÑA ───────────────────────────────────────────
  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en recuperar contraseña:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // Funciones OTP para recuperación de contraseña
  const sendForgotPasswordOTP = async (email) => {
    try {
      await authService.sendForgotPasswordOTP(email);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error enviando OTP:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  const verifyForgotPasswordOTP = async (email, code) => {
    try {
      const response = await authService.verifyForgotPasswordOTP(email, code);
      return { success: true, data: response };
    } catch (error) {
      __DEV_LOG__('Error verificando OTP:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  const resetPasswordWithOTP = async (email, code, newPassword) => {
    try {
      await authService.resetPasswordWithOTP(email, code, newPassword);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error reseteando contraseña:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    // TODO: Implementar Google Sign-In con backend
    return { success: false, message: 'Google Sign-In no disponible aún' };
  };

  // ─── VERIFICAR OTP ────────────────────────────────────────────────────────
  const verifyOTP = async (email, codigo) => {
    try {
      const response = await authService.verifyOTP(email, codigo);
      
      setToken(response.token);
      setUser(response);
      setIsAuthenticated(true);
      
      // Detectar modo según rol
      const roleMode = response.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
      useModeStore.getState().setMode(roleMode);
      
      return { success: true, data: response };
    } catch (error) {
      __DEV_LOG__('Error verificando OTP:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      await authService.sendOTP(email);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error reenviando OTP:', error);
      return { success: false, message: _parseError(error) };
    }
  };

  // ─── UPDATE USER (refleja cambios sin re-login) ───────────────────────────
  const updateUser = async (updates) => {
    const merged = { ...user, ...updates };
    setUser(merged);
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(merged));
    } catch (err) {
      __DEV_LOG__('updateUser: storage error (non-fatal):', err);
    }
  };

  // Stub mantenido para compatibilidad con pantallas que usan loginWithOTPResponse
  const loginWithOTPResponse = async (response) => {
    const roleMode = response.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
    useModeStore.getState().setMode(roleMode);

    try {
      await SecureStore.setItemAsync('token', response.token);
      await SecureStore.setItemAsync('user', JSON.stringify(response));
    } catch (_) {}

    setToken(response.token);
    setUser(response);
    setIsAuthenticated(true);
  };

  // ─── DEV LOGIN ────────────────────────────────────────────────────────────
  const devLogin = async (role) => {
    if (!__DEV__) return { success: false, message: 'Función no disponible en producción' };

    const devCredentials = {
      SERVICE_PROVIDER: { email: 'profesional@test.com', password: 'Test123!' },
      CUSTOMER: { email: 'usuario@test.com', password: 'Test123!' },
    };

    const credentials = devCredentials[role];
    if (!credentials) return { success: false, message: 'Rol inválido' };
    return login(credentials.email, credentials.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        forgotPassword,
        sendForgotPasswordOTP,
        verifyForgotPasswordOTP,
        resetPasswordWithOTP,
        verifyOTP,
        resendOTP,
        loginWithGoogle,
        loginWithOTPResponse,
        updateUser,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _parseError(error) {
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    'Ha ocurrido un error. Intenta de nuevo.'
  );
}

