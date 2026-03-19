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
        BASICO,    // Gratis
        PRO,       // $19.99/mes - Solicitudes ilimitadas, prioridad en listado
        ENTERPRISE // $49.99/mes - Todo PRO + analytics avanzado + soporte 24/7
    }

    public enum Estado {
        ACTIVA,
        CANCELADA,
        VENCIDA,
        PENDIENTE_PAGO,
        FALLIDA
    }
}

