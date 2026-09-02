---
name: spring-boot-backend-ops
description: >-
  Operational runbook and standards for Java 17 + Spring Boot 3.x backend development,
  Domain-Driven Design (DDD), Spring Security RBAC, WebSocket STOMP handlers, and JPA/Database operations.
---

# Spring Boot Backend Operations Skill

Use this skill when developing, refactoring, or debugging the Java 17 / Spring Boot backend services and controllers.

## Architecture & Conventions

1. **Domain-Driven Organization**:
   - Keep controllers, services, repositories, DTOs, and domain models cleanly partitioned under their respective business domains (user, solicitud, offer, service, payment, review, tracking).
2. **Security & RBAC**:
   - Guard controller endpoints with `@PreAuthorize("hasRole('ROLE_CUSTOMER')")`, `@PreAuthorize("hasRole('ROLE_SERVICE_PROVIDER')")`, or `@PreAuthorize("hasRole('ROLE_ADMIN')")`.
   - Ensure JWT authentication filter extracts claims without blocking public auth endpoints.
3. **Real-time WebSockets (STOMP)**:
   - Topic routing for chat (`/topic/chat/{serviceId}`) and GPS location broadcast (`/topic/tracking/{serviceId}`).
   - Verify heartbeat configs and session disconnect handlers.
4. **Database & Persistence**:
   - Follow JPA best practices to prevent N+1 query problems (use `JOIN FETCH` or `@EntityGraph`).
   - Keep schema migrations consistent between H2 in-memory (dev) and PostgreSQL (production).

## Verification Commands
- Check compilation and run tests via `./mvnw clean test` or `./gradlew test`.
- Verify Swagger documentation endpoints at `/swagger-ui/index.html`.
