package com.futaneagro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.AuditLog;
import com.futaneagro.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public String getCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return (principal != null) ? principal.toString() : "system";
        }
        return "system";
    }

    public void log(String action, String tableName, String oldValue, String newValue) {
        try {
            AuditLog log = new AuditLog();
            log.setUsername(getCurrentUser());
            log.setAction(action);
            log.setTableName(tableName);
            log.setOldValue(oldValue);
            log.setNewValue(newValue);
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    public void log(String action, String tableName, Object oldObj, Object newObj) {
        log(action, tableName, toJson(oldObj), toJson(newObj));
    }

    public String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }
}
