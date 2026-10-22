package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.io.File;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.stream.Collectors;

/**
 * <h3>Enterprise Operations & Facilities REST Controller</h3>
 * <p>
 * Central enterprise operations gateway managing manufacturing machinery assets, preventative
 * maintenance & breakdown logs, delivery truck dispatches, operational expenditure ledgers,
 * banking transactions, and physical database backup/restore operations.
 * </p>
 *
 * <h4>Core Functional Sub-Domains:</h4>
 * <ul>
 *   <li><b>Plant Machine Master:</b> Lifecycle registry for injection moulding machinery (name, code, hourly capacity, warranty, status).</li>
 *   <li><b>Maintenance & Breakdown:</b> Records mechanical breakdowns, downtime hours, root cause issues, and technician assignments.</li>
 *   <li><b>Logistics Dispatches:</b> Vehicle numbers, driver allocations, and transit status.</li>
 *   <li><b>Operational Expenses:</b> Category-based expense tracking (utilities, maintenance, consumables, factory supplies).</li>
 *   <li><b>Bank Ledger Transactions:</b> Financial inflows/outflows, transaction types, reference numbers, and payment modes.</li>
 *   <li><b>System Settings & DB Backup/Restore:</b> Super Admin physical backup dump creation and restore capabilities.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api")
public class EnterpriseController {

    private static final Logger log = LoggerFactory.getLogger(EnterpriseController.class);

    @Autowired
    private MachineMasterRepository machineRepo;

    @Autowired
    private MachineBreakdownRepository breakdownRepo;

    @Autowired
    private DispatchRepository dispatchRepo;

    @Autowired
    private ExpenseRepository expenseRepo;

    @Autowired
    private BankTransactionRepository bankRepo;

    @Autowired
    private SettingsRepository settingsRepo;

    @Autowired
    private com.futaneagro.service.AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    private String getCurrentUser() {
        return auditService.getCurrentUser();
    }

    private void saveAuditLog(String action, String tableName, String oldValue, String newValue) {
        auditService.log(action, tableName, oldValue, newValue);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }

    // --- Machine Master ---

    /**
     * <b>GET /api/machines</b> - Retrieves all registered manufacturing machines.
     * <p>
     * <b>How it works:</b> Cached via {@code "machines"} cache region; retrieves full equipment roster.
     * </p>
     *
     * @return List of {@link MachineMaster} machines
     */
    @GetMapping("/machines")
    @Transactional(readOnly = true)
    @Cacheable(value = "machines")
    public List<MachineMaster> getAllMachines() {
        return machineRepo.findAll();
    }

    /**
     * <b>POST /api/machines</b> - Registers a new manufacturing machine.
     *
     * @param machine Machine payload to save
     * @return Persisted {@link MachineMaster} entity
     */
    @PostMapping("/machines")
    @CacheEvict(value = "machines", allEntries = true)
    public MachineMaster createMachine(@RequestBody MachineMaster machine) {
        MachineMaster saved = machineRepo.save(machine);
        saveAuditLog("Created machine: " + saved.getMachineName(), "Machine_Master", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/machines/{id}</b> - Updates machine specifications, capacity, or warranty.
     *
     * @param id Machine UUID
     * @param details Incoming machine fields
     * @return Updated {@link MachineMaster} entity
     */
    @PutMapping("/machines/{id}")
    @CacheEvict(value = "machines", allEntries = true)
    public MachineMaster updateMachine(@PathVariable String id, @RequestBody MachineMaster details) {
        MachineMaster machine = machineRepo.findById(id).orElseThrow(() -> new RuntimeException("Machine not found"));
        String oldState = toJson(machine);
        
        machine.setMachineName(details.getMachineName());
        machine.setMachineCode(details.getMachineCode());
        machine.setCapacityPerHour(details.getCapacityPerHour());
        machine.setInstalledDate(details.getInstalledDate());
        machine.setManufacturer(details.getManufacturer());
        machine.setPurchaseDate(details.getPurchaseDate());
        machine.setWarrantyDate(details.getWarrantyDate());
        machine.setStatus(details.getStatus());
        
        MachineMaster saved = machineRepo.save(machine);
        saveAuditLog("Updated machine: " + saved.getMachineName(), "Machine_Master", oldState, toJson(saved));
        return saved;
    }

    /**
     * <b>DELETE /api/machines/{id}</b> - Soft-deletes a machine from active manufacturing service.
     *
     * @param id Machine UUID
     */
    @DeleteMapping("/machines/{id}")
    @CacheEvict(value = "machines", allEntries = true)
    public void deleteMachine(@PathVariable String id) {
        machineRepo.findById(id).ifPresent(machine -> {
            String oldState = toJson(machine);
            machine.setIsActive(false);
            machine.setUpdatedBy(getCurrentUser());
            machine.setUpdatedAt(java.time.LocalDateTime.now());
            machineRepo.save(machine);
            saveAuditLog("Soft-deleted machine ID: " + id, "Machine_Master", oldState, null);
        });
    }

    // --- Machine Breakdown ---

    /**
     * <b>GET /api/breakdowns</b> - Retrieves all logged machine breakdown events.
     *
     * @return List of {@link MachineBreakdown} entries
     */
    @GetMapping({"/breakdowns", "/machine-breakdowns"})
    @Transactional(readOnly = true)
    public List<MachineBreakdown> getAllBreakdowns() {
        return breakdownRepo.findAll();
    }

    /**
     * <b>POST /api/breakdowns</b> - Logs an unplanned machine stoppage or maintenance incident.
     *
     * @param breakdown Breakdown details (issue, downtime hours, technician)
     * @return Persisted {@link MachineBreakdown} incident log
     */
    @PostMapping({"/breakdowns", "/machine-breakdowns"})
    public MachineBreakdown createBreakdown(@RequestBody MachineBreakdown breakdown) {
        if (breakdown.getMachine() != null && breakdown.getMachine().getId() != null) {
            machineRepo.findById(breakdown.getMachine().getId()).ifPresent(breakdown::setMachine);
        }
        MachineBreakdown saved = breakdownRepo.save(breakdown);
        saveAuditLog("Logged breakdown for machine ID: " + (saved.getMachine() != null ? saved.getMachine().getId() : "N/A"), "Machine_Breakdown", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/breakdowns/{id}</b> - Updates resolution details, downtime, or root-cause summary.
     *
     * @param id Breakdown incident UUID
     * @param details Updated incident information
     * @return 200 OK with updated incident, or 404 NOT FOUND
     */
    @PutMapping({"/breakdowns/{id}", "/machine-breakdowns/{id}"})
    public ResponseEntity<MachineBreakdown> updateBreakdown(@PathVariable String id, @RequestBody MachineBreakdown details) {
        return breakdownRepo.findById(id).map(bd -> {
            String oldState = toJson(bd);
            bd.setDate(details.getDate());
            bd.setIssue(details.getIssue());
            bd.setDowntime(details.getDowntime());
            bd.setResolvedBy(details.getResolvedBy());
            if (details.getMachine() != null) bd.setMachine(details.getMachine());
            MachineBreakdown saved = breakdownRepo.save(bd);
            saveAuditLog("Updated breakdown ID: " + id, "Machine_Breakdown", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * <b>DELETE /api/breakdowns/{id}</b> - Soft-deletes a machine breakdown record.
     *
     * @param id Breakdown incident UUID
     */
    @DeleteMapping({"/breakdowns/{id}", "/machine-breakdowns/{id}"})
    public void deleteBreakdown(@PathVariable String id) {
        breakdownRepo.findById(id).ifPresent(b -> {
            String oldState = toJson(b);
            b.setIsActive(false);
            b.setUpdatedBy(getCurrentUser());
            b.setUpdatedAt(java.time.LocalDateTime.now());
            breakdownRepo.save(b);
            saveAuditLog("Soft-deleted breakdown ID: " + id, "Machine_Breakdown", oldState, null);
        });
    }

    // --- Dispatch ---

    /**
     * <b>GET /api/dispatches</b> - Retrieves all delivery dispatches.
     *
     * @return List of {@link Dispatch} logs
     */
    @GetMapping("/dispatches")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Dispatch> getAllDispatches() {
        return dispatchRepo.findAll();
    }

    /**
     * <b>POST /api/dispatches</b> - Records a finished goods truck dispatch.
     *
     * @param dispatch Dispatch metadata (vehicle number, driver name, dispatch number)
     * @return Persisted {@link Dispatch} entry
     */
    @PostMapping("/dispatches")
    public Dispatch createDispatch(@RequestBody Dispatch dispatch) {
        if (dispatch.getDispatchNumber() == null || dispatch.getDispatchNumber().trim().isEmpty()) {
            dispatch.setDispatchNumber("DSP-" + (System.currentTimeMillis() % 1000000));
        }
        if (dispatch.getDate() == null) {
            dispatch.setDate(java.time.LocalDate.now());
        }
        Dispatch saved = dispatchRepo.save(dispatch);
        saveAuditLog("Created dispatch log: " + saved.getDispatchNumber(), "Dispatch", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/dispatches/{id}</b> - Updates vehicle, driver, or transit status for a dispatch.
     *
     * @param id Dispatch UUID
     * @param details Updated dispatch details
     * @return The updated {@link Dispatch} record
     */
    @PutMapping("/dispatches/{id}")
    public Dispatch updateDispatch(@PathVariable String id, @RequestBody Dispatch details) {
        Dispatch dispatch = dispatchRepo.findById(id).orElseThrow(() -> new RuntimeException("Dispatch not found"));
        String oldState = toJson(dispatch);
        
        dispatch.setVehicleNumber(details.getVehicleNumber());
        dispatch.setDriverName(details.getDriverName());
        dispatch.setDate(details.getDate());
        dispatch.setStatus(details.getStatus());
        
        Dispatch saved = dispatchRepo.save(dispatch);
        saveAuditLog("Updated dispatch: " + saved.getDispatchNumber(), "Dispatch", oldState, toJson(saved));
        return saved;
    }

    /**
     * <b>DELETE /api/dispatches/{id}</b> - Soft-deletes a dispatch log.
     *
     * @param id Dispatch UUID
     */
    @DeleteMapping("/dispatches/{id}")
    public void deleteDispatch(@PathVariable String id) {
        dispatchRepo.findById(id).ifPresent(d -> {
            String oldState = toJson(d);
            d.setIsActive(false);
            d.setUpdatedBy(getCurrentUser());
            d.setUpdatedAt(java.time.LocalDateTime.now());
            dispatchRepo.save(d);
            saveAuditLog("Soft-deleted dispatch ID: " + id, "Dispatch", oldState, null);
        });
    }

    // --- Expense ---

    /**
     * <b>GET /api/expenses</b> - Retrieves all operational expenses.
     *
     * @return List of {@link Expense} records
     */
    @GetMapping("/expenses")
    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepo.findAll();
    }

    /**
     * <b>POST /api/expenses</b> - Logs an operational expense expenditure.
     *
     * @param expense Expense entry (category, description, amount)
     * @return Persisted {@link Expense} record
     */
    @PostMapping("/expenses")
    public Expense createExpense(@RequestBody Expense expense) {
        Expense saved = expenseRepo.save(expense);
        saveAuditLog("Created expense entry: " + saved.getCategory(), "Expense", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/expenses/{id}</b> - Updates date, category, description, or amount of an expense.
     *
     * @param id Expense UUID
     * @param details Updated expense fields
     * @return 200 OK with updated entity, or 404 NOT FOUND
     */
    @PutMapping("/expenses/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable String id, @RequestBody Expense details) {
        return expenseRepo.findById(id).map(expense -> {
            String oldState = toJson(expense);
            expense.setDate(details.getDate());
            expense.setCategory(details.getCategory());
            expense.setDescription(details.getDescription());
            expense.setAmount(details.getAmount());
            Expense saved = expenseRepo.save(expense);
            saveAuditLog("Updated expense: " + saved.getCategory(), "Expense", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * <b>DELETE /api/expenses/{id}</b> - Soft-deletes an operational expense entry.
     *
     * @param id Expense UUID
     */
    @DeleteMapping("/expenses/{id}")
    public void deleteExpense(@PathVariable String id) {
        expenseRepo.findById(id).ifPresent(e -> {
            String oldState = toJson(e);
            e.setIsActive(false);
            e.setUpdatedBy(getCurrentUser());
            e.setUpdatedAt(java.time.LocalDateTime.now());
            expenseRepo.save(e);
            saveAuditLog("Soft-deleted expense ID: " + id, "Expense", oldState, null);
        });
    }

    // --- Bank Transactions ---

    /**
     * <b>GET /api/bank-transactions</b> - Retrieves all bank transaction ledger entries.
     *
     * @return List of {@link BankTransaction} entries
     */
    @GetMapping("/bank-transactions")
    @Transactional(readOnly = true)
    public List<BankTransaction> getAllTransactions() {
        return bankRepo.findAll();
    }

    /**
     * <b>POST /api/bank-transactions</b> - Records a new bank debit or credit transaction.
     *
     * @param transaction Transaction payload (type, amount, mode, description)
     * @return Persisted {@link BankTransaction}
     */
    @PostMapping("/bank-transactions")
    public BankTransaction createTransaction(@RequestBody BankTransaction transaction) {
        BankTransaction saved = bankRepo.save(transaction);
        saveAuditLog("Created bank transaction: " + saved.getMode(), "Bank_Transaction", null, toJson(saved));
        return saved;
    }

    /**
     * <b>PUT /api/bank-transactions/{id}</b> - Updates a bank transaction record.
     *
     * @param id Transaction UUID
     * @param details Updated transaction fields
     * @return 200 OK with updated record, or 404 NOT FOUND
     */
    @PutMapping("/bank-transactions/{id}")
    public ResponseEntity<BankTransaction> updateBankTransaction(@PathVariable String id, @RequestBody BankTransaction details) {
        return bankRepo.findById(id).map(txn -> {
            String oldState = toJson(txn);
            txn.setDate(details.getDate());
            txn.setType(details.getType());
            txn.setAmount(details.getAmount());
            txn.setDescription(details.getDescription());
            txn.setMode(details.getMode());
            BankTransaction saved = bankRepo.save(txn);
            saveAuditLog("Updated bank transaction ID: " + id, "Bank_Transaction", oldState, toJson(saved));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * <b>DELETE /api/bank-transactions/{id}</b> - Soft-deletes a bank transaction.
     *
     * @param id Transaction UUID
     */
    @DeleteMapping("/bank-transactions/{id}")
    public void deleteTransaction(@PathVariable String id) {
        bankRepo.findById(id).ifPresent(t -> {
            String oldState = toJson(t);
            t.setIsActive(false);
            t.setUpdatedBy(getCurrentUser());
            t.setUpdatedAt(java.time.LocalDateTime.now());
            bankRepo.save(t);
            saveAuditLog("Soft-deleted bank transaction ID: " + id, "Bank_Transaction", oldState, null);
        });
    }

    // --- Settings (For Power BI URL) ---

    /**
     * <b>GET /api/settings/{key}</b> - Reads a dynamic configuration setting value.
     *
     * @param key Config key name
     * @return 200 OK with {@link Settings} or empty value
     */
    @GetMapping("/settings/{key}")
    public ResponseEntity<Settings> getSetting(@PathVariable String key) {
        Optional<Settings> setting = settingsRepo.findById(key);
        return setting.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.ok(new Settings(key, "")));
    }

    /**
     * <b>GET /api/settings</b> - Reads all configuration key-value pairs.
     *
     * @return List of configuration setting key-value pairs
     */
    @GetMapping("/settings")
    public List<Map<String, String>> getAllSettings() {
        return settingsRepo.findAll().stream().map(s -> {
            Map<String, String> map = new HashMap<>();
            map.put("settingKey", s.getConfigKey());
            map.put("settingValue", s.getConfigValue());
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * <b>POST /api/settings</b> - Persists or updates a configuration parameter.
     *
     * @param payload Map containing {@code settingKey} and {@code settingValue}
     * @return Persisted {@link Settings}
     */
    @PostMapping("/settings")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public Settings saveSetting(@RequestBody Map<String, String> payload) {
        String key = payload.get("settingKey");
        String value = payload.get("settingValue");
        if (key == null) {
            key = payload.get("configKey");
            value = payload.get("configValue");
        }
        Settings settings = new Settings(key, value);
        Settings saved = settingsRepo.save(settings);
        saveAuditLog("Updated settings key: " + saved.getConfigKey(), "Settings", null, toJson(saved));
        return saved;
    }

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.username:root}")
    private String dbUsername;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.password:}")
    private String dbPassword;

    /**
     * <b>GET /api/settings/backups</b> - Lists existing physical SQL database backup dumps.
     *
     * @return 200 OK with file metadata list (filename, size, modification date)
     */
    @GetMapping("/settings/backups")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getBackups() {
        File folder = new File("backups");
        if (!folder.exists() || !folder.isDirectory()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".sql"));
        List<Map<String, Object>> list = new ArrayList<>();
        if (files != null) {
            for (File f : files) {
                Map<String, Object> item = new HashMap<>();
                item.put("filename", f.getPath().replace("\\", "/"));
                item.put("name", f.getName());
                item.put("size", f.length());
                item.put("lastModified", new java.util.Date(f.lastModified()).toString());
                list.add(item);
            }
        }
        return ResponseEntity.ok(list);
    }

    /**
     * <b>POST /api/settings/backup</b> - Executes physical database backup using isolated ProcessBuilder.
     *
     * @return 200 OK with backup status and filename, or 500 on process execution failure
     */
    @PostMapping("/settings/backup")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> runBackup() {
        try {
            String activeProfile = System.getProperty("spring.profiles.active", "uat");
            String dbName = "futane_erp_" + activeProfile;
            String timestamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
            String safeBasename = dbName + "_backup_" + timestamp + ".sql";
            
            File backupFolder = new File("backups");
            if (!backupFolder.exists()) {
                backupFolder.mkdirs();
            }
            File backupFile = new File(backupFolder, safeBasename);

            // Execute without shell interpolation: pass discrete arguments and redirect output safely
            ProcessBuilder pb = new ProcessBuilder("mysqldump", "-u", dbUsername, "-p" + dbPassword, dbName);
            pb.redirectOutput(backupFile);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                saveAuditLog("Triggered manual database backup: " + safeBasename, "Settings", null, null);
                Map<String, String> res = new HashMap<>();
                res.put("status", "success");
                res.put("message", "Backup created successfully: " + safeBasename);
                return ResponseEntity.ok(res);
            } else {
                return ResponseEntity.status(500).body("Backup failed with exit code: " + exitCode);
            }
        } catch (Exception e) {
            log.error("Database backup failed: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
            return ResponseEntity.status(500).body("Backup failed due to an internal error.");
        }
    }

    /**
     * <b>POST /api/settings/restore</b> - Restores database state from a validated local SQL backup dump.
     * <p>
     * <b>Security Note:</b> Strictly validates filename regex and verifies canonical path boundaries
     * to eliminate directory traversal risks.
     * </p>
     *
     * @param payload Map containing the target {@code "filename"}
     * @return 200 OK on successful restoration, or 400/403/404/500 on error
     */
    @PostMapping("/settings/restore")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> runRestore(@RequestBody Map<String, String> payload) {
        String filename = payload.get("filename");
        if (filename == null || filename.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Filename is required.");
        }
        try {
            // Path traversal defense: extract basename only and validate pattern
            String safeBasename = new File(filename).getName();
            if (!safeBasename.matches("^[a-zA-Z0-9_\\-\\.]+\\.sql$")) {
                return ResponseEntity.badRequest().body("Invalid backup file name.");
            }
            
            File backupFolder = new File("backups").getCanonicalFile();
            File backupFile = new File(backupFolder, safeBasename).getCanonicalFile();
            if (!backupFile.toPath().startsWith(backupFolder.toPath())) {
                return ResponseEntity.status(403).body("Directory traversal attempt blocked.");
            }
            if (!backupFile.exists() || !backupFile.isFile()) {
                return ResponseEntity.notFound().build();
            }

            String activeProfile = System.getProperty("spring.profiles.active", "uat");
            String dbName = "futane_erp_" + activeProfile;
            
            // Execute without shell interpolation: pass discrete arguments and redirect input safely
            ProcessBuilder pb = new ProcessBuilder("mysql", "-u", dbUsername, "-p" + dbPassword, dbName);
            pb.redirectInput(backupFile);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode == 0) {
                saveAuditLog("Restored database from backup: " + safeBasename, "Settings", null, null);
                Map<String, String> res = new HashMap<>();
                res.put("status", "success");
                res.put("message", "Database restored successfully from: " + safeBasename);
                return ResponseEntity.ok(res);
            } else {
                return ResponseEntity.status(500).body("Restore failed with exit code: " + exitCode);
            }
        } catch (Exception e) {
            log.error("Database restore failed: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
            return ResponseEntity.status(500).body("Restore failed due to an internal error.");
        }
    }
}



