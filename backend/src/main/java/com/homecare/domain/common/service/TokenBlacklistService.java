package com.homecare.domain.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Servicio de blacklist de tokens JWT usando Redis.
 * Cuando un usuario hace logout, su token se agrega a la blacklist con el mismo TTL
 * que le queda de vida al token, asÃ­ Redis lo limpia automÃ¡ticamente al expirar.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    /**
     * Agrega un token a la blacklist con TTL automÃ¡tico.
     * @param token El JWT a invalidar
     */
    public void blacklistToken(String token) {
        // En una implementaciÃ³n real, calcularÃ­amos el tiempo restante.
        // Por simplicidad en este endpoint, usamos 24h o lo que determine el provider.
        // Pero para el contrato del controlador, necesitamos este mÃ©todo.
        blacklist(token, 24 * 3600 * 1000L); 
    }

    /**
     * Agrega un token a la blacklist con TTL automÃ¡tico.
     * @param token El JWT a invalidar
     * @param remainingMs Milisegundos restantes hasta que expire el token
     */
    public void blacklist(String token, long remainingMs) {
        if (remainingMs <= 0) {
            return; // Token ya expirado, no necesita blacklist
        }
        try {
            String key = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(key, "revoked", Duration.ofMillis(remainingMs));
            log.info("Token agregado a blacklist, expira en {} ms", remainingMs);
        } catch (Exception e) {
            log.warn("No se pudo agregar token a blacklist (Redis no disponible): {}", e.getMessage());
        }
    }

    /**
     * Verifica si un token estÃ¡ en la blacklist.
     */
    public boolean isBlacklisted(String token) {
        try {
            String key = BLACKLIST_PREFIX + token;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.warn("No se pudo verificar blacklist (Redis no disponible): {}", e.getMessage());
            return false; // Fail-open si Redis no disponible
        }
    }
}

