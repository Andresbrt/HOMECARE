/**
 * usePushNotifications — Registra el dispositivo para FCM y maneja
 * las notificaciones entrantes mientras la app está en foreground / background.
 *
 * USO:
 *   // En App.js o en AppNavigator (una sola vez al autenticarse)
 *   const { expoPushToken } = usePushNotifications();
 *
 * QUÉ HACE:
 *   1. Pide permisos de notificación al usuario
 *   2. Obtiene el Expo Push Token del dispositivo
 *   3. Lo guarda en el backend (PUT /usuarios/push-token)
 *   4. Escucha mensajes en foreground → muestra notificación local
 *   5. Escucha taps en notificación → navega a la pantalla correcta
 *
 * DEPENDENCIAS (ya instaladas o instalar):
 *   expo install expo-notifications expo-device
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ── Configuración global del handler (fuera del hook, solo una vez) ──────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Mostrar banner en foreground
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const { mode } = useModeStore();
  const navigation = useNavigation();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // ── 1. Registrar dispositivo y guardar token ──────────────────────────────
  const registerForPushNotificationsAsync = useCallback(async () => {
    // Solo funciona en dispositivo físico
    if (!Device.isDevice) {
      console.info('[Push] Push notifications solo funcionan en dispositivo físico.');
      return null;
    }

    // Verificar / pedir permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permisos de notificación denegados.');
      return null;
    }

    // Canal Android (requerido para API 26+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Mensajes de Chat',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#49C0BC',
      });
      await Notifications.setNotificationChannelAsync('offers', {
        name: 'Ofertas y Solicitudes',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    // Obtener token de Expo (funciona con FCM internamente)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'homecare-1582c', // tu Expo project slug
    });

    return tokenData.data; // "ExponentPushToken[xxxx]"
  }, []);

  // ── 2. Navegar desde una notificación ────────────────────────────────────
  const handleNotificationResponse = useCallback(
    (response) => {
      const data          = response?.notification?.request?.content?.data ?? {};
      const clickAction   = data?.click_action;
      const screen        = data?.screen;
      const solicitudId   = data?.solicitudId;
      const destinatarioId = data?.destinatarioId;
      const chatId        = data?.chatId;
      const titulo        = data?.titulo || 'Chat';

      const isChatNotif =
        clickAction === 'OPEN_CHAT' ||
        screen === 'Chat' ||
        screen === 'UserChat';

      if (!solicitudId && !screen) return;

      try {
        if (isChatNotif) {
          if (mode === 'usuario') {
            navigation.navigate('UserChat', { solicitudId, destinatarioId, titulo, chatId });
          } else {
            navigation.navigate('Chat', { solicitudId, destinatarioId, titulo, chatId });
          }
        } else if (screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] navigate error:', e.message);
      }
    },
    [navigation, mode],
  );

  // ── 3. Efecto principal ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const incrementUnread = useChatStore.getState().incrementUnread;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token || !mounted) return;

      // Guardar token en el backend
      await apiClient
        .put('/usuarios/push-token', { pushToken: token })
        .catch((e) => console.warn('[Push] No se pudo guardar el token:', e.message));

      // Cold-start: app estaba cerrada, usuario tocó la notificación
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleNotificationResponse(lastResponse), 300);
      }

      // Notificaciones en FOREGROUND — actualizar badge local
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          const data = notification.request.content.data ?? {};
          if (
            data.solicitudId &&
            (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat')
          ) {
            incrementUnread?.();
          }
        },
      );

      // Taps en notificación (app en background o activa)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );
    })();

    return () => {
      mounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id, registerForPushNotificationsAsync, handleNotificationResponse]);

  return {};
}
