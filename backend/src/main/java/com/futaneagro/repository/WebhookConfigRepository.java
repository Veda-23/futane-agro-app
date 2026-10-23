package com.futaneagro.repository;

import com.futaneagro.entity.WebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>WebhookConfig Repository (Event Subscription & Outbound Dispatch Endpoints)</h1>
 * <p>
 * Spring Data JPA repository for the {@link WebhookConfig} entity.
 * Provides query methods for matching active webhooks by subscribed event type (e.g. {@code INVOICE_GENERATED},
 * {@code PAYMENT_RECEIVED}) for asynchronous notification delivery.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, String> {
    List<WebhookConfig> findByEventTypeAndIsActiveTrue(String eventType);
    List<WebhookConfig> findAllByOrderByCreatedAtDesc();
}
