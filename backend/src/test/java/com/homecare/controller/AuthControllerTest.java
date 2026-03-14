package com.homecare.controller;

import com.homecare.dto.AuthDTO;
import com.homecare.exception.AuthException;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import com.homecare.service.AuthService;
import com.homecare.service.TokenBlacklistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Date;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pure unit tests for AuthController — no Spring context, no MockMvc.
 * Tests the controller logic directly by invoking methods.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private final AuthService authService = mock(AuthService.class);
    private final TokenBlacklistService tokenBlacklistService = mock(TokenBlacklistService.class);
    private final JwtTokenProvider jwtTokenProvider = mock(JwtTokenProvider.class);

    private final AuthController controller = new AuthController(authService, tokenBlacklistService, jwtTokenProvider);

    private AuthDTO.LoginResponse sampleResponse() {
        return AuthDTO.LoginResponse.builder()
                .token("access-token")
                .refreshToken("refresh-token")
                .tipo("Bearer")
                .id(1L)
                .email("test@homecare.com")
                .nombre("Juan")
                .apellido("Pérez")
                .fotoPerfil(null)
                .rol("ROLE_CUSTOMER")
                .expiresIn(86400L)
                .build();
    }

    // ── registro ─────────────────────────────────────────

    @Test
    @DisplayName("registro returns 200 with LoginResponse")
    void registro_success() {
        AuthDTO.Registro req = AuthDTO.Registro.builder()
                .email("nuevo@test.com").password("pass123")
                .nombre("Ana").apellido("López").telefono("3001234567").rol("CUSTOMER")
                .build();
        when(authService.registro(req)).thenReturn(sampleResponse());

        var resp = controller.registro(req);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody().getToken()).isEqualTo("access-token");
    }

    @Test
    @DisplayName("registro propagates AuthException for duplicate email")
    void registro_duplicateEmail() {
        AuthDTO.Registro req = AuthDTO.Registro.builder()
                .email("dup@test.com").password("pass123")
                .nombre("X").apellido("Y").telefono("3000000000").rol("CUSTOMER")
                .build();
        when(authService.registro(req)).thenThrow(new AuthException("El email ya está registrado"));

        assertThatThrownBy(() -> controller.registro(req))
                .isInstanceOf(AuthException.class);
    }

    // ── login ────────────────────────────────────────────

    @Test
    @DisplayName("login returns 200 with tokens")
    void login_success() {
        AuthDTO.Login req = new AuthDTO.Login("test@homecare.com", "pass");
        when(authService.login("test@homecare.com", "pass")).thenReturn(sampleResponse());

        var resp = controller.login(req);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody().getEmail()).isEqualTo("test@homecare.com");
    }

    @Test
    @DisplayName("login propagates BadCredentialsException")
    void login_badCredentials() {
        AuthDTO.Login req = new AuthDTO.Login("test@homecare.com", "wrong");
        when(authService.login("test@homecare.com", "wrong"))
                .thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> controller.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── refresh ──────────────────────────────────────────

    @Test
    @DisplayName("refreshToken returns 200 with new tokens")
    void refreshToken_success() {
        AuthDTO.RefreshToken req = new AuthDTO.RefreshToken("valid-refresh");
        when(authService.refreshToken("valid-refresh")).thenReturn(sampleResponse());

        var resp = controller.refreshToken(req);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
    }

    // ── change-password ──────────────────────────────────

    @Test
    @DisplayName("changePassword returns OK message")
    void changePassword_success() {
        AuthDTO.CambiarPassword req = new AuthDTO.CambiarPassword("old", "new123");
        CustomUserDetails userDetails = new CustomUserDetails(1L, "e@t.com", "p", "N", "A", true, true, null);

        var resp = controller.changePassword(req, userDetails);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody()).contains("exitosamente");
        verify(authService).cambiarPassword(1L, "old", "new123");
    }

    // ── forgot-password ──────────────────────────────────

    @Test
    @DisplayName("forgotPassword always returns same message (no email oracle)")
    void forgotPassword() {
        AuthDTO.RecuperarPassword req = new AuthDTO.RecuperarPassword("any@test.com");

        var resp = controller.forgotPassword(req);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        assertThat(resp.getBody()).contains("Si el email existe");
    }

    // ── reset-password ───────────────────────────────────

    @Test
    @DisplayName("resetPassword returns OK message")
    void resetPassword_success() {
        AuthDTO.ResetPassword req = new AuthDTO.ResetPassword("token123", "brandNew");

        var resp = controller.resetPassword(req);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        verify(authService).resetearPassword("token123", "brandNew");
    }

    // ── me ───────────────────────────────────────────────

    @Test
    @DisplayName("getMe returns UsuarioInfo for authenticated user")
    void getMe_success() {
        CustomUserDetails userDetails = new CustomUserDetails(1L, "e@t.com", "p", "N", "A", true, true, null);
        AuthDTO.UsuarioInfo info = AuthDTO.UsuarioInfo.builder()
                .id(1L).email("e@t.com").nombre("N").apellido("A").rol("ROLE_CUSTOMER").build();
        when(authService.obtenerInfoUsuario(1L)).thenReturn(info);

        var resp = controller.getMe(userDetails);

        assertThat(resp.getBody().getId()).isEqualTo(1L);
    }

    // ── logout ───────────────────────────────────────────

    @Test
    @DisplayName("logout blacklists the Bearer token")
    void logout_blacklistsToken() {
        jakarta.servlet.http.HttpServletRequest request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getHeader("Authorization")).thenReturn("Bearer some-jwt");

        // Token expires in 1 hour
        Date exp = new Date(System.currentTimeMillis() + 3_600_000);
        when(jwtTokenProvider.getExpirationDateFromToken("some-jwt")).thenReturn(exp);

        var resp = controller.logout(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        verify(tokenBlacklistService).blacklist(eq("some-jwt"), longThat(ms -> ms > 0 && ms <= 3_600_000));
    }

    @Test
    @DisplayName("logout handles missing Authorization header gracefully")
    void logout_noAuthHeader() {
        jakarta.servlet.http.HttpServletRequest request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getHeader("Authorization")).thenReturn(null);

        var resp = controller.logout(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        verifyNoInteractions(tokenBlacklistService);
    }

    @Test
    @DisplayName("logout handles expired/invalid token gracefully")
    void logout_expiredToken() {
        jakarta.servlet.http.HttpServletRequest request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getHeader("Authorization")).thenReturn("Bearer expired-jwt");
        when(jwtTokenProvider.getExpirationDateFromToken("expired-jwt"))
                .thenThrow(new RuntimeException("expired"));

        var resp = controller.logout(request);

        assertThat(resp.getStatusCode().value()).isEqualTo(200);
        // Token invalid/expired → no blacklist needed
        verifyNoInteractions(tokenBlacklistService);
    }
}
