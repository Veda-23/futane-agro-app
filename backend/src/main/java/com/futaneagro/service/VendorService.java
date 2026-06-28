package com.futaneagro.service;

import com.futaneagro.entity.Vendor;
import com.futaneagro.repository.VendorRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private AuditService auditService;

    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @Transactional
    public Vendor createVendor(Vendor vendor) {
        Vendor saved = vendorRepository.save(vendor);
        auditService.saveAuditLog("Created vendor: " + saved.getVendorName(), "Vendor", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Vendor updateVendor(Integer id, Vendor details) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found"));
        String oldState = auditService.toJson(vendor);

        vendor.setVendorName(details.getVendorName());
        vendor.setMobile(details.getMobile());
        vendor.setAddress(details.getAddress());
        vendor.setGstNumber(details.getGstNumber());

        Vendor saved = vendorRepository.save(vendor);
        auditService.saveAuditLog("Updated vendor: " + saved.getVendorName(), "Vendor", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteVendor(Integer id) {
        vendorRepository.findById(id).ifPresent(vendor -> {
            String oldState = auditService.toJson(vendor);
            vendor.setIsDeleted(true);
            vendor.setDeletedBy(SecurityUtils.getCurrentUser());
            vendor.setDeletedDate(LocalDate.now());
            vendorRepository.save(vendor);
            auditService.saveAuditLog("Soft-deleted vendor ID: " + id, "Vendor", oldState, null);
        });
    }
}
