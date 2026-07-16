package com.homecare.dto;

import com.homecare.domain.user.model.VerificacionProveedor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class VerificacionProveedorDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Crear {
        @NotBlank(message = "El tipo de documento es obligatorio")
        private String tipoDocumento;

        @NotBlank(message = "El número de documento es obligatorio")
        private String numeroDocumento;

        @NotBlank(message = "La URL del documento frontal es obligatoria")
        private String urlDocumentoFrontal;

        @NotBlank(message = "La URL del documento trasero es obligatoria")
        private String urlDocumentoTrasero;

        @NotBlank(message = "La URL de la selfie de verificación es obligatoria")
        private String urlSelfieVerificacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long proveedorId;
        private String tipoDocumento;
        private String numeroDocumento;
        private String urlDocumentoFrontal;
        private String urlDocumentoTrasero;
        private String urlSelfieVerificacion;
        private VerificacionProveedor.EstadoVerificacion estado;
        private Long revisadoPorId;
        private String motivoRechazo;
        private LocalDateTime fechaRevision;
        private LocalDateTime fechaCreacion;
        private LocalDateTime fechaActualizacion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Resolver {
        @NotNull(message = "El estado es obligatorio")
        private VerificacionProveedor.EstadoVerificacion estado;

        private String motivoRechazo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualReleaseRequest {
        @NotBlank(message = "El motivo es obligatorio")
        private String motivo;
    }
}
