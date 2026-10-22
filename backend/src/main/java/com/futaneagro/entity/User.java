package com.futaneagro.entity;

import javax.persistence.*;
import org.hibernate.annotations.Where;
import java.time.LocalDateTime;

/**
 * User Account & Authentication Principal Entity (`t_core_user`).
 *
 * Security and Governance:
 * - Credential Protection: Password serialized as `WRITE_ONLY` to prevent hash leakage in REST responses.
 * - Brute-Force Lockout Defense: Increments `failedAttempts` on bad logins; locks account (`accountLocked = true`)
 *   for 30 minutes after 5 successive invalid attempts.
 * - Temporary Credential Compliance: `forcePasswordChange = true` restricts access until operator changes default password.
 * - Multi-Factor Authentication: Tracks phone MFA enrollment status (`mfaEnabled`) and registered mobile number.
 * - Hibernate Soft-Delete: Query results automatically exclude inactive records via `@Where(clause = "is_active = true")`.
 */
@Entity
@Table(name = "t_core_user")
@Where(clause = "is_active = true")
public class User extends BaseEntity {
    private String username;

    @Column(name = "password", nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(name = "role", nullable = false, length = 50)
    private String role; // SUPER_ADMIN, ADMIN, MANAGER, ACCOUNTANT, PRODUCTION_OPERATOR, STORE_MANAGER

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "failed_attempts")
    private Integer failedAttempts = 0;

    @Column(name = "account_locked")
    private Boolean accountLocked = false;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    @Column(name = "force_password_change")
    private Boolean forcePasswordChange = false;

    public User() {
    }

    public User(String username, String password, String role, String name) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.name = name;
        this.failedAttempts = 0;
        this.accountLocked = false;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(Integer failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public Boolean getAccountLocked() {
        return accountLocked;
    }

    public void setAccountLocked(Boolean accountLocked) {
        this.accountLocked = accountLocked;
    }

    public LocalDateTime getLockTime() {
        return lockTime;
    }

    public void setLockTime(LocalDateTime lockTime) {
        this.lockTime = lockTime;
    }

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "mobile_number", length = 20)
    private String mobileNumber;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    @Column(name = "team_id", length = 36)
    private String teamId;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE"; // ACTIVE, INVITED, DISABLED

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getForcePasswordChange() {
        return forcePasswordChange;
    }

    public void setForcePasswordChange(Boolean forcePasswordChange) {
        this.forcePasswordChange = forcePasswordChange;
    }

    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;

    @Column(name = "mfa_factor", length = 32)
    private String mfaFactor;

    @Column(name = "mfa_phone_e164", length = 20)
    private String mfaPhoneE164;

    public Boolean getMfaEnabled() {
        return mfaEnabled != null && mfaEnabled;
    }

    public void setMfaEnabled(Boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public String getMfaFactor() {
        return mfaFactor;
    }

    public void setMfaFactor(String mfaFactor) {
        this.mfaFactor = mfaFactor;
    }

    public String getMfaPhoneE164() {
        return mfaPhoneE164;
    }

    public void setMfaPhoneE164(String mfaPhoneE164) {
        this.mfaPhoneE164 = mfaPhoneE164;
    }
}
