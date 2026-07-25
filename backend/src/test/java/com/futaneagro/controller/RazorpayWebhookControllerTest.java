package com.futaneagro.controller;

import com.futaneagro.service.PaymentLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class RazorpayWebhookControllerTest {

    @Mock
    private PaymentLinkService paymentLinkService;

    @InjectMocks
    private RazorpayWebhookController controller;

    private final String SECRET = "futane_webhook_2026";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(controller, "webhookSecret", SECRET);
    }

    private String generateSignature(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    @Test
    void handleWebhook_ShouldProcessValidSignature() throws Exception {
        String payload = "{\"event\":\"payment_link.paid\",\"payload\":{\"payment_link\":{\"entity\":{\"id\":\"plink_123\"}},\"payment\":{\"entity\":{\"id\":\"pay_456\"}}}}";
        String validSignature = generateSignature(payload, SECRET);

        ResponseEntity<String> response = controller.handleWebhook(validSignature, payload);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("ok", response.getBody());
        verify(paymentLinkService, times(1)).markSaleAsPaid("plink_123", "pay_456");
    }

    @Test
    void handleWebhook_ShouldRejectInvalidSignature() throws Exception {
        String payload = "{\"event\":\"payment_link.paid\",\"payload\":{\"payment_link\":{\"entity\":{\"id\":\"plink_123\"}},\"payment\":{\"entity\":{\"id\":\"pay_456\"}}}}";
        String invalidSignature = "abcdef1234567890"; // Fake

        ResponseEntity<String> response = controller.handleWebhook(invalidSignature, payload);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("ignored", response.getBody());
        verify(paymentLinkService, never()).markSaleAsPaid(any(), any());
    }
}
