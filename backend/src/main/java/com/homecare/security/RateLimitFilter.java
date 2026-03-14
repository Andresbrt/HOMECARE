package com.homecare.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiting filter with dual backend:
 * <ul>
 *   <li><b>Redis</b> (distributed, multi-instance safe) — used when Redis is available</li>
 *   <li><b>In-memory</b> (fallback) — ConcurrentHashMap when Redis is down</li>
 * </ul>
 *
 * <p>Two tiers:
 * <ul>
 *   <li><b>Auth endpoints</b> ({@code /api/auth/**}): brute-force protection (default 5/min)</li>
 *   <li><b>General API</b>: standard rate limit (default 100/min)</li>
 * </ul>
 */
@Component
@Order(2)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String RATE_LIMIT_PREFIX = "ratelimit:";

    private final int authCapacity;
    private final int generalCapacity;
    private final boolean trustedProxy;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, Bucket> localBuckets = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${security.rate-limit.auth-requests-per-minute:5}") int authCapacity,
            @Value("${security.rate-limit.general-requests-per-minute:100}") int generalCapacity,
            @Value("${security.trusted-proxy:true}") boolean trustedProxy,
            StringRedisTemplate redisTemplate) {
        this.authCapacity = authCapacity;
        this.generalCapacity = generalCapacity;
        this.trustedProxy = trustedProxy;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = IpBlockingFilter.resolveClientIp(request, trustedProxy);
        String path = request.getRequestURI();
        boolean isAuthPath = path.startsWith("/api/auth/");
        String bucketKey = (isAuthPath ? "auth:" : "api:") + ip;
        int capacity = isAuthPath ? authCapacity : generalCapacity;

        boolean allowed;
        try {
            allowed = tryConsumeRedis(bucketKey, capacity);
        } catch (Exception e) {
            // Redis no disponible → fallback a in-memory
            Bucket bucket = localBuckets.computeIfAbsent(bucketKey, k -> newLocalBucket(capacity));
            allowed = bucket.tryConsume(1);
        }

        if (allowed) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("SECURITY | Rate limit exceeded ip={} path={}", ip, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.addHeader("Retry-After", "60");
            response.getWriter().write("{\"error\":\"Too many requests — retry after 60 seconds\"}");
        }
    }

    /**
     * Fixed-window rate limiting via Redis INCR + EXPIRE.
     * Key auto-expires after 60s → no manual cleanup needed.
     */
    private boolean tryConsumeRedis(String bucketKey, int capacity) {
        String key = RATE_LIMIT_PREFIX + bucketKey;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(1));
        }
        return count != null && count <= capacity;
    }

    private Bucket newLocalBucket(int capacityPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacityPerMinute)
                .refillIntervally(capacityPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
