package com.futaneagro.repository;

import com.futaneagro.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {
    Optional<FeatureFlag> findByModuleKey(String moduleKey);
}
