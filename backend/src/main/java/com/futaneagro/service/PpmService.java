package com.futaneagro.service;

import com.futaneagro.entity.Ppm;
import com.futaneagro.repository.PpmRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PpmService {

    @Autowired
    private PpmRepository ppmRepository;

    @Autowired
    private AuditService auditService;

    public List<Ppm> getAllPpm() {
        return ppmRepository.findAll();
    }

    @Transactional
    public Ppm createPpm(Ppm ppm) {
        Ppm saved = ppmRepository.save(ppm);
        auditService.saveAuditLog("Created monthly production summary: " + saved.getMonth() + "/" + saved.getYear(), "PPM", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deletePpm(Integer id) {
        ppmRepository.findById(id).ifPresent(ppm -> {
            String oldState = auditService.toJson(ppm);
            ppm.setIsDeleted(true);
            ppm.setDeletedBy(SecurityUtils.getCurrentUser());
            ppm.setDeletedDate(LocalDate.now());
            ppmRepository.save(ppm);
            auditService.saveAuditLog("Soft-deleted monthly production summary ID: " + id, "PPM", oldState, null);
        });
    }
}
