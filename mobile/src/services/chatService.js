/**
 * chatService — Capa de abstracción para el ciclo de vida del chat
 *
 * Responsabilidades:
 *  1. Crear / obtener el documento de chat en Firestore
 *  2. Activar el chat cuando el profesional acepta la solicitud
 *  3. Guardar / escuchar mensajes en tiempo real (onSnapshot)
 *  4. Enviar notificación push vía REST al backend (que delega a FCM)
 *
 * Diseño:
 *  - chatId  = string compuesto "solicitud_{solicitudId}"
 *    → predecible desde cualquier pantalla sin query extra
 *  - Se usa Firestore solo para mensajes en tiempo real y presencia.
 *    El historial frío vive en el backend REST (ya implementado).
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import apiClient from './apiClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** chatId determinista — nunca necesitas guardarlo en otro lado */
export const buildChatId = (solicitudId) => `chat_${solicitudId}`;

// ─── 1. Inicializar chat (llama CreateRequestScreen) ─────────────────────────

/**
 * Crea o reutiliza el documento de chat en Firestore.
 * Se llama inmediatamente después de POST /solicitudes.
 *
 * @param {object} params
 * @param {number|string} params.solicitudId  - ID de la solicitud recién creada
 * @param {number|string} params.usuarioId    - ID del usuario que solicita
 * @param {string}        params.tituloServicio
 * @returns {string} chatId
 */
export async function inicializarChat({ solicitudId, usuarioId, tituloServicio }) {
  const chatId = buildChatId(solicitudId);
  const chatRef = doc(db, 'chats', chatId);

  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      solicitudId: String(solicitudId),
      participants: [String(usuarioId)],   // profesional se agrega al aceptar
      status: 'pending',                   // pending → active cuando profesional acepta
      tituloServicio: tituloServicio || 'Servicio HomeCarE',
      creadoEn: serverTimestamp(),
      ultimoMensaje: null,
      usuarioId: String(usuarioId),
      profesionalId: null,
    });
  }

  return chatId;
}

// ─── 2. Activar chat (llama ViewOffersScreen al aceptar oferta) ───────────────

/**
 * Pone el chat en estado 'active' y agrega el profesionalId.
 * Envía un mensaje de sistema "Conexión establecida 🤝" para abrir el hilo.
 *
 * @param {object} params
 * @param {number|string} params.solicitudId
 * @param {number|string} params.profesionalId
 * @param {string}        params.profesionalNombre
 * @param {number|string} params.usuarioId           - para el push
 * @param {string}        params.usuarioPushToken    - expo push token del usuario
 */
export async function activarChat({
  solicitudId,
  profesionalId,
  profesionalNombre,
  usuarioId,
  usuarioPushToken,
}) {
  const chatId = buildChatId(solicitudId);
  const chatRef = doc(db, 'chats', chatId);

  // Actualizar documento principal
  await updateDoc(chatRef, {
    status: 'active',
    profesionalId: String(profesionalId),
    participants: [String(usuarioId), String(profesionalId)],
    activadoEn: serverTimestamp(),
  });

  // Mensaje de sistema para romper el hielo
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    tipo: 'SISTEMA',
    contenido: `¡Hola! Soy ${profesionalNombre}. Estoy listo para atenderte 🤝`,
    remitenteId: String(profesionalId),
    remitenteNombre: profesionalNombre,
    leido: false,
    creadoEn: serverTimestamp(),
  });

  // Notificar al usuario que el profesional aceptó
  if (usuarioPushToken) {
    await enviarPushNotificacion({
      token: usuarioPushToken,
      titulo: '✅ ¡Oferta aceptada!',
      cuerpo: `${profesionalNombre} aceptó tu solicitud. Abre el chat para coordinar.`,
      data: { screen: 'UserChat', solicitudId: String(solicitudId), destinatarioId: String(profesionalId) },
    });
  }

  return chatId;
}

// ─── 3. Enviar mensaje en tiempo real (Firestore) ────────────────────────────

/**
 * Escribe un mensaje en la subcolección chats/{chatId}/messages.
 * El hook useChat ya maneja WS; este método es el canal Firestore (tiempo real).
 *
 * @returns {string} ID del mensaje creado
 */
export async function enviarMensajeFirestore({
  chatId,
  remitenteId,
  remitenteNombre,
  contenido,
  tipo = 'TEXTO',   // 'TEXTO' | 'IMAGEN' | 'SISTEMA'
  archivoUrl = null,
}) {
  const msgRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
    remitenteId: String(remitenteId),
    remitenteNombre: remitenteNombre || '',
    contenido,
    tipo,
    archivoUrl,
    leido: false,
    creadoEn: serverTimestamp(),
  });

  // Actualizar último mensaje en el doc padre (para ChatListScreen)
  await updateDoc(doc(db, 'chats', chatId), {
    ultimoMensaje: {
      contenido: tipo === 'IMAGEN' ? '📷 Imagen' : contenido,
      creadoEn: serverTimestamp(),
      remitenteId: String(remitenteId),
    },
  });

  return msgRef.id;
}

// ─── 4. Escuchar mensajes en tiempo real ─────────────────────────────────────

/**
 * Suscripción onSnapshot para los últimos 50 mensajes.
 * Devuelve la función de "unsubscribe".
 *
 * @param {string}   chatId
 * @param {Function} onMessages  - callback(Message[])
 * @returns {Function} unsubscribe
 */
export function escucharMensajes(chatId, onMessages) {
  const msgsRef = collection(db, 'chats', chatId, 'messages');
  const q = query(msgsRef, orderBy('creadoEn', 'asc'), limit(50));

  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        // Normalizar timestamp → ISO string para compatibilidad con ChatScreen
        creadoEn: d.data().creadoEn?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        fechaEnvio: d.data().creadoEn?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      }));
      onMessages(msgs);
    },
    (err) => console.error('[chatService] onSnapshot error:', err.message),
  );
}

// ─── 5. Obtener datos del chat (para verificar si ya existe) ──────────────────

export async function obtenerChat(solicitudId) {
  const chatId = buildChatId(solicitudId);
  const snap = await getDoc(doc(db, 'chats', chatId));
  return snap.exists() ? { chatId, ...snap.data() } : null;
}

// ─── 6. Marcar mensajes como leídos ──────────────────────────────────────────

export async function marcarLeidos(chatId, userId) {
  // Batch update: solo los no leídos del otro participante
  // Para mantener bajo el costo de escrituras, delegamos al backend REST
  // que ya tiene PUT /mensajes/solicitud/{id}/leer-todos
  // Aquí solo actualizamos el contador local del doc padre
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      [`noLeidos_${userId}`]: 0,
    });
  } catch (_) {
    // No crítico si falla
  }
}

// ─── 7. Push Notification (llama al backend que delega a FCM) ────────────────

/**
 * Envía push notification a través del backend Spring Boot.
 * El backend tiene un endpoint POST /notificaciones/push que recibe
 * el token y el payload, luego usa Firebase Admin SDK para enviarlo.
 *
 * Si prefieres llamar directamente a Expo Push API, usa la alternativa comentada.
 */
export async function enviarPushNotificacion({ token, titulo, cuerpo, data = {} }) {
  if (!token) return;

  try {
    // ── Opción A: Vía backend propio (recomendado — evita exponer claves) ──
    await apiClient.post('/notificaciones/push', {
      token,
      titulo,
      cuerpo,
      data,
    });
  } catch (e) {
    // ── Opción B: Expo Push API directamente (fallback en dev) ──────────────
    // Solo funciona con tokens "ExponentPushToken[...]"
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
    }).catch(() => {}); // Fallo silencioso en push — nunca romper el flujo principal
  }
}
