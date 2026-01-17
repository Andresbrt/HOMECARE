package com.homecare.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad Solicitud - Publicada por el CLIENTE
 * Modelo inDriver: El cliente publica y espera ofertas de proveedores
 */
@Entity
@Table(name = "solicitudes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    // Detalles del servicio
    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_limpieza", nullable = false, length = 50)
    private TipoLimpieza tipoLimpieza;

    // Ubicación
    @Column(nullable = false, columnDefinition = "TEXT")
    private String direccion;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(name = "referencia_direccion", columnDefinition = "TEXT")
    private String referenciaDireccion;

    // Detalles del lugar
    @Column(name = "metros_cuadrados", precision = 8, scale = 2)
    private BigDecimal metrosCuadrados;

    @Column(name = "cantidad_habitaciones")
    private Integer cantidadHabitaciones;

    @Column(name = "cantidad_banos")
    private Integer cantidadBanos;

    @Column(name = "tiene_mascotas")
    @Builder.Default
    private Boolean tieneMascotas = false;

    // Precio y timing
    @Column(name = "precio_maximo", precision = 10, scale = 2)
    private BigDecimal precioMaximo; // Opcional

    @Column(name = "fecha_servicio", nullable = false)
    private LocalDate fechaServicio;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "duracion_estimada")
    private Integer duracionEstimada; // minutos

    @Column(name = "instrucciones_especiales", columnDefinition = "TEXT")
    private String instruccionesEspeciales;

    // Estado del sistema inDriver
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.ABIERTA;

    // Tracking
    @Column(name = "cantidad_ofertas")
    @Builder.Default
    private Integer cantidadOfertas = 0;

    @Column(name = "oferta_aceptada_id")
    private Long ofertaAceptadaId;

    // Relaciones
    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private Set<Oferta> ofertas = new HashSet<>();

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private Set<Mensaje> mensajes = new HashSet<>();

    // Auditoría
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "expira_en")
    private LocalDateTime expiraEn;

    // Enums internos
    public enum TipoLimpieza {
        BASICA,
        PROFUNDA,
        OFICINA,
        POST_CONSTRUCCION,
        MUDANZA,
        DESINFECCION
    }

    public enum EstadoSolicitud {
        ABIERTA,           // Recibiendo ofertas
        EN_NEGOCIACION,    // Cliente negociando con proveedores
        ACEPTADA,          // Oferta aceptada, servicio confirmado
        EN_PROGRESO,       // Servicio ejecutándose
        COMPLETADA,        // Servicio completado
        CANCELADA,         // Solicitud cancelada
        EXPIRADA           // No se recibieron ofertas a tiempo
    }

    // Métodos de utilidad
    public boolean puedeRecibirOfertas() {
        return estado == EstadoSolicitud.ABIERTA || estado == EstadoSolicitud.EN_NEGOCIACION;
    }

    public boolean estaVigente() {
        return expiraEn == null || LocalDateTime.now().isBefore(expiraEn);
    }

    public void incrementarContadorOfertas() {
        this.cantidadOfertas++;
    }

    // Métodos alias para compatibilidad con service
    public LocalTime getHoraInicioEstimada() {
        return horaInicio;
    }

    public void setHoraInicioEstimada(LocalTime hora) {
        this.horaInicio = hora;
    }

    public Integer getDuracionEstimadaHoras() {
        return duracionEstimada != null ? duracionEstimada / 60 : null;
    }

    public void setDuracionEstimadaHoras(Integer horas) {
        this.duracionEstimada = horas != null ? horas * 60 : null;
    }
}
