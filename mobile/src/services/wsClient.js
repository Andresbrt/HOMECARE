/**
 * wsClient — STOMP WebSocket Singleton
 *
 * Manages the persistent STOMP/WebSocket connection to the Spring backend.
 * Contract source: backend/CHAT_REAL_TIME_DOCUMENTATION.md
 *
 * Inbound  (client→server):
 *   /app/chat/send                  — send message
 *   /app/chat/{solicitudId}/typing  — typing indicator
 *   /app/chat/{solicitudId}/read    — mark conversation read
 *
 * Outbound (server→client):
 *   /user/topic/chat/{solicitudId}  — receive messages (personal queue)
 *   /topic/typing/{solicitudId}     — typing indicator broadcast
 */

import { Client } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import { WS_URL } from '../config/api';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

// Convert http(s)://host/ws  →  ws(s)://host/ws
const toWsUrl = (url) => url.replace(/^http/, 'ws');

let _client = null;
let _connectPromise = null;
let _onConnectCallbacks = [];

// ─── Internal helpers ────────────────────────────────────────────────────────

async function _getToken() {
  return SecureStore.getItemAsync('token');
}

function _buildClient(token) {
  const wsUrl = toWsUrl(WS_URL);

  return new Client({
    // React Native: use native WebSocket (not SockJS)
    webSocketFactory: () => new WebSocket(wsUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      // Some Spring configs also check 'login' header
      login: token,
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 25000,
    // Required for some React Native environments
    forceBinaryWSFrames: false,
    appendMissingNULLonIncoming: true,

    onConnect: () => {
      __DEV_LOG__('[WS] ✓ Connected to STOMP broker');
      _connectPromise = null;
      _onConnectCallbacks.forEach((cb) => cb());
      _onConnectCallbacks = [];
    },
    onDisconnect: () => {
      __DEV_LOG__('[WS] Disconnected');
      _connectPromise = null;
    },
    onStompError: (frame) => {
      __DEV_LOG__('[WS] STOMP error:', frame.headers?.message);
      _connectPromise = null;
    },
    onWebSocketError: (error) => {
      __DEV_LOG__('[WS] WebSocket error:', error?.message || error);
      _connectPromise = null;
    },
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const wsClient = {
  /**
   * Connect (idempotent). Returns Promise that resolves once the STOMP
   * CONNECTED frame has been received.
   */
  connect: async () => {
    if (_client?.connected) return Promise.resolve();
    if (_connectPromise) return _connectPromise;

    const token = await _getToken();
    if (!token) throw new Error('[WS] No auth token available');

    // Replace stale client if any
    if (_client) {
      _client.forceDisconnect();
      _client = null;
    }

    _connectPromise = new Promise((resolve, reject) => {
      _client = _buildClient(token);

      // Patch callbacks to resolve/reject this promise
      const origOnConnect = _client.onConnect;
      _client.onConnect = (frame) => {
        origOnConnect(frame);
        resolve();
      };

      const origOnError = _client.onStompError;
      _client.onStompError = (frame) => {
        origOnError(frame);
        reject(new Error(frame.headers?.message || 'STOMP connection error'));
      };

      const origOnWsError = _client.onWebSocketError;
      _client.onWebSocketError = (err) => {
        origOnWsError(err);
        reject(err);
      };

      _client.activate();
    });

    return _connectPromise;
  },

  /** Gracefully close the connection and clear the client instance. */
  disconnect: () => {
    _client?.deactivate();
    _client = null;
    _connectPromise = null;
  },

  /** Whether the client is currently in the CONNECTED state. */
  isConnected: () => _client?.connected ?? false,

  /**
   * Subscribe to a STOMP destination.
   * @returns {Function} unsubscribe — call it in useEffect cleanup
   */
  subscribe: (destination, callback) => {
    if (!_client?.connected) {
      __DEV_LOG__('[WS] subscribe called but not connected:', destination);
      return () => {};
    }
    const sub = _client.subscribe(destination, (frame) => {
      try {
        callback(JSON.parse(frame.body));
      } catch {
        callback(frame.body);
      }
    });
    return () => {
      try { sub.unsubscribe(); } catch { /* ignore if already gone */ }
    };
  },

  /**
   * Publish a message to a STOMP destination.
   * Silently ignores if not connected.
   */
  publish: (destination, body = {}) => {
    if (!_client?.connected) {
      __DEV_LOG__('[WS] publish called but not connected:', destination);
      return;
    }
    _client.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  },

  /**
   * Run callback immediately if connected, otherwise queue for next connect.
   * Useful for subscriptions that should rehydrate after reconnect.
   */
  onNextConnect: (cb) => {
    if (_client?.connected) {
      cb();
    } else {
      _onConnectCallbacks.push(cb);
    }
  },
};
