package com.homecare.domain.user.controller;

import com.homecare.domain.user.service.VerificacionProveedorService;
import com.homecare.dto.VerificacionProveedorDTO;
import com.homecare.security.CustomUserDetails;
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
@RequestMapping("/api/usuarios/verificaciones")
@RequiredArgsConstructor
@Tag(name = "Verificaciones Proveedor", description = "Flujo de verificación de proveedores")
@SecurityRequirement(name = "bearerAuth")
public class VerificacionProveedorController {

    private final VerificacionProveedorService verificacionProveedorService;

    @PostMapping("/me")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Solicitar verificación de proveedor")
    public ResponseEntity<VerificacionProveedorDTO.Response> solicitarVerificacion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerificacionProveedorDTO.Crear request) {
        return ResponseEntity.ok(verificacionProveedorService.solicitarVerificacion(userDetails.getId(), request));
    }

    @GetMapping("/solicitudes/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar solicitudes de verificación pendientes")
    public ResponseEntity<List<VerificacionProveedorDTO.Response>> listarSolicitudesPendientes() {
        return ResponseEntity.ok(verificacionProveedorService.listarSolicitudesPendientes());
    }

    @PostMapping("/solicitudes/{solicitudId}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resolver solicitud de verificación de proveedor")
    public ResponseEntity<VerificacionProveedorDTO.Response> resolverSolicitud(
            @PathVariable Long solicitudId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerificacionProveedorDTO.Resolver request) {
        return ResponseEntity.ok(verificacionProveedorService.resolverSolicitud(solicitudId, userDetails.getId(), request));
    }
}
