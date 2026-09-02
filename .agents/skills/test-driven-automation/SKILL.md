---
name: test-driven-automation
description: >-
  Standardized test workflows for unit, integration, and E2E testing across Spring Boot (JUnit 5, Mockito, MockMvc)
  and React Native Expo (Jest, React Native Testing Library).
---

# Test-Driven Automation & QA Skill

Use this skill when creating test suites, verifying bug fixes, preventing regressions, or measuring code coverage.

## 1. Backend Testing (Spring Boot / Java 17)
- **Unit Tests**: Use `JUnit 5` and `Mockito` to test domain business logic in isolation without spinning up full Spring contexts.
  - Test pricing calculation engines, distance algorithms (Haversine), and state machines.
- **Integration / Controller Tests**:
  - Use `@WebMvcTest` or `@SpringBootTest` with `@AutoConfigureMockMvc`.
  - Validate HTTP status codes, security filter chains (`@WithMockUser`), and JSON response payloads.
- **Run Command**: `./mvnw test` or `./gradlew test`.

## 2. Mobile Testing (React Native / Expo)
- **Component & Hook Tests**:
  - Use `@testing-library/react-native` and `jest`.
  - Mock native modules (`expo-location`, `expo-image-picker`, `reanimated`).
  - Test user interaction events (`fireEvent.press`) and asynchronous state changes (`waitFor`).
- **Run Command**: `npm test` or `yarn test`.

## 3. Test Coverage Strategy
- Target at least 80% branch coverage on core business logic (Payment flows, Offer bidding, Security filters).
- Always reproduce reported bugs with a failing unit test first before applying the code fix.
