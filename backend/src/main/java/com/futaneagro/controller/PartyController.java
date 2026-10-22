package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * <h1>PartyController</h1>
 * <p>
 * Central CRM and Master Directory controller for Futane Agro ERP:
 * <ul>
 *   <li><b>Parties (Customers & Dealers):</b> Customer contact details, GSTIN, PAN, billing/shipping addresses, and compliance documents.</li>
 *   <li><b>Vendors (Suppliers):</b> Raw material (HDPE/PP granules), masterbatch pigments, and maintenance vendor records.</li>
 *   <li><b>Drivers (Logistics):</b> Driver contact directory, driving license numbers, and logistics dispatch assignments.</li>
 * </ul>
 * </p>
 *
 * <h3>Caching & Audit Invariants:</h3>
 * <ul>
 *   <li>Reads are accelerated via Spring Cache ({@code 'parties'}, {@code 'vendors'}, {@code 'drivers'}).</li>
 *   <li>Every write/mutation evicts matching cache regions and writes before/after state snapshots to {@code t_sec_audit_log}.</li>
 *   <li>Deletions perform soft-deletion ({@code isDeleted = true, isActive = false}) with audit tracking of {@code deletedBy} and {@code deletedDate}.</li>
 * </ul>
 *
 * @author Futane Agro Engineering Team
 * @version 2.0 (Enterprise Multi-Tenant)
 */
@RestController
@RequestMapping("/api")
public class PartyController {

    private static final Logger log = LoggerFactory.getLogger(PartyController.class);

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private AuditLogRepository auditRepo;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Resolves the current authenticated user's principal name from Spring Security.
     *
     * @return Username string, or "system" if unauthenticated.
     */
    private String getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal != null) ? principal.toString() : "system";
    }

    /**
     * Writes an audit trail record to {@code t_sec_audit_log}.
     *
     * @param action    Operation description.
     * @param tableName Target entity table name.
     * @param oldValue  JSON representation before mutation.
     * @param newValue  JSON representation after mutation.
     */
    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setUsername(getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
    }

    /**
     * Serializes any entity to JSON string for audit snapshots.
     *
     * @param obj Target entity.
     * @return JSON string representation.
     */
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    // --- Party Endpoints ---

    /**
     * Retrieves all customer and dealer parties from the database.
     * <p>Cached in Spring Cache {@code 'parties'} region.</p>
     *
     * @return List of all registered {@link Party} entities.
     */
    @GetMapping("/parties")
    @Transactional(readOnly = true)
    @Cacheable(value = "parties")
    public List<Party> getAllParties() {
        return partyRepository.findAll();
    }

    /**
     * Creates a new customer/dealer party profile.
     * <p>Evicts {@code 'parties'} cache and records an audit log snapshot.</p>
     *
     * @param party The party entity containing name, address, GSTIN, PAN, and contact details.
     * @return The persisted {@link Party} entity.
     */
    @PostMapping("/parties")
    @Transactional
    @CacheEvict(value = "parties", allEntries = true)
    public Party createParty(@Valid @RequestBody Party party) {
        Party saved = partyRepository.save(party);
        saveAuditLog("Created party: " + saved.getPartyName(), "Party", null, toJson(saved));
        return saved;
    }

    /**
     * Updates an existing customer/party record.
     *
     * @param id      Unique party ID.
     * @param details Updated party parameters.
     * @return {@link ResponseEntity} containing updated {@link Party}, or 404 if not found.
     */
    @PutMapping("/parties/{id}")
    @Transactional
    @CacheEvict(value = "parties", allEntries = true)
    public ResponseEntity<Party> updateParty(@PathVariable String id, @Valid @RequestBody Party details) {
        return partyRepository.findById(id).map(party -> {
            String oldState = toJson(party);

            party.setPartyName(details.getPartyName());
            party.setPartyAddress(details.getPartyAddress());
            party.setPartyContact(details.getPartyContact());
            party.setGstNumber(details.getGstNumber());
            party.setEmail(details.getEmail());
            party.setCity(details.getCity());
            party.setState(details.getState());
            party.setIsActive(details.getIsActive() != null ? details.getIsActive() : true);
            party.setGstCertPath(details.getGstCertPath());
            party.setPanCardPath(details.getPanCardPath());
            party.setAgreementPath(details.getAgreementPath());

            Party saved = partyRepository.save(party);
            saveAuditLog("Updated party: " + saved.getPartyName(), "Party", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-deletes a customer/party record.
     * <p>Sets {@code isDeleted = true, isActive = false}, tracks audit user, and purges cache.</p>
     *
     * @param id Unique party ID to delete.
     * @return 204 No Content on success, or 404 Not Found.
     */
    @DeleteMapping("/parties/{id}")
    @Transactional
    @CacheEvict(value = "parties", allEntries = true)
    public ResponseEntity<Void> deleteParty(@PathVariable String id) {
        return partyRepository.findById(id).map(party -> {
            String oldState = toJson(party);
            party.setDeletedBy(getCurrentUser());
            party.setDeletedDate(java.time.LocalDateTime.now());
            party.setIsDeleted(true);
            party.setIsActive(false);
            partyRepository.save(party);
            partyRepository.deleteById(id);
            saveAuditLog("DELETED party: " + party.getPartyName(), "Party", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Vendor Endpoints ---

    /**
     * Retrieves all registered suppliers and raw material vendors.
     * <p>Cached in Spring Cache {@code 'vendors'} region.</p>
     *
     * @return List of all {@link Vendor} entities.
     */
    @GetMapping("/vendors")
    @Transactional(readOnly = true)
    @Cacheable(value = "vendors")
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    /**
     * Registers a new supplier/vendor profile.
     * <p>Evicts {@code 'vendors'} cache and saves audit snapshot.</p>
     *
     * @param vendor Supplier details including name, mobile, address, and GSTIN.
     * @return Persisted {@link Vendor} entity.
     */
    @PostMapping("/vendors")
    @Transactional
    @CacheEvict(value = "vendors", allEntries = true)
    public Vendor createVendor(@Valid @RequestBody Vendor vendor) {
        Vendor saved = vendorRepository.save(vendor);
        saveAuditLog("Created vendor: " + saved.getVendorName(), "Vendor", null, toJson(saved));
        return saved;
    }

    /**
     * Updates an existing vendor profile.
     *
     * @param id      Unique vendor primary key.
     * @param details Updated vendor attributes.
     * @return {@link ResponseEntity} with updated {@link Vendor}, or 404 if not found.
     */
    @PutMapping("/vendors/{id}")
    @Transactional
    @CacheEvict(value = "vendors", allEntries = true)
    public ResponseEntity<Vendor> updateVendor(@PathVariable String id, @Valid @RequestBody Vendor details) {
        return vendorRepository.findById(id).map(vendor -> {
            String oldState = toJson(vendor);

            vendor.setVendorName(details.getVendorName());
            vendor.setMobile(details.getMobile());
            vendor.setAddress(details.getAddress());
            vendor.setGstNumber(details.getGstNumber());

            Vendor saved = vendorRepository.save(vendor);
            saveAuditLog("Updated vendor: " + saved.getVendorName(), "Vendor", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-deletes a vendor profile.
     *
     * @param id Unique vendor primary key.
     * @return 204 No Content on success, or 404 Not Found.
     */
    @DeleteMapping("/vendors/{id}")
    @Transactional
    @CacheEvict(value = "vendors", allEntries = true)
    public ResponseEntity<Void> deleteVendor(@PathVariable String id) {
        return vendorRepository.findById(id).map(vendor -> {
            String oldState = toJson(vendor);
            vendor.setDeletedBy(getCurrentUser());
            vendor.setDeletedDate(java.time.LocalDateTime.now());
            vendor.setIsDeleted(true);
            vendor.setIsActive(false);
            vendorRepository.save(vendor);
            vendorRepository.deleteById(id);
            saveAuditLog("DELETED vendor: " + vendor.getVendorName(), "Vendor", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Driver Endpoints ---

    /**
     * Retrieves all registered logistics and vehicle drivers.
     * <p>Cached in Spring Cache {@code 'drivers'} region.</p>
     *
     * @return List of all {@link Driver} records.
     */
    @GetMapping("/drivers")
    @Transactional(readOnly = true)
    @Cacheable(value = "drivers")
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    /**
     * Registers a new logistics driver.
     * <p>Evicts {@code 'drivers'} cache and records audit trail.</p>
     *
     * @param driver Driver profile with name, mobile, licenseNumber, and address.
     * @return Persisted {@link Driver} entity.
     */
    @PostMapping("/drivers")
    @Transactional
    @CacheEvict(value = "drivers", allEntries = true)
    public Driver createDriver(@RequestBody Driver driver) {
        Driver saved = driverRepository.save(driver);
        saveAuditLog("Created driver: " + saved.getDriverName(), "Driver", null, toJson(saved));
        return saved;
    }

    /**
     * Updates an existing driver profile.
     *
     * @param id      Unique driver ID.
     * @param details Updated driver parameters.
     * @return {@link ResponseEntity} with updated {@link Driver}, or 404 if not found.
     */
    @PutMapping("/drivers/{id}")
    @Transactional
    @CacheEvict(value = "drivers", allEntries = true)
    public ResponseEntity<Driver> updateDriver(@PathVariable String id, @RequestBody Driver details) {
        return driverRepository.findById(id).map(driver -> {
            String oldState = toJson(driver);

            driver.setDriverName(details.getDriverName());
            driver.setMobile(details.getMobile());
            driver.setLicenseNumber(details.getLicenseNumber());
            driver.setAddress(details.getAddress());

            Driver saved = driverRepository.save(driver);
            saveAuditLog("Updated driver: " + saved.getDriverName(), "Driver", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-deletes a driver profile.
     *
     * @param id Unique driver ID to delete.
     * @return 204 No Content on success, or 404 Not Found.
     */
    @DeleteMapping("/drivers/{id}")
    @Transactional
    @CacheEvict(value = "drivers", allEntries = true)
    public ResponseEntity<Void> deleteDriver(@PathVariable String id) {
        return driverRepository.findById(id).map(driver -> {
            String oldState = toJson(driver);
            driver.setDeletedBy(getCurrentUser());
            driver.setDeletedDate(java.time.LocalDateTime.now());
            driver.setIsDeleted(true);
            driver.setIsActive(false);
            driverRepository.save(driver);
            driverRepository.deleteById(id);
            saveAuditLog("DELETED driver: " + driver.getDriverName(), "Driver", oldState, null);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
