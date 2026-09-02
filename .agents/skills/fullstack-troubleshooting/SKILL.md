---
name: fullstack-troubleshooting
description: >-
  Systematic diagnostic procedures for debugging cross-platform mobile issues, WebSocket STOMP disconnects,
  authentication token refresh edge cases, geolocation tracking desync, and email delivery failures.
---

# Fullstack Troubleshooting Skill

Use this skill when diagnosing bugs, unexpected crashes, networking issues, or integration timeouts across mobile and backend.

## Diagnostic Procedures

1. **Authentication & Token Issues**:
   - Inspect token expiration timestamps vs. local device clock.
   - Trace refresh token rotation and ensure interceptors don't trigger infinite retry loops.
2. **WebSocket & Real-time Chat/GPS**:
   - Check STOMP handshake status and SockJS fallback availability.
   - Verify connection reconnect logic with exponential backoff on app foreground / background transitions.
3. **Geolocation & InDriver Bidding**:
   - Validate Haversine formula calculation inputs (latitude/longitude format in decimal degrees).
   - Check location permissions in `app.json` / `Info.plist` / `AndroidManifest.xml`.
4. **Email Delivery (Brevo SMTP)**:
   - Check SMTP authentication response codes and template variable mappings.
   - Verify SPF/DKIM DNS settings if delivery lands in spam folders.
