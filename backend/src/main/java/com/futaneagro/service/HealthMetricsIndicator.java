package com.futaneagro.service;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Spring Boot Actuator {@link HealthIndicator} that exposes the same metrics as the
 * {@link HealthController}. This makes the health information available at the
 * standard Actuator endpoint <code>/actuator/health</code>.
 */
@Component("healthMetrics")
public class HealthMetricsIndicator implements HealthIndicator {

    private final HealthMetricsService metricsService;

    public HealthMetricsIndicator(HealthMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Override
    public Health health() {
        Map<String, Long> memory = metricsService.getMemoryMetrics();
        Map<String, Object> cpu = metricsService.getCpuMetrics();
        long uptime = metricsService.getUptimeMs();
        return Health.up()
                .withDetail("memory", memory)
                .withDetail("cpu", cpu)
                .withDetail("uptimeMs", uptime)
                .build();
    }
}
