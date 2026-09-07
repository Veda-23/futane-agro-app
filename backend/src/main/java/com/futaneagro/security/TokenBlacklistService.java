package com.futaneagro.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Hardened JWT token blacklist service.
 *
 * SECURITY IMPROVEMENTS over the original:
 * 1. Stores token + expiry timestamp — blacklist entries auto-expire to prevent
 *    unbounded memory growth (a DoS vector in the old in-memory set).
 * 2. Scheduled cleanup every 15 minutes removes expired entries automatically.
 * 3. Stores only the token's hash (SHA-256) instead of the raw JWT — reduces
 *    exposure if the in-memory store is somehow inspected/leaked.
 * 4. Logs blacklisting events for security audit trail.
 *
 * NOTE: This is still in-process memory. For multi-instance deployments, replace
 * with a Redis-backed store (see security_overhaul_prompt.md §3).
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);

    /**
     * Maps token-hash → expiry time (epoch millis).
     * Entry is considered valid (blacklisted) only until its expiry.
     */
    private final ConcurrentHashMap<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Add a token to the blacklist.
     * @param token  Raw JWT (with or without "Bearer " prefix)
     * @param expiryMs Epoch millis when the token naturally expires — blacklist entry
     *                 is kept until this time to avoid false positives.
     */
    public void blacklistToken(String token, long expiryMs) {
        String raw = stripBearer(token);
        if (raw == null || raw.isBlank()) return;

        String hash = sha256Hex(raw);
        blacklistedTokens.put(hash, expiryMs);
        log.info("JWT blacklisted (hash={}...)", hash.substring(0, 8));
    }

    /**
     * Backwards-compat overload — blacklists with a 24-hour default TTL.
     * Prefer the two-arg version where token expiry is known.
     */
    public void blacklistToken(String token) {
        blacklistToken(token, System.currentTimeMillis() + 86_400_000L);
    }

    /**
     * Returns true if the token is on the blacklist and the entry hasn't expired.
     */
    public boolean isBlacklisted(String token) {
        String raw = stripBearer(token);
        if (raw == null || raw.isBlank()) return false;

        String hash = sha256Hex(raw);
        Long expiry = blacklistedTokens.get(hash);
        if (expiry == null) return false;

        // Auto-remove stale entry on check (lazy cleanup)
        if (System.currentTimeMillis() > expiry) {
            blacklistedTokens.remove(hash);
            return false;
        }
        return true;
    }

    /**
     * Scheduled cleanup — runs every 15 minutes to evict entries whose
     * natural JWT expiry has passed. Prevents unbounded memory growth.
     */
    @Scheduled(fixedRate = 900_000)
    public void evictExpiredEntries() {
        long now = System.currentTimeMillis();
        int before = blacklistedTokens.size();
        blacklistedTokens.entrySet().removeIf(e -> e.getValue() < now);
        int removed = before - blacklistedTokens.size();
        if (removed > 0) {
            log.debug("Blacklist cleanup: removed {} expired entries, {} remaining", removed, blacklistedTokens.size());
        }
    }

    public int blacklistSize() {
        return blacklistedTokens.size();
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private String stripBearer(String token) {
        if (token == null) return null;
        return token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
    }

    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed to be available in any JVM
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
