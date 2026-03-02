# Java Upgrade Plan

**Session ID**: 20260302195225  
**Project**: HOMECARE Backend API  
**Date**: March 2, 2026

---

## 1. Executive Summary

This document outlines the upgrade plan for the HOMECARE Backend API from Java 17 to Java 23, along with Spring Boot framework upgrade from version 3.2.5 to 3.5.x and dependency updates to ensure compatibility and security.

### Current State
- **Java Version**: 17
- **Spring Boot Version**: 3.2.5
- **Build Tool**: Maven
- **Project Type**: Spring Boot REST API with WebSocket support

### Target State
- **Java Version**: 23
- **Spring Boot Version**: 3.5.x (latest stable)
- **Updated Dependencies**: All dependencies updated to latest stable versions compatible with Java 23

### Upgrade Goals
1. Migrate from Java 17 to Java 23
2. Upgrade Spring Boot from 3.2.5 to 3.5.x
3. Update all dependencies to latest stable versions
4. Ensure compatibility with Java 23
5. Maintain backward compatibility where possible
6. Address any deprecated APIs and EOL dependencies

---

## 2. Project Analysis

### 2.1 Project Structure
```
homecare-backend/
├── src/main/java/com/homecare/
├── src/main/resources/
├── pom.xml
└── target/
```

### 2.2 Build Configuration
- **Build Tool**: Apache Maven
- **Parent POM**: spring-boot-starter-parent 3.2.5
- **Java Version**: 17 (property: java.version)

### 2.3 Key Features
- REST API endpoints
- WebSocket real-time communication
- JWT authentication
- Database integration (PostgreSQL/H2)
- File storage (AWS S3)
- Push notifications (Firebase)
- Email notifications
- Excel report generation
- OpenAPI/Swagger documentation

---

## 3. Current Technology Stack

### 3.1 Core Framework
- **Spring Boot**: 3.2.5
- **Java**: 17

### 3.2 Spring Boot Starters
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-websocket
- spring-boot-starter-validation
- spring-boot-starter-mail
- spring-boot-starter-test (test scope)

### 3.3 Database
- **PostgreSQL Driver**: Managed by Spring Boot (runtime)
- **Hibernate/JPA**: Included via spring-boot-starter-data-jpa

### 3.4 Security & Authentication
- **Spring Security**: Via spring-boot-starter-security
- **JWT (JSON Web Tokens)**: 0.12.3
  - jjwt-api
  - jjwt-impl
  - jjwt-jackson

### 3.5 Documentation
- **SpringDoc OpenAPI**: 2.3.0 (springdoc-openapi-starter-webmvc-ui)

### 3.6 Cloud & External Services
- **AWS SDK S3**: 2.20.26
- **Firebase Admin SDK**: 9.2.0

### 3.7 Utilities
- **Apache POI**: 5.2.5 (poi-ooxml for Excel reports)
- **Lombok**: Managed by Spring Boot (optional)

### 3.8 Testing
- spring-security-test (test scope)

<!--
RULES FOR "Technology Stack" section:
1. List ALL direct dependencies from pom.xml (exclude transitive dependencies)
2. Group by category (Framework, Database, Security, Cloud Services, Utilities, etc.)
3. Include current version numbers for all explicitly versioned dependencies
4. For Spring Boot managed dependencies, note "Managed by Spring Boot X.X.X"
5. Mark End-of-Life (EOL) dependencies with "⚠️ EOL" flag
6. Use consistent formatting: "- **Name**: version (artifact-id)"
7. Include scope information where relevant (runtime, test, provided)
8. Sort alphabetically within each category
9. This section should be COMPLETE before proceeding to Derived Upgrades

SAMPLE FORMAT:
### 3.X Category Name
- **Dependency Name**: version (artifact-id) [scope if not compile] [⚠️ EOL if applicable]

EXAMPLE:
### 3.2 Database
- **H2 Database**: Managed by Spring Boot 3.2.5 (h2) [test scope]
- **PostgreSQL Driver**: Managed by Spring Boot 3.2.5 (postgresql) [runtime]

### 3.3 Security & Authentication
- **JWT (JJWT)**: 0.12.3 (jjwt-api, jjwt-impl, jjwt-jackson)
- **Spring Security**: Via spring-boot-starter-security
-->

---

## 4. Derived Upgrades

### 4.1 Framework Upgrades
- **Java**: 17 → 23 (Target upgrade, LTS release with enhanced pattern matching, virtual threads, and performance improvements)
- **Spring Boot**: 3.2.5 → 3.5.0 (Target upgrade, includes Spring Framework 6.2.x, security fixes, and Java 23 support)
- **Maven Compiler Plugin**: Auto-managed → 3.13.0 (REQUIRED: Java 23 compilation support)

### 4.2 Direct Dependency Upgrades

#### Security & Authentication
- **JJWT (JWT)**: 0.12.3 → 0.12.6 (RECOMMENDED: 🔒 Security enhancements, Java 23 compatibility verified)
  - Applies to: jjwt-api, jjwt-impl, jjwt-jackson

#### Documentation
- **SpringDoc OpenAPI**: 2.3.0 → 2.6.0 (RECOMMENDED: Spring Boot 3.5.x compatibility, improved Swagger UI, OpenAPI 3.1 support)

#### Cloud Services & External APIs
- **AWS SDK S3**: 2.20.26 → 2.29.20 (REQUIRED: Java 23 support, numerous performance improvements and security patches since 2.20.x)
  - ⚠️ Note: AWS SDK v2 2.20.x has known compatibility issues with Java 21+
- **Firebase Admin SDK**: 9.2.0 → 9.4.2 (RECOMMENDED: Java 23 compatibility, updated Google Auth libraries)

#### Utilities
- **Apache POI**: 5.2.5 → 5.3.0 (RECOMMENDED: Java 23 compatibility, improved XLSX performance)
  - Applies to: poi-ooxml

#### Spring Boot Managed Dependencies
- **PostgreSQL Driver**: Managed by Spring Boot 3.2.5 → Managed by Spring Boot 3.5.0 (Auto-upgrade: 42.6.x → 42.7.4)
- **H2 Database**: Managed by Spring Boot 3.2.5 → Managed by Spring Boot 3.5.0 (Auto-upgrade: 2.2.x → 2.3.232)
- **Lombok**: Managed by Spring Boot 3.2.5 → Managed by Spring Boot 3.5.0 (Auto-upgrade: likely 1.18.30 → 1.18.34, Java 23 support)
- **Hibernate Core**: Managed by Spring Boot 3.2.5 → Managed by Spring Boot 3.5.0 (Auto-upgrade: 6.4.x → 6.6.x, enhanced Java 23 record support)

### 4.3 Breaking Changes & Migration Notes

#### Java 17 → 23 Breaking Changes
1. **Pattern Matching**: Enhanced pattern matching for switch expressions may require code review
2. **Sealed Classes**: No breaking changes if not using sealed classes
3. **Foreign Function & Memory API**: Incubator features from Java 17 have evolved; review any native interop code
4. **Virtual Threads**: Safe to adopt; WebSocket and async operations may benefit from virtual thread pools

#### Spring Boot 3.2.5 → 3.5.0 Breaking Changes
1. **Spring Framework 6.2.x**: 
   - ⚠️ BREAKING: `RestTemplate` deprecation warnings increased; migration to `RestClient` recommended
   - Method signature changes in some `@Async` patterns
2. **Spring Data JPA**:
   - Enhanced null-safety annotations may trigger new compiler warnings
   - Query method naming conventions tightened
3. **Spring Security**:
   - `WebSecurityConfigurerAdapter` fully removed (already deprecated in 3.2.x)
   - OAuth2 resource server configuration changes
4. **Actuator**:
   - Micrometer observation API changes
   - Health indicator response format updates

#### Dependency-Specific Breaking Changes
1. **AWS SDK S3 (2.20.26 → 2.29.20)**:
   - ⚠️ BREAKING: Some exception types renamed (e.g., `S3Exception` structure changes)
   - `S3AsyncClient` API improvements may require async handler updates
   - Credential provider chain behavior changes
   
2. **SpringDoc OpenAPI (2.3.0 → 2.6.0)**:
   - Configuration property name changes: `springdoc.api-docs.path` → `springdoc.api-docs.path` (no breaking change)
   - Enhanced support for Spring Security 6.x may require security config review
   
3. **Firebase Admin SDK (9.2.0 → 9.4.2)**:
   - Google Auth library updates may affect token validation
   - No major breaking changes expected

#### Migration Actions Required
1. **POM Updates**:
   ```xml
   <java.version>23</java.version>
   <spring-boot.version>3.5.0</spring-boot.version>
   <jwt.version>0.12.6</jwt.version>
   <springdoc.version>2.6.0</springdoc.version>
   <aws-sdk.version>2.29.20</aws-sdk.version>
   <firebase.version>9.4.2</firebase.version>
   <poi.version>5.3.0</poi.version>
   ```

2. **Code Changes**:
   - Review and update any `RestTemplate` usage to `RestClient` or `WebClient`
   - Update AWS S3 exception handling
   - Test JWT token generation and validation
   - Verify WebSocket connection handling

3. **Configuration Changes**:
   - Review application.yml for deprecated Spring Boot properties
   - Update actuator endpoints if exposed
   - Review security filter chain configuration

4. **Testing Requirements**:
   - Full regression testing of authentication flows
   - AWS S3 file upload/download testing
   - Firebase push notification testing
   - Excel report generation validation
   - WebSocket real-time communication testing

<!--
RULES FOR "Derived Upgrades" section:
1. Research LATEST STABLE versions as of March 2026 for target Spring Boot 3.5.x + Java 23
2. For each dependency in Technology Stack, determine:
   a) Minimum version required for Java 23 compatibility
   b) Minimum version required for Spring Boot 3.5.x compatibility
   c) Latest stable version available
   d) Whether upgrade is REQUIRED, RECOMMENDED, or OPTIONAL
3. Format: "- **Name**: current_version → target_version (Reason: ...)"
4. Flag breaking changes with "⚠️ BREAKING" and provide migration notes
5. Flag security updates with "🔒 SECURITY"
6. Note if dependency can remain at current version with "✓ Compatible as-is"
7. Group upgrades by: Framework, Direct Dependencies, Build Plugins
8. Include specific version numbers (avoid ranges like "3.x" - use "3.5.0")

SAMPLE FORMAT:
### 4.1 Framework Upgrades
- **Java**: 17 → 23 (Target upgrade)
- **Spring Boot**: 3.2.5 → 3.5.0 (Target upgrade, includes security fixes)

### 4.2 Direct Dependency Upgrades
- **AWS SDK S3**: 2.20.26 → 2.29.15 (REQUIRED: Java 23 support, includes performance improvements)
- **JJWT**: 0.12.3 → 0.12.6 (RECOMMENDED: 🔒 Security fixes for token validation)
- **Firebase Admin**: 9.2.0 → ✓ Compatible with Java 23, upgrade OPTIONAL
-->

---

## 5. Risk Assessment

### 5.1 High Risk Areas

#### Critical (High Impact, High Likelihood)
1. **AWS SDK S3 Upgrade (2.20.26 → 2.29.20)**
   - Impact: HIGH - File storage is critical for application functionality
   - Likelihood: MEDIUM - Known breaking changes in exception handling and async API
   - Risk: Service disruption if S3 operations fail
   - Affected Features: Avatar uploads, service photos, attachments

2. **Spring Security Configuration Changes**
   - Impact: HIGH - Authentication is core to application security
   - Likelihood: MEDIUM - Spring Security 6.x evolving rapidly
   - Risk: Authentication failures, unauthorized access
   - Affected Features: JWT authentication, role-based access control

#### Moderate (Medium Impact)
3. **Firebase Admin SDK Upgrade (9.2.0 → 9.4.2)**
   - Impact: MEDIUM - Push notifications are important but not critical to core operations
   - Likelihood: LOW - Minor version upgrade with few breaking changes
   - Risk: Push notification delivery failures
   - Affected Features: Real-time notifications to mobile clients

4. **SpringDoc OpenAPI Upgrade (2.3.0 → 2.6.0)**
   - Impact: LOW - Documentation tool, doesn't affect runtime functionality
   - Likelihood: LOW - Well-maintained project with stable API
   - Risk: Swagger UI not loading, API docs inaccurate
   - Affected Features: Developer documentation, API testing interface

#### Low Risk
5. **Apache POI Upgrade (5.2.5 → 5.3.0)**
   - Impact: LOW - Report generation is asynchronous and can be retried
   - Likelihood: LOW - Minor version with backward compatibility
   - Risk: Excel report generation failures
   - Affected Features: Admin analytics reports

### 5.2 Compatibility Concerns

#### Java 23 Specific Concerns
1. **Virtual Threads**: 
   - Spring Boot 3.5.0 has improved virtual thread support
   - WebSocket and async operations may exhibit different behavior
   - Performance characteristics may change
   
2. **Record Patterns**:
   - Enhanced pattern matching may affect existing switch statements
   - Lombok-generated code should be reviewed

3. **Third-Party Libraries**:
   - Some annotation processors may not be Java 23-ready
   - Reflection-based frameworks (like Spring) generally compatible but require testing

#### Spring Boot 3.5.0 Specific Concerns
1. **RestTemplate Deprecation**:
   - Review codebase for RestTemplate usage (if calling external APIs)
   - Migration to RestClient adds refactoring overhead
   
2. **Actuator Changes**:
   - Health check endpoint format changes may break monitoring integrations
   - Prometheus metrics format may change

3. **Spring Data JPA**:
   - Query derivation rules tightened - some method names may need adjustment
   - Enhanced null-safety may expose existing issues

#### Dependency Compatibility Matrix
| Dependency | Java 23 | Spring Boot 3.5.0 | Status |
|------------|---------|-------------------|---------|
| JJWT 0.12.6 | ✅ Yes | ✅ Yes | Compatible |
| AWS SDK 2.29.20 | ✅ Yes | ✅ Yes | Compatible |
| Firebase 9.4.2 | ✅ Yes | ✅ Yes | Compatible |
| SpringDoc 2.6.0 | ✅ Yes | ✅ Yes | Compatible |
| Apache POI 5.3.0 | ✅ Yes | ✅ Yes | Compatible |
| PostgreSQL Driver 42.7.x | ✅ Yes | ✅ Yes | Managed |
| Lombok 1.18.34 | ✅ Yes | ✅ Yes | Managed |

### 5.3 Mitigation Strategies

#### Pre-Upgrade Mitigations
1. **Comprehensive Test Suite**:
   - Ensure unit test coverage is >70% before upgrade
   - Create integration tests for AWS S3 operations
   - Add end-to-end tests for authentication flows
   
2. **Environment Isolation**:
   - Perform upgrade in dedicated development environment
   - Use feature flag for gradual rollout if possible
   - Maintain separate Java 17 environment for rollback

3. **Dependency Analysis**:
   - Run `mvn dependency:tree` to identify transitive dependency conflicts
   - Use `mvn versions:display-dependency-updates` to verify version choices
   - Check for CVE vulnerabilities in target versions

#### During Upgrade Mitigations
1. **Incremental Approach**:
   - Phase 1: Update Java to 23 only (keep Spring Boot 3.2.5)
   - Phase 2: Update Spring Boot to 3.5.0
   - Phase 3: Update individual dependencies
   - This isolates issues to specific upgrade steps

2. **Backward Compatibility**:
   - Keep deprecated API stubs active during transition
   - Use @SuppressWarnings sparingly and document reasons
   - Maintain feature parity with pre-upgrade version

3. **Monitoring & Logging**:
   - Increase log verbosity during initial deployment
   - Monitor error rates, response times, and resource usage
   - Set up alerts for authentication failures and S3 errors

#### Post-Upgrade Mitigations
1. **Smoke Testing Checklist**:
   - [ ] User login (JWT generation and validation)
   - [ ] Service request creation
   - [ ] File upload to S3 (avatar, photos)
   - [ ] WebSocket connection and real-time updates
   - [ ] Push notification delivery (Firebase)
   - [ ] Excel report generation
   - [ ] Database operations (CRUD on all entities)

2. **Performance Validation**:
   - Compare response times before/after upgrade
   - Monitor JVM memory usage (Java 23 may have different GC behavior)
   - Check thread pool utilization (especially with virtual threads)

3. **Rollback Readiness**:
   - Document exact steps to revert changes
   - Keep Java 17 JDK installed alongside Java 23
   - Tag Git commit before upgrade for easy rollback
   - Maintain database backup if schema changes occurred

#### High Priority Testing Areas
1. **Authentication Flow**: Login, token refresh, logout
2. **AWS S3 Operations**: Upload, download, delete, presigned URLs
3. **WebSocket**: Connect, disconnect, message broadcast
4. **Firebase**: Push notification registration and delivery
5. **Database**: Entity persistence, complex queries, transactions
6. **Excel Reports**: Generation, download, data accuracy

#### Contingency Plans
- **If AWS S3 issues**: Revert AWS SDK to 2.20.26 temporarily while investigating
- **If authentication breaks**: Hot-patch JWT configuration, consider emergency rollback
- **If performance degrades**: Review virtual thread usage, adjust thread pool configurations
- **If database errors**: Check Hibernate dialect compatibility, review query syntax

---

## 6. Upgrade Execution Plan

### 6.1 Phase 1: Environment Preparation
1. Backup current codebase
2. Install Java 23 JDK
3. Update Maven configuration
4. Create feature branch for upgrade

### 6.2 Phase 2: POM Updates
1. Update java.version property to 23
2. Update spring-boot-starter-parent to 3.5.x
3. Update direct dependencies per Derived Upgrades section
4. Update Maven plugins if needed

### 6.3 Phase 3: Code Migration
1. Address deprecated API usage
2. Update import statements
3. Resolve compiler errors
4. Fix breaking changes

### 6.4 Phase 4: Testing & Validation
1. Run Maven clean compile
2. Execute unit tests
3. Execute integration tests
4. Manual smoke testing
5. Performance validation

### 6.5 Phase 5: Documentation
1. Update README.md
2. Update deployment documentation
3. Document breaking changes
4. Update API documentation

---

## 7. Success Criteria

- [ ] Project compiles successfully with Java 23
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No security vulnerabilities in dependencies
- [ ] API functionality preserved
- [ ] Performance metrics within acceptable range
- [ ] Documentation updated

---

## 8. Rollback Plan

1. Revert to backup branch
2. Restore Java 17 environment
3. Restore original pom.xml
4. Rebuild and redeploy

---

## 9. Timeline

- **Phase 1**: 1 hour
- **Phase 2**: 2 hours
- **Phase 3**: 4-8 hours
- **Phase 4**: 4 hours
- **Phase 5**: 2 hours

**Total Estimated Time**: 13-17 hours

---

## 10. Sign-off

- [ ] Plan reviewed by Development Team
- [ ] Plan approved by Technical Lead
- [ ] Stakeholders notified
- [ ] Ready for execution

---

*Document generated for Java Upgrade Session 20260302195225*
