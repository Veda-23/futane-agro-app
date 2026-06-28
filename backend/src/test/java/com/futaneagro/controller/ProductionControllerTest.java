package com.futaneagro.controller;

import com.futaneagro.entity.Ppd;
import com.futaneagro.service.ProductionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.when;

@WebMvcTest(ProductionController.class)
public class ProductionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductionService productionService;

    @Test
    public void testGetAllProduction_Returns200() throws Exception {
        Ppd prod = new Ppd();
        prod.setId(1);
        prod.setTotalCrates(500);

        when(productionService.getAllPpd()).thenReturn(Arrays.asList(prod));

        mockMvc.perform(get("/api/production/ppd")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].totalCrates").value(500));
    }
}
