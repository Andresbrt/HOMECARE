package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTOs para Mensajes (Chat)
 */
public class MensajeDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Enviar {
        @NotNull(message = "El ID de la solicitud es obligatorio")
        private Long solicitudId;

        @NotNull(message = "El ID del destinatario es obligatorio")
        private Long destinatarioId;

        @NotBlank(message = "El contenido es obligatorio")
        @Size(max = 1000, message = "El contenido no puede exceder 1000 caracteres")
        private String contenido;

        private String tipo; // TEXTO, IMAGEN, ARCHIVO

        private String archivoUrl;

        // Alias para compatibilidad
        public String getTipoMensaje() {
            return tipo;
        }

        public void setTipoMensaje(String tipoMensaje) {
            this.tipo = tipoMensaje;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private Long solicitudId;
        private Long remitenteId;
        private String remitenteNombre;
        private String remitenteFoto;
        private Long destinatarioId;
        private String destinatarioNombre;
        private String destinatarioFoto;
        private String contenido;
        private String tipo;
        private String archivoUrl;
        private Boolean leido;
        private String leidoAt;
        private String createdAt;
    }

    // Alias para compatibilidad con servicios
    public static class Response extends Respuesta {
        public Response() {
            super();
        }

        public Response(Long id, Long solicitudId, Long remitenteId, String remitenteNombre,
                       String remitenteFoto, Long destinatarioId, String destinatarioNombre,
                       String destinatarioFoto, String contenido, String tipo, String archivoUrl,
                       Boolean leido, String leidoAt, String createdAt) {
            super(id, solicitudId, remitenteId, remitenteNombre, remitenteFoto, destinatarioId,
                  destinatarioNombre, destinatarioFoto, contenido, tipo, archivoUrl, leido,
                  leidoAt, createdAt);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarcarLeido {
        @NotNull(message = "El ID del mensaje es obligatorio")
        private Long mensajeId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Chat {
        private Long solicitudId;
        private Long usuarioId;
        private String usuarioNombre;
        private String usuarioFoto;
        private String ultimoMensaje;
        private String ultimoMensajeAt;
        private Long mensajesNoLeidos;
    }

    /**
     * DTO para mensajes de WebSocket
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WebSocketMessage {
        private Long solicitudId;
        private Long destinatarioId;
        private String contenido;
        private String tipo;
        private String archivoUrl;
    }

    /**
     * DTO para lista de conversaciones
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Conversacion {
        private Long solicitudId;
        private String tituloSolicitud;
        private Long interlocutorId;
        private String interlocutorNombre;
        private String interlocutorFoto;
        private String ultimoMensaje;
        private String ultimoMensajeFecha;
        private Integer mensajesNoLeidos;
        private Boolean usuarioEscribiendo;
    }

    /**
     * DTO para indicador de escritura
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TypingIndicator {
        private Long solicitudId;
        private Long usuarioId;
        private String usuarioNombre;
        private Boolean escribiendo;
    }
}
