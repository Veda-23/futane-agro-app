package com.futaneagro.controller;

import com.futaneagro.entity.Sales;
import com.futaneagro.service.SalesService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.when;

@WebMvcTest(SalesController.class)
public class SalesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SalesService salesService; // Mocking the service layer for controller tests

    @Test
    public void testGetAllSales_Returns200AndJson() throws Exception {
        Sales mockSale = new Sales();
        mockSale.setSaleId(1);
        mockSale.setQuantity(50);
        mockSale.setTotalAmount(new BigDecimal("5000.00"));

        when(salesService.getAllSales()).thenReturn(Arrays.asList(mockSale));

        mockMvc.perform(get("/api/sales")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].saleId").value(1))
                .andExpect(jsonPath("$[0].quantity").value(50));
    }
}
