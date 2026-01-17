package com.homecare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Calificacion - Calificación mutua
 * Cliente califica a proveedor y viceversa
 */
@Entity
@Table(name = "calificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_id", nullable = false)
    private ServicioAceptado servicio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calificador_id", nullable = false)
    private Usuario calificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calificado_id", nullable = false)
    private Usuario calificado;

    // Calificación
    @Column(nullable = false)
    private Integer puntuacion; // 1 a 5

    @Column(columnDefinition = "TEXT")
    private String comentario;

    // Tipo
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoCalificacion tipo;

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Enum interno
    public enum TipoCalificacion {
        CLIENTE_A_PROVEEDOR,
        PROVEEDOR_A_CLIENTE
    }

    // Validación
    @PrePersist
    @PreUpdate
    private void validarPuntuacion() {
        if (puntuacion < 1 || puntuacion > 5) {
            throw new IllegalArgumentException("La puntuación debe estar entre 1 y 5");
        }
    }
}
