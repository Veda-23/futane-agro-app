package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ProductionController {

    @Autowired
    private PpdRepository ppdRepository;

    @Autowired
    private PpmRepository ppmRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

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

    // --- PPD Endpoints ---
    @GetMapping("/ppd")
    public List<Ppd> getAllPpd() {
        return ppdRepository.findAll();
    }

    @PostMapping("/ppd")
    public Ppd createPpd(@RequestBody Ppd ppd) {
        Ppd saved = ppdRepository.save(ppd);

        // Update Inventory: Produced Stock Increase
        String materialType = "Plastic";
        Optional<Inventory> invOpt = inventoryRepository.findByCrateTypeAndMaterialType(ppd.getCrateType(), materialType);
        Inventory inv;
        if (invOpt.isPresent()) {
            inv = invOpt.get();
        } else {
            inv = new Inventory();
            inv.setCrateType(ppd.getCrateType());
            inv.setMaterialType(materialType);
            inv.setOpeningStock(0);
            inv.setProducedStock(0);
            inv.setSoldStock(0);
        }
        inv.setProducedStock(inv.getProducedStock() + ppd.getSuccessful());
        inventoryRepository.save(inv);

        saveAuditLog("Created production entry for crate: " + saved.getCrateType(), "PPD", null, toJson(saved));
        if (broadcastService != null) {
            broadcastService.broadcastUpdate("PRODUCTION", "CREATED", "Produced " + ppd.getSuccessful() + " " + ppd.getCrateType() + " crates (" + ppd.getShift() + ")");
        }
        return saved;
    }

    @DeleteMapping("/ppd/{id}")
    public void deletePpd(@PathVariable String id) {
        ppdRepository.findById(id).ifPresent(ppd -> {
            String oldState = toJson(ppd);
            // Revert Inventory change
            inventoryRepository.findByCrateTypeAndMaterialType(ppd.getCrateType(), "Plastic").ifPresent(inv -> {
                inv.setProducedStock(Math.max(0, inv.getProducedStock() - ppd.getSuccessful()));
                inventoryRepository.save(inv);
            });
            ppd.setIsActive(false);
            ppd.setUpdatedBy(getCurrentUser());
            ppd.setUpdatedAt(java.time.LocalDateTime.now());
            ppdRepository.save(ppd);
            saveAuditLog("Soft-deleted production entry ID: " + id, "PPD", oldState, null);
        });
    }

    // --- PPM Endpoints ---
    @GetMapping("/ppm")
    public List<Ppm> getAllPpm() {
        return ppmRepository.findAll();
    }

    @PostMapping("/ppm")
    public Ppm createPpm(@RequestBody Ppm ppm) {
        Ppm saved = ppmRepository.save(ppm);
        saveAuditLog("Created monthly production summary: " + saved.getMonth() + "/" + saved.getYear(), "PPM", null, toJson(saved));
        return saved;
    }

    @DeleteMapping("/ppm/{id}")
    public void deletePpm(@PathVariable String id) {
        ppmRepository.findById(id).ifPresent(ppm -> {
            String oldState = toJson(ppm);
            ppm.setIsActive(false);
            ppm.setUpdatedBy(getCurrentUser());
            ppm.setUpdatedAt(java.time.LocalDateTime.now());
            ppmRepository.save(ppm);
            saveAuditLog("Soft-deleted monthly production summary ID: " + id, "PPM", oldState, null);
        });
    }

    // --- Raw Material Endpoints ---
    @GetMapping("/raw-materials")
    public List<RawMaterial> getAllRawMaterials() {
        return rawMaterialRepository.findAll();
    }

    @PostMapping("/raw-materials")
    public RawMaterial createRawMaterial(@RequestBody RawMaterial rawMaterial) {
        RawMaterial saved = rawMaterialRepository.save(rawMaterial);
        saveAuditLog("Created raw material entry: " + saved.getMaterialName(), "Raw_Material", null, toJson(saved));
        return saved;
    }

    @DeleteMapping("/raw-materials/{id}")
    public void deleteRawMaterial(@PathVariable String id) {
        rawMaterialRepository.findById(id).ifPresent(rm -> {
            String oldState = toJson(rm);
            rm.setIsActive(false);
            rm.setUpdatedBy(getCurrentUser());
            rm.setUpdatedAt(java.time.LocalDateTime.now());
            rawMaterialRepository.save(rm);
            saveAuditLog("Soft-deleted raw material ID: " + id, "Raw_Material", oldState, null);
        });
    }
}


