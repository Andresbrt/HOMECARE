import React, { createContext, useContext } from 'react';

/**
 * NotificationContext — módulo reducido (legacy eliminado).
 *
 * El manejo real de notificaciones push está en:
 *   src/hooks/usePushNotifications.js  ← canónico (FCM + canales Android + navegación)
 *
 * Se eliminó el cuerpo del NotificationProvider para evitar:
 *  - Doble registro de dispositivo (notificationService legacy + usePushNotifications)
 *  - Triple setNotificationHandler (aquí + notificationService + usePushNotifications)
 *
 * NotificationProvider se mantiene como pass-through para compatibilidad con App.js.
 * useNotifications() devuelve null (sin consumidores activos).
 */

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

// Pass-through: no registra dispositivo ni configura listeners duplicados.
export const NotificationProvider = ({ children }) => children;
