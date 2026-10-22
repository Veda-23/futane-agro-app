package com.futaneagro.entity;

import javax.persistence.*;
import org.hibernate.annotations.Where;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * <h1>PaymentLink Entity (Razorpay Digital Payment Link & WhatsApp Gateway)</h1>
 * <p>
 * Maps to table {@code t_pay_payment_links}. Persists dynamic payment gateway payment links generated via
 * the Razorpay API for B2B invoice collection and WhatsApp settlement reminders.
 * </p>
 *
 * <h3>Key Lifecycle Attributes:</h3>
 * <ul>
 *   <li><b>Gateway ID:</b> {@code razorpayPaymentLinkId} stores the unique remote identifier from Razorpay.</li>
 *   <li><b>Short URL:</b> Provides customer-clickable link for UPI, Net Banking, and Debit/Credit Card checkout.</li>
 *   <li><b>Settlement Status:</b> Tracks states: {@code CREATED}, {@code PAID}, {@code EXPIRED}, or {@code CANCELLED}.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_pay_payment_links")
@Where(clause = "is_active = true")
public class PaymentLink {

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id = UUID.randomUUID().toString();

    @Column(name = "sale_id", nullable = false, columnDefinition = "CHAR(36)")
    private String saleId;

    @Column(name = "razorpay_payment_link_id", nullable = false, unique = true, length = 100)
    private String razorpayPaymentLinkId;

    @Column(name = "razorpay_payment_id", unique = true, length = 100)
    private String razorpayPaymentId;

    @Column(name = "short_url", nullable = false, length = 500)
    private String shortUrl;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", length = 50)
    private String status = "CREATED";

    @Column(name = "whatsapp_message", columnDefinition = "TEXT")
    private String whatsappMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters & Setters
    public String getId() { return id; }
    public String getSaleId() { return saleId; }
    public void setSaleId(String saleId) { this.saleId = saleId; }
    public String getRazorpayPaymentLinkId() { return razorpayPaymentLinkId; }
    public void setRazorpayPaymentLinkId(String razorpayPaymentLinkId) { this.razorpayPaymentLinkId = razorpayPaymentLinkId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public String getShortUrl() { return shortUrl; }
    public void setShortUrl(String shortUrl) { this.shortUrl = shortUrl; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getWhatsappMessage() { return whatsappMessage; }
    public void setWhatsappMessage(String whatsappMessage) { this.whatsappMessage = whatsappMessage; }
}
