package com.homecare.controller;

import com.homecare.dto.ServicioDTO;
import com.homecare.model.ServicioAceptado;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.ServicioAceptadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
