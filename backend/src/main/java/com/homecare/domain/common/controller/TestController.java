package com.homecare.domain.common.controller;

import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Profile({"dev", "test"})
public class TestController {

    private final NotificationService notificationService;

    @PostMapping("/send-notification/{usuarioId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendTestNotification(
            @PathVariable Long usuarioId,
            @RequestParam String titulo,
            @RequestParam String cuerpo) {
        
        try {
            notificationService.enviarNotificacion(usuarioId, titulo, cuerpo, null, null);
            return ResponseEntity.ok("Notificación registrada exitosamente");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Backend de HOME CARE funcionando correctamente en el puerto 8083");
    }
}
