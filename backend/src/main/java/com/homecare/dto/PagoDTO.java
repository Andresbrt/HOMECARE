package com.homecare.dto;

import com.homecare.domain.payment.model.Pago.EstadoPago;
import com.homecare.domain.payment.model.Pago.EstadoRetencion;import com.homecare.domain.payment.model.Pago.EstadoRetencion;import com.homecare.domain.payment.model.Pago.MetodoPago;
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

        private String cardToken; // Token de Bricks
        private String paymentMethodId; // VISA, MASTERCARD, etc.
        private Integer installments; // Cuotas
        private String issuerId; // Banco emisor
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
        private String metodoPago;
        private EstadoPago estado;
        private EstadoRetencion estadoRetencion;
        private String transaccionExternaId;
        private String preferenceId;
        private String paymentLink;
        private String referencia;
        private LocalDateTime createdAt;
        private LocalDateTime aprobadoAt;
        private LocalDateTime fechaLiberacion;
        private Boolean comisionLiquidada;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MercadoPagoWebhookEvent {
        private Long id;
        private String live_mode;
        private String type; // payment, plan, subscription, etc.
        private String date_created;
        private Long application_id;
        private Long user_id;
        private String version;
        private String api_version;
        private String action; // payment.created, payment.updated
        private MPData data;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MPData {
        private String id;
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

    /**
     * Resumen de la cartera (wallet) del proveedor calculado en el backend.
     * El saldo NUNCA debe calcularse en el frontend.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletResponse {
        /** Monto ya liberado y disponible para retiro */
        private BigDecimal saldoDisponible;
        /** Monto retenido (en custodia hasta que el servicio sea confirmado) */
        private BigDecimal saldoRetenido;
        /** Total histórico ganado (incluyendo liberados + retenidos) */
        private BigDecimal totalGanado;
        /** Total de servicios pagados */
        private Long totalServicios;
        /** Últimas transacciones para mostrar en la UI */
        private java.util.List<PagoResponse> transacciones;
    }

    /**
     * Ítem de comisión pendiente para el Carrito de Pago del profesional.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComisionCarritoItem {
        private Long pagoId;
        private Long servicioId;
        private String clienteNombre;
        private String concepto;
        private BigDecimal montoServicio;
        private BigDecimal porcentajeComision;
        private BigDecimal comision;
        private LocalDateTime fecha;
    }

    /**
     * Respuesta con el carrito de comisiones pendientes que el profesional debe pagar a la plataforma.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComisionesPendientesResponse {
        private BigDecimal totalComisionPendiente;
        private Integer totalServiciosPendientes;
        private java.util.List<ComisionCarritoItem> items;
    }

    /**
     * Respuesta de checkout para liquidar comisiones con Mercado Pago.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutComisionesResponse {
        private String preferenceId;
        private String initPoint;
        private String externalReference;
        private BigDecimal totalAPagar;
        private Integer itemsCount;
    }

    /**
     * Solicitud para recargar saldo a la billetera profesional.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecargaWalletRequest {
        @NotNull(message = "El monto a recargar es requerido")
        @DecimalMin(value = "1000.00", message = "El monto mínimo de recarga es $1.000 COP")
        private BigDecimal monto;
    }

    /**
     * Respuesta de recarga de billetera (preferencia de Mercado Pago).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecargaWalletResponse {
        private String preferenceId;
        private String initPoint;
        private String externalReference;
        private BigDecimal monto;
        private String mensaje;
    }
}
