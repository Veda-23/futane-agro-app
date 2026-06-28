package com.futaneagro.service;

import com.futaneagro.entity.Inventory;
import com.futaneagro.entity.Ppd;
import com.futaneagro.repository.InventoryRepository;
import com.futaneagro.repository.PpdRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ProductionService {

    @Autowired
    private PpdRepository ppdRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AuditService auditService;

    public List<Ppd> getAllPpd() {
        return ppdRepository.findAll();
    }

    @Transactional
    public Ppd createPpd(Ppd ppd) {
        Ppd saved = ppdRepository.save(ppd);

        // Update Inventory: Produced Stock Increase
        String materialType = "Plastic";
        Optional<Inventory> invOpt = inventoryRepository.findByCrateTypeAndMaterialType(ppd.getCrateType(), materialType);
        Inventory inv;
        if (invOpt.isPresent()) {
            inv = invOpt.get();
        } else {
            inv = new Inventory();
            inv.setCrateType(ppd.getCrateType());
            inv.setMaterialType(materialType);
            inv.setOpeningStock(0);
            inv.setProducedStock(0);
            inv.setSoldStock(0);
        }
        inv.setProducedStock(inv.getProducedStock() + ppd.getSuccessful());
        inventoryRepository.save(inv);

        auditService.saveAuditLog("Created production entry for crate: " + saved.getCrateType(), "PPD", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deletePpd(Integer id) {
        ppdRepository.findById(id).ifPresent(ppd -> {
            String oldState = auditService.toJson(ppd);
            
            // Revert Inventory change
            inventoryRepository.findByCrateTypeAndMaterialType(ppd.getCrateType(), "Plastic").ifPresent(inv -> {
                inv.setProducedStock(Math.max(0, inv.getProducedStock() - ppd.getSuccessful()));
                inventoryRepository.save(inv);
            });
            
            ppd.setIsDeleted(true);
            ppd.setDeletedBy(SecurityUtils.getCurrentUser());
            ppd.setDeletedDate(LocalDate.now());
            ppdRepository.save(ppd);
            
            auditService.saveAuditLog("Soft-deleted production entry ID: " + id, "PPD", oldState, null);
        });
    }
}
