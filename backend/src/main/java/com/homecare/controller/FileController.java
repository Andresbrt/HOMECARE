package com.homecare.controller;

import com.homecare.dto.FileUploadDTO;
import com.homecare.model.Archivo.TipoArchivo;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "Files", description = "Gestión de archivos y multimedia")
@SecurityRequirement(name = "bearerAuth")
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Subir un archivo")
    public ResponseEntity<FileUploadDTO.Response> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoArchivo") TipoArchivo tipoArchivo,
            @RequestParam(value = "solicitudId", required = false) Long solicitudId,
            @RequestParam(value = "servicioId", required = false) Long servicioId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        FileUploadDTO.Response response = fileStorageService.uploadFile(
                file, tipoArchivo, userDetails.getId(), solicitudId, servicioId
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/upload/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Subir múltiples archivos")
    public ResponseEntity<FileUploadDTO.BatchResponse> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("tipoArchivo") TipoArchivo tipoArchivo,
            @RequestParam(value = "solicitudId", required = false) Long solicitudId,
            @RequestParam(value = "servicioId", required = false) Long servicioId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        FileUploadDTO.BatchResponse response = fileStorageService.uploadMultiple(
                files, tipoArchivo, userDetails.getId(), solicitudId, servicioId
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{archivoId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Eliminar un archivo")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long archivoId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        fileStorageService.deleteFile(archivoId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener mis archivos")
    public ResponseEntity<List<FileUploadDTO.Response>> getMyFiles(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<FileUploadDTO.Response> files = fileStorageService.getFilesByUsuario(userDetails.getId());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/solicitud/{solicitudId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener archivos de una solicitud")
    public ResponseEntity<List<FileUploadDTO.Response>> getFilesBySolicitud(
            @PathVariable Long solicitudId) {

        List<FileUploadDTO.Response> files = fileStorageService.getFilesBySolicitud(solicitudId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/servicio/{servicioId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener archivos de un servicio")
    public ResponseEntity<List<FileUploadDTO.Response>> getFilesByServicio(
            @PathVariable Long servicioId) {

        List<FileUploadDTO.Response> files = fileStorageService.getFilesByServicio(servicioId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{archivoId}/presigned-url")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener URL firmada para descarga directa")
    public ResponseEntity<String> getPresignedUrl(
            @PathVariable Long archivoId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String url = fileStorageService.getPresignedUrl(archivoId, userDetails.getId());
        return ResponseEntity.ok(url);
    }
}
