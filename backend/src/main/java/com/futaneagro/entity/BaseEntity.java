package com.futaneagro.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Abstract Base Entity for all PostgreSQL enterprise database domain models.
 *
 * Statutory architectural patterns:
 * - High-Entropy Primary Key: Generates random UUID v4 string (`id`) to prevent sequential enumeration attacks (IDOR).
 * - Automatic JPA Auditing: `@EntityListeners(AuditingEntityListener.class)` populates `createdAt`, `updatedAt`,
 *   and user principals (`createdBy`, `updatedBy`) resolved by `AuditorAwareImpl`.
 * - Optimistic Locking Sentinel: `@Version private Integer version` prevents concurrent write race conditions.
 * - Soft-Deletion Invariant: `isActive = true` and `isDeleted = false` with audit tracking (`deletedBy`, `deletedDate`).
 */
@MappedSuperclass
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler"}, ignoreUnknown = true)
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id = UUID.randomUUID().toString();

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false, columnDefinition = "CHAR(36)")
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", columnDefinition = "CHAR(36)")
    private String updatedBy;

    @Version
    @Column(name = "version")
    private Integer version = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    @Column(name = "deleted_date")
    private java.time.LocalDateTime deletedDate;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
    public String getDeletedBy() { return deletedBy; }
    public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }
    public java.time.LocalDateTime getDeletedDate() { return deletedDate; }
    public void setDeletedDate(java.time.LocalDateTime deletedDate) { this.deletedDate = deletedDate; }
}
