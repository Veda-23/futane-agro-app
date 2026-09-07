package com.futaneagro.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Multi-layer file upload security validation.
 *
 * Validates files using MAGIC BYTES (file signatures) rather than
 * trusting the Content-Type header or file extension — both of which
 * can be trivially spoofed to upload malicious files.
 *
 * Enforces strict 1-to-1 extension-to-MIME verification to prevent
 * file disguise / polyglot attacks.
 *
 * Inspects text-based files (CSV, TXT) to reject binary executables,
 * control bytes, and null-byte poisoning.
 *
 * Performs Zip-Slip and decompression-bomb inspection on XLSX archives.
 *
 * Also sanitizes filenames to prevent path traversal attacks.
 */
@Service
public class FileSecurityService {

    private static final Logger log = LoggerFactory.getLogger(FileSecurityService.class);

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB

    // Magic byte signatures for allowed file types
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
        "image/jpeg",           new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
        "image/png",            new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
        "application/pdf",      new byte[]{0x25, 0x50, 0x44, 0x46},                               // %PDF
        "application/zip",      new byte[]{0x50, 0x4B, 0x03, 0x04},                               // PK\x03\x04 (XLSX)
        "application/msoffice", new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0}          // OLE2 (Old XLS)
    );

    // Strict 1-to-1 mapping from extension to expected MIME type
    private static final Map<String, String> EXTENSION_TO_MIME = Map.of(
        ".jpg",  "image/jpeg",
        ".jpeg", "image/jpeg",
        ".png",  "image/png",
        ".pdf",  "application/pdf",
        ".xlsx", "application/zip",
        ".xls",  "application/msoffice",
        ".csv",  "text/plain",
        ".txt",  "text/plain"
    );

    /**
     * Validate a file upload.
     * @return FileValidationResult with success/error and sanitized filename.
     */
    public FileValidationResult validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return FileValidationResult.error("No file provided or file is empty");
        }

        // 1. Size check
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return FileValidationResult.error("File exceeds maximum allowed size of 10 MB");
        }

        // 2. Extension extraction & whitelist check
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            return FileValidationResult.error("Missing or invalid file name");
        }

        // Reject filenames with null bytes or blatant traversal before sanitization
        if (original.contains("\0") || original.contains("\\") || original.contains("/")) {
            original = Paths.get(original).getFileName().toString().replace("\0", "");
        }

        String ext = extractExtension(original);
        if (ext == null || !EXTENSION_TO_MIME.containsKey(ext)) {
            return FileValidationResult.error(
                "File type not permitted. Allowed: JPG, PNG, PDF, XLSX, XLS, CSV, TXT");
        }

        String expectedMime = EXTENSION_TO_MIME.get(ext);

        // 3. Magic bytes / Content deep inspection
        try {
            String detected = detectMimeType(file, ext);
            if (!expectedMime.equals(detected)) {
                log.warn("File upload blocked — filename '{}', ext '{}' expected MIME '{}' but detected '{}'",
                        original, ext, expectedMime, detected);
                return FileValidationResult.error(
                    "File content does not match its extension. Possible file disguise attack.");
            }
        } catch (IOException e) {
            return FileValidationResult.error("Cannot read file for validation: " + e.getMessage());
        }

        // 4. Archive deep inspection for XLSX (.zip based)
        if ("application/zip".equals(expectedMime)) {
            FileValidationResult zipCheck = inspectZipArchive(file);
            if (!zipCheck.valid) {
                return zipCheck;
            }
        }

        // 5. Sanitize filename (path traversal prevention)
        String safeName = sanitizeFilename(original);

        return FileValidationResult.success(safeName);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private String extractExtension(String filename) {
        if (filename == null) return null;
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1 || lastDot == filename.length() - 1) return null;
        return filename.substring(lastDot).toLowerCase();
    }

    private String detectMimeType(MultipartFile file, String ext) throws IOException {
        byte[] header = new byte[8];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 4) return "application/octet-stream";
        }

        // Check binary magic bytes
        for (Map.Entry<String, byte[]> entry : MAGIC_BYTES.entrySet()) {
            if (startsWith(header, entry.getValue())) {
                return entry.getKey();
            }
        }

        // Text files: CSV and TXT validation
        if (".csv".equals(ext) || ".txt".equals(ext)) {
            if (isSafeTextContent(file)) {
                return "text/plain";
            } else {
                return "application/octet-stream";
            }
        }

        return "application/octet-stream";
    }

    /**
     * Inspects text file bytes to verify it does not contain binary executables,
     * null bytes, or dangerous non-printable control sequences.
     */
    private boolean isSafeTextContent(MultipartFile file) {
        byte[] buffer = new byte[4096];
        int bytesRead;
        try (InputStream is = new BufferedInputStream(file.getInputStream())) {
            bytesRead = is.read(buffer);
            if (bytesRead <= 0) return true; // Empty text file is harmless
        } catch (IOException e) {
            return false;
        }

        // Check for common executable signatures
        if (bytesRead >= 2) {
            // DOS/PE MZ header (0x4D 0x5A)
            if (buffer[0] == 0x4D && buffer[1] == 0x5A) return false;
            // Script shebang '#!' (0x23 0x21)
            if (buffer[0] == 0x23 && buffer[1] == 0x21) return false;
        }
        if (bytesRead >= 4) {
            // ELF binary (\x7FELF)
            if (buffer[0] == 0x7F && buffer[1] == 0x45 && buffer[2] == 0x4C && buffer[3] == 0x46) return false;
            // Java class / Mach-O Fat (0xCA 0xFE 0xBA 0xBE)
            if ((buffer[0] & 0xFF) == 0xCA && (buffer[1] & 0xFF) == 0xFE &&
                (buffer[2] & 0xFF) == 0xBA && (buffer[3] & 0xFF) == 0xBE) return false;
        }

        // Check byte stream for null bytes and illegal control characters
        for (int i = 0; i < bytesRead; i++) {
            byte b = buffer[i];
            // Null byte is strictly forbidden in text files
            if (b == 0x00) return false;
            int unsigned = b & 0xFF;
            // Allow printable ASCII, UTF-8 multibyte (> 127), and standard whitespace (\t = 9, \n = 10, \r = 13)
            if (unsigned < 32 && unsigned != 9 && unsigned != 10 && unsigned != 13) {
                return false; // Disallow dangerous control characters (BEL, BS, ESC, etc.)
            }
            if (unsigned == 127) {
                return false; // DEL char
            }
        }

        return true;
    }

    /**
     * Inspects XLSX / ZIP archives for Zip-Slip traversal and decompression bombs.
     */
    private FileValidationResult inspectZipArchive(MultipartFile file) {
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            int entryCount = 0;
            long totalUncompressedSize = 0;

            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > 2000) {
                    return FileValidationResult.error("Spreadsheet archive contains too many entries (potential decompression bomb).");
                }

                String name = entry.getName();
                // Prevent Zip Slip vulnerability
                if (name.contains("..") || name.startsWith("/") || name.startsWith("\\")) {
                    return FileValidationResult.error("Spreadsheet archive contains illegal path traversal sequences.");
                }

                long size = entry.getSize();
                if (size > 0) {
                    totalUncompressedSize += size;
                    if (totalUncompressedSize > 50L * 1024 * 1024) { // 50 MB total uncompressed limit
                        return FileValidationResult.error("Spreadsheet uncompressed content exceeds safe limit (50MB).");
                    }
                }
                zis.closeEntry();
            }
            return FileValidationResult.success(null);
        } catch (Exception e) {
            return FileValidationResult.error("Spreadsheet archive is corrupted or invalid: " + e.getMessage());
        }
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }

    /**
     * Sanitize filename: strip path separators, null bytes, and dangerous patterns.
     * Caps length at 100 characters and replaces unsafe chars with underscores.
     */
    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "upload_" + System.currentTimeMillis();

        // Keep only the filename part if full path was provided
        try {
            filename = Paths.get(filename).getFileName().toString();
        } catch (Exception ignored) {
            // fallback to string manipulation
            int lastSep = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
            if (lastSep != -1) {
                filename = filename.substring(lastSep + 1);
            }
        }

        String safe = filename
            .replace("\0", "")
            .replaceAll("[^a-zA-Z0-9._-]", "_")   // Only allow safe chars
            .replaceAll("\\.{2,}", "_")             // Remove path traversal (..)
            .replaceAll("^[._-]+", "_");           // Remove leading . or - (prevent hidden files / flags)

        if (safe.isBlank() || safe.equals("_")) {
            safe = "upload_" + System.currentTimeMillis();
        }

        return safe.substring(0, Math.min(safe.length(), 100));
    }

    // ─── Result ───────────────────────────────────────────────────────────────

    public static class FileValidationResult {
        public final boolean valid;
        public final String error;
        public final String sanitizedFilename;

        private FileValidationResult(boolean valid, String error, String sanitizedFilename) {
            this.valid = valid;
            this.error = error;
            this.sanitizedFilename = sanitizedFilename;
        }

        public static FileValidationResult success(String safeName) {
            return new FileValidationResult(true, null, safeName);
        }

        public static FileValidationResult error(String error) {
            return new FileValidationResult(false, error, null);
        }
    }
}
