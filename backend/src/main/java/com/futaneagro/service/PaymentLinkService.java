package com.futaneagro.service;

import com.futaneagro.entity.PaymentCollection;
import com.futaneagro.entity.PaymentLink;
import com.futaneagro.entity.Sales;
import com.futaneagro.repository.PaymentCollectionRepository;
import com.futaneagro.repository.PaymentLinkRepository;
import com.futaneagro.repository.SalesRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;

/**
 * <h3>Razorpay Payment Gateway Integration Service</h3>
 * <p>
 * Orchestrates online customer receivables, payment link generation, modal checkout order creation,
 * HMAC-SHA256 signature verification, and automated ledger reconciliation for the Futane Agro ERP system.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Hosted Payment Links:</b> Generates customer-specific payment links via Razorpay API with
 *       amounts derived strictly from database state (preventing tampering).</li>
 *   <li><b>Multi-Factor Web Checkout:</b> Creates Razorpay orders for in-app standard checkout popups.</li>
 *   <li><b>Double-Idempotent Settlement:</b> Reconciles payments safely through {@link #markSaleAsPaid(String, String)},
 *       protecting against duplicate webhook events or network retries.</li>
 *   <li><b>Cryptographic Signature Verification:</b> Enforces constant-time HMAC-SHA256 validation to
 *       thwart timing attacks.</li>
 *   <li><b>Sales Ledger & Collection Registry Sync:</b> Updates invoice outstanding balances and logs
 *       corresponding entries into {@link PaymentCollection}.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@Service
public class PaymentLinkService {

    private static final Logger log = LoggerFactory.getLogger(PaymentLinkService.class);

    @Autowired(required = false)
    private RazorpayClient razorpayClient;

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private PaymentLinkRepository paymentLinkRepository;

    @Autowired
    private PaymentCollectionRepository paymentCollectionRepository;

    @Autowired(required = false)
    private SmsService smsService;

    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    /**
     * Creates a Razorpay Payment Link for the specified sales invoice.
     * <p>
     * <b>Security Invariant:</b> Amount due and customer phone number are resolved exclusively
     * from the PostgreSQL database — never accepted from untrusted caller parameters.
     * </p>
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies active Razorpay client credentials.</li>
     *   <li>Finds sale invoice by primary UUID or integer saleId.</li>
     *   <li>Validates that outstanding amount ({@code remaining}) is greater than zero.</li>
     *   <li>Converts amount to paise (1 INR = 100 paise).</li>
     *   <li>Calls Razorpay API {@code razorpayClient.paymentLink.create(...)}.</li>
     *   <li>Saves {@link PaymentLink} entity with short URL, status, and generated WhatsApp message.</li>
     * </ol>
     * </p>
     *
     * @param saleId UUID or numeric ID of the commercial sales invoice
     * @return Map containing {@code paymentLinkId}, {@code shortUrl}, {@code whatsappMessage}, and {@code amount}
     * @throws IllegalStateException If Razorpay is not configured or no balance remains
     */
    @Transactional
    public Map<String, String> createPaymentLink(String saleId) {
        if (razorpayClient == null) {
            throw new IllegalStateException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }

        Optional<Sales> saleOpt = salesRepository.findById(saleId);
        if (!saleOpt.isPresent()) {
            try {
                saleOpt = salesRepository.findBySaleId(Integer.parseInt(saleId));
            } catch (NumberFormatException ignored) {}
        }
        Sales sale = saleOpt.orElseThrow(() -> new RuntimeException("Sale not found: " + saleId));

        BigDecimal amountDue = sale.getRemaining();
        if (amountDue == null || amountDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("No outstanding amount for this sale.");
        }

        long amountPaise = amountDue.multiply(BigDecimal.valueOf(100)).longValue();

        String partyName = sale.getParty() != null ? sale.getParty().getPartyName() : "Customer";
        String mobileStr = sale.getParty() != null ? sale.getParty().getPartyContact() : null;

        try {
            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amountPaise);
            paymentLinkRequest.put("currency", "INR");
            paymentLinkRequest.put("accept_partial", false);
            paymentLinkRequest.put("description", "Payment for Sales Invoice #" + sale.getSaleId());

            JSONObject customer = new JSONObject();
            customer.put("name", partyName);
            if (mobileStr != null && !mobileStr.trim().isEmpty()) {
                String phone = mobileStr.replaceAll("[^0-9]", "");
                if (phone.length() == 10) phone = "+91" + phone;
                if (!phone.startsWith("+")) phone = "+" + phone;
                customer.put("contact", phone);
            }
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("sms", true);
            notify.put("email", false);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("reminder_enable", true);

            com.razorpay.PaymentLink link = razorpayClient.paymentLink.create(paymentLinkRequest);

            String linkId   = link.get("id").toString();
            String shortUrl = link.get("short_url").toString();
            String status   = link.get("status").toString();

            PaymentLink entity = new PaymentLink();
            entity.setSaleId(sale.getId());
            entity.setRazorpayPaymentLinkId(linkId);
            entity.setShortUrl(shortUrl);
            entity.setAmount(amountDue);
            entity.setStatus(status.toUpperCase());

            String whatsappMsg = buildWhatsAppMessage(partyName, amountDue, shortUrl, sale);
            entity.setWhatsappMessage(whatsappMsg);

            paymentLinkRepository.save(entity);

            Map<String, String> response = new HashMap<>();
            response.put("paymentLinkId", linkId);
            response.put("shortUrl", shortUrl);
            response.put("whatsappMessage", whatsappMsg);
            response.put("amount", amountDue.toPlainString());

            return response;

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay Payment Link: {}", e.getMessage(), e);
            throw new RuntimeException("Razorpay error: " + e.getMessage(), e);
        }
    }

    /**
     * Reconciles a paid invoice and settles accounts upon receiving payment confirmation.
     * <p>
     * <b>Idempotency Guarantees:</b>
     * <ol>
     *   <li>Checks {@code paymentLinkRepository.existsByRazorpayPaymentId(razorpayPaymentId)} to prevent duplicate execution.</li>
     *   <li>Verifies link entity status is not already {@code "PAID"}.</li>
     *   <li>Updates {@link Sales#getPaid()} and calculates new {@link Sales#getRemaining()}.</li>
     *   <li>Appends a new immutable settlement voucher to {@link PaymentCollection} registry.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used by:</b> {@link com.futaneagro.controller.RazorpayWebhookController} and
     * {@link #verifyStandardCheckoutSignature(String, String, String, String)}.
     * </p>
     *
     * @param razorpayPaymentLinkId Razorpay Link or Order ID
     * @param razorpayPaymentId Razorpay Payment transaction ID (e.g., "pay_...")
     */
    @Transactional
    public void markSaleAsPaid(String razorpayPaymentLinkId, String razorpayPaymentId) {
        // Idempotency check — if already processed, skip
        if (paymentLinkRepository.existsByRazorpayPaymentId(razorpayPaymentId)) {
            log.info("ℹ️  Webhook duplicate — paymentId already processed: {}", razorpayPaymentId);
            return;
        }

        Optional<PaymentLink> linkOpt = paymentLinkRepository.findByRazorpayPaymentLinkId(razorpayPaymentLinkId);
        if (!linkOpt.isPresent()) {
            log.warn("⚠️  PaymentLink not found for linkId: {}", razorpayPaymentLinkId);
            return;
        }

        PaymentLink link = linkOpt.get();
        // Idempotency check 2: Has this link already been marked PAID?
        if ("PAID".equalsIgnoreCase(link.getStatus())) {
            log.info("ℹ️  PaymentLink {} is already in PAID status — skipping duplicate credit", razorpayPaymentLinkId);
            return;
        }

        link.setRazorpayPaymentId(razorpayPaymentId);
        link.setStatus("PAID");
        paymentLinkRepository.save(link);

        // Update the Sales record — add to paid, reduce remaining
        salesRepository.findById(link.getSaleId()).ifPresent(sale -> {
            BigDecimal paidAmount = link.getAmount() != null ? link.getAmount() : BigDecimal.ZERO;
            BigDecimal currentPaid = sale.getPaid() != null ? sale.getPaid() : BigDecimal.ZERO;
            BigDecimal newPaid = currentPaid.add(paidAmount);
            sale.setPaid(newPaid);
            BigDecimal total = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
            sale.setRemaining(total.subtract(newPaid).max(BigDecimal.ZERO));
            salesRepository.save(sale);

            // Add to Payment Registry
            PaymentCollection pc = new PaymentCollection();
            pc.setParty(sale.getParty());
            pc.setInvoiceNo("RZP-" + razorpayPaymentId);
            pc.setAmountReceived(paidAmount);
            pc.setPaymentMode("Razorpay (Online)");
            pc.setPaymentDate(LocalDate.now());
            paymentCollectionRepository.save(pc);

            log.info("✅ Sale {} marked as fully paid via Razorpay payment {} and added to Payment Registry", link.getSaleId(), razorpayPaymentId);
        });
    }

    private String buildWhatsAppMessage(String partyName, BigDecimal amount, String shortUrl, Sales sale) {
        return String.format(
            "🙏 Dear %s,\n\n" +
            "Please find your payment link for Futane Agro Industries:\n\n" +
            "📦 Order: %s × %s\n" +
            "💰 Amount Due: ₹%.2f\n" +
            "🔗 Pay here: %s\n\n" +
            "This link is secure and powered by Razorpay.\n" +
            "For any queries, please contact us.\n\n" +
            "— Futane Agro Industries",
            partyName,
            sale.getQuantity(), sale.getCrateType(),
            amount,
            shortUrl
        );
    }

    /**
     * Initializes a standard in-app modal checkout order transaction with Razorpay.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Retrieves sale by primary key or numeric invoice id.</li>
     *   <li>Verifies balance due and ensures payment amount does not exceed remaining receivable.</li>
     *   <li>Calls {@code razorpayClient.orders.create(...)} setting currency to INR.</li>
     *   <li>Stores {@link PaymentLink} with status {@code "CREATED"} for reconciliation tracking.</li>
     *   <li>Returns map with {@code order_id}, {@code amount}, {@code currency}, {@code sale_id}, and public {@code key_id}.</li>
     * </ol>
     * </p>
     *
     * @param saleId Sale invoice UUID
     * @param requestedAmount Optional partial payment amount (defaults to full remaining amount if null)
     * @return Map containing transaction metadata required by Razorpay JavaScript checkout SDK
     */
    public Map<String, Object> createStandardCheckoutOrder(String saleId, BigDecimal requestedAmount) {
        if (razorpayClient == null) {
            throw new IllegalStateException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }

        Optional<Sales> saleOpt = salesRepository.findById(saleId);
        if (!saleOpt.isPresent()) {
            try {
                saleOpt = salesRepository.findBySaleId(Integer.parseInt(saleId));
            } catch (NumberFormatException ignored) {}
        }
        Sales sale = saleOpt.orElseThrow(() -> new RuntimeException("Sale not found: " + saleId));

        BigDecimal amountDue = sale.getRemaining();
        if (amountDue == null || amountDue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("No outstanding amount for this sale.");
        }
        
        BigDecimal paymentAmount = (requestedAmount != null && requestedAmount.compareTo(BigDecimal.ZERO) > 0) ? requestedAmount : amountDue;
        
        if (paymentAmount.compareTo(amountDue) > 0) {
            throw new IllegalStateException("Requested amount cannot exceed outstanding balance.");
        }

        long amountPaise = paymentAmount.multiply(BigDecimal.valueOf(100)).longValue();
        if (amountPaise < 100) {
            throw new IllegalStateException("Amount must be at least ₹1.00");
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", saleId);
            orderRequest.put("payment_capture", 1);

            String orderId;
            long amount = amountPaise;

            // Create real Razorpay order — do NOT fallback silently on failure
            com.razorpay.Order order = razorpayClient.orders.create(orderRequest);
            orderId = order.get("id").toString();
            if (order.get("amount") != null) {
                amount = ((Number) order.get("amount")).longValue();
            }

            Map<String, Object> result = new HashMap<>();
            result.put("order_id", orderId);
            result.put("amount", amount);
            result.put("currency", "INR");
            result.put("sale_id", saleId);
            result.put("key_id", keyId != null ? keyId.trim() : "");
            
            PaymentLink entity = new PaymentLink();
            entity.setSaleId(sale.getId());
            entity.setRazorpayPaymentLinkId(orderId);
            entity.setAmount(paymentAmount);
            entity.setStatus("CREATED");
            paymentLinkRepository.save(entity);

            return result;
        } catch (Exception e) {
            log.error("Failed to create Razorpay Order: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Razorpay Order: " + e.getMessage());
        }
    }

    /**
     * Verifies the cryptographic HMAC-SHA256 signature produced upon client web checkout completion.
     * <p>
     * <b>Security Note:</b>
     * Employs {@link java.security.MessageDigest#isEqual(byte[], byte[])} for constant-time
     * byte comparison to eliminate timing side-channel attacks against the secret key.
     * </p>
     *
     * @param razorpayOrderId The order ID generated on checkout start
     * @param razorpayPaymentId The transaction ID emitted by Razorpay
     * @param razorpaySignature The hexadecimal HMAC-SHA256 signature from the frontend
     * @param secret The webhook or API secret key
     * @return {@code true} if signature is cryptographically valid, {@code false} otherwise
     */
    @Transactional
    public boolean verifyStandardCheckoutSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, String secret) {
        if (razorpayOrderId == null || razorpayOrderId.trim().isEmpty() ||
            razorpayPaymentId == null || razorpayPaymentId.trim().isEmpty() ||
            razorpaySignature == null || razorpaySignature.trim().isEmpty()) {
            log.warn("Missing mandatory parameters for Razorpay signature verification.");
            return false;
        }

        String effectiveSecret = (secret != null && !secret.trim().isEmpty()) ? secret.trim() : (this.keySecret != null ? this.keySecret.trim() : "");
        if (effectiveSecret.isEmpty()) {
            log.error("RAZORPAY_KEY_SECRET is not configured — rejecting signature verification for safety.");
            return false;
        }

        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(effectiveSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            String generatedSignature = hex.toString();

            // Constant-time HMAC comparison prevents timing attacks (MessageDigest.isEqual)
            boolean isValid = java.security.MessageDigest.isEqual(
                generatedSignature.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                razorpaySignature.getBytes(java.nio.charset.StandardCharsets.UTF_8)
            );

            log.info("Razorpay signature check: orderId={} match={}", razorpayOrderId, isValid);
            if (isValid) {
                markSaleAsPaid(razorpayOrderId, razorpayPaymentId);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("Signature verification failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private void updatePaymentLinkStatus(String orderId, String paymentId) {
        markSaleAsPaid(orderId, paymentId);
    }
}
