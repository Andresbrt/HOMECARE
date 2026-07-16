package com.homecare.dto;

import com.homecare.domain.service.model.Disputa.ResultadoDisputa;
import com.homecare.domain.service.model.Disputa.EstadoDisputa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class DisputaDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotNull(message = "Servicio ID es requerido")
        private Long servicioId;

        @NotBlank(message = "Motivo es requerido")
        private String motivo;

        private String descripcion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Resolver {
        @NotNull(message = "Resultado es requerido")
        private ResultadoDisputa resultado;

        private String resolucion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long servicioId;
        private Long clienteId;
        private Long proveedorId;
        private Long iniciadoPorId;
        private EstadoDisputa estado;
        private ResultadoDisputa resultado;
        private String motivo;
        private String descripcion;
        private String resolucion;
        private Long adminResponsableId;
        private String comentarioResolucion;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
