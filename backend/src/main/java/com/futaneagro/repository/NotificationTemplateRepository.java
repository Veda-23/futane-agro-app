package com.futaneagro.repository;

import com.futaneagro.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>NotificationTemplate Repository (SMS & WhatsApp Message Templates)</h1>
 * <p>
 * Spring Data JPA repository for the {@link NotificationTemplate} entity.
 * Provides lookup queries for message templates by business event key (e.g. {@code ORDER_DISPATCHED}, {@code PAYMENT_DUE})
 * and communication channel (e.g. {@code SMS}, {@code WHATSAPP}, {@code EMAIL}).
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    List<NotificationTemplate> findAllByOrderByCreatedAtAsc();
    Optional<NotificationTemplate> findByEventKeyAndChannel(String eventKey, String channel);
}
