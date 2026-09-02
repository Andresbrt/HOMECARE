/**
 * useChat — Real-time bidirectional chat hook
 * 100% Supabase Storage + Backend REST / STOMP WebSockets
 *
 * Manages:
 * - Carga inicial: API REST (/api/mensajes/solicitud/{id}) desde PostgreSQL
 * - Mensajes en tiempo real: STOMP WebSocket (wsClient) + Supabase Realtime broadcast
 * - Envío: WS/STOMP (optimista local + backend) y fallback REST
 * - Subida de imágenes: Supabase Storage
 * - Typing signal & Read receipts
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../config/supabase';
import apiClient from '../services/apiClient';
import { buildChatId } from '../services/chatService';
import { wsClient } from '../services/wsClient';
import useChatStore from '../store/chatStore';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

export function useChat(solicitudId, destinatarioId) {
  const { user } = useAuth();
  const {
    messages,
    setMessages,
    addMessage,
    markAllRead,
    updateLastMessage,
  } = useChatStore();

  const chatId       = solicitudId ? buildChatId(solicitudId) : null;
  const chatMessages = messages[solicitudId] || [];

  const [loading, setLoading]              = useState(true);
  const [sending, setSending]              = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingMore, setLoadingMore]      = useState(false);
  const [hasMore, setHasMore]              = useState(false);
  const [error, setError]                  = useState(null);

  const typingTimerRef = useRef(null);

  // ─── Carga inicial y suscripción en tiempo real ─────────────────────────────
  useEffect(() => {
    if (!solicitudId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    // 1. Cargar historial desde el Backend (PostgreSQL)
    const loadInitialMessages = async () => {
      try {
        const { data } = await apiClient.get(`/mensajes/solicitud/${solicitudId}`);
        if (isMounted && Array.isArray(data)) {
          setMessages(solicitudId, data);
          setHasMore(data.length >= PAGE_SIZE);
          markAllRead(solicitudId);
        }
      } catch (err) {
        __DEV_LOG__('[useChat] Error al cargar mensajes:', err.message);
        if (isMounted) setError('No se pudo cargar el chat');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialMessages();

    // 2. Conectar STOMP WebSocket
    wsClient.connect()
      .then(() => {
        if (!isMounted) return;
        // Suscribirse a mensajes de este chat
        wsClient.subscribe(`/topic/chat/${solicitudId}`, (newMsg) => {
          if (!newMsg) return;
          addMessage(solicitudId, newMsg);
          updateLastMessage(solicitudId, newMsg);
          if (String(newMsg.remitenteId) !== String(user?.id)) {
            wsClient.publish?.(`/app/chat/${solicitudId}/read`);
            markAllRead(solicitudId);
          }
        });
      })
      .catch((e) => {
        __DEV_LOG__('[useChat] WS warning (fallback a Supabase realtime):', e.message);
      });

    // 3. Suscripción complementaria vía Supabase Realtime Channel
    const channel = supabase.channel(`chat_${solicitudId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (isMounted && payload) {
          addMessage(solicitudId, payload);
          updateLastMessage(solicitudId, payload);
          if (String(payload.remitenteId) !== String(user?.id)) {
            markAllRead(solicitudId);
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [solicitudId]);

  // ─── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || !solicitudId) return;
    setLoadingMore(true);
    try {
      const { data } = await apiClient.get(`/mensajes/solicitud/${solicitudId}`);
      if (Array.isArray(data)) {
        setMessages(solicitudId, data);
      }
    } catch (e) {
      __DEV_LOG__('[useChat] loadMore error:', e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [solicitudId, hasMore, loadingMore, loading]);

  // ─── Enviar texto ──────────────────────────────────────────────────────────
  const sendText = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      const tempId = `temp_${Date.now()}`;

      // Optimistic local add
      const tempMsg = {
        id: tempId,
        remitenteId: user?.id,
        remitenteNombre: user?.nombre || 'Tú',
        contenido: trimmed,
        tipo: 'TEXTO',
        leido: false,
        createdAt: new Date().toISOString(),
        _temp: true,
      };
      addMessage(solicitudId, tempMsg);

      try {
        // Enviar por STOMP WebSocket
        wsClient.publish('/app/chat/send', {
          solicitudId,
          destinatarioId,
          contenido: trimmed,
          tipo: 'TEXTO',
        });

        // Broadcast por Supabase Realtime
        supabase.channel(`chat_${solicitudId}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: tempMsg,
        });

        // Persistir en backend vía REST
        await apiClient.post('/mensajes', {
          solicitudId,
          destinatarioId,
          contenido: trimmed,
          tipoMensaje: 'TEXTO',
        });
      } catch (err) {
        __DEV_LOG__('[useChat] Error al persistir mensaje:', err.message);
      } finally {
        setSending(false);
      }
    },
    [solicitudId, destinatarioId, user, sending],
  );

  // ─── Enviar imagen vía Supabase Storage ────────────────────────────────────
  const sendImage = useCallback(
    async (uri) => {
      setUploadingImage(true);
      try {
        // 1. Comprimir imagen
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
        );

        // 2. Subir a Supabase Storage
        const response = await fetch(compressed.uri);
        const blob = await response.blob();
        const filePath = `chat/${solicitudId}/${Date.now()}_${user?.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
          .from('evidencias')
          .getPublicUrl(filePath);

        const downloadUrl = urlData?.publicUrl || compressed.uri;

        // 3. Enviar por STOMP WS
        wsClient.publish('/app/chat/send', {
          solicitudId,
          destinatarioId,
          contenido: downloadUrl,
          tipo: 'IMAGEN',
          archivoUrl: downloadUrl,
        });

        // 4. Persistir en backend
        await apiClient.post('/mensajes', {
          solicitudId,
          destinatarioId,
          contenido: downloadUrl,
          tipoMensaje: 'IMAGEN',
          archivoUrl: downloadUrl,
        });

        // Optimistic local add
        addMessage(solicitudId, {
          id: `temp_img_${Date.now()}`,
          remitenteId: user?.id,
          contenido: downloadUrl,
          archivoUrl: downloadUrl,
          tipo: 'IMAGEN',
          leido: false,
          createdAt: new Date().toISOString(),
          _temp: true,
        });
      } catch (e) {
        __DEV_LOG__('[useChat] sendImage error:', e.message);
        throw e;
      } finally {
        setUploadingImage(false);
      }
    },
    [solicitudId, destinatarioId, user],
  );

  // ─── Pick image from library ──────────────────────────────────────────────
  const pickImageFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de galería denegado');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await sendImage(result.assets[0].uri);
    }
  }, [sendImage]);

  // ─── Take photo with camera ───────────────────────────────────────────────
  const takePhotoWithCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de cámara denegado');
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await sendImage(result.assets[0].uri);
    }
  }, [sendImage]);

  // ─── Send typing ──────────────────────────────────────────────────────────
  const sendTyping = useCallback(() => {
    wsClient.publish(`/app/chat/${solicitudId}/typing`);
  }, [solicitudId]);

  return {
    messages: chatMessages,
    loading,
    sending,
    uploadingImage,
    loadingMore,
    hasMore,
    error,
    sendText,
    sendImage,
    pickImageFromLibrary,
    takePhotoWithCamera,
    loadMore,
    sendTyping,
  };
}
