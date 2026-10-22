package com.futaneagro.repository;

import com.futaneagro.entity.SecurityAuditLog;
import com.futaneagro.entity.SecurityAuditLog.EventType;
import com.futaneagro.entity.SecurityAuditLog.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

/**
 * <h1>SecurityAuditLog Repository (Forensic Query & Threat Analytics)</h1>
 * <p>
 * Spring Data JPA repository for the {@link SecurityAuditLog} entity.
 * Provides specialized queries for SIEM ingestion, intrusion detection,
 * high-severity alerts ({@link #findRecentHighSeverityEvents(Instant)}),
 * and brute-force IP aggregation ({@link #findTopAttackingIps(Instant)}).
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long> {

    Page<SecurityAuditLog> findByUsername(String username, Pageable pageable);

    Page<SecurityAuditLog> findByEventType(EventType eventType, Pageable pageable);

    Page<SecurityAuditLog> findBySeverityIn(List<Severity> severities, Pageable pageable);

    Page<SecurityAuditLog> findByTimestampBetween(Instant from, Instant to, Pageable pageable);

    @Query("SELECT l FROM SecurityAuditLog l WHERE l.severity IN ('HIGH', 'CRITICAL') AND l.timestamp > :since ORDER BY l.timestamp DESC")
    List<SecurityAuditLog> findRecentHighSeverityEvents(@Param("since") Instant since);

    @Query("SELECT l.clientIp, COUNT(l) as cnt FROM SecurityAuditLog l WHERE l.eventType = 'LOGIN_FAILED' AND l.timestamp > :since GROUP BY l.clientIp ORDER BY cnt DESC")
    List<Object[]> findTopAttackingIps(@Param("since") Instant since);

    long countByEventTypeAndTimestampAfter(EventType eventType, Instant since);

    long countBySeverityAndTimestampAfter(Severity severity, Instant since);
}
