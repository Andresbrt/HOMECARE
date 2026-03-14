# ==============================================
# HOMECARE Backend — Multi-Stage Dockerfile
# Java 23 + Spring Boot 3.5
# ==============================================

# ── Stage 1: Build ────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-23 AS builder
WORKDIR /build

# Copy POM first — dependency layer cached separately
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Copy source and build the fat JAR (tests run in CI, skipped here)
COPY src/ src/
RUN mvn package -DskipTests -B -q

# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM eclipse-temurin:23-jre-jammy AS runtime
WORKDIR /app

# curl needed for HEALTHCHECK; clean apt cache after
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Security: run as non-root user
RUN groupadd -r homecare && useradd -r -g homecare -d /app -s /sbin/nologin homecare

# Copy the fat JAR from builder stage
COPY --from=builder /build/target/homecare-backend-*.jar homecare.jar
RUN chown homecare:homecare homecare.jar

USER homecare

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "homecare.jar"]
