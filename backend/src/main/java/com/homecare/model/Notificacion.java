package com.homecare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Notificacion - Push notifications y correos
 */
@Entity
@Table(name = "notificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Contenido
    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false, length = 50)
    private String tipo;

    // Referencias
    @Column(name = "solicitud_id")
    private Long solicitudId;

    @Column(name = "oferta_id")
    private Long ofertaId;

    @Column(name = "servicio_id")
    private Long servicioId;

    // Estado
    @Builder.Default
    private Boolean leida = false;

    @Column(name = "leida_at")
    private LocalDateTime leidaAt;

    @Builder.Default
    private Boolean enviada = false;

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Métodos de utilidad
    public void marcarComoLeida() {
        this.leida = true;
        this.leidaAt = LocalDateTime.now();
    }

    public void marcarComoEnviada() {
        this.enviada = true;
    }
}
