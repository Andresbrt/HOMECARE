/**
 * AuthContext — Firebase Auth + Firestore + JWT backend
 *
 * Flujo:
 *   1. Login/Registro → Firebase Auth (identidad)
 *   2. Perfil guardado en Firestore /users/{uid}
 *   3. Firebase ID Token → backend /auth/firebase-login → JWT para APIs
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import apiClient from '../services/apiClient';
import { authService } from '../services/authService';
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  getFirebaseIdToken,
} from '../services/firebaseAuthService';
import {
  createUserProfile,
  createProviderProfile,
  getUserProfile,
  updateUserProfile,
  saveProviderProfile,
} from '../services/firestoreService';

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

  // Escucha cambios en Firebase Auth (restaura sesión automáticamente)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await _restoreSessionFromFirebase(firebaseUser);
      } else {
        await _clearSession();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Restaura la sesión: carga perfil de Firestore y obtiene/refresca JWT del backend
   */
  const _restoreSessionFromFirebase = async (firebaseUser) => {
    try {
      // 1. Cargar perfil desde Firestore
      const profile = await getUserProfile(firebaseUser.uid);

      // 2. Intentar JWT desde SecureStore primero
      let storedToken = await SecureStore.getItemAsync('token');

      // 3. Si no hay JWT o el usuario no tiene perfil, pedir uno nuevo al backend
      if (!storedToken || !profile) {
        storedToken = await _exchangeFirebaseTokenForJwt(firebaseUser, profile);
      }

      if (storedToken && profile) {
        setToken(storedToken);
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error restaurando sesión Firebase:', error);
      await _clearSession();
    }
  };

  /**
   * Llama al backend con el Firebase ID Token y obtiene un JWT de la app
   */
  const _exchangeFirebaseTokenForJwt = async (firebaseUser, profile) => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const payload = {
        firebaseToken: idToken,
        nombre: profile?.nombre || firebaseUser.displayName?.split(' ')[0] || 'Usuario',
        apellido: profile?.apellido || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        telefono: profile?.telefono || '',
        rol: profile?.rol || 'CUSTOMER',
      };
      const response = await apiClient.post('/auth/firebase-login', payload);
      const { token: accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync('token', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      return accessToken;
    } catch (error) {
      console.warn('No se pudo intercambiar token Firebase por JWT:', error.message);
      return null;
    }
  };

  const _clearSession = async () => {
    await SecureStore.deleteItemAsync('token').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Login con email y contraseña (Firebase Auth)
   * El JWT del backend es opcional — si no está disponible, se usa Firebase token directamente.
   */
  const login = async (email, password) => {
    try {
      const firebaseUser = await firebaseSignIn(email, password);

      // Cargar perfil de Firestore
      const profile = await getUserProfile(firebaseUser.uid);

      // Intentar obtener JWT del backend (best-effort)
      try {
        const idToken = await getFirebaseIdToken();
        const payload = {
          firebaseToken: idToken,
          nombre: profile?.nombre || '',
          apellido: profile?.apellido || '',
          telefono: profile?.telefono || '',
          rol: profile?.rol || 'CUSTOMER',
        };
        const response = await apiClient.post('/auth/firebase-login', payload);
        const { token: accessToken, refreshToken } = response.data;
        await SecureStore.setItemAsync('token', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        setToken(accessToken);
      } catch (backendErr) {
        console.warn('Backend no disponible, usando Firebase token:', backendErr.message);
        // Usar Firebase ID token como token temporal
        const idToken = await getFirebaseIdToken();
        setToken(idToken);
      }

      setUser(profile);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (formData) => {
    try {
      const { email, password, nombre, apellido, telefono, rol } = formData;
      const firebaseUser = await firebaseSignUp(email, password);

      // Guardar perfil en Firestore
      const profile = {
        uid: firebaseUser.uid,
        email,
        nombre,
        apellido,
        telefono,
        rol,
        createdAt: new Date().toISOString(),
      };

      if (rol === 'SERVICE_PROVIDER') {
        await createProviderProfile(profile);
      } else {
        await createUserProfile(profile);
      }

      // Intercambiar por JWT (best-effort)
      try {
        const idToken = await firebaseUser.getIdToken();
        const payload = {
          firebaseToken: idToken,
          nombre,
          apellido,
          telefono,
          rol,
        };
        const response = await apiClient.post('/auth/firebase-login', payload);
        const { token: accessToken, refreshToken } = response.data;
        await SecureStore.setItemAsync('token', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        setToken(accessToken);
      } catch (backendErr) {
        console.warn('Backend no disponible durante registro:', backendErr.message);
      }

      setUser(profile);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      await _clearSession();
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Envía email de recuperación de contraseña (Firebase Auth)
   */
  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Error en recuperar contraseña:', error);
      return { success: false, message: error.message };
    }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

      const fullUser = { uid: firebaseUser.uid, email, ...profile };
      setUser(fullUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      const msg = _mapFirebaseError(error);
      return { success: false, message: msg };
    }
  };

  /**
   * Registro de nuevo usuario (Firebase Auth + Firestore + backend)
   */
  const register = async (formData) => {
    try {
      const { email, password, nombre, apellido, telefono, rol } = formData;
      const displayName = `${nombre} ${apellido}`.trim();

      // 1. Crear usuario en Firebase Auth
      const firebaseUser = await firebaseSignUp(email, password, displayName);

      // 2. Guardar perfil en Firestore
      const profileData = { email, nombre, apellido, telefono, rol };
      await createUserProfile(firebaseUser.uid, profileData);

      // 3. Si es proveedor, crear también en colección /providers
      if (rol === 'SERVICE_PROVIDER') {
        await createProviderProfile(firebaseUser.uid, {
          email,
          nombre,
          apellido,
          telefono,
          documentoIdentidad: formData.documentoIdentidad || '',
          descripcion: formData.descripcion || '',
          experienciaAnos: formData.experienciaAnos || 0,
        });
      }

      // 4. Intentar obtener JWT del backend (best-effort)
      try {
        const idToken = await getFirebaseIdToken();
        const response = await apiClient.post('/auth/firebase-login', {
          firebaseToken: idToken,
          nombre,
          apellido,
          telefono,
          rol,
        });
        const { token: accessToken, refreshToken } = response.data;
        await SecureStore.setItemAsync('token', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        setToken(accessToken);
      } catch (backendErr) {
        console.warn('Backend no disponible, usando Firebase token:', backendErr.message);
        const idToken = await getFirebaseIdToken();
        setToken(idToken);
      }

      const fullUser = { uid: firebaseUser.uid, ...profileData };
      setUser(fullUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      const msg = _mapFirebaseError(error);
      return { success: false, message: msg };
    }
  };

  /**
   * Cerrar sesión (Firebase + backend + SecureStore)
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      await firebaseSignOut().catch(() => {});
      await _clearSession();
    }
  };

  /**
   * Actualizar perfil del usuario en Firestore y en el estado local
   */
  const updateUser = async (updatedData) => {
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      await updateUserProfile(uid, updatedData);
      if (user?.rol === 'SERVICE_PROVIDER') {
        await saveProviderProfile(uid, updatedData).catch(() => {});
      }
    }
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const isCustomer = () => user?.rol === 'CUSTOMER';
  const isProvider = () => user?.rol === 'SERVICE_PROVIDER';

  /**
   * Mapear errores de Firebase a mensajes en español
   */
  const _mapFirebaseError = (error) => {
    const code = error?.code || '';
    const map = {
      'auth/invalid-credential': 'Email o contraseña incorrectos',
      'auth/user-not-found': 'No existe una cuenta con ese email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Ese email ya tiene una cuenta registrada',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El email no es válido',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos',
    };
    return (
      map[code] ||
      error?.response?.data?.message ||
      error?.message ||
      'Error de autenticación'
    );
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    isCustomer,
    isProvider,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
