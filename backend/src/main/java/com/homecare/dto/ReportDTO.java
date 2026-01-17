package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ReportDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServicioReporte {
        private Long servicioId;
        private LocalDateTime fechaServicio;
        private String clienteNombre;
        private String proveedorNombre;
        private String tipoLimpieza;
        private String estado;
        private Double monto;
        private Integer calificacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProveedorReporte {
        private Long proveedorId;
        private String nombre;
        private Long serviciosCompletados;
        private Double calificacionPromedio;
        private Double totalGanancias;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PagoReporte {
        private Long pagoId;
        private LocalDateTime fechaPago;
        private String clienteNombre;
        private String proveedorNombre;
        private Double monto;
        private String estado;
        private String metodoPago;
    }
}
