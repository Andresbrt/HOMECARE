# 🏠 HOMECARE - Plataforma de Servicios de Limpieza

## Modelo de Negocio: inDriver

**Sistema de Ofertas Competitivas**
- Cliente publica solicitud → Proveedores ofertan → Cliente elige manualmente
- NO asignación automática
- NO precios fijos por la app
- Competencia libre entre proveedores
- Negociación directa por chat

## 🎨 Diseño Minimalista Profesional

### Paleta de Colores (Manual de Marca)
- **#001B38** - Azul Marino Profundo (textos, headers)
- **#0E4D68** - Azul Petróleo (fondos secundarios, cards)
- **#49C0BC** - Turquesa Fresco (botones, CTAs, estados activos)
- **#FFFFFF** - Blanco Puro (fondo principal)

### Tipografía
- **Monigue DEMO** - Logo y branding puntual
- **Arial Narrow** - UI y contenido

## 🏗️ Arquitectura del Sistema

### Backend
- **Java 17 + Spring Boot 3.2.x**
- PostgreSQL
- Spring Security + JWT
- WebSocket (Chat en tiempo real)
- Swagger/OpenAPI 3
- Integración Wompi (Pagos)

### Mobile
- **React Native + Expo**
- React Navigation
- Context API + AsyncStorage
- OAuth Google
- Geolocalización, Cámara, Push Notifications

### Web
- HTML5, CSS3, JavaScript ES6+
- Responsive (Mobile First)
- PWA Ready
- Modo oscuro automático

## 👥 Roles del Sistema

### 🛍️ CLIENTE
- Publica solicitudes con detalles
- Define precio máximo (opcional)
- Recibe múltiples ofertas privadas
- Negocia por chat
- Elige manualmente la mejor oferta
- Paga y califica el servicio

### 🧹 PROVEEDOR
- Ve solicitudes cercanas (geolocalización)
- Decide a cuáles ofertar
- Propone SU propio precio competitivo
- Ve cantidad de ofertas (NO precios de competidores)
- Negocia por chat
- Actualiza estados del servicio
- Ve ganancias y estadísticas

### 👔 ADMIN
- Gestión total del sistema
- Métricas y reportes
- Configuración global
- Moderación de contenido

## 🔥 Flujo Principal (Modelo inDriver)

1. **Publicación**: Cliente crea solicitud con detalles y precio máximo opcional
2. **Ofertas**: Proveedores cercanos envían propuestas con SU precio
3. **Competencia**: Ofertas privadas, proveedores solo ven cantidad
4. **Negociación**: Chat directo antes de aceptar
5. **Elección**: Cliente revisa ofertas y elige manualmente
6. **Servicio**: Tracking en tiempo real, estados del servicio
7. **Pago**: Integración con Wompi
8. **Calificación**: Mutua entre cliente y proveedor

## 📱 Pantallas Principales

- Home / Dashboard
- Crear Solicitud
- Lista de Solicitudes Activas
- Detalle de Solicitud
- Enviar Oferta (Proveedor)
- Ver Ofertas (Cliente)
- Chat en Tiempo Real
- Tracking del Servicio
- Perfil y Reputación
- Historial y Estadísticas

## 🗄️ Base de Datos

- usuarios
- roles
- solicitudes
- ofertas
- servicios_aceptados
- mensajes
- calificaciones
- pagos
- notificaciones

## 🔐 Seguridad

- JWT con refresh tokens
- Autorización por roles (RBAC)
- Validaciones robustas en backend
- Prevención de fraudes
- Rate limiting
- SQL injection prevention

## ✅ Validación del Modelo inDriver

✓ Cliente publica y recibe ofertas → **SÍ**
✓ Proveedor propone su propio precio → **SÍ**
✓ Cliente elige manualmente → **SÍ**
✓ Hay negociación por chat → **SÍ**
✓ La app NO fija precios → **SÍ**

---

**Startup Premium • Orden • Confianza • Compromiso • Atención al Detalle**
