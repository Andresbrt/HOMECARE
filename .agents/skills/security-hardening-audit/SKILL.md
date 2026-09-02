---
name: security-hardening-audit
description: >-
  Systematic security review for API endpoints, JWT token handling, RBAC permissions,
  OWASP Mobile & API security standards, and credential leak prevention.
---

# Security Hardening & Audit Skill

Use this skill when auditing backend endpoints, mobile client storage, authentication handlers, or before releasing new features to production.

## 1. Authentication & Token Management
- Ensure JWT access tokens have reasonable expiration windows (e.g. 15m–60m) and refresh tokens are securely rotated.
- Verify that refresh tokens cannot be abused if invalidated in backend state or blacklists.
- In mobile, store sensitive tokens in `expo-secure-store` or secure encrypted storage (never plain `AsyncStorage` or global variables).

## 2. API & Controller Authorization (RBAC)
- Verify that every non-public endpoint has explicit `@PreAuthorize` annotations in Spring Boot.
- Check Object-Level Authorization (BOLA/IDOR): Verify that users can only view or mutate their own `Solicitud`, `Offer`, or `Payment` resources.
- Validate role hierarchies: `ROLE_CUSTOMER`, `ROLE_SERVICE_PROVIDER`, `ROLE_ADMIN`.

## 3. Data Protection & Secrets Leak Prevention
- Mask all sensitive tokens, phone numbers, and emails in application logs (use patterns like `sk-****`).
- Never commit `.env` or production credentials to Git repository.
- Use parameterized queries or Spring Data JPA repositories to prevent SQL injection.

## 4. Webhook & Signature Hardening
- For Mercado Pago and third-party webhooks, always compute and verify cryptographic HMAC signatures before processing transaction changes.
- Ensure all webhook receivers are strictly idempotent.
