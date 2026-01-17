package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTOs para Ofertas
 * MODELO inDriver: El proveedor define SU precio
 */
public class OfertaDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Crear {
        @NotNull(message = "El ID de la solicitud es obligatorio")
        private Long solicitudId;

        @NotNull(message = "El precio ofrecido es obligatorio")
        @DecimalMin(value = "1.00", message = "El precio debe ser al menos 1.00")
        private BigDecimal precioOfrecido;

        @Size(max = 500, message = "El mensaje no puede exceder 500 caracteres")
        private String mensajeOferta;

        @Min(value = 0, message = "El tiempo de llegada no puede ser negativo")
        private Integer tiempoLlegadaMinutos;

        private Boolean materialesIncluidos;

        // Método alias para compatibilidad
        public Integer getTiempoEstimadoHoras() {
            return tiempoLlegadaMinutos != null ? tiempoLlegadaMinutos / 60 : null;
        }

        public void setTiempoEstimadoHoras(Integer horas) {
            this.tiempoLlegadaMinutos = horas != null ? horas * 60 : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private String proveedorFoto;
        private BigDecimal proveedorCalificacion;
        private Integer proveedorServiciosCompletados;
        private BigDecimal precioOfrecido;
        private String mensajeOferta;
        private Integer tiempoLlegadaMinutos;
        private Boolean materialesIncluidos;
        private String estado;
        private Boolean vistaPorCliente;
        private String createdAt;
        private Double distanciaKm; // Distancia del proveedor al servicio
    }

    // Alias para compatibilidad con servicios
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private String proveedorFoto;
        private BigDecimal proveedorCalificacion;
        private Integer proveedorServiciosCompletados;
        private BigDecimal precioOfrecido;
        private String mensajeOferta;
        private Integer tiempoLlegadaMinutos;
        private Boolean materialesIncluidos;
        private String estado;
        private Boolean vistaPorCliente;
        private String createdAt;
        private Double distanciaKm;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Actualizar {
        @NotNull(message = "El precio ofrecido es obligatorio")
        @DecimalMin(value = "1.00", message = "El precio debe ser al menos 1.00")
        private BigDecimal precioOfrecido;

        @Size(max = 500, message = "El mensaje no puede exceder 500 caracteres")
        private String mensajeOferta;

        @Min(value = 0, message = "El tiempo de llegada no puede ser negativo")
        private Integer tiempoLlegadaMinutos;

        private Boolean materialesIncluidos;

        // Alias para compatibilidad
        public Integer getTiempoEstimadoHoras() {
            return tiempoLlegadaMinutos != null ? tiempoLlegadaMinutos / 60 : null;
        }

        public void setTiempoEstimadoHoras(Integer horas) {
            this.tiempoLlegadaMinutos = horas != null ? horas * 60 : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AceptarResponse {
        private Long ofertaId;
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private BigDecimal precioFinal;
        private String mensaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Aceptar {
        @NotNull(message = "El ID de la oferta es obligatorio")
        private Long ofertaId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Retirar {
        @NotNull(message = "El ID de la oferta es obligatorio")
        private Long ofertaId;

        private String motivo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Estadisticas {
        private Long totalOfertas;
        private Long ofertasAceptadas;
        private Long ofertasRechazadas;
        private Long ofertasPendientes;
        private BigDecimal precioPromedio;
        private BigDecimal tasaAceptacion; // Porcentaje
    }
}
