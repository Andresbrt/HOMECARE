package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTOs para Servicios Aceptados
 */
public class ServicioDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private Long solicitudId;
        private Long ofertaId;
        private Long clienteId;
        private String clienteNombre;
        private String clienteFoto;
        private String clienteTelefono;
        private Long proveedorId;
        private String proveedorNombre;
        private String proveedorFoto;
        private String proveedorTelefono;
        private BigDecimal precioAcordado;
        private String estado;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String confirmadoAt;
        private String enCaminoAt;
        private String llegueAt;
        private String iniciadoAt;
        private String completadoAt;
        private String canceladoAt;
        private String motivoCancelacion;
        private List<String> fotosAntes;
        private List<String> fotosDespues;
        private String createdAt;
    }

    // Alias para compatibilidad con servicios
    public static class Response extends Respuesta {
        public Response() {
            super();
        }

        public Response(Long id, Long solicitudId, Long ofertaId, Long clienteId, String clienteNombre,
                       String clienteFoto, String clienteTelefono, Long proveedorId, String proveedorNombre,
                       String proveedorFoto, String proveedorTelefono, BigDecimal precioAcordado, String estado,
                       String direccion, BigDecimal latitud, BigDecimal longitud, String confirmadoAt,
                       String enCaminoAt, String llegueAt, String iniciadoAt, String completadoAt,
                       String canceladoAt, String motivoCancelacion, List<String> fotosAntes,
                       List<String> fotosDespues, String createdAt) {
            super(id, solicitudId, ofertaId, clienteId, clienteNombre, clienteFoto, clienteTelefono,
                  proveedorId, proveedorNombre, proveedorFoto, proveedorTelefono, precioAcordado,
                  estado, direccion, latitud, longitud, confirmadoAt, enCaminoAt, llegueAt,
                  iniciadoAt, completadoAt, canceladoAt, motivoCancelacion, fotosAntes,
                  fotosDespues, createdAt);
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActualizarEstado {
        @NotBlank(message = "El estado es obligatorio")
        private String estado; // EN_CAMINO, LLEGUE, EN_PROGRESO, COMPLETADO, CANCELADO
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Cancelar {
        @NotBlank(message = "El motivo de cancelación es obligatorio")
        @Size(min = 10, max = 500, message = "El motivo debe tener entre 10 y 500 caracteres")
        private String motivo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgregarFotos {
        @NotNull(message = "El tipo de foto es obligatorio")
        private String tipo; // ANTES, DESPUES

        @NotEmpty(message = "Debe proporcionar al menos una foto")
        private List<String> urls;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Estadisticas {
        private Long totalServicios;
        private Long serviciosCompletados;
        private Long serviciosCancelados;
        private BigDecimal gananciaTotal;
        private BigDecimal calificacionPromedio;
        private Long totalCalificaciones;
    }
}
