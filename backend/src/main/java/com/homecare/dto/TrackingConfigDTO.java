package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;

/**
 * DTOs para configuración del sistema de tracking
 */
public class TrackingConfigDTO {

    /**
     * DTO para obtener configuración actual del tracking
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConfigResponse {
        private Integer updateIntervalSeconds; // Intervalo de actualización
        private Integer distanceThresholdMeters; // Distancia mínima para registrar punto
        private String etaCalculationMethod; // google o haversine
        private Boolean googleMapsEnabled;
        private String googleMapsApiStatus; // "active", "fallback", "disabled"
        
        // Estadísticas de uso
        private Long requestsToday;
        private Long requestsThisMonth;
        private Double estimatedMonthlyCost; // En USD
        
        // Intervalos recomendados
        private String[] intervalsRecommended; // [15, 30, 60]
        
        // Método de compatibilidad
        public boolean isGoogleMapsEnabled() {
            return googleMapsEnabled != null && googleMapsEnabled;
        }
    }

    /**
     * DTO para actualizar configuración del tracking
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateConfig {
        @Min(value = 5, message = "El intervalo mínimo es 5 segundos")
        @Max(value = 300, message = "El intervalo máximo es 300 segundos (5 minutos)")
        private Integer updateIntervalSeconds;
        
        @Min(value = 10, message = "El umbral mínimo es 10 metros")
        @Max(value = 500, message = "El umbral máximo es 500 metros")
        private Integer distanceThresholdMeters;
        
        @Pattern(regexp = "^(haversine|google)$", message = "Método debe ser 'haversine' o 'google'")
        private String etaCalculationMethod;
        
        private String reason; // razón del cambio
    }

    /**
     * DTO para estadísticas de rendimiento
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PerformanceStats {
        private Integer currentInterval;
        private Long activeTracking; // solicitudes con tracking activo
        private Long requestsPerHour;
        private Long requestsPerDay;
        private Long requestsPerMonth;
        private Double batteryImpactEstimate; // 1-10 (1=mínimo, 10=máximo)
        private Double dataUsageMB; // MB por hora de tracking
        private Double costUSDPerMonth;
    }

    /**
     * DTO para recomendaciones de optimización
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptimizationRecommendation {
        private String currentSetting;
        private String recommendedSetting;
        private String reason;
        private Double costSavings; // USD/mes
        private Double batterySavings; // % de ahorro
        private String impact; // "minimal", "low", "medium", "high", "optimal"
    }

    /**
     * DTO para estado de salud del sistema
     */
    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthStatus {
        private String status; // healthy, warning, degraded, error
        private Boolean trackingActive;
        private String googleMapsStatus; // active, fallback, disabled, error
        private Long currentLoad; // requests per hour
        private LocalDateTime lastCheck;
    }
}
