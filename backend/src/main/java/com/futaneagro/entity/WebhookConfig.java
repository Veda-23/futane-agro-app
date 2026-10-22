package com.futaneagro.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * <h1>WebhookConfig Entity (Event-Driven Outbound Webhook Subscriptions)</h1>
 * <p>
 * Maps to table {@code t_core_webhooks}. Manages HTTP callbacks triggered on critical domain lifecycle events
 * (e.g., {@code INVOICE_CREATED}, {@code PAYMENT_RECEIVED}, {@code ORDER_DISPATCHED}).
 * </p>
 *
 * <h3>Delivery & Security Guarantees:</h3>
 * <ul>
 *   <li><b>HMAC Signing:</b> Payloads are signed with {@code secretToken} for cryptographic origin verification.</li>
 *   <li><b>Fault Tolerance:</b> Automatically retries failed dispatches up to {@code retryCount} (default 3).</li>
 * </ul>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Entity
@Table(name = "t_core_webhooks")
public class WebhookConfig {

    @Id
    @Column(name = "id", length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "endpoint_url", nullable = false, length = 255)
    private String endpointUrl;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType = "INVOICE_CREATED";

    @Column(name = "secret_token", length = 100)
    private String secretToken;

    @Column(name = "retry_count")
    private Integer retryCount = 3;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "last_status_code")
    private Integer lastStatusCode = 200;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public WebhookConfig() {}

    public WebhookConfig(String name, String endpointUrl, String eventType, String secretToken) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.endpointUrl = endpointUrl;
        this.eventType = eventType;
        this.secretToken = secretToken;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getSecretToken() { return secretToken; }
    public void setSecretToken(String secretToken) { this.secretToken = secretToken; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getLastStatusCode() { return lastStatusCode; }
    public void setLastStatusCode(Integer lastStatusCode) { this.lastStatusCode = lastStatusCode; }

    public LocalDateTime getLastTriggeredAt() { return lastTriggeredAt; }
    public void setLastTriggeredAt(LocalDateTime lastTriggeredAt) { this.lastTriggeredAt = lastTriggeredAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
