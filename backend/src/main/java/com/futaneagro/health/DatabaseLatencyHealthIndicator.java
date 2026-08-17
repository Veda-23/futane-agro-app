package com.futaneagro.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

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
