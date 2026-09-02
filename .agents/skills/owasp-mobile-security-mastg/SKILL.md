---
name: owasp-mobile-security-mastg
description: >-
  Advanced mobile application security following OWASP MASTG (Mobile Application Security Testing Guide),
  secure enclave key storage, root/jailbreak detection, certificate pinning, and biometric defense.
---

# OWASP Mobile Security & MASTG Defense Skill

Use this skill when auditing or implementing mobile storage, native security layers, biometric authentication, or network transport integrity in React Native / Expo.

## 1. Storage & Cryptographic Protection (MASVS-STORAGE & MASVS-CRYPTO)
- **Sensitive Data Storage**:
  - Never store auth tokens, refresh tokens, user PII, or credentials in standard `AsyncStorage` or unencrypted SQLite.
  - Store tokens strictly in `expo-secure-store` (backed by iOS Keychain / Android KeyStore hardware keystore).
  - Use AES-GCM 256-bit encryption for any cached offline payloads.
- **Memory & Ephemeral Data**:
  - Clear sensitive form fields (e.g. passwords, card CVVs) from component state immediately after submission.
  - Disable screen capture / task switcher previews for sensitive screens using `expo-screen-capture` if applicable.

## 2. Network & Transport Security (MASVS-NETWORK)
- **HTTPS & TLS Enforcement**:
  - Enforce TLS 1.3 / TLS 1.2 minimum across all backend and third-party API communication.
  - Prevent cleartext traffic by configuring `usesCleartextTraffic="false"` in `AndroidManifest.xml` and `NSAllowsArbitraryLoads = false` in `Info.plist`.
- **MitM Protection & Certificate Pinning**:
  - Audit network interceptors to ensure SSL/TLS certificate chain validation cannot be bypassed in production builds.

## 3. Platform & Resilience Controls (MASVS-RESILIENCE)
- **Root & Jailbreak Detection**:
  - Detect compromised OS environments before unlocking sensitive financial or provider workflows.
- **Tampering & Reverse Engineering**:
  - Obfuscate JS bundles in production releases (`enableHermes: true`).
  - Strip debug symbols, console logs, and development flags in production builds.

## 4. Biometric & Re-Authentication (MASVS-AUTH)
- Use `expo-local-authentication` for biometric validation (FaceID / Fingerprint) before executing high-value actions (e.g., accepting payments or transferring balances).
- Always pair biometric approval with backend cryptographic token validation (never rely on local device boolean alone).
