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
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "DEPRECADO — Usar POST /subscriptions/checkout")
    public ResponseEntity<SubscriptionDTO.Response> crearSuscripcion(
            @Valid @RequestBody SubscriptionDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        // Flujo legacy deshabilitado. Checkout Pro es el único flujo válido para PREMIUM.
        return ResponseEntity.status(HttpStatus.GONE)
                .header("X-Deprecated-By", "POST /api/subscriptions/checkout")
                .build();
    }

    @PutMapping("/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Cancelar suscripción activa")
    public ResponseEntity<Void> cancelarSuscripcion(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        subscriptionService.cancelarSuscripcion(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener suscripción actual (null si no tiene ninguna)")
    public ResponseEntity<SubscriptionDTO.Response> obtenerSuscripcionActual(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SubscriptionDTO.Response response = subscriptionService.obtenerSuscripcionActual(
                userDetails.getId()
        );
        // Retorna 200 con null body si no hay suscripción (evita 404 post-pago mientras llega el webhook)
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar planes disponibles")
    public ResponseEntity<List<SubscriptionDTO.PlanInfo>> obtenerPlanes() {
        List<SubscriptionDTO.PlanInfo> planes = subscriptionService.obtenerPlanes();
        return ResponseEntity.ok(planes);
    }

    /**
     * Inicia el flujo de Checkout Pro de Mercado Pago para una suscripción.
     * Devuelve la URL 'init_point' que el cliente debe abrir en un WebView.
     */
    @PostMapping("/checkout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Crear preferencia de pago Mercado Pago para suscripción")
    public ResponseEntity<SubscriptionDTO.CheckoutResponse> crearCheckout(
            @Valid @RequestBody SubscriptionDTO.CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SubscriptionDTO.CheckoutResponse response = subscriptionService.crearCheckoutSuscripcion(
                userDetails.getId(), request.getPlan()
        );
        return ResponseEntity.ok(response);
    }
}

