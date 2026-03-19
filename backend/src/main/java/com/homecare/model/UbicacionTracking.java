package com.homecare.model;

import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ubicaciones_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UbicacionTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_id", nullable = false)
    private ServicioAceptado servicio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Usuario proveedor;

    @Column(name = "latitud", precision = 10, scale = 8, nullable = false)
    private BigDecimal latitud;

    @Column(name = "longitud", precision = 11, scale = 8, nullable = false)
    private BigDecimal longitud;

    @Column(name = "precision_metros")
    private Double precisionMetros;

    @Column(name = "velocidad_kmh")
    private Double velocidadKmh;

    @Column(name = "direccion")
    private Double direccion; // Grados (0-360)

    @Column(name = "altitud")
    private Double altitud;

    @Column(name = "bateria_porcentaje")
    private Integer bateriaPorcentaje;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
