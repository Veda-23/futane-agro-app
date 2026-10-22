package com.futaneagro.entity;

import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * <h1>NotificationTemplate Entity (Multi-Channel Alerts & Indian TRAI DLT Templates)</h1>
 * <p>
 * Maps to table {@code t_cfg_notification_templates}. Configures automated customer and staff notification messages
 * across WhatsApp, SMS, and Email channels.
 * </p>
 *
 * <h3>Key Features:</h3>
 * <ul>
 *   <li><b>Telecom Compliance:</b> Stores Indian Telecom Regulatory Authority (TRAI) Distributed Ledger Technology
 *       ({@code dltTemplateId}) registration identifiers for transactional SMS delivery compliance.</li>
 *   <li><b>Event Routing:</b> Triggers on events such as {@code INVOICE_DISPATCHED}, {@code PAYMENT_REMINDER}, and {@code LOW_STOCK_ALERT}.</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_cfg_notification_templates")
public class NotificationTemplate {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false, length = 36)
    private String id;

    @Column(nullable = false, length = 60)
    private String eventKey; // e.g. INVOICE_DISPATCHED, PAYMENT_REMINDER, ORDER_CONFIRMED, LOW_STOCK_ALERT

    @Column(nullable = false, length = 20)
    private String channel; // WHATSAPP, SMS, EMAIL

    @Column(nullable = false, length = 100)
    private String templateName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String templateText;

    @Column(nullable = false)
    private Boolean isEnabled = true;

    @Column(length = 50)
    private String dltTemplateId; // For Indian DLT registration compliance

    @Column(columnDefinition = "TEXT")
    private String samplePayloadJson;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public NotificationTemplate() {}

    public NotificationTemplate(String eventKey, String channel, String templateName, String templateText, String dltTemplateId) {
        this.eventKey = eventKey;
        this.channel = channel;
        this.templateName = templateName;
        this.templateText = templateText;
        this.dltTemplateId = dltTemplateId;
        this.isEnabled = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEventKey() { return eventKey; }
    public void setEventKey(String eventKey) { this.eventKey = eventKey; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }

    public String getTemplateText() { return templateText; }
    public void setTemplateText(String templateText) { this.templateText = templateText; }

    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }

    public String getDltTemplateId() { return dltTemplateId; }
    public void setDltTemplateId(String dltTemplateId) { this.dltTemplateId = dltTemplateId; }

    public String getSamplePayloadJson() { return samplePayloadJson; }
    public void setSamplePayloadJson(String samplePayloadJson) { this.samplePayloadJson = samplePayloadJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
