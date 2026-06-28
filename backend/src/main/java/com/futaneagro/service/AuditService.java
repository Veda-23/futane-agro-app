package com.futaneagro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.AuditLog;
import com.futaneagro.repository.AuditLogRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Saves an audit log entry.
     *
     * @param action    The action performed (e.g., Created, Updated, Deleted).
     * @param tableName The table/domain affected.
     * @param oldValue  The state before the action (as JSON string, if applicable).
     * @param newValue  The state after the action (as JSON string, if applicable).
     */
    public void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setUsername(SecurityUtils.getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
    }

    /**
     * Converts an object to its JSON string representation.
     *
     * @param obj The object to convert.
     * @return The JSON string, or an empty string if conversion fails.
     */
    public String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }
}
