package com.homecare.domain.user.controller;

import com.homecare.dto.UsuarioDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.domain.user.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "GestiÃ³n de perfiles de usuario")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener mi perfil")
    public ResponseEntity<UsuarioDTO.Response> obtenerMiPerfil(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UsuarioDTO.Response perfil = usuarioService.obtenerPerfil(userDetails.getId());
        return ResponseEntity.ok(perfil);
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Actualizar mi perfil")
    public ResponseEntity<UsuarioDTO.Response> actualizarPerfil(
            @Valid @RequestBody UsuarioDTO.Actualizar request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UsuarioDTO.Response perfil = usuarioService.actualizarPerfil(userDetails.getId(), request);
        return ResponseEntity.ok(perfil);
    }

    @PutMapping("/ubicacion")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Actualizar ubicaciÃ³n")
    public ResponseEntity<Void> actualizarUbicacion(
            @RequestParam BigDecimal latitud,
            @RequestParam BigDecimal longitud,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        usuarioService.actualizarUbicacion(userDetails.getId(), latitud, longitud);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/disponibilidad")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Cambiar disponibilidad (solo proveedores)")
    public ResponseEntity<Void> cambiarDisponibilidad(
            @RequestParam Boolean disponible,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        usuarioService.cambiarDisponibilidad(userDetails.getId(), disponible);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/estadisticas")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    @Operation(summary = "Obtener estadÃ­sticas del proveedor")
    public ResponseEntity<UsuarioDTO.Estadisticas> obtenerEstadisticas(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UsuarioDTO.Estadisticas stats = usuarioService.obtenerEstadisticas(userDetails.getId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{usuarioId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener perfil pÃºblico de usuario")
    public ResponseEntity<UsuarioDTO.Response> obtenerPerfilPublico(@PathVariable Long usuarioId) {
        UsuarioDTO.Response perfil = usuarioService.obtenerPerfilPublico(usuarioId);
        return ResponseEntity.ok(perfil);
    }

    @PostMapping("/{usuarioId}/verificar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verificar profesional (solo admin)")
    public ResponseEntity<Void> verificarProfesional(@PathVariable Long usuarioId) {
        usuarioService.verificarProfesional(usuarioId);
        return ResponseEntity.ok().build();
    }
}

