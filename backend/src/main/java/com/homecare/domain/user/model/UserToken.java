package com.homecare.domain.user.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.net.InetAddress;
import java.time.LocalDateTime;

/**
 * Entidad UserToken - Para verificación de email y recuperación de contraseña
 */
@Entity
@Table(name = "user_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 50)
    private UserTokenType tokenType;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column
    private LocalDateTime usedAt;

    @Builder.Default
    private Boolean used = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_ip")
    private String createdIp;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
