# HEARTBEAT.md - Autonomous Background Checklist

## Proactive Autonomous Tasks (Run on periodic heartbeat polls):
1. **Memory Maintenance**: Review recent `memory/YYYY-MM-DD.md` logs and distill important architectural updates into `MEMORY.md`.
2. **Security & Secrets Sanity**: Check that no `.env` or sensitive credentials have been staged or committed accidentally.
3. **Documentation Sync**: Verify that state changes, payment flows, and screen updates match `README.md` and `REPORTE_ESTADO_PROYECTO.md`.
4. **State Health**: Update `memory/heartbeat-state.json` with the latest check timestamps.

If all checks are healthy and no intervention is needed, reply `HEARTBEAT_OK`.
