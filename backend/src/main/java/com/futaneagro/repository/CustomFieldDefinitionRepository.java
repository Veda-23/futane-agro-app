package com.futaneagro.repository;

import com.futaneagro.entity.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>CustomFieldDefinition Repository (Dynamic Schema Extension Metadata)</h1>
 * <p>
 * Spring Data JPA repository for the {@link CustomFieldDefinition} entity.
 * Provides query methods for retrieving runtime user-defined field definitions attached to standard entities
 * such as Sales, Invoices, Dispatches, and Inventory items.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, String> {
    List<CustomFieldDefinition> findByEntityName(String entityName);
    Optional<CustomFieldDefinition> findByEntityNameAndFieldKey(String entityName, String fieldKey);
}
