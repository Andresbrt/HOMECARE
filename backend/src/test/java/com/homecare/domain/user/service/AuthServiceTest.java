package com.homecare.domain.user.service;

import com.homecare.dto.AuthDTO;
import com.homecare.common.exception.AuthException;
import com.homecare.common.exception.DuplicateResourceException;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.UserToken;
import com.homecare.domain.user.model.UserTokenType;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UserTokenRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.domain.user.validator.PasswordValidator;
import com.homecare.security.CustomUserDetails;
import com.homecare.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RolRepository rolRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserTokenRepository userTokenRepository;
    @Mock private PasswordValidator passwordValidator;

    @InjectMocks
    private AuthService authService;

    private Rol customerRole;
    private Rol providerRole;

    @BeforeEach
    void setUp() {
        customerRole = new Rol("ROLE_CUSTOMER");
        customerRole.setId(1L);

        providerRole = new Rol("ROLE_SERVICE_PROVIDER");
        providerRole.setId(2L);
    }

    private Usuario buildUsuario() {
        return Usuario.builder()
                .id(1L)
                .email("juan@test.com")
                .password("encoded-pass")
                .nombre("Juan")
                .apellido("Pérez")
                .telefono("3001234567")
                .activo(true)
                .verificado(false)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();
    }

    private AuthDTO.Registro buildRegistro(String rol) {
        return AuthDTO.Registro.builder()
                .email("nuevo@test.com")
                .password("secret123")
                .nombre("Ana")
                .apellido("García")
                .telefono("3109876543")
                .rol(rol)
                .build();
    }

    // ── registro() ───────────────────────────────────────

    @Nested
    @DisplayName("registro()")
    class RegistroTests {

        @Test
        @DisplayName("happy path — customer registration")
        void registro_customer() {
            AuthDTO.Registro req = buildRegistro("CUSTOMER");

            when(usuarioRepository.existsByEmail(req.getEmail())).thenReturn(false);
            when(usuarioRepository.existsByTelefono(req.getTelefono())).thenReturn(false);
            when(passwordEncoder.encode("secret123")).thenReturn("encoded");
            when(rolRepository.findByNombre("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
                Usuario u = inv.getArgument(0);
                u.setId(10L);
                return u;
            });
            when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86_400_000L);

            AuthDTO.LoginResponse response = authService.registro(req);

            assertThat(response.getToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(response.getTipo()).isEqualTo("Bearer");
            assertThat(response.getEmail()).isEqualTo("nuevo@test.com");
            assertThat(response.getRol()).isEqualTo("ROLE_CUSTOMER");
            assertThat(response.getExpiresIn()).isEqualTo(86_400L);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            Usuario saved = captor.getValue();
            assertThat(saved.getPassword()).isEqualTo("encoded");
            assertThat(saved.getActivo()).isTrue();
        }

        @Test
        @DisplayName("provider gets disponible=false and calificacion=0")
        void registro_provider() {
            AuthDTO.Registro req = buildRegistro("SERVICE_PROVIDER");

            when(usuarioRepository.existsByEmail(req.getEmail())).thenReturn(false);
            when(usuarioRepository.existsByTelefono(req.getTelefono())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("encoded");
            when(rolRepository.findByNombre("ROLE_SERVICE_PROVIDER")).thenReturn(Optional.of(providerRole));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
                Usuario u = inv.getArgument(0);
                u.setId(11L);
                return u;
            });
            when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("tok");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("ref");
            when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86_400_000L);

            authService.registro(req);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            Usuario saved = captor.getValue();
            assertThat(saved.getDisponible()).isFalse();
            assertThat(saved.getCalificacionPromedio()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("throws when email already registered")
        void registro_duplicateEmail() {
            AuthDTO.Registro req = buildRegistro("CUSTOMER");
            when(usuarioRepository.existsByEmail(req.getEmail())).thenReturn(true);

            assertThatThrownBy(() -> authService.registro(req))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("ya está registrado");
        }

        @Test
        @DisplayName("throws when phone already registered")
        void registro_duplicatePhone() {
            AuthDTO.Registro req = buildRegistro("CUSTOMER");
            when(usuarioRepository.existsByEmail(req.getEmail())).thenReturn(false);
            when(usuarioRepository.existsByTelefono(req.getTelefono())).thenReturn(true);

            assertThatThrownBy(() -> authService.registro(req))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("ya está asociado");
        }

        @Test
        @DisplayName("throws when role not found")
        void registro_unknownRole() {
            AuthDTO.Registro req = buildRegistro("UNKNOWN");

            when(usuarioRepository.existsByEmail(req.getEmail())).thenReturn(false);
            when(usuarioRepository.existsByTelefono(req.getTelefono())).thenReturn(false);
            when(rolRepository.findByNombre("ROLE_UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.registro(req))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("Rol no encontrado");
        }

        @Test
        @DisplayName("sets geolocation when provided")
        void registro_withLocation() {
            AuthDTO.Registro req = buildRegistro("CUSTOMER");
            req.setLatitud(new BigDecimal("4.624335"));
            req.setLongitud(new BigDecimal("-74.063644"));

            when(usuarioRepository.existsByEmail(any())).thenReturn(false);
            when(usuarioRepository.existsByTelefono(any())).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("enc");
            when(rolRepository.findByNombre(any())).thenReturn(Optional.of(customerRole));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("t");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("r");
            when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(1000L);

            authService.registro(req);

            ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
            verify(usuarioRepository).save(captor.capture());
            assertThat(captor.getValue().getLatitud()).isEqualByComparingTo(new BigDecimal("4.624335"));
            assertThat(captor.getValue().getUltimaUbicacion()).isNotNull();
        }
    }

    // ── login() ──────────────────────────────────────────

    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("happy path — returns tokens")
        void login_success() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("rawpass", "encoded-pass")).thenReturn(true);
            when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("access");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("refresh");
            when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86_400_000L);

            AuthDTO.LoginResponse resp = authService.login("juan@test.com", "rawpass");

            assertThat(resp.getToken()).isEqualTo("access");
            assertThat(resp.getRefreshToken()).isEqualTo("refresh");
            assertThat(resp.getEmail()).isEqualTo("juan@test.com");
            verify(usuarioRepository).save(usuario); // ultimoAcceso updated
        }

        @Test
        @DisplayName("throws BadCredentialsException for unknown email")
        void login_unknownEmail() {
            when(usuarioRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login("ghost@test.com", "pass"))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("throws BadCredentialsException for wrong password")
        void login_wrongPassword() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("wrong", "encoded-pass")).thenReturn(false);

            assertThatThrownBy(() -> authService.login("juan@test.com", "wrong"))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("throws AuthException for inactive account")
        void login_inactiveAccount() {
            Usuario usuario = buildUsuario();
            usuario.setActivo(false);
            when(usuarioRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("rawpass", "encoded-pass")).thenReturn(true);

            assertThatThrownBy(() -> authService.login("juan@test.com", "rawpass"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("inactiva");
        }
    }

    // ── refreshToken() ───────────────────────────────────

    @Nested
    @DisplayName("refreshToken()")
    class RefreshTokenTests {

        @Test
        @DisplayName("happy path — returns new token pair")
        void refreshToken_success() {
            when(jwtTokenProvider.validateToken("valid-refresh")).thenReturn(true);
            when(jwtTokenProvider.getUserIdFromToken("valid-refresh")).thenReturn(1L);
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(jwtTokenProvider.generateToken(any(CustomUserDetails.class))).thenReturn("new-access");
            when(jwtTokenProvider.generateRefreshToken(any(CustomUserDetails.class))).thenReturn("new-refresh");
            when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86_400_000L);

            AuthDTO.LoginResponse resp = authService.refreshToken("valid-refresh");

            assertThat(resp.getToken()).isEqualTo("new-access");
            assertThat(resp.getRefreshToken()).isEqualTo("new-refresh");
        }

        @Test
        @DisplayName("throws when refresh token is invalid")
        void refreshToken_invalid() {
            when(jwtTokenProvider.validateToken("bad")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken("bad"))
                    .isInstanceOf(AuthException.class);
        }

        @Test
        @DisplayName("throws when user not found")
        void refreshToken_userNotFound() {
            when(jwtTokenProvider.validateToken("valid")).thenReturn(true);
            when(jwtTokenProvider.getUserIdFromToken("valid")).thenReturn(999L);
            when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken("valid"))
                    .isInstanceOf(AuthException.class);
        }

        @Test
        @DisplayName("throws when user is inactive")
        void refreshToken_inactiveUser() {
            when(jwtTokenProvider.validateToken("valid")).thenReturn(true);
            when(jwtTokenProvider.getUserIdFromToken("valid")).thenReturn(1L);
            Usuario usuario = buildUsuario();
            usuario.setActivo(false);
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

            assertThatThrownBy(() -> authService.refreshToken("valid"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("inactiva");
        }
    }

    // ── cambiarPassword() ────────────────────────────────

    @Nested
    @DisplayName("cambiarPassword()")
    class CambiarPasswordTests {

        @Test
        @DisplayName("happy path — password updated")
        void cambiarPassword_success() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("oldPass", "encoded-pass")).thenReturn(true);
            when(passwordEncoder.encode("newPass")).thenReturn("new-encoded");

            authService.cambiarPassword(1L, "oldPass", "newPass");

            verify(usuarioRepository).save(usuario);
            assertThat(usuario.getPassword()).isEqualTo("new-encoded");
        }

        @Test
        @DisplayName("throws when current password is wrong")
        void cambiarPassword_wrongCurrent() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("wrong", "encoded-pass")).thenReturn(false);

            assertThatThrownBy(() -> authService.cambiarPassword(1L, "wrong", "newPass"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("incorrecta");
        }

        @Test
        @DisplayName("throws when new password equals current")
        void cambiarPassword_samePrevious() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(passwordEncoder.matches("samePass", "encoded-pass")).thenReturn(true);

            assertThatThrownBy(() -> authService.cambiarPassword(1L, "samePass", "samePass"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("diferente");
        }
    }

    // ── resetearPassword() ───────────────────────────────

    @Nested
    @DisplayName("resetearPassword()")
    class ResetPasswordTests {

        @Test
        @DisplayName("happy path — resets password")
        void resetPassword_success() {
            UserToken mockToken = mock(UserToken.class);
            Usuario usuario = buildUsuario();
            when(userTokenRepository.findByTokenHashAndTokenType("reset-uuid", UserTokenType.PASSWORD_RESET))
                    .thenReturn(Optional.of(mockToken));
            when(mockToken.getUsed()).thenReturn(false);
            when(mockToken.isExpired()).thenReturn(false);
            when(mockToken.getUsuario()).thenReturn(usuario);
            when(passwordEncoder.encode("brand-new")).thenReturn("enc-brand-new");

            authService.resetearPassword("reset-uuid", "brand-new");

            assertThat(usuario.getPassword()).isEqualTo("enc-brand-new");
            verify(usuarioRepository).save(usuario);
            verify(mockToken).setUsed(true);
        }

        @Test
        @DisplayName("throws when reset token is invalid")
        void resetPassword_invalidToken() {
            when(userTokenRepository.findByTokenHashAndTokenType("bad-token", UserTokenType.PASSWORD_RESET))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.resetearPassword("bad-token", "new"))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("inválido o expirado");
        }
    }

    // ── obtenerInfoUsuario() ─────────────────────────────

    @Nested
    @DisplayName("obtenerInfoUsuario()")
    class ObtenerInfoTests {

        @Test
        @DisplayName("returns mapped UsuarioInfo")
        void obtenerInfo_success() {
            Usuario usuario = buildUsuario();
            when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

            AuthDTO.UsuarioInfo info = authService.obtenerInfoUsuario(1L);

            assertThat(info.getId()).isEqualTo(1L);
            assertThat(info.getEmail()).isEqualTo("juan@test.com");
            assertThat(info.getNombre()).isEqualTo("Juan");
            assertThat(info.getRol()).isEqualTo("ROLE_CUSTOMER");
            assertThat(info.getActivo()).isTrue();
        }

        @Test
        @DisplayName("throws when user not found")
        void obtenerInfo_notFound() {
            when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.obtenerInfoUsuario(999L))
                    .isInstanceOf(AuthException.class);
        }
    }
}
