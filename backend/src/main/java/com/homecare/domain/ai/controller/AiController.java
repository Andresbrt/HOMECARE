package com.homecare.domain.ai.controller;

import com.homecare.domain.ai.service.GroqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final GroqService groqService;

    @PostMapping("/asistente")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("mensaje", "").trim();
        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo 'mensaje' es requerido"));
        }
        return ResponseEntity.ok(Map.of("respuesta", groqService.chat(message)));
    }

    @PostMapping("/precio")
    public ResponseEntity<Map<String, String>> suggestPrice(@RequestBody Map<String, String> body) {
        String context = body.getOrDefault("contexto", "").trim();
        if (context.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo 'contexto' es requerido"));
        }
        return ResponseEntity.ok(Map.of("respuesta", groqService.suggestPrice(context)));
    }

    @PostMapping("/soporte")
    public ResponseEntity<Map<String, String>> support(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("mensaje", "").trim();
        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El campo 'mensaje' es requerido"));
        }
        return ResponseEntity.ok(Map.of("respuesta", groqService.support(message)));
    }
}
