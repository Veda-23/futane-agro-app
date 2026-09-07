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

    // --- Machine Master ---
    @GetMapping("/machines")
    @Cacheable(value = "machines")
    public List<MachineMaster> getAllMachines() {
        return machineRepo.findAll();
    }

    @PostMapping("/machines")
    @CacheEvict(value = "machines", allEntries = true)
    public MachineMaster createMachine(@RequestBody MachineMaster machine) {
        MachineMaster saved = machineRepo.save(machine);
        saveAuditLog("Created machine: " + saved.getMachineName(), "Machine_Master", null, toJson(saved));
        return saved;
    }

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
    @GetMapping({"/breakdowns", "/machine-breakdowns"})
    public List<MachineBreakdown> getAllBreakdowns() {
        return breakdownRepo.findAll();
    }

    @PostMapping({"/breakdowns", "/machine-breakdowns"})
    public MachineBreakdown createBreakdown(@RequestBody MachineBreakdown breakdown) {
        MachineBreakdown saved = breakdownRepo.save(breakdown);
        saveAuditLog("Logged breakdown for machine ID: " + (saved.getMachine() != null ? saved.getMachine().getId() : "N/A"), "Machine_Breakdown", null, toJson(saved));
        return saved;
    }

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
    @GetMapping("/dispatches")
    public List<Dispatch> getAllDispatches() {
        return dispatchRepo.findAll();
    }

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
    @GetMapping("/expenses")
    public List<Expense> getAllExpenses() {
        return expenseRepo.findAll();
    }

    @PostMapping("/expenses")
    public Expense createExpense(@RequestBody Expense expense) {
        Expense saved = expenseRepo.save(expense);
        saveAuditLog("Created expense entry: " + saved.getCategory(), "Expense", null, toJson(saved));
        return saved;
    }

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
    @GetMapping("/bank-transactions")
    public List<BankTransaction> getAllTransactions() {
        return bankRepo.findAll();
    }

    @PostMapping("/bank-transactions")
    public BankTransaction createTransaction(@RequestBody BankTransaction transaction) {
        BankTransaction saved = bankRepo.save(transaction);
        saveAuditLog("Created bank transaction: " + saved.getMode(), "Bank_Transaction", null, toJson(saved));
        return saved;
    }

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
    @GetMapping("/settings/{key}")
    public ResponseEntity<Settings> getSetting(@PathVariable String key) {
        Optional<Settings> setting = settingsRepo.findById(key);
        return setting.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.ok(new Settings(key, "")));
    }

    @GetMapping("/settings")
    public List<Map<String, String>> getAllSettings() {
        return settingsRepo.findAll().stream().map(s -> {
            Map<String, String> map = new HashMap<>();
            map.put("settingKey", s.getConfigKey());
            map.put("settingValue", s.getConfigValue());
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping("/settings")
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



