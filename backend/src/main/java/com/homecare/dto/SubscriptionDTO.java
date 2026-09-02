package com.homecare.dto;

import com.homecare.domain.payment.model.Subscription.Estado;
import com.homecare.domain.payment.model.Subscription.PlanType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTOs para el sistema de suscripciones
 */
public class SubscriptionDTO {

    /**
     * DTO para crear una nueva suscripción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotNull(message = "El plan es obligatorio")
        private PlanType plan;
        
        private String metodoPagoId; // ID del método de pago en Wompi
        
        @Builder.Default
        private Boolean autoRenovar = true;
    }

    /**
     * DTO para respuesta de suscripción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private PlanType plan;
        private BigDecimal precioMensual;
        private LocalDate fechaInicio;
        private LocalDate fechaFin;
        private Estado estado;
        private Boolean autoRenovar;
        private Integer diasRestantes;
        private List<String> beneficios;
        
        // Constructor para compatibilidad con el servicio
        public Response(Long id, PlanType plan, BigDecimal precioMensual, 
                       LocalDate fechaInicio, LocalDate fechaFin, Estado estado, Boolean autoRenovar) {
            this.id = id;
            this.plan = plan;
            this.precioMensual = precioMensual;
            this.fechaInicio = fechaInicio;
            this.fechaFin = fechaFin;
            this.estado = estado;
            this.autoRenovar = autoRenovar;
        }
    }

    /**
     * DTO para información de planes disponibles
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanInfo {
        private PlanType plan;
        private BigDecimal precio;
        private List<String> beneficios;
        private String descripcion;
        private Boolean popular;
        
        // Constructor para compatibilidad con el servicio
        public PlanInfo(PlanType plan, BigDecimal precio, List<String> beneficios) {
            this.plan = plan;
            this.precio = precio;
            this.beneficios = beneficios;
        }
    }

    /**
     * DTO para actualizar una suscripción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Actualizar {
        private Boolean autoRenovar;
        private String nuevoMetodoPagoId;
    }

    /**
     * DTO de solicitud para iniciar checkout de suscripción con Mercado Pago.
     * El campo 'plan' acepta los IDs del frontend: "premium" | "pro"
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutRequest {
        @NotNull(message = "El plan es obligatorio")
        private String plan; // "premium" | "pro"
    }

    /**
     * DTO de respuesta con la URL de Checkout Pro de Mercado Pago.
     * El frontend abre 'initPoint' en un WebView.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutResponse {
        /** URL de Checkout Pro para abrir en el WebView del cliente */
        private String initPoint;
        /** ID de la preferencia creada en Mercado Pago */
        private String preferenceId;
        /** Referencia externa usada para correlacionar el pago */
        private String externalReference;
        /** Plan solicitado (para display en el cliente) */
        private String plan;
        /** Monto del plan */
        private BigDecimal monto;
        /** Moneda (ej: COP) */
        private String moneda;
    }
}
