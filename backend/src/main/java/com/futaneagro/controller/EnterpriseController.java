package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EnterpriseController {

    @Autowired
    private MachineService machineService;

    @Autowired
    private DispatchService dispatchService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private BankTransactionService bankTransactionService;

    @Autowired
    private SettingsService settingsService;

    // --- Machine Master ---
    @GetMapping("/machines")
    public List<MachineMaster> getAllMachines() {
        return machineService.getAllMachines();
    }

    @PostMapping("/machines")
    public MachineMaster createMachine(@RequestBody MachineMaster machine) {
        return machineService.createMachine(machine);
    }

    @PutMapping("/machines/{id}")
    public MachineMaster updateMachine(@PathVariable Integer id, @RequestBody MachineMaster details) {
        return machineService.updateMachine(id, details);
    }

    @DeleteMapping("/machines/{id}")
    public void deleteMachine(@PathVariable Integer id) {
        machineService.deleteMachine(id);
    }

    // --- Machine Breakdown ---
    @GetMapping("/breakdowns")
    public List<MachineBreakdown> getAllBreakdowns() {
        return machineService.getAllBreakdowns();
    }

    @PostMapping("/breakdowns")
    public MachineBreakdown createBreakdown(@RequestBody MachineBreakdown breakdown) {
        return machineService.createBreakdown(breakdown);
    }

    @DeleteMapping("/breakdowns/{id}")
    public void deleteBreakdown(@PathVariable Integer id) {
        machineService.deleteBreakdown(id);
    }

    // --- Dispatch ---
    @GetMapping("/dispatches")
    public List<Dispatch> getAllDispatches() {
        return dispatchService.getAllDispatches();
    }

    @PostMapping("/dispatches")
    public Dispatch createDispatch(@RequestBody Dispatch dispatch) {
        return dispatchService.createDispatch(dispatch);
    }

    @PutMapping("/dispatches/{id}")
    public Dispatch updateDispatch(@PathVariable Integer id, @RequestBody Dispatch details) {
        return dispatchService.updateDispatch(id, details);
    }

    @DeleteMapping("/dispatches/{id}")
    public void deleteDispatch(@PathVariable Integer id) {
        dispatchService.deleteDispatch(id);
    }

    // --- Expense ---
    @GetMapping("/expenses")
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @PostMapping("/expenses")
    public Expense createExpense(@RequestBody Expense expense) {
        return expenseService.createExpense(expense);
    }

    @DeleteMapping("/expenses/{id}")
    public void deleteExpense(@PathVariable Integer id) {
        expenseService.deleteExpense(id);
    }

    // --- Bank Transactions ---
    @GetMapping("/bank-transactions")
    public List<BankTransaction> getAllTransactions() {
        return bankTransactionService.getAllTransactions();
    }

    @PostMapping("/bank-transactions")
    public BankTransaction createTransaction(@RequestBody BankTransaction transaction) {
        return bankTransactionService.createTransaction(transaction);
    }

    @DeleteMapping("/bank-transactions/{id}")
    public void deleteTransaction(@PathVariable Integer id) {
        bankTransactionService.deleteTransaction(id);
    }

    // --- Settings (For Power BI URL) ---
    @GetMapping("/settings/{key}")
    public ResponseEntity<Settings> getSetting(@PathVariable String key) {
        Optional<Settings> setting = settingsService.getSetting(key);
        return setting.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.ok(new Settings(key, "")));
    }

    @GetMapping("/settings")
    public List<Map<String, String>> getAllSettings() {
        return settingsService.getAllSettings();
    }

    @PostMapping("/settings")
    public Settings saveSetting(@RequestBody Map<String, String> payload) {
        String key = payload.get("settingKey");
        String value = payload.get("settingValue");
        if (key == null) {
            key = payload.get("configKey");
            value = payload.get("configValue");
        }
        return settingsService.saveSetting(key, value);
    }

    @GetMapping("/settings/backups")
    public ResponseEntity<?> getBackups() {
        return ResponseEntity.ok(settingsService.getBackups());
    }

    @PostMapping("/settings/backup")
    public ResponseEntity<?> runBackup() {
        try {
            return ResponseEntity.ok(settingsService.runBackup());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Backup error: " + e.getMessage());
        }
    }

    @PostMapping("/settings/restore")
    public ResponseEntity<?> runRestore(@RequestBody Map<String, String> payload) {
        String filename = payload.get("filename");
        if (filename == null) {
            return ResponseEntity.badRequest().body("Filename is required.");
        }
        try {
            return ResponseEntity.ok(settingsService.runRestore(filename));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Restore error: " + e.getMessage());
        }
    }
}
