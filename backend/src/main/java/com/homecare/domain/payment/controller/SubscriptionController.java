package com.homecare.domain.payment.controller;

import com.homecare.dto.SubscriptionDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.payment.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "GestiÃ³n de suscripciones y planes")
@SecurityRequirement(name = "bearerAuth")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/subscribe")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Crear suscripciÃ³n a un plan")
    public ResponseEntity<SubscriptionDTO.Response> crearSuscripcion(
            @Valid @RequestBody SubscriptionDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SubscriptionDTO.Response response = subscriptionService.crearSuscripcion(
                userDetails.getId(), request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/cancel")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Cancelar suscripciÃ³n activa")
    public ResponseEntity<Void> cancelarSuscripcion(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        subscriptionService.cancelarSuscripcion(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Obtener suscripciÃ³n actual")
    public ResponseEntity<SubscriptionDTO.Response> obtenerSuscripcionActual(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SubscriptionDTO.Response response = subscriptionService.obtenerSuscripcionActual(
                userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar planes disponibles")
    public ResponseEntity<List<SubscriptionDTO.PlanInfo>> obtenerPlanes() {
        List<SubscriptionDTO.PlanInfo> planes = subscriptionService.obtenerPlanes();
        return ResponseEntity.ok(planes);
    }
}

