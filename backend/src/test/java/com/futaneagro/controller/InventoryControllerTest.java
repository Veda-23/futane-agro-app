package com.futaneagro.controller;

import com.futaneagro.entity.Inventory;
import com.futaneagro.service.InventoryService;
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

@WebMvcTest(InventoryController.class)
public class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventoryService inventoryService;

    @Test
    public void testGetAllInventory_Returns200() throws Exception {
        Inventory inv = new Inventory();
        inv.setInventoryId(1);
        inv.setCrateType("Plastic");
        inv.setCurrentStock(150);

        when(inventoryService.getAllInventory()).thenReturn(Arrays.asList(inv));

        mockMvc.perform(get("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].crateType").value("Plastic"))
                .andExpect(jsonPath("$[0].currentStock").value(150));
    }
}
