package com.homecare.domain.tracking.controller;

import com.homecare.dto.TrackingDTO;
import com.homecare.domain.tracking.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Controlador WebSocket para tracking en tiempo real
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class TrackingWebSocketController {

    private final TrackingService trackingService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Recibe actualizaciones de ubicaciÃ³n del proveedor
     */
    @MessageMapping("/tracking/update/{solicitudId}")
    public void actualizarUbicacion(@DestinationVariable Long solicitudId,
                                   @Payload TrackingDTO.UbicacionUpdate ubicacion) {
        try {
            log.debug("Actualizando ubicaciÃ³n para solicitud {}: {}", solicitudId, ubicacion);
            
            // Procesar la ubicaciÃ³n
            TrackingDTO.UbicacionResponse response = trackingService.actualizarUbicacionProveedor(solicitudId, ubicacion);
            
            // Enviar actualizaciÃ³n a todos los suscriptores de esta solicitud
            messagingTemplate.convertAndSend(
                "/topic/tracking/" + solicitudId + "/location", 
                response
            );
            
            // Enviar actualizaciÃ³n especÃ­fica al cliente
            messagingTemplate.convertAndSendToUser(
                response.getClienteId().toString(),
                "/queue/tracking/location",
                response
            );
            
        } catch (Exception e) {
            log.error("Error actualizando ubicaciÃ³n para solicitud {}: {}", solicitudId, e.getMessage(), e);
            
            // Notificar error
            messagingTemplate.convertAndSend(
                "/topic/tracking/" + solicitudId + "/error",
                "Error actualizando ubicaciÃ³n: " + e.getMessage()
            );
        }
    }

    /**
     * Recibe mensajes de chat del servicio
     */
    @MessageMapping("/chat/send/{servicioId}")
    public void enviarMensaje(@DestinationVariable Long servicioId,
                              @Payload TrackingDTO.ChatMessage mensaje) {
        try {
            log.debug("Enviando mensaje de chat para servicio {}: {}", servicioId, mensaje);
            
            // Procesar el mensaje
            TrackingDTO.ChatMessage mensajeProcesado = trackingService.enviarMensajeChat(servicioId, mensaje);
            
            // Enviar mensaje a ambas partes
            messagingTemplate.convertAndSend(
                "/topic/chat/" + servicioId,
                mensajeProcesado
            );
            
        } catch (Exception e) {
            log.error("Error enviando mensaje de chat para servicio {}: {}", servicioId, e.getMessage(), e);
            
            // Notificar error al remitente
            messagingTemplate.convertAndSendToUser(
                mensaje.getEmisorId().toString(),
                "/queue/chat/error",
                "Error enviando mensaje: " + e.getMessage()
            );
        }
    }

    /**
     * Notifica cambios de estado del servicio
     */
    @MessageMapping("/service/status/{servicioId}")
    public void actualizarEstadoServicio(@DestinationVariable Long servicioId,
                                        @Payload TrackingDTO.EstadoUpdate estadoUpdate) {
        try {
            log.debug("Actualizando estado de servicio {}: {}", servicioId, estadoUpdate);
            
            // Procesar cambio de estado
            TrackingDTO.ServicioStatus status = trackingService.actualizarEstadoServicio(servicioId, estadoUpdate);
            
            // Notificar a todas las partes interesadas
            messagingTemplate.convertAndSend(
                "/topic/service/" + servicioId + "/status",
                status
            );
            
            // Notificar especÃ­ficamente al cliente
            messagingTemplate.convertAndSendToUser(
                status.getClienteId().toString(),
                "/queue/service/status",
                status
            );
            
            // Notificar al proveedor
            messagingTemplate.convertAndSendToUser(
                status.getProveedorId().toString(),
                "/queue/service/status",
                status
            );
            
        } catch (Exception e) {
            log.error("Error actualizando estado de servicio {}: {}", servicioId, e.getMessage(), e);
            
            // Notificar error
            messagingTemplate.convertAndSend(
                "/topic/service/" + servicioId + "/error",
                "Error actualizando estado: " + e.getMessage()
            );
        }
    }

    /**
     * Maneja suscripciones a tracking
     */
    @MessageMapping("/tracking/subscribe/{solicitudId}")
    @SendTo("/topic/tracking/{solicitudId}/subscribed")
    public String suscribirseATracking(@DestinationVariable Long solicitudId) {
        log.debug("Nueva suscripciÃ³n a tracking para solicitud {}", solicitudId);
        return "Suscrito al tracking de la solicitud " + solicitudId;
    }

    /**
     * Maneja desuscripciones de tracking
     */
    @MessageMapping("/tracking/unsubscribe/{solicitudId}")
    public void desuscribirseDeTracking(@DestinationVariable Long solicitudId) {
        log.debug("DesuscripciÃ³n de tracking para solicitud {}", solicitudId);
        // La gestiÃ³n de suscripciones es automÃ¡tica con WebSocket
    }
}

