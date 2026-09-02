---
name: git-release-manager
description: >-
  Standard procedures for version bumping, semantic commits, automated changelog generation,
  and deployment artifact packaging for both mobile and backend services.
---

# Git & Release Management Skill

Use this skill when preparing releases, tagging versions, creating delivery artifacts, or organizing commit history.

## Standard Release Workflow

1. **Pre-Release Verification**:
   - Confirm all test suites pass on both backend (`./mvnw test`) and mobile (`npm test` / typecheck).
   - Ensure environment configs (`.env`, `application-prod.properties`) have all required keys defined in templates.
2. **Semantic Versioning**:
   - Follow `MAJOR.MINOR.PATCH` convention.
   - Update `app.json` (`version` and `buildNumber`/`versionCode`) for Expo mobile builds.
   - Update `pom.xml` / `build.gradle` for Spring Boot backend.
3. **Changelog & Documentation**:
   - Document added features, bugfixes, and security patches in `docs/` or release notes.
   - Record architectural changes in `MEMORY.md`.
4. **Git Tagging**:
   - Create annotated tags: `git tag -a vX.Y.Z -m "Release vX.Y.Z - Description"`.
