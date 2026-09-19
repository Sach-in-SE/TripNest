package com.tripnest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Sliding-window in-memory rate limiting filter to mitigate brute-force and credential-stuffing attacks
 * on sensitive authentication endpoints and upload resource abuse (OWASP API4: Unrestricted Resource Consumption).
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${tripnest.security.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${tripnest.security.rate-limit.auth-signin:15}")
    private int authSigninLimit;

    @Value("${tripnest.security.rate-limit.admin-login:5}")
    private int adminLoginLimit;

    @Value("${tripnest.security.rate-limit.forgot-password:5}")
    private int forgotPasswordLimit;

    @Value("${tripnest.security.rate-limit.document-upload:15}")
    private int documentUploadLimit;

    @Value("${tripnest.security.rate-limit.memory-upload:15}")
    private int memoryUploadLimit;

    @Autowired(required = false)
    private JwtUtils jwtUtils;

    private Clock clock = Clock.systemUTC();

    private static final long WINDOW_MS = 60_000L; // 1 minute sliding window

    // Key format: endpoint + ":" + clientIdentifier -> Queue of request epoch timestamps
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> requestCounts = new ConcurrentHashMap<>();

    // Package-private test setters
    public void setClock(Clock clock) {
        this.clock = clock;
    }

    public void setDocumentUploadLimit(int documentUploadLimit) {
        this.documentUploadLimit = documentUploadLimit;
    }

    public void setMemoryUploadLimit(int memoryUploadLimit) {
        this.memoryUploadLimit = memoryUploadLimit;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        int limit = getLimitForRequest(method, path);
        if (limit <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIdentifier = extractClientIdentifier(request, path);
        String rateKey = method + ":" + path + ":" + clientIdentifier;
        long now = clock.millis();

        ConcurrentLinkedQueue<Long> timestamps = requestCounts.computeIfAbsent(rateKey, k -> new ConcurrentLinkedQueue<>());

        // Evict expired entries older than sliding window
        while (!timestamps.isEmpty() && timestamps.peek() < now - WINDOW_MS) {
            timestamps.poll();
        }

        if (timestamps.size() >= limit) {
            logger.warn("Rate limit exceeded for client: {} on endpoint: {} (limit: {}/min)", clientIdentifier, path, limit);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");

            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("timestamp", LocalDateTime.now(clock).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            errorBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorBody.put("error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase());
            errorBody.put("message", "Rate limit exceeded. Please wait 1 minute before trying again.");
            errorBody.put("path", path);

            response.getOutputStream().write(objectMapper.writeValueAsBytes(errorBody));
            return;
        }

        timestamps.add(now);

        // Periodic cleanup if map grows excessively
        if (requestCounts.size() > 5000) {
            cleanupExpiredEntries(now);
        }

        filterChain.doFilter(request, response);
    }

    private int getLimitForRequest(String method, String path) {
        if (!"POST".equalsIgnoreCase(method)) {
            return -1;
        }

        if (path.endsWith("/api/auth/signin") || path.equals("/api/auth/signin/")
                || path.endsWith("/api/auth/oauth2/exchange") || path.equals("/api/auth/oauth2/exchange/")) {
            return authSigninLimit;
        }
        if (path.endsWith("/api/admin/auth/login") || path.equals("/api/admin/auth/login/")) {
            return adminLoginLimit;
        }
        if (path.endsWith("/api/auth/forgot-password") || path.equals("/api/auth/forgot-password/")) {
            return forgotPasswordLimit;
        }
        if (path.endsWith("/api/documents/upload") || path.equals("/api/documents/upload/")) {
            return documentUploadLimit;
        }
        if (path.endsWith("/api/memories") || path.equals("/api/memories/")) {
            return memoryUploadLimit;
        }

        return -1;
    }

    private String extractClientIdentifier(HttpServletRequest request, String path) {
        String clientIp = extractClientIp(request);

        // For upload endpoints, prefer authenticated user identity if available
        if (path.contains("/documents/upload") || path.contains("/memories")) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof String && "anonymousUser".equals(auth.getPrincipal()))) {
                return "user:" + auth.getName();
            }
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ") && jwtUtils != null) {
                String jwt = authHeader.substring(7);
                try {
                    if (jwtUtils.validateJwtToken(jwt)) {
                        String username = jwtUtils.getUserNameFromJwtToken(jwt);
                        if (username != null && !username.isBlank()) {
                            return "user:" + username;
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        return clientIp;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            int commaIndex = xForwardedFor.indexOf(',');
            return (commaIndex > 0 ? xForwardedFor.substring(0, commaIndex) : xForwardedFor).trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private void cleanupExpiredEntries(long now) {
        requestCounts.entrySet().removeIf(entry -> {
            ConcurrentLinkedQueue<Long> queue = entry.getValue();
            while (!queue.isEmpty() && queue.peek() < now - WINDOW_MS) {
                queue.poll();
            }
            return queue.isEmpty();
        });
    }

    // Helper method for testing
    public void resetCounts() {
        requestCounts.clear();
    }
}
