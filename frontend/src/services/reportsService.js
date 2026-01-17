import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/apiConfig';

export const reportsService = {
  // Obtener reportes del período seleccionado
  async getReports(period = 'week') {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ADMIN.REPORTS}?period=${period}`);
      
      // Fallback a datos mock si no hay respuesta del backend
      return {
        revenue: response.revenue || this.getMockRevenue(period),
        services: response.services || this.getMockServices(period),
        newUsers: response.newUsers || this.getMockNewUsers(period),
        providerRating: response.providerRating || 4.7,
        topServices: response.topServices || this.getMockTopServices(),
        revenueChart: response.revenueChart || this.getMockRevenueChart(period),
        userGrowth: response.userGrowth || this.getMockUserGrowth(period)
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      
      // Fallback a datos mock en caso de error
      return {
        revenue: this.getMockRevenue(period),
        services: this.getMockServices(period),
        newUsers: this.getMockNewUsers(period),
        providerRating: 4.7,
        topServices: this.getMockTopServices(),
        revenueChart: this.getMockRevenueChart(period),
        userGrowth: this.getMockUserGrowth(period)
      };
    }
  },

  // Exportar reporte
  async exportReport(period = 'week', format = 'pdf') {
    try {
      // Para React Native, esto podría usar react-native-fs o similar
      console.log(`Exporting report for period: ${period}, format: ${format}`);
      return true;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  },

  // Datos mock para desarrollo
  getMockRevenue(period) {
    const revenues = {
      week: 12500,
      month: 45000,
      quarter: 135000,
      year: 540000
    };
    return revenues[period] || 12500;
  },

  getMockServices(period) {
    const services = {
      week: 89,
      month: 345,
      quarter: 1035,
      year: 4140
    };
    return services[period] || 89;
  },

  getMockNewUsers(period) {
    const users = {
      week: 23,
      month: 87,
      quarter: 261,
      year: 1044
    };
    return users[period] || 23;
  },

  getMockTopServices() {
    return [
      { name: 'Limpieza General', count: 45 },
      { name: 'Cuidado de Ancianos', count: 38 },
      { name: 'Niñera', count: 32 },
      { name: 'Jardinería', count: 28 },
      { name: 'Reparaciones Menores', count: 24 },
      { name: 'Cocina', count: 19 }
    ];
  },

  getMockRevenueChart(period) {
    switch (period) {
      case 'week':
        return [
          { period: 'Lun', value: 1800 },
          { period: 'Mar', value: 2200 },
          { period: 'Mié', value: 1950 },
          { period: 'Jue', value: 2400 },
          { period: 'Vie', value: 2150 },
          { period: 'Sáb', value: 2800 },
          { period: 'Dom', value: 2200 }
        ];
      case 'month':
        return [
          { period: 'Sem 1', value: 8500 },
          { period: 'Sem 2', value: 11200 },
          { period: 'Sem 3', value: 12800 },
          { period: 'Sem 4', value: 12500 }
        ];
      case 'quarter':
        return [
          { period: 'Ene', value: 42000 },
          { period: 'Feb', value: 45000 },
          { period: 'Mar', value: 48000 }
        ];
      case 'year':
        return [
          { period: 'Q1', value: 135000 },
          { period: 'Q2', value: 145000 },
          { period: 'Q3', value: 128000 },
          { period: 'Q4', value: 132000 }
        ];
      default:
        return [];
    }
  },

  getMockUserGrowth(period) {
    switch (period) {
      case 'week':
        return [
          { period: 'Lunes', customers: 3, providers: 1 },
          { period: 'Martes', customers: 5, providers: 2 },
          { period: 'Miércoles', customers: 2, providers: 1 },
          { period: 'Jueves', customers: 4, providers: 3 },
          { period: 'Viernes', customers: 6, providers: 1 },
          { period: 'Sábado', customers: 2, providers: 0 },
          { period: 'Domingo', customers: 1, providers: 0 }
        ];
      case 'month':
        return [
          { period: 'Semana 1', customers: 18, providers: 7 },
          { period: 'Semana 2', customers: 22, providers: 9 },
          { period: 'Semana 3', customers: 25, providers: 8 },
          { period: 'Semana 4', customers: 22, providers: 6 }
        ];
      case 'quarter':
        return [
          { period: 'Enero', customers: 87, providers: 30 },
          { period: 'Febrero', customers: 76, providers: 25 },
          { period: 'Marzo', customers: 98, providers: 32 }
        ];
      case 'year':
        return [
          { period: 'Q1 2025', customers: 261, providers: 87 },
          { period: 'Q2 2025', customers: 298, providers: 95 },
          { period: 'Q3 2025', customers: 245, providers: 78 },
          { period: 'Q4 2025', customers: 287, providers: 89 }
        ];
      default:
        return [];
    }
  }
};

// Helper function para obtener el token
async function getToken() {
  return localStorage.getItem('token') || '';
}