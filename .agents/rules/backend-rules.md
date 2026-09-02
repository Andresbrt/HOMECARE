# Backend Workspace Rules

1. **Stack**: Java 17 + Spring Boot 3.4.x + Maven.
2. **Domain-Driven Design**: Clean separation of concerns (Controller, Service, Repository, DTO, Model).
3. **Security**:
   - Explicit `@PreAuthorize` on controller endpoints.
   - Resource ownership checks (BOLA/IDOR protection) in service layers.
4. **JPA & Database**:
   - Prevent N+1 queries using `JOIN FETCH` / `@EntityGraph`.
   - Keep schema compatibility across H2 in-memory (dev) and PostgreSQL (prod).
5. **Real-time & Payments**:
   - STOMP WebSocket topic authorization and rate throttling.
   - HMAC-SHA256 signature verification & idempotency guard on Mercado Pago webhooks.
