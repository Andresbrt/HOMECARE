package com.homecare.model;

import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.offer.model.Oferta;
import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad ServicioAceptado - Cuando el cliente acepta una oferta
 * Tracking completo del servicio en ejecución
 */
@Entity
@Table(name = "servicios_aceptados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioAceptado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "solicitud_id", nullable = false, unique = true)
    private Solicitud solicitud;

    @OneToOne
    @JoinColumn(name = "oferta_id", nullable = false, unique = true)
    private Oferta oferta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    // Detalles finales
    @Column(name = "precio_acordado", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioAcordado;

    // Estados del servicio (tracking real)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoServicio estado = EstadoServicio.CONFIRMADO;

    // Timestamps de estados
    @CreationTimestamp
    @Column(name = "confirmado_at", updatable = false)
    private LocalDateTime confirmadoAt;

    @Column(name = "en_camino_at")
    private LocalDateTime enCaminoAt;

    @Column(name = "llegue_at")
    private LocalDateTime llegueAt;

    @Column(name = "iniciado_at")
    private LocalDateTime iniciadoAt;

    @Column(name = "completado_at")
    private LocalDateTime completadoAt;

    @Column(name = "cancelado_at")
    private LocalDateTime canceladoAt;

    @Column(name = "motivo_cancelacion", columnDefinition = "TEXT")
    private String motivoCancelacion;

    // Evidencias
    @ElementCollection
    @CollectionTable(name = "servicio_fotos_antes", joinColumns = @JoinColumn(name = "servicio_id"))
    @Column(name = "foto_url")
    @Builder.Default
    private List<String> fotosAntes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "servicio_fotos_despues", joinColumns = @JoinColumn(name = "servicio_id"))
    @Column(name = "foto_url")
    @Builder.Default
    private List<String> fotosDespues = new ArrayList<>();

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enum interno
    public enum EstadoServicio {
        CONFIRMADO,    // Oferta aceptada, esperando inicio
        EN_CAMINO,     // Proveedor en camino
        LLEGUE,        // Proveedor llegó al lugar
        EN_PROGRESO,   // Servicio ejecutándose
        COMPLETADO,    // Servicio completado exitosamente
        CANCELADO      // Servicio cancelado
    }

    // Métodos de utilidad
    public void marcarEnCamino() {
        this.estado = EstadoServicio.EN_CAMINO;
        this.enCaminoAt = LocalDateTime.now();
    }

    public void marcarLlegada() {
        this.estado = EstadoServicio.LLEGUE;
        this.llegueAt = LocalDateTime.now();
    }

    public void marcarIniciado() {
        this.estado = EstadoServicio.EN_PROGRESO;
        this.iniciadoAt = LocalDateTime.now();
    }

    public void marcarCompletado() {
        this.estado = EstadoServicio.COMPLETADO;
        this.completadoAt = LocalDateTime.now();
    }

    public void cancelar(String motivo) {
        this.estado = EstadoServicio.CANCELADO;
        this.canceladoAt = LocalDateTime.now();
        this.motivoCancelacion = motivo;
    }

    public boolean estaCompletado() {
        return estado == EstadoServicio.COMPLETADO;
    }

    public boolean estaCancelado() {
        return estado == EstadoServicio.CANCELADO;
    }
}
