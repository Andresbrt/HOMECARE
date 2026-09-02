---
name: api-security-and-penetration-defense
description: >-
  Advanced backend & API cybersecurity defense, OWASP API Security Top 10 mitigation,
  BOLA/IDOR protection, rate limiting (Bucket4j/Redis), and WebSocket STOMP endpoint hardening.
---

# API Security & Penetration Defense Skill

Use this skill when designing, reviewing, or hardening Spring Boot REST endpoints, WebSocket controllers, rate limiters, or token verification filters.

## 1. Broken Object Level Authorization (BOLA / IDOR Defense)
- Never rely solely on `@PreAuthorize("hasRole('ROLE_CUSTOMER')")`.
- Always verify ownership at the service layer:
  ```java
  // Correct: Ensure authenticated user owns the resource
  if (!solicitud.getCustomer().getId().equals(currentUser.getId())) {
      throw new AccessDeniedException("Unauthorized access to solicitud ID: " + id);
  }
  ```
- Use UUIDs or opaque identifiers for public URLs rather than sequential auto-incrementing database IDs to prevent enumeration attacks.

## 2. Rate Limiting & DoS Protection
- Apply token-bucket rate limiting (e.g. `Bucket4j` or Redis) on sensitive endpoints:
  - Auth login & refresh: max 5 attempts per minute per IP/User.
  - InDriver bidding / offer submission: max 20 offers per minute per provider.
  - Solicitud creation: max 10 requests per hour per customer.
- Return `429 Too Many Requests` with a `Retry-After` header when thresholds are exceeded.

## 3. JWT Cryptographic Hardening & Revocation
- Sign JWTs using strong algorithms (`HS512` or `RS256`).
- Set short lifespans for Access Tokens (15 to 30 minutes).
- Maintain an in-memory / Redis blacklist or token versioning table to immediately revoke tokens on password reset or logout.

## 4. WebSocket STOMP Endpoint Hardening
- Authenticate the initial WebSocket connection during the HTTP handshake interceptor (`ChannelInterceptor`).
- Validate channel subscription authorizations:
  - Reject subscriptions to `/topic/chat/{serviceId}` if the user is neither the customer nor the assigned provider.
  - Prevent unauthorized location spoofing on `/topic/tracking/{serviceId}`.
- Apply message size limits (`setMessageSizeLimit(64 * 1024)`) to block payload flooding.
