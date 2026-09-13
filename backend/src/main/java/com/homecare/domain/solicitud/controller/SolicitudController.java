package com.homecare.domain.solicitud.controller;

import com.homecare.dto.SolicitudDTO;
import com.homecare.domain.solicitud.model.Solicitud.EstadoSolicitud;
import com.homecare.domain.solicitud.model.Solicitud.TipoLimpieza;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.solicitud.service.SolicitudService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
@Tag(name = "Solicitudes", description = "Gestión de solicitudes de servicio (Modelo inDriver)")
@SecurityRequirement(name = "bearerAuth")
public class SolicitudController {

    private final SolicitudService solicitudService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Crear nueva solicitud (Cliente publica)")
    public ResponseEntity<SolicitudDTO.Response> crearSolicitud(
            @Valid @RequestBody SolicitudDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SolicitudDTO.Response response = solicitudService.crearSolicitud(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{solicitudId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Actualizar solicitud")
    public ResponseEntity<SolicitudDTO.Response> actualizarSolicitud(
            @PathVariable Long solicitudId,
            @Valid @RequestBody SolicitudDTO.Actualizar request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SolicitudDTO.Response response = solicitudService.actualizarSolicitud(
                solicitudId, userDetails.getId(), request
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{solicitudId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Cancelar solicitud")
    public ResponseEntity<Void> cancelarSolicitud(
            @PathVariable Long solicitudId,
            @RequestParam String motivo,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        solicitudService.cancelarSolicitud(solicitudId, userDetails.getId(), motivo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorias")
    @Operation(summary = "Obtener categorías disponibles de servicios de limpieza")
    public ResponseEntity<List<java.util.Map<String, String>>> obtenerCategorias() {
        List<java.util.Map<String, String>> categorias = List.of(
            java.util.Map.of("id", "BASICA", "nombre", "Limpieza Básica", "icono", "sparkles-outline", "descripcion", "Mantenimiento general del hogar"),
            java.util.Map.of("id", "PROFUNDA", "nombre", "Limpieza Profunda", "icono", "shield-checkmark-outline", "descripcion", "Desinfección y limpieza detallada"),
            java.util.Map.of("id", "OFICINA", "nombre", "Limpieza de Oficina", "icono", "business-outline", "descripcion", "Espacios comerciales y oficinas"),
            java.util.Map.of("id", "POST_CONSTRUCCION", "nombre", "Post Construcción", "icono", "construct-outline", "descripcion", "Limpieza especializada tras obra o remodelación")
        );
        return ResponseEntity.ok(categorias);
    }

    @GetMapping("/mis-solicitudes")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Obtener mis solicitudes")
    public ResponseEntity<List<SolicitudDTO.Response>> obtenerMisSolicitudes(
            @RequestParam(required = false) EstadoSolicitud estado,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<SolicitudDTO.Response> solicitudes = solicitudService.obtenerMisSolicitudes(
                userDetails.getId(), estado
        );
        return ResponseEntity.ok(solicitudes);
    }

    @GetMapping("/cercanas")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Buscar solicitudes cercanas (Proveedor descubre)")
    public ResponseEntity<Page<SolicitudDTO.Response>> obtenerSolicitudesCercanas(
            @RequestParam BigDecimal latitud,
            @RequestParam BigDecimal longitud,
            @RequestParam(defaultValue = "10") Integer radioKm,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Page<SolicitudDTO.Response> solicitudes = solicitudService.obtenerSolicitudesCercanas(
                userDetails.getId(), latitud, longitud, radioKm, pageable
        );
        return ResponseEntity.ok(solicitudes);
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Buscar solicitudes con filtros")
    public ResponseEntity<List<SolicitudDTO.Response>> buscarSolicitudes(
            @RequestParam(required = false) TipoLimpieza tipo,
            @RequestParam(required = false) EstadoSolicitud estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta) {

        List<SolicitudDTO.Response> solicitudes = solicitudService.buscarSolicitudes(
                tipo, estado, fechaDesde, fechaHasta
        );
        return ResponseEntity.ok(solicitudes);
    }

    @GetMapping("/{solicitudId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener detalle de solicitud")
    public ResponseEntity<SolicitudDTO.DetailResponse> obtenerSolicitud(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SolicitudDTO.DetailResponse response = solicitudService.obtenerSolicitud(
                solicitudId, userDetails.getId()
        );
        return ResponseEntity.ok(response);
    }
}

