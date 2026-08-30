/**
 * useChat — Real-time bidirectional chat hook
 *
 * Manages:
 * - Carga inicial: Firestore onSnapshot con limitToLast(20)
 * - Paginación real: cursor endBefore para mensajes anteriores
 * - Envío: WS/STOMP (optimista local + backend)
 * - Typing signal (debounced)
 * - Read receipts
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  collection, query, orderBy, limitToLast,
  onSnapshot, getDocs, endBefore,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { buildChatId, enviarMensajeFirestore } from '../services/chatService';
import { wsClient } from '../services/wsClient';
import useChatStore from '../store/chatStore';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

/** Normaliza un QueryDocumentSnapshot de Firestore al formato interno */
function normalizeFirestoreMsg(doc) {
  const d = doc.data();
  const rawDate = d.creadoEn || d.timestamp || d.createdAt;
  return {
    id: doc.id,
    ...d,
    createdAt: rawDate?.toDate?.()?.toISOString() ?? (typeof rawDate === 'string' ? rawDate : new Date().toISOString()),
  };
}

export function useChat(solicitudId, destinatarioId) {
  const { user } = useAuth();
  const {
    messages,
    setMessages,
    prependMessages,
    addMessage,
    markAllRead,
    updateLastMessage,
  } = useChatStore();

  const chatId      = solicitudId ? buildChatId(solicitudId) : null;
  const chatMessages = messages[solicitudId] || [];

  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [error, setError]                 = useState(null);

  const oldestDocRef     = useRef(null);   // cursor Firestore para paginación
  const initialLoadDone  = useRef(false);  // evita sobrescribir al paginar
  const typingTimerRef   = useRef(null);
  const lastTypingSentRef = useRef(0);

  // ─── Firestore real-time listener (carga inicial + mensajes en vivo) ────────

  useEffect(() => {
    if (!chatId || !solicitudId) return;

    setLoading(true);
    setError(null);
    initialLoadDone.current = false;
    oldestDocRef.current    = null;

    let unsubWs = () => {};

    // ── Suscripción STOMP WebSocket en tiempo real ──
    wsClient.connect()
      .then(() => {
        unsubWs = wsClient.subscribe(`/topic/chat/${solicitudId}`, (incoming) => {
          if (incoming && incoming.id) {
            const normalized = {
              id: String(incoming.id),
              remitenteId: incoming.remitenteId,
              remitenteNombre: incoming.remitenteNombre || '',
              contenido: incoming.contenido,
              tipo: incoming.tipo || incoming.tipoMensaje || 'TEXTO',
              archivoUrl: incoming.archivoUrl,
              leido: incoming.leido || false,
              createdAt: incoming.createdAt || new Date().toISOString(),
            };
            addMessage(solicitudId, normalized);
            updateLastMessage(solicitudId, normalized);
          }
        });
      })
      .catch((e) =>
        __DEV_LOG__('[useChat] WS connect warning (send degraded):', e.message),
      );

    // ── Suscripción Firestore (Tiempo Real / Persistencia) ──
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsRef, limitToLast(PAGE_SIZE));

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snapshot) => {
        if (!initialLoadDone.current) {
          // ── Carga inicial: set completo de los últimos PAGE_SIZE mensajes ──
          const msgs = snapshot.docs.map(normalizeFirestoreMsg);
          setMessages(solicitudId, msgs);
          // doc[0] en orden asc = el más antiguo cargado → cursor paginación
          if (snapshot.docs.length > 0) {
            oldestDocRef.current = snapshot.docs[0];
          }
          setHasMore(snapshot.docs.length >= PAGE_SIZE);
          setLoading(false);
          markAllRead(solicitudId);
          initialLoadDone.current = true;
        } else {
          // ── Mensajes nuevos: solo procesar el delta tipo 'added' ──────────
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const msg = normalizeFirestoreMsg(change.doc);
              addMessage(solicitudId, msg);
              updateLastMessage(solicitudId, msg);
              // Auto-mark read solo si el mensaje NO es mío
              if (String(msg.remitenteId) !== String(user?.id)) {
                wsClient.publish?.(`/app/chat/${solicitudId}/read`);
                markAllRead(solicitudId);
              }
            }
          });
        }
      },
      (err) => {
        __DEV_LOG__('[useChat] onSnapshot error:', err.message);
        setError('No se pudo cargar el chat');
        setLoading(false);
      },
    );

    return () => {
      unsub();
      try { unsubWs(); } catch (_) {}
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [chatId, solicitudId]);

  // ─── Load more (paginación cursor hacia atrás) ───────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || !chatId || !oldestDocRef.current) return;
    setLoadingMore(true);
    try {
      const msgsRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        msgsRef,
        endBefore(oldestDocRef.current),
        limitToLast(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      const olderMsgs = snap.docs.map(normalizeFirestoreMsg);
      prependMessages(solicitudId, olderMsgs);
      // Avanzar el cursor hacia los mensajes aún más antiguos
      if (snap.docs.length > 0) {
        oldestDocRef.current = snap.docs[0];
      }
      setHasMore(snap.docs.length >= PAGE_SIZE);
    } catch (e) {
      __DEV_LOG__('[useChat] loadMore error:', e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, solicitudId, hasMore, loadingMore, loading]);

  // ─── Send text ────────────────────────────────────────────────────────────

  const sendText = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      try {
        // Optimistic: add locally immediately
        const tempMsg = {
          id: `temp_${Date.now()}`,
          remitenteId: user?.id,
          remitenteNombre: user?.nombre || user?.nome || 'Tú',
          contenido: trimmed,
          tipo: 'TEXTO',
          leido: false,
          createdAt: new Date().toISOString(),
          _temp: true,
        };
        addMessage(solicitudId, tempMsg);

        // 1. Envío WebSocket STOMP
        wsClient.publish('/app/chat/send', {
          solicitudId,
          destinatarioId,
          contenido: trimmed,
          tipo: 'TEXTO',
        });

        // 2. Envío Firestore (Garantiza entrega a clientes en tiempo real)
        if (chatId) {
          enviarMensajeFirestore({
            chatId,
            remitenteId: user?.id,
            remitenteNombre: user?.nombre || 'Usuario',
            contenido: trimmed,
            tipo: 'TEXTO',
          }).catch((err) => __DEV_LOG__('[useChat] Firestore send fallback error:', err));
        }
      } finally {
        setSending(false);
      }
    },
    [solicitudId, destinatarioId, user, sending, chatId],
  );

  // ─── Send image ───────────────────────────────────────────────────────────

  const sendImage = useCallback(
    async (uri) => {
      setUploadingImage(true);
      try {
        // 1. Compress to max 1080px wide, 75% quality
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
        );

        // 2. Upload to Firebase Storage
        const blob = await (await fetch(compressed.uri)).blob();
        const imgRef = storageRef(
          storage,
          `chat-images/${solicitudId}/${Date.now()}_${user?.id}.jpg`,
        );
        await uploadBytes(imgRef, blob, { contentType: 'image/jpeg' });
        const downloadUrl = await getDownloadURL(imgRef);

        // 3. Send URL via WebSocket
        wsClient.publish('/app/chat/send', {
          solicitudId,
          destinatarioId,
          contenido: downloadUrl,
          tipo: 'IMAGEN',
          archivoUrl: downloadUrl,
        });

        // 4. Send to Firestore
        if (chatId) {
          enviarMensajeFirestore({
            chatId,
            remitenteId: user?.id,
            remitenteNombre: user?.nombre || 'Usuario',
            contenido: downloadUrl,
            tipo: 'IMAGEN',
            archivoUrl: downloadUrl,
          }).catch((err) => __DEV_LOG__('[useChat] Firestore image error:', err));
        }

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

  const takePhoto = useCallback(async () => {
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

  // ─── Typing indicator (debounced, max 1 event / 1.5s) ───────────────────

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
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
    takePhoto,
    loadMore,
    notifyTyping,
    reload: () => {
      pageRef.current = 0;
      setLoading(true);
      loadHistory(0);
    },
  };
}
