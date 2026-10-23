package com.futaneagro.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * <h1>GlobalExceptionHandler (OWASP Information Leakage Defense & Error Sanitization)</h1>
 * <p>
 * Centralized exception handling interceptor for all Spring MVC {@code @RestController} endpoints.
 * Enforces strict information-leakage prevention by intercepting uncaught exceptions, redacting database internals,
 * and generating unique correlation {@code traceId} UUIDs for support debugging.
 * </p>
 *
 * <h3>Security & Defense Strategies:</h3>
 * <ul>
 *   <li><b>Trace ID Correlation:</b> Uncaught runtime exceptions log the full stack trace server-side with a unique UUID,
 *       returning only generic client errors referencing the {@code traceId} to prevent stack-trace exposure.</li>
 *   <li><b>Database Constraint Redaction:</b> Catches {@link javax.validation.ConstraintViolationException} and suppresses
 *       raw SQL table/column names, returning sanitized user-friendly guidance.</li>
 *   <li><b>Explicit Client Exceptions:</b> Translates {@link org.springframework.web.server.ResponseStatusException}
 *       and {@link org.springframework.web.bind.MethodArgumentNotValidException} into structured JSON response bodies.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Build a safe, non-leaking error payload.
     * 'traceId' allows support to correlate server logs without exposing internals.
     */
    private Map<String, Object> buildError(HttpStatus status, String error, String message, String traceId) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        if (traceId != null) {
            body.put("traceId", traceId);
        }
        return body;
    }

    /**
     * SECURITY: ResponseStatusException carries intentional HTTP-level messages
     * (e.g. "User not found"). These are safe to surface — they originate from
     * application logic, not internal stack frames or DB error text.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String safeMessage = ex.getReason() != null ? ex.getReason() : ex.getStatus().getReasonPhrase();
        return ResponseEntity.status(ex.getStatus())
            .body(buildError(ex.getStatus(), ex.getStatus().getReasonPhrase(), safeMessage, null));
    }

    /**
     * Bean validation failures — field names + constraint messages are safe to expose.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildError(HttpStatus.BAD_REQUEST, "Validation Failed", errors, null));
    }

    /**
     * JPA constraint violations — message may contain DB field info; redact and log internally.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("CONSTRAINT_VIOLATION traceId={} message={}", traceId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(buildError(HttpStatus.BAD_REQUEST, "Constraint Violation",
                "The request violates a data integrity constraint. Please check your input.", traceId));
    }

    /**
     * SECURITY: RuntimeException.getMessage() may expose internal paths, SQL errors,
     * encryption keys in exception chains, class names, or library internals.
     * Log the full stack trace internally; return only a traceId to the client.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("RUNTIME_ERROR traceId={}", traceId, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "An unexpected error occurred. Please contact support with reference: " + traceId, traceId));
    }

    /**
     * SECURITY: Catch-all for checked exceptions — same masking policy as RuntimeException.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("UNEXPECTED_ERROR traceId={}", traceId, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected Error",
                "An unexpected error occurred. Please contact support with reference: " + traceId, traceId));
    }
}
