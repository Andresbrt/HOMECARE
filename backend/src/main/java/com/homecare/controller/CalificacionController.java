package com.homecare.controller;

import com.homecare.dto.CalificacionDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.CalificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calificaciones")
@RequiredArgsConstructor
@Tag(name = "Calificaciones", description = "Sistema de calificación mutua")
@SecurityRequirement(name = "bearerAuth")
public class CalificacionController {

    private final CalificacionService calificacionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Calificar a un usuario después del servicio")
    public ResponseEntity<CalificacionDTO.Response> calificar(
            @Valid @RequestBody CalificacionDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CalificacionDTO.Response response = calificacionService.calificar(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/usuario/{usuarioId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener calificaciones de un usuario")
    public ResponseEntity<List<CalificacionDTO.Response>> obtenerCalificacionesUsuario(
            @PathVariable Long usuarioId) {

        List<CalificacionDTO.Response> calificaciones = 
                calificacionService.obtenerCalificacionesUsuario(usuarioId);
        return ResponseEntity.ok(calificaciones);
    }

    @GetMapping("/estadisticas/{usuarioId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener estadísticas de distribución de calificaciones")
    public ResponseEntity<CalificacionDTO.EstadisticasDistribucion> obtenerEstadisticas(
            @PathVariable Long usuarioId) {

        CalificacionDTO.EstadisticasDistribucion stats = 
                calificacionService.obtenerEstadisticasDistribucion(usuarioId);
        return ResponseEntity.ok(stats);
    }
}
