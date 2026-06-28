package com.futaneagro.controller;

import com.futaneagro.service.DashboardService;
import com.futaneagro.service.ExcelImporterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ExcelImporterService excelImporterService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        return ResponseEntity.ok(dashboardService.getCharts());
    }

    @PostMapping("/import")
    public ResponseEntity<String> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a file.");
        }
        try {
            // Save to temp file
            File tempFile = File.createTempFile("upload-", file.getOriginalFilename());
            file.transferTo(tempFile);

            // Run imports
            excelImporterService.importParty(tempFile.getAbsolutePath());
            excelImporterService.importInventory(tempFile.getAbsolutePath());

            // Delete temp file
            tempFile.delete();

            return ResponseEntity.ok("Data imported successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error importing file: " + e.getMessage());
        }
    }
}
