package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs para el sistema de webhooks
 */
public class WebhookDTO {

    /**
     * DTO para crear un nuevo webhook
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotBlank(message = "La URL es obligatoria")
        @Pattern(regexp = "^https?://.*", message = "La URL debe ser válida (http o https)")
        private String url;
        
        @NotEmpty(message = "Debe especificar al menos un evento")
        @Size(min = 1, max = 20, message = "Debe especificar entre 1 y 20 eventos")
        private List<String> eventos;
        
        private String descripcion;
    }

    /**
     * DTO para respuesta de webhook
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String url;
        private List<String> eventos;
        private String secretKey;
        private Boolean activo;
        private String descripcion;
        private LocalDateTime fechaCreacion;
        private LocalDateTime ultimoEnvio;
        private Integer totalEnvios;
        private Integer enviosExitosos;
        private Integer enviosFallidos;
        
        // Constructor para compatibilidad con el servicio
        public Response(Long id, String url, List<String> eventos, String secretKey, Boolean activo) {
            this.id = id;
            this.url = url;
            this.eventos = eventos;
            this.secretKey = secretKey;
            this.activo = activo;
        }
    }

    /**
     * DTO para actualizar webhook
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Actualizar {
        @Pattern(regexp = "^https?://.*", message = "La URL debe ser válida (http o https)")
        private String url;
        
        @Size(min = 1, max = 20, message = "Debe especificar entre 1 y 20 eventos")
        private List<String> eventos;
        
        private Boolean activo;
        private String descripcion;
    }

    /**
     * DTO para evento de webhook
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Evento {
        private String tipo;
        private Object data;
        private LocalDateTime timestamp;
        private String version;
        private String webhookId;
    }
}