package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTOs para el sistema de referidos
 */
public class ReferralDTO {

    /**
     * DTO para respuesta de operaciones de referidos
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String codigoReferido;
        private Integer totalReferidos;
        private Integer referidosActivos;
        private Integer bonusGanado;
        private String mensaje;
        private Boolean exito;
        private String nombreReferrer;
        private java.math.BigDecimal bonusReferrer;
        private java.math.BigDecimal bonusReferee;

        // Constructor para compatibilidad con ReferralService
        public Response(String codigoReferido, String nombreReferrer, 
                       java.math.BigDecimal bonusReferrer, java.math.BigDecimal bonusReferee) {
            this.codigoReferido = codigoReferido;
            this.nombreReferrer = nombreReferrer;
            this.bonusReferrer = bonusReferrer;
            this.bonusReferee = bonusReferee;
            this.exito = true;
            this.mensaje = "Código de referido generado exitosamente";
        }
    }

    /**
     * DTO para usar código de referido
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsarCodigo {
        @NotBlank(message = "El código de referido es obligatorio")
        @Pattern(regexp = "^[A-Z0-9]{6,10}$", message = "El código debe tener entre 6 y 10 caracteres alfanuméricos")
        private String codigo;
    }

    /**
     * DTO para estadísticas de referido
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Estadisticas {
        private String periodo; // mes, año, total
        private Integer nuevosReferidos;
        private Integer referidosCompletados;
        private Integer bonusGanado;
        private Double tasaConversion;
    }
}