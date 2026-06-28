package com.futaneagro.service;

import com.futaneagro.entity.Inventory;
import com.futaneagro.entity.Invoice;
import com.futaneagro.entity.Sales;
import com.futaneagro.repository.InventoryRepository;
import com.futaneagro.repository.InvoiceRepository;
import com.futaneagro.repository.SalesRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SalesService {

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private AuditService auditService;

    public List<Sales> getAllSales() {
        return salesRepository.findAll();
    }

    @Transactional
    public Sales createSale(Sales sale) {
        // Enforce server-side totals and remaining balance calculation
        sale.calculateTotals();
        Sales savedSale = salesRepository.save(sale);

        // Update Inventory: Sold Stock Increase
        Optional<Inventory> invOpt = inventoryRepository.findByCrateTypeAndMaterialType(sale.getCrateType(), sale.getCrateMaterial());
        Inventory inv;
        if (invOpt.isPresent()) {
            inv = invOpt.get();
        } else {
            inv = new Inventory();
            inv.setCrateType(sale.getCrateType());
            inv.setMaterialType(sale.getCrateMaterial());
            inv.setOpeningStock(0);
            inv.setProducedStock(0);
            inv.setSoldStock(0);
        }
        inv.setSoldStock(inv.getSoldStock() + sale.getQuantity());
        inventoryRepository.save(inv);

        // Auto-generate Invoice
        Invoice invoice = new Invoice();
        invoice.setSale(savedSale);
        invoice.setCreatedDate(LocalDate.now());
        invoice.setInvoiceNo("INV-" + LocalDate.now().toString().replace("-", "") + "-" + savedSale.getSaleId());
        invoiceRepository.save(invoice);

        auditService.saveAuditLog("Created sale entry for party: " + savedSale.getParty().getPartyName(), "Sales", null, auditService.toJson(savedSale));
        return savedSale;
    }

    @Transactional
    public void deleteSale(Integer id) {
        salesRepository.findById(id).ifPresent(sale -> {
            String oldState = auditService.toJson(sale);
            
            // Revert inventory sold stock
            inventoryRepository.findByCrateTypeAndMaterialType(sale.getCrateType(), sale.getCrateMaterial()).ifPresent(inv -> {
                inv.setSoldStock(Math.max(0, inv.getSoldStock() - sale.getQuantity()));
                inventoryRepository.save(inv);
            });
            
            // Soft-delete associated invoices
            invoiceRepository.findBySaleSaleId(id).forEach(inv -> {
                inv.setIsDeleted(true);
                inv.setDeletedBy(SecurityUtils.getCurrentUser());
                inv.setDeletedDate(LocalDate.now());
                invoiceRepository.save(inv);
            });

            // Soft-delete sale
            sale.setIsDeleted(true);
            sale.setDeletedBy(SecurityUtils.getCurrentUser());
            sale.setDeletedDate(LocalDate.now());
            salesRepository.save(sale);

            auditService.saveAuditLog("Soft-deleted sale ID: " + id, "Sales", oldState, null);
        });
    }
}
