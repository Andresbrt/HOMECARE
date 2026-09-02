// useOfferNotifications.js – Hook to subscribe to offer notifications via STOMP/WebSocket
import { useEffect } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-root-toast';
import { wsClient } from '../services/wsClient';
import { useAuth } from '../context/AuthContext';

/**
 * Hook that connects to the WS client (if not already) and subscribes to the
 * user‑specific "ofertas" topic. When a new offer message arrives, a toast is
 * displayed (or an alert as fallback) so the user receives a real‑time alert.
 */
export default function useOfferNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const subscribe = async () => {
      try {
        await wsClient.connect();
        const destination = `/user/topic/ofertas/${user.id}`;
        const unsubscribe = wsClient.subscribe(destination, (msg) => {
          const title = msg?.title ?? 'Nueva oferta';
          const requestId = msg?.solicitudId ?? '';
          const message = `${title}${requestId ? ` (ID: ${requestId})` : ''}`;
          try {
            Toast.show(message, {
              duration: Toast.durations.LONG,
              position: Toast.positions.TOP,
              shadow: true,
              animation: true,
              hideOnPress: true,
            });
          } catch (e) {
            Alert.alert('Oferta', message);
          }
        });
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (e) {
        console.error('[OfferNotifications] WS connection error', e);
      }
    };
    wsClient.onNextConnect(subscribe);
    if (wsClient.isConnected()) {
      subscribe();
    }
    return () => {};
  }, [user?.id]);
}
