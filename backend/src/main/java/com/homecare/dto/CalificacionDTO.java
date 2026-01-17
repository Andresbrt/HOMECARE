package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTOs para Calificaciones
 */
public class CalificacionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Crear {
        @NotNull(message = "El ID del servicio es obligatorio")
        private Long servicioId;

        @NotNull(message = "El ID del calificado es obligatorio")
        private Long calificadoId;

        @NotNull(message = "La puntuación es obligatoria")
        @Min(value = 1, message = "La puntuación mínima es 1")
        @Max(value = 5, message = "La puntuación máxima es 5")
        private Integer puntuacion;

        @Size(max = 500, message = "El comentario no puede exceder 500 caracteres")
        private String comentario;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private Long servicioId;
        private Long calificadorId;
        private String calificadorNombre;
        private String calificadorFoto;
        private Long calificadoId;
        private String calificadoNombre;
        private Integer puntuacion;
        private String comentario;
        private String tipo;
        private String createdAt;
    }

    // Alias para compatibilidad con servicios
    public static class Response extends Respuesta {
        public Response() {
            super();
        }

        public Response(Long id, Long servicioId, Long calificadorId, String calificadorNombre,
                       String calificadorFoto, Long calificadoId, String calificadoNombre,
                       Integer puntuacion, String comentario, String tipo, String createdAt) {
            super(id, servicioId, calificadorId, calificadorNombre, calificadorFoto, calificadoId,
                  calificadoNombre, puntuacion, comentario, tipo, createdAt);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Resumen {
        private Double promedioGeneral;
        private Long totalCalificaciones;
        private Long calificaciones5Estrellas;
        private Long calificaciones4Estrellas;
        private Long calificaciones3Estrellas;
        private Long calificaciones2Estrellas;
        private Long calificaciones1Estrella;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EstadisticasDistribucion {
        private Long total;
        private Double promedio;
        private Long estrellas5;
        private Long estrellas4;
        private Long estrellas3;
        private Long estrellas2;
        private Long estrellas1;
    }
}
