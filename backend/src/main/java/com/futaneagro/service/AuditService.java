package com.futaneagro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.AuditLog;
import com.futaneagro.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    public String getClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xff = request.getHeader("X-Forwarded-For");
                if (xff != null && !xff.isBlank()) {
                    return xff.split(",")[0].trim();
                }
                return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }

    public void log(String action, String tableName, String oldValue, String newValue) {
        try {
            AuditLog log = new AuditLog();
            log.setUsername(getCurrentUser());
            log.setAction(action);
            log.setTableName(tableName);
            log.setOldValue(oldValue);
            log.setNewValue(newValue);
            log.setIpAddress(getClientIp());
            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to write audit log: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    public void log(String action, String resourceName, Object details) {
        try {
            AuditLog log = new AuditLog();
            log.setUsername(getCurrentUser());
            log.setAction(action);
            log.setTableName(resourceName);
            log.setNewValue(details != null ? (details instanceof String ? (String) details : toJson(details)) : null);
            log.setIpAddress(getClientIp());
            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to write audit log: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    public void log(String action, String tableName, Object oldObj, Object newObj) {
        log(action, tableName, toJson(oldObj), toJson(newObj));
    }

    public String toJson(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}
