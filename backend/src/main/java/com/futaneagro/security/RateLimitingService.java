package com.futaneagro.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Centralized, sliding-window rate limiting service.
 *
 * Protects critical endpoints against brute-force attacks, credential stuffing,
 * and volumetric denial of service.
 *
 * Implements automatic memory eviction every 60 seconds to prevent memory leaks.
 * Integrates with SecurityAuditService to record security incidents.
 */
@Service
public class RateLimitingService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingService.class);

    @Autowired
    private SecurityAuditService auditService;

    public enum Action {
        LOGIN(10, 60_000L),           // 10 attempts / 1 min
        REGISTER(5, 60_000L),        // 5 registrations / 1 min
        OTP_VERIFY(5, 60_000L),        // 5 attempts / 1 min
        PASSWORD_CHANGE(5, 60_000L),   // 5 attempts / 1 min
        REFRESH_TOKEN(15, 60_000L),    // 15 requests / 1 min
        SESSION_VERIFY(30, 60_000L),   // 30 requests / 1 min (anti-fuzzing / anti-DDoS)
        WEBHOOK(60, 60_000L),          // 60 requests / 1 min
        UPLOAD(20, 60_000L),           // 20 uploads / 1 min
        DATA_IMPORT(10, 60_000L);      // 10 imports / 1 min

        public final int maxAttempts;
        public final long windowMs;

        Action(int maxAttempts, long windowMs) {
            this.maxAttempts = maxAttempts;
            this.windowMs = windowMs;
        }
    }

    private static class RateLimitEntry {
        final AtomicInteger count = new AtomicInteger(1);
        volatile long windowStartTime;

        RateLimitEntry(long windowStartTime) {
            this.windowStartTime = windowStartTime;
        }
    }

    // In-memory sliding window cache: Key is "action:identifier"
    private final ConcurrentHashMap<String, RateLimitEntry> rateLimitMap = new ConcurrentHashMap<>();

    /**
     * Check if a request exceeds the allowed rate limit for a given action.
     * @param request HTTP request from which client IP is derived
     * @param action Targeted action
     * @return true if rate limit is exceeded (request should be rejected)
     */
    public boolean isRateLimited(HttpServletRequest request, Action action) {
        String clientIp = getClientIp(request);
        return isRateLimited(clientIp, action, request);
    }

    /**
     * Check if an identifier (IP or username) exceeds the rate limit.
     */
    public boolean isRateLimited(String identifier, Action action, HttpServletRequest request) {
        if (identifier == null || identifier.isBlank()) {
            identifier = "unknown";
        }

        String key = action.name() + ":" + identifier;
        long now = System.currentTimeMillis();

        RateLimitEntry entry = rateLimitMap.compute(key, (k, existing) -> {
            if (existing == null || (now - existing.windowStartTime) > action.windowMs) {
                return new RateLimitEntry(now);
            } else {
                existing.count.incrementAndGet();
                return existing;
            }
        });

        boolean exceeded = entry.count.get() > action.maxAttempts;
        if (exceeded && entry.count.get() == action.maxAttempts + 1) {
            // Log on the first threshold crossing
            log.warn("Rate limit exceeded for action={} identifier={} (limit={}/{}ms)",
                    action.name(), identifier, action.maxAttempts, action.windowMs);
            if (auditService != null) {
                auditService.logRateLimitExceeded(identifier, action.name(), request);
            }
        }

        return exceeded;
    }

    /**
     * Reset rate limit for a specific identifier and action (e.g. on successful login).
     */
    public void reset(String identifier, Action action) {
        if (identifier != null) {
            rateLimitMap.remove(action.name() + ":" + identifier);
        }
    }

    /**
     * Extract client IP safely.
     * When server.forward-headers-strategy=framework is enabled, request.getRemoteAddr()
     * is populated by Spring's ForwardedHeaderFilter with the real client IP.
     */
    public String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";

        // If ForwardedHeaderFilter is active, getRemoteAddr() is the forwarded IP.
        // As a secondary check, inspect X-Forwarded-For if present:
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            String clientIp = xf.split(",")[0].trim();
            // Sanitize against header injection
            if (clientIp.matches("^[0-9a-fA-F.:]+$")) {
                return clientIp;
            }
        }

        String remote = request.getRemoteAddr();
        return (remote != null && !remote.isBlank()) ? remote : "unknown";
    }

    /**
     * Periodic cleanup of expired rate limit entries every 60 seconds.
     * Prevents unbounded heap memory consumption.
     */
    @Scheduled(fixedRate = 60_000)
    public void evictExpiredEntries() {
        long now = System.currentTimeMillis();
        int initialSize = rateLimitMap.size();

        rateLimitMap.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            Action action = getActionFromKey(key);
            long window = (action != null) ? action.windowMs : 60_000L;
            return (now - entry.getValue().windowStartTime) > window;
        });

        int purged = initialSize - rateLimitMap.size();
        if (purged > 0) {
            log.debug("Evicted {} expired rate limit entries. Active count: {}", purged, rateLimitMap.size());
        }
    }

    private Action getActionFromKey(String key) {
        try {
            int colon = key.indexOf(':');
            if (colon != -1) {
                return Action.valueOf(key.substring(0, colon));
            }
        } catch (Exception ignored) {}
        return null;
    }

    public int getActiveLimitCount() {
        return rateLimitMap.size();
    }
}
