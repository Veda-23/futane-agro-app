package com.futaneagro.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WhatsAppCloudApiService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudApiService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.api.token:}")
    private String apiToken;

    @Value("${whatsapp.phone.number.id:}")
    private String phoneNumberId;

    public void sendInvoiceNotification(String recipientPhone, String partyName, String invoiceNo, double amount, String pdfUrl) {
        if (recipientPhone == null || recipientPhone.trim().isEmpty()) {
            return;
        }

        String cleanPhone = recipientPhone.replaceAll("[^0-9]", "");
        if (apiToken == null || apiToken.trim().isEmpty() || phoneNumberId == null || phoneNumberId.trim().isEmpty()) {
            log.info("WhatsApp Cloud API credentials not configured. Simulated dispatch to {}: Invoice {} for ₹{}", cleanPhone, invoiceNo, amount);
            return;
        }

        String url = "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        Map<String, Object> body = new HashMap<>();
        body.put("messaging_product", "whatsapp");
        body.put("to", cleanPhone);
        body.put("type", "template");

        Map<String, Object> template = new HashMap<>();
        template.put("name", "invoice_alert");
        template.put("language", Map.of("code", "en"));

        Map<String, Object> bodyComponent = new HashMap<>();
        bodyComponent.put("type", "body");
        bodyComponent.put("parameters", List.of(
            Map.of("type", "text", "text", partyName != null ? partyName : "Customer"),
            Map.of("type", "text", "text", invoiceNo != null ? invoiceNo : "INV-001"),
            Map.of("type", "text", "text", "₹" + amount)
        ));

        template.put("components", List.of(bodyComponent));
        body.put("template", template);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            restTemplate.postForEntity(url, request, String.class);
            log.info("WhatsApp invoice notification dispatched successfully to {}", cleanPhone);
        } catch (Exception ex) {
            log.error("Failed to send WhatsApp message: {}", ex.getMessage());
        }
    }
}
