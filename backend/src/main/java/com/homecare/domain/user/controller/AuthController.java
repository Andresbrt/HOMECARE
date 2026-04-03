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

    @PostMapping("/firebase-login")
    @Operation(summary = "Autenticar con Firebase (Google Sign-In) y obtener tokens JWT")
    public ResponseEntity<AuthDTO.LoginResponse> firebaseLogin(@Valid @RequestBody AuthDTO.FirebaseLogin dto) {
        return ResponseEntity.ok(authService.loginWithFirebase(dto));
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

    @PostMapping("/send-otp")
    @Operation(summary = "Enviar código OTP de 4 dígitos al email del usuario")
    public ResponseEntity<AuthDTO.OTPResponse> sendOtp(@Valid @RequestBody AuthDTO.ReenviarOTP request) {
        return ResponseEntity.ok(authService.generarYEnviarOTP(request.getEmail()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verificar código OTP e iniciar sesión")
    public ResponseEntity<AuthDTO.LoginResponse> verifyOtp(@Valid @RequestBody AuthDTO.VerificarOTP request) {
        return ResponseEntity.ok(authService.verificarOTP(request.getEmail(), request.getCodigo()));
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

    @GetMapping("/verify-link")
    @Operation(summary = "Ruta para abrir la App")
    public ResponseEntity<String> openApp(@RequestParam String token) {
        // Usamos path exacto segun linking.js
        String deepLink = "homecare://verify-email/" + token;
        String html = "<!DOCTYPE html><html>" +
                "<head><meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<style>body { font-family: sans-serif; background-color: #001B38; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; } " +
                ".btn { background: #49C0BC; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }</style></head>" +
                "<body>" +
                "<h2>HOME CARE</h2>" +
                "<p>Haz clic abajo para verificar tu cuenta:</p>" +
                "<a href='" + deepLink + "' class='btn'>ABRIR LA APP</a>" +
                "<p style='margin-top: 30px; font-size: 12px; opacity: 0.7;'>Si la app no abre sola, asegúrate de tener Expo Go instalado.</p>" +
                "<script>setTimeout(function() { window.location.href = '" + deepLink + "'; }, 1000);</script>" +
                "</body></html>";
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }
}



