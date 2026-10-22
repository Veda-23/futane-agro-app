package com.futaneagro.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * <h1>MfaUsedToken Entity (Replay Attack Prevention for TOTP & OTP Codes)</h1>
 * <p>
 * Maps to table {@code t_mfa_used_tokens}. Tracks one-time token hashes and expiration windows
 * to prevent replay attacks during multi-factor authentication challenges.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_mfa_used_tokens")
public class MfaUsedToken {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id = UUID.randomUUID().toString();

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Column(name = "user_id", columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    public MfaUsedToken() {
    }

    public MfaUsedToken(String tokenHash, String userId, LocalDateTime expiresAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.createdDate = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
}
