package com.futaneagro.service;

import com.futaneagro.entity.MachineMaster;
import com.futaneagro.entity.MachineBreakdown;
import com.futaneagro.repository.MachineMasterRepository;
import com.futaneagro.repository.MachineBreakdownRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MachineService {

    @Autowired
    private MachineMasterRepository machineRepo;

    @Autowired
    private MachineBreakdownRepository breakdownRepo;

    @Autowired
    private AuditService auditService;

    // --- Machine Master ---
    public List<MachineMaster> getAllMachines() {
        return machineRepo.findAll();
    }

    @Transactional
    public MachineMaster createMachine(MachineMaster machine) {
        MachineMaster saved = machineRepo.save(machine);
        auditService.saveAuditLog("Created machine: " + saved.getMachineName(), "Machine_Master", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public MachineMaster updateMachine(Integer id, MachineMaster details) {
        MachineMaster machine = machineRepo.findById(id).orElseThrow(() -> new RuntimeException("Machine not found"));
        String oldState = auditService.toJson(machine);
        
        machine.setMachineName(details.getMachineName());
        machine.setManufacturer(details.getManufacturer());
        machine.setPurchaseDate(details.getPurchaseDate());
        machine.setWarrantyDate(details.getWarrantyDate());
        machine.setStatus(details.getStatus());
        
        MachineMaster saved = machineRepo.save(machine);
        auditService.saveAuditLog("Updated machine: " + saved.getMachineName(), "Machine_Master", oldState, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteMachine(Integer id) {
        machineRepo.findById(id).ifPresent(machine -> {
            String oldState = auditService.toJson(machine);
            machine.setIsDeleted(true);
            machine.setDeletedBy(SecurityUtils.getCurrentUser());
            machine.setDeletedDate(LocalDate.now());
            machineRepo.save(machine);
            auditService.saveAuditLog("Soft-deleted machine ID: " + id, "Machine_Master", oldState, null);
        });
    }

    // --- Machine Breakdown ---
    public List<MachineBreakdown> getAllBreakdowns() {
        return breakdownRepo.findAll();
    }

    @Transactional
    public MachineBreakdown createBreakdown(MachineBreakdown breakdown) {
        MachineBreakdown saved = breakdownRepo.save(breakdown);
        auditService.saveAuditLog("Logged breakdown for machine ID: " + saved.getMachine().getMachineId(), "Machine_Breakdown", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deleteBreakdown(Integer id) {
        breakdownRepo.findById(id).ifPresent(b -> {
            String oldState = auditService.toJson(b);
            b.setIsDeleted(true);
            b.setDeletedBy(SecurityUtils.getCurrentUser());
            b.setDeletedDate(LocalDate.now());
            breakdownRepo.save(b);
            auditService.saveAuditLog("Soft-deleted breakdown ID: " + id, "Machine_Breakdown", oldState, null);
        });
    }
}
