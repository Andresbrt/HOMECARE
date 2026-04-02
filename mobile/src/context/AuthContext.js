import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

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
      console.error('Error restaurando sesión:', error);
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
      console.error('Error en login:', error);
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
      console.error('Error en registro:', error);
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
      console.error('Error en logout:', error);
      return { success: false, message: error.message };
    }
  };

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
