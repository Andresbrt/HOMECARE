# Autonomous Code & Security Audit Workflow

**Role:** `Agent-Architect-Auditor`  
**Trigger:** On-Demand, Git Pre-Commit, or Scheduled Routine  
**Goal:** Automatically analyze recent codebase changes for security risks, RBAC compliance, and architectural integrity without human intervention.

## Execution Steps

1. **Diff Analysis**:
   - Inspect modified files in `backend/` and `mobile/`.
2. **Security & RBAC Scan**:
   - Check `@PreAuthorize` annotations on all new Spring Boot endpoints.
   - Verify that no plaintext tokens or secrets exist in logs or code.
   - Check Firestore rule consistency against new document paths.
3. **Domain & Pattern Integrity**:
   - Confirm DDD separation (Controller -> Service -> Repository -> Model).
   - Check for N+1 JPA query antipatterns.
4. **Report Generation**:
   - Output findings to `docs/AUDIT_REPORT.md` or summarize in `MEMORY.md` if critical actions are needed.
