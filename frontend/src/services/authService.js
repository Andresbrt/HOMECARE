import { apiClient } from './apiClient';
import { API_CONFIG, TokenManager } from '../config/apiConfig';

/**
 * SERVICIO DE AUTENTICACIÓN
 * Maneja login, registro, tokens y sesiones según el backend Spring Boot
 */
export class AuthService {
  
  /**
   * Iniciar sesión
   */
  async login(email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      }, { includeAuth: false });

      // Guardar tokens y datos de usuario
      await this.saveAuthData(response);

      return {
        success: true,
        user: response.usuario,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.isValidationError) {
        throw new Error('Email o contraseña inválidos');
      }
      
      if (error.isUnauthorized) {
        throw new Error('Credenciales incorrectas');
      }
      
      throw new Error('Error al iniciar sesión. Verifica tu conexión.');
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    try {
      // Mapear campos del frontend al backend
      const registroData = {
        email: userData.email,
        password: userData.password,
        nombre: userData.firstName,
        apellido: userData.lastName,
        telefono: userData.phone,
        roles: userData.userType === 'provider' ? ['SERVICE_PROVIDER'] : ['CUSTOMER'],
        
        // Campos específicos para proveedores
        ...(userData.userType === 'provider' && {
          documentoIdentidad: userData.documentId,
          experienciaAnos: userData.experience || 0,
          descripcion: userData.description || '',
        }),
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        registroData,
        { includeAuth: false }
      );

      // Guardar tokens y datos de usuario
      await this.saveAuthData(response);

      return {
        success: true,
        user: response.usuario,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
      
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.isValidationError) {
        const message = error.data?.message || 'Datos inválidos';
        throw new Error(message);
      }
      
      if (error.status === 409) {
        throw new Error('El email ya está registrado');
      }
      
      throw new Error('Error al registrar usuario. Verifica tu conexión.');
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken() {
    try {
      const refreshToken = await TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        { refreshToken },
        { includeAuth: false }
      );

      // Actualizar tokens
      await TokenManager.setTokens(response.accessToken, response.refreshToken);

      return {
        success: true,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
      
    } catch (error) {
      console.error('Refresh token error:', error);
      
      // Token inválido, limpiar sesión
      await this.logout();
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword, newPassword) {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      return { success: true };
      
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.isUnauthorized || error.isValidationError) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      throw new Error('Error al cambiar contraseña');
    }
  }

  /**
   * Recuperar contraseña
   */
  async resetPassword(email) {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
      }, { includeAuth: false });

      return { 
        success: true,
        message: 'Se ha enviado un email con instrucciones para recuperar tu contraseña'
      };
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.status === 404) {
        throw new Error('Email no encontrado en nuestros registros');
      }
      
      throw new Error('Error al enviar email de recuperación');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Intentar notificar al backend (opcional)
      try {
        await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      } catch (error) {
        console.warn('Logout notification failed:', error);
      }
      
      // Limpiar datos locales
      await TokenManager.clearTokens();
      
      return { success: true };
      
    } catch (error) {
      console.error('Logout error:', error);
      // Limpiar datos locales incluso si falla la notificación
      await TokenManager.clearTokens();
      return { success: true };
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated() {
    try {
      const accessToken = await TokenManager.getAccessToken();
      const userData = await TokenManager.getUserData();
      
      if (!accessToken || !userData) {
        return false;
      }

      // Verificar que el token no esté expirado
      // (Opcional: decodificar JWT para verificar exp)
      
      return true;
      
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Obtener datos del usuario actual
   */
  async getCurrentUser() {
    try {
      const userData = await TokenManager.getUserData();
      
      if (!userData) {
        return null;
      }

      // Obtener datos actualizados del servidor
      try {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.USERS.ME);
        
        // Actualizar datos locales
        await TokenManager.setUserData(response);
        
        return response;
      } catch (error) {
        // Si falla, retornar datos locales
        console.warn('Failed to fetch updated user data:', error);
        return userData;
      }
      
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Obtener rol del usuario
   */
  async getUserRole() {
    try {
      const userData = await this.getCurrentUser();
      
      if (!userData || !userData.roles || userData.roles.length === 0) {
        return null;
      }

      // Retornar el rol principal (primer rol)
      return userData.roles[0];
      
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  async hasRole(role) {
    try {
      const userData = await this.getCurrentUser();
      
      if (!userData || !userData.roles) {
        return false;
      }

      return userData.roles.includes(role);
      
    } catch (error) {
      console.error('Has role check error:', error);
      return false;
    }
  }

  /**
   * Guardar datos de autenticación
   */
  async saveAuthData(response) {
    try {
      await TokenManager.setTokens(response.accessToken, response.refreshToken);
      await TokenManager.setUserData(response.usuario);
    } catch (error) {
      console.error('Save auth data error:', error);
      throw new Error('Error guardando datos de sesión');
    }
  }

  /**
   * Solicitar código de recuperación de contraseña
   */
  async requestPasswordReset(email) {
    try {
      await apiClient.post('/auth/forgot-password', { email }, { includeAuth: false });
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      
      if (error.isNotFound) {
        throw new Error('Email no encontrado');
      }
      
      throw new Error('Error al enviar código de recuperación');
    }
  }

  /**
   * Verificar código de recuperación
   */
  async verifyResetCode(email, code) {
    try {
      const response = await apiClient.post('/auth/verify-reset-code', {
        email,
        code,
      }, { includeAuth: false });
      
      return { 
        success: true, 
        resetToken: response.resetToken 
      };
    } catch (error) {
      console.error('Verify reset code error:', error);
      
      if (error.isValidationError) {
        throw new Error('Código inválido o expirado');
      }
      
      throw new Error('Error verificando código');
    }
  }

  /**
   * Restablecer contraseña con código
   */
  async resetPassword(resetToken, newPassword) {
    try {
      await apiClient.post('/auth/reset-password', {
        resetToken,
        newPassword,
      }, { includeAuth: false });
      
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.isValidationError) {
        throw new Error('Token de recuperación inválido');
      }
      
      throw new Error('Error restableciendo contraseña');
    }
  }
}

// Instancia singleton
export const authService = new AuthService();
export default authService;