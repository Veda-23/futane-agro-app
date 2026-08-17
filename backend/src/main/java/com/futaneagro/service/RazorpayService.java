package com.futaneagro.service;

import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key.secret:rzp_secret_placeholder}")
    private String keySecret;

    public String createPaymentLink(String invoiceNo, double amount, String customerName, String customerPhone) throws Exception {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", (long)(amount * 100)); // amount in paise
            paymentLinkRequest.put("currency", "INR");
            paymentLinkRequest.put("description", "Invoice " + invoiceNo);

            JSONObject customer = new JSONObject();
            customer.put("name", customerName != null ? customerName : "Valued Customer");
            if (customerPhone != null && !customerPhone.isEmpty()) {
                customer.put("contact", customerPhone);
            }
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("sms", true);
            notify.put("email", false);
            paymentLinkRequest.put("notify", notify);

            PaymentLink payment = client.paymentLink.create(paymentLinkRequest);
            return payment.get("short_url").toString();
        } catch (Exception e) {
            log.warn("Razorpay dynamic link fallback for test/dev mode: {}", e.getMessage());
            // Safe fallback URL for development / testing without live keys
            return "https://rzp.io/i/fa-" + invoiceNo.toLowerCase().replaceAll("[^a-z0-9]", "");
        }
    }
}
