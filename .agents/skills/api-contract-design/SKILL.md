---
name: api-contract-design
description: >-
  Guidelines and specifications for RESTful API contracts, OpenAPI/Swagger 3 schemas,
  WebSocket STOMP event protocols, and backwards compatibility management.
---

# API Contract Design & WebSocket Protocol Skill

Use this skill when defining new REST endpoints, modifying DTO payloads, creating OpenAPI documentation, or expanding WebSocket real-time topics.

## 1. RESTful Standards & DTO Conventions
- Use standard HTTP verbs: `GET` (idempotent retrieval), `POST` (create), `PUT` / `PATCH` (update), `DELETE` (removal).
- Return consistent JSON response envelopes with standardized status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`).
- Define explicit request DTOs with Bean Validation annotations (`@NotNull`, `@NotBlank`, `@Size`, `@Min`, `@Max`).

## 2. OpenAPI / Swagger 3 Integration
- Annotate controllers with `@Tag` and endpoints with `@Operation(summary = "...", description = "...")`.
- Document response schemas using `@ApiResponse` to keep the mobile client team aligned.
- Accessible via `/swagger-ui/index.html` or `/v3/api-docs`.

## 3. WebSocket STOMP Protocol Design
- **Destination Prefixes**:
  - Application destination prefix: `/app` (client-to-server commands)
  - Simple broker topic prefix: `/topic` (server-to-client broadcasts)
  - User-specific queue prefix: `/queue` or `/user/queue` (direct notifications)
- **Message Payload Standardization**:
  - Every STOMP message payload should include a `type`, `timestamp`, `senderId`, and `payload` object.
