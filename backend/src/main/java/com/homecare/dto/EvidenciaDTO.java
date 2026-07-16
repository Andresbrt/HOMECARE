package com.homecare.dto;

import com.homecare.domain.service.model.EvidenciaServicio.TipoEvidencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class EvidenciaDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotNull(message = "El tipo de evidencia es obligatorio")
        private TipoEvidencia tipo;

        @NotBlank(message = "La URL del archivo es obligatoria")
        private String urlArchivo;

        private String descripcion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long servicioId;
        private TipoEvidencia tipo;
        private String urlArchivo;
        private Long subidoPorId;
        private String subidoPorNombre;
        private LocalDateTime createdAt;
        private String descripcion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotifyResponse {
        private boolean success;
        private String message;
    }
}
