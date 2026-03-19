package com.homecare.domain.messaging.controller;

import com.homecare.dto.MensajeDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.messaging.service.MensajeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
@RequiredArgsConstructor
@Tag(name = "Mensajes", description = "Chat en tiempo real (WebSocket + REST)")
@SecurityRequirement(name = "bearerAuth")
public class MensajeController {

    private final MensajeService mensajeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Enviar mensaje")
    public ResponseEntity<MensajeDTO.Response> enviarMensaje(
            @Valid @RequestBody MensajeDTO.Enviar request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        MensajeDTO.Response response = mensajeService.enviarMensaje(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solicitud/{solicitudId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener mensajes de una solicitud")
    public ResponseEntity<List<MensajeDTO.Response>> obtenerMensajes(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<MensajeDTO.Response> mensajes = mensajeService.obtenerMensajes(solicitudId, userDetails.getId());
        return ResponseEntity.ok(mensajes);
    }

    @GetMapping("/conversaciones")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener lista de conversaciones")
    public ResponseEntity<List<MensajeDTO.Conversacion>> obtenerConversaciones(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<MensajeDTO.Conversacion> conversaciones = mensajeService.obtenerConversaciones(userDetails.getId());
        return ResponseEntity.ok(conversaciones);
    }

    @PutMapping("/{mensajeId}/leer")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Marcar mensaje como leÃ­do")
    public ResponseEntity<Void> marcarComoLeido(
            @PathVariable Long mensajeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        mensajeService.marcarComoLeido(mensajeId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/solicitud/{solicitudId}/leer-todos")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Marcar todos los mensajes como leÃ­dos")
    public ResponseEntity<Void> marcarTodosComoLeidos(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        mensajeService.marcarTodosComoLeidos(solicitudId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/no-leidos")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Contar mensajes no leÃ­dos")
    public ResponseEntity<Long> contarNoLeidos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long count = mensajeService.contarNoLeidos(userDetails.getId());
        return ResponseEntity.ok(count);
    }

    @GetMapping("/solicitud/{solicitudId}/no-leidos")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Contar mensajes no leÃ­dos de una solicitud")
    public ResponseEntity<Long> contarNoLeidosPorSolicitud(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long count = mensajeService.contarNoLeidosPorSolicitud(solicitudId, userDetails.getId());
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{mensajeId}/typing")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Indicar que estÃ¡ escribiendo")
    public ResponseEntity<Void> indicarEscribiendo(
            @PathVariable Long mensajeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        mensajeService.notificarEscribiendo(mensajeId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

/**
 * Controlador WebSocket para chat en tiempo real
 * Maneja la comunicaciÃ³n bidireccional entre cliente y proveedor
 */
@Controller
@RequiredArgsConstructor
class ChatWebSocketController {

    private final MensajeService mensajeService;

    /**
     * Enviar mensaje por WebSocket
     * Cliente envÃ­a a: /app/chat/send
     */
    @MessageMapping("/chat/send")
    public void handleChatMessage(@Payload MensajeDTO.WebSocketMessage mensaje, Principal principal) {
        // Obtener ID del usuario autenticado
        Long usuarioId = Long.parseLong(principal.getName());
        
        // Crear DTO para enviar mensaje
        MensajeDTO.Enviar request = new MensajeDTO.Enviar();
        request.setSolicitudId(mensaje.getSolicitudId());
        request.setDestinatarioId(mensaje.getDestinatarioId());
        request.setContenido(mensaje.getContenido());
        request.setTipoMensaje(mensaje.getTipo());
        request.setArchivoUrl(mensaje.getArchivoUrl());
        
        // Enviar mensaje
        mensajeService.enviarMensaje(usuarioId, request);
    }

    /**
     * Notificar que estÃ¡ escribiendo
     * Cliente envÃ­a a: /app/chat/{solicitudId}/typing
     */
    @MessageMapping("/chat/{solicitudId}/typing")
    public void handleTypingIndicator(@DestinationVariable Long solicitudId, Principal principal) {
        Long usuarioId = Long.parseLong(principal.getName());
        mensajeService.enviarIndicadorEscribiendo(solicitudId, usuarioId);
    }

    /**
     * Suscribirse a mensajes de una solicitud
     * Cliente se suscribe a: /topic/chat/{solicitudId}
     */
    @SubscribeMapping("/chat/{solicitudId}")
    public List<MensajeDTO.Response> onSubscribe(@DestinationVariable Long solicitudId, Principal principal) {
        Long usuarioId = Long.parseLong(principal.getName());
        return mensajeService.obtenerMensajes(solicitudId, usuarioId);
    }

    /**
     * Marcar mensajes como leÃ­dos por WebSocket
     * Cliente envÃ­a a: /app/chat/{solicitudId}/read
     */
    @MessageMapping("/chat/{solicitudId}/read")
    public void handleMarkAsRead(@DestinationVariable Long solicitudId, Principal principal) {
        Long usuarioId = Long.parseLong(principal.getName());
        mensajeService.marcarTodosComoLeidos(solicitudId, usuarioId);
    }
}

