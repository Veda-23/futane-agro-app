package com.futaneagro.repository;

import com.futaneagro.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    List<NotificationTemplate> findAllByOrderByCreatedAtAsc();
    Optional<NotificationTemplate> findByEventKeyAndChannel(String eventKey, String channel);
}
