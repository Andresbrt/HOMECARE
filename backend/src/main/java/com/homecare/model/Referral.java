package com.homecare.model;

import com.homecare.domain.user.model.Usuario;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad para el sistema de referidos
 */
@Entity
@Table(name = "referidos")
@Data
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id", nullable = false)
    private Usuario referrer; // Usuario que refiere

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_id")
    private Usuario referee; // Usuario referido (cambié el nombre para compatibilidad)

    @Column(unique = true, nullable = false, length = 10)
    private String codigo;

    @Column(nullable = false)
    private Integer usos = 0; // Cuántas veces se ha usado el código

    @Column(nullable = false)
    private Integer maxUsos = 10; // Máximo de usos permitidos

    @Column(nullable = false)
    private Boolean activo = true;
    
    @Column(nullable = false)
    private Boolean usado = false; // Si ya fue usado por alguien

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_ultimo_uso")
    private LocalDateTime fechaUltimoUso;

    @Column(name = "bonus_ganado", nullable = false)
    private Integer bonusGanado = 0; // Puntos o beneficio ganado por referir
    
    @Column(name = "bonus_referrer", precision = 10, scale = 2)
    private BigDecimal bonusReferrer; // Bonus para quien refiere
    
    @Column(name = "bonus_referee", precision = 10, scale = 2)
    private BigDecimal bonusReferee; // Bonus para quien es referido

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
    }

    // Métodos de compatibilidad
    public Usuario getReferred() {
        return this.referee;
    }

    public void setReferred(Usuario referee) {
        this.referee = referee;
    }

    public Boolean getUsado() {
        return this.usado;
    }

    public void setUsado(Boolean usado) {
        this.usado = usado;
    }
}
