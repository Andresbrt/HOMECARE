/**
 * useTyping — Real-time typing indicator subscriber
 *
 * Subscribes to the STOMP topic for typing events and exposes
 * `isOtherTyping` (boolean). The flag auto-clears after 3 seconds
 * with no new events.
 */
import { useState, useEffect, useRef } from 'react';
import { wsClient } from '../services/wsClient';

export function useTyping(solicitudId) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!solicitudId) return;

    let unsub = () => {};

    const subscribe = () => {
      unsub = wsClient.subscribe(`/topic/typing/${solicitudId}`, () => {
        setIsOtherTyping(true);
        // Auto-clear after 3s of silence
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 3000);
      });
    };

    // Subscribe immediately if already connected, otherwise queue
    if (wsClient.isConnected()) {
      subscribe();
    } else {
      wsClient.onNextConnect(subscribe);
    }

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [solicitudId]);

  return { isOtherTyping };
}
