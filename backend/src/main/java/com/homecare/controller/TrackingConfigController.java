package com.homecare.controller;

import com.homecare.dto.TrackingConfigDTO;
import com.homecare.service.TrackingConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Controlador REST para gestión de configuración del tracking
 */
@RestController
@RequestMapping("/api/tracking/config")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tracking Configuration", description = "Gestión de configuración del sistema de tracking")
public class TrackingConfigController {

    private final TrackingConfigService trackingConfigService;

    @GetMapping
    @Operation(summary = "Obtener configuración actual", 
               description = "Retorna la configuración actual del sistema de tracking, estado de APIs y estadísticas de uso")
    public ResponseEntity<TrackingConfigDTO.ConfigResponse> obtenerConfiguracion() {
        try {
            log.debug("Obteniendo configuración del sistema de tracking");
            
            TrackingConfigDTO.ConfigResponse config = trackingConfigService.obtenerConfiguracion();
            
            log.info("Configuración obtenida exitosamente: intervalo {}s, Google Maps: {}", 
                    config.getUpdateIntervalSeconds(), config.isGoogleMapsEnabled());
            
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("Error al obtener configuración del tracking", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/performance")
    @Operation(summary = "Obtener estadísticas de rendimiento", 
               description = "Retorna estadísticas detalladas sobre el rendimiento del sistema de tracking")
    public ResponseEntity<TrackingConfigDTO.PerformanceStats> obtenerEstadisticas() {
        try {
            log.debug("Obteniendo estadísticas de rendimiento del tracking");
            
            TrackingConfigDTO.PerformanceStats stats = trackingConfigService.obtenerEstadisticasRendimiento();
            
            log.info("Estadísticas obtenidas: {} trackings activos, {} requests/día", 
                    stats.getActiveTracking(), stats.getRequestsPerDay());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error al obtener estadísticas de rendimiento", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Obtener recomendaciones de optimización", 
               description = "Analiza la configuración actual y sugiere optimizaciones para batería, costos y rendimiento")
    public ResponseEntity<TrackingConfigDTO.OptimizationRecommendation> obtenerRecomendaciones() {
        try {
            log.debug("Generando recomendaciones de optimización");
            
            TrackingConfigDTO.OptimizationRecommendation recommendations = 
                    trackingConfigService.obtenerRecomendaciones();
            
            log.info("Recomendaciones generadas: {} -> {}", 
                    recommendations.getCurrentSetting(), recommendations.getRecommendedSetting());
            
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            log.error("Error al generar recomendaciones", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update")
    @Operation(summary = "Actualizar configuración de tracking", 
               description = "Actualiza los parámetros de configuración del sistema de tracking en tiempo real")
    public ResponseEntity<TrackingConfigDTO.ConfigResponse> actualizarConfiguracion(
            @Valid @RequestBody TrackingConfigDTO.UpdateConfig updateConfig) {
        try {
            log.info("Solicitada actualización de configuración: intervalo {}s, método ETA: {}", 
                    updateConfig.getUpdateIntervalSeconds(), updateConfig.getEtaCalculationMethod());
            
            // TODO: Implementar actualización dinámica de configuración
            // Por ahora retornamos la configuración actual con mensaje informativo
            TrackingConfigDTO.ConfigResponse currentConfig = trackingConfigService.obtenerConfiguracion();
            
            log.warn("Actualización de configuración pendiente de implementación. " +
                     "Configuración actual mantenida: intervalo {}s", 
                     currentConfig.getUpdateIntervalSeconds());
            
            return ResponseEntity.ok(currentConfig);
            
        } catch (Exception e) {
            log.error("Error al actualizar configuración del tracking", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Estado de salud del sistema de tracking", 
               description = "Verifica el estado de todos los componentes del sistema de tracking")
    public ResponseEntity<TrackingConfigDTO.HealthStatus> verificarEstado() {
        try {
            log.debug("Verificando estado de salud del sistema");
            
            TrackingConfigDTO.ConfigResponse config = trackingConfigService.obtenerConfiguracion();
            TrackingConfigDTO.PerformanceStats stats = trackingConfigService.obtenerEstadisticasRendimiento();
            
            // Determinar estado general
            String status = determinarEstadoGeneral(config, stats);
            
            TrackingConfigDTO.HealthStatus health = TrackingConfigDTO.HealthStatus.builder()
                    .status(status)
                    .trackingActive(stats.getActiveTracking() > 0)
                    .googleMapsStatus(config.getGoogleMapsApiStatus())
                    .currentLoad(stats.getRequestsPerHour())
                    .lastCheck(java.time.LocalDateTime.now())
                    .build();
            
            log.info("Estado de salud verificado: {}, {} trackings activos", 
                    status, stats.getActiveTracking());
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            log.error("Error al verificar estado de salud", e);
            
            TrackingConfigDTO.HealthStatus errorHealth = TrackingConfigDTO.HealthStatus.builder()
                    .status("error")
                    .trackingActive(false)
                    .googleMapsStatus("unknown")
                    .currentLoad(0L)
                    .lastCheck(java.time.LocalDateTime.now())
                    .build();
            
            return ResponseEntity.ok(errorHealth);
        }
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private String determinarEstadoGeneral(TrackingConfigDTO.ConfigResponse config, 
                                         TrackingConfigDTO.PerformanceStats stats) {
        // Verificaciones de estado
        boolean googleMapsOk = !"error".equals(config.getGoogleMapsApiStatus());
        boolean loadOk = stats.getCostUSDPerMonth() < 100.0; // Costo razonable
        boolean activeOk = stats.getActiveTracking() >= 0; // Sin errores de conteo
        
        if (googleMapsOk && loadOk && activeOk) {
            return "healthy";
        } else if (googleMapsOk && activeOk) {
            return "warning"; // Alto costo pero funcional
        } else {
            return "degraded"; // Problemas con Google Maps u otros
        }
    }
}