package com.futaneagro.controller;

import com.futaneagro.service.PaymentLinkService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookController {

    @Value("${razorpay.webhook.secret:}")
    private String webhookSecret;

    @Autowired
    private PaymentLinkService paymentLinkService;

    /**
     * POST /api/webhooks/razorpay
     * No JWT — excluded in SecurityConfig. Razorpay cannot send a Bearer token.
     * Always returns 200 to prevent Razorpay from retrying due to auth failures.
     */
    @PostMapping("/razorpay")
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String rawBody) {

        // 1. Verify HMAC-SHA256 signature
        if (!verifySignature(rawBody, signature)) {
            System.err.println("❌ Razorpay webhook: invalid signature — ignoring");
            return ResponseEntity.ok("ignored"); // 200 so Razorpay doesn't retry indefinitely
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String event = payload.optString("event");

            if ("payment_link.paid".equals(event)) {
                JSONObject paymentLinkEntity = payload
                        .getJSONObject("payload")
                        .getJSONObject("payment_link")
                        .getJSONObject("entity");

                String razorpayPaymentLinkId = paymentLinkEntity.getString("id");

                // Extract razorpay_payment_id from payment entity
                String razorpayPaymentId = payload
                        .getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity")
                        .getString("id");

                paymentLinkService.markSaleAsPaid(razorpayPaymentLinkId, razorpayPaymentId);
            }
        } catch (Exception e) {
            // Log but always return 200 — don't leak internal errors
            System.err.println("⚠️  Razorpay webhook processing error: " + e.getMessage());
        }

        return ResponseEntity.ok("ok");
    }

    private boolean verifySignature(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            System.out.println("⚠️  RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification");
            return true; // Allow in dev; set secret in prod
        }
        if (signature == null || signature.isEmpty()) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString().equals(signature);
        } catch (Exception e) {
            System.err.println("Signature verification error: " + e.getMessage());
            return false;
        }
    }
}
