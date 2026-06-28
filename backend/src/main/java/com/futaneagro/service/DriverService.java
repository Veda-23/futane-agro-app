package com.futaneagro.service;

import com.futaneagro.entity.Driver;
import com.futaneagro.repository.DriverRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private AuditService auditService;

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @Transactional
    public Driver createDriver(Driver driver) {
        Driver saved = driverRepository.save(driver);
        auditService.saveAuditLog("Created driver: " + saved.getDriverName(), "Driver", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Driver updateDriver(Integer id, Driver details) {
        Driver driver = driverRepository.findById(id).orElseThrow(() -> new RuntimeException("Driver not found"));
        String oldState = auditService.toJson(driver);

        driver.setDriverName(details.getDriverName());
        driver.setMobile(details.getMobile());
        driver.setLicenseNumber(details.getLicenseNumber());
        driver.setAddress(details.getAddress());

        Driver saved = driverRepository.save(driver);
        auditService.saveAuditLog("Updated driver: " + saved.getDriverName(), "Driver", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteDriver(Integer id) {
        driverRepository.findById(id).ifPresent(driver -> {
            String oldState = auditService.toJson(driver);
            driver.setIsDeleted(true);
            driver.setDeletedBy(SecurityUtils.getCurrentUser());
            driver.setDeletedDate(LocalDate.now());
            driverRepository.save(driver);
            auditService.saveAuditLog("Soft-deleted driver ID: " + id, "Driver", oldState, null);
        });
    }
}
