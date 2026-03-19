@echo off
SET JAVA_HOME=C:\Program Files\Java\jdk-20
SET PATH=C:\tools\apache-maven-3.9.9\bin;%JAVA_HOME%\bin;%PATH%

REM === Perfil y base de datos H2 en memoria ===
SET SPRING_PROFILES_ACTIVE=test
SET SPRING_DATASOURCE_URL=jdbc:h2:mem:homecare;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
SET SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver
SET SPRING_DATASOURCE_USERNAME=sa
SET SPRING_DATASOURCE_PASSWORD=
SET SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.H2Dialect
SET SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.H2Dialect
SET SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop
SET SPRING_JPA_SHOW_SQL=false
SET SPRING_FLYWAY_ENABLED=false

REM === Redis: apunta a localhost pero no crash si no existe (fallback in-memory) ===
SET SPRING_DATA_REDIS_HOST=localhost
SET SPRING_DATA_REDIS_PORT=6379

REM === Actuator: deshabilitar checks de Redis/DB/Mail para que health devuelva UP ===
SET MANAGEMENT_HEALTH_REDIS_ENABLED=false
SET MANAGEMENT_HEALTH_DB_ENABLED=false
SET MANAGEMENT_HEALTH_MAIL_ENABLED=false
SET MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info
SET MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=always

REM === JWT y valores locales ===
SET JWT_SECRET=local-dev-secret-key-min-64-chars-long-for-testing-purposes-only
SET JWT_EXPIRATION=86400000

echo ============================================
echo  HOMECARE Backend - Modo LOCAL (H2 + NoRedis)
echo  Java: %JAVA_HOME%
echo ============================================

cd /d "%~dp0"
mvn spring-boot:run

pause
