package com.homecare.domain.payment.model;

import com.homecare.model.ServicioAceptado;
import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad Pago - IntegraciÃ³n con Wompi
 */
@Entity
@Table(name = "pagos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_id", nullable = false)
    private ServicioAceptado servicio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    // Montos
    @Column(name = "monto_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "comision_plataforma", nullable = false, precision = 10, scale = 2)
    private BigDecimal comisionPlataforma;

    @Column(name = "monto_proveedor", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoProveedor;

    // Wompi
    @Column(name = "transaccion_id", unique = true)
    private String transaccionId;

    @Column(unique = true)
    private String referencia;

    @Column(name = "payment_link", length = 1000)
    private String paymentLink;

    @Column(name = "transaccion_externa_id", length = 100)
    private String transaccionExternaId;

    @Column(name = "preferencia_id", length = 100)
    private String preferenciaId;

    @Column(name = "metodo_pago_detalle", length = 100)
    private String metodoPagoDetalle;

    @Column(name = "mensaje_error", columnDefinition = "TEXT")
    private String mensajeError;

    @Column(name = "reembolsado_at")
    private LocalDateTime reembolsadoAt;

    // Estado
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoPago estado = EstadoPago.PENDIENTE;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    // Detalles
    @Column(name = "aprobado_at")
    private LocalDateTime aprobadoAt;

    @Column(name = "rechazado_at")
    private LocalDateTime rechazadoAt;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    // AuditorÃ­a
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enum interno
    public enum EstadoPago {
        PENDIENTE,
        PROCESANDO,
        APROBADO,
        RECHAZADO,
        REEMBOLSADO,
        FALLIDO,
        EXPIRADO
    }

    public enum MetodoPago {
        PSE,
        TARJETA_CREDITO,
        TARJETA_DEBITO,
        NEQUI,
        CARD // Agregado para MP Bricks
    }

    // Metodos de utilidad
    public BigDecimal getMonto() {
        return this.montoTotal;
    }

    public void setMonto(BigDecimal monto) {
        this.montoTotal = monto;
    }

    public void aprobar() {
        this.estado = EstadoPago.APROBADO;
        this.aprobadoAt = LocalDateTime.now();
    }

    public void rechazar(String motivo) {
        this.estado = EstadoPago.RECHAZADO;
        this.rechazadoAt = LocalDateTime.now();
        this.motivoRechazo = motivo;
    }

    public void reembolsar() {
        this.estado = EstadoPago.REEMBOLSADO;
    }

    public boolean estaAprobado() {
        return estado == EstadoPago.APROBADO;
    }
}

