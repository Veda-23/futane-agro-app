package com.futaneagro.repository;

import com.futaneagro.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>CustomFieldValue Repository (Dynamic Attribute Value Persistence)</h1>
 * <p>
 * Spring Data JPA repository for the {@link CustomFieldValue} entity.
 * Provides query and deletion methods for managing polymorphic custom attribute values
 * associated with individual entity records.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, String> {
    List<CustomFieldValue> findByEntityNameAndEntityRecordId(String entityName, String entityRecordId);
    Optional<CustomFieldValue> findByFieldDefIdAndEntityRecordId(String fieldDefId, String entityRecordId);
    void deleteByEntityNameAndEntityRecordId(String entityName, String entityRecordId);
}
