package com.futaneagro.security;

import com.futaneagro.entity.SecurityAuditLog;
import com.futaneagro.entity.SecurityAuditLog.EventType;
import com.futaneagro.entity.SecurityAuditLog.Severity;
import com.futaneagro.repository.SecurityAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.time.Instant;

/**
 * Async security audit logging service.
 *
 * All methods are @Async — audit logging never blocks the request thread.
 * Uses fire-and-forget. A failure here must NEVER affect business logic.
 *
 * Events are stored in the security_audit_logs table (immutable by policy)
 * and also written to SLF4J for log aggregation (Loki/ELK).
 */
@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);

    @Autowired
    private SecurityAuditLogRepository auditLogRepository;

    @Async
    public void logLoginSuccess(String username, HttpServletRequest request) {
        persist(EventType.LOGIN_SUCCESS, Severity.INFO, username, request,
            "Successful 2FA login completed", null);
    }

    @Async
    public void logLoginFailed(String username, String reason, HttpServletRequest request) {
        persist(EventType.LOGIN_FAILED, Severity.MEDIUM, username, request,
            "Login failed: " + reason, null);
    }

    @Async
    public void logOtpFailed(String username, HttpServletRequest request) {
        persist(EventType.LOGIN_OTP_FAILED, Severity.MEDIUM, username, request,
            "OTP verification failed — invalid or expired OTP", null);
    }

    @Async
    public void logAccountLocked(String username, int attempts, HttpServletRequest request) {
        persist(EventType.ACCOUNT_LOCKED, Severity.HIGH, username, request,
            "Account locked after " + attempts + " failed login attempts", null);
    }

    @Async
    public void logAccountUnlocked(String unlockedBy, String targetUser, HttpServletRequest request) {
        persist(EventType.ACCOUNT_UNLOCKED, Severity.MEDIUM, unlockedBy, request,
            "Account manually unlocked for user: " + targetUser, targetUser);
    }

    @Async
    public void logPasswordChanged(String username, HttpServletRequest request) {
        persist(EventType.PASSWORD_CHANGED, Severity.MEDIUM, username, request,
            "Password changed successfully", null);
    }

    @Async
    public void logTokenBlacklisted(String username, HttpServletRequest request) {
        persist(EventType.TOKEN_BLACKLISTED, Severity.INFO, username, request,
            "JWT token blacklisted on logout", null);
    }

    @Async
    public void logAccessDenied(String username, String uri, HttpServletRequest request) {
        persist(EventType.ACCESS_DENIED, Severity.HIGH, username, request,
            "Access denied — insufficient role for: " + uri, uri);
    }

    @Async
    public void logRateLimitExceeded(String identifier, String endpoint, HttpServletRequest request) {
        persist(EventType.RATE_LIMIT_EXCEEDED, Severity.HIGH, identifier, request,
            "Rate limit exceeded on endpoint: " + endpoint, endpoint);
    }

    @Async
    public void logSuspiciousInput(String clientIp, String uri, HttpServletRequest request) {
        persist(EventType.SUSPICIOUS_INPUT_DETECTED, Severity.CRITICAL, null, request,
            "Suspicious input pattern (possible injection) on: " + uri, uri);
    }

    @Async
    public void logRoleChanged(String changedBy, String targetUser, String oldRole, String newRole, HttpServletRequest request) {
        persist(EventType.ROLE_CHANGED, Severity.HIGH, changedBy, request,
            String.format("Role changed for '%s': %s → %s", targetUser, oldRole, newRole), targetUser);
    }

    @Async
    public void logUserCreated(String createdBy, String newUsername, HttpServletRequest request) {
        persist(EventType.USER_CREATED, Severity.MEDIUM, createdBy, request,
            "New user created: " + newUsername, newUsername);
    }

    @Async
    public void logUserDeleted(String deletedBy, String targetUsername, HttpServletRequest request) {
        persist(EventType.USER_DELETED, Severity.HIGH, deletedBy, request,
            "User account deleted: " + targetUsername, targetUsername);
    }

    @Async
    public void logLogout(String username, HttpServletRequest request) {
        persist(EventType.LOGOUT, Severity.INFO, username, request,
            "User logged out — JWT blacklisted", null);
    }

    @Async
    public void logSensitiveDataAccessed(String username, String resource, HttpServletRequest request) {
        persist(EventType.SENSITIVE_DATA_ACCESSED, Severity.LOW, username, request,
            "Sensitive data accessed: " + resource, resource);
    }

    // ─── Summary (for dashboard) ──────────────────────────────────────────────

    public long countLoginFailuresLast24h() {
        return auditLogRepository.countByEventTypeAndTimestampAfter(
            EventType.LOGIN_FAILED, Instant.now().minusSeconds(86400));
    }

    public long countCriticalAlertsLast24h() {
        return auditLogRepository.countBySeverityAndTimestampAfter(
            Severity.CRITICAL, Instant.now().minusSeconds(86400));
    }

    // ─── Core Persist ─────────────────────────────────────────────────────────

    private void persist(EventType eventType, Severity severity, String username,
                         HttpServletRequest request, String details, String affectedResource) {
        try {
            SecurityAuditLog entry = new SecurityAuditLog();
            entry.setEventType(eventType);
            entry.setSeverity(severity);
            entry.setUsername(username);
            entry.setTimestamp(Instant.now());
            entry.setClientIp(getClientIp(request));
            entry.setUserAgent(truncate(request != null ? request.getHeader("User-Agent") : null, 512));
            entry.setRequestUri(request != null ? request.getRequestURI() : null);
            entry.setDetails(truncate(details, 1000));
            entry.setAffectedResource(affectedResource);
            auditLogRepository.save(entry);

            // Mirror to SLF4J for log aggregation
            log.info("SECURITY_AUDIT [{}] [{}] user={} ip={} | {}",
                severity, eventType, username, getClientIp(request), details);

        } catch (Exception e) {
            // CRITICAL: Audit logging must NEVER break business logic
            log.error("AUDIT_LOG_WRITE_FAILED: eventType={} error={}", eventType, e.getMessage());
        }
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "system";
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
