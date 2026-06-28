package com.futaneagro.service;

import com.futaneagro.entity.Inventory;
import com.futaneagro.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Inventory inventory1;

    @BeforeEach
    void setUp() {
        inventory1 = new Inventory();
        inventory1.setInventoryId(1);
        inventory1.setCrateType("Plastic");
        inventory1.setMaterialType("Raw");
        inventory1.setCurrentStock(500);
    }

    @Test
    void testGetAllInventory() {
        when(inventoryRepository.findAll()).thenReturn(Arrays.asList(inventory1));
        
        List<Inventory> list = inventoryService.getAllInventory();
        
        assertEquals(1, list.size());
        assertEquals(500, list.get(0).getCurrentStock());
        verify(inventoryRepository, times(1)).findAll();
    }

    @Test
    void testGetInventoryByType() {
        when(inventoryRepository.findByCrateTypeAndMaterialType("Plastic", "Raw"))
                .thenReturn(Optional.of(inventory1));
                
        Optional<Inventory> result = inventoryRepository.findByCrateTypeAndMaterialType("Plastic", "Raw");
        
        assertTrue(result.isPresent());
        assertEquals("Plastic", result.get().getCrateType());
    }
}
