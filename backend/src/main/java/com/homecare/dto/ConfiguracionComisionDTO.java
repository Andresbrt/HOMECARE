package com.homecare.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ConfiguracionComisionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        private String tipoServicio;

        @DecimalMin(value = "0.0", message = "El porcentaje de comisión debe ser válido")
        private BigDecimal porcentajeComision;

        private LocalDate vigenciaDesde;
        private LocalDate vigenciaHasta;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String tipoServicio;
        private BigDecimal porcentajeComision;
        private LocalDate vigenciaDesde;
        private LocalDate vigenciaHasta;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
