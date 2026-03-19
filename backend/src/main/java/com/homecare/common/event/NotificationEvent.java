package com.homecare.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Evento genérico para notificaciones del sistema
 * Desacopla la lógica de negocio del envío físico (Push, WebSocket, Email)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private Long usuarioId;
    private String titulo;
    private String cuerpo;
    private String tipo; // NUEVA_OFERTA, NUEVA_SOLICITUD, MENSAJE_CHAT, etc.
    private Map<String, String> data;
    private String imageUrl;
    private String targetRol; // "CUSTOMER", "SERVICE_PROVIDER", "ALL"
    private boolean isBroadcast;
}
