package com.homecare.dto;

import com.homecare.model.UbicacionProveedor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs para el sistema de geolocalización en tiempo real
 */
public class UbicacionDTO {

    /**
     * DTO para enviar actualización de ubicación del proveedor
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActualizarUbicacion {
        private Long solicitudId;
        private Double latitud;
        private Double longitud;
        private Double precisionMetros;
        private Double velocidadKmh;
        private Double rumboGrados;
        private String tipoTransporte; // auto, moto, bicicleta, a_pie
        private Integer bateriaDispositivo;
        private Boolean enSegundoPlano;
    }

    /**
     * DTO de respuesta con ubicación del proveedor y ETA
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UbicacionResponse {
        private Long id;
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private String proveedorFoto;
        private Double latitud;
        private Double longitud;
        private Double precisionMetros;
        private Double velocidadKmh;
        private Double rumboGrados;
        private Double distanciaRestanteMetros;
        private Integer etaMinutos;
        private String estado; // EN_RUTA, DETENIDO, LLEGANDO, LLEGADO
        private String tipoTransporte;
        private Integer bateriaDispositivo;
        private LocalDateTime timestamp;
    }

    /**
     * DTO para WebSocket con ubicación en tiempo real
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UbicacionWebSocket {
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private Double latitud;
        private Double longitud;
        private Double velocidadKmh;
        private Double rumboGrados;
        private Double distanciaRestanteMetros;
        private Integer etaMinutos;
        private String estado;
        private LocalDateTime timestamp;
        private Boolean alertaCerca; // true si está a menos de 500m
    }

    /**
     * DTO para trayectoria completa (ruta histórica)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Trayectoria {
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private LocalDateTime inicioRuta;
        private LocalDateTime finRuta;
        private Integer duracionMinutos;
        private Double distanciaTotalKm;
        private Double velocidadPromedioKmh;
        private List<PuntoRuta> puntos;
    }

    /**
     * Punto individual en la trayectoria
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PuntoRuta {
        private Double latitud;
        private Double longitud;
        private Double velocidadKmh;
        private String estado;
        private LocalDateTime timestamp;
    }

    /**
     * DTO para estadísticas de tracking
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EstadisticasTracking {
        private Long solicitudId;
        private Integer totalActualizaciones;
        private Double distanciaRecorridaKm;
        private Integer tiempoTotalMinutos;
        private Double velocidadPromedioKmh;
        private Double velocidadMaximaKmh;
        private Integer tiempoDetenidoMinutos;
        private LocalDateTime primeraUbicacion;
        private LocalDateTime ultimaUbicacion;
    }

    /**
     * DTO para alerta de proximidad
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlertaProximidad {
        private Long solicitudId;
        private Long proveedorId;
        private String proveedorNombre;
        private String proveedorTelefono;
        private Double distanciaMetros;
        private Integer etaMinutos;
        private String mensaje; // "El proveedor está a 500 metros de distancia"
        private TipoAlerta tipoAlerta;
        private LocalDateTime timestamp;

        public enum TipoAlerta {
            SALIENDO,       // Proveedor comenzó el viaje
            EN_RUTA,        // Proveedor en camino (actualización periódica)
            CERCA_1KM,      // A menos de 1 km
            CERCA_500M,     // A menos de 500 m
            LLEGANDO_100M,  // A menos de 100 m
            LLEGADO         // Ha llegado al destino
        }
    }

    /**
     * DTO para configuración de tracking
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConfiguracionTracking {
        private Integer intervaloActualizacionSegundos; // cada cuántos segundos enviar ubicación
        private Integer distanciaMinimaCambioMetros; // distancia mínima para enviar actualización
        private Boolean trackingEnSegundoPlano;
        private Boolean alertasProximidad;
        private Boolean compartirVelocidad;
        private Boolean compartirBateria;
    }

    // Métodos de conversión (mappers)
    public static UbicacionResponse toResponse(UbicacionProveedor ubicacion) {
        return UbicacionResponse.builder()
                .id(ubicacion.getId())
                .solicitudId(ubicacion.getSolicitud().getId())
                .proveedorId(ubicacion.getProveedor().getId())
                .proveedorNombre(ubicacion.getProveedor().getNombre() + " " + 
                                ubicacion.getProveedor().getApellido())
                .proveedorFoto(ubicacion.getProveedor().getFotoPerfil())
                .latitud(ubicacion.getLatitud())
                .longitud(ubicacion.getLongitud())
                .precisionMetros(ubicacion.getPrecisionMetros())
                .velocidadKmh(ubicacion.getVelocidadKmh())
                .rumboGrados(ubicacion.getRumboGrados())
                .distanciaRestanteMetros(ubicacion.getDistanciaRestanteMetros())
                .etaMinutos(ubicacion.getEtaMinutos())
                .estado(ubicacion.getEstado().name())
                .tipoTransporte(ubicacion.getTipoTransporte())
                .bateriaDispositivo(ubicacion.getBateriaDispositivo())
                .timestamp(ubicacion.getTimestamp())
                .build();
    }

    public static UbicacionWebSocket toWebSocket(UbicacionProveedor ubicacion) {
        return UbicacionWebSocket.builder()
                .solicitudId(ubicacion.getSolicitud().getId())
                .proveedorId(ubicacion.getProveedor().getId())
                .proveedorNombre(ubicacion.getProveedor().getNombre() + " " + 
                                ubicacion.getProveedor().getApellido())
                .latitud(ubicacion.getLatitud())
                .longitud(ubicacion.getLongitud())
                .velocidadKmh(ubicacion.getVelocidadKmh())
                .rumboGrados(ubicacion.getRumboGrados())
                .distanciaRestanteMetros(ubicacion.getDistanciaRestanteMetros())
                .etaMinutos(ubicacion.getEtaMinutos())
                .estado(ubicacion.getEstado().name())
                .timestamp(ubicacion.getTimestamp())
                .alertaCerca(ubicacion.getDistanciaRestanteMetros() != null && 
                            ubicacion.getDistanciaRestanteMetros() < 500)
                .build();
    }
}
