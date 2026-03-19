package com.homecare.domain.tracking.controller;

import com.homecare.dto.TrackingConfigDTO;
import com.homecare.domain.tracking.service.TrackingConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Controlador REST para gestiÃ³n de configuraciÃ³n del tracking
 */
@RestController
@RequestMapping("/api/tracking/config")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tracking Configuration", description = "GestiÃ³n de configuraciÃ³n del sistema de tracking")
public class TrackingConfigController {

    private final TrackingConfigService trackingConfigService;

    @GetMapping
    @Operation(summary = "Obtener configuraciÃ³n actual", 
               description = "Retorna la configuraciÃ³n actual del sistema de tracking, estado de APIs y estadÃ­sticas de uso")
    public ResponseEntity<TrackingConfigDTO.ConfigResponse> obtenerConfiguracion() {
        try {
            log.debug("Obteniendo configuraciÃ³n del sistema de tracking");
            
            TrackingConfigDTO.ConfigResponse config = trackingConfigService.obtenerConfiguracion();
            
            log.info("ConfiguraciÃ³n obtenida exitosamente: intervalo {}s, Google Maps: {}", 
                    config.getUpdateIntervalSeconds(), config.isGoogleMapsEnabled());
            
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("Error al obtener configuraciÃ³n del tracking", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/performance")
    @Operation(summary = "Obtener estadÃ­sticas de rendimiento", 
               description = "Retorna estadÃ­sticas detalladas sobre el rendimiento del sistema de tracking")
    public ResponseEntity<TrackingConfigDTO.PerformanceStats> obtenerEstadisticas() {
        try {
            log.debug("Obteniendo estadÃ­sticas de rendimiento del tracking");
            
            TrackingConfigDTO.PerformanceStats stats = trackingConfigService.obtenerEstadisticasRendimiento();
            
            log.info("EstadÃ­sticas obtenidas: {} trackings activos, {} requests/dÃ­a", 
                    stats.getActiveTracking(), stats.getRequestsPerDay());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error al obtener estadÃ­sticas de rendimiento", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Obtener recomendaciones de optimizaciÃ³n", 
               description = "Analiza la configuraciÃ³n actual y sugiere optimizaciones para baterÃ­a, costos y rendimiento")
    public ResponseEntity<TrackingConfigDTO.OptimizationRecommendation> obtenerRecomendaciones() {
        try {
            log.debug("Generando recomendaciones de optimizaciÃ³n");
            
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
    @Operation(summary = "Actualizar configuraciÃ³n de tracking", 
               description = "Actualiza los parÃ¡metros de configuraciÃ³n del sistema de tracking en tiempo real")
    public ResponseEntity<TrackingConfigDTO.ConfigResponse> actualizarConfiguracion(
            @Valid @RequestBody TrackingConfigDTO.UpdateConfig updateConfig) {
        try {
            log.info("Solicitada actualizaciÃ³n de configuraciÃ³n: intervalo {}s, mÃ©todo ETA: {}", 
                    updateConfig.getUpdateIntervalSeconds(), updateConfig.getEtaCalculationMethod());
            
            // TODO: Implementar actualizaciÃ³n dinÃ¡mica de configuraciÃ³n
            // Por ahora retornamos la configuraciÃ³n actual con mensaje informativo
            TrackingConfigDTO.ConfigResponse currentConfig = trackingConfigService.obtenerConfiguracion();
            
            log.warn("ActualizaciÃ³n de configuraciÃ³n pendiente de implementaciÃ³n. " +
                     "ConfiguraciÃ³n actual mantenida: intervalo {}s", 
                     currentConfig.getUpdateIntervalSeconds());
            
            return ResponseEntity.ok(currentConfig);
            
        } catch (Exception e) {
            log.error("Error al actualizar configuraciÃ³n del tracking", e);
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

    // ==================== MÃ‰TODOS PRIVADOS ====================

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

