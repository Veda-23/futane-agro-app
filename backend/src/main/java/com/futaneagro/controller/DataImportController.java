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

/**
 * REST Controller for Enterprise Bulk Data Import and CSV Template Management.
 *
 * Provides endpoints for:
 * 1. POST /api/data-import/preview: Dry-run CSV validation with duplicate detection.
 * 2. POST /api/data-import/confirm: Transactional execution of batch upserts.
 * 3. GET /api/data-import/template/{module}: Direct browser download of sample CSV templates.
 *
 * Security:
 * - Protected by Spring Security @PreAuthorize role guards.
 * - Rate limited by RateLimitingService to prevent brute-force file flooding.
 */
@RestController
@RequestMapping("/api/data-import")
public class DataImportController {

    private static final Logger log = LoggerFactory.getLogger(DataImportController.class);

    @Autowired
    private DataImportService importService;

    @Autowired
    private com.futaneagro.security.RateLimitingService rateLimitingService;

    /**
     * Dry-run Preview & Validation Endpoint.
     * Parses the uploaded CSV file, validates fields, and identifies duplicates without saving anything.
     *
     * @param file    The uploaded CSV file.
     * @param module  Target ERP module (parties, inventory, production, etc.).
     * @param request HTTP servlet request for rate-limit IP extraction.
     * @return 200 OK with ImportPreviewDTO, or 400 Bad Request on schema/file validation errors, or 429 on rate limit.
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    public ResponseEntity<?> previewImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("module") String module,
            javax.servlet.http.HttpServletRequest request) throws Exception {
        // Enforce rate limiting on file uploads
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
     * Transactional Confirmation & Upsert Execution Endpoint.
     * Executes the actual batch insert/update against PostgreSQL within an ACID transaction.
     *
     * @param request ImportConfirmRequestDTO containing module name, duplicate strategy (SKIP/UPDATE), and rows.
     * @return 200 OK with ImportResultDTO showing inserted, updated, and skipped counts.
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
     * Download Sample Pre-Formatted CSV Template (.csv).
     * Returns a ready-to-use CSV template populated with correct headers and realistic sample rows.
     *
     * @param module Target module (parties, production, inventory, etc.).
     * @return Raw CSV file stream with 'attachment' Content-Disposition header.
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
