import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';
import { getGoogleIdTokenNative } from '../services/firebaseAuthService';
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
      const { email, password, nombre, apellido, rol, telefono,
              fotoSelfieVerificacion, fotoCedulaFrontal, fotoCedulaPosterior, archivoAntecedentes } = formData;
      // Registrar usuario en el backend (documentos incluidos para verificación de proveedores)
      await authService.register({
        email, password, nombre, apellido, rol: rol || 'CUSTOMER', telefono,
        ...(fotoSelfieVerificacion && { fotoSelfieVerificacion }),
        ...(fotoCedulaFrontal && { fotoCedulaFrontal }),
        ...(fotoCedulaPosterior && { fotoCedulaPosterior }),
        ...(archivoAntecedentes && { archivoAntecedentes }),
      });
      
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

  /**
   * @param {string|undefined} supabaseOrGoogleToken - Supabase access_token (OAuth web flow)
   *   OR Google idToken (native). If omitted, tries native Google sign-in.
   * @param {string|undefined} selectedRole - 'CUSTOMER' | 'SERVICE_PROVIDER'.
   */
  const loginWithGoogle = async (supabaseOrGoogleToken, selectedRole) => {
    try {
      let session = null;

      if (supabaseOrGoogleToken) {
        // Check if it's already a Supabase session access_token (JWT issued by Supabase)
        // Try to get the current session first — if onAuthStateChange already set it, use it.
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token === supabaseOrGoogleToken) {
          session = sessionData.session;
        } else {
          // It's a Google idToken → sign in with Supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: supabaseOrGoogleToken,
          });
          if (error) throw error;
          session = data?.session;
        }
      } else {
        // Native Google sign-in → get Google idToken
        let idToken;
        try {
          idToken = await getGoogleIdTokenNative();
        } catch (e) {
          if (e.code === 'EXPO_GO_USE_HOOK') {
            return { success: false, needsHook: true };
          }
          return { success: false, message: e.message || 'Error en Google Sign-In' };
        }
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
        session = data?.session;
      }

      if (!session) throw new Error('No se obtuvo sesion de Supabase');

      // Detect new user
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      const createdAt = new Date(sbUser?.created_at || 0).getTime();
      const lastSignIn = new Date(sbUser?.last_sign_in_at || 0).getTime();
      const isNewUser = Math.abs(lastSignIn - createdAt) < 30_000;

      if (isNewUser && !selectedRole) {
        return { success: true, isNewUser: true, pendingFirebaseToken: session.access_token };
      }

      const meta = sbUser?.user_metadata || {};
      const nombre = meta.given_name || meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '';
      const apellido = meta.family_name || (meta.full_name?.split(' ').slice(1).join(' ')) || '';

      const backendResponse = await authService.supabaseLogin({
        supabaseToken: session.access_token,
        nombre,
        apellido,
        rol: selectedRole || 'CUSTOMER',
      });

      setToken(backendResponse.token);
      setUser(backendResponse);
      setIsAuthenticated(true);

      const roleMode = backendResponse.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
      useModeStore.getState().setMode(roleMode);

      return { success: true };
    } catch (error) {
      __DEV_LOG__('Error en Google Sign-In:', error);
      return { success: false, message: _parseError(error) };
    }
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

