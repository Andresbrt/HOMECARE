package com.homecare.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispositivos_fcm")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DispositivoFCM {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "token_fcm", nullable = false, unique = true, length = 500)
    private String tokenFcm;

    @Enumerated(EnumType.STRING)
    @Column(name = "plataforma")
    private Plataforma plataforma;

    @Column(name = "modelo_dispositivo")
    private String modeloDispositivo;

    @Column(name = "version_app")
    private String versionApp;

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "ultimo_uso")
    private LocalDateTime ultimoUso;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        ultimoUso = LocalDateTime.now();
    }

    public enum Plataforma {
        ANDROID,
        IOS,
        WEB
    }
}
