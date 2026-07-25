package com.futaneagro.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id:rzp_test_TH443X2Dj8owEO}")
    private String keyId;

    @Value("${razorpay.key.secret:tS4jbsDbF38zWFE8p7f7Qvxc}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        String effectiveKey = "rzp_test_TH443X2Dj8owEO";
        String effectiveSecret = "tS4jbsDbF38zWFE8p7f7Qvxc";

        if (keyId != null && keyId.startsWith("rzp_") && keySecret != null && !keySecret.trim().isEmpty()) {
            effectiveKey = keyId.trim();
            effectiveSecret = keySecret.trim();
        }
        
        System.out.println("💳 Initializing RazorpayClient with Key: " + effectiveKey);
        return new RazorpayClient(effectiveKey, effectiveSecret);
    }
}
