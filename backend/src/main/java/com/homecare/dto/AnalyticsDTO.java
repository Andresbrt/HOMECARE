package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class AnalyticsDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MetricasInDriver {
        private Long totalSolicitudes;
        private Long totalOfertas;
        private Double ofertasPromedioPorSolicitud;
        private Double precioPromedio;
        private Double variacionPrecios;
        private Long solicitudesConChat;
        private Double porcentajeNegociacion;
        private Integer tiempoPromedioEleccion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversionFunnel {
        private Long solicitudesCreadas;
        private Long solicitudesConOfertas;
        private Long solicitudesAceptadas;
        private Long serviciosCompletados;
        private Double tasaConversionOfertas;
        private Double tasaConversionAceptacion;
        private Double tasaCompletamiento;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProveedor {
        private Long proveedorId;
        private String proveedorNombre;
        private Long serviciosCompletados;
        private Double calificacionPromedio;
        private Double ingresos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueSummary {
        private Double totalPagos;
        private Double totalComisiones;
        private Long totalProveedores;
        private Double crecimiento;
        private Map<String, Double> ingresosPorTipo;
        private Map<String, Double> ingresosPorRegion;
    }
}
