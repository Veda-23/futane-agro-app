package com.futaneagro.controller;

import com.futaneagro.dto.DetailedHealthResponse;
import com.futaneagro.dto.HealthResponse;
import com.futaneagro.service.HealthMetricsService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link HealthController}.
 * Uses a mocked {@link HealthMetricsService} to verify controller behaviour without
 * touching the actual metric collection logic.
 */
@WebMvcTest(HealthController.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthMetricsService metricsService;

    /**
     * Helper to create dummy metric maps.
     */
    private Map<String, Long> dummyMemory() {
        Map<String, Long> map = new HashMap<>();
        map.put("used", 1024L);
        map.put("max", 2048L);
        map.put("total", 4096L);
        return map;
    }

    private Map<String, Object> dummyCpu() {
        Map<String, Object> map = new HashMap<>();
        map.put("systemCpuLoad", 0.25);
        map.put("processCpuLoad", 0.10);
        map.put("processCpuTime", 123456L);
        return map;
    }

    @Test
    void getBasicHealth_returnsHealthResponse() throws Exception {
        var result = mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        HealthResponse response = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(responseContent, HealthResponse.class);

        assertThat(response.getStatus()).isEqualTo("UP");
        assertThat(response.getTimestamp()).isInstanceOf(LocalDateTime.class);
        assertThat(response.getResponseTime()).isGreaterThanOrEqualTo(0L);
    }

    @Test
    void getDetailedHealth_returnsDetailedHealthResponse() throws Exception {
        // Mock metric service
        Mockito.when(metricsService.getMemoryMetrics()).thenReturn(dummyMemory());
        Mockito.when(metricsService.getCpuMetrics()).thenReturn(dummyCpu());
        Mockito.when(metricsService.getUptimeMs()).thenReturn(123456L);
        // The controller uses the service directly, no need to mock getResponseTimeMs

        var result = mockMvc.perform(get("/api/health/detailed"))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        DetailedHealthResponse response = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(responseContent, DetailedHealthResponse.class);

        assertThat(response.getStatus()).isEqualTo("UP");
        assertThat(response.getTimestamp()).isInstanceOf(LocalDateTime.class);
        assertThat(response.getVersion()).isNotEmpty();
        assertThat(response.getUptime()).isEqualTo(123456L);
        assertThat(response.getMemory()).containsAllEntriesOf(dummyMemory());
        assertThat(response.getCpu()).containsAllEntriesOf(dummyCpu());
        assertThat(response.getResponseTime()).isGreaterThanOrEqualTo(0L);
    }
}
