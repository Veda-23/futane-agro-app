package com.futaneagro.controller;

import com.futaneagro.service.PaymentLinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class PaymentLinkController {

    @Autowired
    private PaymentLinkService paymentLinkService;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    /**
     * POST /api/sales/{saleId}/payment-link
     */
    @PostMapping("/{saleId}/payment-link")
    public ResponseEntity<?> createPaymentLink(@PathVariable String saleId) {
        try {
            Map<String, String> result = paymentLinkService.createPaymentLink(saleId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create payment link: " + e.getMessage()));
        }
    }

    /**
     * POST /api/sales/{saleId}/checkout/order
     * Standard Web Checkout: Create Order
     */
    @PostMapping("/{saleId}/checkout/order")
    public ResponseEntity<?> createCheckoutOrder(
            @PathVariable String saleId,
            @RequestParam(required = false) java.math.BigDecimal requestedAmount) {
        try {
            Map<String, Object> result = paymentLinkService.createStandardCheckoutOrder(saleId, requestedAmount);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/sales/checkout/verify
     * Standard Checkout: Verify Signature (Safely reads Query Params & Form Body)
     */
    @PostMapping("/checkout/verify")
    public ResponseEntity<?> verifyCheckoutSignature(HttpServletRequest request) {
        String orderId = request.getParameter("razorpay_order_id");
        String paymentId = request.getParameter("razorpay_payment_id");
        String signature = request.getParameter("razorpay_signature");

        if (orderId == null || orderId.trim().isEmpty() || paymentId == null || paymentId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Missing razorpay_order_id or razorpay_payment_id"));
        }

        boolean isValid = paymentLinkService.verifyStandardCheckoutSignature(orderId, paymentId, signature != null ? signature : "", keySecret);
        if (isValid) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified and recorded successfully."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Invalid payment signature."));
        }
    }
}
