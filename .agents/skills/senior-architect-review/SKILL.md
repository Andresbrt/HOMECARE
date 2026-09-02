---
name: senior-architect-review
description: >-
  Quality audit and architectural review checklist for evaluating code changes, modularity,
  security implications, database indexing, and performance before merging or deploying.
---

# Senior Architect Code Review Skill

Use this skill when auditing codebase health, proposing structural refactors, or conducting pre-deployment quality checks.

## Review Dimensions

1. **Security & Data Safety**:
   - Check that no sensitive secrets or plaintext tokens are exposed in logs or mobile clients.
   - Verify RBAC authorization checks on every state-changing endpoint.
   - Validate Firestore and SQL injection safeguards.
2. **Performance & Scalability**:
   - Verify database indexes on filtered fields (e.g. geolocation bounds, status filters, user IDs).
   - Review memory allocations, event listener cleanups in `useEffect`, and WebSocket subscription lifecycles.
3. **Domain Integrity**:
   - Enforce single-responsibility principle across services and hooks.
   - Prevent duplicated business logic (e.g., tier calculation, pricing rules).
4. **Resilience & Error Handling**:
   - Ensure all asynchronous calls have explicit try/catch blocks and user-friendly fallback messaging.
   - Check offline / degraded connectivity handling in mobile clients.
