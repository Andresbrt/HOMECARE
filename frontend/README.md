# 🏠 HOMECARE - Frontend React Native

Frontend móvil de la aplicación HomeCare, un marketplace de servicios de limpieza estilo Uber/inDriver.

## 📱 Características Principales

### ✅ **Design System Completo**
- Paleta de colores basada en manual de marca: `#001B38`, `#0E4D68`, `#49C0BC`, `#FFFFFF`
- Componentes reutilizables con variantes y estados
- Tipografía y espaciado consistente
- Animaciones y transiciones fluidas

### 👥 **3 Experiencias de Usuario**

#### 🛒 **Cliente (Client)**
- **Pantalla Principal:** Servicios disponibles, promociones, categorías
- **Seguimiento en Tiempo Real:** Mapa con ubicación del proveedor, chat, timeline
- **Búsqueda:** Por categoría, ubicación, precio, disponibilidad
- **Historial:** Servicios anteriores, reseñas, favoritos

#### 🔧 **Proveedor (Service Provider)**
- **Dashboard:** Estado online/offline, solicitudes pendientes, estadísticas
- **Gestión de Servicios:** Aceptar/rechazar, seguimiento de progreso
- **Ganancias:** Reportes, historial de pagos, métricas
- **Agenda:** Horarios, disponibilidad, bloqueos

#### ⚙️ **Administrador (Admin)**
- **Dashboard:** Métricas en tiempo real, gráficos, analytics
- **Gestión de Usuarios:** Clientes, proveedores, moderación
- **Reportes:** Financieros, operativos, de calidad
- **Configuración:** Sistema, parámetros, integraciones

## 🛠 Tecnologías Utilizadas

```json
{
  "react-native": "0.72.6",
  "react-navigation": "^6.1.9",
  "react-native-maps": "^1.7.1",
  "react-native-vector-icons": "^10.0.0",
  "react-native-paper": "^5.10.6",
  "react-native-chart-kit": "^6.12.0",
  "react-native-safe-area-context": "^4.7.4"
}
```

## 📂 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Button.js        # Botón con variantes (primary, secondary, outline)
│   ├── Input.js         # Input con label flotante y validación
│   ├── Card.js          # Cards especializados (Service, Provider, Request)
│   ├── Header.js        # Headers (Main, Nav) con navegación
│   └── index.js         # Exportador principal
├── screens/
│   ├── client/          # Pantallas del cliente
│   │   ├── HomeScreen.js        # Dashboard principal con servicios
│   │   └── TrackingScreen.js    # Seguimiento en tiempo real
│   ├── provider/        # Pantallas del proveedor
│   │   └── HomeScreen.js        # Dashboard con solicitudes
│   └── admin/           # Pantallas del administrador
│       └── DashboardScreen.js   # Analytics y gestión
├── navigation/
│   └── AppNavigator.js  # Navegación por roles con tabs
├── theme/
│   └── index.js         # Design system completo
└── services/            # Integración con backend (TODO)
```

## 🎨 Design System

### Colores Principales
```javascript
PRIMARY: '#49C0BC'     // Turquesa Fresco - Acciones principales
SECONDARY: '#0E4D68'   // Azul Petróleo - Fondos secundarios
DARK: '#001B38'        // Azul Marino - Textos principales
WHITE: '#FFFFFF'       // Blanco - Fondos y contenido
```

### Componentes Disponibles

#### Botón (`Button`)
```jsx
<Button
  title="Solicitar Servicio"
  variant="primary"      // primary | secondary | outline | danger
  size="large"          // small | medium | large
  onPress={handlePress}
  fullWidth
  loading={isLoading}
/>
```

#### Input (`Input`)
```jsx
<Input
  label="Dirección"
  value={address}
  onChangeText={setAddress}
  mask="phone"          // phone | currency | date
  leftIcon={<Icon />}
  error={errors.address}
/>
```

#### Cards Especializados
```jsx
<ServiceCard
  title="Limpieza Completa"
  price="150.000"
  rating={4.8}
  onPress={handleSelect}
/>

<ProviderCard
  name="María González"
  rating={4.9}
  distance="2.3 km"
  isVerified={true}
/>
```

## 🔗 Integración con Backend

El frontend está diseñado para conectar con el backend Spring Boot existente:

### Endpoints Principales
- `GET /api/servicios` - Lista de servicios disponibles
- `POST /api/solicitudes` - Crear nueva solicitud
- `GET /api/tracking/{id}` - Seguimiento en tiempo real
- `WebSocket /ws/tracking` - Actualizaciones de ubicación

### Autenticación
- JWT tokens para autenticación
- Refresh tokens automático
- Roles de usuario (CLIENT, SERVICE_PROVIDER, ADMIN)

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js 16+ 
- React Native CLI
- Android Studio / Xcode
- Dispositivo/emulador Android/iOS

### Pasos de Instalación

1. **Instalar dependencias**
```bash
cd frontend
npm install
```

2. **Configurar plataformas**
```bash
# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

3. **Configurar variables de entorno**
```env
API_BASE_URL=http://localhost:8080/api
WEBSOCKET_URL=ws://localhost:8080/ws
GOOGLE_MAPS_API_KEY=your_api_key
```

## 📱 Capturas de Pantalla

### Cliente
- **Home:** Lista de servicios, promociones, categorías
- **Tracking:** Mapa en tiempo real, chat con proveedor

### Proveedor  
- **Dashboard:** Solicitudes pendientes, estadísticas del día
- **Estado:** Toggle online/offline, gestión de disponibilidad

### Admin
- **Analytics:** Gráficos de ingresos, usuarios, servicios
- **Gestión:** Herramientas administrativas

## 🔄 Estado de Desarrollo

### ✅ Completado
- [x] Design System completo con colores de marca
- [x] Componentes base (Button, Input, Card, Header)
- [x] Navegación por roles (3 experiencias distintas)
- [x] Pantallas principales para cada rol
- [x] Estructura de proyecto escalable

### 🚧 En Desarrollo
- [ ] Integración con APIs del backend
- [ ] Sistema de autenticación
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Geolocalización y mapas
- [ ] Pagos integrados

### 📋 Próximos Pasos
- [ ] Conectar con Spring Boot backend
- [ ] Implementar WebSocket para tracking
- [ ] Agregar pruebas unitarias
- [ ] Optimización de rendimiento
- [ ] Deploy en stores (Google Play, App Store)

## 🤝 Integración con Backend Existente

El backend Spring Boot ya está **100% funcional** con:
- ✅ 123 archivos Java compilados sin errores
- ✅ APIs REST completas para todas las funcionalidades
- ✅ WebSocket para seguimiento en tiempo real
- ✅ Integración con Wompi (pagos), Google Maps, Firebase
- ✅ Sistema de autenticación JWT
- ✅ Base de datos PostgreSQL configurada

### Conexión Frontend-Backend
```javascript
// services/api.js
const API_BASE = 'http://localhost:8080/api';

export const clienteApi = {
  obtenerServicios: () => fetch(`${API_BASE}/servicios`),
  crearSolicitud: (data) => fetch(`${API_BASE}/solicitudes`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  // ... más endpoints
};
```

## 📞 Soporte y Contacto

Para dudas sobre el frontend React Native o integración con el backend existente, contacta al equipo de desarrollo.

---

**HomeCare** - *Servicios de limpieza a domicilio con calidad profesional* 🏠✨