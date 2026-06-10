package com.futaneagro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendOtpEmail(String toEmail, String otp, String username) {
        if (toEmail == null || toEmail.isEmpty()) {
            System.err.println("Cannot send OTP email: User email is empty");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your Login OTP - Futane Agro ERP");

            String htmlMsg = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;'>"
                    + "<h2 style='color: #4CAF50;'>Futane Agro Industries</h2>"
                    + "<p>Hello <b>" + username + "</b>,</p>"
                    + "<p>Your One-Time Password (OTP) for logging into the ERP system is:</p>"
                    + "<h1 style='background: #f4f4f4; padding: 10px; border-radius: 5px; text-align: center; letter-spacing: 5px; color: #333;'>" + otp + "</h1>"
                    + "<p>This OTP is valid for 15 minutes. Please do not share this code with anyone.</p>"
                    + "<br>"
                    + "<p style='font-size: 12px; color: #888;'>If you did not request this login, please contact the system administrator immediately.</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(message);

            System.out.println("✅ Sent OTP email to: " + toEmail);

        } catch (Exception e) {
            System.err.println("❌ Failed to send OTP email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
