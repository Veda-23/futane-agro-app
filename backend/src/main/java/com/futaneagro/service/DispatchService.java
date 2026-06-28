package com.futaneagro.service;

import com.futaneagro.entity.Dispatch;
import com.futaneagro.repository.DispatchRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DispatchService {

    @Autowired
    private DispatchRepository dispatchRepo;

    @Autowired
    private AuditService auditService;

    public List<Dispatch> getAllDispatches() {
        return dispatchRepo.findAll();
    }

    @Transactional
    public Dispatch createDispatch(Dispatch dispatch) {
        Dispatch saved = dispatchRepo.save(dispatch);
        auditService.saveAuditLog("Created dispatch log: " + saved.getDispatchNumber(), "Dispatch", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public Dispatch updateDispatch(Integer id, Dispatch details) {
        Dispatch dispatch = dispatchRepo.findById(id).orElseThrow(() -> new RuntimeException("Dispatch not found"));
        String oldState = auditService.toJson(dispatch);
        
        dispatch.setVehicleNumber(details.getVehicleNumber());
        dispatch.setDriverName(details.getDriverName());
        dispatch.setDate(details.getDate());
        dispatch.setStatus(details.getStatus());
        
        Dispatch saved = dispatchRepo.save(dispatch);
        auditService.saveAuditLog("Updated dispatch: " + saved.getDispatchNumber(), "Dispatch", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteDispatch(Integer id) {
        dispatchRepo.findById(id).ifPresent(d -> {
            String oldState = auditService.toJson(d);
            d.setIsDeleted(true);
            d.setDeletedBy(SecurityUtils.getCurrentUser());
            d.setDeletedDate(LocalDate.now());
            dispatchRepo.save(d);
            auditService.saveAuditLog("Soft-deleted dispatch ID: " + id, "Dispatch", oldState, null);
        });
    }
}
