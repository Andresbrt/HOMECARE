/**
 * chatService — Capa de abstracción para el ciclo de vida del chat
 * 100% Supabase / Backend REST + STOMP WebSocket (sin dependencias de Firebase)
 *
 * Responsabilidades:
 *  1. Inicializar y activar chats
 *  2. Enviar y obtener mensajes vía API REST y WebSockets
 *  3. Enviar notificaciones push a través de Expo Push API / Backend
 */

import apiClient from './apiClient';
import { supabase } from '../config/supabase';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** chatId determinista */
export const buildChatId = (solicitudId) => `chat_${solicitudId}`;

// ─── 1. Inicializar chat ─────────────────────────────────────────────────────

export async function inicializarChat({ solicitudId }) {
  return buildChatId(solicitudId);
}

// ─── 2. Activar chat ─────────────────────────────────────────────────────────

export async function activarChat({
  solicitudId,
  profesionalId,
  profesionalNombre,
  usuarioId,
  usuarioPushToken,
}) {
  const chatId = buildChatId(solicitudId);

  try {
    // Mensaje de sistema para romper el hielo vía backend
    await apiClient.post('/mensajes', {
      solicitudId,
      destinatarioId: usuarioId,
      contenido: `¡Hola! Soy ${profesionalNombre}. Estoy listo para atenderte 🤝`,
      tipoMensaje: 'TEXTO',
    });
  } catch (e) {
    __DEV_LOG__('[chatService] Error al enviar mensaje inicial:', e.message);
  }

  // Notificar al profesional que el usuario aceptó su oferta
  if (usuarioPushToken) {
    await enviarPushNotificacion({
      token: usuarioPushToken,
      titulo: '✅ ¡Oferta aceptada!',
      cuerpo: 'Tu oferta fue aceptada. Abre el chat para coordinar con el cliente.',
      data: { screen: 'Chat', solicitudId: String(solicitudId), destinatarioId: String(usuarioId) },
    });
  }

  return chatId;
}

// ─── 3. Enviar mensaje ───────────────────────────────────────────────────────

export async function enviarMensajeFirestore({
  solicitudId,
  destinatarioId,
  contenido,
  tipo = 'TEXTO',
  archivoUrl = null,
}) {
  try {
    const { data } = await apiClient.post('/mensajes', {
      solicitudId,
      destinatarioId,
      contenido,
      tipoMensaje: tipo,
      archivoUrl,
    });
    return data?.id || String(Date.now());
  } catch (e) {
    __DEV_LOG__('[chatService] Error enviando mensaje:', e.message);
    throw e;
  }
}

// ─── 4. Escuchar mensajes (Supabase Realtime Channel) ────────────────────────

export function escucharMensajes(chatId, onMessages) {
  const channel = supabase.channel(`chat_${chatId}`)
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      if (payload) {
        onMessages([payload]);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── 5. Obtener datos del chat ───────────────────────────────────────────────

export async function obtenerChat(solicitudId) {
  try {
    const { data } = await apiClient.get(`/mensajes/solicitud/${solicitudId}`);
    return {
      chatId: buildChatId(solicitudId),
      solicitudId,
      mensajes: data || [],
    };
  } catch (e) {
    __DEV_LOG__('[chatService] Error obteniendo chat:', e.message);
    return null;
  }
}

// ─── 6. Marcar mensajes como leídos ──────────────────────────────────────────

export async function marcarLeidos(solicitudId) {
  try {
    await apiClient.put(`/mensajes/solicitud/${solicitudId}/leer-todos`);
  } catch (e) {
    __DEV_LOG__('[chatService] Error al marcar leídos:', e.message);
  }
}

// ─── 7. Push Notification vía Expo Push API ─────────────────────────────────

export async function enviarPushNotificacion({ token, titulo, cuerpo, data = {} }) {
  if (!token) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: titulo,
        body: cuerpo,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });
  } catch (e) {
    __DEV_LOG__('[chatService] Error enviando push:', e.message);
  }
}
