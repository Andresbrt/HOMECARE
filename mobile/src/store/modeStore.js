/**
 * ModeStore — Zustand + AsyncStorage
 * Controla el modo activo: 'usuario' | 'profesional'
 * Persiste el modo entre reinicios de la app con AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useModeStore = create(
  persist(
    (set) => ({
      /** Modo activo: 'usuario' | 'profesional' */
      mode: 'usuario',

      /**
       * Cambia el modo activo.
       * Al llamar esto desde DrawerContent, AppNavigator re-renderiza
       * y monta la pila correspondiente de manera automática.
       * @param {'usuario' | 'profesional'} newMode
       */
      setMode: (newMode) => set({ mode: newMode }),

      /** Alterna entre los dos modos. Útil para botones toggle. */
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'usuario' ? 'profesional' : 'usuario',
        })),
    }),
    {
      name: 'homecare-mode',                          // clave en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage), // backend persistente
    },
  ),
);

export default useModeStore;

/*
 * INSTRUCCIONES DE USO
 * ─────────────────────────────────────────────────────────────────────────────
 * Importar en cualquier componente:
 *   import useModeStore from '../../store/modeStore';
 *   const { mode, setMode, toggleMode } = useModeStore();
 *
 * Cambiar a modo usuario (va directo al UserMap):
 *   setMode('usuario');
 *
 * Cambiar a modo profesional (va directo al Dashboard):
 *   setMode('profesional');
 *
 * El modo se persiste automáticamente: si el usuario cierra la app y la
 * vuelve a abrir, quedará en el mismo modo en que la dejó.
 */
