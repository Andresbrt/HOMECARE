package com.homecare.domain.offer.model;

import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad Oferta - Enviada por el PROVEEDOR
 * MODELO inDriver CRÃTICO: El proveedor define SU precio
 * Las ofertas son privadas entre proveedor y cliente
 */
@Entity
@Table(name = "ofertas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Oferta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    // Oferta del proveedor (CRÃTICO: el proveedor define el precio)
    @Column(name = "precio_ofrecido", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioOfrecido;

    @Column(name = "mensaje_oferta", columnDefinition = "TEXT")
    private String mensajeOferta;

    // Detalles adicionales
    @Column(name = "tiempo_llegada_minutos")
    private Integer tiempoLlegadaMinutos;

    @Column(name = "materiales_incluidos")
    @Builder.Default
    private Boolean materialesIncluidos = false;

    // Estado
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoOferta estado = EstadoOferta.PENDIENTE;

    // Tracking
    @Column(name = "vista_por_cliente")
    @Builder.Default
    private Boolean vistaPorCliente = false;

    @Column(name = "aceptada_at")
    private LocalDateTime aceptadaAt;

    // AuditorÃ­a
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enum interno
    public enum EstadoOferta {
        PENDIENTE,   // Esperando decisiÃ³n del cliente
        ACEPTADA,    // Cliente aceptÃ³ esta oferta
        RECHAZADA,   // Cliente rechazÃ³ esta oferta
        RETIRADA     // Proveedor retirÃ³ su oferta
    }

    // MÃ©todos de utilidad
    public boolean esPendiente() {
        return estado == EstadoOferta.PENDIENTE;
    }

    public boolean fueAceptada() {
        return estado == EstadoOferta.ACEPTADA;
    }

    public void marcarComoVista() {
        this.vistaPorCliente = true;
    }

    public void aceptar() {
        this.estado = EstadoOferta.ACEPTADA;
    }

    public void rechazar() {
        this.estado = EstadoOferta.RECHAZADA;
    }

    public void retirar() {
        this.estado = EstadoOferta.RETIRADA;
    }

    // MÃ©todos alias para compatibilidad
    public void setTiempoEstimadoHoras(Integer horas) {
        this.tiempoLlegadaMinutos = horas != null ? horas * 60 : null;
    }

    public Integer getTiempoEstimadoHoras() {
        return tiempoLlegadaMinutos != null ? tiempoLlegadaMinutos / 60 : null;
    }
}

