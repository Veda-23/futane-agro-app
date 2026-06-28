package com.futaneagro.service;

import com.futaneagro.entity.Settings;
import com.futaneagro.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepo;

    @Autowired
    private AuditService auditService;

    public Optional<Settings> getSetting(String key) {
        return settingsRepo.findById(key);
    }

    public List<Map<String, String>> getAllSettings() {
        return settingsRepo.findAll().stream().map(s -> {
            Map<String, String> map = new HashMap<>();
            map.put("settingKey", s.getConfigKey());
            map.put("settingValue", s.getConfigValue());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Settings saveSetting(String key, String value) {
        Settings settings = new Settings(key, value);
        Settings saved = settingsRepo.save(settings);
        auditService.saveAuditLog("Updated settings key: " + saved.getConfigKey(), "Settings", null, auditService.toJson(saved));
        return saved;
    }

    public List<Map<String, Object>> getBackups() {
        File folder = new File("backups");
        if (!folder.exists() || !folder.isDirectory()) {
            return Collections.emptyList();
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
        return list;
    }

    public Map<String, String> runBackup() throws Exception {
        String activeProfile = System.getProperty("spring.profiles.active", "uat");
        String dbName = "futane_erp_" + activeProfile;
        String timestamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
        String filename = "backups/" + dbName + "_backup_" + timestamp + ".sql";
        
        File backupFolder = new File("backups");
        if (!backupFolder.exists()) {
            backupFolder.mkdirs();
        }
        
        String command = String.format("mysqldump -u root -pVedant %s > %s", dbName, filename);
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", command);
        Process process = pb.start();
        int exitCode = process.waitFor();
        
        if (exitCode == 0) {
            auditService.saveAuditLog("Triggered manual database backup: " + filename, "Settings", null, null);
            Map<String, String> res = new HashMap<>();
            res.put("status", "success");
            res.put("message", "Backup created successfully: " + filename);
            return res;
        } else {
            throw new Exception("Backup failed with exit code: " + exitCode);
        }
    }

    public Map<String, String> runRestore(String filename) throws Exception {
        String activeProfile = System.getProperty("spring.profiles.active", "uat");
        String dbName = "futane_erp_" + activeProfile;
        
        File backupFile = new File(filename);
        if (!backupFile.exists()) {
            throw new Exception("Backup file not found.");
        }
        
        String command = String.format("mysql -u root -pVedant %s < %s", dbName, filename);
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", command);
        Process process = pb.start();
        int exitCode = process.waitFor();
        
        if (exitCode == 0) {
            auditService.saveAuditLog("Restored database from backup: " + filename, "Settings", null, null);
            Map<String, String> res = new HashMap<>();
            res.put("status", "success");
            res.put("message", "Database restored successfully from: " + filename);
            return res;
        } else {
            throw new Exception("Restore failed with exit code: " + exitCode);
        }
    }
}
