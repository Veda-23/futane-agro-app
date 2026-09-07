package com.futaneagro.repository;

import com.futaneagro.entity.InvoiceTemplateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceTemplateConfigRepository extends JpaRepository<InvoiceTemplateConfig, String> {
    Optional<InvoiceTemplateConfig> findFirstByOrderByCreatedAtAsc();
}
