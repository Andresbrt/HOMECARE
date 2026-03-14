package com.homecare.controller;

import com.homecare.service.DatabaseHealthService;
import com.homecare.service.ExternalServicesHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador para health checks y métricas de la aplicación
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@Tag(name = "Health Check", description = "Endpoints para verificar el estado de la aplicación")
@Slf4j
public class HealthController {

    private final DatabaseHealthService databaseHealthService;
    private final ExternalServicesHealthService externalServicesHealthService;
    private final Environment environment;
    private final Optional<BuildProperties> buildProperties;

    /**
     * Health check básico
     */
    @GetMapping
    @Operation(summary = "Health check básico de la aplicación")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            response.put("status", "UP");
            response.put("timestamp", LocalDateTime.now());
            response.put("service", "HomeCaré API");
            response.put("version", buildProperties.map(BuildProperties::getVersion).orElse("dev"));
            response.put("environment", environment.getProperty("spring.profiles.active", "default"));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en health check: {}", e.getMessage(), e);
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Health check detallado incluyendo servicios externos
     */
    @GetMapping("/detailed")
    @Operation(summary = "Health check detallado con servicios externos")
    public ResponseEntity<Map<String, Object>> detailedHealthCheck() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> services = new HashMap<>();
        boolean allServicesUp = true;
        
        try {
            // Database health
            Map<String, Object> dbHealth = databaseHealthService.checkDatabaseHealth();
            services.put("database", dbHealth);
            if (!"UP".equals(dbHealth.get("status"))) {
                allServicesUp = false;
            }
            
            // Google Maps API health
            Map<String, Object> mapsHealth = externalServicesHealthService.checkGoogleMapsHealth();
            services.put("googleMaps", mapsHealth);
            if (!"UP".equals(mapsHealth.get("status"))) {
                allServicesUp = false;
            }
            
            // Wompi payment gateway health
            Map<String, Object> paymentHealth = externalServicesHealthService.checkWompiHealth();
            services.put("paymentGateway", paymentHealth);
            if (!"UP".equals(paymentHealth.get("status"))) {
                allServicesUp = false;
            }
            
            // Firebase health
            Map<String, Object> firebaseHealth = externalServicesHealthService.checkFirebaseHealth();
            services.put("firebase", firebaseHealth);
            if (!"UP".equals(firebaseHealth.get("status"))) {
                allServicesUp = false;
            }
            
            // AWS S3 health (si está configurado)
            try {
                Map<String, Object> s3Health = externalServicesHealthService.checkS3Health();
                services.put("s3Storage", s3Health);
                if (!"UP".equals(s3Health.get("status"))) {
                    allServicesUp = false;
                }
            } catch (Exception e) {
                services.put("s3Storage", Map.of("status", "UNAVAILABLE", "error", e.getMessage()));
            }
            
            response.put("status", allServicesUp ? "UP" : "DEGRADED");
            response.put("timestamp", LocalDateTime.now());
            response.put("services", services);
            response.put("overallHealth", allServicesUp ? "HEALTHY" : "DEGRADED");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error en health check detallado: {}", e.getMessage(), e);
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            response.put("services", services);
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Métricas básicas de la aplicación
     */
    @GetMapping("/metrics")
    @Operation(summary = "Métricas básicas de la aplicación")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        try {
            // Runtime information
            Runtime runtime = Runtime.getRuntime();
            long maxMemory = runtime.maxMemory();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            Map<String, Object> memory = new HashMap<>();
            memory.put("max", formatBytes(maxMemory));
            memory.put("total", formatBytes(totalMemory));
            memory.put("used", formatBytes(usedMemory));
            memory.put("free", formatBytes(freeMemory));
            memory.put("usagePercentage", Math.round((double) usedMemory / totalMemory * 100));
            
            metrics.put("memory", memory);
            
            // System properties
            metrics.put("javaVersion", System.getProperty("java.version"));
            metrics.put("javaVendor", System.getProperty("java.vendor"));
            metrics.put("osName", System.getProperty("os.name"));
            metrics.put("osVersion", System.getProperty("os.version"));
            metrics.put("availableProcessors", runtime.availableProcessors());
            
            // Application info
            metrics.put("applicationVersion", buildProperties.map(BuildProperties::getVersion).orElse("dev"));
            metrics.put("buildTime", buildProperties.map(bp -> String.valueOf(bp.getTime())).orElse("N/A"));
            metrics.put("profile", environment.getProperty("spring.profiles.active", "default"));
            
            return ResponseEntity.ok(metrics);
            
        } catch (Exception e) {
            log.error("Error obteniendo métricas: {}", e.getMessage(), e);
            metrics.put("error", e.getMessage());
            return ResponseEntity.status(500).body(metrics);
        }
    }
    
    private String formatBytes(long bytes) {
        if (bytes == 0) return "0 B";
        int k = 1024;
        String[] sizes = {"B", "KB", "MB", "GB"};
        int i = (int) Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100.0) / 100.0 + " " + sizes[i];
    }
}