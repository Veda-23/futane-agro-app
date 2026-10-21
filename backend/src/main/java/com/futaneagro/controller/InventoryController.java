package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InventoryController {

    private static final Logger log = LoggerFactory.getLogger(InventoryController.class);

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.futaneagro.service.NotificationBroadcastService broadcastService;

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
    @Transactional(readOnly = true)
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @PostMapping("/inventory")
    @Transactional
    public Inventory createInventory(@RequestBody Inventory inventory) {
        Inventory saved = inventoryRepository.save(inventory);
        saveAuditLog("Created inventory record: " + saved.getCrateType(), "Inventory", null, toJson(saved));
        if (broadcastService != null) {
            broadcastService.broadcastUpdate("INVENTORY", "UPDATED", "Inventory updated for " + saved.getCrateType());
        }
        return saved;
    }

    @PutMapping("/inventory/{id}")
    @Transactional
    public ResponseEntity<Inventory> updateInventory(@PathVariable String id, @RequestBody Inventory details) {
        return inventoryRepository.findById(id).map(inventory -> {
            String oldState = toJson(inventory);

            inventory.setCrateType(details.getCrateType());
            inventory.setMaterialType(details.getMaterialType());
            inventory.setOpeningStock(details.getOpeningStock());
            inventory.setProducedStock(details.getProducedStock());
            inventory.setSoldStock(details.getSoldStock());

            Inventory saved = inventoryRepository.save(inventory);
            saveAuditLog("Updated inventory ID: " + id, "Inventory", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/inventory/{id}")
    @Transactional
    public ResponseEntity<Void> deleteInventory(@PathVariable String id) {
        return inventoryRepository.findById(id).map(inventory -> {
            String oldState = toJson(inventory);
            inventory.setDeletedBy(getCurrentUser());
            inventory.setDeletedDate(java.time.LocalDateTime.now());
            inventory.setIsDeleted(true);
            inventory.setIsActive(false);
            inventoryRepository.save(inventory);
            inventoryRepository.deleteById(id);
            saveAuditLog("DELETED inventory ID: " + id, "Inventory", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
