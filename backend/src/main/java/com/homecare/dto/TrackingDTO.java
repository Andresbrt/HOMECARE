package com.homecare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTOs para el sistema de tracking en tiempo real
 */
public class TrackingDTO {

    /**
     * DTO para actualizaciones de ubicación del proveedor
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UbicacionUpdate {
        @NotNull(message = "La latitud es obligatoria")
        @DecimalMin(value = "-90.0", message = "Latitud inválida")
        @DecimalMax(value = "90.0", message = "Latitud inválida")
        private BigDecimal latitud;

        @NotNull(message = "La longitud es obligatoria")
        @DecimalMin(value = "-180.0", message = "Longitud inválida")
        @DecimalMax(value = "180.0", message = "Longitud inválida")
        private BigDecimal longitud;

        private BigDecimal precision; // Precisión del GPS en metros
        private BigDecimal velocidad; // Velocidad en km/h
        private BigDecimal direccion; // Dirección en grados (0-360)
        private String estado; // EN_RUTA, DETENIDO, EN_DESTINO
        private LocalDateTime timestamp;
        private Long proveedorId;
    }

    /**
     * DTO para respuesta de ubicación procesada
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UbicacionResponse {
        private Long solicitudId;
        private Long proveedorId;
        private Long clienteId;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String estado;
        private BigDecimal distanciaDestino; // En metros
        private Integer tiempoEstimado; // ETA en minutos
        private LocalDateTime timestamp;
        private String mensaje; // Mensaje opcional para el cliente
    }

    /**
     * DTO para mensajes de chat en tiempo real
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        private Long emisorId;
        private Long receptorId;
        private String mensaje;
        private String tipo; // TEXT, IMAGE, LOCATION
        private LocalDateTime timestamp;
        private String emisorNombre;
        private Boolean leido;
        
        // Para mensajes tipo ubicación
        private BigDecimal latitud;
        private BigDecimal longitud;
        
        // Para mensajes tipo imagen
        private String imageUrl;
        private String imageThumbnail;
    }

    /**
     * DTO para actualizaciones de estado del servicio
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EstadoUpdate {
        private String nuevoEstado; // INICIADO, EN_PROGRESO, COMPLETADO, CANCELADO
        private String observaciones;
        private LocalDateTime timestamp;
        private Long proveedorId;
        private BigDecimal latitud; // Ubicación donde se realiza el cambio
        private BigDecimal longitud;
    }

    /**
     * DTO para respuesta de estado del servicio
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServicioStatus {
        private Long servicioId;
        private Long solicitudId;
        private Long clienteId;
        private Long proveedorId;
        private String estado;
        private String observaciones;
        private LocalDateTime timestamp;
        private String clienteNombre;
        private String proveedorNombre;
        private Boolean requiereAccion; // Si el cliente necesita tomar alguna acción
    }

    /**
     * DTO para configuración de tracking
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingConfig {
        private Integer intervaloActualizacion; // En segundos
        private BigDecimal umbralDistancia; // Distancia mínima para registrar punto (metros)
        private Boolean trackingActivo;
        private Boolean notificacionesActivas;
        private String metodoCalculoETA; // google, haversine
    }

    /**
     * DTO para historial de tracking
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistorialTracking {
        private Long solicitudId;
        private LocalDateTime fechaInicio;
        private LocalDateTime fechaFin;
        private Integer totalPuntos;
        private BigDecimal distanciaTotal; // En kilómetros
        private Integer duracionMinutos;
        private String rutaPolyline; // Polyline codificado de Google
        private String estadoFinal;
    }

    /**
     * DTO para estadísticas de tracking
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EstadisticasTracking {
        private LocalDateTime fecha;
        private Integer serviciosConTracking;
        private Integer totalPuntosRegistrados;
        private BigDecimal distanciaPromedio;
        private Integer tiempoPromedioServicio;
        private Double precisionPromedio; // Precisión GPS promedio
        private Integer erroresTotalDeTracking;
    }
}