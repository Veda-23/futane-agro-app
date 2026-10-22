package com.futaneagro.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Razorpay Payment Gateway Client Configuration.
 * <p>
 * Instantiates the primary {@link RazorpayClient} bean used for hosted payment link generation,
 * order creation, and signature validation.
 *
 * @author Futane Agro Core Architecture Team
 */
@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    /**
     * Initializes and provides the singleton {@link RazorpayClient} configured with merchant credentials.
     *
     * @return active Razorpay client instance
     * @throws RazorpayException if client initialization fails
     * @throws IllegalStateException if API keys are missing
     */
    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
            throw new IllegalStateException("Razorpay credentials are not configured! Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
        
        System.out.println("💳 Initializing RazorpayClient with Key: " + keyId.trim());
        return new RazorpayClient(keyId.trim(), keySecret.trim());
    }
}
