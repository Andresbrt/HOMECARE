package com.homecare.domain.user.service;

import com.homecare.common.exception.AuthException;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.RolRepository;
import com.homecare.domain.user.repository.UsuarioRepository;
import com.homecare.dto.AuthDTO;
import com.homecare.security.JwtTokenProvider;
import com.homecare.security.SupabaseJwtValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceSupabaseLoginTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private SupabaseJwtValidator supabaseJwtValidator;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private Rol rolCustomer;
    private Rol rolProvider;

    @BeforeEach
    void setUp() {
        rolCustomer = new Rol();
        rolCustomer.setId(1L);
        rolCustomer.setNombre("ROLE_CUSTOMER");

        rolProvider = new Rol();
        rolProvider.setId(2L);
        rolProvider.setNombre("ROLE_SERVICE_PROVIDER");
    }

    @Test
    @DisplayName("Debe registrar y loguear exitosamente a un nuevo usuario proveniente de Google OAuth")
    void debeRegistrarNuevoUsuarioGoogleExitosamente() {
        String token = "jwt.supabase.google.token";
        String uid = "google-uid-12345";
        String email = "andres.google@gmail.com";

        AuthDTO.SupabaseLogin dto = new AuthDTO.SupabaseLogin();
        dto.setSupabaseToken(token);
        dto.setNombre("Andres");
        dto.setApellido("Bermudez");
        dto.setRol("CUSTOMER");

        when(supabaseJwtValidator.isValid(token)).thenReturn(true);
        when(supabaseJwtValidator.extractSubject(token)).thenReturn(uid);
        when(supabaseJwtValidator.extractEmail(token)).thenReturn(email);

        when(usuarioRepository.findBySupabaseUid(uid)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(rolRepository.findByNombre("ROLE_CUSTOMER")).thenReturn(Optional.of(rolCustomer));

        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario u = invocation.getArgument(0);
            u.setId(100L);
            return u;
        });

        when(jwtTokenProvider.generateToken(any(com.homecare.security.CustomUserDetails.class))).thenReturn("backend-jwt-token");
        when(jwtTokenProvider.generateRefreshToken(any(com.homecare.security.CustomUserDetails.class))).thenReturn("backend-refresh-token");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86400000L);

        AuthDTO.LoginResponse response = authService.loginWithSupabaseToken(dto);

        assertNotNull(response);
        assertEquals("backend-jwt-token", response.getToken());
        assertEquals("andres.google@gmail.com", response.getEmail());
        assertEquals("Andres", response.getNombre());
        assertEquals("CUSTOMER", response.getRol());

        verify(usuarioRepository, atLeastOnce()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Debe iniciar sesión a un usuario existente por su Supabase UID")
    void debeIniciarSesionUsuarioExistente() {
        String token = "jwt.supabase.google.token";
        String uid = "google-uid-existente";
        String email = "cliente@homecare.works";

        Usuario usuarioExistente = new Usuario();
        usuarioExistente.setId(50L);
        usuarioExistente.setEmail(email);
        usuarioExistente.setSupabaseUid(uid);
        usuarioExistente.setNombre("Cliente");
        usuarioExistente.setApellido("Existente");
        usuarioExistente.setActivo(true);
        usuarioExistente.setRoles(new HashSet<>(Set.of(rolCustomer)));

        AuthDTO.SupabaseLogin dto = new AuthDTO.SupabaseLogin();
        dto.setSupabaseToken(token);

        when(supabaseJwtValidator.isValid(token)).thenReturn(true);
        when(supabaseJwtValidator.extractSubject(token)).thenReturn(uid);
        when(supabaseJwtValidator.extractEmail(token)).thenReturn(email);

        when(usuarioRepository.findBySupabaseUid(uid)).thenReturn(Optional.of(usuarioExistente));
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioExistente);

        when(jwtTokenProvider.generateToken(any(com.homecare.security.CustomUserDetails.class))).thenReturn("token-existente");
        when(jwtTokenProvider.generateRefreshToken(any(com.homecare.security.CustomUserDetails.class))).thenReturn("refresh-existente");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(86400000L);

        AuthDTO.LoginResponse response = authService.loginWithSupabaseToken(dto);

        assertNotNull(response);
        assertEquals("token-existente", response.getToken());
        assertEquals(50L, response.getId());
        assertEquals("CUSTOMER", response.getRol());
    }

    @Test
    @DisplayName("Debe lanzar AuthException si el token de Supabase es inválido")
    void debeRechazarTokenInvalido() {
        String tokenInvalido = "token.falso.expirado";
        AuthDTO.SupabaseLogin dto = new AuthDTO.SupabaseLogin();
        dto.setSupabaseToken(tokenInvalido);

        when(supabaseJwtValidator.isValid(tokenInvalido)).thenReturn(false);

        assertThrows(AuthException.class, () -> authService.loginWithSupabaseToken(dto));
        verify(usuarioRepository, never()).save(any());
    }
}
