/**
 * chatStore — Zustand store for chat state
 *
 * Holds in-memory chat data: messages, typing status, conversations list,
 * and unread counts. Scoped to the session (no persistence to disk).
 */
import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  // ── Map<solicitudId:number, Message[]> ────────────────────────────────────
  messages: {},

  // ── Map<solicitudId:number, boolean> ─────────────────────────────────────
  typingStatus: {},

  // ── Conversation[] ────────────────────────────────────────────────────────
  conversations: [],

  // ── Total unread across all conversations ─────────────────────────────────
  unreadTotal: 0,

  // ── Servicio activo en curso { solicitudId, destinatarioId, titulo, chatId } ──
  // Usado por DashboardScreen y MapScreen para mostrar el FAB "Chatear"
  activeService: null,

  // ── Online presence Map<userId:string, {online:boolean,lastSeen:Date}> ────
  presence: {},

  // ── Reactions Map<msgId:string, Map<emoji:string, userId[]>> ─────────────
  // Local-only (optimistic, not persisted to backend)
  reactions: {},

  // ─────────────────────────────────────────────────────────────────────────
  // Messages
  // ─────────────────────────────────────────────────────────────────────────

  setMessages: (solicitudId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [solicitudId]: msgs } })),

  prependMessages: (solicitudId, olderMsgs) =>
    set((s) => {
      const existing = s.messages[solicitudId] || [];
      // Deduplicate by id
      const ids = new Set(existing.map((m) => m.id));
      const fresh = olderMsgs.filter((m) => !ids.has(m.id));
      return { messages: { ...s.messages, [solicitudId]: [...fresh, ...existing] } };
    }),

  addMessage: (solicitudId, msg) =>
    set((s) => {
      const existing = s.messages[solicitudId] || [];
      if (existing.some((m) => m.id === msg.id)) return {}; // duplicate
      return { messages: { ...s.messages, [solicitudId]: [...existing, msg] } };
    }),

  // Optimistic: replace temp id with real id from server
  confirmMessage: (solicitudId, tempId, confirmedMsg) =>
    set((s) => {
      const existing = s.messages[solicitudId] || [];
      return {
        messages: {
          ...s.messages,
          [solicitudId]: existing.map((m) => (m.id === tempId ? confirmedMsg : m)),
        },
      };
    }),

  markAllRead: (solicitudId) =>
    set((s) => {
      const existing = s.messages[solicitudId] || [];
      return {
        messages: {
          ...s.messages,
          [solicitudId]: existing.map((m) => ({ ...m, leido: true })),
        },
      };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Typing
  // ─────────────────────────────────────────────────────────────────────────

  setTyping: (solicitudId, isTyping) =>
    set((s) => ({ typingStatus: { ...s.typingStatus, [solicitudId]: isTyping } })),

  // ─────────────────────────────────────────────────────────────────────────
  // Conversations list
  // ─────────────────────────────────────────────────────────────────────────

  setConversations: (conversations) =>
    set({
      conversations,
      unreadTotal: conversations.reduce((acc, c) => acc + (c.mensajesNoLeidos || 0), 0),
    }),

  updateLastMessage: (solicitudId, msg) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.solicitudId === solicitudId
          ? {
              ...c,
              ultimoMensaje: msg.tipo === 'IMAGEN' ? '📷 Foto' : msg.contenido,
              ultimoMensajeAt: msg.createdAt,
              mensajesNoLeidos: (c.mensajesNoLeidos || 0) + 1,
            }
          : c,
      ),
    })),

  markConversationRead: (solicitudId) =>
    set((s) => {
      const conv = s.conversations.find((c) => c.solicitudId === solicitudId);
      const delta = conv?.mensajesNoLeidos || 0;
      return {
        conversations: s.conversations.map((c) =>
          c.solicitudId === solicitudId ? { ...c, mensajesNoLeidos: 0 } : c,
        ),
        unreadTotal: Math.max(0, s.unreadTotal - delta),
      };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Online presence (populated by useOnlineStatus hook via Firestore)
  // ─────────────────────────────────────────────────────────────────────────

  setPresence: (userId, data) =>
    set((s) => ({ presence: { ...s.presence, [userId]: data } })),

  // ─────────────────────────────────────────────────────────────────────────
  // Reactions (local-only, optimistic)
  // ─────────────────────────────────────────────────────────────────────────

  toggleReaction: (msgId, emoji, userId) =>
    set((s) => {
      const prev = s.reactions[msgId] || {};
      const users = prev[emoji] || [];
      const hasIt = users.includes(userId);
      return {
        reactions: {
          ...s.reactions,
          [msgId]: {
            ...prev,
            [emoji]: hasIt
              ? users.filter((u) => u !== userId)
              : [...users, userId],
          },
        },
      };
    }),

  getReactions: (msgId) => get().reactions[msgId] || {},

  // ── Servicio activo ────────────────────────────────────────────────────────
  setActiveService: (service) => set({ activeService: service }),
  clearActiveService: () => set({ activeService: null }),

  // Incremento optimista de badge (ej. push en foreground)
  incrementUnread: () => set((s) => ({ unreadTotal: s.unreadTotal + 1 })),
}));

export default useChatStore;
