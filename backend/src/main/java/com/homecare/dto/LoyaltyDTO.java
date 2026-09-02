package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * DTOs para el sistema de lealtad y puntos
 */
public class LoyaltyDTO {

    /**
     * DTO para respuesta de operaciones de puntos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long usuarioId;
        private Integer puntosActuales;
        private Integer puntosGanados;
        private Integer puntosCanjeados;
        private String motivo;
        private String mensaje;
        private Boolean exito;
        private String tierLevel;

        // Constructor para compatibilidad con LoyaltyService
        public Response(Long usuarioId, Integer puntosActuales, String tierLevel) {
            this.usuarioId = usuarioId;
            this.puntosActuales = puntosActuales;
            this.tierLevel = tierLevel;
            this.exito = true;
        }

        // Constructor para operaciones con puntos específicos  
        public Response(Long usuarioId, int puntosActuales, String tierLevel) {
            this.usuarioId = usuarioId;
            this.puntosActuales = puntosActuales;
            this.tierLevel = tierLevel;
            this.exito = true;
        }
    }

    /**
     * DTO para canjear puntos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CanjearPuntos {
        @Positive(message = "Los puntos deben ser positivos")
        private Integer puntos;
        
        @NotBlank(message = "El tipo de canje es obligatorio")
        private String tipoCanje; // descuento, regalo, etc.
    }

    /**
     * DTO para ganar puntos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GanarPuntos {
        @Positive(message = "Los puntos deben ser positivos")
        private Integer puntos;
        
        @NotBlank(message = "El motivo es obligatorio")
        private String motivo;
    }

    /**
     * DTO para historial de puntos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistorialPuntos {
        private String fecha;
        private Integer puntos;
        private String tipo; // ganado, canjeado
        private String motivo;
        private String descripcion;
    }
}
