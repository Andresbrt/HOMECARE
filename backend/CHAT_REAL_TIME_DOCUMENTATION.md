# Chat en Tiempo Real - Documentación

## 📱 Funcionalidades Implementadas

### ✅ Chat en Tiempo Real entre Proveedor y Usuario
- Mensajes instantáneos bidireccionales
- Soporte para texto, imágenes y archivos
- Indicadores de "escribiendo..."
- Notificaciones push de nuevos mensajes
- Estado de leído/no leído
- Historial completo de conversaciones

---

## 🔌 Endpoints REST API

### 1. **Enviar Mensaje**
```http
POST /api/mensajes
Authorization: Bearer {token}
Content-Type: application/json

{
  "solicitudId": 1,
  "destinatarioId": 2,
  "contenido": "Hola, ¿a qué hora puedes venir?",
  "tipo": "TEXTO",
  "archivoUrl": null
}
```

**Response:**
```json
{
  "id": 1,
  "solicitudId": 1,
  "remitenteId": 1,
  "remitenteNombre": "Juan Pérez",
  "remitenteFoto": "https://...",
  "destinatarioId": 2,
  "destinatarioNombre": "María García",
  "destinatarioFoto": "https://...",
  "contenido": "Hola, ¿a qué hora puedes venir?",
  "tipo": "TEXTO",
  "archivoUrl": null,
  "leido": false,
  "leidoAt": null,
  "createdAt": "2026-01-16T10:30:00"
}
```

### 2. **Obtener Mensajes de una Solicitud**
```http
GET /api/mensajes/solicitud/{solicitudId}
Authorization: Bearer {token}
```

### 3. **Obtener Lista de Conversaciones**
```http
GET /api/mensajes/conversaciones
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "solicitudId": 1,
    "tituloSolicitud": "Limpieza profunda",
    "interlocutorId": 2,
    "interlocutorNombre": "María García",
    "interlocutorFoto": "https://...",
    "ultimoMensaje": "Perfecto, nos vemos mañana",
    "ultimoMensajeFecha": "2026-01-16T14:20:00",
    "mensajesNoLeidos": 2,
    "usuarioEscribiendo": false
  }
]
```

### 4. **Marcar Mensaje como Leído**
```http
PUT /api/mensajes/{mensajeId}/leer
Authorization: Bearer {token}
```

### 5. **Marcar Todos como Leídos**
```http
PUT /api/mensajes/solicitud/{solicitudId}/leer-todos
Authorization: Bearer {token}
```

### 6. **Contar Mensajes No Leídos**
```http
GET /api/mensajes/no-leidos
Authorization: Bearer {token}
```

**Response:**
```json
5
```

### 7. **Contar No Leídos por Solicitud**
```http
GET /api/mensajes/solicitud/{solicitudId}/no-leidos
Authorization: Bearer {token}
```

---

## 🔌 WebSocket API

### Conexión WebSocket

**Endpoint:** `ws://localhost:8080/ws`

**Con SockJS:** `http://localhost:8080/ws`

### Autenticación

Incluir token JWT en el header de conexión:
```javascript
const headers = {
  Authorization: `Bearer ${token}`
};
```

### Canales de Comunicación

#### 1. **Enviar Mensaje**
```javascript
// Cliente envía a:
/app/chat/send

// Payload:
{
  "solicitudId": 1,
  "destinatarioId": 2,
  "contenido": "Hola",
  "tipo": "TEXTO",
  "archivoUrl": null
}
```

#### 2. **Recibir Mensajes**
```javascript
// Cliente se suscribe a:
/topic/chat/{solicitudId}

// Servidor envía:
{
  "id": 1,
  "solicitudId": 1,
  "remitenteId": 2,
  "remitenteNombre": "María García",
  "contenido": "Hola, ¿cómo estás?",
  "tipo": "TEXTO",
  "leido": false,
  "createdAt": "2026-01-16T10:30:00"
}
```

#### 3. **Indicador de Escribiendo**
```javascript
// Cliente envía a:
/app/chat/{solicitudId}/typing

// Cliente se suscribe a:
/topic/typing/{solicitudId}

// Servidor envía:
{
  "solicitudId": 1,
  "usuarioId": 2,
  "usuarioNombre": "María García",
  "escribiendo": true
}
```

#### 4. **Marcar como Leído por WebSocket**
```javascript
// Cliente envía a:
/app/chat/{solicitudId}/read
```

---

## 📱 Implementación en el Cliente

### JavaScript/TypeScript (React Native / Web)

```typescript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class ChatService {
  private stompClient: any;
  private token: string;

  connect(token: string) {
    this.token = token;
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);

    const headers = {
      Authorization: `Bearer ${token}`
    };

    this.stompClient.connect(headers, () => {
      console.log('WebSocket conectado');
    });
  }

  subscribeToChatMessages(solicitudId: number, callback: (message: any) => void) {
    return this.stompClient.subscribe(
      `/topic/chat/${solicitudId}`,
      (message: any) => {
        callback(JSON.parse(message.body));
      }
    );
  }

  subscribeToTypingIndicator(solicitudId: number, callback: (data: any) => void) {
    return this.stompClient.subscribe(
      `/topic/typing/${solicitudId}`,
      (message: any) => {
        callback(JSON.parse(message.body));
      }
    );
  }

  sendMessage(solicitudId: number, destinatarioId: number, contenido: string) {
    const message = {
      solicitudId,
      destinatarioId,
      contenido,
      tipo: 'TEXTO',
      archivoUrl: null
    };

    this.stompClient.send('/app/chat/send', {}, JSON.stringify(message));
  }

  sendTypingIndicator(solicitudId: number) {
    this.stompClient.send(`/app/chat/${solicitudId}/typing`, {}, '');
  }

  markAsRead(solicitudId: number) {
    this.stompClient.send(`/app/chat/${solicitudId}/read`, {}, '');
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
  }
}

export default new ChatService();
```

### Uso en Componente React

```typescript
import React, { useEffect, useState } from 'react';
import ChatService from './ChatService';

function ChatComponent({ solicitudId, token }) {
  const [mensajes, setMensajes] = useState([]);
  const [escribiendo, setEscribiendo] = useState(false);

  useEffect(() => {
    // Conectar WebSocket
    ChatService.connect(token);

    // Suscribirse a mensajes
    const subscription = ChatService.subscribeToChatMessages(
      solicitudId,
      (mensaje) => {
        setMensajes(prev => [...prev, mensaje]);
      }
    );

    // Suscribirse a indicador de escribiendo
    const typingSubscription = ChatService.subscribeToTypingIndicator(
      solicitudId,
      (data) => {
        setEscribiendo(data.escribiendo);
      }
    );

    return () => {
      subscription.unsubscribe();
      typingSubscription.unsubscribe();
      ChatService.disconnect();
    };
  }, [solicitudId, token]);

  const enviarMensaje = (contenido: string) => {
    ChatService.sendMessage(solicitudId, destinatarioId, contenido);
  };

  const handleTyping = () => {
    ChatService.sendTypingIndicator(solicitudId);
  };

  return (
    <div>
      {/* UI del chat */}
      {escribiendo && <p>El usuario está escribiendo...</p>}
      <input onChange={handleTyping} />
      <button onClick={() => enviarMensaje('Hola')}>Enviar</button>
    </div>
  );
}
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT en WebSocket
- ✅ Validación de permisos por solicitud
- ✅ Solo participantes pueden ver mensajes
- ✅ Headers CORS configurados

---

## 📊 Base de Datos

### Tabla `mensajes`

```sql
CREATE TABLE mensajes (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL,
    remitente_id BIGINT NOT NULL,
    destinatario_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'TEXTO',
    archivo_url VARCHAR(500),
    leido BOOLEAN DEFAULT FALSE,
    leido_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id),
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id),
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_mensajes_solicitud ON mensajes(solicitud_id);
CREATE INDEX idx_mensajes_destinatario ON mensajes(destinatario_id, leido);
```

---

## 🚀 Características Destacadas

✅ **Mensajes en Tiempo Real** - Entrega instantánea vía WebSocket  
✅ **Indicadores de Escritura** - Saber cuando el otro usuario está escribiendo  
✅ **Estado de Lectura** - Confirmación de mensajes leídos  
✅ **Lista de Conversaciones** - Vista general de todos los chats  
✅ **Notificaciones Push** - Alertas con Firebase cuando llega un mensaje  
✅ **Soporte Multimedia** - Texto, imágenes y archivos  
✅ **Historial Persistente** - Todos los mensajes se guardan en BD  
✅ **Autenticación Segura** - JWT en REST y WebSocket  

---

## 🧪 Testing

### Probar con Postman

1. **Conectar WebSocket:**
   - Usar extensión WebSocket de Postman
   - URL: `ws://localhost:8080/ws`
   - Agregar header: `Authorization: Bearer {token}`

2. **Enviar Mensaje:**
   ```json
   {
     "destination": "/app/chat/send",
     "body": {
       "solicitudId": 1,
       "destinatarioId": 2,
       "contenido": "Test",
       "tipo": "TEXTO"
     }
   }
   ```

3. **Suscribirse:**
   ```json
   {
     "destination": "/topic/chat/1"
   }
   ```

---

## 📱 Flujo de Uso Típico

1. **Cliente abre el chat**
   - GET `/api/mensajes/solicitud/1` - Carga historial
   - Conecta WebSocket
   - Suscribe a `/topic/chat/1`

2. **Cliente escribe mensaje**
   - Envía evento typing: `/app/chat/1/typing`
   - Envía mensaje: POST `/api/mensajes` o `/app/chat/send`

3. **Servidor procesa**
   - Guarda mensaje en BD
   - Envía a destinatario vía WebSocket: `/topic/chat/1`
   - Envía notificación push con Firebase

4. **Destinatario recibe**
   - Mensaje llega por WebSocket
   - Muestra notificación si app en background
   - Marca como leído: PUT `/api/mensajes/1/leer`

---

## 🎯 Próximas Mejoras

- [ ] Mensajes de voz
- [ ] Videollamadas
- [ ] Compartir ubicación en tiempo real
- [ ] Reacciones a mensajes
- [ ] Mensajes temporales (que se autodestruyen)
- [ ] Cifrado end-to-end

---

Documentación generada el 16 de Enero de 2026
