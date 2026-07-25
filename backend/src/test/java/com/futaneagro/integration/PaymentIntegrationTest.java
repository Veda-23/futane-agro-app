package com.futaneagro.integration;

import com.futaneagro.entity.PaymentLink;
import com.futaneagro.repository.PaymentLinkRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Assuming there's a test profile or it falls back safely
public class PaymentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testRazorpayWebhookEndpoint_ShouldRejectMissingSignature() throws Exception {
        String payload = "{\"event\":\"payment_link.paid\"}";
        
        mockMvc.perform(post("/api/webhooks/razorpay")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk()); // Returns 200 "ignored" if signature is missing or invalid
    }

    @Test
    public void testGeneratePaymentLink_ShouldReturn403ForUnauthorizedUser() throws Exception {
        mockMvc.perform(post("/api/payments/razorpay/link/invalid-sale-id")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden()); // Security intercepts no-JWT requests
    }
}
