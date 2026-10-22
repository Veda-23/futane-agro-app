package com.futaneagro.controller;

import com.futaneagro.service.PaymentLinkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * <h3>Razorpay Payment Gateway REST Controller</h3>
 * <p>
 * Manages digital customer payment collection workflows via Razorpay for commercial invoices.
 * Supports hosted payment link dispatch (WhatsApp/SMS) and in-app modal web checkout.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Hosted Payment Links:</b> Generates secure short URLs via {@link PaymentLinkService#createPaymentLink(String)}
 *       for sending directly to customers/dealers.</li>
 *   <li><b>Modal Web Checkout Orders:</b> Prepares Razorpay Order IDs ({@code order_...}) with partial or full balance.</li>
 *   <li><b>HMAC-SHA256 Signature Verification:</b> Validates standard checkout signatures before updating
 *       the sales ledger and outstanding receivable balance.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/sales")
public class PaymentLinkController {

    private static final Logger log = LoggerFactory.getLogger(PaymentLinkController.class);

    @Autowired
    private PaymentLinkService paymentLinkService;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    /**
     * <b>POST /api/sales/{saleId}/payment-link</b> - Creates a Razorpay hosted payment link.
     * <p>
     * <b>How it works:</b>
     * Calculates outstanding balance for the sale invoice, calls Razorpay API to generate a unique payment link,
     * stores the link in the database, and returns the clickable URL.
     * </p>
     * <p>
     * <b>Used for:</b> Dispatching payment requests via WhatsApp, SMS, or Email from the Sales Invoices table.
     * </p>
     *
     * @param saleId UUID of target sales invoice
     * @return 200 OK with payment link details, or 400 Bad Request on invalid invoice state
     */
    @PostMapping("/{saleId}/payment-link")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<?> createPaymentLink(@PathVariable String saleId) {
        try {
            Map<String, String> result = paymentLinkService.createPaymentLink(saleId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * <b>POST /api/sales/{saleId}/checkout/order</b> - Prepares a Razorpay Order ID for in-app modal checkout.
     * <p>
     * <b>How it works:</b>
     * Initializes a transaction with Razorpay for either the full outstanding balance or a user-specified partial amount.
     * </p>
     * <p>
     * <b>Used for:</b> Opening the Razorpay Standard Checkout popup in the Angular UI for instant UPI/card payment.
     * </p>
     *
     * @param saleId UUID of target sales invoice
     * @param requestedAmount Optional partial payment amount (defaults to full remaining amount if null)
     * @return 200 OK with Razorpay order details and currency keys
     */
    @PostMapping("/{saleId}/checkout/order")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<?> createCheckoutOrder(
            @PathVariable String saleId,
            @RequestParam(required = false) java.math.BigDecimal requestedAmount) {
        try {
            Map<String, Object> result = paymentLinkService.createStandardCheckoutOrder(saleId, requestedAmount);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * <b>POST /api/sales/checkout/verify</b> - Validates payment authenticity using cryptographic signature.
     * <p>
     * <b>Security Note:</b>
     * Computes HMAC-SHA256 signature using the secret key against {@code orderId + "|" + paymentId}.
     * If valid, updates the sales invoice's paid amount, recalculates remaining balance, and records receipt.
     * </p>
     * <p>
     * <b>Used for:</b> Web checkout completion callback from the frontend Razorpay modal handler.
     * </p>
     *
     * @param request Servlet request containing {@code razorpay_order_id}, {@code razorpay_payment_id}, and {@code razorpay_signature}
     * @return 200 OK on successful verification, or 400 Bad Request on invalid signature or missing parameters
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

