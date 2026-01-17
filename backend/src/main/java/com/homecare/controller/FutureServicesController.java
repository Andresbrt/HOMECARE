package com.homecare.controller;

import com.homecare.dto.*;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.*;
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

@RestController
@RequestMapping("/api/future")
@RequiredArgsConstructor
@Tag(name = "Future Services", description = "Servicios base para funcionalidades futuras")
@SecurityRequirement(name = "bearerAuth")
public class FutureServicesController {

    private final LoyaltyService loyaltyService;
    private final ReferralService referralService;
    private final AIService aiService;
    private final WebhookService webhookService;

    // ============ LOYALTY ============

    @GetMapping("/loyalty/points")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener puntos de lealtad")
    public ResponseEntity<LoyaltyDTO.Response> getPoints(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LoyaltyDTO.Response response = loyaltyService.getPoints(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/loyalty/redeem")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Canjear puntos de lealtad")
    public ResponseEntity<LoyaltyDTO.Response> redeemPoints(
            @RequestParam Integer points,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LoyaltyDTO.Response response = loyaltyService.redeemPoints(userDetails.getId(), points);
        return ResponseEntity.ok(response);
    }

    // ============ REFERRAL ============

    @GetMapping("/referral/my-code")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener código de referido")
    public ResponseEntity<ReferralDTO.Response> getMyReferralCode(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ReferralDTO.Response response = referralService.generarCodigo(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/referral/apply")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Aplicar código de referido")
    public ResponseEntity<Void> applyReferralCode(
            @RequestParam String codigo,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        referralService.aplicarCodigo(userDetails.getId(), codigo);
        return ResponseEntity.noContent().build();
    }

    // ============ AI ============

    @GetMapping("/ai/recommend-price")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Recomendar precio con IA")
    public ResponseEntity<AIDTO.PrecioRecomendado> recommendPrice(
            @RequestParam String tipoLimpieza,
            @RequestParam Integer metrosCuadrados,
            @RequestParam String zona,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        AIDTO.PrecioRecomendado response = aiService.recomendarPrecioProveedor(
                userDetails.getId(), tipoLimpieza, metrosCuadrados, zona
        );
        return ResponseEntity.ok(response);
    }

    // ============ WEBHOOKS ============

    @PostMapping("/webhooks/register")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Registrar webhook")
    public ResponseEntity<WebhookDTO.Response> registerWebhook(
            @Valid @RequestBody WebhookDTO.Crear request) {
        WebhookDTO.Response response = webhookService.registrarWebhook(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/webhooks/{webhookId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar webhook")
    public ResponseEntity<Void> deactivateWebhook(@PathVariable Long webhookId) {
        webhookService.desactivarWebhook(webhookId);
        return ResponseEntity.noContent().build();
    }
}
