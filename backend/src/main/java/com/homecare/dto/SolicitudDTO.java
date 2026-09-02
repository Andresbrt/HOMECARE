package com.homecare.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTOs para Solicitudes
 */
public class SolicitudDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Crear {
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 200, message = "El título no puede exceder 200 caracteres")
        private String titulo;

        @NotBlank(message = "La descripción es obligatoria")
        private String descripcion;

        @NotBlank(message = "El tipo de limpieza es obligatorio")
        private String tipoLimpieza; // BASICA, PROFUNDA, OFICINA, POST_CONSTRUCCION, etc.

        @NotBlank(message = "La dirección es obligatoria")
        private String direccion;

        @NotNull(message = "La latitud es obligatoria")
        @DecimalMin(value = "-90.0", message = "Latitud inválida")
        @DecimalMax(value = "90.0", message = "Latitud inválida")
        private BigDecimal latitud;

        @NotNull(message = "La longitud es obligatoria")
        @DecimalMin(value = "-180.0", message = "Longitud inválida")
        @DecimalMax(value = "180.0", message = "Longitud inválida")
        private BigDecimal longitud;

        private String referenciaDireccion;

        @DecimalMin(value = "0.01", message = "Los metros cuadrados deben ser positivos")
        private BigDecimal metrosCuadrados;

        @Min(value = 0, message = "La cantidad de habitaciones no puede ser negativa")
        private Integer cantidadHabitaciones;

        @Min(value = 0, message = "La cantidad de baños no puede ser negativa")
        private Integer cantidadBanos;

        private Boolean tieneMascotas;

        @DecimalMin(value = "0.01", message = "El precio máximo debe ser positivo")
        private BigDecimal precioMaximo; // Opcional

        @NotNull(message = "La fecha del servicio es obligatoria")
        @Future(message = "La fecha debe ser futura")
        private LocalDate fechaServicio;

        @NotNull(message = "La hora de inicio es obligatoria")
        private LocalTime horaInicio;

        // Alias para compatibilidad
        public LocalTime getHoraInicioEstimada() {
            return horaInicio;
        }

        public void setHoraInicioEstimada(LocalTime hora) {
            this.horaInicio = hora;
        }

        @Min(value = 30, message = "La duración mínima es 30 minutos")
        private Integer duracionEstimada;

        // Alias para compatibilidad
        public Integer getDuracionEstimadaHoras() {
            return duracionEstimada != null ? duracionEstimada / 60 : null;
        }

        public void setDuracionEstimadaHoras(Integer horas) {
            this.duracionEstimada = horas != null ? horas * 60 : null;
        }

        private String instruccionesEspeciales;

        // Alias para compatibilidad
        public String getInstruccionesEspeciales() {
            return instruccionesEspeciales;
        }

        public void setInstruccionesEspeciales(String instrucciones) {
            this.instruccionesEspeciales = instrucciones;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Respuesta {
        private Long id;
        private Long clienteId;
        private String clienteNombre;
        private String clienteFoto;
        private String titulo;
        private String descripcion;
        private String tipoLimpieza;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String referenciaDireccion;
        private BigDecimal metrosCuadrados;
        private Integer cantidadHabitaciones;
        private Integer cantidadBanos;
        private Boolean tieneMascotas;
        private BigDecimal precioMaximo;
        private LocalDate fechaServicio;
        private LocalTime horaInicio;
        private Integer duracionEstimada;
        private String estado;
        private Integer cantidadOfertas;
        private Long ofertaAceptadaId;
        private String createdAt;
        private String expiraEn;
        private Double distanciaKm; // Para proveedores: distancia a la solicitud
    }

    // Alias para compatibilidad con servicios
    public static class Response extends Respuesta {
        public Response() {
            super();
        }
        
        public Response(Long id, Long clienteId, String clienteNombre, String clienteFoto,
                       String titulo, String descripcion, String tipoLimpieza, String direccion,
                       BigDecimal latitud, BigDecimal longitud, String referenciaDireccion,
                       BigDecimal metrosCuadrados, Integer cantidadHabitaciones, Integer cantidadBanos,
                       Boolean tieneMascotas, BigDecimal precioMaximo, LocalDate fechaServicio,
                       LocalTime horaInicio, Integer duracionEstimada, String estado,
                       Integer cantidadOfertas, Long ofertaAceptadaId, String createdAt,
                       String expiraEn, Double distanciaKm) {
            super(id, clienteId, clienteNombre, clienteFoto, titulo, descripcion, tipoLimpieza,
                  direccion, latitud, longitud, referenciaDireccion, metrosCuadrados,
                  cantidadHabitaciones, cantidadBanos, tieneMascotas, precioMaximo,
                  fechaServicio, horaInicio, duracionEstimada, estado, cantidadOfertas,
                  ofertaAceptadaId, createdAt, expiraEn, distanciaKm);
        }

        // Alias para compatibilidad
        public LocalTime getHoraInicioEstimada() {
            return getHoraInicio();
        }

        public Integer getDuracionEstimadaHoras() {
            return getDuracionEstimada() != null ? getDuracionEstimada() / 60 : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long id;
        private Long clienteId;
        private String clienteNombre;
        private String tipoLimpieza;
        private String descripcion;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private LocalDate fechaServicio;
        private LocalTime horaInicioEstimada;
        private Integer duracionEstimadaHoras;
        private BigDecimal metrosCuadrados;
        private BigDecimal precioMaximo;
        private String estado;
        private Integer cantidadOfertas;
        private String createdAt;
        private String instruccionesEspeciales;
        private String clienteTelefono;
        private String clienteFotoPerfil;
        private Double clienteCalificacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Actualizar {
        private String descripcion;
        private BigDecimal precioMaximo;
        private LocalDate fechaServicio;
        private LocalTime horaInicio;
        private String direccion;
        private BigDecimal latitud;
        private BigDecimal longitud;
        private String instruccionesEspeciales;

        // Alias para compatibilidad
        public LocalTime getHoraInicioEstimada() {
            return horaInicio;
        }

        public void setHoraInicioEstimada(LocalTime hora) {
            this.horaInicio = hora;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CambiarEstado {
        @NotBlank(message = "El estado es obligatorio")
        private String estado;
    }
}
