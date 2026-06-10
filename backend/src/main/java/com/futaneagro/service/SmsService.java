package com.futaneagro.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class SmsService {

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
                System.out.println("✅ Twilio initialized successfully.");
            } catch (Exception e) {
                System.err.println("❌ Failed to initialize Twilio: " + e.getMessage());
            }
        } else {
            System.out.println("⚠️ Twilio credentials not provided. SMS delivery is disabled.");
        }
    }

    public void sendOtpSms(String toMobileNumber, String otp) {
        if (toMobileNumber == null || toMobileNumber.isEmpty()) {
            System.err.println("Cannot send OTP SMS: User mobile number is empty");
            return;
        }

        if (accountSid == null || accountSid.isEmpty() || accountSid.equals("your_twilio_sid")) {
            System.out.println("⚠️ Twilio is disabled. Would have sent OTP " + otp + " to " + toMobileNumber);
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

            System.out.println("✅ Sent OTP SMS to: " + toMobileNumber + " | Message SID: " + message.getSid());

        } catch (Exception e) {
            System.err.println("❌ Failed to send OTP SMS to " + toMobileNumber + ": " + e.getMessage());
        }
    }
}
