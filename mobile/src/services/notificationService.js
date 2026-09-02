/**
 * notificationService — DEPRECATED
 *
 * Este módulo es LEGACY y no debe importarse en código nuevo.
 * El manejo de notificaciones push está completamente en:
 *   src/hooks/usePushNotifications.js  ← canónico (FCM, canales, navegación)
 *
 * Se conserva solo para compatibilidad histórica.
 * Ningún componente activo lo importa.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from './apiClient';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

export const notificationService = {
  registerForPushNotifications: async () => {
    if (!Device.isDevice) {
      __DEV_LOG__('[NotifService] Solo funciona en dispositivo físico.');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      __DEV_LOG__('[NotifService] Permisos denegados por el usuario.');
      return;
    }

    // projectId desde app.json extra (no hardcodeado)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'homecare-1582c';

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#49C0BC',
      });
    }

    if (token) {
      await notificationService.saveTokenToBackend(token);
    }

    return token;
  },

  saveTokenToBackend: async (token) => {
    try {
      await apiClient.post('/notifications/register-device', {
        tokenFcm: token,
        plataforma: Platform.OS.toUpperCase(),
        modeloDispositivo: Device.modelName,
        versionApp: '1.0.0',
      });
    } catch (error) {
      __DEV_LOG__('[NotifService] Error al guardar token FCM:', error);
    }
  },

  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error) {
      __DEV_LOG__('[NotifService] Error al obtener notificaciones:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      __DEV_LOG__('[NotifService] Error al marcar notificación:', error);
    }
  },
};

