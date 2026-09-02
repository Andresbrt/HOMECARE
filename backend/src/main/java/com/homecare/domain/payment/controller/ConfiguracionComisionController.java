package com.homecare.domain.payment.controller;

import com.homecare.dto.ConfiguracionComisionDTO;
import com.homecare.domain.payment.service.ConfiguracionComisionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments/commission-config")
@RequiredArgsConstructor
@Tag(name = "Commission Config", description = "Administración de tasas de comisión")
@SecurityRequirement(name = "bearerAuth")
public class ConfiguracionComisionController {

    private final ConfiguracionComisionService configuracionComisionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar configuraciones de comisión")
    public ResponseEntity<List<ConfiguracionComisionDTO.Response>> listarConfiguraciones() {
        return ResponseEntity.ok(configuracionComisionService.listarConfiguraciones());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear configuración de comisión")
    public ResponseEntity<ConfiguracionComisionDTO.Response> crearConfiguracion(
            @Valid @RequestBody ConfiguracionComisionDTO.Crear request) {
        return ResponseEntity.ok(configuracionComisionService.crearConfiguracion(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar configuración de comisión")
    public ResponseEntity<ConfiguracionComisionDTO.Response> actualizarConfiguracion(
            @PathVariable Long id,
            @Valid @RequestBody ConfiguracionComisionDTO.Crear request) {
        return ResponseEntity.ok(configuracionComisionService.actualizarConfiguracion(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar configuración de comisión")
    public ResponseEntity<Void> eliminarConfiguracion(@PathVariable Long id) {
        configuracionComisionService.eliminarConfiguracion(id);
        return ResponseEntity.noContent().build();
    }
}
