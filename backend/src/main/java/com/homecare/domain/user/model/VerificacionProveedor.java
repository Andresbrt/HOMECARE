package com.homecare.domain.user.model;

import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "verificaciones_proveedor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificacionProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    @Column(name = "tipo_documento", length = 100, nullable = false)
    private String tipoDocumento;

    @Column(name = "numero_documento", length = 100, nullable = false)
    private String numeroDocumento;

    @Column(name = "url_documento_frontal", length = 1000)
    private String urlDocumentoFrontal;

    @Column(name = "url_documento_trasero", length = 1000)
    private String urlDocumentoTrasero;

    @Column(name = "url_selfie_verificacion", length = 1000)
    private String urlSelfieVerificacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoVerificacion estado = EstadoVerificacion.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisado_por")
    private Usuario revisadoPor;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public enum EstadoVerificacion {
        PENDIENTE,
        APROBADO,
        RECHAZADO
    }
}
