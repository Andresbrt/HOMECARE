package com.homecare.dto;

import com.homecare.model.Archivo.TipoArchivo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class FileUploadDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String nombreOriginal;
        private String nombreAlmacenado;
        private String urlPublica;
        private String mimeType;
        private Long tamanioBytes;
        private TipoArchivo tipoArchivo;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchResponse {
        private List<Response> archivos;
        private int exitosos;
        private int fallidos;
        private List<String> errores;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadRequest {
        private TipoArchivo tipoArchivo;
        private Long solicitudId;
        private Long servicioId;
    }
}
