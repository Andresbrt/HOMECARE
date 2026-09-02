package com.homecare.domain.service.model;

import com.homecare.domain.user.model.Usuario;
import com.homecare.model.ServicioAceptado;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "disputas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Disputa {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iniciado_por", nullable = false)
    private Usuario iniciadoPor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoDisputa estado = EstadoDisputa.ABIERTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private ResultadoDisputa resultado = ResultadoDisputa.SIN_RESOLUCION;

    @Column(nullable = false, length = 150)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(columnDefinition = "TEXT")
    private String resolucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Usuario adminResponsable;

    @Column(name = "comentario_resolucion", columnDefinition = "TEXT")
    private String comentarioResolucion;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EstadoDisputa {
        ABIERTA,
        EN_REVISION,
        RESUELTA,
        CERRADA
    }

    public enum ResultadoDisputa {
        SIN_RESOLUCION,
        A_FAVOR_CLIENTE,
        A_FAVOR_PROVEEDOR,
        REEMBOLSO
    }
}
