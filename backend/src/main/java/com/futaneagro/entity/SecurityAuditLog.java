package com.futaneagro.entity;

import javax.persistence.*;
import java.time.Instant;

/**
 * <h1>SecurityAuditLog Entity (Immutable Security & Forensic Event Log)</h1>
 * <p>
 * Maps to table {@code security_audit_logs}. Records authentication successes/failures, OTP issuances,
 * account lockouts, privilege escalation attempts, token revocations, and rate limit exceptions.
 * </p>
 *
 * <h3>Compliance & Legal Standards:</h3>
 * <ul>
 *   <li><b>Immutability:</b> Records MUST NEVER be updated or deleted under any circumstances.</li>
 *   <li><b>Statutory Alignment:</b> Conforms to ISO 27001, SOC 2, and India Digital Personal Data Protection (DPDP) Act 2023.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "security_audit_logs", indexes = {
    @Index(name = "idx_audit_username",   columnList = "username"),
    @Index(name = "idx_audit_event_type", columnList = "eventType"),
    @Index(name = "idx_audit_timestamp",  columnList = "timestamp"),
    @Index(name = "idx_audit_ip",         columnList = "clientIp"),
    @Index(name = "idx_audit_severity",   columnList = "severity")
})
public class SecurityAuditLog {

    public enum EventType {
        LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_OTP_SENT, LOGIN_OTP_FAILED, LOGIN_OTP_SUCCESS,
        LOGOUT, ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, PASSWORD_CHANGED, FORCE_PASSWORD_CHANGE,
        TOTP_ENROLLED, TOTP_DISABLED, ACCESS_DENIED, PRIVILEGE_ESCALATION_ATTEMPT,
        SENSITIVE_DATA_ACCESSED, SENSITIVE_DATA_MODIFIED, RECORD_DELETED,
        TOKEN_REVOKED, TOKEN_BLACKLISTED, SESSION_EXPIRED, CONCURRENT_SESSION_LIMIT,
        REFRESH_TOKEN_REUSE_DETECTED, RATE_LIMIT_EXCEEDED, IP_BLOCKED,
        SUSPICIOUS_INPUT_DETECTED, BRUTE_FORCE_DETECTED,
        ADMIN_ACTION, USER_CREATED, USER_DELETED, ROLE_CHANGED,
        MFA_CHALLENGE_ISSUED, MFA_VERIFY_SUCCESS, MFA_VERIFY_FAILED, MFA_ENROLLED, MFA_DISABLED, MFA_RECOVERY_CODE_USED
    }

    public enum Severity { INFO, LOW, MEDIUM, HIGH, CRITICAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Severity severity;

    @Column(length = 100)
    private String username;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(length = 64)
    private String clientIp;

    @Column(length = 512)
    private String userAgent;

    @Column(length = 200)
    private String requestUri;

    @Column(length = 1000)
    private String details;

    @Column(length = 100)
    private String affectedResource;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    // Getters & Setters
    public Long getId() { return id; }
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getRequestUri() { return requestUri; }
    public void setRequestUri(String requestUri) { this.requestUri = requestUri; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getAffectedResource() { return affectedResource; }
    public void setAffectedResource(String affectedResource) { this.affectedResource = affectedResource; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}
