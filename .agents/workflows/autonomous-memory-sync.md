# Autonomous Memory & Health Monitor Workflow

**Role:** `Agent-Sentinel-SRE`  
**Trigger:** Periodic Heartbeat (2-4 times daily) / Background Cron  
**Goal:** Maintain system documentation, distill daily session notes into `MEMORY.md`, and check environment readiness.

## Execution Steps

1. **Heartbeat State Check**:
   - Read `memory/heartbeat-state.json`.
   - Ensure the last check was at least 30 minutes ago and not during silent hours (23:00 - 08:00).
2. **Memory Distillation**:
   - Review recent `memory/YYYY-MM-DD.md` daily notes.
   - Extract key architectural decisions, resolved issues, or preference updates into `MEMORY.md`.
3. **Environment & Dependency Sanity**:
   - Verify that configuration templates (`.env.example`) have no missing variables compared to active modules.
   - Clean up temporary files or outdated build artifacts safely.
4. **Heartbeat State Update**:
   - Update `memory/heartbeat-state.json` with timestamp and status.
