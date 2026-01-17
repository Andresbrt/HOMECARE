package com.homecare.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promociones")
@Data
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String codigo;

    private String descripcion;

    @Column(precision = 5, scale = 2)
    private BigDecimal descuentoPorcentaje;

    @Column(precision = 10, scale = 2)
    private BigDecimal descuentoFijo;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    @Column(nullable = false)
    private LocalDate fechaFin;

    @Column(nullable = false)
    private Integer usoMaximo;

    @Column(nullable = false)
    private Integer usoActual = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AplicaA aplicaA;

    @Column(nullable = false)
    private Boolean activa = true;

    @Column(precision = 10, scale = 2)
    private BigDecimal montoMinimo; // Monto mínimo para aplicar la promoción

    @Column(nullable = false)
    private Boolean primerosUsuarios = false; // Solo para nuevos usuarios

    public enum AplicaA {
        CUSTOMER,
        SERVICE_PROVIDER,
        ALL,
        SERVICIOS,
        SUSCRIPCIONES
    }
}
