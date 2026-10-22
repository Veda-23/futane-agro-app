package com.futaneagro.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * <h1>UserMfaRecoveryCode Entity (Emergency Multi-Factor Authentication Backup Codes)</h1>
 * <p>
 * Maps to table {@code t_user_mfa_recovery_codes}. Stores BCrypt-hashed one-time emergency recovery codes
 * generated when a user configures Time-based One-Time Password (TOTP) or SMS multi-factor authentication.
 * </p>
 *
 * <h3>Security Guarantees:</h3>
 * <ul>
 *   <li><b>Hashed Storage:</b> Only cryptographic hashes ({@code codeHash}) are stored, never plaintext recovery codes.</li>
 *   <li><b>Single Use Invariant:</b> Marked as {@code used = true} immediately upon successful verification.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_user_mfa_recovery_codes")
public class UserMfaRecoveryCode {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id = UUID.randomUUID().toString();

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private String userId;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "used", nullable = false)
    private Boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    public UserMfaRecoveryCode() {
    }

    public UserMfaRecoveryCode(String userId, String codeHash) {
        this.userId = userId;
        this.codeHash = codeHash;
        this.used = false;
        this.createdDate = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public void setCodeHash(String codeHash) {
        this.codeHash = codeHash;
    }

    public Boolean getUsed() {
        return used != null && used;
    }

    public void setUsed(Boolean used) {
        this.used = used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
}
