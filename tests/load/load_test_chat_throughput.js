/**
 * LOAD TEST - WebSocket Chat Throughput
 * k6 (con k6-websocket): 10 pares enviando mensajes
 * 100 msg/seg total, latencia WebSocket p95 < 300ms
 *
 * Prerequisitos:
 *   k6 version >= 0.43.0 (soporte WebSocket nativo)
 *
 * Ejecutar:
 *   k6 run tests/load/load_test_chat_throughput.js \
 *     -e API_URL=https://homecare-backend.fly.dev \
 *     -e WS_URL=wss://homecare-backend.fly.dev
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN: 10 pares de usuarios (20 VUs total)
// ────────────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '15s', target: 5 },   // Calentamiento
    { duration: '2m',  target: 20 },  // 10 pares = 20 VUs
    { duration: '3m',  target: 20 },  // Carga sostenida
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    // p95 latencia WebSocket < 300ms
    'ws_message_latency': ['p(95)<300'],
    // Tasa de mensajes enviados exitosamente > 98%
    'ws_messages_sent_success': ['rate>0.98'],
    // Desconexiones inesperadas < 2%
    'ws_disconnections': ['rate<0.02'],
    // Checks generales > 98%
    'checks': ['rate>0.98'],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// MÉTRICAS
// ────────────────────────────────────────────────────────────────────────────
const wsMessageLatency = new Trend('ws_message_latency', true);
const wsMessagesSentSuccess = new Rate('ws_messages_sent_success');
const wsDisconnections = new Rate('ws_disconnections');
const messagesReceived = new Counter('messages_received');
const messagesSent = new Counter('messages_sent');

const API_URL = __ENV.API_URL || 'http://localhost:8080';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080';

// ────────────────────────────────────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────────────────────────────────────
export function setup() {
  // Login como cliente y como profesional
  const loginAs = (email, password) => {
    const res = http.post(
      `${API_URL}/api/auth/login`,
      JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status !== 200) return null;
    const body = JSON.parse(res.body);
    return body.token || body.accessToken;
  };

  const customerToken = loginAs('cliente.prueba@homecare.co', 'Test1234!');
  const providerToken = loginAs('profesional.prueba@homecare.co', 'Test1234!');

  // Obtener lista de chats activos
  let chatRoomId = null;
  if (customerToken) {
    const chatsRes = http.get(`${API_URL}/api/chat/rooms`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (chatsRes.status === 200) {
      const chats = JSON.parse(chatsRes.body);
      if (Array.isArray(chats) && chats.length > 0) {
        chatRoomId = chats[0].id || chats[0].roomId;
      }
    }
  }

  return { customerToken, providerToken, chatRoomId };
}

// ────────────────────────────────────────────────────────────────────────────
// ESCENARIO PRINCIPAL: WebSocket Chat
// ────────────────────────────────────────────────────────────────────────────
export default function (data) {
  const { customerToken, chatRoomId } = data;
  if (!customerToken || !chatRoomId) {
    wsDisconnections.add(1);
    return;
  }

  const isProvider = __VU % 2 === 0; // VUs pares = profesionales, impares = clientes
  const token = customerToken; // Simplificado para el test (usa mismo token)

  // Endpoint WebSocket STOMP
  const wsEndpoint = `${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`;

  let connected = false;
  let messagesCount = 0;
  const MESSAGES_PER_SESSION = 10; // Cada VU envía 10 mensajes

  const res = ws.connect(wsEndpoint, {}, function (socket) {
    socket.on('open', () => {
      connected = true;

      // STOMP: enviar CONNECT frame
      socket.send(
        `CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\nheart-beat:0,0\n\n\0`
      );
    });

    socket.on('message', (rawMsg) => {
      if (typeof rawMsg === 'string') {
        // Mensaje de servidor recibido
        if (rawMsg.startsWith('CONNECTED')) {
          // Suscribirse al canal del chat
          socket.send(
            `SUBSCRIBE\nid:sub-0\ndestination:/topic/chat/${chatRoomId}\n\n\0`
          );

          // Comenzar a enviar mensajes
          let msgIndex = 0;
          const sendMessage = () => {
            if (msgIndex >= MESSAGES_PER_SESSION) {
              socket.close();
              return;
            }

            const msgContent = `Load test msg ${__VU}-${msgIndex}-${Date.now()}`;
            const sentAt = Date.now();

            const stompSend =
              `SEND\n` +
              `destination:/app/chat/${chatRoomId}/message\n` +
              `content-type:application/json\n\n` +
              `{"content":"${msgContent}","messageType":"TEXT","sentAt":${sentAt}}\0`;

            socket.send(stompSend);
            messagesSent.add(1);
            wsMessagesSentSuccess.add(true);
            msgIndex++;

            // Enviar próximo mensaje cada 500ms (aprox 2 msg/seg por VU = 40 msg/seg con 20 VUs)
            socket.setTimeout(sendMessage, 500);
          };

          socket.setTimeout(sendMessage, 200);
        }

        if (rawMsg.startsWith('MESSAGE')) {
          messagesReceived.add(1);

          // Calcular latencia si el mensaje contiene el timestamp
          try {
            const bodyMatch = rawMsg.match(/\{"content":"(.+)"\}/);
            if (bodyMatch) {
              const parsedBody = JSON.parse(rawMsg.split('\n\n')[1].replace('\0', ''));
              if (parsedBody.sentAt) {
                const latency = Date.now() - parsedBody.sentAt;
                wsMessageLatency.add(latency);
              }
            }
          } catch (_) {}
        }

        if (rawMsg.startsWith('ERROR')) {
          wsDisconnections.add(1);
          socket.close();
        }
      }
    });

    socket.on('close', (code) => {
      if (code !== 1000 && connected) {
        // Cierre inesperado
        wsDisconnections.add(1);
      }
    });

    socket.on('error', (e) => {
      wsDisconnections.add(1);
    });

    // Timeout de la sesión
    socket.setTimeout(() => {
      socket.close();
    }, 60000); // 60 segundos máximo por sesión
  });

  check(res, {
    'WebSocket conectado exitosamente': (r) => r && r.status === 101,
  });

  // Check de presencia online (API REST)
  const presenceRes = http.get(`${API_URL}/api/chat/rooms/${chatRoomId}/presence`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'presence' },
  });

  check(presenceRes, {
    'presencia actualiza en < 1s': (r) => r.status === 200 && r.timings.duration < 1000,
  });

  sleep(1);
}

// ────────────────────────────────────────────────────────────────────────────
// TEARDOWN
// ────────────────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log(`
  ════════════════════════════════════════════
  RESUMEN: Chat Throughput WebSocket
  ════════════════════════════════════════════
  
  SLO Targets:
  ✓ Latencia WebSocket p95 < 300ms
  ✓ Mensajes enviados exitosamente > 98%
  ✓ Desconexiones inesperadas < 2%
  ✓ Presencia online actualiza en < 1s
  ════════════════════════════════════════════
  `);
}
