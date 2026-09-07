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

@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    @Autowired
    private Environment environment;

    @Autowired(required = false)
    private DataSource dataSource;

    /**
     * SECURITY: /api/health is public (used by load balancers / monitoring probes).
     * Returns only a minimal liveness signal — no profile, port, or db name.
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("status", "UP");
        return ResponseEntity.ok(info);
    }

    /**
     * SECURITY: Full env/db diagnostic is SUPER_ADMIN-only and returns only
     * high-level operational status — not raw db names, connection URLs, or ports.
     * Previously exposed at unauthenticated /api/env.
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
