package com.futaneagro.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * <h1>DatabaseLatencyHealthIndicator (Spring Boot Actuator Latency Probe)</h1>
 * <p>
 * Custom Actuator {@link HealthIndicator} contributing real-time PostgreSQL database latency telemetry
 * to {@code /actuator/health}.
 * </p>
 *
 * <h3>Health Evaluation Criteria:</h3>
 * <ul>
 *   <li><b>Optimal Latency:</b> Query response under 1000ms reports {@code Status.UP} with status {@code "OPTIMAL"}.</li>
 *   <li><b>Degraded Latency:</b> Query response exceeding 1000ms reports {@code Status.DOWN} with status {@code "SLOW"}.</li>
 *   <li><b>Connectivity Failure:</b> Connection timeouts or driver errors report {@code Status.DOWN} with the underlying exception.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Component
public class DatabaseLatencyHealthIndicator implements HealthIndicator {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            jdbcTemplate.execute("SELECT 1");
            long latency = System.currentTimeMillis() - start;
            if (latency > 1000) {
                return Health.down().withDetail("latency_ms", latency).withDetail("status", "SLOW").build();
            }
            return Health.up().withDetail("latency_ms", latency).withDetail("status", "OPTIMAL").build();
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }
}
