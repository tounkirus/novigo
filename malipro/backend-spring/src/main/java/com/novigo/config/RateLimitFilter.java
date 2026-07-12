package com.novigo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limitation de débit en mémoire sur les endpoints d'authentification (fenêtre fixe par IP).
 * Suffisant en mono-instance ; en cluster, s'appuyer sur Redis (à activer en production).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final NovigoProperties props;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(NovigoProperties props) {
        this.props = props;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !props.getSecurity().isRateLimitEnabled()
                || !request.getRequestURI().startsWith("/api/v1/auth/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String key = clientIp(request);
        long minute = Instant.now().getEpochSecond() / 60;
        Window w = windows.compute(key, (k, cur) -> (cur == null || cur.minute != minute)
                ? new Window(minute) : cur);
        int count = w.counter.incrementAndGet();
        int limit = props.getSecurity().getAuthRequestsPerMinute();
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));
        if (count > limit) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
                    + "\"message\":\"Trop de tentatives, réessayez dans une minute.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private static final class Window {
        final long minute;
        final AtomicInteger counter = new AtomicInteger(0);
        Window(long minute) { this.minute = minute; }
    }
}
