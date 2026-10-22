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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Production Planning & Manufacturing Management REST Controller.
 *
 * Core Responsibilities:
 * 1. Daily Production Runs (/api/ppd): Logs shift production (Morning/Evening/Night), successful crates,
 *    and rejected crates. Automatically increments/decrements finished goods inventory (`t_inv_inventory`).
 * 2. Monthly Factory Production (/api/ppm): Aggregates monthly crates produced, electricity consumption (units),
 *    and energy bills for cost accounting and efficiency analysis.
 * 3. Raw Materials Procurement (/api/raw-materials): Inbound plastic granules, masterbatches, and vendor weight slips.
 * 4. Production Forecasting (/api/forecast/**): 7-day predictive demand, shift machine allocation, and BOM calculation.
 * 5. Real-Time Telemetry: Dispatches WebSocket events via `NotificationBroadcastService` when factory production updates.
 */
@RestController
@RequestMapping("/api")
public class ProductionController {

    private static final Logger log = LoggerFactory.getLogger(ProductionController.class);

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

    // =========================================================================
    // PPD (PRODUCTION PER DAY) ENDPOINTS
    // =========================================================================

    /**
     * Retrieves all active daily production run records.
     * Uses read-only transaction for optimal database connection throughput.
     */
    @GetMapping("/ppd")
    @Transactional(readOnly = true)
    public List<Ppd> getAllPpd() {
        return ppdRepository.findAll();
    }

    /**
     * Creates a new daily production run and synchronizes finished goods stock.
     *
     * HOW IT WORKS:
     * 1. Persists Ppd record (Date, Crate Type, Shift, Total, Successful, Rejected).
     * 2. Automatically adjusts Finished Goods Inventory (`t_inv_inventory`):
     *    Increments `producedStock` by `ppd.getSuccessful()` count.
     * 3. Dispatches a real-time WebSocket broadcast so operators' screens update live without page refresh.
     * 4. Appends record to immutable audit log (`audit_log`).
     *
     * @param ppd Ppd entity payload from UI modal.
     * @return Saved Ppd record with generated UUID.
     */
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

    /**
     * Updates an existing daily production run with delta inventory re-calculation.
     *
     * HOW IT WORKS:
     * 1. Reverts previous successful crate count from `t_inv_inventory`.
     * 2. Updates Ppd record fields.
     * 3. Applies the newly modified successful crate count to `t_inv_inventory`.
     * 4. Logs before/after state diff in `audit_log`.
     */
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

    /**
     * Soft-deletes a daily production run and rolls back the finished stock from inventory.
     */
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

    // =========================================================================
    // PPM (PRODUCTION PER MONTH) ENDPOINTS
    // =========================================================================

    /**
     * Retrieves all monthly factory production summaries.
     */
    @GetMapping("/ppm")
    @Transactional(readOnly = true)
    public List<Ppm> getAllPpm() {
        return ppmRepository.findAll();
    }

    /**
     * Records a new monthly factory production and utility summary.
     * Prevents duplicate summaries for the same month and year.
     */
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

    /**
     * Modifies an existing monthly summary record with before/after audit tracking.
     */
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

    /**
     * Soft-deletes a monthly production summary (`is_active = false`).
     */
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

    // =========================================================================
    // PRODUCTION FORECASTING & MACHINE ANALYTICS ENDPOINTS
    // =========================================================================

    /**
     * Predictive demand forecasting across forward calendar months.
     */
    @GetMapping("/forecast/demand/{monthsAhead}")
    public Map<String, Object> forecastDemand(@PathVariable int monthsAhead) {
        return forecastService.forecastDemand(monthsAhead);
    }

    /**
     * Calculates optimal machine scheduling across morning, evening, and night shifts.
     */
    @GetMapping("/forecast/shift-optimization")
    public Map<String, Object> getShiftOptimization() {
        return forecastService.getShiftOptimization();
    }

    /**
     * Analyzes kWh electricity usage per crate produced to flag abnormal motor wear.
     */
    @GetMapping("/forecast/electricity-analysis")
    public Map<String, Object> getElectricityAnalysis() {
        return forecastService.getElectricityAnalysis();
    }

    /**
     * Predicts raw material stock runout dates based on current manufacturing velocity.
     */
    @GetMapping("/forecast/material-requirements")
    public Map<String, Object> predictMaterialRequirements() {
        return forecastService.predictMaterialRequirements();
    }

    /**
     * Generates machine efficiency trends and scrap percentage trajectories.
     */
    @GetMapping("/forecast/efficiency-trend")
    public Map<String, Object> getEfficiencyTrend() {
        return forecastService.getEfficiencyTrend();
    }

    /**
     * Automated health check endpoint for raw material inventory levels.
     */
    @GetMapping("/forecast/check-materials")
    public String checkMaterialRequirements() {
        forecastService.checkMaterialRequirements();
        return "Material requirements checked successfully";
    }

    // =========================================================================
    // RAW MATERIALS PROCUREMENT ENDPOINTS
    // =========================================================================

    /**
     * Retrieves all active raw material procurement logs.
     */
    @GetMapping("/raw-materials")
    @Transactional(readOnly = true)
    public List<RawMaterial> getAllRawMaterials() {
        return rawMaterialRepository.findAll();
    }

    /**
     * Records new inbound raw material delivery with weight, rate, and supplier.
     */
    @PostMapping("/raw-materials")
    public RawMaterial createRawMaterial(@RequestBody RawMaterial rawMaterial) {
        RawMaterial saved = rawMaterialRepository.save(rawMaterial);
        saveAuditLog("Created raw material entry: " + saved.getMaterialName(), "Raw_Material", null, toJson(saved));
        return saved;
    }

    /**
     * Updates an inbound raw material delivery and bill attachments.
     */
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

    /**
     * Soft-deletes a raw material procurement record.
     */
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


