package com.homecare.controller;

import com.homecare.dto.AuthDTO;
import com.homecare.security.CustomUserDetails;
import com.homecare.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Autenticación y gestión de sesiones")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro")
    @Operation(summary = "Registrar nuevo usuario")
    public ResponseEntity<AuthDTO.LoginResponse> registro(@Valid @RequestBody AuthDTO.Registro request) {
        AuthDTO.LoginResponse response = authService.registro(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.Login request) {
        AuthDTO.LoginResponse response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar access token")
    public ResponseEntity<AuthDTO.LoginResponse> refreshToken(@Valid @RequestBody AuthDTO.RefreshToken request) {
        AuthDTO.LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cambiar contraseña")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody AuthDTO.CambiarPassword request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        authService.cambiarPassword(userDetails.getId(), request.getPasswordActual(), request.getNuevaPassword());
        return ResponseEntity.ok("Contraseña cambiada exitosamente");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar recuperación de contraseña")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody AuthDTO.RecuperarPassword request) {
        authService.solicitarRecuperacionPassword(request.getEmail());
        return ResponseEntity.ok("Si el email existe, recibirás instrucciones de recuperación");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Resetear contraseña con token")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody AuthDTO.ResetPassword request) {
        authService.resetearPassword(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.ok("Contraseña reseteada exitosamente");
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obtener información del usuario autenticado")
    public ResponseEntity<AuthDTO.UsuarioInfo> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        AuthDTO.UsuarioInfo info = authService.obtenerInfoUsuario(userDetails.getId());
        return ResponseEntity.ok(info);
    }
}
