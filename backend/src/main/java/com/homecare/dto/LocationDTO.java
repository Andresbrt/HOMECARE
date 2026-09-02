package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class LocationDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateLocation {
        @NotNull(message = "Latitud es requerida")
        @DecimalMin(value = "-90.0", message = "Latitud inválida")
        @DecimalMax(value = "90.0", message = "Latitud inválida")
        private BigDecimal latitud;

        @NotNull(message = "Longitud es requerida")
        @DecimalMin(value = "-180.0", message = "Longitud inválida")
        @DecimalMax(value = "180.0", message = "Longitud inválida")
        private BigDecimal longitud;

        private Double precisionMetros;
        private Double velocidadKmh;
        private Double direccion;
        private Double altitud;
        private Integer bateriaPorcentaje;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @lombok.EqualsAndHashCode(callSuper=false)
    public static class TrackingUpdate extends UpdateLocation {
        @NotNull(message = "Servicio ID es requerido")
        private Long servicioId;
        
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationResponse {
        private Long id;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private Double precisionMetros;
        private LocalDateTime timestamp;
        private Double distanciaDestinoKm;
        private Integer tiempoEstimadoMinutos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingResponse {
        private Long servicioId;
        private Long proveedorId;
        private String proveedorNombre;
        private LocationResponse ubicacionActual;
        private LocationResponse ubicacionDestino;
        private List<LocationPoint> ruta;
        private String estadoServicio;
        private LocalDateTime ultimaActualizacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationPoint {
        private BigDecimal latitud;
        private BigDecimal longitud;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NearbyProviders {
        private List<ProviderLocation> proveedores;
        private int total;
        private Double radioKm;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderLocation {
        private Long id;
        private String nombre;
        private String fotoPerfil;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private Double distanciaKm;
        private Double calificacion;
        private Boolean disponible;
        private LocalDateTime ultimaUbicacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistanceCalculation {
        private BigDecimal origenLat;
        private BigDecimal origenLng;
        private BigDecimal destinoLat;
        private BigDecimal destinoLng;
        private Double distanciaKm;
        private Integer tiempoEstimadoMinutos;
    }
}
