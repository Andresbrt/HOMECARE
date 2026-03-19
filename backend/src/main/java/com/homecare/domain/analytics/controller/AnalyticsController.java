package com.homecare.domain.analytics.controller;

import com.homecare.dto.AnalyticsDTO;
import com.homecare.domain.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "MÃ©tricas y anÃ¡lisis del negocio")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/metricas-indriver")
    @Operation(summary = "MÃ©tricas especÃ­ficas del modelo inDriver")
    public ResponseEntity<AnalyticsDTO.MetricasInDriver> getMetricasInDriver(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        AnalyticsDTO.MetricasInDriver metricas = analyticsService.getMetricasInDriver(fechaInicio, fechaFin);
        return ResponseEntity.ok(metricas);
    }

    @GetMapping("/conversion-funnel")
    @Operation(summary = "Embudo de conversiÃ³n: solicitudes â†’ ofertas â†’ aceptadas â†’ completadas")
    public ResponseEntity<AnalyticsDTO.ConversionFunnel> getConversionFunnel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        AnalyticsDTO.ConversionFunnel funnel = analyticsService.getConversionFunnel(fechaInicio, fechaFin);
        return ResponseEntity.ok(funnel);
    }

    @GetMapping("/top-proveedores")
    @Operation(summary = "Top proveedores por servicios completados")
    public ResponseEntity<List<AnalyticsDTO.TopProveedor>> getTopProveedores(
            @RequestParam(defaultValue = "10") Integer limite) {

        List<AnalyticsDTO.TopProveedor> top = analyticsService.getTopProveedores(limite);
        return ResponseEntity.ok(top);
    }

    @GetMapping("/revenue")
    @Operation(summary = "Resumen financiero: pagos, comisiones, ganancias proveedores")
    public ResponseEntity<AnalyticsDTO.RevenueSummary> getRevenueSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        AnalyticsDTO.RevenueSummary summary = analyticsService.getRevenueSummary(fechaInicio, fechaFin);
        return ResponseEntity.ok(summary);
    }
}

