# ==============================================
# HOMECARE Backend — Dockerfile para Render
# Root Directory = backend
# ==============================================

FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Copiar POM primero (ya estamos dentro de la carpeta backend)
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Copiar código fuente
COPY src/ src/

# Compilar
RUN mvn clean package -DskipTests -B -q

# ==============================================
# Etapa final (runtime)
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=production
ENV SERVER_PORT=8080

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copiar el JAR generado desde la etapa builder
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]