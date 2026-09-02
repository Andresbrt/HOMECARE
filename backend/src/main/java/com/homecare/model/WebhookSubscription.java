package com.homecare.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad para gestión de webhooks
 */
@Entity
@Table(name = "webhook_subscriptions")
@Data
public class WebhookSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String url;

    @ElementCollection
    @CollectionTable(name = "webhook_eventos", joinColumns = @JoinColumn(name = "webhook_id"))
    @Column(name = "evento")
    private List<String> eventos;

    @Column(nullable = false, length = 255)
    private String secretKey;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(length = 1000)
    private String descripcion;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "ultimo_envio")
    private LocalDateTime ultimoEnvio;

    @Column(name = "ultimo_error")
    private LocalDateTime ultimoError;

    @Column(name = "total_envios", nullable = false)
    private Integer totalEnvios = 0;

    @Column(name = "envios_exitosos", nullable = false)
    private Integer enviosExitosos = 0;

    @Column(name = "envios_fallidos", nullable = false)
    private Integer enviosFallidos = 0;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }
}
