package com.homecare.domain.tracking.service;

import com.homecare.dto.TrackingConfigDTO;
import com.homecare.domain.location.repository.UbicacionProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para gestionar configuraciÃ³n del tracking en tiempo real
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingConfigService {

    @Value("${tracking.update-interval-seconds:30}")
    private Integer updateIntervalSeconds;

    @Value("${tracking.distance-threshold-meters:50}")
    private Integer distanceThresholdMeters;

    @Value("${tracking.eta-calculation:haversine}")
    private String etaCalculationMethod;

    @Value("${google.maps.api-key:}")
    private String googleMapsApiKey;

    private final UbicacionProveedorRepository ubicacionRepository;

    /**
     * Obtiene la configuraciÃ³n actual del tracking
     */
    public TrackingConfigDTO.ConfigResponse obtenerConfiguracion() {
        // Verificar estado de Google Maps
        String googleMapsStatus = determinarEstadoGoogleMaps();
        boolean googleMapsEnabled = !googleMapsApiKey.isEmpty();

        // Calcular estadÃ­sticas de uso (simulado - implementar con cache Redis en producciÃ³n)
        Long requestsToday = calcularRequestsToday();
        Long requestsThisMonth = calcularRequestsThisMonth();
        Double estimatedMonthlyCost = calcularCostoMensualEstimado();

        return TrackingConfigDTO.ConfigResponse.builder()
                .updateIntervalSeconds(updateIntervalSeconds)
                .distanceThresholdMeters(distanceThresholdMeters)
                .etaCalculationMethod(etaCalculationMethod)
                .googleMapsEnabled(googleMapsEnabled)
                .googleMapsApiStatus(googleMapsStatus)
                .requestsToday(requestsToday)
                .requestsThisMonth(requestsThisMonth)
                .estimatedMonthlyCost(estimatedMonthlyCost)
                .intervalsRecommended(new String[]{"15", "30", "60"})
                .build();
    }

    /**
     * Obtiene estadÃ­sticas de rendimiento basadas en el intervalo actual
     */
    public TrackingConfigDTO.PerformanceStats obtenerEstadisticasRendimiento() {
        // Solicitudes activas con tracking
        LocalDateTime hace24h = LocalDateTime.now().minusHours(24);
        List<Long> activeTracking = ubicacionRepository.findSolicitudesConTrackingActivo(hace24h);
        Long trackingCount = (long) activeTracking.size();

        // Calcular requests por intervalo
        int requestsPerHour = 3600 / updateIntervalSeconds; // requests por hora por tracking activo
        long requestsPerDay = (long) requestsPerHour * 24 * trackingCount;
        long requestsPerMonth = requestsPerDay * 30;

        // Estimaciones de impacto
        double batteryImpact = calcularImpactoBateria();
        double dataUsageMB = calcularUsoDataMB();
        double costUSDPerMonth = calcularCostoReal(requestsPerMonth);

        return TrackingConfigDTO.PerformanceStats.builder()
                .currentInterval(updateIntervalSeconds)
                .activeTracking(trackingCount)
                .requestsPerHour((long) requestsPerHour * trackingCount)
                .requestsPerDay(requestsPerDay)
                .requestsPerMonth(requestsPerMonth)
                .batteryImpactEstimate(batteryImpact)
                .dataUsageMB(dataUsageMB)
                .costUSDPerMonth(costUSDPerMonth)
                .build();
    }

    /**
     * Genera recomendaciones de optimizaciÃ³n
     */
    public TrackingConfigDTO.OptimizationRecommendation obtenerRecomendaciones() {
        TrackingConfigDTO.PerformanceStats stats = obtenerEstadisticasRendimiento();

        String recommendedSetting;
        String reason;
        Double costSavings;
        Double batterySavings;
        String impact;

        if (updateIntervalSeconds <= 15) {
            // Muy frecuente, recomendar 30 segundos
            recommendedSetting = "30 segundos";
            reason = "Reducir consumo de baterÃ­a y costos sin afectar significativamente la precisiÃ³n";
            costSavings = stats.getCostUSDPerMonth() * 0.5; // 50% de ahorro
            batterySavings = 40.0; // 40% menos consumo
            impact = "low";
        } else if (updateIntervalSeconds == 30) {
            // Ã“ptimo actual
            recommendedSetting = "30 segundos (actual)";
            reason = "ConfiguraciÃ³n Ã³ptima: balance entre precisiÃ³n, baterÃ­a y costos";
            costSavings = 0.0;
            batterySavings = 0.0;
            impact = "optimal";
        } else {
            // Muy lento, recomendar 30 segundos para mejor UX
            recommendedSetting = "30 segundos";
            reason = "Mejorar precisiÃ³n del tracking para mejor experiencia de usuario";
            costSavings = -20.0; // Ligero aumento de costo
            batterySavings = -15.0; // Ligero aumento de consumo
            impact = "medium";
        }

        return TrackingConfigDTO.OptimizationRecommendation.builder()
                .currentSetting(updateIntervalSeconds + " segundos")
                .recommendedSetting(recommendedSetting)
                .reason(reason)
                .costSavings(costSavings)
                .batterySavings(batterySavings)
                .impact(impact)
                .build();
    }

    // ==================== MÃ‰TODOS PRIVADOS ====================

    private String determinarEstadoGoogleMaps() {
        if (googleMapsApiKey.isEmpty()) {
            return "disabled";
        }
        if ("google".equals(etaCalculationMethod)) {
            return "active";
        }
        return "fallback";
    }

    private Long calcularRequestsToday() {
        // Implementar con cache Redis en producciÃ³n
        // Por ahora retornamos estimaciÃ³n basada en tracking activo
        LocalDateTime hoy = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime ahora = LocalDateTime.now();
        long horasTranscurridas = java.time.Duration.between(hoy, ahora).toHours();
        
        List<Long> solicitudesActivas = ubicacionRepository.findSolicitudesConTrackingActivo(hoy);
        int requestsPerHour = 3600 / updateIntervalSeconds;
        
        return (long) solicitudesActivas.size() * requestsPerHour * horasTranscurridas;
    }

    private Long calcularRequestsThisMonth() {
        // Implementar con cache Redis en producciÃ³n
        LocalDateTime inicioMes = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        List<Long> solicitudesEsteMes = ubicacionRepository.findSolicitudesConTrackingActivo(inicioMes);
        
        // EstimaciÃ³n: promedio de 2 horas de tracking por solicitud
        long horasPromedioTracking = 2;
        int requestsPerHour = 3600 / updateIntervalSeconds;
        
        return (long) solicitudesEsteMes.size() * horasPromedioTracking * requestsPerHour;
    }

    private Double calcularCostoMensualEstimado() {
        Long requestsThisMonth = calcularRequestsThisMonth();
        return calcularCostoReal(requestsThisMonth);
    }

    private Double calcularCostoReal(Long requests) {
        if (requests <= 40000) {
            return 0.0; // Gratis hasta 40k requests
        }
        
        long requestsPagadas = requests - 40000;
        return requestsPagadas * 0.005; // $5 por 1000 requests = $0.005 por request
    }

    private Double calcularImpactoBateria() {
        // Escala 1-10: 1=mÃ­nimo, 10=mÃ¡ximo
        if (updateIntervalSeconds >= 60) return 2.0;
        if (updateIntervalSeconds >= 30) return 4.0;
        if (updateIntervalSeconds >= 15) return 7.0;
        return 9.0; // <= 10 segundos
    }

    private Double calcularUsoDataMB() {
        // EstimaciÃ³n de MB por hora de tracking
        // GPS + HTTP request + WebSocket â‰ˆ 1KB por actualizaciÃ³n
        double kbPorHora = (3600.0 / updateIntervalSeconds) * 1.0; // KB
        return kbPorHora / 1024.0; // MB por hora
    }
}

