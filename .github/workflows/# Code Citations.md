# Code Citations

## License: desconocido
https://github.com/nihal-05/ri-amm/blob/f700532e02d98916a02de3d3dea9c7a77c3bef3b/src/App.tsx

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
      }
    },
    [navigation, mode],
  );

  // ── Efecto principal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id
```


## License: desconocido
https://github.com/nihal-05/ri-amm/blob/f700532e02d98916a02de3d3dea9c7a77c3bef3b/src/App.tsx

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
      }
    },
    [navigation, mode],
  );

  // ── Efecto principal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id
```


## License: desconocido
https://github.com/nihal-05/ri-amm/blob/f700532e02d98916a02de3d3dea9c7a77c3bef3b/src/App.tsx

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
      }
    },
    [navigation, mode],
  );

  // ── Efecto principal ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
```


## License: GPL-3.0
https://github.com/tuffgniuz/solomon/blob/4373d9e4323bee323862c18d659775953ae630f4/champ-api/docs/asvs/4.0.3/V2.1.8.md

```
Todo correcto. Aquí está el código completo de cada archivo:

---

## `mobile/src/hooks/usePushNotifications.js` — mejorado

```js
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

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import useChatStore from '../store/chatStore';
import apiClient from '../services/apiClient';

// ─── Handler global ────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert : true,
    shouldPlaySound : true,
    shouldSetBadge  : true,
    priority        : Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Canales Android ───────────────────────────────────────────────────────
async function createAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { channelId: 'chat',        name: 'Mensajes de Chat',         importance: Notifications.AndroidImportance.HIGH,    vibrationPattern: [0,250,250,250], sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'solicitudes', name: 'Solicitudes de Servicio',  importance: Notifications.AndroidImportance.HIGH,    sound: 'default', lightColor: '#49C0BC' },
    { channelId: 'ofertas',     name: 'Ofertas y Pagos',          importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' },
    { channelId: 'sistema',     name: 'Sistema',                  importance: Notifications.AndroidImportance.LOW },
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

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await createAndroidChannels();

    let tokenData;
    try {
      tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'homecare-1582c' });
    } catch (e) {
      console.warn('[Push] Error obteniendo token:', e.message);
      return null;
    }
    const token = tokenData.data;
    setExpoPushToken(token);
    await apiClient.put('/usuarios/push-token', { pushToken: token }).catch(() => {});
    return token;
  }, []);

  // ── Resetear badge ────────────────────────────────────────────────────
  const resetBadge = useCallback(async () => {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  // ── Navegar al tocar una notificación ─────────────────────────────────
  const handleResponse = useCallback(
    (response) => {
      const data = response?.notification?.request?.content?.data ?? {};
      const { click_action, screen, solicitudId, destinatarioId, chatId, titulo = 'Chat' } = data;
      const isChatScreen = click_action === 'OPEN_CHAT' || screen === 'Chat' || screen === 'UserChat';
      const isProf = mode === 'profesional';
      try {
        if (isChatScreen) {
          navigation.navigate(isProf ? 'Chat' : 'UserChat', { solicitudId, destinatarioId, titulo, chatId });
        } else if (click_action === 'VIEW_OFFER' || screen === 'ViewOffers') {
          navigation.navigate('ViewOffers', { solicitudId });
        } else if (click_action === 'OPEN_TRACKING' || screen === 'ServiceTracking') {
          navigation.navigate('ServiceTracking', { solicitudId });
        } else if (click_action === 'OPEN_REQUEST' || screen === 'AvailableRequests') {
          navigation.navigate('AvailableRequests', { solicitudId });
        } else if (screen) {
          navigation.navigate(screen, { solicitudId, destinatarioId, titulo });
        }
      } catch (e) {
        console.warn('[Push] Error de navegación:', e.message);
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

      // KILLED STATE: app estaba cerrada
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && mounted) {
        setTimeout(() => handleResponse(lastResponse), 400);
      }

      // FOREGROUND: notificación con app abierta
      notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data ?? {};
        if (data.click_action === 'OPEN_CHAT' || data.screen === 'Chat' || data.screen === 'UserChat') {
          incrementUnread?.();
        }
      });

      // BACKGROUND TAP: usuario toca la notificación
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    // Resetear badge al retomar el foco
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

// ─── Utilidad: notificación local inmediata ───────────────────────────────
export async function scheduleLocalNotification({ title, body, data = {}, channelId = 'sistema' }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, data, sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  });
}
```

---

## `mobile/src/services/authService.js` — métodos OTP añadidos

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/auth`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/login', { email, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    firebaseLogin: async (firebaseToken, extraData = {}) => {
        const response = await api.post('/firebase-login', { firebaseToken, ...extraData });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/registro', userData);
        return response.data;
    },

    forgotPassword: async (email) => {
        return await api.post('/forgot-password', { email });
    },

    resetPassword: async (token, newPassword) => {
        return await api.post('/reset-password', { token, newPassword });
    },

    verifyEmail: async (token) => {
        return await api.get(`/verify-email?token=${token}`);
    },

    sendOTP: async (email) => {
        const response = await api.post('/send-otp', { email });
        return response.data;
    },

    verifyOTP: async (email, codigo) => {
        const response = await api.post('/verify-otp', { email, codigo });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    // ── RECUPERACIÓN CON OTP ────────────────────────────────────────────
    sendForgotPasswordOTP: async (email) => {
        const response = await api.post('/forgot-password-otp', { email });
        return response.data;
    },

    verifyForgotPasswordOTP: async (email, code) => {
        const response = await api.post('/verify-forgot-password-otp', { email, codigo: code });
        return response.data;
    },

    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await api.post('/reset-password-otp', {
            email,
            codigo: code,
            nuevaContrasena: newPassword,
        });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },
};
```

---

## `mobile/src/services/adminService.js` — archivo nuevo

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../config/api';

const api = axios.create({
    baseURL: `${BASE_API_URL}/admin`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error),
);

export const adminService = {
    verifyPin: async (pin) => {
        const response = await api.post('/verify-pin', { pin });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/estadisticas');
        return response.data;
    },
    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/usuarios', { params: { page, size } });
        return response.data;
    },
    getProfessionals: async (page = 0, size = 20) => {
        const response = await api.get('/profesionales', { params: { page, size } });
        return response.data;
    },
    getRecentRequests: async (estado = null) => {
        const params = estado ? { estado } : {};
        const response = await api.get('/solicitudes', { params });
        return response.data;
    },
    toggleUserBlock: async (userId, blocked) => {
        const response = await api.patch(`/usuarios/${userId}/bloquear`, { bloqueado: blocked });
        return response.data;
    },
    toggleProfessionalApproval: async (profId, aprobado) => {
        const response = await api.patch(`/profesionales/${profId}/aprobar`, { aprobado });
        return response.data;
    },
};
```

---

## `mobile/src/screens/auth/ForgotPasswordScreen.js` — pantalla nueva

```js
/**
 * ForgotPasswordScreen — Recuperación de contraseña en 3 pasos
 * Paso 1: Ingresa email → envía OTP
 * Paso 2: Ingresa código de 4 dígitos
 * Paso 3: Nueva contraseña + confirmación
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  if (password.length >= 12
```

