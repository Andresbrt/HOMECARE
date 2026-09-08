/**
 * useOnlineStatus — Supabase Realtime Presence system
 * 100% Supabase (sin dependencias de Firestore)
 *
 * Transmite el estado en línea del usuario mediante el canal de presencia de Supabase
 * y escucha la presencia del otro participante.
 */
import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import useChatStore from '../store/chatStore';

export function useOnlineStatus(otherUserId) {
  const { user } = useAuth();
  const { setPresence } = useChatStore();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('online_presence', {
      config: {
        presence: {
          key: String(user.id),
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (otherUserId && state[String(otherUserId)]) {
          const presences = state[String(otherUserId)];
          const lastPresence = presences[presences.length - 1];
          setPresence(String(otherUserId), {
            online: true,
            lastSeen: lastPresence?.onlineAt || new Date().toISOString(),
          });
        } else if (otherUserId) {
          setPresence(String(otherUserId), {
            online: false,
            lastSeen: new Date().toISOString(),
          });
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (otherUserId && String(key) === String(otherUserId)) {
          setPresence(String(otherUserId), {
            online: true,
            lastSeen: newPresences[0]?.onlineAt || new Date().toISOString(),
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (otherUserId && String(key) === String(otherUserId)) {
          setPresence(String(otherUserId), {
            online: false,
            lastSeen: new Date().toISOString(),
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online: true,
            onlineAt: new Date().toISOString(),
            userId: user.id,
          });
        }
      });

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [user?.id, otherUserId]);
}

export { formatLastSeen } from '../utils/chatUtils';
