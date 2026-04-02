import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

// Configuración del manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Registra el dispositivo para recibir notificaciones push
   */
  registerForPushNotifications: async () => {
    let token;

    if (!Device.isDevice) {
      console.log('Debes usar un dispositivo físico para notificaciones push');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Fallo al obtener el token para notificaciones push');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'tu-project-id-de-expo', // Reemplazar con el ID del app.json
    })).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (token) {
      await notificationService.saveTokenToBackend(token);
    }

    return token;
  },

  /**
   * Envía el token al backend para asociarlo al usuario
   */
  saveTokenToBackend: async (token) => {
    try {
      const deviceInfo = {
        tokenFcm: token,
        plataforma: Platform.OS.toUpperCase(), // ANDROID o IOS
        modeloDispositivo: Device.modelName,
        versionApp: '1.0.0',
      };
      await apiClient.post('/notifications/register-device', deviceInfo);
      await AsyncStorage.setItem('fcm_token', token);
      console.log('Token FCM guardado en el backend');
    } catch (error) {
      console.error('Error al guardar token FCM:', error);
    }
  },

  /**
   * Obtiene todas las notificaciones del usuario
   */
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  },

  /**
   * Marca una notificación como leída
   */
  markAsRead: async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  }
};
