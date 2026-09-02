---
name: mercadopago-integration
description: >-
  Step-by-step procedures for managing Mercado Pago payment flows, preference generation,
  webhook signature verification, idempotency handling, and transaction lifecycle synchronization.
---

# Mercado Pago Integration Skill

Use this skill when modifying or validating payment flows, webhooks, or transaction state transitions.

## Workflow & Security Best Practices

1. **Preference Creation**:
   - Collect item details, currency (`COP`/local currency), and payer metadata.
   - Include auto_return settings and back_urls pointing to deep links or web callbacks.
2. **Webhook Verification**:
   - Always validate webhook signatures or fetch transaction status directly via Mercado Pago REST API before updating backend database records.
   - Implement idempotency keys to avoid duplicate transaction processing on retried webhooks.
3. **State Machine**:
   - Ensure payment status transitions: `PENDING` -> `APPROVED` | `REJECTED` | `CANCELLED`.
   - On `APPROVED`, trigger escrow hold or notify provider/customer via FCM push notifications and STOMP topic updates.
4. **Testing in Sandbox**:
   - Use official Mercado Pago test credentials and test cards. Never hardcode live production tokens.
