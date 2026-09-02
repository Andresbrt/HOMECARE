package com.homecare.domain.service.controller;

import com.homecare.dto.DisputaDTO;
import com.homecare.domain.service.model.Disputa;
import com.homecare.domain.service.service.DisputaService;
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
@RequestMapping("/api/disputas")
@RequiredArgsConstructor
@Tag(name = "Disputas", description = "Gestión de disputas entre cliente y proveedor")
@SecurityRequirement(name = "bearerAuth")
public class DisputaController {

    private final DisputaService disputaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Crear disputa para un servicio")
    public ResponseEntity<DisputaDTO.Response> crearDisputa(
            @Valid @RequestBody DisputaDTO.Crear request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        DisputaDTO.Response response = disputaService.crearDisputa(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER')")
    @Operation(summary = "Listar mis disputas")
    public ResponseEntity<List<DisputaDTO.Response>> listarMisDisputas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(disputaService.listarDisputasUsuario(userDetails.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todas las disputas (admin)")
    public ResponseEntity<List<DisputaDTO.Response>> listarDisputas(
            @RequestParam(required = false) Disputa.EstadoDisputa estado) {
        return ResponseEntity.ok(disputaService.listarDisputasAdmin(estado));
    }

    @GetMapping("/{disputaId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN')")
    @Operation(summary = "Obtener detalle de una disputa")
    public ResponseEntity<DisputaDTO.Response> obtenerDisputa(
            @PathVariable Long disputaId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(disputaService.obtenerDisputa(disputaId, userDetails.getId()));
    }

    @PutMapping("/{disputaId}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resolver disputa (admin)")
    public ResponseEntity<DisputaDTO.Response> resolverDisputa(
            @PathVariable Long disputaId,
            @Valid @RequestBody DisputaDTO.Resolver request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(disputaService.resolverDisputa(disputaId, userDetails.getId(), request));
    }
}
