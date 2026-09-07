package com.futaneagro.repository;

import com.futaneagro.entity.WebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, String> {
    List<WebhookConfig> findByEventTypeAndIsActiveTrue(String eventType);
    List<WebhookConfig> findAllByOrderByCreatedAtDesc();
}
