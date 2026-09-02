package com.homecare.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Spring MVC interceptor that writes structured audit log entries for sensitive endpoints.
 *
 * <p>Uses a dedicated {@code AUDIT} logger so entries can be routed to a separate appender
 * (e.g., a separate file, Splunk, or ELK) by adding the following to {@code logback-spring.xml}:
 * <pre>
 *   &lt;logger name="AUDIT" level="INFO" additivity="false"&gt;
 *     &lt;appender-ref ref="AUDIT_FILE"/&gt;
 *   &lt;/logger&gt;
 * </pre>
 *
 * <p>Audited path prefixes: {@code /api/auth/**}, {@code /api/admin/**},
 * {@code /api/usuarios/**} (password/profile edits).
 *
 * <p>Each log entry contains:
 * {@code method}, {@code path}, {@code status}, {@code ip}, {@code user},
 * {@code durationMs}, {@code ua} (user-agent, truncated to 200 chars).
 */
public class AuditLogInterceptor implements HandlerInterceptor {

    private static final Logger AUDIT = LoggerFactory.getLogger("AUDIT");

    /** Prefixes whose requests are always audit-logged. */
    private static final Set<String> AUDITED_PREFIXES = Set.of(
            "/api/auth/",
            "/api/admin/",
            "/api/usuarios/"
    );

    private static final String ATTR_START = "_audit_ts";

    private final boolean trustedProxy;

    public AuditLogInterceptor(boolean trustedProxy) {
        this.trustedProxy = trustedProxy;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        request.setAttribute(ATTR_START, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        String path = request.getRequestURI();
        if (AUDITED_PREFIXES.stream().noneMatch(path::startsWith)) {
            return;
        }

        Long startTs = (Long) request.getAttribute(ATTR_START);
        long durationMs = startTs != null ? System.currentTimeMillis() - startTs : -1;

        String ip = IpBlockingFilter.resolveClientIp(request, trustedProxy);
        String user = resolveUser();

        AUDIT.info("method={} path={} status={} ip={} user={} durationMs={} ua=\"{}\"",
                request.getMethod(),
                path,
                response.getStatus(),
                ip,
                user,
                durationMs,
                sanitizeHeader(request.getHeader("User-Agent")));

        if (ex != null) {
            AUDIT.error("EXCEPTION method={} path={} ip={} user={} error=\"{}\"",
                    request.getMethod(), path, ip, user, ex.getMessage());
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String resolveUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }

    /** Truncates and sanitises a header value to prevent log injection. */
    private String sanitizeHeader(String value) {
        if (value == null) return "";
        // Strip newlines to prevent log-forging
        String cleaned = value.replace('\n', ' ').replace('\r', ' ');
        return cleaned.length() > 200 ? cleaned.substring(0, 200) + "…" : cleaned;
    }
}
