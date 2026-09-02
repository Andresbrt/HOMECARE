package com.homecare.domain.service.model;

import com.homecare.domain.user.model.Usuario;
import com.homecare.model.ServicioAceptado;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conformidades_cliente")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConformidadCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_id", nullable = false)
    private ServicioAceptado servicio;

    @Column(nullable = false)
    private Boolean aceptado;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ip_origen", length = 100)
    private String ipOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;
}
