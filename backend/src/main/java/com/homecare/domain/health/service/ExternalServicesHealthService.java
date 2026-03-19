package com.homecare.domain.health.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para verificar el estado de servicios externos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalServicesHealthService {

    private final RestTemplate restTemplate;

    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    @Value("${wompi.api-url:https://production.wompi.co}")
    private String wompiApiUrl;

    @Value("${wompi.public-key:}")
    private String wompiPublicKey;

    @Value("${firebase.server-key:}")
    private String firebaseServerKey;

    @Value("${aws.s3.bucket-name:}")
    private String s3BucketName;

    /**
     * Verifica el estado de Google Maps API
     */
    public Map<String, Object> checkGoogleMapsHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            if (googleMapsApiKey == null || googleMapsApiKey.trim().isEmpty()) {
                health.put("status", "NOT_CONFIGURED");
                health.put("error", "Google Maps API key not configured");
                health.put("timestamp", LocalDateTime.now());
                return health;
            }

            long startTime = System.currentTimeMillis();
            
            // Test simple geocoding request
            String url = "https://maps.googleapis.com/maps/api/geocode/json" +
                        "?address=BogotÃ¡,Colombia&key=" + googleMapsApiKey;
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                String status = (String) body.get("status");
                
                if ("OK".equals(status) || "ZERO_RESULTS".equals(status)) {
                    long responseTime = System.currentTimeMillis() - startTime;
                    health.put("status", "UP");
                    health.put("responseTime", responseTime + "ms");
                    health.put("apiStatus", status);
                } else {
                    health.put("status", "DOWN");
                    health.put("error", "API returned status: " + status);
                }
            } else {
                health.put("status", "DOWN");
                health.put("error", "Unexpected response: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Google Maps health check failed: {}", e.getMessage());
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        
        health.put("timestamp", LocalDateTime.now());
        return health;
    }

    /**
     * Verifica el estado de Wompi payment gateway
     */
    public Map<String, Object> checkWompiHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            if (wompiPublicKey == null || wompiPublicKey.trim().isEmpty()) {
                health.put("status", "NOT_CONFIGURED");
                health.put("error", "Wompi public key not configured");
                health.put("timestamp", LocalDateTime.now());
                return health;
            }

            long startTime = System.currentTimeMillis();
            
            // Test merchants endpoint (public)
            String url = wompiApiUrl + "/v1/merchants/" + wompiPublicKey;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                long responseTime = System.currentTimeMillis() - startTime;
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                
                health.put("status", "UP");
                health.put("responseTime", responseTime + "ms");
                health.put("merchantName", body.get("name"));
                health.put("merchantActive", body.get("active"));
            } else {
                health.put("status", "DOWN");
                health.put("error", "Unexpected response: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Wompi health check failed: {}", e.getMessage());
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        
        health.put("timestamp", LocalDateTime.now());
        return health;
    }

    /**
     * Verifica el estado de Firebase Cloud Messaging
     */
    public Map<String, Object> checkFirebaseHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            if (firebaseServerKey == null || firebaseServerKey.trim().isEmpty()) {
                health.put("status", "NOT_CONFIGURED");
                health.put("error", "Firebase server key not configured");
                health.put("timestamp", LocalDateTime.now());
                return health;
            }

            // Para Firebase, solo verificamos que la configuraciÃ³n existe
            // Un test real requerirÃ­a enviar una notificaciÃ³n de prueba
            health.put("status", "UP");
            health.put("configured", true);
            health.put("note", "Configuration validated - full test requires test notification");
            
        } catch (Exception e) {
            log.error("Firebase health check failed: {}", e.getMessage());
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        
        health.put("timestamp", LocalDateTime.now());
        return health;
    }

    /**
     * Verifica el estado de AWS S3 (si estÃ¡ configurado)
     */
    public Map<String, Object> checkS3Health() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            if (s3BucketName == null || s3BucketName.trim().isEmpty()) {
                health.put("status", "NOT_CONFIGURED");
                health.put("error", "S3 bucket name not configured");
                health.put("timestamp", LocalDateTime.now());
                return health;
            }

            // VerificaciÃ³n bÃ¡sica de configuraciÃ³n S3
            // En un entorno real, harÃ­as una operaciÃ³n HEAD al bucket
            health.put("status", "UP");
            health.put("configured", true);
            health.put("bucketName", s3BucketName);
            health.put("note", "Configuration validated - full test requires AWS credentials");
            
        } catch (Exception e) {
            log.error("S3 health check failed: {}", e.getMessage());
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        
        health.put("timestamp", LocalDateTime.now());
        return health;
    }

    /**
     * Ejecuta health check de todos los servicios externos
     */
    public Map<String, Object> checkAllExternalServices() {
        Map<String, Object> allServices = new HashMap<>();
        
        allServices.put("googleMaps", checkGoogleMapsHealth());
        allServices.put("wompi", checkWompiHealth());
        allServices.put("firebase", checkFirebaseHealth());
        allServices.put("s3", checkS3Health());
        
        // Determinar estado general
        boolean allUp = allServices.values().stream()
            .allMatch(service -> {
                if (service instanceof Map) {
                    String status = (String) ((Map<?, ?>) service).get("status");
                    return "UP".equals(status) || "NOT_CONFIGURED".equals(status);
                }
                return false;
            });
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("overallStatus", allUp ? "UP" : "DOWN");
        summary.put("services", allServices);
        summary.put("timestamp", LocalDateTime.now());
        
        return summary;
    }
}

