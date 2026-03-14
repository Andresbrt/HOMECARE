package com.homecare.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private TokenBlacklistService tokenBlacklistService;

    private static final String TOKEN = "eyJhbGciOiJIUzI1NiJ9.test.signature";
    private static final String EXPECTED_KEY = "jwt:blacklist:" + TOKEN;

    // ── blacklist() ──────────────────────────────────────

    @Test
    @DisplayName("blacklist stores token in Redis with correct TTL")
    void blacklist_storesWithTtl() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        tokenBlacklistService.blacklist(TOKEN, 60_000L);

        verify(valueOps).set(eq(EXPECTED_KEY), eq("revoked"), eq(Duration.ofMillis(60_000)));
    }

    @Test
    @DisplayName("blacklist skips already-expired token (remainingMs <= 0)")
    void blacklist_skipsExpired() {
        tokenBlacklistService.blacklist(TOKEN, 0L);

        verifyNoInteractions(redisTemplate);
    }

    @Test
    @DisplayName("blacklist skips negative remaining time")
    void blacklist_skipsNegative() {
        tokenBlacklistService.blacklist(TOKEN, -100L);

        verifyNoInteractions(redisTemplate);
    }

    @Test
    @DisplayName("blacklist swallows Redis exception gracefully")
    void blacklist_redisDown() {
        when(redisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("connection refused"));

        assertThatCode(() -> tokenBlacklistService.blacklist(TOKEN, 60_000L))
                .doesNotThrowAnyException();
    }

    // ── isBlacklisted() ──────────────────────────────────

    @Test
    @DisplayName("isBlacklisted returns true when key exists")
    void isBlacklisted_exists() {
        when(redisTemplate.hasKey(EXPECTED_KEY)).thenReturn(Boolean.TRUE);

        assertThat(tokenBlacklistService.isBlacklisted(TOKEN)).isTrue();
    }

    @Test
    @DisplayName("isBlacklisted returns false when key missing")
    void isBlacklisted_missing() {
        when(redisTemplate.hasKey(EXPECTED_KEY)).thenReturn(Boolean.FALSE);

        assertThat(tokenBlacklistService.isBlacklisted(TOKEN)).isFalse();
    }

    @Test
    @DisplayName("isBlacklisted fail-open: returns false when Redis unavailable")
    void isBlacklisted_failOpen() {
        when(redisTemplate.hasKey(EXPECTED_KEY))
                .thenThrow(new RedisConnectionFailureException("connection refused"));

        assertThat(tokenBlacklistService.isBlacklisted(TOKEN)).isFalse();
    }
}
