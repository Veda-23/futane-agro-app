package com.futaneagro.service;

import com.futaneagro.entity.RawMaterial;
import com.futaneagro.repository.RawMaterialRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RawMaterialService {

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private AuditService auditService;

    public List<RawMaterial> getAllRawMaterials() {
        return rawMaterialRepository.findAll();
    }

    @Transactional
    public RawMaterial createRawMaterial(RawMaterial rawMaterial) {
        RawMaterial saved = rawMaterialRepository.save(rawMaterial);
        auditService.saveAuditLog("Created raw material entry: " + saved.getMaterialName(), "Raw_Material", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteRawMaterial(Integer id) {
        rawMaterialRepository.findById(id).ifPresent(rm -> {
            String oldState = auditService.toJson(rm);
            rm.setIsDeleted(true);
            rm.setDeletedBy(SecurityUtils.getCurrentUser());
            rm.setDeletedDate(LocalDate.now());
            rawMaterialRepository.save(rm);
            auditService.saveAuditLog("Soft-deleted raw material ID: " + id, "Raw_Material", oldState, null);
        });
    }
}
