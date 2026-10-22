package com.futaneagro.controller;

import com.futaneagro.service.PaymentLinkService;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * <h3>Razorpay Asynchronous Webhook Ingestion Controller</h3>
 * <p>
 * Processes real-time asynchronous payment events dispatched by Razorpay servers (e.g., {@code payment_link.paid},
 * {@code order.paid}, {@code payment.captured}) to reconcile customer invoices autonomously.
 * </p>
 *
 * <h4>Security Hardening & Resilience Safeguards:</h4>
 * <ul>
 *   <li><b>Constant-Time HMAC-SHA256:</b> Employs {@link MessageDigest#isEqual(byte[], byte[])} to eliminate
 *       timing side-channel attacks against the secret signature.</li>
 *   <li><b>Anti-Replay Timestamp Validation:</b> Rejects events older than 5 minutes ({@code MAX_EVENT_AGE_MS}).</li>
 *   <li><b>Idempotency Deduplication:</b> Tracks SHA-256 hashes of processed event IDs in-memory to prevent duplicate
 *       financial ledger entries if Razorpay retries webhook delivery.</li>
 *   <li><b>Volumetric Rate Limiting:</b> Guards against malicious DDoS or flood attempts via {@link com.futaneagro.security.RateLimitingService}.</li>
 *   <li><b>Payload Size Ceiling:</b> Rejects raw payloads larger than 512KB.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);

    /** Max age of a webhook event we'll accept (5 minutes). */
    private static final long MAX_EVENT_AGE_MS = 5 * 60 * 1000L;

    /** Max webhook body size (512 KB). Razorpay events are always small. */
    private static final int MAX_BODY_BYTES = 512 * 1024;

    /**
     * In-memory idempotency set.
     * Stores SHA-256 hashes of processed event IDs.
     * NOTE: for multi-instance deployments replace with Redis.
     * Max 10,000 entries; older ones are evicted by size check.
     */
    private final Set<String> processedEventHashes =
        Collections.newSetFromMap(new ConcurrentHashMap<>());
    private static final int MAX_IDEMPOTENCY_CACHE = 10_000;

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    @Autowired
    private PaymentLinkService paymentLinkService;

    @Autowired
    private com.futaneagro.security.RateLimitingService rateLimitingService;

    /**
     * <b>POST /api/webhooks/razorpay</b> - Ingests and processes Razorpay payment webhook notifications.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies request frequency against the webhook rate limiter.</li>
     *   <li>Enforces 512KB raw payload body size limit.</li>
     *   <li>Validates cryptographic HMAC-SHA256 signature against {@code webhookSecret}.</li>
     *   <li>Checks event timestamp to defend against replay attacks.</li>
     *   <li>Deduplicates event against in-memory idempotency register.</li>
     *   <li>Processes {@code payment_link.paid} or {@code order.paid}/{@code payment.captured}
     *       to mark the sales invoice as paid and record financial reconciliation.</li>
     *   <li>Always returns 200 OK so Razorpay does not retry valid deliveries.</li>
     * </ol>
     * </p>
     *
     * @param signature Cryptographic HMAC-SHA256 signature header ({@code X-Razorpay-Signature})
     * @param eventId Unique event identifier header ({@code X-Razorpay-Event-Id})
     * @param rawBody Unparsed JSON body string
     * @param request HTTP servlet request for client IP tracking
     * @return 200 OK acknowledgment
     */
    @PostMapping("/razorpay")
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId,
            @RequestBody String rawBody,
            javax.servlet.http.HttpServletRequest request) {

        // Rate limit check: prevent volumetric webhook flooding
        if (request != null && rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.WEBHOOK)) {
            log.warn("[WEBHOOK] Volumetric flood blocked from IP: {}", rateLimitingService.getClientIp(request));
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body("Too many requests");
        }

        // 0. Body size guard — reject oversized payloads early
        if (rawBody != null && rawBody.getBytes(StandardCharsets.UTF_8).length > MAX_BODY_BYTES) {
            log.warn("[WEBHOOK] Body exceeds max size ({} bytes) — rejecting", MAX_BODY_BYTES);
            return ResponseEntity.ok("ignored");
        }

        // 1. HMAC-SHA256 signature verification
        if (!verifySignature(rawBody, signature)) {
            log.warn("[WEBHOOK] Invalid or missing Razorpay signature — ignoring");
            return ResponseEntity.ok("ignored");
        }

        try {
            JSONObject payload = new JSONObject(rawBody != null ? rawBody : "{}");

            // 2. TIMESTAMP VALIDATION — reject stale events (replay attack defense)
            long eventCreatedAt = payload.optLong("created_at", 0L) * 1000L; // Razorpay sends epoch seconds
            if (eventCreatedAt > 0) {
                long ageMs = System.currentTimeMillis() - eventCreatedAt;
                if (ageMs > MAX_EVENT_AGE_MS) {
                    log.warn("[WEBHOOK] Event too old ({} ms). Possible replay attack. Ignoring.", ageMs);
                    return ResponseEntity.ok("ignored");
                }
            }

            // 3. IDEMPOTENCY — deduplicate using event ID from header or payload
            String resolvedEventId = (eventId != null && !eventId.isBlank())
                    ? eventId
                    : payload.optString("id", "");

            if (!resolvedEventId.isBlank()) {
                String eventHash = sha256Hex(resolvedEventId);
                if (processedEventHashes.contains(eventHash)) {
                    log.info("[WEBHOOK] Duplicate event (id={}) — skipping (idempotent).", resolvedEventId);
                    return ResponseEntity.ok("ok");
                }
                // Register this event before processing to prevent concurrent duplicates
                if (processedEventHashes.size() >= MAX_IDEMPOTENCY_CACHE) {
                    processedEventHashes.clear(); // simple eviction — replace with LRU in prod
                }
                processedEventHashes.add(eventHash);
            }

            // 4. PROCESS EVENT
            String event = payload.optString("event");
            log.info("[WEBHOOK] Processing event: {}", event);

            if ("payment_link.paid".equals(event)) {
                JSONObject paymentLinkEntity = payload
                        .getJSONObject("payload")
                        .getJSONObject("payment_link")
                        .getJSONObject("entity");

                String razorpayPaymentLinkId = paymentLinkEntity.getString("id");

                String razorpayPaymentId = payload
                        .getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity")
                        .getString("id");

                paymentLinkService.markSaleAsPaid(razorpayPaymentLinkId, razorpayPaymentId);
                log.info("[WEBHOOK] Payment link marked as paid: linkId={}, paymentId={}",
                        razorpayPaymentLinkId, razorpayPaymentId);
            } else if ("order.paid".equals(event) || "payment.captured".equals(event)) {
                JSONObject paymentEntity = payload
                        .getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");

                String orderId = paymentEntity.optString("order_id", "");
                String paymentId = paymentEntity.getString("id");

                if (!orderId.isBlank()) {
                    paymentLinkService.markSaleAsPaid(orderId, paymentId);
                    log.info("[WEBHOOK] Order payment marked as paid: orderId={}, paymentId={}",
                            orderId, paymentId);
                }
            } else {
                log.debug("[WEBHOOK] Unhandled event type: {}", event);
            }

        } catch (Exception e) {
            // Log error but always return 200 — don't leak internal errors to Razorpay
            log.error("[WEBHOOK] Processing error: {}", e.getMessage());
        }

        return ResponseEntity.ok("ok");
    }

    /**
     * Backwards-compatible overload for tests and callers without explicit event ID header.
     */
    public ResponseEntity<String> handleWebhook(String signature, String eventId, String rawBody) {
        return handleWebhook(signature, eventId, rawBody, null);
    }

    public ResponseEntity<String> handleWebhook(String signature, String rawBody) {
        return handleWebhook(signature, null, rawBody, null);
    }

    // ─── HMAC Verification ────────────────────────────────────────────────────

    /**
     * Constant-time HMAC-SHA256 verification.
     * Uses MessageDigest.isEqual() to prevent timing side-channel attacks.
     */
    private boolean verifySignature(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.trim().isEmpty()) {
            log.error("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured — rejecting all webhooks for safety.");
            return false;
        }
        if (signature == null || signature.isEmpty() || payload == null) return false;

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            // Hex-encode computed hash
            StringBuilder hex = new StringBuilder();
            for (byte b : computed) hex.append(String.format("%02x", b));

            // Constant-time comparison prevents timing attacks
            return MessageDigest.isEqual(
                hex.toString().getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("[WEBHOOK] Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return input; // fallback to raw value
        }
    }
}
