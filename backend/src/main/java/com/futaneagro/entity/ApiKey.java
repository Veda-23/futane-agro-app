package com.futaneagro.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "t_core_api_keys")
public class ApiKey {

    @Id
    @Column(name = "id", length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "api_key", nullable = false, unique = true, length = 120)
    private String apiKey;

    @Column(name = "key_prefix", length = 30)
    private String keyPrefix;

    @Column(name = "scopes", length = 255)
    private String scopes = "read:sales,write:production";

    @Column(name = "created_by", length = 50)
    private String createdBy = "SUPER_ADMIN";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public ApiKey() {}

    public ApiKey(String name, String apiKey, String keyPrefix, String scopes, LocalDateTime expiresAt) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.apiKey = apiKey;
        this.keyPrefix = keyPrefix;
        this.scopes = scopes;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getKeyPrefix() { return keyPrefix; }
    public void setKeyPrefix(String keyPrefix) { this.keyPrefix = keyPrefix; }

    public String getScopes() { return scopes; }
    public void setScopes(String scopes) { this.scopes = scopes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(LocalDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
