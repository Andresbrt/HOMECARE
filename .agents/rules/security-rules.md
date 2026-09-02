# Global Security & Hardening Rules

1. **Secrets & Credentials**:
   - Never write or stage plaintext passwords, API keys, or JWT tokens in source code or Git.
   - Always verify `.env` is ignored by version control.
   - Mask sensitive values in application logs (e.g. `sk-a1b2****`).
2. **OWASP Mobile & API Compliance**:
   - Use `expo-secure-store` for client tokens.
   - Validate DTO fields with Bean Validation (`@Valid`, `@NotNull`, regex constraints).
   - Enforce HTTPS/TLS 1.2+ minimum across all outbound connections.
3. **Execution Safety**:
   - Destructive operations (`rm`, `drop`, `truncate`) require explicit Owner confirmation.
