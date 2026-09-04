import useChatStore from '../../src/store/chatStore';

describe('chatStore — Zustand Store de Chat y Mensajería Realtime', () => {
  beforeEach(() => {
    // Resetear store antes de cada prueba
    useChatStore.setState({
      messages: {},
      typingStatus: {},
      conversations: [],
      unreadTotal: 0,
      activeService: null,
      presence: {},
      reactions: {},
    });
  });

  it('debe agregar mensajes a una solicitud y evitar duplicados por ID', () => {
    const solicitudId = 101;
    const msg1 = { id: 'm1', texto: 'Hola, ¿estás disponible?', emisorId: 1 };
    const msg2 = { id: 'm2', texto: 'Sí, claro, voy en camino', emisorId: 2 };

    useChatStore.getState().addMessage(solicitudId, msg1);
    expect(useChatStore.getState().messages[solicitudId]).toHaveLength(1);

    useChatStore.getState().addMessage(solicitudId, msg2);
    expect(useChatStore.getState().messages[solicitudId]).toHaveLength(2);

    // Intento de agregar duplicado
    useChatStore.getState().addMessage(solicitudId, msg1);
    expect(useChatStore.getState().messages[solicitudId]).toHaveLength(2);
  });

  it('debe confirmar mensajes optimistas reemplazando tempId con el id del servidor', () => {
    const solicitudId = 101;
    const tempMsg = { id: 'temp-123', texto: 'Mensaje optimista', pending: true };
    const confirmedMsg = { id: 'srv-456', texto: 'Mensaje optimista', pending: false };

    useChatStore.getState().addMessage(solicitudId, tempMsg);
    expect(useChatStore.getState().messages[solicitudId][0].id).toBe('temp-123');

    useChatStore.getState().confirmMessage(solicitudId, 'temp-123', confirmedMsg);
    const msgs = useChatStore.getState().messages[solicitudId];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('srv-456');
    expect(msgs[0].pending).toBe(false);
  });

  it('debe actualizar el estado de digitación (typing indicator)', () => {
    const solicitudId = 101;

    useChatStore.getState().setTyping(solicitudId, true);
    expect(useChatStore.getState().typingStatus[solicitudId]).toBe(true);

    useChatStore.getState().setTyping(solicitudId, false);
    expect(useChatStore.getState().typingStatus[solicitudId]).toBe(false);
  });

  it('debe actualizar el servicio activo para el botón flotante de chat', () => {
    const serviceInfo = {
      solicitudId: 55,
      destinatarioId: 10,
      titulo: 'Colorimetría Balayage',
    };

    useChatStore.getState().setActiveService(serviceInfo);
    expect(useChatStore.getState().activeService).toEqual(serviceInfo);

    useChatStore.getState().clearActiveService();
    expect(useChatStore.getState().activeService).toBeNull();
  });

  it('debe actualizar la presencia online de usuarios', () => {
    const userId = 'user-abc';
    useChatStore.getState().setPresence(userId, { online: true, lastSeen: new Date() });
    expect(useChatStore.getState().presence[userId].online).toBe(true);

    useChatStore.getState().setPresence(userId, { online: false, lastSeen: new Date() });
    expect(useChatStore.getState().presence[userId].online).toBe(false);
  });

  it('debe gestionar reacciones a mensajes de forma optimista', () => {
    const msgId = 'msg-1';
    const emoji = '❤️';
    const userId = 'user-1';

    useChatStore.getState().toggleReaction(msgId, emoji, userId);
    expect(useChatStore.getState().getReactions(msgId)[emoji]).toContain(userId);

    // Toggle para quitar la reacción
    useChatStore.getState().toggleReaction(msgId, emoji, userId);
    expect(useChatStore.getState().getReactions(msgId)[emoji]).not.toContain(userId);
  });

  it('debe incrementar el contador global de no leídos', () => {
    expect(useChatStore.getState().unreadTotal).toBe(0);
    useChatStore.getState().incrementUnread();
    expect(useChatStore.getState().unreadTotal).toBe(1);
  });
});
