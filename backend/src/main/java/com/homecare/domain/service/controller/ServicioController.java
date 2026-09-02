package com.homecare.domain.service.controller;

import com.homecare.dto.ConformidadDTO;
import com.homecare.dto.EvidenciaDTO;
import com.homecare.dto.ServicioDTO;
import com.homecare.model.ServicioAceptado;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.service.model.EvidenciaServicio.TipoEvidencia;
import com.homecare.domain.service.service.ServicioAceptadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/servicios")
@RequiredArgsConstructor
@Tag(name = "Servicios", description = "Gestión de servicios aceptados")
@SecurityRequirement(name = "bearerAuth")
public class ServicioController {

    private final ServicioAceptadoService servicioService;

    @PutMapping("/{servicioId}/estado")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Actualizar estado del servicio")
    public ResponseEntity<ServicioDTO.Response> actualizarEstado(
            @PathVariable Long servicioId,
            @Valid @RequestBody ServicioDTO.ActualizarEstado request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ServicioAceptado.EstadoServicio estado = ServicioAceptado.EstadoServicio.valueOf(request.getEstado());
        ServicioDTO.Response response = servicioService.actualizarEstado(
                servicioId, userDetails.getId(), estado
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{servicioId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener detalle del servicio")
    public ResponseEntity<ServicioDTO.Response> obtenerServicio(
            @PathVariable Long servicioId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ServicioDTO.Response response = servicioService.obtenerServicio(servicioId, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/activos")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener servicios activos")
    public ResponseEntity<List<ServicioDTO.Response>> obtenerServiciosActivos(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<ServicioDTO.Response> servicios = servicioService.obtenerServiciosActivos(userDetails.getId());
        return ResponseEntity.ok(servicios);
    }

    @GetMapping("/historial")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener historial de servicios")
    public ResponseEntity<List<ServicioDTO.Response>> obtenerHistorial(
            @RequestParam(required = false) ServicioAceptado.EstadoServicio estado,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<ServicioDTO.Response> servicios = servicioService.obtenerHistorial(
                userDetails.getId(), estado
        );
        return ResponseEntity.ok(servicios);
    }

    @PostMapping("/{servicioId}/evidencia")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Agregar evidencia fotográfica al servicio")
    public ResponseEntity<EvidenciaDTO.Response> agregarEvidencia(
            @PathVariable Long servicioId,
            @Valid @RequestBody EvidenciaDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        EvidenciaDTO.Response response = servicioService.agregarEvidencia(
                servicioId,
                userDetails.getId(),
                request.getTipo(),
                request.getUrlArchivo(),
                request.getDescripcion()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{servicioId}/evidencia/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Subir y adjuntar evidencia fotográfica al servicio")
    public ResponseEntity<EvidenciaDTO.Response> subirEvidencia(
            @PathVariable Long servicioId,
            @RequestParam TipoEvidencia tipo,
            @RequestPart("archivo") MultipartFile archivo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        EvidenciaDTO.Response response = servicioService.agregarEvidenciaArchivo(
                servicioId,
                userDetails.getId(),
                tipo,
                archivo,
                descripcion
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{servicioId}/programacion")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Reprogramar fecha y hora de un servicio")
    public ResponseEntity<ServicioDTO.Response> reprogramarServicio(
            @PathVariable Long servicioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaServicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime horaInicio,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ServicioDTO.Response response = servicioService.reprogramarServicio(
                servicioId,
                userDetails.getId(),
                fechaServicio,
                horaInicio
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{servicioId}/evidencia")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Obtener evidencias del servicio")
    public ResponseEntity<List<EvidenciaDTO.Response>> listarEvidencias(
            @PathVariable Long servicioId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<EvidenciaDTO.Response> evidencias = servicioService.listarEvidencias(
                servicioId,
                userDetails.getId()
        );

        return ResponseEntity.ok(evidencias);
    }

    @PostMapping("/{servicioId}/conformidad")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Registrar conformidad del cliente para un servicio")
    public ResponseEntity<ConformidadDTO.Response> confirmarConformidad(
            @PathVariable Long servicioId,
            @Valid @RequestBody ConformidadDTO.Crear request,
            HttpServletRequest requestor,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ConformidadDTO.Response response = servicioService.confirmarConformidad(
                servicioId,
                userDetails.getId(),
                request.getAceptado(),
                request.getComentario(),
                requestor.getRemoteAddr()
        );

        return ResponseEntity.ok(response);
    }
}

