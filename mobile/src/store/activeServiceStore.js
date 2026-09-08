/**
 * activeServiceStore.js — Estado global persistente para el servicio activo en progreso
 * Resiliente a desconexión, pérdida de internet y cierre de la aplicación vía AsyncStorage.
 * Usado por Dashboard, Map, Chat y ActiveServiceTrackingScreen.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import useChatStore from './chatStore';

const STORAGE_KEY = '@homecare_active_service';

const useActiveServiceStore = create((set, get) => ({
  activeService: null,
  loading: false,
  error: null,
  initialized: false,

  // Inicializar cargando inmediatamente del almacenamiento local (offline-first)
  initFromStorage: async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && ['CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO'].includes(parsed.estado)) {
          set({ activeService: parsed, initialized: true });
          useChatStore.getState().setActiveService({
            solicitudId: parsed.solicitudId || parsed.id,
            destinatarioId: parsed.clienteId || parsed.usuarioId,
            titulo: parsed.clienteNombre || 'Cliente',
            chatId: parsed.solicitudId || parsed.id,
          });
          return parsed;
        }
      }
    } catch (_) {
      // Silencioso si falla storage
    }
    set({ initialized: true });
    return null;
  },

  setActiveService: (service) => {
    set({ activeService: service });
    if (service) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(service)).catch(() => {});
      useChatStore.getState().setActiveService({
        solicitudId: service.solicitudId || service.id,
        destinatarioId: service.clienteId || service.usuarioId,
        titulo: service.clienteNombre || 'Cliente',
        chatId: service.solicitudId || service.id,
      });
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  },

  clearActiveService: () => {
    set({ activeService: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    useChatStore.getState().clearActiveService();
  },

  fetchActiveService: async () => {
    // Si aún no se inicializó desde disco, intentarlo primero
    if (!get().initialized) {
      await get().initFromStorage();
    }

    set({ loading: true, error: null });
    try {
      const res = await apiClient.get('/servicios/activos');
      const list = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      
      // Tomamos el primer servicio activo (no COMPLETADO ni CANCELADO)
      const current = list.find((s) => 
        ['CONFIRMADO', 'EN_CAMINO', 'LLEGUE', 'EN_PROGRESO'].includes(s.estado)
      ) || null;

      if (current) {
        set({ activeService: current, loading: false });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
        useChatStore.getState().setActiveService({
          solicitudId: current.solicitudId || current.id,
          destinatarioId: current.clienteId,
          titulo: current.clienteNombre || 'Cliente',
          chatId: current.solicitudId || current.id,
        });
      } else {
        // Solo si el servidor responde exitosamente con 0 servicios activos, limpiamos
        set({ activeService: null, loading: false });
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        useChatStore.getState().clearActiveService();
      }

      return current;
    } catch (err) {
      // RESILIENCIA OFFLINE: Si falla la red o se va el internet, NO perdemos el servicio local guardado
      const cached = get().activeService;
      set({ loading: false, error: err.message });
      return cached;
    }
  },

  updateEstado: async (servicioId, nuevoEstado) => {
    // Actualización optimista local inmediata para evitar que se pierda
    const current = get().activeService;
    const optimista = current ? { ...current, estado: nuevoEstado } : null;
    if (optimista) {
      set({ activeService: optimista });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(optimista)).catch(() => {});
    }

    try {
      const res = await apiClient.put(`/servicios/${servicioId}/estado`, {
        estado: nuevoEstado,
      });

      const updated = res.data;
      const finalService = { ...(optimista || {}), ...updated, estado: nuevoEstado };
      
      set({ activeService: finalService });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalService)).catch(() => {});

      if (nuevoEstado === 'COMPLETADO' || nuevoEstado === 'CANCELADO') {
        get().clearActiveService();
      }

      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || err.message, offlineUpdated: true };
    }
  },
}));

// Iniciar lectura local de inmediato
useActiveServiceStore.getState().initFromStorage();

export default useActiveServiceStore;
