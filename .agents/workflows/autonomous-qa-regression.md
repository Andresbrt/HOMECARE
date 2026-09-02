# Autonomous QA & Regression Runner Workflow

**Role:** `Agent-QA-Automator`  
**Trigger:** Heartbeat / Scheduled Daemon / Pre-Release  
**Goal:** Verify system stability, run automated test suites, and detect regressions while the developer is away.

## Execution Steps

1. **Backend Verification**:
   - Run unit & integration test suites:
     `./mvnw test -Dtest=*UnitTest,*ServiceTest` (or `./gradlew test`)
   - Log any failing assertions or mock configuration issues.
2. **Mobile Client Verification**:
   - Run Jest tests & TypeScript validation:
     `npm test -- --watchAll=false`
3. **Diagnostics & Auto-Triaging**:
   - If tests fail, trace the root cause (e.g. broken DTO contract, expired test token, mock mismatch).
   - Create a diagnostic log under `memory/test-failures-<date>.log`.
