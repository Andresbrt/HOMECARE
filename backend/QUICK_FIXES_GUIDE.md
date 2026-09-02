# 🚀 GUÍA RÁPIDA DE IMPLEMENTACIÓN - HOMECARE API

Esta guía te permite implementar los fixes críticos en **menos de 2 horas**.

---

## ⚡ FIXES RÁPIDOS (30 minutos)

### 1. Corregir CORS en SecurityConfig (5 minutos)

Edita `src/main/java/com/homecare/config/SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // ✅ ANTES: configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:19006", "*"));
    // ✅ DESPUÉS: Lista explícita (desde .env)
    String allowedOrigins = environment.getProperty("cors.allowed-origins", 
        "http://localhost:3000,http://localhost:19006");
    configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
    
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
    configuration.setExposedHeaders(List.of("Authorization"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

Agrega a `.env`:
```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,https://app.homecare.com
```

---

### 2. Asegurar Actuator (5 minutos)

En el mismo `SecurityConfig.java`, cambia:

```java
// ❌ ANTES:
.requestMatchers("/actuator/**").permitAll()

// ✅ DESPUÉS:
.requestMatchers("/actuator/health", "/actuator/info").permitAll()
.requestMatchers("/actuator/**").hasRole("ADMIN")
```

O mejor, desactiva completamente en producción:

`application-production.yml`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info  # Solo health e info públicos
```

---

### 3. Validar JWT_SECRET fuerte (10 minutos)

Edita `EnvironmentValidator.java`:

```java
@Override
public void onApplicationEvent(ApplicationReadyEvent event) {
    // ... código existente
    
    // ✅ AGREGAR VALIDACIÓN ESTRICTA
    if (!isEmpty(jwtSecret)) {
        if (jwtSecret.length() < 64) {
            missingVariables.add("JWT_SECRET debe tener al menos 64 caracteres (actual: " + jwtSecret.length() + ")");
        }
        
        if (jwtSecret.contains("your_super_secret") || jwtSecret.contains("change_me")) {
            missingVariables.add("JWT_SECRET contiene valor de ejemplo - DEBE cambiarse");
        }
    }
    
    // ✅ EN PRODUCCIÓN, DETENER SI HAY VARIABLES FALTANTES
    if ("production".equals(environment) && !missingVariables.isEmpty()) {
        String errorMessage = "❌ Variables de entorno críticas faltantes:\n" + 
                String.join("\n", missingVariables);
        log.error(errorMessage);
        throw new IllegalStateException(errorMessage);
    }
}
```

Genera un secret seguro:

**PowerShell:**
```powershell
$bytes = New-Object byte[] 64
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Bash/Linux:**
```bash
openssl rand -base64 64 | tr -d '\n'
```

Copia el resultado a tu `.env`:
```dotenv
JWT_SECRET=<resultado_del_comando_aquí>
```

---

### 4. Agregar Índices de Base de Datos (10 minutos)

Conecta a PostgreSQL y ejecuta:

```sql
-- Índices críticos para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_solicitudes_cliente_id ON solicitudes(cliente_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_ofertas_solicitud_id ON ofertas(solicitud_id);
CREATE INDEX idx_ofertas_estado ON ofertas(estado);
CREATE INDEX idx_pagos_servicio_id ON pagos(servicio_id);
CREATE UNIQUE INDEX idx_pagos_referencia ON pagos(referencia);
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida) WHERE leida = false;

-- Índice espacial para búsquedas geográficas
CREATE INDEX idx_solicitudes_ubicacion ON solicitudes 
USING GIST(ST_SetSRID(ST_MakePoint(longitud, latitud), 4326));

ANALYZE usuarios;
ANALYZE solicitudes;
ANALYZE ofertas;
ANALYZE pagos;
```

O usa el script de migración incluido en el reporte.

---

## 🛠️ FIXES INTERMEDIOS (1 hora)

### 5. Rate Limiting Básico (30 minutos)

#### Paso 1: Agregar dependencias al `pom.xml`

```xml
<!-- Rate Limiting -->
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.10.1</version>
</dependency>
```

#### Paso 2: Crear filtro simple

Crea `src/main/java/com/homecare/config/RateLimitFilter.java`:

```java
package com.homecare.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RateLimitFilter implements Filter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIp = getClientIP(httpRequest);
        Bucket bucket = resolveBucket(clientIp);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            log.warn("🚨 Rate limit excedido para IP: {}", clientIp);
            httpResponse.setStatus(429);
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(
                "{\"error\": \"Too many requests\", \"message\": \"Has excedido el límite de solicitudes\"}"
            );
        }
    }

    private Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> createNewBucket());
    }

    private Bucket createNewBucket() {
        // 100 requests por minuto
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
```

---

### 6. Optimistic Locking (30 minutos)

Agrega `@Version` a tus entidades críticas:

**Edita `Oferta.java`:**
```java
@Entity
@Table(name = "ofertas")
public class Oferta {
    // ... campos existentes
    
    @Version
    @Column(name = "version")
    private Long version;  // ✅ Hibernate manejará concurrencia automáticamente
    
    // ... resto de código
}
```

**Edita `Solicitud.java`:**
```java
@Entity
@Table(name = "solicitudes")
public class Solicitud {
    // ... campos existentes
    
    @Version
    @Column(name = "version")
    private Long version;
    
    // ... resto de código
}
```

**Agrega columna a la base de datos:**
```sql
ALTER TABLE ofertas ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN version BIGINT DEFAULT 0;
```

**Maneja la excepción en `OfertaService.java`:**
```java
@Transactional
public ServicioAceptado aceptarOferta(Long clienteId, Long ofertaId) {
    try {
        // ... código existente
    } catch (OptimisticLockException e) {
        log.warn("🚨 Race condition detectada al aceptar oferta: {}", ofertaId);
        throw new BusinessException("Alguien más modificó esta oferta. Por favor, recarga e intenta nuevamente.");
    }
}
```

---

## 🔥 FIXES AVANZADOS (2-4 horas)

Estos requieren más tiempo pero son críticos para producción:

### 7. JWT Blacklist con Redis
- Instalar Redis
- Implementar TokenBlacklistService
- Integrar en JwtAuthenticationFilter
- Ver código completo en el reporte de auditoría

### 8. Cache con Caffeine
- Agregar dependencia spring-boot-starter-cache
- Configurar CacheConfig
- Agregar @Cacheable en servicios
- Ver configuración completa en el reporte

### 9. Monitoring con Actuator + Prometheus
- Configurar Actuator endpoints
- Crear custom health indicators
- Implementar business metrics
- Ver guía completa en el reporte

---

## 🐳 DOCKER SETUP (15 minutos)

### 1. Copia `docker-compose.yml` (ya creado)

### 2. Inicia servicios:

```bash
# Solo base de datos y Redis
docker-compose up -d postgres redis

# Con monitoreo (Prometheus + Grafana)
docker-compose --profile monitoring up -d
```

### 3. Verifica estado:

```bash
docker-compose ps
docker-compose logs -f api
```

### 4. Health checks:

```bash
# PostgreSQL
docker exec homecare-postgres pg_isready -U homecare_user

# Redis
docker exec homecare-redis redis-cli --raw incr ping

# API
curl http://localhost:8080/actuator/health
```

---

## 📊 VALIDACIÓN POST-IMPLEMENTACIÓN

### 1. Tests de Seguridad

```bash
# CORS
curl -H "Origin: http://malicious-site.com" -I http://localhost:8080/api/auth/me

# Rate Limiting
for i in {1..101}; do curl http://localhost:8080/api/auth/me; done

# JWT
curl -H "Authorization: Bearer invalid_token" http://localhost:8080/api/auth/me
```

### 2. Tests de Performance

```bash
# Query time (debe ser < 50ms)
docker exec homecare-postgres psql -U homecare_user -d homecare_db -c "EXPLAIN ANALYZE SELECT * FROM usuarios WHERE email = 'test@example.com';"

# Connection pool
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

### 3. Health Check

```bash
curl http://localhost:8080/actuator/health | jq
```

Respuesta esperada:
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

---

## 🎯 CHECKLIST FINAL

| Fix | Tiempo | Prioridad | Estado |
|-----|--------|-----------|--------|
| ✅ CORS explícito | 5 min | CRÍTICO | ⬜ |
| ✅ Asegurar Actuator | 5 min | CRÍTICO | ⬜ |
| ✅ Validar JWT_SECRET | 10 min | CRÍTICO | ⬜ |
| ✅ Índices DB | 10 min | ALTO | ⬜ |
| ✅ Rate Limiting | 30 min | ALTO | ⬜ |
| ✅ Optimistic Locking | 30 min | ALTO | ⬜ |
| ⏳ JWT Blacklist | 2 hrs | MEDIO | ⬜ |
| ⏳ Cache | 1 hr | MEDIO | ⬜ |
| ⏳ Monitoring | 2 hrs | MEDIO | ⬜ |

**Total tiempo mínimo:** 1 hora para fixes críticos  
**Total tiempo completo:** 6-8 horas para todos los fixes

---

## 📚 RECURSOS

- [Reporte completo de auditoría](./BACKEND_AUDIT_REPORT_2026.md)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Bucket4j Documentation](https://bucket4j.com/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

---

## 🆘 TROUBLESHOOTING

### Error: Connection refused (PostgreSQL)
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres
```

### Error: Redis connection timeout
```bash
# Verificar Redis
docker exec homecare-redis redis-cli ping

# Si responde "PONG", está OK
```

### Error: Application won't start
```bash
# Verificar variables de entorno
./mvnw spring-boot:run | grep "Variables de entorno"

# Ver logs completos
tail -f logs/homecare-api.log
```

---

**¡Listo! Con estos fixes tendrás un backend production-ready en pocas horas.** 🚀
