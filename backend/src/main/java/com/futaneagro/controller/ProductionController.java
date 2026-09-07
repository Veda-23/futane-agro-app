package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private com.futaneagro.service.ProductionForecastService forecastService;

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

    @PutMapping("/ppd/{id}")
    public ResponseEntity<Ppd> updatePpd(@PathVariable String id, @RequestBody Ppd details) {
        return ppdRepository.findById(id).map(ppd -> {
            String oldState = toJson(ppd);

            // Revert old inventory produced stock
            inventoryRepository.findByCrateTypeAndMaterialType(ppd.getCrateType(), "Plastic").ifPresent(inv -> {
                inv.setProducedStock(Math.max(0, inv.getProducedStock() - ppd.getSuccessful()));
                inventoryRepository.save(inv);
            });

            // Apply updates
            ppd.setDate(details.getDate());
            ppd.setCrateType(details.getCrateType());
            ppd.setTotalProduction(details.getTotalProduction());
            ppd.setSuccessful(details.getSuccessful());
            ppd.setRejected(details.getRejected());
            ppd.setShift(details.getShift());
            Ppd saved = ppdRepository.save(ppd);

            // Apply new inventory produced stock
            String materialType = "Plastic";
            Optional<Inventory> invOpt = inventoryRepository.findByCrateTypeAndMaterialType(saved.getCrateType(), materialType);
            Inventory inv = invOpt.orElseGet(() -> {
                Inventory i = new Inventory();
                i.setCrateType(saved.getCrateType());
                i.setMaterialType(materialType);
                i.setOpeningStock(0);
                i.setProducedStock(0);
                i.setSoldStock(0);
                return i;
            });
            inv.setProducedStock(inv.getProducedStock() + saved.getSuccessful());
            inventoryRepository.save(inv);

            saveAuditLog("Updated production entry ID: " + id, "PPD", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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
    public ResponseEntity<?> createPpm(@RequestBody Ppm ppm) {
        if (ppm.getMonth() != null && ppm.getYear() != null) {
            List<Ppm> existing = ppmRepository.findAll();
            boolean isDup = existing.stream().anyMatch(p -> 
                Boolean.TRUE.equals(p.getIsActive()) &&
                ppm.getMonth().equalsIgnoreCase(p.getMonth()) && 
                ppm.getYear().equals(p.getYear())
            );
            if (isDup) {
                return ResponseEntity.badRequest().body("A monthly summary for " + ppm.getMonth() + " " + ppm.getYear() + " already exists.");
            }
        }
        Ppm saved = ppmRepository.save(ppm);
        saveAuditLog("Created monthly production summary: " + saved.getMonth() + "/" + saved.getYear(), "PPM", null, toJson(saved));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/ppm/{id}")
    public ResponseEntity<Ppm> updatePpm(@PathVariable String id, @RequestBody Ppm details) {
        return ppmRepository.findById(id).map(ppm -> {
            String oldState = toJson(ppm);
            ppm.setMonth(details.getMonth());
            ppm.setYear(details.getYear());
            ppm.setCratesProduced(details.getCratesProduced());
            ppm.setElectricityUnits(details.getElectricityUnits());
            ppm.setElectricityBill(details.getElectricityBill());
            Ppm saved = ppmRepository.save(ppm);
            saveAuditLog("Updated monthly production ID: " + id, "PPM", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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

    // --- Production Forecasting Endpoints ---
    @GetMapping("/forecast/demand/{monthsAhead}")
    public Map<String, Object> forecastDemand(@PathVariable int monthsAhead) {
        return forecastService.forecastDemand(monthsAhead);
    }

    @GetMapping("/forecast/shift-optimization")
    public Map<String, Object> getShiftOptimization() {
        return forecastService.getShiftOptimization();
    }

    @GetMapping("/forecast/electricity-analysis")
    public Map<String, Object> getElectricityAnalysis() {
        return forecastService.getElectricityAnalysis();
    }

    @GetMapping("/forecast/material-requirements")
    public Map<String, Object> predictMaterialRequirements() {
        return forecastService.predictMaterialRequirements();
    }

    @GetMapping("/forecast/efficiency-trend")
    public Map<String, Object> getEfficiencyTrend() {
        return forecastService.getEfficiencyTrend();
    }

    // Scheduled job endpoint
    @GetMapping("/forecast/check-materials")
    public String checkMaterialRequirements() {
        forecastService.checkMaterialRequirements();
        return "Material requirements checked successfully";
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

    @PutMapping("/raw-materials/{id}")
    public ResponseEntity<RawMaterial> updateRawMaterial(@PathVariable String id, @RequestBody RawMaterial details) {
        return rawMaterialRepository.findById(id).map(rm -> {
            String oldState = toJson(rm);
            rm.setDate(details.getDate());
            rm.setMaterialName(details.getMaterialName());
            if (details.getVendor() != null) rm.setVendor(details.getVendor());
            rm.setWeight(details.getWeight());
            rm.setRate(details.getRate());
            rm.setAmount(details.getAmount());
            rm.setPurchaseBillPath(details.getPurchaseBillPath());
            rm.setWeightSlipPath(details.getWeightSlipPath());
            RawMaterial saved = rawMaterialRepository.save(rm);
            saveAuditLog("Updated raw material: " + saved.getMaterialName(), "Raw_Material", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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


