import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import {
  signInWithGoogle as googleSignIn,
  signInWithGoogleCredential,
} from '../services/firebaseAuthService';
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

  useEffect(() => {
    _restoreSession();
  }, []);

  const _restoreSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUserStr = await SecureStore.getItemAsync('user');

      if (storedToken && storedUserStr) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserStr));
        setIsAuthenticated(true);
      }
    } catch (error) {
      __DEV_LOG__('Error restaurando sesión:', error);
      await _clearSession();
    } finally {
      setLoading(false);
    }
  };

  const _clearSession = async () => {
    await SecureStore.deleteItemAsync('token').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
    await SecureStore.deleteItemAsync('user').catch(() => {});
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      const userData = { email, ...response };
      
      await SecureStore.setItemAsync('token', response.token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      setToken(response.token);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en login:', error);
      const msg = error.response?.data?.message || 
                  error.response?.data?.mensaje || 
                  error.response?.data || 
                  error.message || 
                  'Error al iniciar sesión';
      return { success: false, message: msg };
    }
  };

  const register = async (formData) => {
    try {
      // Usar nuestro endpoint de registro directo al backend Java! 
      await authService.register(formData);
      return { success: true, message: 'Registro exitoso. Por favor verifica tu correo.' };
    } catch (error) {
      __DEV_LOG__('Error en registro:', error);
      const msg = error.response?.data?.message || 
                  error.response?.data?.mensaje || 
                  error.response?.data || 
                  error.message || 
                  'Error en el registro';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await _clearSession();
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en logout:', error);
      return { success: false, message: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en recuperar contraseña:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * loginWithGoogle
   *
   * Acepta dos modos de uso:
   *  A) Sin parámetros  → llama signInWithGoogle() (nativo). Si lanza
   *     'EXPO_GO_USE_HOOK', retorna { needsHook: true } para que la
   *     pantalla active promptAsync() de expo-auth-session.
   *  B) loginWithGoogle(firebaseIdToken, selectedRole?)
   *     → recibe el token ya obtenido por el hook en Expo Go.
   *
   * Si el backend indica isNewUser === true y NO se pasó selectedRole,
   * retorna { success: true, isNewUser: true, pendingFirebaseToken }
   * para que la pantalla muestre el selector de rol.
   */
  const loginWithGoogle = async (firebaseIdToken = null, selectedRole = null) => {
    try {
      let firebaseToken = firebaseIdToken;

      // ── A) Flujo nativo (sin token previo) ───────────────────────────
      if (!firebaseToken) {
        try {
          firebaseToken = await googleSignIn();
        } catch (nativeErr) {
          if (nativeErr.code === 'EXPO_GO_USE_HOOK') {
            // Señal para que LoginScreen active el hook expo-auth-session
            return { success: false, needsHook: true };
          }
          throw nativeErr;
        }
      }

      // ── Llamada al backend ────────────────────────────────────────────
      // Primera llamada: sin rol para detectar si es usuario nuevo
      const response = await authService.firebaseLogin(firebaseToken, {});

      // Backend puede retornar isNewUser: true cuando crea la cuenta por primera vez
      if (response.isNewUser === true && !selectedRole) {
        // Pedir al usuario que elija su rol antes de completar el registro
        return { success: true, isNewUser: true, pendingFirebaseToken: firebaseToken };
      }

      // Si hay rol pendiente, actualizar en backend (segunda llamada con rol)
      if (selectedRole) {
        await authService.firebaseLogin(firebaseToken, { rol: selectedRole }).catch(() => {});
      }

      const userData   = { ...response };
      const roleMode   = response.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
      useModeStore.getState().setMode(roleMode);

      try {
        await SecureStore.setItemAsync('token', response.token);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
      } catch (storageErr) {
        __DEV_LOG__('loginWithGoogle: storage error (non-fatal):', storageErr);
      }

      setToken(response.token);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en Google Sign-In:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'Error al iniciar sesión con Google';
      return { success: false, message: msg };
    }
  };

  // ─── Recuperación de contraseña con OTP ──────────────────────────────────
  const sendForgotPasswordOTP = async (email) => {
    try {
      await authService.sendForgotPasswordOTP(email);
      return { success: true };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'Error al enviar el código';
      return { success: false, message: msg };
    }
  };

  const verifyForgotPasswordOTP = async (email, code) => {
    try {
      const data = await authService.verifyForgotPasswordOTP(email, code);
      return { success: true, data };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'Código inválido o expirado';
      return { success: false, message: msg };
    }
  };

  const resetPasswordWithOTP = async (email, code, newPassword) => {
    try {
      await authService.resetPasswordWithOTP(email, code, newPassword);
      return { success: true };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        error.message ||
        'Error al restablecer la contraseña';
      return { success: false, message: msg };
    }
  };

  // ─── Actualizar datos del usuario (refleja cambios sin re-login) ──────
  const updateUser = async (updates) => {
    const merged = { ...user, ...updates };
    setUser(merged);
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(merged));
    } catch (err) {
      __DEV_LOG__('updateUser: storage error (non-fatal):', err);
    }
  };

  const loginWithOTPResponse = async (response) => {
    // 1. Establecer modo SINCRÓNICAMENTE (Zustand fuera de React) antes de cualquier
    //    re-render, evitando que profesionales vean UserMap durante la transición
    const roleMode = response.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
    useModeStore.getState().setMode(roleMode);

    // 2. Persistir sesión — no bloquea la autenticación si falla el storage
    try {
      const userData = { ...response };
      await SecureStore.setItemAsync('token', response.token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setToken(response.token);
      setUser(userData);
    } catch (storageErr) {
      __DEV_LOG__('loginWithOTPResponse: storage error (non-fatal):', storageErr);
      // Aun sin persistencia, el usuario puede operar en esta sesión
      setToken(response.token);
      setUser({ ...response });
    }

    // 3. Activar autenticación → AppNavigator re-renderiza automáticamente
    //    al flujo correcto (Profesional → Drawer/Dashboard, Usuario → UserMap)
    setIsAuthenticated(true);
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
        loginWithGoogle,
        loginWithOTPResponse,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
