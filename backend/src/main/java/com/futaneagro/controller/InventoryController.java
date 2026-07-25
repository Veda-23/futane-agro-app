package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class InventoryController {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    private String getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal != null) ? principal.toString() : "system";
    }

    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setUsername(getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    @GetMapping("/inventory")
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @PostMapping("/inventory")
    public Inventory createInventory(@RequestBody Inventory inventory) {
        Inventory saved = inventoryRepository.save(inventory);
        saveAuditLog("Created inventory record: " + saved.getCrateType(), "Inventory", null, toJson(saved));
        return saved;
    }

    @PutMapping("/inventory/{id}")
    public Inventory updateInventory(@PathVariable String id, @RequestBody Inventory details) {
        Inventory inventory = inventoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Inventory not found"));
        String oldState = toJson(inventory);

        inventory.setCrateType(details.getCrateType());
        inventory.setMaterialType(details.getMaterialType());
        inventory.setOpeningStock(details.getOpeningStock());
        inventory.setProducedStock(details.getProducedStock());
        inventory.setSoldStock(details.getSoldStock());

        Inventory saved = inventoryRepository.save(inventory);
        saveAuditLog("Updated inventory ID: " + id, "Inventory", oldState, toJson(saved));
        return saved;
    }

    @DeleteMapping("/inventory/{id}")
    public void deleteInventory(@PathVariable String id) {
        inventoryRepository.findById(id).ifPresent(inventory -> {
            String oldState = toJson(inventory);
            inventory.setIsActive(false);
            inventory.setUpdatedBy(getCurrentUser());
            inventory.setUpdatedAt(java.time.LocalDateTime.now());
            inventoryRepository.save(inventory);
            saveAuditLog("Soft-deleted inventory ID: " + id, "Inventory", oldState, null);
        });
    }
}


