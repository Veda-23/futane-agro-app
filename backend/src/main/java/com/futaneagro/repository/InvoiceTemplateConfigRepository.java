package com.futaneagro.repository;

import com.futaneagro.entity.InvoiceTemplateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * <h1>InvoiceTemplateConfig Repository (Tax Invoice Layout & Typography Engine)</h1>
 * <p>
 * Spring Data JPA repository for the {@link InvoiceTemplateConfig} entity.
 * Retrieves custom thermal and PDF layout configurations, business headers, color palettes,
 * and terms & conditions templates applied across generated GST invoices.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface InvoiceTemplateConfigRepository extends JpaRepository<InvoiceTemplateConfig, String> {
    Optional<InvoiceTemplateConfig> findFirstByOrderByCreatedAtAsc();
}
