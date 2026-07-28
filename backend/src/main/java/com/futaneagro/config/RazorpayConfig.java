package com.futaneagro.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
            throw new IllegalStateException("Razorpay credentials are not configured! Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
        
        System.out.println("💳 Initializing RazorpayClient with Key: " + keyId.trim());
        return new RazorpayClient(keyId.trim(), keySecret.trim());
    }
}
