package com.homecare.controller;

import com.homecare.dto.PagoDTO;
import com.homecare.model.Pago.EstadoPago;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Gestión de pagos con Wompi")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Crear nuevo pago")
    public ResponseEntity<PagoDTO.PagoResponse> createPayment(
            @Valid @RequestBody PagoDTO.CrearPago request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PagoDTO.PagoResponse response = paymentService.crearPago(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/wompi")
    @Operation(summary = "Webhook de Wompi para actualización de estado de pagos")
    public ResponseEntity<String> wompiWebhook(@RequestBody PagoDTO.WompiWebhookEvent webhook) {
        try {
            paymentService.procesarWebhookWompi(webhook);
            return ResponseEntity.ok("Webhook procesado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Procesar reembolso")
    public ResponseEntity<PagoDTO.ReembolsoResponse> processRefund(
            @Valid @RequestBody PagoDTO.ReembolsoRequest request) {

        PagoDTO.ReembolsoResponse response = paymentService.procesarReembolso(
                request.getPagoId(), request
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{pagoId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener detalle de un pago")
    public ResponseEntity<PagoDTO.PagoResponse> getPayment(
            @PathVariable Long pagoId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PagoDTO.PagoResponse response = paymentService.obtenerPago(pagoId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener mis pagos")
    public ResponseEntity<List<PagoDTO.PagoResponse>> getMyPayments(
            @RequestParam(required = false) EstadoPago estado,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<PagoDTO.PagoResponse> pagos = paymentService.obtenerPagosPorUsuario(
                userDetails.getId(), estado
        );
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener estadísticas de pagos")
    public ResponseEntity<PagoDTO.EstadisticasPagos> getStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {

        PagoDTO.EstadisticasPagos stats = paymentService.obtenerEstadisticas(desde, hasta);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/verify-pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verificar y actualizar pagos pendientes")
    public ResponseEntity<String> verifyPendingPayments() {
        paymentService.verificarPagosPendientes();
        return ResponseEntity.ok("Verificación de pagos pendientes iniciada");
    }
}
