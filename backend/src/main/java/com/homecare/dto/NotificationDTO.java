package com.homecare.dto;

import com.homecare.model.DispositivoFCM.Plataforma;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.Map;

public class NotificationDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterDevice {
        @NotBlank(message = "Token FCM es requerido")
        private String tokenFcm;

        private Plataforma plataforma;
        private String modeloDispositivo;
        private String versionApp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendNotification {
        private Long usuarioId;
        
        @NotBlank(message = "Título es requerido")
        private String titulo;
        
        @NotBlank(message = "Cuerpo es requerido")
        private String cuerpo;
        
        private Map<String, String> data;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BroadcastNotification {
        @NotBlank(message = "Título es requerido")
        private String titulo;
        
        @NotBlank(message = "Cuerpo es requerido")
        private String cuerpo;
        
        private Map<String, String> data;
        private String imageUrl;
        private String rol; // CUSTOMER, SERVICE_PROVIDER, ALL
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private boolean success;
        private String message;
        private int enviadas;
        private int fallidas;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificacionInfo {
        private Long id;
        private String titulo;
        private String mensaje;
        private String tipo;
        private Map<String, String> data;
        private Boolean leida;
        private LocalDateTime createdAt;
    }
}
