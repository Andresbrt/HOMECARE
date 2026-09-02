package com.homecare.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homecare.common.exception.AuthException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Valida JWT emitidos por Supabase Auth y extrae sus claims.
 *
 * <p>Estrategia de validación en dos niveles (máxima fiabilidad):
 * <ol>
 *   <li><b>Nivel 1 (Firma local HMAC-SHA256):</b> Si {@code supabase.jwt-secret} está configurado
 *       y coincide, valida instantáneamente en memoria sin latencia de red.</li>
 *   <li><b>Nivel 2 (Validación directa con Supabase Auth API):</b> Si la firma local falla o no
 *       está disponible el secret (común en entornos locales y dev), consulta {@code GET /auth/v1/user}
 *       al servidor oficial de Supabase con el token. Si Supabase responde 200 OK, el token es
 *       100% auténtico y válido.</li>
 * </ol>
 * </p>
 */
@Component
@Slf4j
public class SupabaseJwtValidator {

    private final SecretKey signingKey;
    private final String supabaseUrl;
    private final String supabaseAnonKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Cache en memoria de corta duración para tokens validados vía API (evita llamadas repetitivas)
    private final Map<String, CachedSupabaseUser> tokenCache = new ConcurrentHashMap<>();

    private record CachedSupabaseUser(String id, String email, long expiresAtMillis) {}

    public SupabaseJwtValidator(String supabaseJwtSecret, String activeProfile) {
        this(supabaseJwtSecret, "https://placeholder.supabase.co", "", activeProfile, new ObjectMapper());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public SupabaseJwtValidator(
            @Value("${supabase.jwt-secret:}") String supabaseJwtSecret,
            @Value("${supabase.url:https://mowqzkjbggfqfrnxgobn.supabase.co}") String supabaseUrl,
            @Value("${supabase.anon-key:}") String supabaseAnonKey,
            @Value("${spring.profiles.active:dev}") String activeProfile,
            ObjectMapper objectMapper) {

        this.supabaseUrl = supabaseUrl != null ? supabaseUrl.replaceAll("/$", "") : "";
        this.supabaseAnonKey = supabaseAnonKey != null ? supabaseAnonKey : "";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        if (supabaseJwtSecret == null || supabaseJwtSecret.isBlank()) {
            boolean isProduction = activeProfile.contains("production") || activeProfile.contains("prod");
            if (isProduction) {
                log.warn("SUPABASE_JWT_SECRET no configurado en producción — se usará verificación directa contra Supabase Auth API.");
            } else {
                log.info("supabase.jwt-secret no configurado en dev — fallback a verificación directa Supabase API.");
            }
            this.signingKey = Keys.hmacShaKeyFor(
                    "placeholder-dev-only-not-valid-for-production-env-change-me".getBytes(StandardCharsets.UTF_8));
        } else {
            this.signingKey = Keys.hmacShaKeyFor(
                    supabaseJwtSecret.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Verifica si el token emitido por Supabase es válido y no está expirado.
     */
    public boolean isValid(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        // 1. Intentar validación local por firma
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.debug("Token Supabase expirado");
            return false;
        } catch (SignatureException | MalformedJwtException ex) {
            log.debug("Firma local no verificada (posible secret distinto): {}. Intentando verificación remota en Supabase...", ex.getMessage());
        } catch (Exception ex) {
            log.debug("Error validando localmente token Supabase: {}", ex.getMessage());
        }

        // 2. Fallback de alta disponibilidad: Verificación directa contra Supabase Auth API
        CachedSupabaseUser remoteUser = verifyWithSupabaseApi(token);
        return remoteUser != null;
    }

    /**
     * Extrae el UUID de {@code auth.users} desde el claim {@code sub} o de la API de Supabase.
     */
    public String extractSubject(String token) {
        try {
            Claims claims = parseToken(token);
            String sub = claims.getSubject();
            if (sub != null && !sub.isBlank()) {
                return sub;
            }
        } catch (ExpiredJwtException ex) {
            throw new AuthException("Token Supabase expirado. Por favor, inicia sesión nuevamente.");
        } catch (SignatureException | MalformedJwtException ex) {
            CachedSupabaseUser user = verifyWithSupabaseApi(token);
            if (user != null && user.id() != null) {
                return user.id();
            }
            throw new AuthException("Token Supabase inválido: firma no verificada.");
        } catch (Exception ex) {
            CachedSupabaseUser user = verifyWithSupabaseApi(token);
            if (user != null && user.id() != null) {
                return user.id();
            }
            throw new AuthException("Error procesando token: " + ex.getMessage());
        }

        CachedSupabaseUser user = verifyWithSupabaseApi(token);
        if (user != null && user.id() != null) {
            return user.id();
        }

        throw new AuthException("Token Supabase no contiene claim 'sub' válido");
    }

    /**
     * Extrae el email del claim {@code email} o de la API de Supabase.
     */
    public String extractEmail(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("email", String.class);
        } catch (ExpiredJwtException ex) {
            throw new AuthException("Token Supabase expirado. Por favor, inicia sesión nuevamente.");
        } catch (SignatureException | MalformedJwtException ex) {
            CachedSupabaseUser user = verifyWithSupabaseApi(token);
            if (user != null) {
                return user.email();
            }
            throw new AuthException("Token Supabase inválido: firma no verificada.");
        } catch (Exception ex) {
            CachedSupabaseUser user = verifyWithSupabaseApi(token);
            if (user != null) {
                return user.email();
            }
            throw new AuthException("Error procesando token: " + ex.getMessage());
        }
    }

    /**
     * Extrae todos los claims parseados.
     */
    public Claims extractAllClaims(String token) {
        return parseSafely(token);
    }

    /**
     * Verifica expiración del token.
     */
    public boolean isExpired(String token) {
        try {
            Date exp = parseToken(token).getExpiration();
            return exp != null && exp.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            CachedSupabaseUser user = verifyWithSupabaseApi(token);
            return user == null;
        }
    }

    // ─── Verificación remota con Supabase Auth API ──────────────────────────────

    private CachedSupabaseUser verifyWithSupabaseApi(String token) {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            return null;
        }

        // Revisar cache
        CachedSupabaseUser cached = tokenCache.get(token);
        if (cached != null && System.currentTimeMillis() < cached.expiresAtMillis()) {
            return cached;
        }

        try {
            String endpoint = supabaseUrl + "/auth/v1/user";
            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(6))
                    .header("Authorization", "Bearer " + token)
                    .GET();

            if (supabaseAnonKey != null && !supabaseAnonKey.isBlank()) {
                reqBuilder.header("apikey", supabaseAnonKey);
            }

            HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String id = root.path("id").asText(null);
                String email = root.path("email").asText(null);

                if (id != null && !id.isBlank()) {
                    // Cachear por 5 minutos
                    CachedSupabaseUser user = new CachedSupabaseUser(id, email, System.currentTimeMillis() + 300_000);
                    tokenCache.put(token, user);
                    log.info("Token de Supabase validado exitosamente contra Supabase Auth API (sub={})", id);
                    return user;
                }
            } else {
                log.warn("Supabase Auth API rechazó el token — status={}", response.statusCode());
            }
        } catch (Exception ex) {
            log.error("Error consultando Supabase Auth API para validar token: {}", ex.getMessage());
        }

        return null;
    }

    // ─── Helpers locales ─────────────────────────────────────────────────────────

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
            throw new AuthException("Token Supabase expirado. Por favor, inicia sesión nuevamente.");
        } catch (SignatureException | MalformedJwtException ex) {
            // Si la firma local no concuerda pero la API lo valida:
            CachedSupabaseUser remote = verifyWithSupabaseApi(token);
            if (remote != null) {
                // Crear claims sintéticos mínimos
                return Jwts.claims()
                        .subject(remote.id())
                        .add("email", remote.email())
                        .build();
            }
            throw new AuthException("Token Supabase inválido: firma no verificada.");
        } catch (Exception ex) {
            throw new AuthException("Error procesando token de autenticación: " + ex.getMessage());
        }
    }

    private String extractClaimFromUnverifiedPayload(String token, String claimKey) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                JsonNode node = objectMapper.readTree(payloadJson);
                JsonNode claimNode = node.get(claimKey);
                if (claimNode != null && !claimNode.isNull()) {
                    return claimNode.asText();
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
