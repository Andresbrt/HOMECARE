package com.homecare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        // 5 auth req/min, 100 general req/min, no trusted proxy
        filter = new RateLimitFilter(5, 100, false, redisTemplate);
    }

    private void mockRequestIp(String ip) {
        when(request.getRemoteAddr()).thenReturn(ip);
    }

    // ── Allowed requests ─────────────────────────────────

    @Test
    @DisplayName("allows request when Redis counter is under limit")
    void allows_underLimit() throws Exception {
        mockRequestIp("192.168.1.1");
        when(request.getRequestURI()).thenReturn("/api/users");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(anyInt());
    }

    @Test
    @DisplayName("allows auth request at exactly the limit (5th request)")
    void allows_atAuthLimit() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(5L); // capacity = 5

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    // ── Blocked requests ─────────────────────────────────

    @Test
    @DisplayName("blocks auth request exceeding limit (6th)")
    void blocks_authExceeded() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(6L); // > 5

        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, never()).doFilter(any(), any());
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(response).addHeader("Retry-After", "60");
        assertThat(body.toString()).contains("Too many requests");
    }

    @Test
    @DisplayName("blocks general API request exceeding 100/min")
    void blocks_generalExceeded() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/solicitudes");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(101L); // > 100

        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, never()).doFilter(any(), any());
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    // ── Redis key management ─────────────────────────────

    @Test
    @DisplayName("sets EXPIRE on first request (count == 1)")
    void setsExpire_onFirstRequest() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/users");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        filter.doFilterInternal(request, response, filterChain);

        verify(redisTemplate).expire(anyString(), any());
    }

    @Test
    @DisplayName("does NOT set EXPIRE on subsequent requests (count > 1)")
    void noExpire_onSubsequentRequests() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/users");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(2L);

        filter.doFilterInternal(request, response, filterChain);

        verify(redisTemplate, never()).expire(anyString(), any());
    }

    // ── Key prefix separation ────────────────────────────

    @Test
    @DisplayName("uses 'auth:' prefix for auth endpoints")
    void authPrefix() throws Exception {
        mockRequestIp("1.2.3.4");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(startsWith("ratelimit:auth:"))).thenReturn(1L);

        filter.doFilterInternal(request, response, filterChain);

        verify(valueOps).increment(eq("ratelimit:auth:1.2.3.4"));
    }

    @Test
    @DisplayName("uses 'api:' prefix for non-auth endpoints")
    void apiPrefix() throws Exception {
        mockRequestIp("1.2.3.4");
        when(request.getRequestURI()).thenReturn("/api/solicitudes");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(startsWith("ratelimit:api:"))).thenReturn(1L);

        filter.doFilterInternal(request, response, filterChain);

        verify(valueOps).increment(eq("ratelimit:api:1.2.3.4"));
    }

    // ── Redis fallback ───────────────────────────────────

    @Test
    @DisplayName("falls back to in-memory bucket when Redis is down")
    void fallback_redisDown() throws Exception {
        mockRequestIp("10.0.0.1");
        when(request.getRequestURI()).thenReturn("/api/users");
        when(redisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response); // first request passes
    }

    @Test
    @DisplayName("in-memory fallback also rate-limits after capacity")
    void fallback_rateLimit() throws Exception {
        mockRequestIp("192.168.1.100");
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(redisTemplate.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));

        // First 5 should pass (auth capacity = 5)
        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        // 6th should be blocked
        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(5)).doFilter(request, response);
        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }
}
