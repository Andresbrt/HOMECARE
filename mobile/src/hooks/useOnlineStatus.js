/**
 * useOnlineStatus — Firestore-based presence system
 *
 * Writes the current user's online status to Firestore on mount/unmount
 * and subscribes to the other participant's presence doc.
 *
 * Firestore document: /presence/{userId}
 *   { online: boolean, lastSeen: Timestamp }
 *
 * This is lightweight — reads/writes are minimal and stay within Firestore
 * free-tier limits easily.
 */
import { useEffect } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import useChatStore from '../store/chatStore';

export function useOnlineStatus(otherUserId) {
  const { user } = useAuth();
  const { setPresence } = useChatStore();

  // Broadcast own presence
  useEffect(() => {
    if (!user?.id) return;

    const myRef = doc(db, 'presence', String(user.id));

    const markOnline = () =>
      setDoc(myRef, { online: true, lastSeen: serverTimestamp() }, { merge: true }).catch(
        () => {},
      );
    const markOffline = () =>
      setDoc(myRef, { online: false, lastSeen: serverTimestamp() }, { merge: true }).catch(
        () => {},
      );

    markOnline();
    return () => { markOffline(); };
  }, [user?.id]);

  // Subscribe to other user's presence
  useEffect(() => {
    if (!otherUserId) return;

    const theirRef = doc(db, 'presence', String(otherUserId));

    const unsubscribe = onSnapshot(
      theirRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPresence(String(otherUserId), {
            online: data.online ?? false,
            lastSeen: data.lastSeen?.toDate?.() ?? null,
          });
        }
      },
      () => { /* ignore permission errors gracefully */ },
    );

    return unsubscribe;
  }, [otherUserId]);
}

// ─── Helper to format "last seen" ────────────────────────────────────────────

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'desconectado';
  const now = Date.now();
  const diff = Math.floor((now - lastSeen.getTime()) / 60000); // minutes
  if (diff < 1) return 'activo ahora';
  if (diff < 60) return `hace ${diff} min`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `hace ${hours}h`;
  return 'hace más de un día';
}
