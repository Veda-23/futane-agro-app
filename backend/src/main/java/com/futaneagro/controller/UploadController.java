package com.futaneagro.controller;

import com.futaneagro.security.FileSecurityService;
import com.futaneagro.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * <h3>File Upload & Media Serving Security Controller</h3>
 * <p>
 * Secure gateway for uploading, validating, and streaming binary assets (KYC identity documents,
 * employee photos, driver licenses, dispatch truck imagery, and corporate branding assets).
 * </p>
 *
 * <h4>OWASP Hardening & Security Safeguards:</h4>
 * <ul>
 *   <li><b>Rate Limiting:</b> Guards upload endpoints against DoS disk exhaustion attacks via {@link com.futaneagro.security.RateLimitingService}.</li>
 *   <li><b>Deep Magic-Byte Verification:</b> Rejects masqueraded file extensions by inspecting internal binary signatures via {@link FileSecurityService}.</li>
 *   <li><b>Strict Path Traversal Defenses:</b> Enforces canonical path resolution checks ({@code targetPath.startsWith(baseDir)}) to prevent directory escape.</li>
 *   <li><b>UUID Filename Salting:</b> Prefixes uploaded filenames with random UUIDs to eliminate overwrite collisions and prediction attacks.</li>
 *   <li><b>Browser Execution Prevention:</b> Serves confidential attachments with {@code Content-Disposition: attachment} and {@code X-Content-Type-Options: nosniff}.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);
    private static final String UPLOAD_DIR = "uploads";
    private static final String BRANDING_DIR = "uploads/branding";

    private static final Set<String> ALLOWED_BRANDING_EXTENSIONS = Set.of(
        ".png", ".jpg", ".jpeg", ".svg"
    );

    @Autowired
    private FileSecurityService fileSecurityService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.futaneagro.security.RateLimitingService rateLimitingService;

    /**
     * <b>POST /api/uploads/upload</b> - Receives and securely stores an uploaded multipart file.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies client upload frequency against the sliding-window rate limiter (returns 429 on abuse).</li>
     *   <li>Runs binary magic-byte, extension, and deep content checks via {@link FileSecurityService#validate(MultipartFile)}.</li>
     *   <li>Generates collision-free storage filename using {@code UUID.randomUUID() + "_" + sanitizedFilename}.</li>
     *   <li>Validates that canonical target path resides inside base upload directory to block path traversal.</li>
     *   <li>Writes file stream to disk, records an audit event, and returns URI and metadata.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Attaching employee photos, Aadhaar cards, bank passbooks, driver licenses, and truck photos.
     * </p>
     *
     * @param file Uploaded multipart file
     * @param request HTTP request for IP tracking and rate limiting
     * @return 200 OK with uploaded filename and resource URL, or 400/403/429/500 on validation or IO failure
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR')")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        HttpServletRequest request) {
        if (rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.UPLOAD)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Upload rate limit exceeded. Please wait a moment before trying again."));
        }

        // Magic-bytes + extension + size + deep content validation
        FileSecurityService.FileValidationResult validation = fileSecurityService.validate(file);
        if (!validation.valid) {
            log.warn("File upload rejected from IP {}: {}", request.getRemoteAddr(), validation.error);
            auditService.log("FILE_UPLOAD_BLOCKED", "Uploads", "Reason: " + validation.error);
            return ResponseEntity.badRequest().body(Map.of("error", validation.error));
        }

        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            // UUID prefix guarantees uniqueness + prevents filename collision attacks
            String newFilename = UUID.randomUUID().toString() + "_" + validation.sanitizedFilename;
            Path baseDir = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Path targetPath = baseDir.resolve(newFilename).normalize();

            // Strict path traversal check
            if (!targetPath.startsWith(baseDir)) {
                return ResponseEntity.status(403).body(Map.of("error", "Invalid upload path"));
            }

            Files.copy(file.getInputStream(), targetPath);
            log.info("File uploaded: {} by user: {}", newFilename, getCurrentUsername());
            auditService.log("FILE_UPLOADED", "Uploads", "Saved file: " + newFilename);

            Map<String, String> response = new HashMap<>();
            response.put("filename", newFilename);
            response.put("url", "/api/uploads/" + newFilename);
            response.put("size", String.valueOf(file.getSize()));
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("File upload IO error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Error saving file"));
        }
    }

    /**
     * <b>GET /api/uploads/{filename}</b> - Streams confidential user and transactional documents.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Sanitizes the requested filename, stripping path separators.</li>
     *   <li>Enforces canonical path boundary checks against the uploads directory.</li>
     *   <li>Verifies existence and readability of {@link UrlResource}.</li>
     *   <li>Returns binary stream with {@code Content-Disposition: attachment} and {@code X-Content-Type-Options: nosniff}
     *       to prevent malicious script execution in the browser context.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Downloading or previewing Aadhaar cards, salary receipts, and logistics documents.
     * </p>
     *
     * @param filename Targeted filename on disk
     * @return 200 OK with binary stream resource, or 403/404 on invalid path or missing file
     */
    @GetMapping("/{filename:.+}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'OPERATOR', 'VIEWER')")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            // Sanitize requested filename (prevent path traversal)
            String safeFilename = fileSecurityService.sanitizeFilename(filename);
            Path baseDir  = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(safeFilename).toAbsolutePath().normalize();

            // Strict canonical path boundary check
            if (!filePath.startsWith(baseDir)) {
                log.warn("Path traversal attempt blocked: {}", filename);
                return ResponseEntity.status(403).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    // Content-Disposition: attachment forces download and prevents browser from executing HTML/SVG/scripts
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    // Prevent MIME sniffing
                    .header("X-Content-Type-Options", "nosniff")
                    // Private cache control for sensitive documents
                    .cacheControl(CacheControl.noStore().mustRevalidate().cachePrivate())
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * <b>GET /api/uploads/branding/{filename}</b> - Serves public branding assets (company logos).
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Enforces extension verification strictly limited to {@code .png, .jpg, .jpeg, .svg}.</li>
     *   <li>Enforces canonical path boundary checks against {@code uploads/branding}.</li>
     *   <li>Streams public image with 1-day public browser caching header ({@code max-age=86400}).</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Rendering corporate logo on public login screens, invoice templates, and header navigation.
     * </p>
     *
     * @param filename Image asset filename
     * @return 200 OK with cached image stream, or 400/403/404 on error
     */
    @GetMapping("/branding/{filename:.+}")
    public ResponseEntity<Resource> getBrandingLogo(@PathVariable String filename) {
        try {
            String safeFilename = fileSecurityService.sanitizeFilename(filename);
            int dotIdx = safeFilename.lastIndexOf('.');
            if (dotIdx == -1) {
                return ResponseEntity.badRequest().build();
            }
            String ext = safeFilename.substring(dotIdx).toLowerCase();
            if (!ALLOWED_BRANDING_EXTENSIONS.contains(ext)) {
                return ResponseEntity.badRequest().build();
            }

            Path baseDir = Paths.get(BRANDING_DIR).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(safeFilename).toAbsolutePath().normalize();

            if (!filePath.startsWith(baseDir)) {
                log.warn("Branding path traversal attempt blocked: {}", filename);
                return ResponseEntity.status(403).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType;
            if (ext.equals(".png")) mediaType = MediaType.IMAGE_PNG;
            else if (ext.equals(".jpg") || ext.equals(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
            else if (ext.equals(".svg")) mediaType = MediaType.parseMediaType("image/svg+xml");
            else mediaType = MediaType.APPLICATION_OCTET_STREAM;

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Resolves the authenticated username from Spring Security context, or returns "anonymous".
     *
     * @return Current authenticated username or "anonymous"
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "anonymous";
    }
}

