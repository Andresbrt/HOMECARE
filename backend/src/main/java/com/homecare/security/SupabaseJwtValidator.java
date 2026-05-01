package com.homecare.security;

import com.homecare.common.exception.AuthException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Valida JWT emitidos por Supabase Auth y extrae sus claims.
 *
 * <p>Supabase firma sus tokens con HMAC-SHA256 usando el "JWT Secret" del proyecto
 * (Supabase Dashboard → Settings → API → JWT Secret).
 * Este secret es diferente al secret del backend (jwt.secret).</p>
 *
 * <p>Claims relevantes del JWT de Supabase:
 * <ul>
 *   <li>{@code sub} — UUID del usuario en {@code auth.users}</li>
 *   <li>{@code email} — Correo del usuario</li>
 *   <li>{@code role} — Siempre {@code "authenticated"} para usuarios logueados</li>
 *   <li>{@code aud} — {@code "authenticated"}</li>
 *   <li>{@code iss} — {@code "https://<project>.supabase.co/auth/v1"}</li>
 * </ul>
 * </p>
 */
@Component
@Slf4j
public class SupabaseJwtValidator {

    private final SecretKey signingKey;

    public SupabaseJwtValidator(
            @Value("${supabase.jwt-secret:}") String supabaseJwtSecret) {

        if (supabaseJwtSecret == null || supabaseJwtSecret.isBlank()) {
            // Clave placeholder; el validador lanzará AuthException hasta que se configure.
            log.warn("supabase.jwt-secret no está configurado. " +
                     "Los tokens de Supabase no podrán validarse directamente. " +
                     "Configura SUPABASE_JWT_SECRET en las variables de entorno.");
            this.signingKey = Keys.hmacShaKeyFor(
                    "placeholder-not-configured-change-this-value-in-env".getBytes(StandardCharsets.UTF_8));
        } else {
            this.signingKey = Keys.hmacShaKeyFor(
                    supabaseJwtSecret.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Verifica la firma y la expiración del JWT de Supabase.
     *
     * @param token Token JWT emitido por Supabase Auth
     * @return {@code true} si el token es válido y no está expirado
     */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.debug("Token Supabase expirado");
        } catch (SignatureException ex) {
            log.debug("Firma de token Supabase inválida (¿secret incorrecto o token del backend?)");
        } catch (MalformedJwtException ex) {
            log.debug("Token Supabase mal formado");
        } catch (Exception ex) {
            log.debug("Error validando token Supabase: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Extrae el UUID de {@code auth.users} desde el claim {@code sub}.
     *
     * @param token Token JWT válido de Supabase
     * @return UUID del usuario (ej: "550e8400-e29b-41d4-a716-446655440000")
     * @throws AuthException si el token es inválido o el claim sub está ausente
     */
    public String extractSubject(String token) {
        Claims claims = parseSafely(token);
        String sub = claims.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new AuthException("Token Supabase no contiene claim 'sub'");
        }
        return sub;
    }

    /**
     * Extrae el email del claim {@code email}.
     *
     * @param token Token JWT válido de Supabase
     * @return Email del usuario, o {@code null} si no está presente (login con teléfono)
     */
    public String extractEmail(String token) {
        return parseSafely(token).get("email", String.class);
    }

    /**
     * Extrae todos los claims (para uso en {@link #extractSubject} y {@link #extractEmail} internamente).
     */
    public Claims extractAllClaims(String token) {
        return parseSafely(token);
    }

    /**
     * Verifica que el token no está expirado comprobando la fecha {@code exp}.
     */
    public boolean isExpired(String token) {
        try {
            Date exp = parseToken(token).getExpiration();
            return exp != null && exp.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Claims parseSafely(String token) {
        try {
            return parseToken(token);
        } catch (ExpiredJwtException ex) {
            // Retornar los claims aunque esté expirado (útil para logging)
            throw new AuthException("Token Supabase expirado. Por favor, inicia sesión nuevamente.");
        } catch (SignatureException | MalformedJwtException ex) {
            throw new AuthException("Token Supabase inválido: firma no verificada.");
        } catch (Exception ex) {
            throw new AuthException("Error procesando token de autenticación: " + ex.getMessage());
        }
    }
}
