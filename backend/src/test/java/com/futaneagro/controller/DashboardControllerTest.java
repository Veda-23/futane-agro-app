package com.futaneagro.controller;

import com.futaneagro.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.when;

@WebMvcTest(DashboardController.class)
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    public void testGetDashboardMetrics_Returns200() throws Exception {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalSales", 5000.0);
        metrics.put("totalProduction", 1500);

        when(dashboardService.getDashboardMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/dashboard/metrics")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalSales").value(5000.0))
                .andExpect(jsonPath("$.totalProduction").value(1500));
    }
}
