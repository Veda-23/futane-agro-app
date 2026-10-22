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
 * Development-only data seeding controller.
 *
 * SECURITY: All endpoints in this controller are HARD-BLOCKED in production profiles.
 * Any access attempt in prod is logged as a HIGH-severity security event.
 * Strictly restricted to SUPER_ADMIN.
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
     * Guard method — returns a 403 FORBIDDEN response if active profile is prod/production.
     * Returns null if access is permitted (non-prod environment).
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

    @PostMapping("/seed-data")
    public ResponseEntity<?> seedAllData(HttpServletRequest request) {
        ResponseEntity<?> guard = guardProductionAccess(request);
        if (guard != null) return guard;

        log.info("Dev seed triggered from IP: {}", request.getRemoteAddr());
        Map<String, Object> response = dataSeederService.seedAllComprehensiveData();
        return ResponseEntity.ok(response);
    }
}
