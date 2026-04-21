package com.homecare.domain.payment.controller;


import com.homecare.dto.PagoDTO;
import com.homecare.domain.payment.model.Pago.EstadoPago;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
@Slf4j
@Tag(name = "Payments", description = "Gestion de pagos con Mercado Pago")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Crear nuevo pago (Preferencia de Mercado Pago)")
    public ResponseEntity<PagoDTO.PagoResponse> createPayment(
            @Valid @RequestBody PagoDTO.CrearPago request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PagoDTO.PagoResponse response = paymentService.crearPago(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/mercadopago")
    @Operation(summary = "Webhook de Mercado Pago para actualizacion de estado de pagos")
    public ResponseEntity<String> mercadoPagoWebhook(
            @RequestBody PagoDTO.MercadoPagoWebhookEvent event,
            @RequestHeader(value = "x-signature",   required = false) String xSignature,
            @RequestHeader(value = "x-request-id",  required = false) String xRequestId) {

        String dataId = (event.getData() != null) ? event.getData().getId() : null;
        log.info("Webhook MP recibido — tipo={}, action={}, dataId={}", 
                event.getType(), event.getAction(), dataId);

        // Validar firma si el secreto está configurado
        if (!paymentService.validarFirmaWebhookMP(xSignature, xRequestId, dataId)) {
            log.warn("Firma de webhook MP inválida — xSignature={}", xSignature);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Firma inválida");
        }

        try {
            paymentService.procesarWebhookMP(event);
            return ResponseEntity.ok("Webhook procesado");
        } catch (Exception e) {
            log.error("Error procesando webhook Mercado Pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error procesando evento");
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
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Listar mis pagos")
    public ResponseEntity<List<PagoDTO.PagoResponse>> getMyPayments(
            @RequestParam(required = false) EstadoPago estado,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<PagoDTO.PagoResponse> response = paymentService.obtenerPagosPorUsuario(userDetails.getId(), estado);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener estadisticas de pagos")
    public ResponseEntity<PagoDTO.EstadisticasPagos> getStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {

        PagoDTO.EstadisticasPagos stats = paymentService.obtenerEstadisticas(desde, hasta);
        return ResponseEntity.ok(stats);
    }

    // ─── Callbacks de back_url de Mercado Pago (suscripciones) ────────────────
    // El WebView los intercepta antes de cargar, por lo que estos endpoints
    // son de respaldo para compatibilidad con tests en browser y para evitar 404.

    @GetMapping("/subscription/success")
    @Operation(summary = "Callback back_url — suscripción aprobada")
    public ResponseEntity<Void> subscriptionSuccess(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String payment_id,
            @RequestParam(required = false) String external_reference) {
        log.info("Callback suscripción SUCCESS — paymentId={}, ref={}", payment_id, external_reference);
        // El webhook /webhook/mercadopago ya activará la suscripción en la BD.
        return ResponseEntity.ok().build();
    }

    @GetMapping("/subscription/failure")
    @Operation(summary = "Callback back_url — suscripción rechazada")
    public ResponseEntity<Void> subscriptionFailure(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String payment_id,
            @RequestParam(required = false) String external_reference) {
        log.warn("Callback suscripción FAILURE — paymentId={}, ref={}", payment_id, external_reference);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/subscription/pending")
    @Operation(summary = "Callback back_url — suscripción pendiente")
    public ResponseEntity<Void> subscriptionPending(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String payment_id,
            @RequestParam(required = false) String external_reference) {
        log.info("Callback suscripción PENDING — paymentId={}, ref={}", payment_id, external_reference);
        return ResponseEntity.ok().build();
    }
}
