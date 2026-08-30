# Demo QA HomeCare

## Objetivo de la demo

Probar el flujo completo de la aplicación para preparar una demostración funcional.

## Flujo de demo recomendado

1. Abrir la app y mostrar la pantalla de login.
2. Ingresar con la cuenta de cliente de prueba.
3. Crear una nueva solicitud de servicio.
4. Cambiar a la cuenta de proveedor de prueba.
5. Ver solicitudes cercanas y enviar oferta.
6. Volver a la cuenta cliente.
7. Ver y aceptar la oferta.
8. Mostrar tracking del servicio.
9. Mostrar chat entre cliente y proveedor.
10. Ejecutar el pago en sandbox.
11. Ver historial de servicios y notificaciones.

## Cuentas de demo

- Cliente:
  - Email: `usuario@test.com`
  - Password: `Test123!`

- Profesional:
  - Email: `profesional@test.com`
  - Password: `Test123!`

## Criterios de éxito

- El usuario cliente puede crear solicitud sin errores.
- El proveedor puede enviar oferta y cliente puede aceptarla.
- El servicio pasa por estados de tracking.
- El chat funciona y se muestran mensajes.
- El proceso de pago transita hacia sandbox correctamente.

## Notas de demo

- Usa `qa/env/backend.env` y `qa/env/mobile.env` para el entorno.
- Verifica que las URLs de API y keys de sandbox estén configuradas.
- Si no funciona la pasarela de pago real, usa el modo sandbox de Mercado Pago.
