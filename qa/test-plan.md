# Plan de Pruebas QA HomeCare

## Alcance

### Backend
- Validar endpoints críticos.
- Validar seguridad y autorizaciones.
- Validar integraciones externas (pagos, notificaciones, almacenamiento).
- Validar manejo de errores.
- Medir cobertura de código.

### Mobile
- Validar navegación y flujos principales.
- Validar llamadas a APIs y manejo de errores.
- Validar estados compartidos (context, auth, offline).
- Validar componentes clave y UI.

## Tipos de pruebas

### Unitarias
- Backend: servicios, validadores, utilidades, seguridad.
- Mobile: hooks, componentes, servicios, context.

### Integración
- Backend: controladores + servicios + repositorios.
- Mobile: llamadas reales a API simuladas con mocks.

### E2E
- Mobile: flujo completo desde login hasta pago.
- Backend: smoke tests de endpoints REST.

### Manual
- Pruebas de UX en dispositivo real.
- Pruebas de accesibilidad.
- Pruebas de pagos sandbox.

## Herramientas recomendadas

- Backend: Maven + JUnit + Mockito + Spring Test + JaCoCo
- Mobile: Jest + React Native Testing Library
- E2E: Detox o Expo E2E (configurar como siguiente paso)

## Criterios de éxito

- 0 fallas en tests automáticos.
- Coverage mínimo recomendado: 70% backend + 70% mobile.
- Flujos críticos documentados y validados.
- Ambiente reproducible con variables `qa/env/`.
