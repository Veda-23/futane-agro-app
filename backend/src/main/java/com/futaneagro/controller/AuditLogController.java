package com.futaneagro.controller;

import com.futaneagro.entity.AuditLog;
import com.futaneagro.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    @PostMapping
    public AuditLog createAuditLog(@RequestBody AuditLog log) {
        return auditLogRepository.save(log);
    }
}

