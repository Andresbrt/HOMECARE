package com.homecare.dto;

import com.homecare.model.Promotion.AplicaA;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTOs para el sistema de promociones y descuentos
 */
public class PromotionDTO {

    /**
     * DTO para crear una nueva promoción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotBlank(message = "El código es obligatorio")
        private String codigo;
        
        @NotBlank(message = "La descripción es obligatoria")
        private String descripcion;
        
        @PositiveOrZero(message = "El descuento en porcentaje debe ser positivo o cero")
        private BigDecimal descuentoPorcentaje;
        
        @PositiveOrZero(message = "El descuento fijo debe ser positivo o cero")
        private BigDecimal descuentoFijo;
        
        @NotNull(message = "La fecha de inicio es obligatoria")
        private LocalDate fechaInicio;
        
        @NotNull(message = "La fecha de fin es obligatoria")
        private LocalDate fechaFin;
        
        @Positive(message = "El uso máximo debe ser positivo")
        private Integer usoMaximo;
        
        @NotNull(message = "Debe especificar a qué se aplica la promoción")
        private AplicaA aplicaA;
        
        private BigDecimal montoMinimo; // Monto mínimo para aplicar la promoción
        private Boolean primerosUsuarios; // Solo para nuevos usuarios
    }

    /**
     * DTO para respuesta de promoción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String codigo;
        private String descripcion;
        private BigDecimal descuentoPorcentaje;
        private BigDecimal descuentoFijo;
        private LocalDate fechaInicio;
        private LocalDate fechaFin;
        private Integer usoMaximo;
        private Integer usoActual;
        private AplicaA aplicaA;
        private Boolean activa;
        private BigDecimal montoMinimo;
        private Boolean primerosUsuarios;
        private Boolean esValida; // Si es válida para el usuario actual
        private BigDecimal descuentoCalculado; // Descuento calculado para el monto actual
        
        // Constructor para compatibilidad con el servicio
        public Response(Long id, String codigo, String descripcion, 
                       BigDecimal descuentoPorcentaje, BigDecimal descuentoFijo,
                       LocalDate fechaInicio, LocalDate fechaFin,
                       Integer usoMaximo, Integer usoActual, AplicaA aplicaA, Boolean activa) {
            this.id = id;
            this.codigo = codigo;
            this.descripcion = descripcion;
            this.descuentoPorcentaje = descuentoPorcentaje;
            this.descuentoFijo = descuentoFijo;
            this.fechaInicio = fechaInicio;
            this.fechaFin = fechaFin;
            this.usoMaximo = usoMaximo;
            this.usoActual = usoActual;
            this.aplicaA = aplicaA;
            this.activa = activa;
        }
    }

    /**
     * DTO para validar una promoción
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Validar {
        @NotBlank(message = "El código de promoción es obligatorio")
        private String codigo;
        
        @NotNull(message = "El monto es obligatorio")
        @Positive(message = "El monto debe ser positivo")
        private BigDecimal monto;
        
        private AplicaA tipoServicio; // Para validar que la promoción aplique
    }

    /**
     * DTO para aplicar un descuento
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AplicarDescuento {
        private Long promocionId;
        private BigDecimal montoOriginal;
        private BigDecimal montoFinal;
        private BigDecimal descuentoAplicado;
        private String codigoUsado;
        private Boolean exito;
        private String mensaje;
    }
}
