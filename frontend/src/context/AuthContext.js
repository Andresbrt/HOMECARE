import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';
import { authService } from '../services/authService';
import { USER_ROLES } from '../config/apiConfig';

/**
 * CONTEXT DE AUTENTICACIÓN
 * Maneja el estado de autenticación global integrado con Spring Boot backend
 */
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  // Helper para mapear roles del backend al frontend
  const getUserRoleFromBackend = (roles) => {
    if (!roles || roles.length === 0) return 'customer';
    
    if (roles.includes(USER_ROLES.ADMIN)) return 'admin';
    if (roles.includes(USER_ROLES.SERVICE_PROVIDER)) return 'provider';
    if (roles.includes(USER_ROLES.CUSTOMER)) return 'customer';
    
    return 'customer'; // default
  };

  const checkAuthState = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const userData = await authService.getCurrentUser();
        
        if (userData) {
          const mappedUser = {
            id: userData.id,
            email: userData.email,
            name: `${userData.nombre} ${userData.apellido}`,
            firstName: userData.nombre,
            lastName: userData.apellido,
            phone: userData.telefono,
            avatar: userData.fotoPerfil,
            role: getUserRoleFromBackend(userData.roles),
            rating: parseFloat(userData.calificacionPromedio || 0),
            completedServices: userData.serviciosCompletados || 0,
            isAvailable: userData.disponible || false,
            // Datos adicionales para proveedores
            ...(userData.roles?.includes(USER_ROLES.SERVICE_PROVIDER) && {
              experienceYears: userData.experienciaAnos || 0,
              description: userData.descripcion,
              documentId: userData.documentoIdentidad,
            }),
          };
          
          setUser(mappedUser);
          await AsyncStorage.setItem('@user', JSON.stringify(mappedUser));
        }
      } else {
        // Limpiar estado si no está autenticado
        setUser(null);
        await AsyncStorage.removeItem('@user');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      // En caso de error, mantener estado local si existe
      try {
        const userData = await AsyncStorage.getItem('@user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (localError) {
        console.error('Error loading local user data:', localError);
      }
    } finally {
      setInitializing(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        // Mapear usuario del backend al formato del frontend
        const mappedUser = {
          id: response.user.id,
          email: response.user.email,
          name: `${response.user.nombre} ${response.user.apellido}`,
          firstName: response.user.nombre,
          lastName: response.user.apellido,
          phone: response.user.telefono,
          avatar: response.user.fotoPerfil,
          role: getUserRoleFromBackend(response.user.roles),
          rating: parseFloat(response.user.calificacionPromedio || 0),
          completedServices: response.user.serviciosCompletados || 0,
          isAvailable: response.user.disponible || false,
          // Datos adicionales para proveedores
          ...(response.user.roles?.includes(USER_ROLES.SERVICE_PROVIDER) && {
            experienceYears: response.user.experienciaAnos || 0,
            description: response.user.descripcion,
            documentId: response.user.documentoIdentidad,
          }),
        };
        
        setUser(mappedUser);
        await AsyncStorage.setItem('@user', JSON.stringify(mappedUser));
        
        return { success: true };
      }
      
      return { success: false, error: 'Error de autenticación' };
      
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        // Mapear usuario del backend al formato del frontend
        const mappedUser = {
          id: response.user.id,
          email: response.user.email,
          name: `${response.user.nombre} ${response.user.apellido}`,
          firstName: response.user.nombre,
          lastName: response.user.apellido,
          phone: response.user.telefono,
          avatar: response.user.fotoPerfil,
          role: getUserRoleFromBackend(response.user.roles),
          rating: 0,
          completedServices: 0,
          isAvailable: userData.userType === 'provider',
          // Datos adicionales para proveedores
          ...(userData.userType === 'provider' && {
            experienceYears: userData.experience || 0,
            description: userData.description || '',
            documentId: userData.documentId,
          }),
        };
        
        setUser(mappedUser);
        await AsyncStorage.setItem('@user', JSON.stringify(mappedUser));
        
        return { success: true };
      }
      
      return { success: false, error: 'Error de registro' };
      
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      await AsyncStorage.removeItem('@user');
      return { success: true };
    } catch (error) {
      console.warn('Logout error:', error);
      // Limpiar estado local incluso si falla el logout del servidor
      setUser(null);
      await AsyncStorage.removeItem('@user');
      return { success: true };
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Aquí llamarías al servicio de usuario para actualizar perfil
      // const response = await userService.updateProfile(profileData);
      
      // Mock por ahora
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        return { success: true };
      }
      
      return { success: false, error: 'Error al cambiar contraseña' };
      
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (isAvailable) => {
    if (user?.role !== 'provider') {
      return { success: false, error: 'Solo proveedores pueden cambiar disponibilidad' };
    }

    try {
      // Aquí llamarías al servicio para actualizar disponibilidad
      // await userService.updateAvailability(isAvailable);
      
      const updatedUser = { ...user, isAvailable };
      setUser(updatedUser);
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!user;
  const isProvider = user?.role === 'provider';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      // Estado
      user,
      loading,
      initializing,
      error,
      
      // Helpers de estado
      isAuthenticated,
      isProvider,
      isCustomer,
      isAdmin,
      
      // Acciones
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      updateAvailability,
      clearError,
      
      // Utilitarios
      checkAuthState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default AuthContext;