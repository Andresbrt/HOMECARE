# 🚀 GUÍA DE DESPLIEGUE Y ESCALABILIDAD - HOMECARE

## Arquitectura de Despliegue

```
                    ┌─────────────────────────────────┐
                    │      CDN / CloudFlare           │
                    │  (Assets estáticos, caché)      │
                    └───────────┬─────────────────────┘
                                │
                    ┌───────────▼─────────────────────┐
                    │   Load Balancer / Nginx         │
                    │  (SSL, Routing, Rate Limiting)  │
                    └───────────┬─────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼────┐          ┌─────▼────┐          ┌─────▼────┐
    │Backend  │          │Backend   │          │Backend   │
    │Instance │          │Instance  │          │Instance  │
    │   #1    │          │   #2     │          │   #3     │
    └────┬────┘          └────┬─────┘          └────┬─────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
         │PostgreSQL│    │  Redis  │    │ RabbitMQ│
         │ Primary  │    │ Cache   │    │ Queue   │
         └────┬────┘    └─────────┘    └─────────┘
              │
         ┌────▼────┐
         │PostgreSQL│
         │ Replica  │
         └─────────┘
```

## Stack de Tecnologías Recomendado

### Backend
- **Runtime**: Java 17 / 21
- **Framework**: Spring Boot 3.2.x
- **App Server**: Embedded Tomcat (JAR ejecutable)
- **Base de Datos**: PostgreSQL 15+ con PostGIS
- **Cache**: Redis 7.x
- **Message Queue**: RabbitMQ / Apache Kafka
- **File Storage**: AWS S3 / Azure Blob Storage

### Mobile
- **Framework**: React Native + Expo
- **Deployment**: 
  - iOS: TestFlight → App Store
  - Android: Google Play Console
- **OTA Updates**: Expo Updates

### Web
- **Hosting**: Vercel / Netlify / AWS S3 + CloudFront
- **PWA**: Service Worker para caché offline

### Infraestructura
- **Cloud Provider**: AWS / Azure / Google Cloud
- **Container**: Docker + Docker Compose (dev/staging)
- **Orchestration**: Kubernetes (producción)
- **CI/CD**: GitHub Actions / GitLab CI

## Configuración de Entornos

### Desarrollo

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: homecare_dev
      POSTGRES_USER: homecare_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/homecare_dev
      SPRING_REDIS_HOST: redis
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Staging

```yaml
# application-staging.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  
  redis:
    host: ${REDIS_HOST}
    port: 6379
    password: ${REDIS_PASSWORD}

  mail:
    host: ${SMTP_HOST}
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

wompi:
  public-key: ${WOMPI_PUBLIC_KEY_TEST}
  private-key: ${WOMPI_PRIVATE_KEY_TEST}
  production: false

logging:
  level:
    com.homecare: DEBUG
```

### Producción

```yaml
# application-prod.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate
  
  redis:
    host: ${REDIS_HOST}
    port: 6379
    password: ${REDIS_PASSWORD}
    ssl: true
    timeout: 2000ms

jwt:
  secret: ${JWT_SECRET}
  expiration: 3600000  # 1 hora
  refresh-expiration: 604800000  # 7 días

wompi:
  public-key: ${WOMPI_PUBLIC_KEY_PROD}
  private-key: ${WOMPI_PRIVATE_KEY_PROD}
  production: true

server:
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
  
  http2:
    enabled: true

logging:
  level:
    com.homecare: INFO
    org.springframework: WARN
  file:
    name: /var/log/homecare/application.log
    max-size: 10MB
    max-history: 30
```

## Optimizaciones de Base de Datos

### Índices Críticos

```sql
-- Índices de geolocalización
CREATE INDEX CONCURRENTLY idx_usuarios_location 
ON usuarios USING gist (ll_to_earth(latitud, longitud));

CREATE INDEX CONCURRENTLY idx_solicitudes_location 
ON solicitudes USING gist (ll_to_earth(latitud, longitud));

-- Índices de búsqueda frecuente
CREATE INDEX CONCURRENTLY idx_solicitudes_estado_fecha 
ON solicitudes (estado, fecha_servicio) 
WHERE estado IN ('ABIERTA', 'EN_NEGOCIACION');

CREATE INDEX CONCURRENTLY idx_ofertas_solicitud_estado 
ON ofertas (solicitud_id, estado) 
WHERE estado = 'PENDIENTE';

CREATE INDEX CONCURRENTLY idx_mensajes_solicitud_created 
ON mensajes (solicitud_id, created_at DESC);

-- Índice parcial para notificaciones no leídas
CREATE INDEX CONCURRENTLY idx_notificaciones_usuario_noleidas 
ON notificaciones (usuario_id, created_at DESC) 
WHERE leida = false;
```

### Particionamiento de Tablas

```sql
-- Particionar mensajes por rango de fecha
CREATE TABLE mensajes_partitioned (
    LIKE mensajes INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Particiones mensuales
CREATE TABLE mensajes_2026_01 PARTITION OF mensajes_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE mensajes_2026_02 PARTITION OF mensajes_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Particionar calificaciones por año
CREATE TABLE calificaciones_partitioned (
    LIKE calificaciones INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

### Consultas Optimizadas

```java
// Solicitudes cercanas con límite y paginación
@Query(value = """
    SELECT s.*, 
           earth_distance(
               ll_to_earth(:lat, :lng),
               ll_to_earth(s.latitud, s.longitud)
           ) / 1000 as distancia_km
    FROM solicitudes s
    WHERE s.estado IN ('ABIERTA', 'EN_NEGOCIACION')
    AND earth_box(ll_to_earth(:lat, :lng), :radioMetros) 
        @> ll_to_earth(s.latitud, s.longitud)
    ORDER BY distancia_km ASC
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
List<Object[]> findSolicitudesCercanasOptimizada(
    @Param("lat") BigDecimal latitud,
    @Param("lng") BigDecimal longitud,
    @Param("radioMetros") int radioMetros,
    @Param("limit") int limit,
    @Param("offset") int offset
);
```

## Estrategia de Caché (Redis)

### Configuración

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Cache de usuarios: 30 minutos
        cacheConfigurations.put("usuarios", config.entryTtl(Duration.ofMinutes(30)));
        
        // Cache de proveedores cercanos: 5 minutos
        cacheConfigurations.put("proveedoresCercanos", config.entryTtl(Duration.ofMinutes(5)));
        
        // Cache de estadísticas: 1 hora
        cacheConfigurations.put("estadisticas", config.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}

// Uso en servicios
@Service
public class UsuarioService {
    
    @Cacheable(value = "usuarios", key = "#id")
    public Usuario getUsuarioById(Long id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    }
    
    @CacheEvict(value = "usuarios", key = "#usuario.id")
    public Usuario actualizarUsuario(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }
    
    @Cacheable(value = "proveedoresCercanos", 
               key = "#latitud + '_' + #longitud + '_' + #radio")
    public List<Usuario> getProveedoresCercanos(
            BigDecimal latitud, BigDecimal longitud, int radio) {
        return usuarioRepository.findProveedoresCercanos(latitud, longitud, radio);
    }
}
```

## Rate Limiting

### Configuración con Bucket4j

```java
@Configuration
public class RateLimitConfig {

    @Bean
    public ProxyManager<String> proxyManager(RedissonClient redisson) {
        return new ProxyManagerBuilder<String>()
            .withProxyFactory(Bucket4jRedis.configureRedisson(redisson))
            .build();
    }
}

@Component
public class RateLimitFilter implements Filter {
    
    private final ProxyManager<String> proxyManager;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String key = getClientKey(httpRequest);
        
        Bucket bucket = proxyManager.builder()
            .build(key, () -> {
                // 100 requests por minuto
                return Bucket4j.builder()
                    .addLimit(Bandwidth.simple(100, Duration.ofMinutes(1)))
                    .build();
            });
        
        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(429);
            httpResponse.getWriter().write("Rate limit exceeded");
        }
    }
    
    private String getClientKey(HttpServletRequest request) {
        String userId = extractUserIdFromJWT(request);
        return userId != null ? "user:" + userId : "ip:" + request.getRemoteAddr();
    }
}
```

## Monitoreo y Observabilidad

### Actuator Endpoints

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    export:
      prometheus:
        enabled: true
```

### Métricas Personalizadas

```java
@Component
public class HomecareMetrics {
    
    private final MeterRegistry meterRegistry;
    
    private final Counter solicitudesCreadas;
    private final Counter ofertasEnviadas;
    private final Counter ofertasAceptadas;
    private final Timer tiempoEleccion;
    
    public HomecareMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        this.solicitudesCreadas = Counter.builder("homecare.solicitudes.creadas")
            .description("Total de solicitudes creadas")
            .tag("modelo", "indriver")
            .register(meterRegistry);
            
        this.ofertasEnviadas = Counter.builder("homecare.ofertas.enviadas")
            .description("Total de ofertas enviadas por proveedores")
            .register(meterRegistry);
            
        this.ofertasAceptadas = Counter.builder("homecare.ofertas.aceptadas")
            .description("Total de ofertas aceptadas por clientes")
            .register(meterRegistry);
            
        this.tiempoEleccion = Timer.builder("homecare.tiempo.eleccion")
            .description("Tiempo que tarda el cliente en elegir una oferta")
            .register(meterRegistry);
    }
    
    public void incrementSolicitudesCreadas() {
        solicitudesCreadas.increment();
    }
    
    public void incrementOfertasEnviadas() {
        ofertasEnviadas.increment();
    }
    
    public void registrarEleccion(Duration tiempo) {
        tiempoEleccion.record(tiempo);
    }
}
```

### Dashboard Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'homecare-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy HOMECARE

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run tests
        run: ./mvnw test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build JAR
        run: ./mvnw clean package -DskipTests
      
      - name: Build Docker image
        run: docker build -t homecare-backend:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag homecare-backend:${{ github.sha }} ${{ secrets.DOCKER_USERNAME }}/homecare:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/homecare:latest
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/homecare
            docker-compose pull
            docker-compose up -d
```

## Kubernetes Deployment

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: homecare-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: homecare-backend
  template:
    metadata:
      labels:
        app: homecare-backend
    spec:
      containers:
      - name: backend
        image: homecare/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: homecare-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: homecare-service
spec:
  selector:
    app: homecare-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Seguridad en Producción

### SSL/TLS

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.homecare.com;

    ssl_certificate /etc/nginx/ssl/homecare.crt;
    ssl_certificate_key /etc/nginx/ssl/homecare.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Variables de Entorno Seguras

```bash
# .env.prod (NUNCA commitear)
DATABASE_URL=postgresql://user:password@host:5432/homecare_prod
JWT_SECRET=<generado con: openssl rand -base64 64>
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_PRIVATE_KEY=prv_prod_xxxxx
REDIS_PASSWORD=<strong_password>
SMTP_PASSWORD=<app_specific_password>
```

## Backup y Recuperación

### PostgreSQL

```bash
# Backup diario automático
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="homecare_backup_$DATE.sql.gz"

pg_dump -h localhost -U homecare_user homecare_db | gzip > "$BACKUP_DIR/$FILENAME"

# Subir a S3
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://homecare-backups/postgres/

# Retener solo últimos 30 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

### Restauración

```bash
gunzip -c homecare_backup_20260116.sql.gz | psql -h localhost -U homecare_user homecare_db
```

## Costos Estimados (AWS)

### Staging
- **EC2 t3.medium** (Backend): $30/mes
- **RDS PostgreSQL t3.small**: $30/mes
- **ElastiCache Redis t3.micro**: $15/mes
- **S3 Storage**: $5/mes
- **Total**: ~$80/mes

### Producción (Fase Inicial)
- **EC2 t3.large x2** (Backend HA): $120/mes
- **RDS PostgreSQL t3.medium + Replica**: $80/mes
- **ElastiCache Redis t3.small**: $30/mes
- **Application Load Balancer**: $20/mes
- **S3 + CloudFront**: $30/mes
- **Total**: ~$280/mes

### Producción (Escala Media - 10K usuarios)
- **ECS Fargate** (4 tasks): $200/mes
- **RDS PostgreSQL m5.large + Replica**: $350/mes
- **ElastiCache Redis m5.large**: $150/mes
- **ALB + WAF**: $50/mes
- **S3 + CloudFront**: $100/mes
- **Total**: ~$850/mes

## Recomendaciones Finales

### Performance
1. Implementar paginación en todas las listas
2. Usar lazy loading en relaciones JPA
3. Comprimir respuestas JSON (gzip)
4. Optimizar queries con EXPLAIN ANALYZE
5. Implementar CDN para assets estáticos

### Seguridad
1. Rotar JWT secrets cada 90 días
2. Implementar 2FA para proveedores
3. Auditar accesos con logs centralizados
4. Escanear dependencias (Snyk, Dependabot)
5. Realizar pentesting periódico

### Escalabilidad
1. Iniciar con arquitectura monolítica bien diseñada
2. Preparar para microservicios si superan 50K usuarios
3. Implementar circuit breaker (Resilience4j)
4. Usar message queue para tareas asíncronas
5. Preparar sharding de base de datos por región

### Monitoreo
1. Configurar alertas para errores críticos
2. Monitorear métricas del modelo inDriver
3. Dashboard en tiempo real para admin
4. Logs estructurados (JSON)
5. Tracing distribuido (Zipkin/Jaeger)

---

**🚀 HOMECARE listo para escalar de 0 a millones de usuarios**
