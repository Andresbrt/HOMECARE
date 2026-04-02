package com.homecare.domain.user.model;

import com.homecare.domain.solicitud.model.Solicitud;
import com.homecare.domain.offer.model.Oferta;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Usuario - Representa tanto Clientes como Proveedores
 */
@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(length = 20)
    private String telefono;

    @Column(name = "foto_perfil", length = 500)
    private String fotoPerfil;

    public String getFotoUrl() {
        return fotoPerfil;
    }

    // Campos especÃ­ficos para Proveedores
    @Column(name = "documento_identidad", length = 50)
    private String documentoIdentidad;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "experiencia_anos")
    private Integer experienciaAnos;

    @Column(name = "servicios_completados")
    @Builder.Default
    private Integer serviciosCompletados = 0;

    @Column(name = "calificacion_promedio", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal calificacionPromedio = BigDecimal.ZERO;

    // GeolocalizaciÃ³n
    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(columnDefinition = "TEXT")
    private String direccion;

    // Tracking de ubicaciÃ³n
    @Column(name = "ultima_ubicacion")
    private LocalDateTime ultimaUbicacion;

    // Loyalty points
    @Column(name = "loyalty_points")
    @Builder.Default
    private Integer loyaltyPoints = 0;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    // Estado
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "verificado")
    @Builder.Default
    private Boolean verificado = false;

    // --- NUEVOS CAMPOS DE SEGURIDAD PARA PROFESIONALES ---
    @Column(name = "foto_selfie_verificacion", length = 500)
    private String fotoSelfieVerificacion;

    @Column(name = "foto_cedula_frontal", length = 500)
    private String fotoCedulaFrontal;

    @Column(name = "foto_cedula_posterior", length = 500)
    private String fotoCedulaPosterior;

    @Column(name = "archivo_antecedentes", length = 500)
    private String archivoAntecedentes;

    @Column(name = "verificacion_ia_score")
    private Double verificacionIAScore;

    @Column(name = "comentarios_verificacion", columnDefinition = "TEXT")
    private String comentariosVerificacion;

    @Column(name = "fecha_verificacion")
    private LocalDateTime fechaVerificacion;

    @Column(name = "intento_verificacion_concluido")
    @Builder.Default
    private Boolean intentoVerificacionConcluido = false;

    @Builder.Default
    private Boolean disponible = true;

    // Relaciones
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "usuario_roles",
        joinColumns = @JoinColumn(name = "usuario_id"),
        inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private Set<Rol> roles = new HashSet<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<Solicitud> solicitudes = new HashSet<>();

    @OneToMany(mappedBy = "proveedor", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<Oferta> ofertas = new HashSet<>();

    // AuditorÃ­a
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // MÃ©todos de utilidad
    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }

    public boolean esProveedor() {
        return roles.stream().anyMatch(rol -> rol.getNombre().equals("SERVICE_PROVIDER"));
    }

    public boolean esCliente() {
        return roles.stream().anyMatch(rol -> rol.getNombre().equals("CUSTOMER"));
    }

    public boolean esAdmin() {
        return roles.stream().anyMatch(rol -> rol.getNombre().equals("ADMIN"));
    }

    // Alias para compatibilidad
    public Integer getTotalServiciosCompletados() {
        return serviciosCompletados != null ? serviciosCompletados : 0;
    }
}

