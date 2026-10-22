package com.futaneagro.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * <h3>Health & Diagnostics REST Controller</h3>
 * <p>
 * Provides server liveness probes for container orchestration (Docker/Kubernetes/reverse proxies)
 * and secure operational environment diagnostics for Super Administrators.
 * </p>
 *
 * <h4>Core Responsibilities & Security Model:</h4>
 * <ul>
 *   <li><b>Public Liveness Probe ({@code /api/health}):</b> Open unauthenticated probe returning
 *       minimal status ({@code {"status": "UP"}}) to avoid information disclosure (no ports, profiles, or DB names).</li>
 *   <li><b>Super Admin Diagnostics ({@code /api/admin/env}):</b> Role-restricted endpoint checking active
 *       Spring profile and testing live database connection validation via {@link Connection#isValid(int)}.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    @Autowired
    private Environment environment;

    @Autowired(required = false)
    private DataSource dataSource;

    /**
     * <b>GET /api/health</b> - Public health check probe.
     * <p>
     * <b>How it works:</b> Returns HTTP 200 with {@code {"status": "UP"}} immediately.
     * </p>
     * <p>
     * <b>Used for:</b> AWS/GCP/Nginx load balancer health checks and Docker container liveness monitoring.
     * </p>
     *
     * @return 200 OK with minimal status map
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("status", "UP");
        return ResponseEntity.ok(info);
    }

    /**
     * <b>GET /api/admin/env</b> - Environment and database connectivity diagnostics.
     * <p>
     * <b>Security Note:</b> Strictly restricted to {@code SUPER_ADMIN} to prevent reconnaissance.
     * Returns active Spring profile name and validates DataSource connectivity without revealing
     * raw JDBC URLs, credentials, or internal schema names.
     * </p>
     * <p>
     * <b>Used for:</b> The Admin Control Center System Health & Governance dashboard.
     * </p>
     *
     * @return 200 OK with active profile and database connection health
     */
    @GetMapping("/api/admin/env")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> getEnvInfo() {
        Map<String, String> info = new LinkedHashMap<>();
        // Profile name (dev/uat/prod) is safe operational context for SUPER_ADMIN
        String[] profiles = environment.getActiveProfiles();
        info.put("profile", profiles.length > 0 ? profiles[0] : "default");
        // DB connectivity — "connected" or "error" only; no catalog name or stack trace
        try {
            if (dataSource != null) {
                try (Connection conn = dataSource.getConnection()) {
                    info.put("db", conn.isValid(1) ? "connected" : "disconnected");
                }
            } else {
                info.put("db", "no datasource");
            }
        } catch (Exception e) {
            log.error("DB connectivity check failed during /api/admin/env", e);
            info.put("db", "error");
        }
        return ResponseEntity.ok(info);
    }
}

