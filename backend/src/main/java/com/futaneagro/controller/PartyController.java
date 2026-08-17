package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PartyController {

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

    // --- Party Endpoints ---
    @GetMapping("/parties")
    public List<Party> getAllParties() {
        return partyRepository.findAll();
    }

    @PostMapping("/parties")
    @Transactional
    public Party createParty(@Valid @RequestBody Party party) {
        Party saved = partyRepository.save(party);
        saveAuditLog("Created party: " + saved.getPartyName(), "Party", null, toJson(saved));
        return saved;
    }

    @PutMapping("/parties/{id}")
    @Transactional
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

    @DeleteMapping("/parties/{id}")
    @Transactional
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
    @GetMapping("/vendors")
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @PostMapping("/vendors")
    @Transactional
    public Vendor createVendor(@Valid @RequestBody Vendor vendor) {
        Vendor saved = vendorRepository.save(vendor);
        saveAuditLog("Created vendor: " + saved.getVendorName(), "Vendor", null, toJson(saved));
        return saved;
    }

    @PutMapping("/vendors/{id}")
    @Transactional
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

    @DeleteMapping("/vendors/{id}")
    @Transactional
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
    @GetMapping("/drivers")
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @PostMapping("/drivers")
    @Transactional
    public Driver createDriver(@RequestBody Driver driver) {
        Driver saved = driverRepository.save(driver);
        saveAuditLog("Created driver: " + saved.getDriverName(), "Driver", null, toJson(saved));
        return saved;
    }

    @PutMapping("/drivers/{id}")
    @Transactional
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

    @DeleteMapping("/drivers/{id}")
    @Transactional
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
