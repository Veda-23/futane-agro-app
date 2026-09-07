package com.futaneagro.repository;

import com.futaneagro.entity.CustomFieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomFieldDefinitionRepository extends JpaRepository<CustomFieldDefinition, String> {
    List<CustomFieldDefinition> findByEntityName(String entityName);
    Optional<CustomFieldDefinition> findByEntityNameAndFieldKey(String entityName, String fieldKey);
}
