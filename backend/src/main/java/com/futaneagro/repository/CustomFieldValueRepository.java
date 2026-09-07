package com.futaneagro.repository;

import com.futaneagro.entity.CustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldValueRepository extends JpaRepository<CustomFieldValue, String> {
    List<CustomFieldValue> findByEntityNameAndEntityRecordId(String entityName, String entityRecordId);
    Optional<CustomFieldValue> findByFieldDefIdAndEntityRecordId(String fieldDefId, String entityRecordId);
    void deleteByEntityNameAndEntityRecordId(String entityName, String entityRecordId);
}
