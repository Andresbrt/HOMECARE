/**
 * usePushNotifications — Registra el dispositivo para FCM y maneja
 * notificaciones en FOREGROUND, BACKGROUND y KILLED STATE.
 *
 * USO (una sola vez en AppNavigator o en App.js tras autenticarse):
 *   const { expoPushToken } = usePushNotifications();
 *
 * FLUJO COMPLETO:
 *   1. Pide permisos de notificación
 *   2. Registra canales Android (Chat, Solicitudes, Ofertas, Sistema)
 *   3. Obtiene ExpoPushToken → lo guarda en el backend
 *   4. FOREGROUND: muestra notificación local + actualiza badge/stores
 *   5. BACKGROUND/KILLED: intercepta el tap → navega a la pantalla correcta
 *   6. Resetea el badge al volver al primer plano
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useNavigation } from '@react-navigation/native';

import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// Solo loguear en desarrollo
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

// ─── Handler global ────────────────────────────────────────────────────────
// Define ANTES de cualquier hook cómo se muestran las notificaciones en foreground.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data ?? {};
    // En foreground los chats propios se silencian si ya estamos en ese chat
    return {
      shouldShowAlert : true,
      shouldPlaySound : true,
      shouldSetBadge  : true,
      priority        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    {
      channelId:        'chat',
      name:             'Mensajes de Chat',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound:            'default',
      lightColor:       '#49C0BC',
      description:      'Mensajes de chat entre usuarios y profesionales',
    },
    {
      channelId:        'solicitudes',
      name:             'Solicitudes de Servicio',
      importance:       Notifications.AndroidImportance.HIGH,
      sound:            'default',
      lightColor:       '#49C0BC',
      description:      'Nuevas solicitudes y actualizaciones de estado',
    },
    {
      channelId:        'ofertas',
      name:             'Ofertas y Pagos',
      importance:       Notifications.AndroidImportance.DEFAULT,
      sound:            'default',
      description:      'Ofertas de profesionales y confirmaciones de pago',
    },
    {
      channelId:        'sistema',
      name:             'Sistema',
      importance:       Notifications.AndroidImportance.LOW,
      description:      'Actualizaciones de la app y alertas de sistema',
    },
  ];
  for (const ch of channels) {
    await Notifications.setNotificationChannelAsync(ch.channelId, ch);
  }
}

// ─── Hook principal ────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { user }    = useAuth();
  const { mode }    = useModeStore();
  const navigation  = useNavigation();
  const [expoPushToken, setExpoPushToken] = useState(null);

  const notifListener    = useRef(null);
  const responseListener = useRef(null);
  const appStateRef      = useRef(AppState.currentState);

  // ── Registrar dispositivo + guardar token ─────────────────────────────
  const registerDevice = useCallback(async () => {
    if (!Device.isDevice) return null;

    // Pedir / verificar permisos
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      __DEV_LOG__('[Push] Permisos denegados por el usuario.');
      return null;
    }

    // Crear canales Android
    await createAndroidChannels();

    // projectId desde app.json extra (o fallback al valor conocido)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'homecare-1582c';

    // Obtener token
    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    } catch (e) {
      __DEV_LOG__('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);

    // Enviar al backend
    await apiClient
      .put('/usuarios/push-token', { pushToken: token })
      .catch((e) => __DEV_LOG__('[Push] No se pudo guardar el token:', e.message));

    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data         = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;

      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';

      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', {
            solicitudId,
            destinatarioId,
            titulo,
            chatId,
          });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          // ViewOffers solo existe en modo usuario; en modo profesional redirigir a solicitudes
          if (isProf) {
            navigation.navigate('AvailableRequests', { solicitudId });
          } else {
            navigation.navigate('ViewOffers', { solicitudId });
          }
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          // ServiceTracking solo existe en UserModeStack; ignorar para profesionales
          if (isProf) return;
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        __DEV_LOG__('[Push] Error de navegación:', e.message);
      }
    },
    [navigation, mode],
  );

  // ── Efecto principal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const { incrementUnread } = useChatStore.getState();

    (async () => {
      await registerDevice();
      if (!mounted) return;

      // ── KILLED STATE: app estaba cerrada ───────────────────────────
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        // Pequeño delay para esperar que el navegador esté listo
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // ── FOREGROUND: notificación recibida con app abierta ─────────
      notifListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          const data = notification.request.content.data ?? {};
          // Actualizar badge local para chats
          if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
            incrementUnread?.();
          }
          // Programar notificación local si la app está en foreground y es un chat
          // (Expo ya la muestra automáticamente via setNotificationHandler)
        },
      );

      // ── BACKGROUND TAP: usuario toca notificación ────────────────
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        handleResponse,
      );
    })();

    // ── AppState: resetear badge al retomar el foco ───────────────
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        resetBadge();
      }
      appStateRef.current = nextState;
    });

    return () => {
      mounted = false;
      notifListener.current    && Notifications.removeNotificationSubscription(notifListener.current);
      responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
      appStateSub.remove();
    };
  }, [user?.id, registerDevice, handleResponse, resetBadge]);

  return { expoPushToken };
}

// ─── Utilidad: enviar notificación local ──────────────────────────────────
/**
 * scheduleLocalNotification({ title, body, data, channelId })
 * Dispara una notificación local inmediata. Útil para confirmaciones de acción.
 */
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null, // inmediata
  });
}



