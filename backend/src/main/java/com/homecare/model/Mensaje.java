package com.homecare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Mensaje - Chat en tiempo real
 * Negociación directa entre cliente y proveedor
 */
@Entity
@Table(name = "mensajes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitente_id", nullable = false)
    private Usuario remitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;

    // Contenido
    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private TipoMensaje tipo = TipoMensaje.TEXTO;

    @Column(name = "archivo_url", length = 500)
    private String archivoUrl;

    // Estado
    @Builder.Default
    private Boolean leido = false;

    @Column(name = "leido_at")
    private LocalDateTime leidoAt;

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Enum interno
    public enum TipoMensaje {
        TEXTO,
        IMAGEN,
        ARCHIVO
    }

    // Métodos de utilidad
    public void marcarComoLeido() {
        this.leido = true;
        this.leidoAt = LocalDateTime.now();
    }

    public boolean esDeTexto() {
        return tipo == TipoMensaje.TEXTO;
    }
}
