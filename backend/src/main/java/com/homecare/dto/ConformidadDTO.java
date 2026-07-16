package com.homecare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ConformidadDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotNull(message = "El estado de conformidad es obligatorio")
        private Boolean aceptado;

        private String comentario;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long servicioId;
        private Boolean aceptado;
        private String comentario;
        private LocalDateTime createdAt;
        private String ipOrigen;
    }
}
