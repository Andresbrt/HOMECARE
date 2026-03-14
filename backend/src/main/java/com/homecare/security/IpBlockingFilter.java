package com.homecare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet filter that rejects requests from blocked IPs.
 *
 * <p>The initial blocklist is loaded from the {@code security.blocked-ips} config property
 * (comma-separated). IPs can also be programmatically blocked at runtime via {@link #blockIp}.
 *
 * <p><strong>Proxy note:</strong> Client IP is resolved from {@code X-Forwarded-For} /
 * {@code X-Real-IP} headers only when a trusted reverse proxy is in front of the server.
 * If the app is directly internet-facing, set {@code security.trusted-proxy: false} and only
 * {@code request.getRemoteAddr()} will be used (not spoofable).
 */
@Component
@Order(1)
@Slf4j
public class IpBlockingFilter extends OncePerRequestFilter {

    private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();
    private final boolean trustedProxy;

    public IpBlockingFilter(
            @Value("${security.blocked-ips:}") String rawBlockedIps,
            @Value("${security.trusted-proxy:true}") boolean trustedProxy) {
        this.trustedProxy = trustedProxy;
        if (rawBlockedIps != null && !rawBlockedIps.isBlank()) {
            for (String ip : rawBlockedIps.split(",")) {
                String trimmed = ip.trim();
                if (!trimmed.isEmpty()) {
                    blockedIps.add(trimmed);
                }
            }
        }
    }

    /** Adds an IP to the runtime blocklist (called by admin API or brute-force detector). */
    public void blockIp(String ip) {
        blockedIps.add(ip);
        log.warn("SECURITY | IP programmatically blocked: {}", ip);
    }

    public void unblockIp(String ip) {
        blockedIps.remove(ip);
    }

    public Set<String> getBlockedIps() {
        return Set.copyOf(blockedIps);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = resolveClientIp(request, trustedProxy);
        if (blockedIps.contains(ip)) {
            log.warn("SECURITY | Blocked request from banned IP={} method={} path={}",
                    ip, request.getMethod(), request.getRequestURI());
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Access denied\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the real client IP address.
     *
     * @param request      the incoming HTTP request
     * @param trustedProxy when {@code true}, checks {@code X-Forwarded-For} and
     *                     {@code X-Real-IP} headers (appropriate when behind nginx/ALB);
     *                     when {@code false}, uses {@code remoteAddr} only.
     */
    public static String resolveClientIp(HttpServletRequest request, boolean trustedProxy) {
        if (trustedProxy) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                return xff.split(",")[0].trim();
            }
            String xReal = request.getHeader("X-Real-IP");
            if (xReal != null && !xReal.isBlank()) {
                return xReal.trim();
            }
        }
        return request.getRemoteAddr();
    }
}
