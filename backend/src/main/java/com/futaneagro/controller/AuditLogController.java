package com.futaneagro.controller;

import com.futaneagro.entity.AuditLog;
import com.futaneagro.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <h3>Audit Log REST Controller</h3>
 * <p>
 * Exposes immutable system audit log records for administrative compliance, forensic inspection,
 * and change tracking across the entire Futane Agro ERP database.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Strict Access Control:</b> Guarded at class level with {@code @PreAuthorize("hasRole('SUPER_ADMIN')")}
 *       to prevent privilege escalation and unauthorized surveillance of system modifications.</li>
 *   <li><b>Forensic Change Log Retrieval:</b> Provides access to timestamped JSON delta records
 *       detailing table names, affected records, usernames, old values, and new values.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * <b>GET /api/audit-logs</b> - Retrieves all system audit trail records.
     * <p>
     * <b>How it works:</b> Queries {@link AuditLogRepository#findAll()} to return all historical
     * delta audit logs stored in the database.
     * </p>
     * <p>
     * <b>Used for:</b> The Super Admin Audit Viewer in the Admin Control Center.
     * </p>
     *
     * @return List of all {@link AuditLog} entries
     */
    @GetMapping
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    /**
     * <b>POST /api/audit-logs</b> - Creates a manual audit log record.
     * <p>
     * <b>How it works:</b> Directly persists the provided {@link AuditLog} entity into the repository.
     * </p>
     * <p>
     * <b>Used for:</b> Recording external or custom administrative governance events.
     * </p>
     *
     * @param log Audit log entity to persist
     * @return Persisted {@link AuditLog} entry
     */
    @PostMapping
    public AuditLog createAuditLog(@RequestBody AuditLog log) {
        return auditLogRepository.save(log);
    }
}


