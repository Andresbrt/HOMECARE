package com.homecare.security;

import com.homecare.common.exception.AuthException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests para {@link SupabaseJwtValidator}.
 *
 * Se generan tokens reales con JJWT firmados con el mismo secret
 * que usa el validador, para verificar la integración completa.
 */
@DisplayName("SupabaseJwtValidator")
class SupabaseJwtValidatorTest {

    // 64 chars = 64 bytes; HMAC-SHA256 requiere mínimo 32 bytes
    private static final String TEST_SECRET =
            "supabase-test-jwt-secret-64chars-long-for-hmac-sha256-testing-ok!";
    private static final String DIFFERENT_SECRET =
            "wrong-secret-totally-different-from-test-one-64-chars-long-paddd!";

    private static final String TEST_UUID  = "550e8400-e29b-41d4-a716-446655440000";
    private static final String TEST_EMAIL = "usuario@homecare.com";

    private SupabaseJwtValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SupabaseJwtValidator(TEST_SECRET);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String buildToken(String subject, String email, Date expiration) {
        return Jwts.builder()
                .subject(subject)
                .claim("email", email)
                .claim("role", "authenticated")
                .claim("aud", "authenticated")
                .issuedAt(new Date())
                .expiration(expiration)
                .signWith(Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private Date future() {
        return new Date(System.currentTimeMillis() + 86_400_000L); // +24h
    }

    private Date past() {
        return new Date(System.currentTimeMillis() - 1_000L); // -1s (expirado)
    }

    // ─── isValid() ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("isValid()")
    class IsValid {

        @Test
        @DisplayName("retorna true con token válido y no expirado")
        void validToken_returnsTrue() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, future());

            assertThat(validator.isValid(token)).isTrue();
        }

        @Test
        @DisplayName("retorna false con token expirado")
        void expiredToken_returnsFalse() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, past());

            assertThat(validator.isValid(token)).isFalse();
        }

        @Test
        @DisplayName("retorna false cuando está firmado con un secret diferente")
        void wrongSecret_returnsFalse() {
            String token = Jwts.builder()
                    .subject(TEST_UUID)
                    .expiration(future())
                    .signWith(Keys.hmacShaKeyFor(DIFFERENT_SECRET.getBytes(StandardCharsets.UTF_8)))
                    .compact();

            assertThat(validator.isValid(token)).isFalse();
        }

        @ParameterizedTest
        @DisplayName("retorna false con token mal formado")
        @ValueSource(strings = {"not.a.jwt", "random-string", "header.payload", "", "   "})
        void malformedToken_returnsFalse(String malformed) {
            assertThat(validator.isValid(malformed)).isFalse();
        }

        @Test
        @DisplayName("retorna false cuando el validador se construye con secret en blanco")
        void blankSecret_rejectsValidToken() {
            // El validador usa un placeholder cuando el secret está en blanco
            SupabaseJwtValidator blankSecretValidator = new SupabaseJwtValidator("");
            String token = buildToken(TEST_UUID, TEST_EMAIL, future());

            // Token firmado con TEST_SECRET; placeholder es distinto → firma inválida
            assertThat(blankSecretValidator.isValid(token)).isFalse();
        }
    }

    // ─── extractSubject() ────────────────────────────────────────────────────

    @Nested
    @DisplayName("extractSubject()")
    class ExtractSubject {

        @Test
        @DisplayName("retorna el UUID correcto desde el claim 'sub'")
        void validToken_returnsUuid() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, future());

            assertThat(validator.extractSubject(token)).isEqualTo(TEST_UUID);
        }

        @Test
        @DisplayName("lanza AuthException si el token está expirado")
        void expiredToken_throwsAuthException() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, past());

            assertThatThrownBy(() -> validator.extractSubject(token))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("expirado");
        }

        @Test
        @DisplayName("lanza AuthException si la firma es inválida")
        void wrongSignature_throwsAuthException() {
            String token = Jwts.builder()
                    .subject(TEST_UUID)
                    .expiration(future())
                    .signWith(Keys.hmacShaKeyFor(DIFFERENT_SECRET.getBytes(StandardCharsets.UTF_8)))
                    .compact();

            assertThatThrownBy(() -> validator.extractSubject(token))
                    .isInstanceOf(AuthException.class);
        }
    }

    // ─── extractEmail() ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("extractEmail()")
    class ExtractEmail {

        @Test
        @DisplayName("retorna el email correcto desde el claim 'email'")
        void validToken_returnsEmail() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, future());

            assertThat(validator.extractEmail(token)).isEqualTo(TEST_EMAIL);
        }

        @Test
        @DisplayName("retorna null cuando el claim email no está presente (login con teléfono)")
        void tokenWithoutEmail_returnsNull() {
            String token = Jwts.builder()
                    .subject(TEST_UUID)
                    .claim("role", "authenticated")
                    .expiration(future())
                    .signWith(Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8)))
                    .compact();

            assertThat(validator.extractEmail(token)).isNull();
        }
    }

    // ─── isExpired() ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("isExpired()")
    class IsExpired {

        @Test
        @DisplayName("retorna false para token con expiración futura")
        void notExpiredToken_returnsFalse() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, future());

            assertThat(validator.isExpired(token)).isFalse();
        }

        @Test
        @DisplayName("retorna true para token expirado")
        void expiredToken_returnsTrue() {
            String token = buildToken(TEST_UUID, TEST_EMAIL, past());

            assertThat(validator.isExpired(token)).isTrue();
        }
    }
}
