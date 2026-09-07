package com.futaneagro.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String twilioPhoneNumber;

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isEmpty() && !accountSid.equals("your_twilio_sid")) {
            try {
                Twilio.init(accountSid, authToken);
                log.info("Twilio SMS client initialized successfully.");
            } catch (Exception e) {
                // SECURITY: do not log authToken or accountSid — log only the error type
                log.error("Failed to initialize Twilio client: type={}", e.getClass().getSimpleName());
            }
        } else {
            log.warn("Twilio credentials not provided. SMS delivery is disabled.");
        }
    }

    public void sendOtpSms(String toMobileNumber, String otp) {
        if (toMobileNumber == null || toMobileNumber.isEmpty()) {
            // SECURITY: do not log the mobile number
            log.warn("sendOtpSms skipped: recipient mobile number is empty");
            return;
        }

        if (accountSid == null || accountSid.isEmpty() || accountSid.equals("your_twilio_sid")) {
            log.debug("Twilio is disabled. OTP SMS delivery skipped.");
            return;
        }

        try {
            // Ensure the mobile number is in E.164 format (e.g., +919876543210)
            if (!toMobileNumber.startsWith("+")) {
                toMobileNumber = "+91" + toMobileNumber; // Default to India country code if missing
            }

            Message message = Message.creator(
                    new PhoneNumber(toMobileNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    "Your Futane Agro ERP Login OTP is: " + otp + ". Valid for 15 minutes. Do not share this code."
            ).create();

            // SECURITY: Log message SID for audit trail; do not log OTP or full mobile number
            log.info("OTP SMS sent successfully. SID={}", message.getSid());

        } catch (Exception e) {
            log.error("Failed to send OTP SMS: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    public void sendWhatsAppPaymentLink(String toMobileNumber, String message) {
        if (accountSid == null || accountSid.isEmpty() || accountSid.equals("your_twilio_sid")) {
            log.debug("Twilio disabled. WhatsApp message delivery skipped.");
            return;
        }
        if (toMobileNumber == null || toMobileNumber.isEmpty()) return;
        try {
            String whatsappTo = "whatsapp:" + (toMobileNumber.startsWith("+") ? toMobileNumber : "+91" + toMobileNumber);
            String whatsappFrom = "whatsapp:" + twilioPhoneNumber;
            Message.creator(new PhoneNumber(whatsappTo), new PhoneNumber(whatsappFrom), message).create();
            log.info("WhatsApp payment link sent successfully.");
        } catch (Exception e) {
            log.error("Failed to send WhatsApp message: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
        }
    }
}
