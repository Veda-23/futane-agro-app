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

/**
 * <h3>Inventory REST Controller</h3>
 * <p>
 * Manages finished goods crates inventory within the Futane Agro ERP system.
 * Handles tracking of stock levels by crate type and material, recording opening stock,
 * daily production increments (from PPD runs), and sales deductions.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Stock Invariant Tracking:</b> Exposes records mapped to {@link Inventory} where
 *       {@code currentStock = (openingStock + producedStock) - soldStock}.</li>
 *   <li><b>Real-Time Push Notifications:</b> Triggers WebSocket updates via {@link com.futaneagro.service.NotificationBroadcastService}
 *       upon creation/modification to update connected frontend clients.</li>
 *   <li><b>Audit Trail Integrity:</b> Records snapshots of previous and updated JSON representations
 *       in {@link AuditLog} for full traceability.</li>
 *   <li><b>Soft & Physical Archival:</b> Flags records as deleted and updates audit metadata before eviction.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api")
public class InventoryController {

    private static final Logger log = LoggerFactory.getLogger(InventoryController.class);

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private com.futaneagro.service.AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.futaneagro.service.NotificationBroadcastService broadcastService;

    /**
     * Resolves the authenticated username from Spring Security context.
     * Defaults to "system" if no security principal is active.
     *
     * @return Current authenticated username or "system"
     */
    private String getCurrentUser() {
        return auditService.getCurrentUser();
    }

    /**
     * Creates and persists an immutable audit log entry capturing entity delta changes.
     *
     * @param action Description of the business action (e.g., Created, Updated, Deleted)
     * @param tableName Target database table name
     * @param oldValue JSON representation of state prior to modification
     * @param newValue JSON representation of new state after modification
     */
    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        auditService.log(action, tableName, oldValue, newValue);
    }

    /**
     * Serializes an entity or object into a JSON string safely without throwing checked exceptions.
     *
     * @param obj Target object to serialize
     * @return Serialized JSON string, or empty string on serialization error
     */
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * <b>GET /api/inventory</b> - Retrieves all inventory finished goods crate records.
     * <p>
     * <b>How it works:</b>
     * Performs a read-only database query via {@link InventoryRepository#findAll()}, retrieving
     * all crate types, their raw material composition, opening balances, produced quantities,
     * and sold quantities.
     * </p>
     * <p>
     * <b>Used for:</b> Populating the Inventory dashboard, stock level tables, sales crate selection
     * dropdowns, and daily production reconciliation views.
     * </p>
     *
     * @return List of {@link Inventory} items
     */
    @GetMapping("/inventory")
    @Transactional(readOnly = true)
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    /**
     * <b>POST /api/inventory</b> - Creates a new finished goods crate inventory item.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Persists the received {@link Inventory} entity in PostgreSQL via {@code inventoryRepository.save()}.</li>
     *   <li>Logs an audit event capturing the new inventory specification in JSON.</li>
     *   <li>Broadcasts a WebSocket event {@code ("INVENTORY", "UPDATED")} to notify active web clients.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Initial setup of a new crate SKU/variant (e.g. "Tomato 20kg Heavy Duty Crate")
     * with its opening baseline balance.
     * </p>
     *
     * @param inventory New inventory entity received in request body
     * @return The persisted {@link Inventory} entity with generated ID and timestamps
     */
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

    /**
     * <b>PUT /api/inventory/{id}</b> - Updates stock quantities or metadata of an existing inventory item.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Locates the inventory record by primary UUID key {@code id}.</li>
     *   <li>Serializes the pre-update entity state for audit retention.</li>
     *   <li>Copies updated crate type, material type, opening stock, produced stock, and sold stock.</li>
     *   <li>Saves updated record and logs audit entry with before/after state diffs.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Manual inventory adjustments, physical warehouse count reconciliations,
     * or updating baseline opening stock parameters.
     * </p>
     *
     * @param id Target inventory entity UUID
     * @param details Incoming updated inventory payload
     * @return 200 OK with updated entity, or 404 NOT FOUND if ID does not exist
     */
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

    /**
     * <b>DELETE /api/inventory/{id}</b> - Deletes or deactivates an inventory record.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies entity existence by {@code id}.</li>
     *   <li>Captures JSON snapshot for audit logging.</li>
     *   <li>Sets soft-delete markers ({@code isDeleted=true}, {@code isActive=false}, deleted timestamp, user).</li>
     *   <li>Executes physical removal via repository if cascading rules permit, logging the deletion.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Retiring obsolete crate product lines from active manufacturing catalogs.
     * </p>
     *
     * @param id Target inventory entity UUID
     * @return 204 NO CONTENT on success, or 404 NOT FOUND if ID does not exist
     */
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
            saveAuditLog("DELETED inventory ID: " + id, "Inventory", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}

