# Checklist QA HomeCare

## Preparación de ambiente
- [ ] Revisar `qa/env/backend.env.example` y crear `qa/env/backend.env`.
- [ ] Revisar `qa/env/mobile.env.example` y crear `qa/env/mobile.env`.
- [ ] Iniciar servicios locales requeridos: PostgreSQL, Redis, Firebase (simulado o real), S3/Storage.

## Backend
- [ ] Ejecutar `cd backend && mvn test -B -Dspring.profiles.active=test`.
- [ ] Verificar que no haya fallos en los tests.
- [ ] Generar reporte de cobertura: `cd backend && mvn jacoco:report`.
- [ ] Abrir `backend/target/site/jacoco/index.html`.

## Mobile
- [ ] Ejecutar `cd mobile && npm test:unit`.
- [ ] Ejecutar `cd mobile && npm test:coverage`.
- [ ] Verificar que la cobertura sea aceptable.

## Casos críticos
- [ ] Registro y login de cliente.
- [ ] Registro y login de proveedor.
- [ ] Cliente crea solicitud.
- [ ] Proveedor envía oferta.
- [ ] Cliente acepta oferta.
- [ ] Tracking en tiempo real.
- [ ] Chat entre cliente/proveedor.
- [ ] Pago con Mercado Pago sandbox.

## Reporte
- [ ] Documentar resultados en este directorio.
- [ ] Anotar pruebas manuales adicionales realizadas.
- [ ] Marcar fallos y priorizar correcciones.
