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

## 5. Available Tools

### 5.1 Java Development Kits (JDKs)

The following JDKs are available for this upgrade:

1. **JDK 11.0.22** (Installed)
   - Location: `C:/Users/PC/.jdks/corretto-11.0.22/bin`
   - Usage: Reference only - not used in this upgrade

2. **JDK 17.0.17** (Current)
   - Location: `C:/Program Files/Microsoft/jdk-17.0.17.10-hotspot/bin`
   - Usage: Current baseline, used in Steps 2-3

3. **JDK 20.0.2** (Installed)
   - Location: `C:/Program Files/Java/jdk-20/bin`
   - Usage: Not used in this upgrade (interim release)

4. **JDK 23** **<TO_BE_INSTALLED>**
   - Location: TBD (to be installed in Step 1)
   - Usage: Target JDK, used in Steps 4-7
   - Download: https://jdk.java.net/23/ or use IDE JDK installer

### 5.2 Build Tools

#### Maven
- **Status**: Not found in PATH; no Maven wrapper (mvnw.cmd) in project
- **Required Version**: Maven 3.6.3+ (recommended 3.9.x for Java 23)
- **Action Required**: Install Maven 3.9.x in Step 1 or use IDE embedded Maven
- **Alternative**: Download from https://maven.apache.org/download.cgi

#### Build Commands
All Maven commands in this plan assume Maven is available. Adjust paths as needed:
- If Maven in PATH: `mvn <goals>`
- If Maven installed elsewhere: Use full path to `mvn.cmd`
- If using IDE Maven: Use IDE's Maven runner

---

## 6. Key Challenges

This upgrade presents several key challenges that require careful handling:

### 6.1 AWS SDK Major Version Jump (2.20.26 → 2.29.20)
**Challenge**: AWS SDK 2.20.x has known compatibility issues with Java 21+ and includes several breaking changes in exception handling, credential providers, and async client APIs.

**Impact**: 
- File upload/download functionality (avatars, service photos, attachments)
- S3 exception handling may break existing error recovery logic
- Async S3 operations may require handler updates

**Mitigation Strategy**:
- Update AWS SDK early in Step 3 (before Java 23 switch)
- Test S3 operations thoroughly with JDK 17 first
- Review all `S3Client` and `S3AsyncClient` usage
- Update exception handling to use new exception structures
- Validate presigned URL generation

### 6.2 Spring Boot 3.5.0 Framework Changes
**Challenge**: Spring Boot 3.5.0 includes Spring Framework 6.2.x with significant changes:
- Enhanced `RestTemplate` deprecation (migration to `RestClient` recommended)
- Spring Security configuration updates
- Actuator endpoint format changes
- Spring Data JPA query derivation rule tightening

**Impact**:
- Any external API calls using `RestTemplate` may need refactoring
- Security filter chain configuration may require updates
- Monitoring/health check integrations may break
- Custom repository query methods may need renaming

**Mitigation Strategy**:
- Use intermediate Spring Boot 3.4.x (Step 5) before 3.5.0
- Search codebase for `RestTemplate` usage and plan migration
- Review security configuration for deprecated patterns
- Test all custom JPA queries after upgrade
- Validate actuator endpoints if exposed

### 6.3 Java 23 Virtual Threads and Concurrency
**Challenge**: Java 23 includes virtual threads (JEP 444) which Spring Boot 3.5.0 can leverage. WebSocket and async operations may exhibit different concurrency behavior.

**Impact**:
- WebSocket connection handling may use different thread pools
- Async `@Async` methods may behave differently
- Performance characteristics may change (usually improved)

**Mitigation Strategy**:
- Monitor thread pool sizes and behavior after Java 23 switch
- Test WebSocket real-time messaging under load
- Review `@Async` method configurations
- Consider enabling virtual threads explicitly if benefits observed

### 6.4 JWT Token Validation (JJWT 0.12.3 → 0.12.6)
**Challenge**: JJWT library updates include security enhancements that may affect token generation and validation.

**Impact**:
- Existing JWT tokens may need regeneration
- Token signing/verification algorithms may have stricter validation
- User authentication flows could break

**Mitigation Strategy**:
- Update JJWT early in Step 3 (with JDK 17 for isolation)
- Test login, token refresh, and logout flows thoroughly
- Validate token expiration handling
- Check role-based access control after upgrade

### 6.5 Firebase Admin SDK Google Auth Library Updates
**Challenge**: Firebase Admin SDK 9.4.2 includes updated Google Auth libraries that may affect token validation and FCM message sending.

**Impact**:
- Push notification delivery may fail
- Firebase token validation may change
- FCM message format compatibility

**Mitigation Strategy**:
- Update Firebase in Step 3 along with other dependencies
- Test push notification registration and delivery
- Validate FCM message payload format
- Monitor notification delivery rates after deployment

---

## 7. Risk Assessment

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

## 8. Upgrade Steps

This section provides the detailed, step-by-step execution plan for the Java and Spring Boot upgrade. Each step must be completed in sequence, with verification before proceeding to the next step.

### Step 1: Environment Setup and Tooling Verification

**Rationale**: Before making any code changes, we must ensure all required tools are installed and accessible. This includes installing JDK 23 (the target Java version) and verifying Maven availability for building the project.

**Prerequisites**: 
- Git working branch `appmod/java-upgrade-20260302195225` checked out
- Admin/install privileges for JDK installation

**Changes to Make**:
1. Install JDK 23 from https://jdk.java.net/23/ or use IDE's JDK manager
2. Verify JDK 23 installation: `"<JDK23_PATH>/bin/java" -version`
3. Install Maven 3.9.12+ if not available (download from https://maven.apache.org/download.cgi)
4. Set `JAVA_HOME` environment variable to JDK 23 path temporarily (for verification only)
5. Verify Maven can detect JDK 23: `mvn -version`

**Verification**:
- **Command**: `"C:/Users/PC/.jdks/jdk-23/bin/java" -version` (adjust path based on installation)
- **Expected Output**: `openjdk version "23"` or `java version "23"`
- **JDK Used**: JDK 23 (newly installed)
- **Success Criteria**: JDK 23 installed, Maven 3.9+ available, both accessible from command line

---

### Step 2: Baseline Validation with Current Configuration

**Rationale**: Establish a baseline by compiling and testing the project with the current JDK 17 and Spring Boot 3.2.5. This documents the starting state and ensures the current configuration is stable before making changes. Any failures here must be resolved before proceeding.

**Prerequisites**:
- Step 1 completed (though we'll use JDK 17 for this step)
- Current branch has no uncommitted changes

**Changes to Make**:
1. Verify pom.xml still has `<java.version>17</java.version>`
2. Set `JAVA_HOME` to JDK 17: `C:/Program Files/Microsoft/jdk-17.0.17.10-hotspot`
3. Clean build directory: `mvn clean`
4. Compile project: `mvn compile -q`
5. Run test suite: `mvn test -q` (document results - failures may exist)

**Verification**:
- **Command**: `mvn clean compile test -q`
- **Expected Output**: BUILD SUCCESS, compilation passes (test failures documented but not blocking)
- **JDK Used**: JDK 17.0.17 at `C:/Program Files/Microsoft/jdk-17.0.17.10-hotspot/bin`
- **Success Criteria**: Project compiles successfully with Java 17; test results documented as baseline

---

### Step 3: Update Critical Dependencies (AWS SDK, JWT, Firebase, POI, SpringDoc)

**Rationale**: Update critical dependencies to versions compatible with Java 23 and Spring Boot 3.5.x BEFORE switching Java versions. This isolates dependency issues from Java version issues. AWS SDK 2.20.26 has known Java 21+ compatibility issues, making this upgrade essential.

**Prerequisites**:
- Step 2 completed with successful compilation
- Still using JDK 17 for this step

**Changes to Make**:
1. In `pom.xml`, update `<properties>`:
   - `<jwt.version>0.12.3</jwt.version>` → `<jwt.version>0.12.6</jwt.version>`
   - `<springdoc.version>2.3.0</springdoc.version>` → `<springdoc.version>2.6.0</springdoc.version>`
2. In `<dependencies>`, update AWS SDK version:
   - `<version>2.20.26</version>` → `<version>2.29.20</version>` (for `software.amazon.awssdk:s3`)
3. In `<dependencies>`, update Firebase version:
   - `<version>9.2.0</version>` → `<version>9.4.2</version>` (for `firebase-admin`)
4. In `<dependencies>`, update Apache POI version:
   - `<version>5.2.5</version>` → `<version>5.3.0</version>` (for `poi-ooxml`)
5. Run `mvn clean compile -q` to download new dependencies and compile

**Verification**:
- **Command**: `mvn clean compile -q`
- **Expected Output**: BUILD SUCCESS, no compilation errors
- **JDK Used**: JDK 17.0.17 at `C:/Program Files/Microsoft/jdk-17.0.17.10-hotspot/bin`
- **Success Criteria**: Project compiles successfully with updated dependencies; AWS S3, JWT, Firebase code compiles without errors

---

### Step 4: Switch to Java 23 (Keep Spring Boot 3.2.5)

**Rationale**: Migrate to Java 23 while keeping Spring Boot at 3.2.5. This isolates Java version compatibility issues from Spring Boot upgrade issues. At this stage, we verify that all code and dependencies compile with Java 23.

**Prerequisites**:
- Step 3 completed with successful compilation
- JDK 23 installed and verified in Step 1

**Changes to Make**:
1. In `pom.xml`, update `<java.version>17</java.version>` → `<java.version>23</java.version>`
2. Add explicit Maven Compiler Plugin configuration in `<build><plugins>`:
   ```xml
   <plugin>
       <groupId>org.apache.maven.plugins</groupId>
       <artifactId>maven-compiler-plugin</artifactId>
       <version>3.13.0</version>
       <configuration>
           <release>23</release>
       </configuration>
   </plugin>
   ```
3. Set `JAVA_HOME` to JDK 23 path (identified in Step 1)
4. Run `mvn clean compile -q` with JDK 23

**Verification**:
- **Command**: `mvn clean compile -q`
- **Expected Output**: BUILD SUCCESS, compilation passes with Java 23
- **JDK Used**: JDK 23 at `<installation_path_from_step1>/bin` (e.g., `C:/Users/PC/.jdks/jdk-23/bin`)
- **Success Criteria**: Project compiles successfully with Java 23; no Java 23-specific compilation errors; Lombok, annotations, and code generation work correctly

---

### Step 5: Upgrade Spring Boot to 3.4.x (Intermediate Version)

**Rationale**: Upgrade to Spring Boot 3.4.x as an intermediate step before 3.5.0. Spring Boot 3.4.x is more mature and provides a safer migration path. This step helps identify Spring Boot upgrade issues separately from the very recent 3.5.0 changes.

**Prerequisites**:
- Step 4 completed with successful Java 23 compilation
- Using JDK 23

**Changes to Make**:
1. In `pom.xml`, update Spring Boot parent version:
   - `<version>3.2.5</version>` → `<version>3.4.5</version>` (in `<parent>` section)
2. Review and update any deprecated Spring Boot 3.4.x properties in `application.yml` if warnings appear
3. Run `mvn clean compile -q` to download Spring Boot 3.4.x dependencies
4. Check for compilation warnings related to deprecated Spring APIs

**Verification**:
- **Command**: `mvn clean compile -q`
- **Expected Output**: BUILD SUCCESS, compilation passes
- **JDK Used**: JDK 23 at `<installation_path>/bin`
- **Success Criteria**: Project compiles with Spring Boot 3.4.x + Java 23; Spring Security, WebSocket, and JPA configurations remain compatible

---

### Step 6: Upgrade Spring Boot to 3.5.0 (Target Version)

**Rationale**: Complete the Spring Boot upgrade to the target version 3.5.0. This brings in Spring Framework 6.2.x with latest features, security patches, and full Java 23 optimization. This is the final configuration change before validation.

**Prerequisites**:
- Step 5 completed with successful Spring Boot 3.4.x compilation
- Using JDK 23

**Changes to Make**:
1. In `pom.xml`, update Spring Boot parent version:
   - `<version>3.4.5</version>` → `<version>3.5.0</version>` (in `<parent>` section)
2. Review application logs for any Spring Framework 6.2.x deprecation warnings
3. If `RestTemplate` is used in codebase, assess migration to `RestClient` (can be deferred post-upgrade)
4. Run `mvn clean compile -q`

**Verification**:
- **Command**: `mvn clean compile -q`
- **Expected Output**: BUILD SUCCESS, compilation passes
- **JDK Used**: JDK 23 at `<installation_path>/bin`
- **Success Criteria**: Project compiles with Spring Boot 3.5.0 + Java 23; all Spring Boot starters compatible; no critical deprecation errors

---

### Step 7: Final Validation and Full Test Suite Execution

**Rationale**: Execute complete validation with the final configuration (Java 23 + Spring Boot 3.5.0 + updated dependencies). All tests must pass to confirm the upgrade is successful and the application functions correctly.

**Prerequisites**:
- Step 6 completed successfully
- All compilation passes with final configuration
- Using JDK 23

**Changes to Make**:
1. Run full clean build: `mvn clean install -q`
2. Execute complete test suite: `mvn test`
3. Verify test results - target is 100% pass rate
4. If test failures exist:
   - Analyze failure root causes (JWT, AWS S3, Firebase, Spring Security, etc.)
   - Fix issues related to dependency upgrades or Java 23 changes
   - Re-run tests until 100% pass rate achieved
5. Run application smoke tests: Start application and verify key endpoints

**Verification**:
- **Command**: `mvn clean test`
- **Expected Output**: BUILD SUCCESS, Tests run: X, Failures: 0, Errors: 0
- **JDK Used**: JDK 23 at `<installation_path>/bin`
- **Success Criteria**: 
  - 100% test pass rate (all unit and integration tests pass)
  - Application starts successfully
  - Key features validated: Authentication (JWT), File Upload (S3), WebSocket, Firebase notifications
  - No runtime errors in core functionality

---

## 10. Post-Upgrade Success Criteria

The upgrade will be considered successful when all of the following criteria are met:

- [ ] Project compiles successfully with Java 23
- [ ] Spring Boot 3.5.0 application starts without errors
- [ ] 100% of unit tests pass
- [ ] 100% of integration tests pass
- [ ] No HIGH or CRITICAL security vulnerabilities in dependencies
- [ ] JWT authentication and authorization working correctly
- [ ] AWS S3 file upload/download operations functional
- [ ] Firebase push notifications delivered successfully
- [ ] WebSocket real-time messaging operational
- [ ] Excel report generation working correctly
- [ ] API documentation (Swagger UI) accessible and accurate
- [ ] Performance metrics within 10% of pre-upgrade baseline

---

## 11. Rollback Plan

In the event of critical issues during or after the upgrade, follow this rollback procedure:

1. **Immediate Rollback**:
   - Run: `git checkout main` (or previous stable branch)
   - Set `JAVA_HOME` back to JDK 17: `C:/Program Files/Microsoft/jdk-17.0.17.10-hotspot`
   - Run: `mvn clean package -DskipTests -q`
   - Redeploy previous version

2. **Preserve Upgrade Work**:
   - Before checkout: `git stash` or `git commit -m "WIP: Upgrade in progress"`
   - Create backup branch: `git branch appmod/java-upgrade-20260302195225-backup`

3. **Post-Rollback Validation**:
   - Verify application starts with Java 17 + Spring Boot 3.2.5
   - Run smoke tests on key features
   - Monitor error logs for 1 hour

4. **Rollback Documentation**:
   - Document reason for rollback
   - Note which step failed
   - Capture error logs and stack traces for analysis

---

## 12. Timeline Estimate

Based on the 7-step upgrade plan:

- **Step 1** (Environment Setup): 30 minutes
- **Step 2** (Baseline Validation): 15 minutes  
- **Step 3** (Dependency Updates): 30 minutes
- **Step 4** (Java 23 Switch): 30 minutes
- **Step 5** (Spring Boot 3.4.x): 30 minutes
- **Step 6** (Spring Boot 3.5.0): 30 minutes
- **Step 7** (Final Validation): 1-3 hours (depends on test fixes needed)

**Total Estimated Time**: 3-5 hours (assuming minimal test failures)

**Contingency Buffer**: +2-4 hours (for unexpected issues, test fixes, code adjustments)

**Total with Buffer**: 5-9 hours

---

## 13. Sign-off

- [ ] Upgrade plan reviewed and approved
- [ ] All tools and JDKs verified available
- [ ] Backup/rollback procedures understood
- [ ] Ready for execution

---

**Upgrade Strategy Summary**:
- **Approach**: Incremental with intermediate Spring Boot 3.4.x version
- **Total Steps**: 7 (Setup → Baseline → Dependencies → Java 23 → SB 3.4.x → SB 3.5.0 → Validation)
- **Risk Level**: Medium (mitigated by intermediate steps)
- **Critical Dependencies**: AWS SDK 2.29.20 (required for Java 23)

---

*Document generated for Java Upgrade Session 20260302195225*  
*Upgrade Path Designed: March 2, 2026*
