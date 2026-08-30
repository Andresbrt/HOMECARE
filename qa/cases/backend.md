# Casos de prueba backend

## Endpoints críticos
- POST `/api/v1/auth/login` — login con email/password
- POST `/api/v1/auth/register` — registro de cliente/proveedor
- GET `/api/v1/solicitudes/cercanas` — solicitudes para proveedor
- POST `/api/v1/ofertas` — crear oferta
- POST `/api/v1/ofertas/{id}/aceptar` — aceptar oferta
- POST `/api/v1/payments/create` — iniciar pago
- POST `/api/v1/payments/webhook` — webhook de pagos
- POST `/api/v1/tracking/update` — actualización de ubicación
- GET `/api/v1/tracking/servicio/{id}` — obtener tracking

## Seguridad
- Acceso a rutas con token válido
- Rechazo de acceso con token inválido
- Rechazo de roles no autorizados
- Validación de payloads inválidos

## Casos importantes
- Registrar usuario cliente y proveedor con datos válidos
- Login fallido con contraseña incorrecta
- Proveedor intenta acceder a ruta de cliente y debe ser negado
- Cliente crea solicitud completa
- Proveedor ofrece sobre solicitud válida
- Cliente acepta oferta y se genera servicio aceptado
- Pago crea transacción y devuelve payload esperado
- Webhook de pago actualiza estado correctamente
- Tracking devuelve datos del servicio correcto
