package com.futaneagro.repository;

import com.futaneagro.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>AuditLog Repository (Operational Event & User Activity Trace)</h1>
 * <p>
 * Spring Data JPA repository for the {@link AuditLog} entity.
 * Persists and indexes user activity events, record creations, mutations, and deletions across modules.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
}

