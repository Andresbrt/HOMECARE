# 📐 ARQUITECTURA DEL SISTEMA HOMECARE

## Modelo de Negocio: inDriver

**Sistema de Ofertas Competitivas - NO Asignación Automática**

```
┌─────────────┐         ┌──────────────┐         ┌────────────────┐
│   CLIENTE   │────────►│  SOLICITUD   │◄────────│   PROVEEDOR    │
│             │         │              │         │                │
│ 1. Publica  │         │ ┌──────────┐ │         │ 1. Ve solicitud│
│ 2. Recibe   │         │ │ OFERTA 1 │ │         │ 2. Propone SU  │
│    ofertas  │         │ │ OFERTA 2 │ │         │    PRECIO      │
│ 3. Negocia  │◄────────┤ │ OFERTA 3 │ ├────────►│ 3. Negocia     │
│ 4. ELIGE    │         │ │   ...    │ │         │ 4. Espera      │
│    manual   │         │ └──────────┘ │         │                │
└─────────────┘         └──────────────┘         └────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   SERVICIO   │
                        │   ACEPTADO   │
                        └──────────────┘
```

## 🏗️ Arquitectura de Capas

### Backend (Spring Boot)

```
┌───────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Controllers │  │    DTOs     │  │   Swagger   │   │
│  │   (REST)    │  │ Validation  │  │   OpenAPI   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                    SECURITY LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │     JWT     │  │   Spring    │  │    RBAC     │   │
│  │   Filters   │  │  Security   │  │   Roles     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                    BUSINESS LAYER                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │              SERVICE LAYER                      │  │
│  │  - SolicitudService   - OfertaService          │  │
│  │  - UsuarioService     - ServicioService        │  │
│  │  - NotificationService - PaymentService        │  │
│  └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│                   PERSISTENCE LAYER                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Repositories│  │   Entities  │  │     JPA     │   │
│  │    (JPA)    │  │   Models    │  │  Hibernate  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                    DATABASE LAYER                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                │  │
│  │  - Tables - Views - Triggers - Indexes          │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│                  COMMUNICATION LAYER                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  WebSocket  │  │     REST    │  │    Email    │   │
│  │    (Chat)   │  │     API     │  │   Service   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└───────────────────────────────────────────────────────┘
```

### Mobile (React Native + Expo)

```
┌───────────────────────────────────────────────────────┐
│                    PRESENTATION                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Screens   │  │ Components  │  │ Navigation  │   │
│  │  (Views)    │  │   (UI/UX)   │  │   (Stack)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Context    │  │AsyncStorage │  │   Reducers  │   │
│  │     API     │  │   (Cache)   │  │   (State)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                    SERVICES LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │    API      │  │  WebSocket  │  │  Location   │   │
│  │  Services   │  │   (Chat)    │  │  Services   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└───────────────────────────────────────────────────────┘
```

### Web Frontend

```
┌───────────────────────────────────────────────────────┐
│                      UI LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │    HTML5    │  │    CSS3     │  │ JavaScript  │   │
│  │  Semantic   │  │  Mobile-1st │  │   ES6+      │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
├───────────────────────────────────────────────────────┤
│                   FUNCTIONALITY                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   API Call  │  │  WebSocket  │  │     PWA     │   │
│  │   (Fetch)   │  │   (Chat)    │  │ ServiceWork │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└───────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos - Modelo inDriver

### 1. Publicación de Solicitud

```
┌────────────┐    POST /api/solicitudes    ┌────────────┐
│  CLIENTE   │──────────────────────────────►│  BACKEND   │
│   Mobile   │                               │  Service   │
└────────────┘                               └─────┬──────┘
                                                   │
                                             SAVE  │
                                                   ▼
                                             ┌──────────┐
                                             │PostgreSQL│
                                             └──────────┘
                                                   │
                                          NOTIFICAR│
                                                   ▼
                                          ┌──────────────┐
                                          │ PROVEEDORES  │
                                          │   CERCANOS   │
                                          └──────────────┘
```

### 2. Envío de Ofertas (Competencia)

```
┌────────────────┐                        ┌────────────┐
│  PROVEEDOR 1   │───┐                    │  CLIENTE   │
└────────────────┘   │                    └────────────┘
                     │                         ▲
┌────────────────┐   │  POST /api/ofertas      │
│  PROVEEDOR 2   │───┼──────────────────►┌─────┴──────┐
└────────────────┘   │                   │  BACKEND   │
                     │                   │  Guarda    │
┌────────────────┐   │                   │  Ofertas   │
│  PROVEEDOR 3   │───┘                   └────────────┘
└────────────────┘

Cada proveedor propone SU precio
Las ofertas son PRIVADAS
Solo el cliente las ve
```

### 3. Elección Manual del Cliente

```
┌────────────┐   GET /api/ofertas/solicitud/{id}   ┌────────────┐
│  CLIENTE   │◄────────────────────────────────────│  BACKEND   │
└─────┬──────┘                                     └────────────┘
      │
      │ VE TODAS LAS OFERTAS:
      │ - Precio
      │ - Calificación proveedor
      │ - Distancia
      │ - Mensaje
      │
      │ DECIDE MANUALMENTE
      │
      │ POST /api/ofertas/aceptar
      ▼
┌────────────┐
│ BACKEND    │
│ Acepta     │
│ Oferta     │
└─────┬──────┘
      │
      ▼
┌────────────────┐
│ SERVICIO       │
│ CONFIRMADO     │
└────────────────┘
```

### 4. Chat en Tiempo Real (Negociación)

```
┌────────────┐                           ┌────────────────┐
│  CLIENTE   │◄─────── WebSocket ───────►│   PROVEEDOR    │
└────────────┘                           └────────────────┘
      │                                           │
      │  /app/chat/send                          │
      ├──────────────────►┌────────────┐◄────────┤
      │                   │ WebSocket  │         │
      │  /topic/chat/{id} │   Server   │         │
      │◄──────────────────┴────────────┴─────────┤
      │                                           │
      └───────── NEGOCIACIÓN DIRECTA ─────────────┘
```

## 🗄️ Modelo de Datos Relacional

```sql
usuarios
  ├── roles (M:M)
  ├── solicitudes (1:M) [como cliente]
  ├── ofertas (1:M) [como proveedor]
  ├── servicios_aceptados (1:M) [como cliente/proveedor]
  ├── calificaciones (1:M) [como calificador/calificado]
  └── notificaciones (1:M)

solicitudes
  ├── cliente (M:1 → usuarios)
  ├── ofertas (1:M)
  ├── mensajes (1:M)
  └── servicio_aceptado (1:1)

ofertas
  ├── solicitud (M:1 → solicitudes)
  ├── proveedor (M:1 → usuarios)
  └── servicio_aceptado (1:1)

servicios_aceptados
  ├── solicitud (1:1 → solicitudes)
  ├── oferta (1:1 → ofertas)
  ├── cliente (M:1 → usuarios)
  ├── proveedor (M:1 → usuarios)
  ├── calificaciones (1:M)
  └── pago (1:1)
```

## 🔐 Seguridad

### Autenticación JWT

```
┌────────────┐  POST /auth/login  ┌────────────┐
│   CLIENT   │──────────────────►│  BACKEND   │
└────────────┘                   └─────┬──────┘
      ▲                                │
      │                         VALIDATE
      │                                │
      │   JWT Token                    ▼
      │◄──────────────────────────────────
      │
      │  Todas las peticiones:
      │  Authorization: Bearer {token}
      │
      └───────────────────────────────────►
```

### Autorización por Roles

```
ROLE_CUSTOMER:
  ✓ Crear solicitudes
  ✓ Ver solicitudes propias
  ✓ Ver ofertas recibidas
  ✓ Aceptar ofertas
  ✓ Chat con proveedores
  ✓ Calificar proveedores

ROLE_SERVICE_PROVIDER:
  ✓ Ver solicitudes cercanas
  ✓ Enviar ofertas (con SU precio)
  ✓ Ver ofertas propias
  ✓ Actualizar estado del servicio
  ✓ Chat con clientes
  ✓ Calificar clientes

ROLE_ADMIN:
  ✓ Acceso total
  ✓ Gestión de usuarios
  ✓ Métricas y reportes
```

## 📱 APIs Principales

### Solicitudes (Cliente)

```
POST   /api/solicitudes              - Crear solicitud
GET    /api/solicitudes/{id}         - Detalle solicitud
GET    /api/solicitudes/mis-solicitudes - Mis solicitudes
PUT    /api/solicitudes/{id}         - Actualizar solicitud
DELETE /api/solicitudes/{id}         - Cancelar solicitud
GET    /api/solicitudes/cercanas     - Solicitudes cercanas (Proveedor)
```

### Ofertas (Modelo inDriver)

```
POST   /api/ofertas                  - Enviar oferta (Proveedor propone precio)
GET    /api/ofertas/solicitud/{id}   - Ver ofertas (Cliente)
GET    /api/ofertas/mis-ofertas      - Mis ofertas (Proveedor)
POST   /api/ofertas/aceptar          - Aceptar oferta (Cliente elige manual)
DELETE /api/ofertas/{id}             - Retirar oferta (Proveedor)
```

### Servicios

```
GET    /api/servicios/{id}           - Detalle servicio
PUT    /api/servicios/{id}/estado    - Actualizar estado (Proveedor)
POST   /api/servicios/{id}/fotos     - Subir fotos evidencia
GET    /api/servicios/activos        - Servicios en progreso
GET    /api/servicios/historial      - Historial
```

### Chat (WebSocket)

```
WS     /ws                           - Conexión WebSocket
SEND   /app/chat/send                - Enviar mensaje
SUB    /topic/chat/{solicitudId}     - Recibir mensajes
```

## 🚀 Escalabilidad

### Horizontal Scaling

```
                    ┌─────────────┐
                    │Load Balancer│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │Instance │      │Instance │      │Instance │
    │   #1    │      │   #2    │      │   #3    │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                 │
         └────────────────┼─────────────────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │
                    │  (Master)  │
                    └────────────┘
```

### Caching Strategy

```
┌──────────┐     ┌───────┐     ┌──────────┐     ┌──────────┐
│ Client   │────►│ Redis │────►│ Backend  │────►│PostgreSQL│
└──────────┘     └───────┘     └──────────┘     └──────────┘
                    Cache          Service          Database
                  (Frequent)     (Business)         (Source)
```

### Optimización de Geolocalización

```sql
-- Índice espacial para búsquedas cercanas
CREATE INDEX idx_solicitudes_location 
ON solicitudes USING gist (
  ll_to_earth(latitud, longitud)
);

-- Búsqueda optimizada con PostGIS
SELECT * FROM solicitudes
WHERE earth_box(ll_to_earth(lat, lng), radio_metros) 
@> ll_to_earth(latitud, longitud);
```

## 📊 Métricas y Monitoreo

### KPIs del Modelo inDriver

1. **Tasa de Conversión**
   - Solicitudes → Ofertas recibidas
   - Ofertas → Ofertas aceptadas
   
2. **Competencia**
   - Promedio de ofertas por solicitud
   - Variación de precios ofrecidos

3. **Calidad**
   - Calificación promedio proveedores
   - Calificación promedio clientes
   - Tasa de cancelación

4. **Engagement**
   - Mensajes por solicitud (negociación)
   - Tiempo promedio de elección
   - Tiempo desde publicación a servicio

### Stack de Monitoreo

```
┌─────────────┐
│  Prometheus │ ← Métricas
└──────┬──────┘
       │
┌──────▼──────┐
│   Grafana   │ ← Visualización
└─────────────┘

┌─────────────┐
│   Logback   │ ← Logs
└──────┬──────┘
       │
┌──────▼──────┐
│     ELK     │ ← Análisis
└─────────────┘
```

## 🎨 Diseño UI/UX

### Manual de Marca Aplicado

**Colores**
- `#001B38` - Primario (Headers, Textos)
- `#0E4D68` - Secundario (Cards, Fondos)
- `#49C0BC` - Acento (CTAs, Estados)
- `#FFFFFF` - Blanco (Fondo)

**Principios de Diseño**
- Mobile First
- Minimalismo Profesional
- Espaciado Generoso
- Jerarquía Visual Clara
- Animaciones Sutiles
- Sin Decoración Innecesaria

### Componentes Reutilizables

```javascript
- Button (Primary, Secondary, Outline)
- Card (Clean, Elevated)
- Input (Simple, Clear)
- Modal (Centered, Smooth)
- Badge (Status indicator)
- Avatar (User profile)
- Rating (Stars)
- Map (Location picker)
```

---

**Validación Modelo inDriver**

✅ Cliente publica solicitud  
✅ Proveedores compiten con ofertas  
✅ Cada proveedor propone SU precio  
✅ Cliente elige MANUALMENTE  
✅ Negociación por chat  
✅ NO asignación automática  
✅ NO precios fijos por la app

**Resultado: Marketplace libre, transparente, competitivo**
