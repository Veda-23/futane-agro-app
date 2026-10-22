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

/**
 * Enterprise Audit Trail Service for the Futane Agro ERP platform.
 * <p>
 * <b>Core Responsibilities:</b>
 * <ul>
 *   <li>Intercepts and records administrative and transactional operations across CRM, Sales, Inventory, and HR.</li>
 *   <li>Captures caller identity from Spring {@link SecurityContextHolder} (or falls back to {@code SYSTEM}).</li>
 *   <li>Extracts origin client IP addresses while handling reverse proxies (via {@code X-Forwarded-For}).</li>
 *   <li>Serializes pre-change and post-change object states into JSON snapshots for forensic auditability.</li>
 *   <li>Ensures audit persistence failures are strictly non-blocking: exceptions are logged without disrupting business transactions.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 * @see AuditLog
 * @see AuditLogRepository
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Resolves the authenticated username from the current Spring Security execution thread.
     *
     * @return the logged-in username or {@code "SYSTEM"} if invoked in an unauthenticated or background task
     */
    public String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    /**
     * Extracts the IPv4 or IPv6 client network address initiating the current web request.
     * <p>
     * Inspects the {@code X-Forwarded-For} HTTP header first to account for NGINX/Cloudflare reverse proxies,
     * stripping downstream proxies if multiple comma-separated IPs exist. Falls back to {@code getRemoteAddr()}
     * or {@code "127.0.0.1"} for background cron/daemon executions.
     *
     * @return the resolved remote client IP address string
     */
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

    /**
     * Records an immutable audit log entry comparing raw string values of an entity change.
     *
     * @param action    the business verb or lifecycle event (e.g. {@code CREATE}, {@code UPDATE}, {@code DELETE}, {@code EXPORT})
     * @param tableName the database table or conceptual resource domain (e.g. {@code t_crm_party}, {@code t_sal_sales})
     * @param oldValue  serialized representation of state prior to modification (nullable for creates)
     * @param newValue  serialized representation of state after modification (nullable for deletes)
     */
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

    /**
     * Records a single-state operational or security event (such as login, export, or system parameter update).
     *
     * @param action       the business operation performed
     * @param resourceName the domain module or resource identifier
     * @param details      the event payload (serialized to JSON if POJO, or stored as raw string)
     */
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

    /**
     * Overloaded helper that serializes arbitrary Java objects to JSON before persisting diffs.
     *
     * @param action    the modification action performed
     * @param tableName target database table name
     * @param oldObj    the object state before update (nullable)
     * @param newObj    the object state after update (nullable)
     */
    public void log(String action, String tableName, Object oldObj, Object newObj) {
        log(action, tableName, toJson(oldObj), toJson(newObj));
    }

    /**
     * Serializes any Java object into a formatted JSON string using Jackson {@link ObjectMapper}.
     * Falls back to {@code obj.toString()} if serialization fails.
     *
     * @param obj the Java object to serialize
     * @return JSON string or null if input was null
     */
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
