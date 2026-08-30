# Métricas de QA HomeCare

## Objetivos de cobertura
- Backend: > 70%
- Mobile: > 70%

## Métricas recomendadas

- Nº de tests unitarios ejecutados
- Nº de tests de integración ejecutados
- Nº de tests E2E ejecutados
- Tiempo total de ejecución de QA
- Coverage global de backend
- Coverage global de mobile

## Reportes automáticos

- Backend: `backend/target/site/jacoco/index.html`
- Mobile: `mobile/coverage/lcov-report/index.html`

## Interpretación rápida

- Rojo: coverage < 50%
- Amarillo: coverage 50-70%
- Verde: coverage > 70%

## Pasos para generar métricas

1. Backend:
   - `cd backend && mvn test -B -Dspring.profiles.active=test`
   - `cd backend && mvn jacoco:report`
2. Mobile:
   - `cd mobile && npm test:coverage`
3. Abrir los reportes generados.
