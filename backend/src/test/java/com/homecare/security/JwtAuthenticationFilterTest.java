package com.homecare.security;

import com.homecare.domain.common.service.TokenBlacklistService;
import com.homecare.domain.user.model.Rol;
import com.homecare.domain.user.model.Usuario;
import com.homecare.domain.user.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests para {@link JwtAuthenticationFilter}.
 *
 * Verifica el flujo de doble validación:
 * 1) Backend JWT → autenticado con Long userId
 * 2) Supabase JWT (fallback) → autenticado con supabase_uid
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter")
class JwtAuthenticationFilterTest {

    @Mock private JwtTokenProvider         jwtTokenProvider;
    @Mock private CustomUserDetailsService customUserDetailsService;
    @Mock private TokenBlacklistService    tokenBlacklistService;
    @Mock private SupabaseJwtValidator     supabaseJwtValidator;
    @Mock private UsuarioRepository        usuarioRepository;
    @Mock private FilterChain              filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private MockHttpServletRequest  request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request  = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ─── Sin token ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sin header Authorization → no se establece autenticación")
    void noAuthorizationHeader_noAuthentication() throws Exception {
        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtTokenProvider, supabaseJwtValidator);
    }

    @Test
    @DisplayName("header Authorization sin 'Bearer ' → no se establece autenticación")
    void authorizationWithoutBearer_noAuthentication() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtTokenProvider, supabaseJwtValidator);
    }

    // ─── Backend JWT ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("backend JWT válido → autenticación establecida, Supabase no invocado")
    void validBackendJwt_setsAuthenticationAndSkipsSupabase() throws Exception {
        String token = "valid-backend-jwt-token";
        request.addHeader("Authorization", "Bearer " + token);

        UserDetails userDetails = buildMockUserDetails();

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(false);
        when(jwtTokenProvider.getUserIdFromToken(token)).thenReturn(42L);
        when(customUserDetailsService.loadUserById(42L)).thenReturn(userDetails);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo(userDetails);
        verify(supabaseJwtValidator, never()).isValid(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("backend JWT en blacklist (logout previo) → no autenticado")
    void blacklistedBackendJwt_noAuthentication() throws Exception {
        String token = "blacklisted-token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(true);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    // ─── Fallback Supabase JWT ────────────────────────────────────────────────

    @Test
    @DisplayName("backend JWT inválido + Supabase JWT válido + usuario registrado → autenticado")
    void supabaseJwt_knownUser_setsAuthentication() throws Exception {
        String token = "supabase-jwt-direct-from-client";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(false);
        when(supabaseJwtValidator.isValid(token)).thenReturn(true);
        when(supabaseJwtValidator.extractSubject(token)).thenReturn("supabase-uid-abc");
        when(usuarioRepository.findBySupabaseUid("supabase-uid-abc"))
                .thenReturn(Optional.of(buildMinimalUsuario("supabase-uid-abc")));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().isAuthenticated()).isTrue();
        verify(filterChain).doFilter(request, response);
        // Nunca debió buscar por userId de backend
        verify(customUserDetailsService, never()).loadUserById(any());
    }

    @Test
    @DisplayName("Supabase JWT válido pero usuario no registrado aún → no autenticado")
    void supabaseJwt_unknownUser_noAuthentication() throws Exception {
        String token = "supabase-jwt-unregistered-user";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(false);
        when(supabaseJwtValidator.isValid(token)).thenReturn(true);
        when(supabaseJwtValidator.extractSubject(token)).thenReturn("new-uid-xyz");
        when(usuarioRepository.findBySupabaseUid("new-uid-xyz")).thenReturn(Optional.empty());

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("token inválido para ambos validadores → no autenticado, chain continúa")
    void invalidForBothValidators_noAuthentication() throws Exception {
        String token = "garbage-token";
        request.addHeader("Authorization", "Bearer " + token);

        when(jwtTokenProvider.validateToken(token)).thenReturn(false);
        when(supabaseJwtValidator.isValid(token)).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        // Si Supabase dice inválido, no debe llamar extractSubject
        verify(supabaseJwtValidator, never()).extractSubject(any());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private UserDetails buildMockUserDetails() {
        UserDetails ud = mock(UserDetails.class);
        when(ud.getAuthorities()).thenReturn(List.of());
        return ud;
    }

    private Usuario buildMinimalUsuario(String supabaseUid) {
        Rol rol = new Rol("ROLE_CUSTOMER");
        rol.setId(1L);
        return Usuario.builder()
                .id(1L)
                .email("test@homecare.com")
                .password("hashed-password")
                .nombre("Test")
                .apellido("User")
                .activo(true)
                .verificado(true)
                .supabaseUid(supabaseUid)
                .roles(Set.of(rol))
                .build();
    }
}
