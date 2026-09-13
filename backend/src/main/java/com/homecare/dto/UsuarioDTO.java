package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTOs para Usuarios
 */
public class UsuarioDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Actualizar {
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        private String nombre;

        @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
        private String apellido;

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Teléfono inválido")
        private String telefono;

        private String fotoPerfil;

        private String direccion;

        @DecimalMin(value = "-90.0", message = "Latitud inválida")
        @DecimalMax(value = "90.0", message = "Latitud inválida")
        private BigDecimal latitud;

        @DecimalMin(value = "-180.0", message = "Longitud inválida")
        @DecimalMax(value = "180.0", message = "Longitud inválida")
        private BigDecimal longitud;

        private Boolean disponible;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String telefono;
        private String fotoPerfil;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private Boolean disponible;
        private BigDecimal calificacionPromedio;
        private Integer serviciosCompletados;
        private List<String> roles;
    }

    // Alias para compatibilidad con servicios
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String nombre;
        private String email;
        private String telefono;
        private String fotoPerfil;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private Boolean disponible;
        private Boolean verificado;
        private BigDecimal calificacionPromedio;
        private Integer serviciosCompletados;
        private String nivelRanking; // BASIC, PRO, ELITE
        private Integer bonusVisibilidad; // 0, 5, 10
        private List<String> roles;
    }

    /**
     * DTO de perfil público sanitizado (sin email, teléfono, dirección ni coordenadas GPS).
     * Cumple con OWASP API3:2023 y Ley 1581 de Habeas Data Colombia.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PerfilPublicoResponse {
        private Long id;
        private String nombre;
        private String fotoPerfil;
        private Boolean disponible;
        private Boolean verificado;
        private BigDecimal calificacionPromedio;
        private Integer serviciosCompletados;
        private String nivelRanking; // BASIC, PRO, ELITE
        private Integer bonusVisibilidad; // 0, 5, 10
        private List<String> roles;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Estadisticas {
        private Long serviciosCompletados;
        private BigDecimal totalGanado;
        private BigDecimal calificacionPromedio;
        private Long totalCalificaciones;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Verificacion {
        private Boolean verificado;
        private String fotoSelfieVerificacion;
        private String fotoCedulaFrontal;
        private String fotoCedulaPosterior;
        private String archivoAntecedentes;
        private Double verificacionIAScore;
        private String comentariosVerificacion;
        private java.time.LocalDateTime fechaVerificacion;
        private Boolean intentoVerificacionConcluido;
    }
}
