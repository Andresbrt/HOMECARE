package com.homecare.security;

import com.homecare.model.Rol;
import com.homecare.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // 256-bit BASE64-encoded secret for HMAC-SHA
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LWZvci1ob21lY2FyZS1hcHBsaWNhdGlvbi10ZXN0aW5nLW9ubHk=";
    private static final long EXPIRATION_MS = 86_400_000L;       // 24h
    private static final long REFRESH_EXPIRATION_MS = 604_800_000L; // 7d

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", EXPIRATION_MS);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpirationMs", REFRESH_EXPIRATION_MS);
    }

    private CustomUserDetails buildUserDetails() {
        Rol rol = new Rol("ROLE_CUSTOMER");
        rol.setId(1L);
        Usuario usuario = Usuario.builder()
                .id(42L)
                .email("test@homecare.com")
                .password("hashed")
                .nombre("Juan")
                .apellido("Pérez")
                .activo(true)
                .verificado(false)
                .roles(Set.of(rol))
                .build();
        return new CustomUserDetails(usuario);
    }

    // ── Token generation ─────────────────────────────────

    @Test
    @DisplayName("generateToken returns non-blank JWT")
    void generateToken_returnsJwt() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature
    }

    @Test
    @DisplayName("generateRefreshToken returns non-blank JWT")
    void generateRefreshToken_returnsJwt() {
        String token = jwtTokenProvider.generateRefreshToken(buildUserDetails());

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    // ── Claim extraction ─────────────────────────────────

    @Test
    @DisplayName("getUserIdFromToken returns correct ID")
    void getUserIdFromToken_correctId() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        Long id = jwtTokenProvider.getUserIdFromToken(token);

        assertThat(id).isEqualTo(42L);
    }

    @Test
    @DisplayName("getEmailFromToken returns correct email")
    void getEmailFromToken_correctEmail() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        String email = jwtTokenProvider.getEmailFromToken(token);

        assertThat(email).isEqualTo("test@homecare.com");
    }

    @Test
    @DisplayName("getExpirationDateFromToken returns future date")
    void getExpirationDate_isFuture() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        assertThat(jwtTokenProvider.getExpirationDateFromToken(token))
                .isInTheFuture();
    }

    // ── Validation ───────────────────────────────────────

    @Test
    @DisplayName("validateToken returns true for valid token")
    void validateToken_valid() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateToken returns false for garbage")
    void validateToken_garbage() {
        assertThat(jwtTokenProvider.validateToken("not.a.jwt")).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for tampered token")
    void validateToken_tampered() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());
        String tampered = token.substring(0, token.length() - 4) + "xxxx";

        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for empty string")
    void validateToken_empty() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }

    // ── Expiration ───────────────────────────────────────

    @Test
    @DisplayName("isTokenExpired returns false for fresh token")
    void isTokenExpired_freshToken() {
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        assertThat(jwtTokenProvider.isTokenExpired(token)).isFalse();
    }

    @Test
    @DisplayName("isTokenExpired returns true for expired token")
    void isTokenExpired_expiredToken() {
        // Generate with 0ms expiration → already expired
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 0L);
        String token = jwtTokenProvider.generateToken(buildUserDetails());

        assertThat(jwtTokenProvider.isTokenExpired(token)).isTrue();
    }

    // ── Password reset token ─────────────────────────────

    @Test
    @DisplayName("generatePasswordResetToken creates valid token with correct user ID")
    void passwordResetToken() {
        String token = jwtTokenProvider.generatePasswordResetToken(42L);

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(42L);
    }

    // ── Misc ─────────────────────────────────────────────

    @Test
    @DisplayName("getJwtExpirationMs returns configured value")
    void expirationMs() {
        assertThat(jwtTokenProvider.getJwtExpirationMs()).isEqualTo(EXPIRATION_MS);
    }

    @Test
    @DisplayName("Different users produce different tokens")
    void differentUsersProduceDifferentTokens() {
        CustomUserDetails user1 = buildUserDetails();

        Rol rol = new Rol("ROLE_SERVICE_PROVIDER");
        rol.setId(2L);
        Usuario usuario2 = Usuario.builder()
                .id(99L)
                .email("other@homecare.com")
                .password("hashed")
                .nombre("Ana")
                .apellido("García")
                .activo(true)
                .verificado(true)
                .roles(Set.of(rol))
                .build();
        CustomUserDetails user2 = new CustomUserDetails(usuario2);

        String token1 = jwtTokenProvider.generateToken(user1);
        String token2 = jwtTokenProvider.generateToken(user2);

        assertThat(token1).isNotEqualTo(token2);
    }
}
