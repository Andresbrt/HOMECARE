package com.homecare.domain.service.model;

import com.homecare.domain.user.model.Usuario;
import com.homecare.model.ServicioAceptado;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evidencias_servicio")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenciaServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_id", nullable = false)
    private ServicioAceptado servicio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEvidencia tipo;

    @Column(name = "url_archivo", nullable = false, length = 1000)
    private String urlArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subido_por", nullable = false)
    private Usuario subidoPor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    public enum TipoEvidencia {
        ANTES,
        DURANTE,
        DESPUES
    }
}
