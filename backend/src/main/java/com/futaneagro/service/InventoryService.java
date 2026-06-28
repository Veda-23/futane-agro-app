package com.futaneagro.service;

import com.futaneagro.entity.Inventory;
import com.futaneagro.repository.InventoryRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AuditService auditService;

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Transactional
    public Inventory createInventory(Inventory inventory) {
        Inventory saved = inventoryRepository.save(inventory);
        auditService.saveAuditLog("Created inventory record: " + saved.getCrateType(), "Inventory", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Inventory updateInventory(Integer id, Inventory details) {
        Inventory inventory = inventoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Inventory not found"));
        String oldState = auditService.toJson(inventory);

        inventory.setCrateType(details.getCrateType());
        inventory.setMaterialType(details.getMaterialType());
        inventory.setOpeningStock(details.getOpeningStock());
        inventory.setProducedStock(details.getProducedStock());
        inventory.setSoldStock(details.getSoldStock());

        Inventory saved = inventoryRepository.save(inventory);
        auditService.saveAuditLog("Updated inventory ID: " + id, "Inventory", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteInventory(Integer id) {
        inventoryRepository.findById(id).ifPresent(inventory -> {
            String oldState = auditService.toJson(inventory);
            inventory.setIsDeleted(true);
            inventory.setDeletedBy(SecurityUtils.getCurrentUser());
            inventory.setDeletedDate(LocalDate.now());
            inventoryRepository.save(inventory);
            auditService.saveAuditLog("Soft-deleted inventory ID: " + id, "Inventory", oldState, null);
        });
    }
}
