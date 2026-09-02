package com.homecare.common.event;

import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Orquestador de notificaciones (Manejador de Eventos)
 * Envía notificaciones a través de múltiples canales (Push via FCM y WebSockets)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService pushService;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.debug("Procesando evento de notificación tipo: {} para usuario: {}", 
                event.getTipo(), event.isBroadcast() ? "BROADCAST" : event.getUsuarioId());

        // Canal 1: Notificación Push (FCM)
        if (event.isBroadcast()) {
            pushService.enviarNotificacionBroadcast(
                    event.getTitulo(),
                    event.getCuerpo(),
                    event.getData(),
                    event.getImageUrl(),
                    event.getTargetRol()
            );
        } else {
            pushService.enviarNotificacion(
                    event.getUsuarioId(),
                    event.getTitulo(),
                    event.getCuerpo(),
                    event.getData(),
                    event.getImageUrl()
            );
        }

        // Canal 2: WebSockets (Suscripciones en tiempo real)
        // Se envía a una cola de usuario (/user/{username}/queue/notifications)
        if (!event.isBroadcast() && event.getUsuarioId() != null) {
            String destination = "/queue/notifications";
            messagingTemplate.convertAndSendToUser(
                    event.getUsuarioId().toString(),
                    destination,
                    event
            );
        } else if (event.isBroadcast()) {
            // Se envía a un tópico global o por rol
            String topic = event.getTargetRol() != null ? "/topic/notifications/" + event.getTargetRol() : "/topic/notifications";
            messagingTemplate.convertAndSend(topic, event);
        }
    }
}
