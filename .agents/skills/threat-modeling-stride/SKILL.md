---
name: threat-modeling-stride
description: >-
  Systematic threat modeling framework based on STRIDE (Spoofing, Tampering, Repudiation,
  Information Disclosure, Denial of Service, Elevation of Privilege) for fintech and mobile systems.
---

# STRIDE Threat Modeling & Fintech Defense Skill

Use this skill when introducing new architecture components, third-party payment gateways, real-time messaging topics, or cloud permissions.

## 1. STRIDE Analysis Matrix

| Threat Category | Potential Attack in HomeCare | Architectural Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Fake provider sending GPS coordinates or fake bids. | Cryptographically verify JWT in STOMP headers and validate provider status in DB. |
| **Tampering** | Modifying bid price or payment amount in transit. | Validate prices and currency codes against server-side database records, not client payloads. |
| **Repudiation** | Provider claims they never accepted a service. | Maintain immutable audit logs (`AuditLog` entity) with timestamps, user IDs, and IP hashes. |
| **Information Disclosure** | Competitor providers viewing other providers' private bid prices. | InDriver privacy rule: only the customer receives full offer details; other providers only receive offer count. |
| **Denial of Service** | Flooding chat or creating millions of fake solicitudes. | Rate limiting per IP/user, payload size limits, and CAPTCHA / bot detection on registration. |
| **Elevation of Privilege** | Customer modifying role to `ROLE_ADMIN` via profile update. | Prevent user role fields from being updated through standard customer profile update DTOs. |

## 2. Fintech Payment Defense (Mercado Pago / Webhooks)
- **Signature Verification**:
  - Always verify `x-signature` and `x-request-id` headers using HMAC-SHA256 with the webhook secret.
- **Idempotency Guard**:
  - Store processed webhook notification IDs (`payment_notification_id`) in a unique-indexed table to prevent double-crediting or duplicate status changes.
- **Out-of-Band Status Verification**:
  - Fetch the payment state directly from Mercado Pago's REST API (`/v1/payments/{id}`) rather than trusting raw webhook payload parameters blindly.
