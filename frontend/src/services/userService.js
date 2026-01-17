import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export const userService = {
  // Obtener todos los usuarios (admin)
  async getAllUsers() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.USERS);
      return response;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Suspender usuario
  async suspendUser(userId) {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}/suspend`);
      return response;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  },

  // Activar usuario
  async activateUser(userId) {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}/activate`);
      return response;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  // Eliminar usuario
  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Actualizar perfil
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.USERS.ME, profileData);
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Eliminar cuenta propia
  async deleteAccount() {
    try {
      const response = await apiClient.delete('/api/user/account');
      return response;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

// Helper function para obtener el token
async function getToken() {
  try {
    return await AsyncStorage.getItem('accessToken') || '';
  } catch (error) {
    console.error('Error getting token:', error);
    return '';
  }
}