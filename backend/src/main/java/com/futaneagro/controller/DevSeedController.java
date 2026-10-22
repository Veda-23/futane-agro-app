package com.futaneagro.controller;

import com.futaneagro.service.DataSeederService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * <h3>Development & Test Data Seeding REST Controller</h3>
 * <p>
 * Provides automated population of synthetic test fixtures, realistic demo party ledgers,
 * inventory catalogs, production cycles, and HR profiles for local and UAT development.
 * </p>
 *
 * <h4>Critical Security Invariants:</h4>
 * <ul>
 *   <li><b>Production Hard-Block:</b> Explicitly checks the active Spring profile. If {@code "prod"} or
 *       {@code "production"} is active, execution is immediately aborted with HTTP 403 Forbidden
 *       and a high-priority security alert is logged.</li>
 *   <li><b>Super Admin Authority:</b> Accessible solely by users holding the {@code ROLE_SUPER_ADMIN} authority.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/dev")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class DevSeedController {

    private static final Logger log = LoggerFactory.getLogger(DevSeedController.class);

    @Autowired
    private DataSeederService dataSeederService;

    @Autowired
    private Environment environment;

    /**
     * Guard method that verifies whether the current runtime environment is a production instance.
     * <p>
     * If running in production, blocks execution and emits a security warning with client IP.
     * </p>
     *
     * @param request HTTP servlet request for client IP extraction
     * @return 403 FORBIDDEN response if in production, or null to permit execution
     */
    private ResponseEntity<?> guardProductionAccess(HttpServletRequest request) {
        boolean isProduction = Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production"));

        if (isProduction) {
            String clientIp = request != null ? request.getRemoteAddr() : "unknown";
            log.error("🚨 SECURITY ALERT: Production access attempt on dev endpoint {} from IP: {}",
                request != null ? request.getRequestURI() : "unknown", clientIp);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", "Development endpoints are DISABLED in the production environment.",
                "hint", "This access attempt has been logged."
            ));
        }
        return null; // Non-prod: allow access
    }

    /**
     * <b>POST /api/dev/seed-data</b> - Populates comprehensive demo and staging datasets.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies non-production environment guard.</li>
     *   <li>Invokes {@link DataSeederService#seedAllComprehensiveData()} to seed sample parties,
     *       inventories, production cycles, sales, and employee rosters.</li>
     *   <li>Returns summary map of created entities and records.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Fast development test setups, end-to-end integration tests, and QA staging runs.
     * </p>
     *
     * @param request HTTP request for IP tracking
     * @return 200 OK with seeding summary map
     */
    @PostMapping("/seed-data")
    public ResponseEntity<?> seedAllData(HttpServletRequest request) {
        ResponseEntity<?> guard = guardProductionAccess(request);
        if (guard != null) return guard;

        log.info("Dev seed triggered from IP: {}", request.getRemoteAddr());
        Map<String, Object> response = dataSeederService.seedAllComprehensiveData();
        return ResponseEntity.ok(response);
    }
}

