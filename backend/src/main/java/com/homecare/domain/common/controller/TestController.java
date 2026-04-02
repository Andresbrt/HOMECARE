package com.homecare.domain.common.controller;

import com.homecare.dto.NotificationDTO;
import com.homecare.domain.common.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final NotificationService notificationService;

    @PostMapping("/send-notification/{usuarioId}")
    public ResponseEntity<String> sendTestNotification(
            @PathVariable Long usuarioId,
            @RequestParam String titulo,
            @RequestParam String cuerpo) {
        
        try {
            notificationService.enviarNotificacion(usuarioId, titulo, cuerpo, null, null);
            return ResponseEntity.ok("Notificación enviada (o encolada si Firebase no está configurado)");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Backend de HOME CARE funcionando correctamente en el puerto 8083");
    }
}
