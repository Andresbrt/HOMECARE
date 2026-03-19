package com.homecare.domain.payment.controller;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
@Tag(name = "Payments", description = "GestiÃ³n de pagos con Wompi")
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
    @Operation(summary = "Webhook de Wompi para actualizaciÃ³n de estado de pagos")
    public ResponseEntity<String> wompiWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Event-Checksum", required = false) String checksum,
            @RequestHeader(value = "X-Event-Timestamp", required = false) String timestamp) {

        if (checksum == null || timestamp == null) {
            log.warn("Webhook Wompi recibido sin checksum o timestamp");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature headers");
        }

        if (!paymentService.validarWebhookSignature(rawBody, checksum, timestamp)) {
            log.warn("Webhook Wompi con firma invÃ¡lida");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            PagoDTO.WompiWebhookEvent webhook = objectMapper.readValue(rawBody, PagoDTO.WompiWebhookEvent.class);
            paymentService.procesarWebhookWompi(webhook);
            return ResponseEntity.ok("Webhook procesado");
        } catch (Exception e) {
            log.error("Error procesando webhook Wompi: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error procesando evento");
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
    @Operation(summary = "Obtener estadÃ­sticas de pagos")
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
        return ResponseEntity.ok("VerificaciÃ³n de pagos pendientes iniciada");
    }
}

