package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class SalesController {

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private PaymentCollectionRepository paymentCollectionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

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

    // --- Sales Endpoints ---
    @GetMapping("/sales")
    public List<Sales> getAllSales() {
        return salesRepository.findAll();
    }

    @PostMapping("/sales")
    public Sales createSale(@RequestBody Sales sale) {
        // Enforce server-side totals and remaining balance calculation to prevent parameter tampering
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
        invoice.setInvoiceNo("INV-" + LocalDate.now().toString().replace("-", "") + "-" + savedSale.getId());
        invoiceRepository.save(invoice);

        saveAuditLog("Created sale entry for party: " + savedSale.getParty().getPartyName(), "Sales", null, toJson(savedSale));
        return savedSale;
    }

    @DeleteMapping("/sales/{id}")
    public void deleteSale(@PathVariable String id) {
        salesRepository.findById(id).ifPresent(sale -> {
            String oldState = toJson(sale);
            // Revert inventory sold stock
            inventoryRepository.findByCrateTypeAndMaterialType(sale.getCrateType(), sale.getCrateMaterial()).ifPresent(inv -> {
                inv.setSoldStock(Math.max(0, inv.getSoldStock() - sale.getQuantity()));
                inventoryRepository.save(inv);
            });
            // Soft-delete associated invoices
            invoiceRepository.findAll().stream()
                .filter(inv -> inv.getSale() != null && inv.getSale().getId().equals(id))
                .forEach(inv -> {
                    inv.setIsActive(false);
                    inv.setUpdatedBy(getCurrentUser());
                    inv.setUpdatedAt(java.time.LocalDateTime.now());
                    invoiceRepository.save(inv);
                });

            // Soft-delete sale
            sale.setIsActive(false);
            sale.setUpdatedBy(getCurrentUser());
            sale.setUpdatedAt(java.time.LocalDateTime.now());
            salesRepository.save(sale);

            saveAuditLog("Soft-deleted sale ID: " + id, "Sales", oldState, null);
        });
    }

    // --- Payment Collection Endpoints ---
    @GetMapping("/payments")
    public List<PaymentCollection> getAllPayments() {
        return paymentCollectionRepository.findAll();
    }

    @PostMapping("/payments")
    public PaymentCollection createPayment(@RequestBody PaymentCollection payment) {
        PaymentCollection saved = paymentCollectionRepository.save(payment);

        // If payment is for a specific invoice, update the corresponding Sales Paid status
        if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
            Optional<Invoice> invOpt = invoiceRepository.findByInvoiceNo(payment.getInvoiceNo());
            if (invOpt.isPresent()) {
                Sales sale = invOpt.get().getSale();
                java.math.BigDecimal newPaid = sale.getPaid().add(payment.getAmountReceived());
                if (newPaid.compareTo(sale.getTotalAmount()) > 0) {
                    throw new IllegalArgumentException("Payment amount exceeds remaining invoice balance.");
                }
                sale.setPaid(newPaid);
                sale.setRemaining(sale.getTotalAmount().subtract(newPaid));
                salesRepository.save(sale);
            }
        }
        saveAuditLog("Created payment record for party ID: " + saved.getParty().getId(), "Payment_Collection", null, toJson(saved));
        return saved;
    }

    @DeleteMapping("/payments/{id}")
    public void deletePayment(@PathVariable String id) {
        paymentCollectionRepository.findById(id).ifPresent(payment -> {
            String oldState = toJson(payment);
            // Revert payment from Sales Paid status
            if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
                invoiceRepository.findByInvoiceNo(payment.getInvoiceNo()).ifPresent(inv -> {
                    Sales sale = inv.getSale();
                    java.math.BigDecimal newPaid = sale.getPaid().subtract(payment.getAmountReceived());
                    sale.setPaid(newPaid);
                    sale.setRemaining(sale.getTotalAmount().subtract(newPaid));
                    salesRepository.save(sale);
                });
            }
            payment.setIsActive(false);
            payment.setUpdatedBy(getCurrentUser());
            payment.setUpdatedAt(java.time.LocalDateTime.now());
            paymentCollectionRepository.save(payment);

            saveAuditLog("Soft-deleted payment ID: " + id, "Payment_Collection", oldState, null);
        });
    }

    // --- Invoice Endpoints ---
    @GetMapping("/invoices")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }
}



