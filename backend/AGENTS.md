# Backend Architecture & Security Rules (Java 17 + Spring Boot 3.x)

When modifying or creating files within the `backend/` workspace:

## 1. Domain-Driven Design (DDD)
- Adhere strictly to domain partitioning: `controller` -> `service` -> `repository` -> `model` -> `dto`.
- Controllers must remain thin. All business logic, price suggestions, validations, and state transitions belong in the `@Service` layer.

## 2. Security & RBAC Enforcement
- Guard every state-changing endpoint with explicit `@PreAuthorize`:
  - `hasRole('ROLE_CUSTOMER')`
  - `hasRole('ROLE_SERVICE_PROVIDER')`
  - `hasRole('ROLE_ADMIN')`
- **BOLA / IDOR Protection**: Always verify resource ownership (Customer ID / Provider ID) inside the service method before updating or returning entities.

## 3. Database & JPA Performance
- Prevent N+1 query problems: Use `JOIN FETCH` or `@EntityGraph` when loading entity relationships.
- Avoid eager fetching (`FetchType.EAGER`) on collections.
- Ensure database indexes are maintained on frequently queried fields (`status`, `user_id`, `created_at`).

## 4. Real-time WebSockets & Fintech Webhooks
- Enforce authentication on WebSocket STOMP channel handshakes and topic subscriptions.
- Validate Mercado Pago HMAC signatures and implement idempotency table checks on all payment webhooks.
