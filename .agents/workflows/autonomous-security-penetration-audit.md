# Autonomous Security & Penetration Audit Workflow

**Role:** `Agent-SecOps-Guardian` (Cybersecurity Specialist)  
**Trigger:** On-Demand, Git Pre-Push, Scheduled Weekly Audit, or Security Incident  
**Goal:** Automatically audit the entire application attack surface (Mobile client, REST endpoints, WebSockets, Payment Webhooks, and Firestore rules) against OWASP and STRIDE standards.

## Execution Steps

1. **Mobile Attack Surface Analysis**:
   - Verify that all sensitive tokens use `expo-secure-store`.
   - Check that `AsyncStorage` contains no auth tokens, passwords, or PII.
   - Verify `enableHermes: true` and production minification flags.
2. **Backend REST & WebSocket Penetration Scan**:
   - Audit all Spring Boot controllers for missing `@PreAuthorize` or IDOR vulnerabilities.
   - Validate DTOs for `@Valid`, `@NotNull`, and regex sanitization to block SQL/XSS injections.
   - Verify that WebSocket channel interceptors enforce topic-level authorization.
3. **Fintech & Webhook Defense**:
   - Audit Mercado Pago webhook controllers for HMAC-SHA256 signature checks and idempotency table lookups.
   - Confirm server-side pricing validation (never trust client amounts).
4. **Cloud & Secrets Audit**:
   - Verify `.env` is ignored by Git.
   - Scan for hardcoded API keys or test credentials across the codebase.
   - Validate Firestore Security Rules for restricted read/write access.
5. **Security Report Delivery**:
   - Generate or update `docs/SECURITY_AUDIT_REPORT.md` with severity ratings (Critical, High, Medium, Low) and concrete remediations.
