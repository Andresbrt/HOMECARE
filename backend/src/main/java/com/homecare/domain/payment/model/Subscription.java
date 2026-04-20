package com.homecare.domain.payment.model;

import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "suscripciones")
@Data
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanType plan;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioMensual;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Estado estado;

    @Column(nullable = false)
    private Boolean autoRenovar = true;

    @Column
    private String metodoPagoId;
    
    @Column(name = "transaction_id")
    private String transactionId; // ID de transacciÃ³n para pagos

    public enum PlanType {
        // Precio en COP + IVA 19% - Colombia
        // $30.000 COP base + $5.700 IVA (19%) = $35.700 COP/mes
        PREMIUM   // Unico plan: descuentos + prioridad alta en asignacion de profesionales
    }

    public enum Estado {
        ACTIVA,
        CANCELADA,
        VENCIDA,
        PENDIENTE_PAGO,
        FALLIDA
    }
}

