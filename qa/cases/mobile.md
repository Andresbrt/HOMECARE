# Casos de prueba mobile

## Flujos principales
- Login de cliente
- Login de proveedor
- Registro de nuevo usuario
- Cliente crea solicitud
- Proveedor ve solicitudes y envía oferta
- Cliente visualiza y acepta oferta
- Chat en tiempo real entre cliente y proveedor
- Tracking de servicio en tiempo real
- Pago en sandbox con Mercado Pago
- Ver historial de servicios

## Componentes críticos
- `AuthContext`
- `AppNavigator`
- `CreateRequestScreen`
- `AvailableRequestsScreen`
- `SendOfferScreen`
- `ChatScreen`
- `ServiceTrackingScreen`
- `PaymentBricksScreen`

## Pruebas de UI
- Renderizado correcto de pantallas principales
- Navegación entre pantallas
- Mensajes de error visibles al fallar la API
- Loader/pantalla de carga en transiciones

## Mocks y datos de prueba
- Simular respuestas de API con `jest.mock`.
- Usar cuentas de prueba definidas en `qa/env/mobile.env.example`.
- Validar comportamiento sin conexión cuando sea posible.
