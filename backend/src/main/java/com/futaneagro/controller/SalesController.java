package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * <h1>SalesController</h1>
 * <p>
 * Central Spring REST controller managing the core commercial operations of Futane Agro ERP:
 * <ul>
 *   <li><b>Sales Orders & Dispatch Records:</b> Order logging, crate rate calculation, GST application, and transaction auditing.</li>
 *   <li><b>Inventory Auto-Synchronization:</b> Automatically synchronizes finished goods stock in {@code t_inv_inventory}
 *       upon creation, modification, or soft-deletion of sales transactions.</li>
 *   <li><b>Automated Invoice Issuance:</b> Generates unique sequential tax invoices (e.g. {@code INV-YYYYMMDD-{id}})
 *       linked to sales transactions.</li>
 *   <li><b>Payment Collections & Accounts Receivable:</b> Registers incoming payments against open invoices,
 *       updates the remaining balance on sales records, and manages customer credit status.</li>
 *   <li><b>Tally Prime XML Accounting Bridge:</b> Exports sales vouchers formatted to Tally XML standards (Z-01 specification)
 *       for seamless reconciliation with external statutory accounting software.</li>
 * </ul>
 * </p>
 *
 * <h3>Design & Security Invariants:</h3>
 * <ul>
 *   <li><b>Server-Side Calculation:</b> Total amounts, GST taxes, and remaining balances are calculated server-side
 *       via {@link Sales#calculateTotals()} to prevent client-side parameter tampering.</li>
 *   <li><b>Atomic Transactions:</b> All mutating endpoints use {@code @Transactional(rollbackFor = Exception.class)}
 *       to guarantee atomicity between sales, inventory adjustments, and invoice generation.</li>
 *   <li><b>Audit Compliance:</b> Every create, update, and soft-delete operation writes before-and-after snapshots
 *       to {@code t_sec_audit_log}.</li>
 * </ul>
 *
 * @author Futane Agro Engineering Team
 * @version 2.0 (Enterprise Multi-Tenant)
 */
@RestController
@RequestMapping("/api")
public class SalesController {

    private static final Logger log = LoggerFactory.getLogger(SalesController.class);

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

    /**
     * Resolves the username of the currently authenticated principal from Spring SecurityContext.
     *
     * @return The username string of the active session, or "system" if unauthenticated.
     */
    private String getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (principal != null) ? principal.toString() : "system";
    }

    /**
     * Writes an immutable audit trail entry into the {@code t_sec_audit_log} table.
     *
     * @param action     Human-readable description of the operation (e.g., "Created sale entry for party: XYZ").
     * @param tableName  Target database table/entity affected (e.g., "Sales", "Payment_Collection").
     * @param oldValue   JSON representation of the entity prior to modification (null for insert).
     * @param newValue   JSON representation of the entity after modification (null for deletion).
     */
    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        AuditLog log = new AuditLog();
        log.setUsername(getCurrentUser());
        log.setAction(action);
        log.setTableName(tableName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditRepo.save(log);
    }

    /**
     * Serializes any entity or DTO into a compact JSON string for audit trail snapshots.
     *
     * @param obj Target object to serialize.
     * @return JSON string, or empty string if serialization encounters an error.
     */
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    // --- Sales Endpoints ---

    /**
     * Retrieves all sales records from the database.
     *
     * @return List of all {@link Sales} entities. Read-only transaction prevents entity dirty checking overhead.
     */
    @GetMapping("/sales")
    @Transactional(readOnly = true)
    public List<Sales> getAllSales() {
        return salesRepository.findAll();
    }

    /**
     * Creates a new sales transaction, adjusts finished goods inventory, and auto-generates a tax invoice.
     *
     * <p><b>Execution Workflow:</b></p>
     * <ol>
     *   <li>Validates quantity (&gt; 0) and non-negative unit rate.</li>
     *   <li>Invokes {@link Sales#calculateTotals()} to compute taxable total, GST breakdowns, and net receivable.</li>
     *   <li>Persists the {@link Sales} entity.</li>
     *   <li>Adjusts {@link Inventory} sold stock for matching crate type and material (creating inventory entry if absent).</li>
     *   <li>Generates a linked {@link Invoice} with format {@code INV-YYYYMMDD-{saleId}}.</li>
     *   <li>Records an immutable audit log snapshot and broadcasts a real-time WebSocket notification.</li>
     * </ol>
     *
     * @param sale The sale payload containing crate type, material, quantity, rate, party, and optional upfront payment.
     * @return The persisted {@link Sales} entity with generated primary key and computed financial balances.
     * @throws IllegalArgumentException if quantity is &le; 0 or rate is negative.
     */
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

    /**
     * Updates an existing sales record and atomically adjusts finished goods inventory stock levels.
     *
     * <p><b>Execution Workflow:</b></p>
     * <ol>
     *   <li>Validates that requested quantity is positive and unit rate is non-negative.</li>
     *   <li>Fetches the existing {@link Sales} record, serializing old state for the audit snapshot.</li>
     *   <li>Reverts the previous sold stock count from {@link Inventory} for the old crate type/material.</li>
     *   <li>Applies the updated fields (date, crate type, crate material, quantity, rate, paid amount, party).</li>
     *   <li>Recalculates total values and tax liabilities via {@link Sales#calculateTotals()}.</li>
     *   <li>Increments the new crate type/material's {@link Inventory} sold stock with the updated quantity.</li>
     *   <li>Persists the updated sale and records an audit log entry in {@code t_sec_audit_log}.</li>
     * </ol>
     *
     * @param id      Unique UUID/string primary key of the sale to update.
     * @param details Payload containing updated sales parameters.
     * @return {@link ResponseEntity} with status 200 and updated {@link Sales}, 400 Bad Request if invalid parameters,
     *         or 404 Not Found if the record does not exist.
     */
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

    /**
     * Soft-deletes a sales transaction, reverts finished goods sold stock, and cancels associated invoices.
     *
     * <p><b>Execution Workflow:</b></p>
     * <ol>
     *   <li>Loads the target {@link Sales} record and serializes state for audit logging.</li>
     *   <li>Reverts physical sold stock from {@link Inventory} (reducing {@code soldStock} by sale quantity).</li>
     *   <li>Locates any {@link Invoice} linked to this sale ID and marks them inactive ({@code isActive = false}).</li>
     *   <li>Sets {@code isActive = false}, records {@code updatedBy} and timestamp on the {@link Sales} entity.</li>
     *   <li>Saves the soft-deleted entity and records an audit trail entry.</li>
     * </ol>
     *
     * @param id Unique identifier of the sale to be soft-deleted.
     */
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

    /**
     * Retrieves all payment collection entries across customers and invoices.
     *
     * @return List of all registered {@link PaymentCollection} entities.
     */
    @GetMapping("/payments")
    @Transactional(readOnly = true)
    public List<PaymentCollection> getAllPayments() {
        return paymentCollectionRepository.findAll();
    }

    /**
     * Registers a customer payment collection and updates the ledger balance on the associated sales invoice.
     *
     * <p><b>Execution Workflow:</b></p>
     * <ol>
     *   <li>Validates that {@code amountReceived} is strictly positive.</li>
     *   <li>If an {@code invoiceNo} is supplied:
     *     <ul>
     *       <li>Locates the matching {@link Invoice} and parent {@link Sales} record.</li>
     *       <li>Ensures cumulative payments do not exceed total invoice liability (preventing overpayment errors).</li>
     *       <li>Recalculates {@code sale.paid} and sets {@code sale.remaining = max(0, total - paid)}.</li>
     *       <li>Persists the updated {@link Sales} record.</li>
     *     </ul>
     *   </li>
     *   <li>Saves the {@link PaymentCollection} record to the database.</li>
     *   <li>Records an immutable audit log snapshot in {@code t_sec_audit_log}.</li>
     * </ol>
     *
     * @param payment The payment details including amountReceived, paymentMode, paymentDate, party, and invoiceNo.
     * @return The persisted {@link PaymentCollection} record.
     * @throws IllegalArgumentException if payment amount is &le; 0 or exceeds remaining invoice balance.
     */
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

    /**
     * Updates metadata attributes of an existing payment record.
     *
     * <p><b>Financial Safety Invariant:</b> Only metadata fields (such as {@code paymentMode} and {@code paymentDate})
     * are modifiable through this endpoint. Modifying {@code amountReceived} directly is prohibited to maintain
     * ledger idempotency; financial corrections must be executed via counter-entries or credit notes.</p>
     *
     * @param id      Primary key of the payment collection entry.
     * @param details Updated payment metadata.
     * @return {@link ResponseEntity} containing updated {@link PaymentCollection}, or 404 if not found.
     */
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

    /**
     * Soft-deletes a payment record and reverses the corresponding amount from the linked sales invoice.
     *
     * <p><b>Execution Workflow:</b></p>
     * <ol>
     *   <li>Finds the target payment collection entry and serializes its state.</li>
     *   <li>If linked to an invoice, reduces {@code sale.paid} by {@code payment.amountReceived} and recalculates {@code sale.remaining}.</li>
     *   <li>Sets {@code isActive = false}, tracks audit user and timestamp.</li>
     *   <li>Records an audit log entry in {@code t_sec_audit_log}.</li>
     * </ol>
     *
     * @param id Unique identifier of the payment record to soft-delete.
     */
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

    /**
     * Retrieves all issued tax invoices.
     *
     * @return List of all {@link Invoice} entities.
     */
    @GetMapping("/invoices")
    @Transactional(readOnly = true)
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // --- Tally Prime XML Export (Z-01) ---

    /**
     * Exports sales vouchers formatted to Tally Prime XML specification (Z-01 standard).
     *
     * <p>Enables direct statutory reconciliation into Tally Prime / Tally ERP 9 accounting software.
     * Includes ledger assignments, GST tax breakdowns (CGST/SGST/IGST), party GSTINs, and voucher numbers.</p>
     *
     * @param fromDate Optional ISO start date (inclusive) filter (e.g., "2026-04-01").
     * @param toDate   Optional ISO end date (inclusive) filter (e.g., "2026-04-30").
     * @return {@link ResponseEntity} containing raw Tally XML payload with {@code attachment; filename=Tally_Sales.xml} header.
     */
    @GetMapping(value = "/reports/tally-xml", produces = "application/xml")
    @Transactional(readOnly = true)
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



