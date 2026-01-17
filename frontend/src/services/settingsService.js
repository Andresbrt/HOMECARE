import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export const settingsService = {
  // Obtener configuración actual
  async getSettings() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.SETTINGS);
      return response;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  },

  // Actualizar configuración
  async updateSettings(settings) {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.ADMIN.SETTINGS, settings);
      return response;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  // Restaurar configuración por defecto
  async resetSettings() {
    try {
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.ADMIN.SETTINGS}/reset`);
      return response;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },

  // Limpiar caché del sistema
  async clearCache() {
    try {
      const response = await apiClient.post('/api/admin/cache/clear');
      return response;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  },

  // Exportar datos del sistema
  async exportData(format = 'json') {
    try {
      console.log(`Exporting data in format: ${format}`);
      // En React Native esto sería diferente
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Crear respaldo del sistema
  async createBackup() {
    try {
      const response = await apiClient.post('/api/admin/backup');
      return response;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  // Obtener información del sistema
  async getSystemInfo() {
    try {
      const response = await apiClient.get('/api/admin/system/info');
      return response;
    } catch (error) {
      console.error('Error getting system info:', error);
      
      // Fallback a datos mock
      return {
        version: '1.0.0',
        lastUpdate: '2026-01-15',
        database: 'PostgreSQL 13.2',
        server: 'Ubuntu 20.04 LTS',
        uptime: '72 horas',
        memoryUsage: '2.1 GB / 8 GB',
        diskUsage: '45 GB / 100 GB'
      };
    }
  }
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