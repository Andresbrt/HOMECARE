package com.homecare.dto;

import com.homecare.domain.payment.model.Pago.EstadoPago;
import com.homecare.domain.payment.model.Pago.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PagoDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrearPago {
        @NotNull(message = "Servicio ID es requerido")
        private Long servicioId;

        @NotNull(message = "Monto es requerido")
        @DecimalMin(value = "0.01", message = "Monto debe ser mayor a 0")
        private BigDecimal monto;

        @NotNull(message = "Método de pago es requerido")
        private MetodoPago metodoPago;

        private String cardToken; // Token de tarjeta desde frontend
        private String email;
        private String telefono;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PagoResponse {
        private Long id;
        private Long servicioId;
        private BigDecimal monto;
        private BigDecimal comisionPlataforma;
        private BigDecimal montoProveedor;
        private String metodoPago; // String para compatibilidad
        private EstadoPago estado;
        private String transaccionWompiId;
        private String paymentLink;
        private String referencia;
        private LocalDateTime createdAt;
        private LocalDateTime aprobadoAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WompiWebhookEvent {
        private String event;
        private WompiTransaction data;
        private String signature;
        private LocalDateTime sentAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WompiTransaction {
        private String id;
        private String reference;
        private String status; // APPROVED, DECLINED, VOIDED, ERROR
        private BigDecimal amountInCents;
        private String currency;
        private String paymentMethod;
        private String paymentMethodType;
        private LocalDateTime createdAt;
        private LocalDateTime finalizedAt;
        private WompiCustomerInfo customerInfo;
        private String statusMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WompiCustomerInfo {
        private String fullName;
        private String email;
        private String phoneNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReembolsoRequest {
        @NotNull(message = "Pago ID es requerido")
        private Long pagoId;

        @NotNull(message = "Motivo es requerido")
        private String motivo;

        private BigDecimal montoReembolso; // Null = reembolso completo
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReembolsoResponse {
        private Long pagoId;
        private BigDecimal montoReembolsado;
        private String estado;
        private String transaccionId;
        private LocalDateTime fecha;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EstadisticasPagos {
        private BigDecimal totalRecaudado;
        private BigDecimal comisionesTotales;
        private BigDecimal pagosPendientes;
        private Long totalTransacciones;
        private Long pagosAprobados;
        private Long pagosRechazados;
        private Long pagosReembolsados;
        private Double tasaExito;
    }
}
