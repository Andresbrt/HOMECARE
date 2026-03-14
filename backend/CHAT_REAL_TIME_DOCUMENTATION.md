# Real-Time Contract (WebSocket) - Chat + Tracking

This document is the source of truth for frontend integration over STOMP/WebSocket.
It is based on the current backend implementation in:

- `backend/src/main/java/com/homecare/config/WebSocketConfig.java`
- `backend/src/main/java/com/homecare/controller/MensajeController.java`
- `backend/src/main/java/com/homecare/controller/UbicacionController.java`
- `backend/src/main/java/com/homecare/controller/TrackingWebSocketController.java`
- `backend/src/main/java/com/homecare/service/MensajeService.java`
- `backend/src/main/java/com/homecare/service/UbicacionService.java`

## 1) Connection and auth

- STOMP endpoint (native WS): `ws://<host>:<port>/ws`
- STOMP endpoint (SockJS): `http://<host>:<port>/ws`
- App destination prefix: `/app`
- Broker prefixes: `/topic`, `/queue`
- User prefix: `/user`

Required CONNECT header:

```text
Authorization: Bearer <jwt>
```

## 2) Canonical events for frontend

Use this set as the default contract for mobile/web clients.

### Inbound events (client -> server)

| Destination | Purpose | Payload type |
|---|---|---|
| `/app/chat/send` | Send chat message | `MensajeDTO.WebSocketMessage` |
| `/app/chat/{solicitudId}/typing` | Typing indicator | Empty body |
| `/app/chat/{solicitudId}/read` | Mark conversation as read | Empty body |
| `/app/tracking/actualizar` | Send provider location update | `UbicacionDTO.ActualizarUbicacion` |

### Outbound events (server -> client)

| Destination | Purpose | Payload type |
|---|---|---|
| `/topic/typing/{solicitudId}` | Typing indicator stream | `MensajeDTO.TypingIndicator` |
| `/topic/tracking/{solicitudId}` | Live location stream | `UbicacionDTO.UbicacionWebSocket` |
| `/topic/tracking/{solicitudId}/alertas` | Proximity alerts | `UbicacionDTO.AlertaProximidad` |
| `/user/queue/tracking` | Direct location updates for customer | `UbicacionDTO.UbicacionWebSocket` |
| `/user/topic/chat/{solicitudId}` | Direct chat delivery (current service behavior) | `MensajeDTO.Response` |

Important note for chat reception:

- Chat messages are emitted with `convertAndSendToUser(..., "/topic/chat/{solicitudId}", ...)`.
- Because of user destinations, frontend should subscribe to `/user/topic/chat/{solicitudId}`.
- If your STOMP client library auto-resolves user prefixes differently, keep a fallback subscription strategy during migration.

## 3) Legacy compatibility events (still present)

There is a secondary/legacy controller with additional routes. Keep them only if your current frontend depends on them.

### Inbound legacy

| Destination | Purpose | Payload type |
|---|---|---|
| `/app/tracking/update/{solicitudId}` | Legacy tracking update | `TrackingDTO.UbicacionUpdate` |
| `/app/chat/send/{servicioId}` | Legacy chat send | `TrackingDTO.ChatMessage` |
| `/app/service/status/{servicioId}` | Service status update | `TrackingDTO.EstadoUpdate` |
| `/app/tracking/subscribe/{solicitudId}` | Subscription ack message | Empty body |
| `/app/tracking/unsubscribe/{solicitudId}` | Unsubscribe marker | Empty body |

### Outbound legacy

| Destination | Purpose | Payload type |
|---|---|---|
| `/topic/tracking/{solicitudId}/location` | Legacy tracking stream | `TrackingDTO.UbicacionResponse` |
| `/topic/tracking/{solicitudId}/error` | Tracking errors | `String` |
| `/user/queue/tracking/location` | User direct tracking | `TrackingDTO.UbicacionResponse` |
| `/topic/chat/{servicioId}` | Legacy chat stream | `TrackingDTO.ChatMessage` |
| `/user/queue/chat/error` | Chat send error | `String` |
| `/topic/service/{servicioId}/status` | Service status stream | `TrackingDTO.ServicioStatus` |
| `/topic/service/{servicioId}/error` | Service status errors | `String` |
| `/user/queue/service/status` | Direct service status | `TrackingDTO.ServicioStatus` |
| `/topic/tracking/{solicitudId}/subscribed` | Subscription acknowledgement | `String` |

## 4) Payload contracts

### 4.1 Send chat (`/app/chat/send`)

```json
{
  "solicitudId": 101,
  "destinatarioId": 22,
  "contenido": "Voy en camino",
  "tipo": "TEXTO",
  "archivoUrl": null
}
```

`tipo` allowed values (business level): `TEXTO`, `IMAGEN`, `ARCHIVO`.

### 4.2 Typing (`/app/chat/{solicitudId}/typing`)

Body is optional/empty.

Typing stream payload (`/topic/typing/{solicitudId}`):

```json
{
  "solicitudId": 101,
  "usuarioId": 22,
  "usuarioNombre": "Carlos",
  "escribiendo": true
}
```

### 4.3 Mark read (`/app/chat/{solicitudId}/read`)

Body is optional/empty.

### 4.4 Tracking update (`/app/tracking/actualizar`)

```json
{
  "solicitudId": 101,
  "latitud": 4.6097,
  "longitud": -74.0817,
  "precisionMetros": 8.5,
  "velocidadKmh": 22.4,
  "rumboGrados": 130.0,
  "tipoTransporte": "moto",
  "bateriaDispositivo": 86,
  "enSegundoPlano": false
}
```

Tracking stream payload (`/topic/tracking/{solicitudId}`):

```json
{
  "solicitudId": 101,
  "proveedorId": 22,
  "proveedorNombre": "Carlos Perez",
  "latitud": 4.6097,
  "longitud": -74.0817,
  "velocidadKmh": 22.4,
  "rumboGrados": 130.0,
  "distanciaRestanteMetros": 780.0,
  "etaMinutos": 4,
  "estado": "EN_RUTA",
  "timestamp": "2026-03-11T14:05:12",
  "alertaCerca": false
}
```

Alert stream payload (`/topic/tracking/{solicitudId}/alertas`):

```json
{
  "solicitudId": 101,
  "proveedorId": 22,
  "proveedorNombre": "Carlos Perez",
  "proveedorTelefono": "+57...",
  "distanciaMetros": 420.0,
  "etaMinutos": 2,
  "mensaje": "Carlos Perez esta a menos de 500 metros",
  "tipoAlerta": "CERCA_500M",
  "timestamp": "2026-03-11T14:06:10"
}
```

## 5) Subscribe strategy recommended for frontend

Subscribe immediately after successful STOMP CONNECT:

- `/topic/typing/{solicitudId}`
- `/topic/tracking/{solicitudId}`
- `/topic/tracking/{solicitudId}/alertas`
- `/user/queue/tracking`
- `/user/topic/chat/{solicitudId}`

Optional compatibility subscriptions (only if needed):

- `/topic/chat/{servicioId}`
- `/topic/tracking/{solicitudId}/location`
- `/user/queue/tracking/location`
- `/topic/service/{servicioId}/status`

## 6) Operational rules to avoid frontend breakage

- Always send `Authorization: Bearer <jwt>` in STOMP CONNECT headers.
- Reconnect with backoff (1s, 2s, 5s, 10s).
- Re-subscribe after reconnect; subscriptions are not persisted.
- Keep `solicitudId` and `servicioId` explicit in client state; do not mix them.
- For chat, prefer the canonical route `/app/chat/send` + `/user/topic/chat/{solicitudId}`.
- Use REST fallback for initial hydration:
  - `GET /api/mensajes/solicitud/{solicitudId}`
  - `GET /api/tracking/solicitud/{solicitudId}/ultima` (requires `proveedorId`)

## 7) Minimal STOMP example

```javascript
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const socketFactory = () => new SockJS('http://localhost:8082/ws');

const client = new Client({
  webSocketFactory: socketFactory,
  connectHeaders: { Authorization: `Bearer ${token}` },
  reconnectDelay: 2000,
});

client.onConnect = () => {
  client.subscribe(`/user/topic/chat/${solicitudId}`, onChatMessage);
  client.subscribe(`/topic/typing/${solicitudId}`, onTyping);
  client.subscribe(`/topic/tracking/${solicitudId}`, onTracking);
  client.subscribe(`/topic/tracking/${solicitudId}/alertas`, onAlert);

  client.publish({
    destination: '/app/chat/send',
    body: JSON.stringify({
      solicitudId,
      destinatarioId,
      contenido: 'Hola',
      tipo: 'TEXTO',
    }),
  });
};

client.activate();
```

## 8) Versioning note

When changing any destination or payload field, update this file in the same PR.
This avoids silent regressions between backend and frontend.
