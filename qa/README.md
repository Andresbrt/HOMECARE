# QA HomeCare

Este directorio define la estructura mínima para arrancar QA en HOMECARE.

## Objetivo

Crear un proceso reproducible de aseguramiento de calidad para backend y mobile, con foco en:
- ejecución de tests automáticos
- cobertura de código
- casos de prueba clave
- ambiente de pruebas
- documentación de QA fácil de usar

## Qué hay aquí

- `checklist.md` — pasos prácticos para ejecutar QA
- `test-plan.md` — alcance y categorías de pruebas
- `cases/backend.md` — casos críticos de backend
- `cases/mobile.md` — casos críticos de mobile
- `env/backend.env.example` — variables de entorno de backend para QA
- `env/mobile.env.example` — variables de entorno de mobile para QA

## Cómo empezar

1. Configura los entornos de backend y mobile usando los ejemplos en `qa/env/`.
2. Ejecuta los tests backend:
   - `cd backend`
   - `mvn test -B -Dspring.profiles.active=test`
   - `mvn jacoco:report`
3. Ejecuta los tests mobile:
   - `cd mobile`
   - `npm test:unit`
   - `npm test:coverage`
4. Revisa los casos de prueba en `qa/cases/` y marca los flujos cubiertos.

## Estado actual

- Backend: tests unitarios e integración existentes, falta reporte automático de cobertura integrado.
- Mobile: existe Jest y pruebas unitarias básicas, falta estructura E2E definida.

## Próximos pasos recomendados

- Definir herramienta E2E mobile (Detox / Playwright / Expo E2E).
- Añadir casos de prueba para flujos críticos de negocio.
- Establecer un umbral de cobertura mínimo para pasar QA.
