package com.futaneagro.controller;

import com.futaneagro.dto.ImportConfirmRequestDTO;
import com.futaneagro.dto.ImportPreviewDTO;
import com.futaneagro.dto.ImportResultDTO;
import com.futaneagro.service.DataImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/data-import")
public class DataImportController {

    private static final Logger log = LoggerFactory.getLogger(DataImportController.class);

    @Autowired
    private DataImportService importService;

    @Autowired
    private com.futaneagro.security.RateLimitingService rateLimitingService;

    /**
     * Dry-run Preview & Validation Endpoint
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    public ResponseEntity<?> previewImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("module") String module,
            javax.servlet.http.HttpServletRequest request) throws Exception {
        if (rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.DATA_IMPORT)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Data import rate limit exceeded. Please wait a moment before trying again."));
        }
        try {
            ImportPreviewDTO preview = importService.previewImport(file, module);
            return ResponseEntity.ok(preview);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Transactional Confirmation & Upsert Execution Endpoint
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    public ResponseEntity<?> confirmImport(@RequestBody ImportConfirmRequestDTO request) throws Exception {
        try {
            ImportResultDTO result = importService.executeImport(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Download Sample Pre-Formatted CSV Template (.csv)
     */
    @GetMapping("/template/{module}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR', 'VIEWER')")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String module) {
        try {
            byte[] bytes = importService.generateSampleCsvTemplate(module);
            String filename = module.toLowerCase().replace("-", "_") + "_template.csv";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                    .body(bytes);
        } catch (IOException ex) {
            return ResponseEntity.status(500).build();
        }
    }
}
