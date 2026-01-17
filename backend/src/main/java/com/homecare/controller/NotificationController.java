package com.homecare.controller;

import com.homecare.dto.NotificationDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Gestión de notificaciones push")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/register-device")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Registrar dispositivo para notificaciones push")
    public ResponseEntity<String> registerDevice(
            @Valid @RequestBody NotificationDTO.RegisterDevice request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        notificationService.registrarDispositivo(userDetails.getId(), request);
        return ResponseEntity.ok("Dispositivo registrado correctamente");
    }

    @DeleteMapping("/unregister-device")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Desregistrar dispositivo")
    public ResponseEntity<String> unregisterDevice(@RequestParam String tokenFcm) {
        notificationService.desregistrarDispositivo(tokenFcm);
        return ResponseEntity.ok("Dispositivo desregistrado correctamente");
    }

    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enviar notificación a un usuario específico")
    public ResponseEntity<String> sendNotification(
            @Valid @RequestBody NotificationDTO.SendNotification request) {

        notificationService.enviarNotificacion(
                request.getUsuarioId(),
                request.getTitulo(),
                request.getCuerpo(),
                request.getData(),
                request.getImageUrl()
        );

        return ResponseEntity.ok("Notificación enviada");
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enviar notificación masiva")
    public ResponseEntity<NotificationDTO.Response> broadcastNotification(
            @Valid @RequestBody NotificationDTO.BroadcastNotification request) {

        NotificationDTO.Response response = notificationService.enviarNotificacionBroadcast(
                request.getTitulo(),
                request.getCuerpo(),
                request.getData(),
                request.getImageUrl(),
                request.getRol()
        );

        return ResponseEntity.ok(response);
    }
}
