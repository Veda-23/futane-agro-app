package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
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
    public Party createParty(@Valid @RequestBody Party party) {
        Party saved = partyRepository.save(party);
        saveAuditLog("Created party: " + saved.getPartyName(), "Party", null, toJson(saved));
        return saved;
    }

    @PutMapping("/parties/{id}")
    public Party updateParty(@PathVariable Integer id, @Valid @RequestBody Party details) {
        Party party = partyRepository.findById(id).orElseThrow(() -> new RuntimeException("Party not found"));
        String oldState = toJson(party);

        party.setPartyName(details.getPartyName());
        party.setPartyAddress(details.getPartyAddress());
        party.setPartyContact(details.getPartyContact());
        party.setGstNumber(details.getGstNumber());
        party.setEmail(details.getEmail());
        party.setCity(details.getCity());
        party.setState(details.getState());
        party.setIsActive(details.getIsActive());
        party.setGstCertPath(details.getGstCertPath());
        party.setPanCardPath(details.getPanCardPath());
        party.setAgreementPath(details.getAgreementPath());

        Party saved = partyRepository.save(party);
        saveAuditLog("Updated party: " + saved.getPartyName(), "Party", oldState, toJson(saved));
        return saved;
    }

    @DeleteMapping("/parties/{id}")
    public void deleteParty(@PathVariable Integer id) {
        partyRepository.findById(id).ifPresent(party -> {
            String oldState = toJson(party);
            party.setIsDeleted(true);
            party.setDeletedBy(getCurrentUser());
            party.setDeletedDate(LocalDate.now());
            partyRepository.save(party);
            saveAuditLog("Soft-deleted party ID: " + id, "Party", oldState, null);
        });
    }

    // --- Vendor Endpoints ---
    @GetMapping("/vendors")
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @PostMapping("/vendors")
    public Vendor createVendor(@Valid @RequestBody Vendor vendor) {
        Vendor saved = vendorRepository.save(vendor);
        saveAuditLog("Created vendor: " + saved.getVendorName(), "Vendor", null, toJson(saved));
        return saved;
    }

    @PutMapping("/vendors/{id}")
    public Vendor updateVendor(@PathVariable Integer id, @Valid @RequestBody Vendor details) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found"));
        String oldState = toJson(vendor);

        vendor.setVendorName(details.getVendorName());
        vendor.setMobile(details.getMobile());
        vendor.setAddress(details.getAddress());
        vendor.setGstNumber(details.getGstNumber());

        Vendor saved = vendorRepository.save(vendor);
        saveAuditLog("Updated vendor: " + saved.getVendorName(), "Vendor", oldState, toJson(saved));
        return saved;
    }

    @DeleteMapping("/vendors/{id}")
    public void deleteVendor(@PathVariable Integer id) {
        vendorRepository.findById(id).ifPresent(vendor -> {
            String oldState = toJson(vendor);
            vendor.setIsDeleted(true);
            vendor.setDeletedBy(getCurrentUser());
            vendor.setDeletedDate(LocalDate.now());
            vendorRepository.save(vendor);
            saveAuditLog("Soft-deleted vendor ID: " + id, "Vendor", oldState, null);
        });
    }

    // --- Driver Endpoints ---
    @GetMapping("/drivers")
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @PostMapping("/drivers")
    public Driver createDriver(@RequestBody Driver driver) {
        Driver saved = driverRepository.save(driver);
        saveAuditLog("Created driver: " + saved.getDriverName(), "Driver", null, toJson(saved));
        return saved;
    }

    @PutMapping("/drivers/{id}")
    public Driver updateDriver(@PathVariable Integer id, @RequestBody Driver details) {
        Driver driver = driverRepository.findById(id).orElseThrow(() -> new RuntimeException("Driver not found"));
        String oldState = toJson(driver);

        driver.setDriverName(details.getDriverName());
        driver.setMobile(details.getMobile());
        driver.setLicenseNumber(details.getLicenseNumber());
        driver.setAddress(details.getAddress());

        Driver saved = driverRepository.save(driver);
        saveAuditLog("Updated driver: " + saved.getDriverName(), "Driver", oldState, toJson(saved));
        return saved;
    }

    @DeleteMapping("/drivers/{id}")
    public void deleteDriver(@PathVariable Integer id) {
        driverRepository.findById(id).ifPresent(driver -> {
            String oldState = toJson(driver);
            driver.setIsDeleted(true);
            driver.setDeletedBy(getCurrentUser());
            driver.setDeletedDate(LocalDate.now());
            driverRepository.save(driver);
            saveAuditLog("Soft-deleted driver ID: " + id, "Driver", oldState, null);
        });
    }
}
