package com.homecare.model;

import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "archivos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Archivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "nombre_almacenado", nullable = false, unique = true)
    private String nombreAlmacenado;

    @Column(name = "ruta_s3", nullable = false)
    private String rutaS3;

    @Column(name = "url_publica")
    private String urlPublica;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "tamanio_bytes")
    private Long tamanioBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_archivo")
    private TipoArchivo tipoArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "solicitud_id")
    private Long solicitudId;

    @Column(name = "servicio_id")
    private Long servicioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoArchivo estado = EstadoArchivo.ACTIVO;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TipoArchivo {
        FOTO_PERFIL,
        FOTO_ANTES,
        FOTO_DESPUES,
        DOCUMENTO_IDENTIDAD,
        CERTIFICADO,
        COMPROBANTE_PAGO,
        OTRO
    }

    public enum EstadoArchivo {
        ACTIVO,
        ELIMINADO,
        TEMPORAL
    }
}
