package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private com.futaneagro.service.NotificationBroadcastService broadcastService;

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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    @Transactional(rollbackFor = Exception.class)
    public Sales createSale(@RequestBody Sales sale) {
        if (sale == null || sale.getQuantity() <= 0) {
            throw new IllegalArgumentException("Sale quantity must be greater than zero.");
        }
        if (sale.getRate() != null && sale.getRate().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Sale rate cannot be negative.");
        }

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

        saveAuditLog("Created sale entry for party: " + (savedSale.getParty() != null ? savedSale.getParty().getPartyName() : "N/A"), "Sales", null, toJson(savedSale));
        if (broadcastService != null) {
            broadcastService.broadcastUpdate("SALES", "CREATED", "New Sale: " + sale.getQuantity() + " " + sale.getCrateType() + " (₹" + sale.getTotalAmount() + ")");
        }
        return savedSale;
    }

    @PutMapping("/sales/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Sales> updateSale(@PathVariable String id, @RequestBody Sales details) {
        if (details == null || details.getQuantity() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (details.getRate() != null && details.getRate().compareTo(java.math.BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().build();
        }

        return salesRepository.findById(id).map(sale -> {
            String oldState = toJson(sale);

            // Revert old inventory sold stock
            inventoryRepository.findByCrateTypeAndMaterialType(sale.getCrateType(), sale.getCrateMaterial()).ifPresent(inv -> {
                inv.setSoldStock(Math.max(0, inv.getSoldStock() - sale.getQuantity()));
                inventoryRepository.save(inv);
            });

            // Apply updates
            sale.setDate(details.getDate());
            sale.setCrateType(details.getCrateType());
            sale.setCrateMaterial(details.getCrateMaterial());
            sale.setQuantity(details.getQuantity());
            sale.setRate(details.getRate());
            sale.setPaid(details.getPaid());
            if (details.getParty() != null) sale.setParty(details.getParty());
            sale.calculateTotals();

            Sales savedSale = salesRepository.save(sale);

            // Apply new inventory sold stock
            Optional<Inventory> newInvOpt = inventoryRepository.findByCrateTypeAndMaterialType(savedSale.getCrateType(), savedSale.getCrateMaterial());
            Inventory newInv = newInvOpt.orElseGet(() -> {
                Inventory i = new Inventory();
                i.setCrateType(savedSale.getCrateType());
                i.setMaterialType(savedSale.getCrateMaterial());
                i.setOpeningStock(0);
                i.setProducedStock(0);
                i.setSoldStock(0);
                return i;
            });
            newInv.setSoldStock(newInv.getSoldStock() + savedSale.getQuantity());
            inventoryRepository.save(newInv);

            saveAuditLog("Updated sale ID: " + id, "Sales", oldState, toJson(savedSale));
            return ResponseEntity.ok(savedSale);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/sales/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Transactional(rollbackFor = Exception.class)
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')")
    @Transactional(rollbackFor = Exception.class)
    public PaymentCollection createPayment(@RequestBody PaymentCollection payment) {
        if (payment == null || payment.getAmountReceived() == null || payment.getAmountReceived().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        // If payment is for a specific invoice, update the corresponding Sales Paid status
        if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
            Optional<Invoice> invOpt = invoiceRepository.findByInvoiceNo(payment.getInvoiceNo().trim());
            if (invOpt.isPresent()) {
                Sales sale = invOpt.get().getSale();
                java.math.BigDecimal currentPaid = sale.getPaid() != null ? sale.getPaid() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal total = sale.getTotalAmount() != null ? sale.getTotalAmount() : java.math.BigDecimal.ZERO;
                java.math.BigDecimal newPaid = currentPaid.add(payment.getAmountReceived());
                if (newPaid.compareTo(total) > 0) {
                    throw new IllegalArgumentException("Payment amount exceeds remaining invoice balance.");
                }
                sale.setPaid(newPaid);
                sale.setRemaining(total.subtract(newPaid).max(java.math.BigDecimal.ZERO));
                salesRepository.save(sale);
            }
        }

        PaymentCollection saved = paymentCollectionRepository.save(payment);
        String partyInfo = (saved.getParty() != null && saved.getParty().getId() != null) ? "party ID: " + saved.getParty().getId() : "N/A";
        saveAuditLog("Created payment record for " + partyInfo, "Payment_Collection", null, toJson(saved));
        return saved;
    }

    @PutMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<PaymentCollection> updatePayment(@PathVariable String id, @RequestBody PaymentCollection details) {
        return paymentCollectionRepository.findById(id).map(payment -> {
            String oldState = toJson(payment);
            // Safe update: only metadata fields, not amountReceived (affects ledger)
            payment.setPaymentMode(details.getPaymentMode());
            payment.setPaymentDate(details.getPaymentDate());
            PaymentCollection saved = paymentCollectionRepository.save(payment);
            saveAuditLog("Updated payment record ID: " + id, "Payment_Collection", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Transactional(rollbackFor = Exception.class)
    public void deletePayment(@PathVariable String id) {
        paymentCollectionRepository.findById(id).ifPresent(payment -> {
            String oldState = toJson(payment);
            // Revert payment from Sales Paid status
            if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
                invoiceRepository.findByInvoiceNo(payment.getInvoiceNo().trim()).ifPresent(inv -> {
                    Sales sale = inv.getSale();
                    java.math.BigDecimal currentPaid = sale.getPaid() != null ? sale.getPaid() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal amountReceived = payment.getAmountReceived() != null ? payment.getAmountReceived() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal newPaid = currentPaid.subtract(amountReceived).max(java.math.BigDecimal.ZERO);
                    sale.setPaid(newPaid);
                    java.math.BigDecimal total = sale.getTotalAmount() != null ? sale.getTotalAmount() : java.math.BigDecimal.ZERO;
                    sale.setRemaining(total.subtract(newPaid).max(java.math.BigDecimal.ZERO));
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

    @Autowired
    private com.futaneagro.service.TallyExportService tallyExportService;

    // --- Invoice Endpoints ---
    @GetMapping("/invoices")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // --- Tally Prime XML Export (Z-01) ---
    @GetMapping(value = "/reports/tally-xml", produces = "application/xml")
    public ResponseEntity<String> exportTallySalesXml(
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        List<Sales> sales = salesRepository.findAll();
        if (fromDate != null && !fromDate.isEmpty()) {
            LocalDate from = LocalDate.parse(fromDate);
            sales.removeIf(s -> s.getDate() != null && s.getDate().isBefore(from));
        }
        if (toDate != null && !toDate.isEmpty()) {
            LocalDate to = LocalDate.parse(toDate);
            sales.removeIf(s -> s.getDate() != null && s.getDate().isAfter(to));
        }
        String xml = tallyExportService.generateTallySalesXml(sales);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=Tally_Sales.xml")
                .body(xml);
    }
}



