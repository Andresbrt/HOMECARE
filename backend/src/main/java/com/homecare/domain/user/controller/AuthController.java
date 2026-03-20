package com.homecare.domain.user.controller;

import com.homecare.dto.AuthDTO;
import com.homecare.domain.user.service.AuthService;
import com.homecare.domain.common.service.TokenBlacklistService;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "AutenticaciÃ³n", description = "Endpoints para registro, login y gestiÃ³n de tokens")
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/registro")
    @Operation(summary = "Registrar un nuevo usuario (Cliente o Proveedor)")
    public ResponseEntity<AuthDTO.LoginResponse> registro(@Valid @RequestBody AuthDTO.Registro registroDTO) {
        return ResponseEntity.ok(authService.registro(registroDTO));
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuario y obtener tokens JWT")
    public ResponseEntity<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.Login loginRequest) {
        return ResponseEntity.ok(authService.login(loginRequest.getEmail(), loginRequest.getPassword()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token de acceso usando refresh token")
    public ResponseEntity<AuthDTO.LoginResponse> refreshToken(@Valid @RequestBody AuthDTO.RefreshToken request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener informaciÃ³n del perfil del usuario autenticado")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AuthDTO.UsuarioInfo> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        // En un sistema real, el ID se extraerÃ­a del UserDetails personalizado
        Long userId = userDetails instanceof CustomUserDetails ? ((CustomUserDetails) userDetails).getId() : Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(authService.obtenerInfoUsuario(userId));
    }

    @PostMapping("/cambiar-password")
    @Operation(summary = "Cambiar contraseÃ±a del usuario autenticado")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AuthDTO.CambiarPassword request) {
        Long userId = userDetails instanceof CustomUserDetails ? ((CustomUserDetails) userDetails).getId() : Long.parseLong(userDetails.getUsername());
        authService.cambiarPassword(userId, request.getPasswordActual(), request.getPasswordNueva());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesiÃ³n e invalidar tokens")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletRequest request) {
        String token = jwtTokenProvider.resolveToken(request);
        if (token != null) {
            tokenBlacklistService.blacklistToken(token);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar recuperación de contraseña")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody AuthDTO.RecuperarPassword request) {
        authService.solicitarRecuperacionPassword(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Restablecer contraseña usando token")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody AuthDTO.ResetPassword request) {
        authService.resetearPassword(request.getToken(), request.getNuevaPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verificar email del usuario")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        authService.verificarEmail(token);
        return ResponseEntity.ok().build();
    }
}



